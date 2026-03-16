const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// --- 데이터 저장소 ---
const rooms = {};
// 계정 DB (서버 메모리 저장 방식)
const users = {
    'root': { pw: 'Skfls1223@', nickname: '시스템관리자', isAdmin: true }
};

// 1. 7대 상성 및 30종 특수기술
const AFFINITIES = ['SPICY', 'GREASY', 'FRESH', 'SALTY', 'SWEET', 'MINT_CHOCO', 'PINEAPPLE'];
const SKILLS = [
    // 🟢 버프 20개
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
    // 🔴 디버프 10개
    { name: 'CLUMSY', desc: '30% 확률로 공격 빗나감' }, { name: 'KAMIKAZE', desc: '10% 확률로 자폭 (적 30 피해, 본인 즉사)' },
    { name: 'WEAK', desc: '시작 시 최대 체력 -10' }, { name: 'SOFT_PUNCH', desc: '시작 시 기본 공격력 반토막' },
    { name: 'ALLERGY', desc: '공격할 때마다 자신도 3 피해 입음' }, { name: 'COWARD', desc: '20% 확률로 공격 포기' },
    { name: 'CURSED', desc: '받는 모든 피해가 1.5배 증가' }, { name: 'LAZY', desc: '50% 확률로 턴 건너뜀' },
    { name: 'BLIND', desc: '50% 확률로 공격 빗나감' }, { name: 'PAPER_SHIELD', desc: '받는 모든 피해 +5 증가' }
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rollStat = () => ({ hp: random(10, 25), atk: random(4, 9) });

function generateDeck(playerName, menus) {
    let deck = [];
    const num = menus.length;
    const getId = () => Math.random().toString(36).substr(2, 9);

    const applyStartStats = (card) => {
        const has = (sk) => card.skills.some(s => s.name === sk);
        if (has('TANK')) card.maxHp += 20; if (has('WEAK')) card.maxHp -= 10;
        if (has('SWORD_MASTER')) card.atk += 5; if (has('SOFT_PUNCH')) card.atk = Math.max(1, Math.floor(card.atk / 2));
        card.hp = card.maxHp; if (card.hp <= 0) { card.hp = 1; card.maxHp = 1; }
        if (has('PHOENIX')) card.revived = false;
        return card;
    };

    if (num === 3) { menus.forEach(menu => deck.push(applyStartStats({ id: getId(), menu, owner: playerName, maxHp: rollStat().hp, atk: rollStat().atk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true }))); } 
    else if (num === 2) { let tHp=0, tAtk=0; for(let i=0;i<3;i++){let s=rollStat(); tHp+=s.hp; tAtk+=s.atk;} menus.forEach(menu => deck.push(applyStartStats({ id: getId(), menu, owner: playerName, maxHp: Math.floor(tHp/2), atk: Math.floor(tAtk/2), affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true }))); } 
    else if (num === 1) { let tHp=0, tAtk=0; for(let i=0;i<3;i++){let s=rollStat(); tHp+=s.hp; tAtk+=s.atk;} deck.push(applyStartStats({ id: getId(), menu: menus[0], owner: playerName, maxHp: tHp, atk: tAtk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS), getRandomItem(SKILLS)], isAlive: true })); }
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
        if(!rooms[roomId]) return; // 도중에 방 폭파 시 중단
        io.to(roomId).emit('battleLog', `<br><b>--- [대난투 Round ${round}] ---</b>`);
        let allAliveCards = getAliveTeams().flatMap(p => p.deck.filter(c => c.isAlive));
        let attackEvents = [];

        for (let attacker of allAliveCards) {
            let enemies = getAliveTeams().filter(p => p.ownerId !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
            if (enemies.length === 0) continue;
            attackEvents.push(calculateAttack(attacker, getRandomItem(enemies), allAliveCards));
        }

        io.to(roomId).emit('playBrawlAnimation', attackEvents);

        attackEvents.forEach(ev => {
            let t = allAliveCards.find(c => c.id === ev.targetId);
            let a = allAliveCards.find(c => c.id === ev.attackerId);
            if(t && t.isAlive && ev.damage > 0) {
                t.hp -= ev.damage;
                if(t.hp <= 0) { if(t.skills.some(s=>s.name==='PHOENIX') && !t.revived) { t.hp = 1; t.revived = true; io.to(roomId).emit('battleLog', `🔥 [${t.menu}] 불사조 부활!`); } else t.isAlive = false; }
            }
            if(a && a.isAlive && ev.attackerDamage > 0) { a.hp -= ev.attackerDamage; if(a.hp <= 0) a.isAlive = false; }
            if(a && a.isAlive && ev.heal > 0) a.hp = Math.min(a.maxHp, a.hp + ev.heal);
            if(a && ev.allyHealId) { let ally = allAliveCards.find(c => c.id === ev.allyHealId); if(ally && ally.isAlive) ally.hp = Math.min(ally.maxHp, ally.hp + 5); }
        });

        broadcastState();
        await new Promise(r => setTimeout(r, 2500));
        round++;
    }

    const winnerTeam = getAliveTeams()[0];
    if (winnerTeam) {
        io.to(roomId).emit('battleLog', `<br>🎉 <b>[${winnerTeam.name}] 팀 우승! 팀 내 데스매치 시작!</b> 🎉`);
        while (winnerTeam.deck.filter(c => c.isAlive).length > 1) {
            if(!rooms[roomId]) return; // 도중 폭파
            let aliveCards = winnerTeam.deck.filter(c => c.isAlive);
            let attackEvents = [];
            for (let attacker of aliveCards) {
                let targets = aliveCards.filter(c => c.id !== attacker.id);
                if (targets.length === 0) continue;
                attackEvents.push(calculateAttack(attacker, getRandomItem(targets), aliveCards));
            }
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
    } else {
        io.to(roomId).emit('battleLog', "모두 전멸했습니다!");
    }
}

function calculateAttack(attacker, target, allAliveCards) {
    let damage = attacker.atk; let attackerDamage = 0, heal = 0, allyHealId = null;
    let msg = `[${attacker.menu}] -> [${target.menu}]`; let isCrit = false;

    const has = (card, sk) => card.skills.some(s => s.name === sk);
    const isSpec = (aff) => aff === 'MINT_CHOCO' || aff === 'PINEAPPLE';
    
    if (has(attacker, 'COWARD') && Math.random() < 0.2) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (겁먹음!)" };
    if (has(attacker, 'LAZY') && Math.random() < 0.5) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (턴 스킵)" };
    if (has(target, 'NINJA') && Math.random() < 0.3) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (회피!)" };
    if (has(target, 'GUARDIAN') && Math.random() < 0.15) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (완벽방어)" };
    if ((has(attacker, 'CLUMSY') && Math.random() < 0.3) || (has(attacker, 'BLIND') && Math.random() < 0.5)) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (빗나감!)" };

    if (isSpec(attacker.affinity) && isSpec(target.affinity) && attacker.affinity !== target.affinity) { damage = 999; attackerDamage = 999; msg += ` 💥세계관 붕괴💥`; } 
    else if (isSpec(attacker.affinity) && !isSpec(target.affinity)) { damage *= 2; msg += ` (특수 압도)`; } 
    else { const basicWin = { 'SPICY':'GREASY', 'GREASY':'FRESH', 'FRESH':'SALTY', 'SALTY':'SWEET', 'SWEET':'SPICY' }; if (basicWin[attacker.affinity] === target.affinity) { damage = Math.floor(damage * 1.5); msg += ` (상성 우위)`; } }

    if (has(attacker, 'BERSERKER') && attacker.hp <= attacker.maxHp / 2) damage *= 2;
    if (has(attacker, 'BULLY') && target.hp < attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'GIANT_KILLER') && target.hp > attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'MAGICIAN') && Math.random() < 0.2) { damage = 20; msg += ` (마법 피해)`; }
    if (has(attacker, 'LUCKY') && Math.random() < 0.77) damage += 7;
    if (has(attacker, 'SNIPER') && Math.random() < 0.2) { damage *= 3; isCrit = true; } else if (has(attacker, 'CRITICAL') && Math.random() < 0.5) { damage *= 2; isCrit = true; }
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
    
    if (has(attacker, 'HEALER')) { let allies = allAliveCards.filter(c => c.owner === attacker.owner && c.id !== attacker.id); if(allies.length > 0) allyHealId = getRandomItem(allies).id; }
    if (has(attacker, 'DOUBLE_ATTACK') && Math.random() < 0.3) damage *= 2;

    io.to(attacker.roomId).emit('battleLog', msg + ` [피해: ${damage}]`);
    return { attackerId: attacker.id, targetId: target.id, damage, attackerDamage, heal, allyHealId, isCrit, msg };
}

io.on('connection', (socket) => {
    
    // --- 계정 및 인증 시스템 ---
    socket.on('register', ({ id, pw, nickname }) => {
        if(users[id]) return socket.emit('errorMsg', '이미 존재하는 ID입니다.');
        users[id] = { pw, nickname, isAdmin: false };
        socket.emit('authSuccess', '회원가입이 완료되었습니다. 이제 로그인해주세요.');
    });

    socket.on('login', ({ id, pw }) => {
        const user = users[id];
        if(!user || user.pw !== pw) return socket.emit('errorMsg', 'ID 또는 비밀번호가 틀렸습니다.');
        
        socket.userId = id;
        socket.nickname = user.nickname;
        socket.isAdmin = user.isAdmin;
        socket.emit('loginSuccess', { userId: id, nickname: user.nickname, isAdmin: user.isAdmin });
        socket.emit('updateRoomList', getRoomList()); // 로그인 성공 시 방 목록 전송
    });

    // --- 방 관리 ---
    socket.on('createRoom', ({ roomName, password, menus }) => {
        if(!socket.userId) return socket.emit('errorMsg', '로그인이 필요합니다.');
        const roomId = Math.random().toString(36).substr(2, 6);
        // master를 socket.id가 아닌 고유 userId로 지정
        rooms[roomId] = { name: roomName, password: password, master: socket.userId, players: {}, state: 'waiting' };
        
        socket.join(roomId);
        let deck = generateDeck(socket.nickname, menus);
        deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
        rooms[roomId].players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
        
        socket.emit('joined', { roomId, isMaster: true });
        io.to(roomId).emit('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master });
        io.emit('updateRoomList', getRoomList());
    });

    socket.on('joinRoom', ({ roomId, password, menus }) => {
        if(!socket.userId) return socket.emit('errorMsg', '로그인이 필요합니다.');
        const room = rooms[roomId];
        if (!room) return socket.emit('errorMsg', '삭제되거나 존재하지 않는 방입니다.');
        if (room.state !== 'waiting') return socket.emit('errorMsg', '이미 게임이 시작되었습니다.');
        if (room.password && room.password !== password) return socket.emit('errorMsg', '비밀번호가 틀렸습니다.');

        socket.join(roomId);
        let deck = generateDeck(socket.nickname, menus);
        deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
        room.players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
        
        socket.emit('joined', { roomId, isMaster: room.master === socket.userId });
        io.to(roomId).emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
        io.to(roomId).emit('chatMessage', { sender: 'System', text: `${socket.nickname}님이 입장했습니다.` });
        io.emit('updateRoomList', getRoomList());
    });

    // --- 방 폭파 권한 로직 ---
    socket.on('deleteRoom', (roomId) => {
        const room = rooms[roomId];
        if(room) {
            // 어드민이거나, 이 방의 방장(master)인 경우만 폭파 가능
            if(socket.isAdmin || room.master === socket.userId) {
                let kicker = socket.isAdmin ? '관리자' : '방장';
                io.to(roomId).emit('kicked', `🚨 ${kicker}에 의해 방이 폭파되었습니다!`);
                delete rooms[roomId];
                io.emit('updateRoomList', getRoomList());
            } else {
                socket.emit('errorMsg', '방 폭파 권한이 없습니다.');
            }
        }
    });

    // 기타
    socket.on('chatMessage', (data) => io.to(data.roomId).emit('chatMessage', { sender: data.sender, text: data.text }));
    socket.on('startGame', (roomId) => {
        if (rooms[roomId] && rooms[roomId].master === socket.userId) {
            rooms[roomId].state = 'playing';
            io.emit('updateRoomList', getRoomList());
            runBattle(roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중... 포트: ${PORT}`));
