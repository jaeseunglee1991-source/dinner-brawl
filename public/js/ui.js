// public/js/ui.js

function showScreen(id) {
    document.querySelectorAll('.screen, #screen-game').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'screen-game') { setTimeout(() => window.dispatchEvent(new Event('resize')), 100); }
}

function toggleRightPanel() {
    const rp = document.getElementById('rightPanel');
    rp.classList.toggle('minimized');
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
}

function openDict(type) {
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    if(type === 'job') {
        title.innerText = "🛡️ 직업 도감";
        body.innerHTML = `
            <b>[전사]</b> 검과 방패. 안정적인 공방 (HP+10, ATK+2)<br>
            <b>[도적]</b> 단검과 활. 빠른 스피드 (ATK+3)<br>
            <b>[사제]</b> 메이스. 마력이 높음 (HP+5, MP 80)<br>
            <b>[버서커]</b> 쌍도끼. 체력을 깎고 극딜 (HP-10, ATK+8)<br>
            <b>[암살자]</b> 표창과 마스크. 은밀한 일격 (HP-5, ATK+6)<br>
            <b>[마법사]</b> 강력한 마력통 (ATK+5, MP 100)<br>
            <b>[탱커]</b> 튼튼한 체력 (HP+30, ATK-2)<br>
            <b>[궁수]</b> 밸런스 잡힌 원거리 (HP-2, ATK+4)<br>
            <b>[팔라딘]</b> 방어와 밸런스 (HP+15, ATK+1)<br>
            <b>[요리사]</b> 식칼 마스터 (HP+10, ATK+1)
        `;
    } else if(type === 'grade') {
        title.innerText = "⭐ 등급 도감";
        body.innerHTML = `
            <span style="color:#bdc3c7">■ 일반 (Common) : 64% 출현</span><br><br>
            <span style="color:#3498db">■ 희귀 (Rare) : 20% 출현 (1.2배 스탯)</span><br><br>
            <span style="color:#9b59b6">■ 영웅 (Epic) : 10% 출현 (1.5배 스탯)</span><br><br>
            <span style="color:#f1c40f">■ 전설 (Legendary) : 5% 출현 (2.0배 스탯)</span><br><br>
            <span style="color:#e74c3c">■ 신화 (Mythic) : 1% 출현 (3.0배 스탯!)</span>
        `;
    } else if(type === 'affinity') {
        title.innerText = "🎭 상성 도감";
        body.innerHTML = `
            <b style="color:#e74c3c">매콤</b> > <b style="color:#f39c12">느끼</b> > <b style="color:#2ecc71">깔끔</b> > <b style="color:#3498db">짭짤</b> > <b style="color:#9b59b6">달콤</b> > <b style="color:#e74c3c">매콤</b><br><br>
            <b style="color:#1abc9c">⭐특수(민트초코, 파인애플):</b><br>
            - 일반 속성 공격 시 <b>2배 데미지</b><br>
            - 같은 특수 속성끼리 만나면 <b>세계관 붕괴 (즉사)</b>
        `;
    } else if(type === 'skill') {
        title.innerText = "✨ 특수기술 도감";
        body.innerHTML = `
            각 카드는 생성 시 <b>랜덤으로 1개의 특수기술</b>을 부여받습니다.<br>
            우측 <b>카드 정보 판</b>에서 자신의 카드를 클릭해 확인하세요!<br><br>
            <b>[버프 예시]</b> 크리티컬, 흡혈, 더블어택, 자이언트킬러, 럭키, 가디언 등<br>
            <b>[디버프 예시]</b> 덜렁이, 허약, 겁쟁이, 게으름, 종이방패 등
        `;
    }
    document.getElementById('infoModal').style.display = 'flex';
}

function closeModal() { document.getElementById('infoModal').style.display = 'none'; }

window.showCardDetail = function(cardId) {
    let card = null;
    playersData.forEach(p => { let found = p.deck.find(c => c.id === cardId); if(found) card = found; });
    if(!card) return;

    document.getElementById('modalTitle').innerText = `🃏 [${card.grade}] ${card.menu}`;
    document.getElementById('modalBody').innerHTML = `
        <b>• 직업 :</b> ${card.job}<br>
        <b>• 상성 :</b> ${affinityEmoji[card.affinity]} ${card.affinity}<br>
        <hr>
        <b>❤️ 체력(HP) :</b> ${card.hp} / ${card.maxHp}<br>
        <b>💧 마력(MP) :</b> ${card.mp} / ${card.maxMp}<br>
        <b>⚔️ 공격력(ATK) :</b> ${card.atk}<br>
        <hr>
        <b>✨ 특수기술 :</b> [${card.skills[0].name}]<br>
        <span style="color:#555;"> - ${card.skills[0].desc}</span>
    `;
    document.getElementById('infoModal').style.display = 'flex';
};

function toggleAuth(type) {
    document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = type === 'register' ? 'block' : 'none';
}

function doRegister() {
    let id = document.getElementById('r_id').value.trim(), pw = document.getElementById('r_pw').value.trim(), nick = document.getElementById('r_nick').value.trim();
    if(!id || !pw || !nick) return alert('모두 입력해주세요.'); socket.emit('register', { id, pw, nickname: nick });
}

function doLogin() {
    let id = document.getElementById('l_id').value.trim(), pw = document.getElementById('l_pw').value.trim();
    if(!id || !pw) return alert('ID와 PW를 입력하세요.'); socket.emit('login', { id, pw });
}

function doLogout() { if(confirm('로그아웃 하시겠습니까?')) window.location.href = window.location.pathname; }

socket.on('errorMsg', msg => alert(msg));
socket.on('authSuccess', msg => { alert(msg); toggleAuth('login'); });
socket.on('loginSuccess', data => {
    myUserId = data.userId; myNickname = data.nickname; isAdmin = data.isAdmin;
    document.getElementById('welcomeMsg').innerText = `${isAdmin ? '👑관리자' : '👤'} ${myNickname}님 환영합니다!`;
});
socket.on('kicked', msg => { alert(msg); history.replaceState(null, '', window.location.pathname); showScreen('screen-roomlist'); });

socket.on('updateRoomList', (list) => {
    const tbody = document.getElementById('roomTableBody'); tbody.innerHTML = '';
    list.forEach(room => {
        let status = room.state === 'waiting' ? '<span style="color:green;font-weight:bold;">대기중</span>' : '<span style="color:red;">게임중</span>';
        let lock = room.hasPassword ? '<span class="lock-icon">🔒</span>' : '🔓';
        let adminBtn = isAdmin ? `<button class="btn-red" style="padding:4px;font-size:12px;" onclick="event.stopPropagation(); deleteRoom('${room.id}')">폭파</button>` : '';
        tbody.innerHTML += `
            <tr ondblclick="selectRoomToJoin('${room.id}', '${room.name}', ${room.hasPassword}, '${room.state}')">
                <td>${room.name}</td><td>${status}</td><td>${room.players}/6명</td><td>${lock}</td>
                <td><button class="btn-blue" style="padding:6px;font-size:12px;" onclick="event.stopPropagation(); spectateRoom('${room.id}')">👁️ 관전</button> ${adminBtn}</td>
            </tr>`;
    });
    if (myUserId && !initialRouteHandled) {
        initialRouteHandled = true; const targetRoomId = new URLSearchParams(window.location.search).get('room');
        if (targetRoomId) { const room = list.find(r => r.id === targetRoomId); if(room) selectRoomToJoin(room.id, room.name, room.hasPassword, room.state); else { alert('존재하지 않는 방입니다.'); history.replaceState(null, '', window.location.pathname); showScreen('screen-lobby'); } }
        else showScreen('screen-lobby');
    }
});

window.selectRoomToJoin = function(id, name, hasPw, state) {
    if(state !== 'waiting') return alert('이미 진행 중인 게임방입니다. (관전 버튼을 이용하세요)');
    selectedRoomId = id; selectedRoomRequiresPw = hasPw;
    document.getElementById('j_roomTitle').innerText = `[${name}] 참가`; document.getElementById('j_roomPw').style.display = hasPw ? 'block' : 'none'; showScreen('screen-join');
};
window.spectateRoom = function(id) { socket.emit('spectateRoom', id); };
function cancelJoin() { history.replaceState(null, '', window.location.pathname); showScreen('screen-lobby'); }

function createRoom() {
    let name = document.getElementById('c_roomName').value.trim(), pw = document.getElementById('c_roomPw').value.trim();
    let menus = [document.getElementById('c_menu1').value, document.getElementById('c_menu2').value, document.getElementById('c_menu3').value].filter(m=>m.trim()!=="");
    if(!name || menus.length===0) return alert('방 제목과 메뉴를 채워주세요!'); socket.emit('createRoom', { roomName: name, password: pw, menus });
}

function joinRoom() {
    let pw = selectedRoomRequiresPw ? document.getElementById('j_roomPw').value.trim() : '';
    let menus = [document.getElementById('j_menu1').value, document.getElementById('j_menu2').value, document.getElementById('j_menu3').value].filter(m=>m.trim()!=="");
    if(menus.length===0) return alert('메뉴를 채워주세요!'); socket.emit('joinRoom', { roomId: selectedRoomId, password: pw, menus });
}

window.copyRoomLink = function() {
    navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?room=' + myRoomId)
    .then(() => alert('초대 링크가 복사되었습니다!')) .catch(() => alert('링크 복사에 실패했습니다.'));
};

window.cancelParticipation = function() { 
    if(confirm('참가를 취소하시겠습니까?')) { 
        socket.emit('cancelParticipation', myRoomId); 
        history.replaceState(null, '', window.location.pathname); 
        showScreen('screen-roomlist'); 
    } 
};
window.leaveRoomUI = function() { 
    if(confirm('방에서 나가시겠습니까?')) {
        socket.emit('cancelParticipation', myRoomId);
        history.replaceState(null, '', window.location.pathname); 
        showScreen('screen-roomlist'); 
    }
};

window.deleteRoom = function(id) { if(confirm('방을 강제 폭파하시겠습니까?')) socket.emit('deleteRoom', id); };
window.reqDeleteRoom = function() { if(confirm('내 게임 방을 해체하시겠습니까?')) socket.emit('deleteRoom', myRoomId); };

// 🛠️ 방 입장 시 잔여 데이터 완벽 클리어 로직
window.clearBattleField = function() {
    document.getElementById('logMessages').innerHTML = '';
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('cardList').innerHTML = '';
    document.getElementById('roundText').innerHTML = '대기 중...';
    document.getElementById('playerCount').innerText = '';
    document.getElementById('playerList').innerHTML = '';
    document.getElementById('replayBtn').style.display = 'none';
    
    if (typeof scene !== 'undefined' && scene) {
        Object.values(meshMap).forEach(mesh => scene.remove(mesh));
    }
    entities = {}; 
    meshMap = {};
    
    isReplaying = false;
    if(typeof replayTimeouts !== 'undefined') {
        replayTimeouts.forEach(clearTimeout);
        replayTimeouts = [];
    }
};

window.handleUIUpdatePlayers = function(data) {
    playersData = data.players;
    document.getElementById('playerCount').innerText = `참가자: ${playersData.length}명`;
    document.getElementById('playerList').innerHTML = playersData.map(p => `<span style="margin-right:8px;">${p.ownerId === data.masterId ? "👑" : "👤"}${p.name}</span>`).join('');

    const cardList = document.getElementById('cardList'); cardList.innerHTML = '';
    playersData.forEach(p => {
        p.deck.forEach(c => {
            cardList.innerHTML += `
                <div class="card-item ${c.isAlive ? '' : 'dead'}" style="border-left-color: ${c.gradeColor};" onclick="showCardDetail('${c.id}')">
                    <b style="color:${c.gradeColor}">[${c.grade}]</b> <b>${c.menu}</b> <span style="font-size:11px;color:#888;">(${p.name})</span><br>
                    직업: ${c.job} | HP: ${c.hp}/${c.maxHp} | MP: ${c.mp}
                </div>`;
        });
    });
};

window.handleBattleLog = function(htmlMsg) {
    const logBox = document.getElementById('logMessages');
    logBox.innerHTML += `<div>${htmlMsg}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
    document.getElementById('roundText').innerHTML = "전투 진행 중...";
};

window.handleGameFinished = function(menu) {
    document.getElementById('roundText').innerHTML = `🎉 최종 우승: [ ${menu} ] 🎉`;
    const logBox = document.getElementById('logMessages');
    logBox.innerHTML += `<div style="color:gold; font-size:16px; font-weight:bold; margin-top:10px;">🏆 게임 종료! 최종 우승 메뉴: ${menu} 🏆</div>`;
    logBox.scrollTop = logBox.scrollHeight;
    document.getElementById('replayBtn').style.display = 'block'; 
};

socket.on('updatePlayers', data => { if(!isReplaying) handleUIUpdatePlayers(data); });
socket.on('battleLog', data => { if(!isReplaying) handleBattleLog(data); });
socket.on('gameFinished', data => { if(!isReplaying) handleGameFinished(data); });

socket.on('joined', (data) => {
    myRoomId = data.roomId; history.pushState(null, '', '?room=' + data.roomId);
    
    // 🛠️ 방 입장 시 잔상 클리어 함수 호출
    clearBattleField(); 

    document.getElementById('startBtn').style.display = (data.isMaster && data.state === 'waiting') ? 'block' : 'none';
    document.getElementById('deleteBtn').style.display = data.isMaster ? 'block' : 'none'; 
    document.getElementById('copyLinkBtn').style.display = 'block'; document.getElementById('leaveBtn').style.display = 'block'; 
    document.getElementById('cancelBtn').style.display = (!data.isSpectator && data.state === 'waiting') ? 'block' : 'none';
    
    if (data.isSpectator && data.state !== 'waiting') {
        document.getElementById('replayBtn').style.display = 'block';
    }
    showScreen('screen-game');
});

window.sendChat = function() {
    const input = document.getElementById('chatInput');
    if(input.value.trim() !== '') socket.emit('chatMessage', { roomId: myRoomId, sender: myNickname, text: input.value });
    input.value = '';
}
socket.on('chatMessage', (data) => {
    const chatBox = document.getElementById('chatMessages');
    let color = data.sender === 'System' ? 'color: #e74c3c;' : 'color: #2980b9; font-weight: bold;';
    chatBox.innerHTML += `<div style="margin-bottom: 5px;"><span style="${color}">${data.sender}:</span> ${data.text}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});

window.startGame = function() { 
    socket.emit('startGame', myRoomId);
    document.getElementById('startBtn').style.display = 'none'; document.getElementById('copyLinkBtn').style.display = 'none'; document.getElementById('cancelBtn').style.display = 'none'; 
}

window.requestReplay = function() {
    socket.emit('requestReplay', myRoomId);
};

socket.on('startReplay', (replayData) => {
    alert('📼 리플레이 재생을 시작합니다!');
    clearBattleField(); 
    isReplaying = true;

    const initialData = { players: replayData.initialPlayers, masterId: replayData.masterId };
    handleUIUpdatePlayers(initialData);
    handle3DUpdatePlayers(initialData);

    replayData.history.forEach(item => {
        let tid = setTimeout(() => {
            if(item.event === 'updatePlayers') { handleUIUpdatePlayers(item.data); handle3DUpdatePlayers(item.data); }
            if(item.event === 'playBrawlAnimation') handlePlayBrawlAnimation(item.data);
            if(item.event === 'battleLog') handleBattleLog(item.data);
            if(item.event === 'gameFinished') { handleGameFinished(item.data); isReplaying = false; }
        }, item.time);
        replayTimeouts.push(tid);
    });
});
