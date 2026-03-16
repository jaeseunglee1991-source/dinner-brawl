const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// public 폴더를 웹에 노출 (HTML 파일 서비스용)
app.use(express.static('public'));

const rooms = {};

// --- 데이터 정의 ---
const AFFINITIES = ['SPICY', 'GREASY', 'FRESH'];
const SKILLS = [
    { name: 'CRITICAL', desc: '50% 확률로 2배 피해' },
    { name: 'LIFESTEAL', desc: '입힌 피해의 50% 회복' },
    { name: 'DOUBLE_ATTACK', desc: '30% 확률로 한 번 더 타격' },
    { name: 'SNIPER', desc: '20% 확률로 3배의 치명타 피해' },
    { name: 'BULLY', desc: '자신보다 체력이 낮은 적에게 1.5배 피해' },
    { name: 'GIANT_KILLER', desc: '자신보다 체력이 높은 적에게 1.5배 피해' },
    { name: 'FRENZY', desc: '공격할 때마다 영구적으로 공격력 +2' },
    { name: 'VAMPIRE', desc: '입힌 피해의 100%를 항상 회복' },
    { name: 'IRON_FIST', desc: '무조건 최소 10의 피해 보장' },
    { name: 'CLUMSY', desc: '30% 확률로 공격 빗나감 (피해 0)' },
    { name: 'WEAK', desc: '시작 시 최대 체력 -10' },
    { name: 'COWARD', desc: '20% 확률로 겁을 먹고 공격 포기' },
    { name: 'ALLERGY', desc: '공격할 때마다 자신도 3의 피해를 입음' },
    { name: 'SOFT_PUNCH', desc: '기본 공격력이 절반으로 깎임' },
    { name: 'NONE', desc: '아무 능력도 없습니다.' },
    { name: 'GAMBLER', desc: '피해량이 0부터 공격력의 3배 사이에서 랜덤 결정' },
    { name: 'PACIFIST', desc: '10% 확률로 적을 때리지 않고 체력을 5 채워줌' },
    { name: 'TALKATIVE', desc: '공격 시 말이 너무 많아짐' },
    { name: 'GLASS_CANNON', desc: '공격력 3배! 하지만 시작 체력이 1' },
    { name: 'KAMIKAZE', desc: '10% 확률로 자폭! 적에게 30의 피해를 주고 즉사' }
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rollStat = () => ({ hp: random(10, 20), atk: random(3, 8) });

// --- 덱 생성 ---
function generateDeck(playerName, menus) {
    let deck = [];
    const num = menus.length;

    if (num === 3) {
        menus.forEach(menu => {
            const stat = rollStat();
            deck.push({ menu, owner: playerName, hp: stat.hp, atk: stat.atk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true });
        });
    } else if (num === 2) {
        let totalHp = 0, totalAtk = 0;
        for(let i=0; i<3; i++) { const s = rollStat(); totalHp += s.hp; totalAtk += s.atk; }
        menus.forEach(menu => {
            deck.push({ menu, owner: playerName, hp: Math.floor(totalHp/2), atk: Math.floor(totalAtk/2), affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS)], isAlive: true });
        });
    } else if (num === 1) {
        let totalHp = 0, totalAtk = 0;
        for(let i=0; i<3; i++) { const s = rollStat(); totalHp += s.hp; totalAtk += s.atk; }
        deck.push({ menu: menus[0], owner: playerName, hp: totalHp, atk: totalAtk, affinity: getRandomItem(AFFINITIES), skills: [getRandomItem(SKILLS), getRandomItem(SKILLS)], isAlive: true });
    }

    // 스킬 사전 패널티 적용
    deck.forEach(card => {
        const has = (skillName) => card.skills.some(s => s.name === skillName);
        if (has('WEAK')) card.hp -= 10;
        if (has('SOFT_PUNCH')) card.atk = Math.max(1, Math.floor(card.atk / 2));
        if (has('GLASS_CANNON')) { card.atk *= 3; card.hp = 1; }
        if (card.hp <= 0) card.hp = 1;
    });

    return deck;
}

// --- 전투 로직 ---
async function runBattle(roomId) {
    const room = rooms[roomId];
    let players = room.players;
    
    const sendLog = async (msg) => {
        io.to(roomId).emit('battleLog', msg);
        await new Promise(r => setTimeout(r, 800)); // 0.8초 딜레이
    };

    await sendLog("=== ⚔️ <b>저녁 메뉴 난투를 시작합니다!</b> ⚔️ ===");
    const getAliveTeams = () => Object.values(players).filter(p => p.deck.some(c => c.isAlive));
    
    // Phase 1: 팀 간 전투
    let round = 1;
    while (getAliveTeams().length > 1) {
        await sendLog(`<br><b>--- [Round ${round}] ---</b>`);
        let allCards = getAliveTeams().flatMap(p => p.deck.filter(c => c.isAlive)).sort(() => Math.random() - 0.5);

        for (let attacker of allCards) {
            if (!attacker.isAlive) continue;
            let enemies = getAliveTeams().filter(p => p.id !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
            if (enemies.length === 0) break;

            let target = getRandomItem(enemies);
            await executeAttack(attacker, target, sendLog);
        }
        round++;
    }

    // Phase 2: 팀 내 결승전
    const winnerTeam = getAliveTeams()[0];
    if (winnerTeam) {
        await sendLog(`<br>🎉 <b>[${winnerTeam.name}] 팀의 메뉴가 우승했습니다!</b> 🎉`);
        
        let friendlyRound = 1;
        while (winnerTeam.deck.filter(c => c.isAlive).length > 1) {
            await sendLog(`<br><b>--- [팀 내 데스매치 Round ${friendlyRound}] ---</b>`);
            let aliveCards = winnerTeam.deck.filter(c => c.isAlive).sort(() => Math.random() - 0.5);
            
            for (let attacker of aliveCards) {
                if (!attacker.isAlive) continue;
                let targets = winnerTeam.deck.filter(c => c.isAlive && c.menu !== attacker.menu);
                if (targets.length === 0) break;
                await executeAttack(attacker, getRandomItem(targets), sendLog);
            }
            friendlyRound++;
        }
        const finalCard = winnerTeam.deck.find(c => c.isAlive);
        await sendLog(`<br>🏆 <b>최종 결정된 오늘 저녁 메뉴는 바로 [ ${finalCard.menu} ] 입니다!</b> 🏆`);
        io.to(roomId).emit('gameFinished', finalCard.menu);
    } else {
        await sendLog("<br>모두 전멸했습니다! (무승부 - 재경기 필요)");
    }
}

// --- 공격 처리 로직 ---
async function executeAttack(attacker, target, sendLog) {
    const has = (skillName) => attacker.skills.some(s => s.name === skillName);
    let damage = attacker.atk;
    let logMsg = `[${attacker.owner}] <b>${attacker.menu}</b> -> [${target.owner}] <b>${target.menu}</b> 공격! `;

    if (has('COWARD') && Math.random() < 0.2) return await sendLog(logMsg + "<i>(겁을 먹고 도망쳤습니다. 공격 포기)</i>");
    if (has('PACIFIST') && Math.random() < 0.1) {
        target.hp += 5;
        return await sendLog(logMsg + "<i>(평화주의자 발동! 적의 체력을 5 회복시켜줍니다 🌸)</i>");
    }
    if (has('TALKATIVE')) logMsg += "<br><i>💬 \"아니 근데 내가 어제 이걸 먹어봤는데 진짜 맛있더라고...\"</i><br>";
    if (has('CLUMSY') && Math.random() < 0.3) return await sendLog(logMsg + "<i>(발이 꼬여서 넘어졌습니다. 공격 빗나감!)</i>");
    
    if (has('KAMIKAZE') && Math.random() < 0.1) {
        attacker.hp = 0; attacker.isAlive = false; target.hp -= 30;
        await sendLog(logMsg + "<b>💥 콰쾅!! 자폭했습니다! (적에게 30 피해, 자신은 사망)</b>");
        if(target.hp <= 0) { target.isAlive = false; await sendLog(` ☠️ <b>${target.menu}</b> 동반 탈락!`); }
        return;
    }

    if (has('GAMBLER')) damage = random(0, attacker.atk * 3);
    if (has('BULLY') && target.hp < attacker.hp) damage = Math.floor(damage * 1.5);
    if (has('GIANT_KILLER') && target.hp > attacker.hp) damage = Math.floor(damage * 1.5);
    if (has('SNIPER') && Math.random() < 0.2) damage *= 3;
    else if (has('CRITICAL') && Math.random() < 0.5) damage *= 2;

    if ((attacker.affinity === 'SPICY' && target.affinity === 'GREASY') ||
        (attacker.affinity === 'GREASY' && target.affinity === 'FRESH') ||
        (attacker.affinity === 'FRESH' && target.affinity === 'SPICY')) {
        damage = Math.floor(damage * 1.5); logMsg += `<span style="color:blue">(상성 우위!)</span> `;
    }

    if (has('IRON_FIST') && damage < 10) damage = 10; 

    logMsg += `피해량: ${damage}`;
    await sendLog(logMsg);
    target.hp -= damage;

    if (has('ALLERGY')) {
        attacker.hp -= 3;
        await sendLog(` 🤧 ${attacker.menu}(은)는 알레르기 반응으로 3의 자해 피해를 입었습니다.`);
        if (attacker.hp <= 0) attacker.isAlive = false;
    }
    if (has('FRENZY') && attacker.isAlive) attacker.atk += 2;
    if (has('LIFESTEAL') && attacker.isAlive) attacker.hp += Math.floor(damage / 2);
    if (has('VAMPIRE') && attacker.isAlive) attacker.hp += damage;

    if (target.hp <= 0 && target.isAlive) {
        target.isAlive = false;
        await sendLog(` ☠️ <b>${target.menu}</b> 탈락!`);
    }

    if (has('DOUBLE_ATTACK') && attacker.isAlive && target.isAlive && Math.random() < 0.3) {
        await sendLog(` ⚡ <b>${attacker.menu}</b>의 분노의 연속 공격!`);
        target.hp -= attacker.atk;
        if (target.hp <= 0) { target.isAlive = false; await sendLog(` ☠️ <b>${target.menu}</b> 탈락!`); }
    }
}

// --- 소켓 연결 ---
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, playerName, menus }) => {
        if (!rooms[roomId]) rooms[roomId] = { master: socket.id, players: {}, state: 'waiting' };
        
        socket.join(roomId);
        rooms[roomId].players[socket.id] = { id: socket.id, name: playerName, deck: generateDeck(playerName, menus) };
        
        socket.emit('joined', { isMaster: rooms[roomId].master === socket.id });
        io.to(roomId).emit('systemLog', `🔔 ${playerName}님이 입장하여 메뉴를 제출했습니다. (현재 ${Object.keys(rooms[roomId].players).length}명)`);
    });

    socket.on('startGame', (roomId) => {
        if (rooms[roomId] && rooms[roomId].master === socket.id && rooms[roomId].state === 'waiting') {
            rooms[roomId].state = 'playing';
            runBattle(roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중... 포트: ${PORT}`));
