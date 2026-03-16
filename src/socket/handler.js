// src/socket/handler.js
const { generateDeck, calculateAttack, getRandomItem } = require('../game/battle');

module.exports = function(io, pool, rooms) {

    const getRoomList = () => {
        return Object.keys(rooms).map(id => ({
            id: id, name: rooms[id].name, hasPassword: !!rooms[id].password, players: Object.keys(rooms[id].players).length, state: rooms[id].state
        }));
    };

    // 데미지 처리 및 부활 로직을 별도 함수로 분리 (중복 방지)
    function applyDamageEvents(roomId, attackEvents, allAliveCards) {
        attackEvents.forEach(ev => {
            let t = allAliveCards.find(c => c.id === ev.targetId); 
            let a = allAliveCards.find(c => c.id === ev.attackerId);
            
            if(t && t.isAlive && ev.damage > 0) {
                t.hp -= ev.damage;
                if(t.hp <= 0) { 
                    if(t.skills.some(s=>s.name==='PHOENIX') && !t.revived) { 
                        t.hp = 1; t.revived = true; 
                        io.to(roomId).emit('battleLog', `🔥 [${t.menu}] 불사조 부활!`); 
                    } else {
                        t.isAlive = false; 
                    }
                }
            }
            if(a && a.isAlive && ev.attackerDamage > 0) { 
                a.hp -= ev.attackerDamage; 
                if(a.hp <= 0) a.isAlive = false; 
            }
            if(a && a.isAlive && ev.heal > 0) {
                a.hp = Math.min(a.maxHp, a.hp + ev.heal);
            }
            if(a && ev.allyHealId) { 
                let ally = allAliveCards.find(c => c.id === ev.allyHealId); 
                if(ally && ally.isAlive) ally.hp = Math.min(ally.maxHp, ally.hp + 5); 
            }
        });
    }

    // ⚔️ 실시간 전투 메인 엔진
    function runBattle(roomId) {
        const room = rooms[roomId]; if(!room) return;
        let players = room.players;
        const broadcastState = () => io.to(roomId).emit('updatePlayers', { players: Object.values(rooms[roomId].players), masterId: rooms[roomId].master });
        io.to(roomId).emit('battleLog', "=== ⚔️ <b>실시간 대난투를 시작합니다!</b> ⚔️ ===");
        
        const getAliveTeams = () => Object.values(players).filter(p => p.deck.some(c => c.isAlive));

        // 모든 카드에 고유 공격 속도(쿨다운) 부여
        Object.values(players).forEach(p => {
            p.deck.forEach(c => {
                // 직업에 따른 공격 속도 차이 (ms 단위)
                c.maxCooldown = (c.job === '도적' || c.job === '암살자') ? 1200 : 
                                (c.job === '전사' || c.job === '버서커') ? 1800 : 2200;
                
                // 첫 공격 타이밍 분산 (0.5초 ~ 1.5초 사이)
                c.cooldown = Math.random() * 1000 + 500; 
            });
        });

        const tickRate = 100; // 0.1초마다 서버가 전장 상태를 체크합니다.
        
        // 턴제(while+sleep) 대신 실시간(setInterval) 엔진 가동
        const battleLoop = setInterval(() => {
            if(!rooms[roomId]) return clearInterval(battleLoop);

            let aliveTeams = getAliveTeams();
            if (aliveTeams.length <= 1) {
                clearInterval(battleLoop);
                const winnerTeam = aliveTeams[0];
                if (winnerTeam) {
                    io.to(roomId).emit('battleLog', `<div style="color:#3498db; font-weight:bold; margin-top:10px;">🎉 [${winnerTeam.name}] 팀 우승! 팀 내 데스매치 시작! 🎉</div>`);
                    startDeathMatch(roomId, winnerTeam, broadcastState);
                } else {
                    io.to(roomId).emit('battleLog', "모두 전멸했습니다!");
                }
                return;
            }

            let allAliveCards = aliveTeams.flatMap(p => p.deck.filter(c => c.isAlive));
            let attackEvents = [];

            // 각 카드별 쿨다운 실시간 감소 및 공격 트리거
            for (let attacker of allAliveCards) {
                attacker.cooldown -= tickRate;
                
                // 쿨다운이 다 찬 캐릭터만 공격 실행
                if (attacker.cooldown <= 0) {
                    let enemies = aliveTeams.filter(p => p.ownerId !== attacker.ownerId).flatMap(p => p.deck.filter(c => c.isAlive));
                    if (enemies.length > 0) {
                        let target = getRandomItem(enemies);
                        attackEvents.push(calculateAttack(attacker, target, allAliveCards, io));
                        
                        // 공격 후 쿨다운 재설정 (약간의 랜덤 오차를 줘서 기계적인 느낌 제거)
                        attacker.cooldown = attacker.maxCooldown + (Math.random() * 400 - 200);
                    }
                }
            }

            // 이번 0.1초 동안 발생한 모든 공격을 클라이언트로 전송
            if (attackEvents.length > 0) {
                io.to(roomId).emit('playBrawlAnimation', attackEvents);
                applyDamageEvents(roomId, attackEvents, allAliveCards);
                broadcastState();
            }

        }, tickRate);
    }

    // ⚔️ 실시간 팀 내 데스매치 엔진
    function startDeathMatch(roomId, winnerTeam, broadcastState) {
        const tickRate = 100;
        
        const dmLoop = setInterval(() => {
            if(!rooms[roomId]) return clearInterval(dmLoop);

            let aliveCards = winnerTeam.deck.filter(c => c.isAlive);
            if (aliveCards.length <= 1) {
                clearInterval(dmLoop);
                const finalCard = aliveCards[0];
                if(finalCard) io.to(roomId).emit('gameFinished', finalCard.menu);
                else io.to(roomId).emit('battleLog', "모두 전멸했습니다!");
                return;
            }

            let attackEvents = [];
            for (let attacker of aliveCards) {
                attacker.cooldown -= tickRate;
                if (attacker.cooldown <= 0) {
                    let targets = aliveCards.filter(c => c.id !== attacker.id);
                    if (targets.length > 0) {
                        let target = getRandomItem(targets);
                        attackEvents.push(calculateAttack(attacker, target, aliveCards, io));
                        attacker.cooldown = attacker.maxCooldown + (Math.random() * 400 - 200);
                    }
                }
            }

            if (attackEvents.length > 0) {
                io.to(roomId).emit('playBrawlAnimation', attackEvents);
                applyDamageEvents(roomId, attackEvents, aliveCards);
                broadcastState();
            }

        }, tickRate);
    }

    // ==========================================
    // 소켓 통신 기본 이벤트 (기존과 동일)
    // ==========================================
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
};
