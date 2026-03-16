const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

// 1. 특성 7개 (기본 5개 + 특수 2개)
const AFFINITIES = ['SPICY', 'GREASY', 'FRESH', 'SALTY', 'SWEET', 'MINT_CHOCO', 'PINEAPPLE'];
const SKILLS = [
    { name: 'CRITICAL', desc: '50% 확률로 2배 피해' },
    { name: 'LIFESTEAL', desc: '입힌 피해의 50% 회복' },
    { name: 'DOUBLE_ATTACK', desc: '30% 확률로 한 번 더 타격' },
    { name: 'GIANT_KILLER', desc: '체력 높은 적에게 1.5배 피해' },
    { name: 'FRENZY', desc: '공격할 때마다 영구적으로 공격력 +2' },
    { name: 'CLUMSY', desc: '30% 확률로 공격 빗나감' },
    { name: 'NONE', desc: '아무 능력도 없습니다.' },
    { name: 'KAMIKAZE', desc: '10% 확률로 자폭 (적 30 피해, 본인 즉사)' }
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rollStat = () => ({ hp: random(10, 25), atk: random(4, 9) });

function generateDeck(playerName, menus) {
    let deck = [];
    const num = menus.length;

    // 카드의 고유 ID 부여 (2D 애니메이션 추적용)
    const getId = () => Math.random().toString(36).substr(2, 9);

    if (num === 3) {
        menus.forEach(menu => {
            const stat = rollStat();
            deck.push({ id: getId(), menu, owner: playerName, hp: stat.hp, maxHp: stat.hp, atk: stat.atk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true });
        });
    } else if (num === 2) {
        let totalHp = 0, totalAtk = 0;
        for(let i=0; i<3; i++) { const s = rollStat(); totalHp += s.hp; totalAtk += s.atk; }
        menus.forEach(menu => {
            let hp = Math.floor(totalHp/2);
            deck.push({ id: getId(), menu, owner: playerName, hp: hp, maxHp: hp, atk: Math.floor(totalAtk/2), affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true });
        });
    } else if (num === 1) {
        let totalHp = 0, totalAtk = 0;
        for(let i=0; i<3; i++) { const s = rollStat(); totalHp += s.hp; totalAtk += s.atk; }
        deck.push({ id: getId(), menu: menus[0], owner: playerName, hp: totalHp, maxHp: totalHp, atk: totalAtk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS), getRandomItem(SKILLS)], isAlive: true });
    }
    return deck;
}

async function runBattle(roomId) {
    const room = rooms[roomId];
    let players = room.players;
    
    const broadcastState = () => io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));

    io.to(roomId).emit('battleLog', "=== ⚔️ <b>저녁 메뉴 대난투를 시작합니다!</b> ⚔️ ===");
    const getAliveTeams = () => Object.values(players).filter(p => p.deck.some(c => c.isAlive));
    
    let round = 1;
    while (getAliveTeams().length > 1) {
        io.to(roomId).emit('battleLog', `<br><b>--- [대난투 Round ${round}] ---</b>`);
        
        let allAliveCards = getAliveTeams().flatMap(p => p.deck.filter(c => c.isAlive));
        let attackEvents = []; // 2D 애니메이션을 위한 공격 이벤트 모음

        // 1. 살아있는 모든 카드가 타겟을 정하고 데미지를 계산 (동시 처리)
        for (let attacker of allAliveCards) {
            let enemies = getAliveTeams().filter(p => p.id !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
            if (enemies.length === 0) continue;
            
            let target = getRandomItem(enemies);
            let result = calculateAttack(attacker, target);
            attackEvents.push(result);
        }

        // 2. 클라이언트에 2D 애니메이션(대쉬 및 데미지) 재생 명령 전송
        io.to(roomId).emit('playBrawlAnimation', attackEvents);

        // 3. 실제 데미지 적용 및 사망 처리
        attackEvents.forEach(ev => {
            let target = allAliveCards.find(c => c.id === ev.targetId);
            let attacker = allAliveCards.find(c => c.id === ev.attackerId);
            if(target && target.isAlive) {
                target.hp -= ev.damage;
                if(target.hp <= 0) target.isAlive = false;
            }
            if(attacker && attacker.isAlive && ev.attackerDamage > 0) {
                attacker.hp -= ev.attackerDamage; // 자해, 폭발 등
                if(attacker.hp <= 0) attacker.isAlive = false;
            }
            if(attacker && attacker.isAlive && ev.heal > 0) {
                attacker.hp += ev.heal;
                if(attacker.hp > attacker.maxHp) attacker.hp = attacker.maxHp;
            }
        });

        broadcastState();
        await new Promise(r => setTimeout(r, 2500)); // 2D 애니메이션이 끝날 때까지 2.5초 대기
        round++;
    }

    // 팀 내 결승전 (로직 동일하게 동시 타격)
    const winnerTeam = getAliveTeams()[0];
    if (winnerTeam) {
        io.to(roomId).emit('battleLog', `<br>🎉 <b>[${winnerTeam.name}] 팀 우승! 팀 내 데스매치 시작!</b> 🎉`);
        while (winnerTeam.deck.filter(c => c.isAlive).length > 1) {
            let aliveCards = winnerTeam.deck.filter(c => c.isAlive);
            let attackEvents = [];
            for (let attacker of aliveCards) {
                let targets = aliveCards.filter(c => c.id !== attacker.id);
                if (targets.length === 0) continue;
                attackEvents.push(calculateAttack(attacker, getRandomItem(targets)));
            }
            io.to(roomId).emit('playBrawlAnimation', attackEvents);
            attackEvents.forEach(ev => {
                let t = aliveCards.find(c => c.id === ev.targetId);
                let a = aliveCards.find(c => c.id === ev.attackerId);
                if(t) { t.hp -= ev.damage; if(t.hp <= 0) t.isAlive = false; }
                if(a && ev.attackerDamage > 0) { a.hp -= ev.attackerDamage; if(a.hp <= 0) a.isAlive = false; }
            });
            broadcastState();
            await new Promise(r => setTimeout(r, 2500));
        }
        const finalCard = winnerTeam.deck.find(c => c.isAlive);
        if(finalCard) io.to(roomId).emit('gameFinished', finalCard.menu);
        else io.to(roomId).emit('battleLog', "모두 전멸했습니다!");
    }
}

// 상성 및 데미지 계산 로직
function calculateAttack(attacker, target) {
    let damage = attacker.atk;
    let attackerDamage = 0;
    let heal = 0;
    let msg = `[${attacker.menu}] -> [${target.menu}]`;
    let isCrit = false;

    const has = (sk) => attacker.skills.some(s => s.name === sk);

    // 특수 특성 상호작용 (민초 vs 파인애플)
    const isSpecial = (aff) => aff === 'MINT_CHOCO' || aff === 'PINEAPPLE';
    
    if (isSpecial(attacker.affinity) && isSpecial(target.affinity) && attacker.affinity !== target.affinity) {
        // 둘이 만나면 폭발
        damage = 999;
        attackerDamage = 999;
        msg += ` 💥세계관 붕괴 폭발!!💥`;
    } else if (isSpecial(attacker.affinity) && !isSpecial(target.affinity)) {
        damage *= 2; // 특수는 일반에게 2배
        msg += ` (특수 압도!)`;
    } else {
        // 기본 상성 5각 관계 (매콤>느끼>깔끔>짭짤>달콤>매콤)
        const basicWin = { 'SPICY':'GREASY', 'GREASY':'FRESH', 'FRESH':'SALTY', 'SALTY':'SWEET', 'SWEET':'SPICY' };
        if (basicWin[attacker.affinity] === target.affinity) {
            damage = Math.floor(damage * 1.5);
            msg += ` (상성 우위)`;
        }
    }

    if (has('CRITICAL') && Math.random() < 0.5) { damage *= 2; isCrit = true; }
    if (has('CLUMSY') && Math.random() < 0.3) { damage = 0; msg += ` (빗나감!)`; }
    if (has('LIFESTEAL')) { heal = Math.floor(damage / 2); }
    if (has('KAMIKAZE') && Math.random() < 0.1) { damage += 30; attackerDamage = 999; msg += ` 자폭!`; }

    io.to(attacker.roomId).emit('battleLog', msg + ` [피해: ${damage}]`);

    return { attackerId: attacker.id, targetId: target.id, damage, attackerDamage, heal, isCrit, msg };
}

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, playerName, menus }) => {
        if (!rooms[roomId]) rooms[roomId] = { master: socket.id, players: {}, state: 'waiting' };
        socket.join(roomId);
        let deck = generateDeck(playerName, menus);
        deck.forEach(c => c.roomId = roomId);
        
        rooms[roomId].players[socket.id] = { id: socket.id, name: playerName, deck };
        
        socket.emit('joined', { isMaster: rooms[roomId].master === socket.id });
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        io.to(roomId).emit('chatMessage', { sender: 'System', text: `${playerName}님이 입장했습니다.` });
    });

    // 실시간 채팅 수신 및 브로드캐스트
    socket.on('chatMessage', (data) => {
        io.to(data.roomId).emit('chatMessage', { sender: data.sender, text: data.text });
    });

    socket.on('startGame', (roomId) => {
        if (rooms[roomId] && rooms[roomId].master === socket.id) {
            rooms[roomId].state = 'playing';
            runBattle(roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중... 포트: ${PORT}`));
