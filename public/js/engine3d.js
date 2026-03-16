// public/js/engine3d.js

let projectiles = [];

window.handle3DUpdatePlayers = function(data) {
    if (window.myRoomId && window.myRoomId !== currentThemeRoom) {
        currentThemeRoom = window.myRoomId; buildEnvironment(window.myRoomId);
    }
    
    data.players.forEach(p => {
        p.deck.forEach(c => {
            if(!entities[c.id]) {
                entities[c.id] = { 
                    id: c.id, menu: c.menu, job: c.job, isAlive: c.isAlive, color: c.gradeColor, 
                    x: (Math.random() - 0.5) * 24, z: (Math.random() - 0.5) * 20,
                    isAttacking: false 
                };
                // 처음 생성될 때의 위치를 기본 위치로 세팅
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
        showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
        // 맞으면 살짝 움찔거리는 타격감 (속도 조절)
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
                // 🏹 원거리 공격: 타겟 쪽으로 살짝만 걸어나가서 '그 자리에 고정'
                let dx = target.baseX - attacker.baseX;
                let dz = target.baseZ - attacker.baseZ;
                attacker.targetX = attacker.baseX + dx * 0.15;
                attacker.targetZ = attacker.baseZ + dz * 0.15;
                
                // 🛑 제자리로 돌아가지 않고 이동한 곳을 새로운 베이스로 설정
                attacker.baseX = attacker.targetX; 
                attacker.baseZ = attacker.targetZ; 

                attacker.isAttacking = 'ranged';

                // 묵직하게 0.4초 뜸 들이고 마법/화살 발사
                setTimeout(() => {
                    let projMesh = createProjectileMesh(job);
                    projMesh.position.set(attacker.baseX, 1.5, attacker.baseZ);
                    scene.add(projMesh);
                    
                    projectiles.push({
                        mesh: projMesh, job: job,
                        startX: attacker.baseX, startZ: attacker.baseZ,
                        targetX: target.baseX, targetZ: target.baseZ,
                        progress: 0
                    });
                }, 400); 

                // 투사체가 날아가는 시간 대기 후 데미지 표시 (1초 후)
                setTimeout(() => applyDamageEffect(ev, target), 1000); 

                // 공격 모션 종료 (1.2초)
                setTimeout(() => attacker.isAttacking = false, 1200);

            } else {
                // ⚔️ 근접 공격: 적의 바로 앞까지 이동 후 '그 자리에 고정'
                let dx = target.baseX - attacker.baseX;
                let dz = target.baseZ - attacker.baseZ;
                let dist = Math.sqrt(dx*dx + dz*dz);
                let stopDist = 2.0; // 적과 겹치지 않게 2.0 거리 유지

                if (dist > stopDist) {
                    attacker.targetX = attacker.baseX + (dx / dist) * (dist - stopDist);
                    attacker.targetZ = attacker.baseZ + (dz / dist) * (dist - stopDist);
                } else {
                    // 이미 충분히 가까우면 제자리 공격
                    attacker.targetX = attacker.baseX;
                    attacker.targetZ = attacker.baseZ;
                }
                
                // 🛑 타격한 위치를 새로운 베이스로 설정하여 제자리 복귀 방지
                attacker.baseX = attacker.targetX; 
                attacker.baseZ = attacker.targetZ; 

                attacker.isAttacking = 'melee';

                // 근접 공격은 이동할 시간을 벌어주기 위해 데미지를 0.8초 뒤에 적용
                setTimeout(() => applyDamageEffect(ev, target), 800); 
                
                // 공격 모션 종료
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
            scene.add(charModel); meshMap[e.id] = charModel;
        }

        let mesh = meshMap[e.id];
        
        // 🐢 이동 속도를 대폭 늦춤 (기존 0.2 -> 0.05) - RPG 특유의 묵직한 걷기
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.05;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * 0.05;
        
        // 이동 중일 때만 바운딩(걷는 모션)을 주고 멈춰있을 땐 잔잔하게
        let isMoving = Math.abs(e.targetX - e.x) > 0.1 || Math.abs(e.targetZ - e.z) > 0.1;
        let jumpY = isMoving ? Math.abs(Math.sin(time * 4)) * 0.6 : Math.sin(time * 1.5 + e.x) * 0.05;
        mesh.position.set(e.x, jumpY, e.z);
        
        if (e.isAttacking === 'melee') {
            // 적을 향해 바라봄
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            
            if (e.job === '탱커') {
                mesh.rotation.x = Math.PI / 4; // 쉴드 배쉬
            } else if (e.job === '전사' || e.job === '버서커') {
                mesh.rotation.y += time * 8; // 회전 베기 (속도 약간 낮춤)
                mesh.rotation.x = 0;
            } else {
                mesh.rotation.x = Math.PI / 6; // 일반 찌르기
            }
        } else if (e.isAttacking === 'ranged') {
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
            if (e.job === '마법사' || e.job === '사제') {
                mesh.position.y += 1.0; // 마법 캐스팅 부양 (조금 낮춤)
            }
            mesh.rotation.x = 0;
        } else {
            mesh.rotation.x = 0;
            if (isMoving) {
                // 이동 중일 땐 이동 방향을 바라봄
                mesh.rotation.y = Math.atan2(e.targetX - e.x, e.targetZ - e.z);
            } else {
                // 대기 중엔 살짝 흔들거림
                mesh.rotation.y = Math.sin(time * 0.5 + e.z) * 0.15; 
            }
        }
    });
    
    // 🐢 투사체 연산 (날아가는 속도도 느리게 변경)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.progress += 0.03; // 기존 0.08 -> 0.03 으로 느리게 변경

        if (p.progress >= 1) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
        } else {
            p.mesh.position.x = p.startX + (p.targetX - p.startX) * p.progress;
            p.mesh.position.z = p.startZ + (p.targetZ - p.startZ) * p.progress;
            
            if (p.job === '궁수') {
                // 화살의 포물선을 더 높고 극적으로
                p.mesh.rotation.z = Math.atan2(p.targetX - p.startX, p.targetZ - p.startZ);
                p.mesh.position.y = 1.5 + Math.sin(p.progress * Math.PI) * 3.5; 
            } else if (p.job === '암살자') {
                p.mesh.rotation.y += 0.4; // 회전 속도 낮춤
                p.mesh.position.y = 1.5;
            } else {
                p.mesh.position.y = 1.5;
            }
        }
    }
    
    renderer.render(scene, camera);
}
gameLoop();
