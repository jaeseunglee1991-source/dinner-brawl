// public/js/engine3d.js

// 3D 캐릭터 위치 및 상태 업데이트 분리
window.handle3DUpdatePlayers = function(data) {
    if (window.myRoomId && window.myRoomId !== currentThemeRoom) {
        currentThemeRoom = window.myRoomId; buildEnvironment(window.myRoomId);
    }
    
    data.players.forEach(p => {
        p.deck.forEach(c => {
            if(!entities[c.id]) {
                entities[c.id] = { 
                    id: c.id, menu: c.menu, job: c.job, isAlive: c.isAlive, color: c.gradeColor, 
                    x: (Math.random() - 0.5) * 24, z: (Math.random() - 0.5) * 20  
                };
                entities[c.id].baseX = entities[c.id].x; entities[c.id].baseZ = entities[c.id].z;
            } else { entities[c.id].isAlive = c.isAlive; }
        });
    });
};

// 공격 모션 및 데미지 텍스트 팝업 분리
window.handlePlayBrawlAnimation = function(attackEvents) {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            attacker.targetX = target.x; attacker.targetZ = target.z; 
            
            setTimeout(() => {
                let text = ev.damage >= 9999 ? "💥즉사!" : (ev.damage === 0 ? "빗나감" : `-${ev.damage}`);
                let color = ev.isCrit ? "#ff4757" : (ev.damage >= 9999 ? "#ff7f50" : "#ffffff");
                if(meshMap[ev.targetId]) {
                    showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
                    meshMap[ev.targetId].position.y += 0.8;
                    setTimeout(() => meshMap[ev.targetId].position.y -= 0.8, 150);
                }
                attacker.targetX = attacker.baseX; attacker.targetZ = attacker.baseZ; 
            }, 300); 
        }
    });
};

// 실시간 소켓 (리플레이 재생 중이 아닐 때만)
socket.on('updatePlayers', data => { if(!isReplaying) handle3DUpdatePlayers(data); });
socket.on('playBrawlAnimation', data => { if(!isReplaying) handlePlayBrawlAnimation(data); });

function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!scene || !camera || !renderer) return;

    const time = Date.now() * 0.003;

    Object.values(entities).forEach(e => {
        if(!e.isAlive) {
            if(meshMap[e.id]) { scene.remove(meshMap[e.id]); delete meshMap[e.id]; }
            return;
        }

        if(!meshMap[e.id]) {
            const charModel = createDetailedCharacter(e.job, e.color);
            scene.add(charModel); meshMap[e.id] = charModel;
        }

        let mesh = meshMap[e.id];
        
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.2;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * 0.2;
        
        let jumpY = Math.abs(Math.sin(time * 3 + e.x)) * 0.4;
        mesh.position.set(e.x, jumpY, e.z);
        
        if (Math.abs(e.targetX - e.baseX) > 1 || Math.abs(e.targetZ - e.baseZ) > 1) {
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
        } else {
            mesh.rotation.y = Math.sin(time * 0.5 + e.z) * 0.1; 
        }
    });
    
    renderer.render(scene, camera);
}
gameLoop();
