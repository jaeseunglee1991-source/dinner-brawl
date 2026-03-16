// public/js/engine3d.js

// 투사체들을 관리할 배열
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
                    isAttacking: false // 애니메이션 상태값
                };
                entities[c.id].baseX = entities[c.id].x; entities[c.id].baseZ = entities[c.id].z;
            } else { entities[c.id].isAlive = c.isAlive; }
        });
    });
};

// 💥 피격 데미지 폰트 및 리액션 처리 함수
function applyDamageEffect(ev, target) {
    let text = ev.damage >= 9999 ? "💥즉사!" : (ev.damage === 0 ? "빗나감" : `-${ev.damage}`);
    let color = ev.isCrit ? "#ff4757" : (ev.damage >= 9999 ? "#ff7f50" : "#ffffff");
    if(meshMap[ev.targetId]) {
        showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
        // 맞으면 뒤로 살짝 밀리는 타격감
        meshMap[ev.targetId].position.y += 0.8;
        setTimeout(() => meshMap[ev.targetId].position.y -= 0.8, 150);
    }
}

window.handlePlayBrawlAnimation = function(attackEvents) {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            let job = attacker.job;
            let isRanged = (job === '마법사' || job === '궁수' || job === '사제' || job === '암살자');

            // 🪄 마법사/사제는 30% 확률로 마법 대신 지팡이로 직접 후려칩니다!
            if ((job === '마법사' || job === '사제') && Math.random() < 0.3) {
                isRanged = false;
            }

            if (isRanged) {
                // 🏹 원거리 공격: 살짝 앞으로 걸어나오며 투사체 발사
                attacker.targetX = attacker.baseX + (target.baseX - attacker.baseX) * 0.1;
                attacker.targetZ = attacker.baseZ + (target.baseZ - attacker.baseZ) * 0.1;
                attacker.isAttacking = 'ranged';

                // 투사체 생성 및 씬에 추가
                let projMesh = createProjectileMesh(job);
                projMesh.position.set(attacker.baseX, 1.5, attacker.baseZ);
                scene.add(projMesh);
                
                projectiles.push({
                    mesh: projMesh, job: job,
                    startX: attacker.baseX, startZ: attacker.baseZ,
                    targetX: target.baseX, targetZ: target.baseZ,
                    progress: 0
                });

                // 발사 후 자리로 복귀
                setTimeout(() => {
                    attacker.targetX = attacker.baseX; attacker.targetZ = attacker.baseZ; 
                    attacker.isAttacking = false;
                }, 200);

                // 원거리 공격은 투사체가 도달할 때쯤 데미지 텍스트 팝업 (약 400ms)
                setTimeout(() => applyDamageEffect(ev, target), 400); 
                
            } else {
                // ⚔️ 근접 공격: 적에게 무섭게 돌진
                attacker.targetX = target.baseX; 
                attacker.targetZ = target.baseZ; 
                attacker.isAttacking = 'melee';

                // 근접 공격은 타겟에 닿을 때쯤 데미지 팝업 (약 250ms)
                setTimeout(() => {
                    applyDamageEffect(ev, target);
                    attacker.targetX = attacker.baseX; 
                    attacker.targetZ = attacker.baseZ; 
                    attacker.isAttacking = false;
                }, 250); 
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

    // 1️⃣ 캐릭터 애니메이션 연산
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
        
        // 이동 보간 (부드럽게 이동)
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.3;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * 0.3;
        
        let jumpY = Math.abs(Math.sin(time * 3 + e.x)) * 0.4;
        mesh.position.set(e.x, jumpY, e.z);
        
        // 🔥 직업별 다채로운 전투 모션 적용 🔥
        if (e.isAttacking === 'melee') {
            // 적을 향해 바라봄
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            
            if (e.job === '탱커') {
                // 탱커: 방패를 앞세우고 몸을 45도 숙이며 쉴드 배쉬!
                mesh.rotation.x = Math.PI / 4; 
            } else if (e.job === '전사' || e.job === '버서커') {
                // 전사/버서커: 몸을 팽이처럼 빙글빙글 돌리는 휠윈드(회전베기)!
                mesh.rotation.y += time * 10; 
                mesh.rotation.x = 0;
            } else {
                // 일반 근접: 살짝 몸을 들이밀며 공격
                mesh.rotation.x = Math.PI / 6; 
            }
        } else if (e.isAttacking === 'ranged') {
            // 원거리는 타겟을 쳐다봄
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
            if (e.job === '마법사' || e.job === '사제') {
                // 마법 시전 시 공중으로 살짝 부양함
                mesh.position.y += 1.5; 
            }
            mesh.rotation.x = 0;
        } else {
            // 평상시 대기 모션
            mesh.rotation.x = 0;
            mesh.rotation.y = Math.sin(time * 0.5 + e.z) * 0.15; 
        }
    });
    
    // 2️⃣ 투사체 애니메이션 연산
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.progress += 0.08; // 날아가는 속도

        if (p.progress >= 1) {
            // 목표 도달 시 투사체 제거
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
        } else {
            // 위치 업데이트
            p.mesh.position.x = p.startX + (p.targetX - p.startX) * p.progress;
            p.mesh.position.z = p.startZ + (p.targetZ - p.startZ) * p.progress;
            
            // 직업별 투사체 특수 효과
            if (p.job === '궁수') {
                // 화살은 바라보는 방향으로 꺾이고, 위로 솟구쳤다 떨어지는 '포물선'
                p.mesh.rotation.z = Math.atan2(p.targetX - p.startX, p.targetZ - p.startZ);
                p.mesh.position.y = 1.5 + Math.sin(p.progress * Math.PI) * 2.5; 
            } else if (p.job === '암살자') {
                // 표창은 빙글빙글 돌며 날아감
                p.mesh.rotation.y += 0.8; 
                p.mesh.position.y = 1.5;
            } else {
                // 마법사/사제 구체는 일직선
                p.mesh.position.y = 1.5;
            }
        }
    }
    
    renderer.render(scene, camera);
}
gameLoop();
