// src/socket/handler.js
const { generateDeck, calculateAttack, getRandomItem } = require('../game/battle');

module.exports = function(io, pool, rooms) {

    const getRoomList = () => Object.keys(rooms).map(id => ({ id: id, name: rooms[id].name, hasPassword: !!rooms[id].password, players: Object.keys(rooms[id].players).length, state: rooms[id].state }));

    function applyDamageEvents(roomId, attackEvents, allAliveCards, emitToRoom) {
        attackEvents.forEach(ev => {
            let t = allAliveCards.find(c => c.id === ev.targetId); 
            let a = allAliveCards.find(c => c.id === ev.attackerId);
            
            if(t && t.isAlive && ev.damage > 0) {
                t.hp -= ev.damage;
                if(t.hp <= 0) { 
                    if(t.skills.some(s=>s.name==='PHOENIX') && !t.revived) { 
                        t.hp = 1; t.revived = true; 
                        emitToRoom('battleLog', `🔥 [${t.menu}] 불사조 부활!`); 
                    } else { t.isAlive = false; }
                }
            }
            if(a && a.isAlive && ev.attackerDamage > 0) { a.hp -= ev.attackerDamage; if(a.hp <= 0) a.isAlive = false; }
            if(a && a.isAlive && ev.heal > 0) { a.hp = Math.min(a.maxHp, a.hp + ev.heal); }
            if(a && ev.allyHealId) { 
                let ally = allAliveCards.find(c => c.id === ev.allyHealId); 
                if(ally && ally.isAlive) ally.hp = Math.min(ally.maxHp, ally.hp + 20); 
            }
        });
    }

    function runBattle(roomId) {
        const room = rooms[roomId]; if(!room) return;
        let players = room.players;
        
        room.replay = [];
        room.initialPlayers = JSON.parse(JSON.stringify(Object.values(room.players)));
        const battleStartTime = Date.now();

        function emitToRoom(event, data) {
            io.to(roomId).emit(event, data);
            room.replay.push({ 
                time: Date.now() - battleStartTime, 
                event, 
                data: JSON.parse(JSON.stringify(data)) 
            });
        }

        const broadcastState = () => emitToRoom('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master });
        emitToRoom('battleLog', "=== ⚔️ <b>실시간 대난투를 시작합니다!</b> ⚔️ ===");
        
        const getAliveTeams = () => Object.values(players).filter(p => p.deck.some(c => c.isAlive));

        Object.values(players).forEach(p => {
            p.deck.forEach(c => {
                // ⭐️ 직업에 설정된 기본 공격 속도를 그대로 사용! (초기 쿨다운만 분산)
                c.cooldown = Math.random() * 800 + 200; 
            });
        });

        const tickRate = 100; 
        
        const battleLoop = setInterval(() => {
            if(!rooms[roomId]) return clearInterval(battleLoop);

            let aliveTeams = getAliveTeams();
            if (aliveTeams.length <= 1) {
                clearInterval(battleLoop);
                const winnerTeam = aliveTeams[0];
                if (winnerTeam) {
                    emitToRoom('battleLog', `<div style="color:#3498db; font-weight:bold; margin-top:10px;">🎉 [${winnerTeam.name}] 팀 우승! 팀 내 데스매치 시작! 🎉</div>`);
                    startDeathMatch(roomId, winnerTeam, broadcastState, emitToRoom, battleStartTime);
                } else {
                    emitToRoom('battleLog', "모두 전멸했습니다!");
                }
                return;
            }

            let allAliveCards = aliveTeams.flatMap(p => p.deck.filter(c => c.isAlive));
            let attackEvents = [];

            for (let attacker of allAliveCards) {
                attacker.cooldown -= tickRate;
                if (attacker.cooldown <= 0) {
                    let enemies = aliveTeams.filter(p => p.ownerId !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
                    if (enemies.length > 0) {
                        let target = getRandomItem(enemies);
                        let ev = calculateAttack(attacker, target, allAliveCards, io);
                        attackEvents.push(ev);
                        emitToRoom('battleLog', ev.msg + ` <span style="color:#e74c3c">[-${ev.damage}]</span>`);
                        attacker.cooldown = attacker.maxCooldown + (Math.random() * 200 - 100);
                    }
                }
            }

            if (attackEvents.length > 0) {
                emitToRoom('playBrawlAnimation', attackEvents);
                applyDamageEvents(roomId, attackEvents, allAliveCards, emitToRoom);
                broadcastState();
            }
        }, tickRate);
    }

    function startDeathMatch(roomId, winnerTeam, broadcastState, emitToRoom, battleStartTime) {
        const tickRate = 100;
        
        const dmLoop = setInterval(() => {
            if(!rooms[roomId]) return clearInterval(dmLoop);

            let aliveCards = winnerTeam.deck.filter(c => c.isAlive);
            if (aliveCards.length <= 1) {
                clearInterval(dmLoop);
                const finalCard = aliveCards[0];
                if(finalCard) emitToRoom('gameFinished', finalCard.menu);
                else emitToRoom('battleLog', "모두 전멸했습니다!");
                return;
            }

            let attackEvents = [];
            for (let attacker of aliveCards) {
                attacker.cooldown -= tickRate;
                if (attacker.cooldown <= 0) {
                    let targets = aliveCards.filter(c => c.id !== attacker.id);
                    if (targets.length > 0) {
                        let target = getRandomItem(targets);
                        let ev = calculateAttack(attacker, target, aliveCards, io);
                        attackEvents.push(ev);
                        emitToRoom('battleLog', ev.msg + ` <span style="color:#e74c3c">[-${ev.damage}]</span>`);
                        attacker.cooldown = attacker.maxCooldown + (Math.random() * 200 - 100);
                    }
                }
            }

            if (attackEvents.length > 0) {
                emitToRoom('playBrawlAnimation', attackEvents);
                applyDamageEvents(roomId, attackEvents, aliveCards, emitToRoom);
                broadcastState();
            }
        }, tickRate);
    }

    io.on('connection', (socket) => {
        socket.on('register', async ({ id, pw, nickname }) => { try { const res = await pool.query('SELECT id FROM users WHERE id = $1', [id]); if (res.rows.length > 0) return socket.emit('errorMsg', '이미 존재하는 ID입니다.'); await pool.query('INSERT INTO users (id, pw, nickname) VALUES ($1, $2, $3)', [id, pw, nickname]); socket.emit('authSuccess', '회원가입이 완료되었습니다.'); } catch (err) { socket.emit('errorMsg', '서버 오류'); } });
        socket.on('login', async ({ id, pw }) => { try { const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]); if (res.rows.length === 0) return socket.emit('errorMsg', '존재하지 않는 ID입니다.'); const user = res.rows[0]; if (user.pw !== pw) return socket.emit('errorMsg', '비번오류'); socket.userId = user.id; socket.nickname = user.nickname; socket.isAdmin = user.is_admin; socket.emit('loginSuccess', { userId: user.id, nickname: user.nickname, isAdmin: user.is_admin }); socket.emit('updateRoomList', getRoomList()); } catch (err) { socket.emit('errorMsg', '서버 오류'); } });
        
        socket.on('createRoom', ({ roomName, password, menus }) => {
            const roomId = Math.random().toString(36).substr(2, 6);
            rooms[roomId] = { name: roomName, password: password, master: socket.userId, players: {}, state: 'waiting' };
            socket.join(roomId); let deck = generateDeck(socket.nickname, menus); deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
            rooms[roomId].players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
            socket.emit('joined', { roomId, isMaster: true, isSpectator: false, state: 'waiting' });
            io.to(roomId).emit('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master }); io.emit('updateRoomList', getRoomList());
        });

        socket.on('joinRoom', ({ roomId, password, menus }) => {
            const room = rooms[roomId]; if(!room) return;
            socket.join(roomId); let deck = generateDeck(socket.nickname, menus); deck.forEach(c => { c.roomId = roomId; c.ownerId = socket.userId; });
            room.players[socket.userId] = { id: socket.id, ownerId: socket.userId, name: socket.nickname, deck };
            socket.emit('joined', { roomId, isMaster: room.master === socket.userId, isSpectator: false, state: room.state });
            io.to(roomId).emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
            io.to(roomId).emit('chatMessage', { sender: 'System', text: `${socket.nickname}님이 입장했습니다.` }); io.emit('updateRoomList', getRoomList());
        });

        socket.on('spectateRoom', (roomId) => {
            const room = rooms[roomId]; if(!room) return;
            socket.join(roomId);
            socket.emit('joined', { roomId, isMaster: room.master === socket.userId, isSpectator: true, state: room.state });
            socket.emit('updatePlayers', { players: Object.values(room.players), masterId: room.master });
            io.to(roomId).emit('chatMessage', { sender: 'System', text: `👁️ ${socket.nickname}님이 관전자로 입장했습니다.` });
        });

        socket.on('requestReplay', (roomId) => {
            const room = rooms[roomId];
            if (room && room.replay && room.replay.length > 0) {
                socket.emit('startReplay', { initialPlayers: room.initialPlayers, masterId: room.master, history: room.replay });
            } else {
                socket.emit('errorMsg', '아직 재생할 리플레이 데이터가 없습니다.');
            }
        });

        socket.on('cancelParticipation', (roomId) => { const room = rooms[roomId]; if (room && room.players[socket.userId]) { delete room.players[socket.userId]; socket.leave(roomId); io.to(roomId).emit('updatePlayers', { players: Object.values(room.players), masterId: room.master }); io.emit('updateRoomList', getRoomList()); } });
        socket.on('deleteRoom', (roomId) => { const room = rooms[roomId]; if(room && (socket.isAdmin || room.master === socket.userId)) { io.to(roomId).emit('kicked', `🚨 방이 폭파되었습니다!`); delete rooms[roomId]; io.emit('updateRoomList', getRoomList()); } });
        socket.on('chatMessage', (data) => io.to(data.roomId).emit('chatMessage', { sender: data.sender, text: data.text }));
        socket.on('startGame', (roomId) => { if (rooms[roomId] && rooms[roomId].master === socket.userId) { rooms[roomId].state = 'playing'; io.emit('updateRoomList', getRoomList()); runBattle(roomId); } });
    });
};
