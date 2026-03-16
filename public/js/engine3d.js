// public/js/engine3d.js

let projectiles = [];

function clampToArena(x, z, maxRadius = 14) {
    let dist = Math.sqrt(x*x + z*z);
    if (dist > maxRadius) {
        return { x: x * (maxRadius / dist), z: z * (maxRadius / dist) };
    }
    return { x, z };
}

window.handle3DUpdatePlayers = function(data) {
    if (window.myRoomId && window.myRoomId !== currentThemeRoom) {
        currentThemeRoom = window.myRoomId; buildEnvironment(window.myRoomId);
    }
    
    data.players.forEach(p => {
        p.deck.forEach(c => {
            if(!entities[c.id]) {
                let startX = (Math.random() - 0.5) * 16; 
                let startZ = (Math.random() - 0.5) * 16;
                // ⭐️ 수정됨: 이제 캐릭터의 발바닥이 기준이므로, 지형의 높이(h)에 정확히 맞춤
                let startY = window.getTerrainHeight ? window.getTerrainHeight(startX, startZ) : 0;

                entities[c.id] = { 
                    id: c.id, menu: c.menu, job: c.job, isAlive: c.isAlive, color: c.gradeColor, 
                    x: startX, y: startY, z: startZ,
                    isAttacking: false 
                };
                entities[c.id].baseX = entities[c.id].x; 
                entities[c.id].baseZ = entities[c.id].z;
            } else { 
                entities[c.id].isAlive = c.isAlive; 
            }
        });
    });
};

function applyDamageEffect(ev, target) {
    let text = ev.damage >= 9999 ? "💥즉사!" : (ev.damage === 0 ? "빗나감" : `-${ev.damage}`);
    let color = ev.isCrit ? "#ff4757" : (ev.damage >= 9999 ? "#ff7f50" : "#ffffff");
    if(meshMap[ev.targetId]) {
        // 데미지 이펙트 함수 호출 (effect.js 에서 처리)
        if(typeof showDamageText === 'function') showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
        
        meshMap[ev.targetId].position.y += 0.8;
        setTimeout(() => {
            if(meshMap[ev.targetId]) meshMap[ev.targetId].position.y -= 0.8;
        }, 200);
    }
}

window.handlePlayBrawlAnimation = function(attackEvents) {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            let job = attacker.job;
            let isRanged = (job === '마법사' || job === '궁수' || job === '사제' || job === '암살자');

            if ((job === '마법사' || job === '사제') && Math.random() < 0.3) isRanged = false;

            if (isRanged) {
                let dx = target.baseX - attacker.baseX;
                let dz = target.baseZ - attacker.baseZ;
                let newX = attacker.baseX + dx * 0.15;
                let newZ = attacker.baseZ + dz * 0.15;
                
                let clamped = clampToArena(newX, newZ);
                attacker.targetX = clamped.x;
                attacker.targetZ = clamped.z;
                
                attacker.baseX = attacker.targetX; 
                attacker.baseZ = attacker.targetZ; 

                attacker.isAttacking = 'ranged';

                setTimeout(() => {
                    let projMesh = createProjectileMesh(job);
                    
                    // ⭐️ 수정됨: 투사체는 발바닥(Y=0)이 아니라 캐릭터 가슴팍 높이(+1.8)에서 발사
                    let startY = (window.getTerrainHeight ? window.getTerrainHeight(attacker.baseX, attacker.baseZ) : 0) + 1.8;
                    let targetY = (window.getTerrainHeight ? window.getTerrainHeight(target.baseX, target.baseZ) : 0) + 1.8;
                    
                    projMesh.position.set(attacker.baseX, startY, attacker.baseZ);
                    scene.add(projMesh);
                    
                    projectiles.push({
                        mesh: projMesh, job: job,
                        startX: attacker.baseX, startY: startY, startZ: attacker.baseZ,
                        targetX: target.baseX, targetY: targetY, targetZ: target.baseZ,
                        progress: 0
                    });
                }, 400); 

                setTimeout(() => applyDamageEffect(ev, target), 1000); 
                setTimeout(() => attacker.isAttacking = false, 1200);

            } else {
                let dx = target.baseX - attacker.baseX;
                let dz = target.baseZ - attacker.baseZ;
                let dist = Math.sqrt(dx*dx + dz*dz);
                let stopDist = 3.5; 

                let newX, newZ;
                if (dist > stopDist) {
                    newX = attacker.baseX + (dx / dist) * (dist - stopDist);
                    newZ = attacker.baseZ + (dz / dist) * (dist - stopDist);
                } else {
                    newX = attacker.baseX;
                    newZ = attacker.baseZ;
                }
                
                let clamped = clampToArena(newX, newZ);
                attacker.targetX = clamped.x;
                attacker.targetZ = clamped.z;
                
                attacker.baseX = attacker.targetX; 
                attacker.baseZ = attacker.targetZ; 

                attacker.isAttacking = 'melee';

                setTimeout(() => applyDamageEffect(ev, target), 800); 
                setTimeout(() => attacker.isAttacking = false, 1000); 
            }
        }
    });
};

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
            scene.add(charModel); 
            meshMap[e.id] = charModel;
        }

        let mesh = meshMap[e.id];
        
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.05;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * 0.05;
        
        // ⭐️ 수정됨: 지형의 높이(h)가 곧 캐릭터가 서야 할 정확한 바닥 위치입니다
        let targetHeight = window.getTerrainHeight ? window.getTerrainHeight(e.x, e.z) : 0;
        
        // y값이 NaN이거나 지정되지 않았으면 바닥 높이로 초기화
        if (e.y === undefined || isNaN(e.y)) e.y = targetHeight;
        
        // 계단을 부드럽게 오르내리는 보간 효과
        e.y += (targetHeight - e.y) * 0.2; 
        
        let isMoving = Math.abs(e.targetX - e.x) > 0.1 || Math.abs(e.targetZ - e.z) > 0.1;
        let jumpY = isMoving ? Math.abs(Math.sin(time * 4)) * 0.6 : Math.sin(time * 1.5 + e.x) * 0.05;
        
        // 최종적으로 Y축에 점프 높이만 더해서 세팅
        mesh.position.set(e.x, e.y + jumpY, e.z);
        
        // 전투 모션
        // (참고: wrapper를 돌리므로 내부 group이 회전합니다)
        if (e.isAttacking === 'melee') {
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            if (e.job === '탱커') { mesh.rotation.x = Math.PI / 4; } 
            else if (e.job === '전사' || e.job === '버서커') { mesh.rotation.y += time * 8; mesh.rotation.x = 0; } 
            else { mesh.rotation.x = Math.PI / 6; }
        } else if (e.isAttacking === 'ranged') {
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
            if (e.job === '마법사' || e.job === '사제') { mesh.position.y += 1.0; }
            mesh.rotation.x = 0;
        } else {
            mesh.rotation.x = 0;
            if (isMoving) { mesh.rotation.y = Math.atan2(e.targetX - e.x, e.targetZ - e.z); } 
            else { mesh.rotation.y = Math.sin(time * 0.5 + e.z) * 0.15; }
        }
    });
    
    // 투사체 처리
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.progress += 0.03; 

        if (p.progress >= 1) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
        } else {
            p.mesh.position.x = p.startX + (p.targetX - p.startX) * p.progress;
            p.mesh.position.z = p.startZ + (p.targetZ - p.startZ) * p.progress;
            
            let currentBaseY = p.startY + (p.targetY - p.startY) * p.progress;
            
            if (p.job === '궁수') {
                p.mesh.rotation.z = Math.atan2(p.targetX - p.startX, p.targetZ - p.startZ);
                p.mesh.position.y = currentBaseY + Math.sin(p.progress * Math.PI) * 4.0; 
            } else if (p.job === '암살자') {
                p.mesh.rotation.y += 0.4; 
                p.mesh.position.y = currentBaseY;
            } else {
                p.mesh.position.y = currentBaseY;
            }
        }
    }
    
    renderer.render(scene, camera);
}
gameLoop();
