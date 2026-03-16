const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, pw VARCHAR(100) NOT NULL, nickname VARCHAR(50) NOT NULL, is_admin BOOLEAN DEFAULT FALSE)`);
        await pool.query(`INSERT INTO users (id, pw, nickname, is_admin) VALUES ('root', 'Skfls1223@', '시스템관리자', TRUE) ON CONFLICT (id) DO NOTHING`);
        console.log("✅ PostgreSQL DB 연결 및 초기화 완료!");
    } catch (err) { console.error("❌ DB 초기화 에러:", err); }
}
initDB();

const rooms = {};

const AFFINITIES = ['SPICY', 'GREASY', 'FRESH', 'SALTY', 'SWEET', 'MINT_CHOCO', 'PINEAPPLE'];
const SKILLS = [
    { name: 'CRITICAL', desc: '50% 확률로 2배 피해' }, { name: 'LIFESTEAL', desc: '입힌 피해의 50% 회복' },
    { name: 'DOUBLE_ATTACK', desc: '30% 확률로 한 번 더 타격' }, { name: 'GIANT_KILLER', desc: '체력 높은 적에게 1.5배 피해' },
    { name: 'FRENZY', desc: '공격할 때마다 영구적으로 공격력 +2' }, { name: 'IRON_FIST', desc: '무조건 최소 10 데미지 보장' },
    { name: 'SNIPER', desc: '20% 확률로 3배의 치명타 피해' }, { name: 'VAMPIRE', desc: '입힌 피해의 100% 흡혈' },
    { name: 'BULLY', desc: '체력 낮은 적에게 1.5배 피해' }, { name: 'BERSERKER', desc: '내 체력이 50% 이하일 때 데미지 2배' },
    { name: 'TANK', desc: '시작 시 최대 체력 +20' }, { name: 'SWORD_MASTER', desc: '시작 시 기본 공격력 +5' },
    { name: 'NINJA', desc: '적의 공격을 30% 확률로 회피' }, { name: 'SHIELD', desc: '받는 모든 피해 절반 감소' },
    { name: 'HEALER', desc: '공격 시 아군 1명 체력 5 회복' }, { name: 'LUCKY', desc: '77% 확률로 +7 추가 데미지' },
    { name: 'GUARDIAN', desc: '15% 확률로 적의 공격 완벽 방어' }, { name: 'COMBO', desc: '공격할 때마다 데미지 +1 영구 증가' },
    { name: 'MAGICIAN', desc: '20% 확률로 방어무시 20 피해' }, { name: 'PHOENIX', desc: '사망 시 1회 한정 HP 1로 부활' },
    { name: 'CLUMSY', desc: '30% 확률로 공격 빗나감' }, { name: 'KAMIKAZE', desc: '10% 확률로 자폭 (적 30 피해, 본인 즉사)' },
    { name: 'WEAK', desc: '시작 시 최대 체력 -10' }, { name: 'SOFT_PUNCH', desc: '시작 시 기본 공격력 반토막' },
    { name: 'ALLERGY', desc: '공격할 때마다 자신도 3 피해 입음' }, { name: 'COWARD', desc: '20% 확률로 공격 포기' },
    { name: 'CURSED', desc: '받는 모든 피해가 1.5배 증가' }, { name: 'LAZY', desc: '50% 확률로 턴 건너뜀' },
    { name: 'BLIND', desc: '50% 확률로 공격 빗나감' }, { name: 'PAPER_SHIELD', desc: '받는 모든 피해 +5 증가' }
];

const JOBS = [
    { name: '전사', hpBonus: 10, atkBonus: 2, maxMp: 20 }, { name: '마법사', hpBonus: -5, atkBonus: 5, maxMp: 100 },
    { name: '도적', hpBonus: 0, atkBonus: 3, maxMp: 40 }, { name: '탱커', hpBonus: 30, atkBonus: -2, maxMp: 10 },
    { name: '사제', hpBonus: 5, atkBonus: 0, maxMp: 80 }, { name: '궁수', hpBonus: -2, atkBonus: 4, maxMp: 30 },
    { name: '버서커', hpBonus: -10, atkBonus: 8, maxMp: 50 }, { name: '팔라딘', hpBonus: 15, atkBonus: 1, maxMp: 40 },
    { name: '암살자', hpBonus: -5, atkBonus: 6, maxMp: 30 }, { name: '요리사', hpBonus: 10, atkBonus: 1, maxMp: 20 }
];

const GRADES = [
    { name: '일반', multi: 1.0, color: '#bdc3c7' }, { name: '희귀', multi: 1.2, color: '#3498db' },
    { name: '영웅', multi: 1.5, color: '#9b59b6' }, { name: '전설', multi: 2.0, color: '#f1c40f' },
    { name: '신화', multi: 3.0, color: '#e74c3c' }
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rollStat = () => ({ hp: random(10, 25), atk: random(4, 9) });

function generateDeck(playerName, menus) {
    let deck = [];
    const getId = () => Math.random().toString(36).substr(2, 9);
    const applyStartStats = (card) => {
        const has = (sk) => card.skills.some(s => s.name === sk);
        if (has('TANK')) card.maxHp += 20; if (has('WEAK')) card.maxHp -= 10;
        if (has('SWORD_MASTER')) card.atk += 5;
        if (has('SOFT_PUNCH')) card.atk = Math.max(1, Math.floor(card.atk / 2));
        card.hp = card.maxHp; if (card.hp <= 0) { card.hp = 1; card.maxHp = 1; }
        if (has('PHOENIX')) card.revived = false; return card;
    };

    menus.forEach(menu => {
        let job = getRandomItem(JOBS);
        let grade = getRandomItem(GRADES);
        let baseHp = rollStat().hp;
        let baseAtk = rollStat().atk;

        deck.push(applyStartStats({ 
            id: getId(), menu: menu, owner: playerName, 
            grade: grade.name, gradeColor: grade.color, job: job.name,
            maxHp: Math.floor(baseHp * grade.multi) + job.hpBonus, 
            atk: Math.floor(baseAtk * grade.multi) + job.atkBonus,
            maxMp: job.maxMp, mp: job.maxMp, affinity: getRandomItem(AFFINITIES), 
            skills: [getRandomItem(SKILLS)], isAlive: true 
        }));
    });
    return deck;
}

const getRoomList = () => {
    return Object.keys(rooms).map(id => ({
        id: id, name: rooms[id].name, hasPassword: !!rooms[id].password, players: Object.keys(rooms[id].players).length, state: rooms[id].state
    }));
};

async function runBattle(roomId) {
    const room = rooms[roomId]; if(!room) return;
    let players = room.players;
    const broadcastState = () => io.to(roomId).emit('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master });
    io.to(roomId).emit('battleLog', "=== ⚔️ <b>저녁 메뉴 대난투를 시작합니다!</b> ⚔️ ===");
    const getAliveTeams = () => Object.values(players).filter(p => p.deck.some(c => c.isAlive));
    let round = 1;
    
    while (getAliveTeams().length > 1) {
        if(!rooms[roomId]) return;
        io.to(roomId).emit('battleLog', `<div style="color:#f1c40f; font-weight:bold; margin-top:10px;">--- [대난투 Round ${round}] ---</div>`);
        let allAliveCards = getAliveTeams().flatMap(p => p.deck.filter(c => c.isAlive));
        let attackEvents = [];
        for (let attacker of allAliveCards) {
            let enemies = getAliveTeams().filter(p => p.ownerId !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
            if (enemies.length === 0) continue;
            attackEvents.push(calculateAttack(attacker, getRandomItem(enemies), allAliveCards));
        }

        io.to(roomId).emit('playBrawlAnimation', attackEvents);
        attackEvents.forEach(ev => {
            let t = allAliveCards.find(c => c.id === ev.targetId); let a = allAliveCards.find(c => c.id === ev.attackerId);
            if(t && t.isAlive && ev.damage > 0) {
                t.hp -= ev.damage;
                if(t.hp <= 0) { if(t.skills.some(s=>s.name==='PHOENIX') && !t.revived) { t.hp = 1; t.revived = true; io.to(roomId).emit('battleLog', `🔥 [${t.menu}] 불사조 부활!`); } else t.isAlive = false; }
            }
            if(a && a.isAlive && ev.attackerDamage > 0) { a.hp -= ev.attackerDamage; if(a.hp <= 0) a.isAlive = false; }
            if(a && a.isAlive && ev.heal > 0) a.hp = Math.min(a.maxHp, a.hp + ev.heal);
            if(a && ev.allyHealId) { let ally = allAliveCards.find(c => c.id === ev.allyHealId); if(ally && ally.isAlive) ally.hp = Math.min(ally.maxHp, ally.hp + 5); }
        });

        broadcastState(); await new Promise(r => setTimeout(r, 2500));
        round++;
    }

    const winnerTeam = getAliveTeams()[0];
    if (winnerTeam) {
        io.to(roomId).emit('battleLog', `<div style="color:#3498db; font-weight:bold; margin-top:10px;">🎉 [${winnerTeam.name}] 팀 우승! 팀 내 데스매치 시작! 🎉</div>`);
        while (winnerTeam.deck.filter(c => c.isAlive).length > 1) {
            if(!rooms[roomId]) return;
            let aliveCards = winnerTeam.deck.filter(c => c.isAlive); let attackEvents = [];
            for (let attacker of aliveCards) { let targets = aliveCards.filter(c => c.id !== attacker.id); if (targets.length === 0) continue;
            attackEvents.push(calculateAttack(attacker, getRandomItem(targets), aliveCards)); }
            io.to(roomId).emit('playBrawlAnimation', attackEvents);
            attackEvents.forEach(ev => {
                let t = aliveCards.find(c => c.id === ev.targetId); let a = aliveCards.find(c => c.id === ev.attackerId);
                if(t) { t.hp -= ev.damage; if(t.hp <= 0) t.isAlive = false; }
                if(a && ev.attackerDamage > 0) { a.hp -= ev.attackerDamage; if(a.hp <= 0) a.isAlive = false; }
            });
            broadcastState(); await new Promise(r => setTimeout(r, 2500));
        }
        const finalCard = winnerTeam.deck.find(c => c.isAlive);
        if(finalCard) io.to(roomId).emit('gameFinished', finalCard.menu);
        else io.to(roomId).emit('battleLog', "모두 전멸했습니다!");
    } else { io.to(roomId).emit('battleLog', "모두 전멸했습니다!"); }
}

function calculateAttack(attacker, target, allAliveCards) {
    let damage = attacker.atk;
    let attackerDamage = 0, heal = 0, allyHealId = null;
    let msg = `[${attacker.menu}] ⚔️ [${target.menu}]`; let isCrit = false;
    
    if (attacker.mp >= 5) { attacker.mp -= 5; }

    const has = (card, sk) => card.skills.some(s => s.name === sk);
    const isSpec = (aff) => aff === 'MINT_CHOCO' || aff === 'PINEAPPLE';
    
    if (has(attacker, 'COWARD') && Math.random() < 0.2) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (겁먹음!)" };
    if (has(attacker, 'LAZY') && Math.random() < 0.5) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (턴 스킵)" };
    if (has(target, 'NINJA') && Math.random() < 0.3) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (회피!)" };
    if (has(target, 'GUARDIAN') && Math.random() < 0.15) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (완벽방어)" };
    if ((has(attacker, 'CLUMSY') && Math.random() < 0.3) || (has(attacker, 'BLIND') && Math.random() < 0.5)) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (빗나감!)" };
    
    if (isSpec(attacker.affinity) && isSpec(target.affinity) && attacker.affinity !== target.affinity) { damage = 999; attackerDamage = 999; msg += ` 💥세계관 붕괴💥`;
    } 
    else if (isSpec(attacker.affinity) && !isSpec(target.affinity)) { damage *= 2; msg += ` (특수 압도)`;
    } 
    else { const basicWin = { 'SPICY':'GREASY', 'GREASY':'FRESH', 'FRESH':'SALTY', 'SALTY':'SWEET', 'SWEET':'SPICY' };
    if (basicWin[attacker.affinity] === target.affinity) { damage = Math.floor(damage * 1.5); msg += ` (상성 우위)`;
    } }

    if (has(attacker, 'BERSERKER') && attacker.hp <= attacker.maxHp / 2) damage *= 2;
    if (has(attacker, 'BULLY') && target.hp < attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'GIANT_KILLER') && target.hp > attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'MAGICIAN') && Math.random() < 0.2) { damage = 20; msg += ` (마법 피해)`; }
    if (has(attacker, 'LUCKY') && Math.random() < 0.77) damage += 7;
    if (has(attacker, 'SNIPER') && Math.random() < 0.2) { damage *= 3; isCrit = true;
    } else if (has(attacker, 'CRITICAL') && Math.random() < 0.5) { damage *= 2; isCrit = true; }
    if (has(attacker, 'IRON_FIST') && damage < 10) damage = 10;
    if (has(target, 'SHIELD')) damage = Math.floor(damage / 2);
    if (has(target, 'CURSED')) damage = Math.floor(damage * 1.5);
    if (has(target, 'PAPER_SHIELD')) damage += 5;
    
    if (has(attacker, 'LIFESTEAL')) heal = Math.floor(damage / 2);
    if (has(attacker, 'VAMPIRE')) heal = damage;
    if (has(attacker, 'KAMIKAZE') && Math.random() < 0.1) { damage += 30; attackerDamage = 999; msg += ` 자폭!`; }
    if (has(attacker, 'ALLERGY')) attackerDamage += 3;
    if (has(attacker, 'FRENZY')) attacker.atk += 2;
    if (has(attacker, 'COMBO')) attacker.atk += 1;
    
    if (has(attacker, 'HEALER')) { let allies = allAliveCards.filter(c => c.owner === attacker.owner && c.id !== attacker.id);
    if(allies.length > 0) allyHealId = getRandomItem(allies).id; }
    if (has(attacker, 'DOUBLE_ATTACK') && Math.random() < 0.3) damage *= 2;
    
    io.to(attacker.roomId).emit('battleLog', msg + ` <span style="color:#e74c3c">[-${damage}]</span>`);
    return { attackerId: attacker.id, targetId: target.id, damage, attackerDamage, heal, allyHealId, isCrit, msg };
}

io.on('connection', (socket) => {
    socket.on('register', async ({ id, pw, nickname }) => {
        try {
            const res = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
            if (res.rows.length > 0) return socket.emit('errorMsg', '이미 존재하는 ID입니다.');
            await pool.query('INSERT INTO users (id, pw, nickname) VALUES ($1, $2, $3)', [id, pw, nickname]);
            socket.emit('authSuccess', '회원가입이 완료되었습니다. 이제 로그인해주세요.');
        } catch (err) { console.error("회원가입 에러:", err); socket.emit('errorMsg', '서버(DB) 오류가 발생했습니다.'); }
    });

    socket.on('login', async ({ id, pw }) => {
        try {
            const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            if (res.rows.length === 0) return socket.emit('errorMsg', '존재하지 않는 ID입니다.');
            const user = res.rows[0];
            if (user.pw !== pw) return socket.emit('errorMsg', '비밀번호가 틀렸습니다.');
            
            socket.userId = user.id; socket.nickname = user.nickname; socket.isAdmin = user.is_admin;
            socket.emit('loginSuccess', { userId: user.id, nickname: user.nickname, isAdmin: user.is_admin });
            socket.emit('updateRoomList', getRoomList());
        } catch (err) { console.error("로그인 에러:", err); socket.emit('errorMsg', '서버(DB) 오류가 발생했습니다.'); }
    });

    socket.on('createRoom', ({ roomName, password, menus }) => {
        if(!socket.userId) return socket.emit('errorMsg', '로그인이 필요합니다.');
        const roomId = Math.random().toString(36).substr(2, 6);
        rooms[roomId] = { name: roomName, password: password, master: socket.userId, players: {}, state: 'waiting' };
        
        socket.join(roomId); let deck = generateDeck(socket.nickname, menus);
        deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
        rooms[roomId].players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
        
        socket.emit('joined', { roomId, isMaster: true, isSpectator: false, state: 'waiting' });
        io.to(roomId).emit('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master });
        io.emit('updateRoomList', getRoomList());
    });

    socket.on('joinRoom', ({ roomId, password, menus }) => {
        if(!socket.userId) return socket.emit('errorMsg', '로그인이 필요합니다.');
        const room = rooms[roomId];
        if (!room) return socket.emit('errorMsg', '삭제되거나 존재하지 않는 방입니다.');
        if (room.state !== 'waiting') return socket.emit('errorMsg', '이미 게임이 시작되었습니다.');
        if (room.password && room.password !== password) return socket.emit('errorMsg', '비밀번호가 틀렸습니다.');

        socket.join(roomId); let deck = generateDeck(socket.nickname, menus);
        deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
        room.players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
        
        socket.emit('joined', { roomId, isMaster: room.master === socket.userId, isSpectator: false, state: room.state });
        io.to(roomId).emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
        io.to(roomId).emit('chatMessage', { sender: 'System', text: `${socket.nickname}님이 입장했습니다.` });
        io.emit('updateRoomList', getRoomList());
    });

    socket.on('spectateRoom', (roomId) => {
        if(!socket.userId) return socket.emit('errorMsg', '로그인이 필요합니다.');
        const room = rooms[roomId];
        if (!room) return socket.emit('errorMsg', '삭제되거나 존재하지 않는 방입니다.');

        socket.join(roomId);
        socket.emit('joined', { roomId, isMaster: room.master === socket.userId, isSpectator: true, state: room.state });
        socket.emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
        io.to(roomId).emit('chatMessage', { sender: 'System', text: `👁️ ${socket.nickname}님이 관전자로 입장했습니다.` });
    });

    socket.on('cancelParticipation', (roomId) => {
        const room = rooms[roomId];
        if (room && room.players[socket.userId]) {
            delete room.players[socket.userId];
            socket.leave(roomId);
            io.to(roomId).emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
            io.to(roomId).emit('chatMessage', { sender: 'System', text: `🏃 ${socket.nickname}님이 참가를 취소했습니다.` });
            io.emit('updateRoomList', getRoomList());
        }
    });

    socket.on('deleteRoom', (roomId) => {
        const room = rooms[roomId];
        if(room) {
            if(socket.isAdmin || room.master === socket.userId) {
                let kicker = socket.isAdmin ? '관리자' : '방장';
                io.to(roomId).emit('kicked', `🚨 ${kicker}에 의해 방이 폭파되었습니다!`);
                delete rooms[roomId]; io.emit('updateRoomList', getRoomList());
            } else { socket.emit('errorMsg', '방 폭파 권한이 없습니다.'); }
        }
    });

    socket.on('chatMessage', (data) => io.to(data.roomId).emit('chatMessage', { sender: data.sender, text: data.text }));
    socket.on('startGame', (roomId) => {
        if (rooms[roomId] && rooms[roomId].master === socket.userId) {
            rooms[roomId].state = 'playing'; io.emit('updateRoomList', getRoomList()); runBattle(roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중... 포트: ${PORT}`));
