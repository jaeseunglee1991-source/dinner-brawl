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
        if(typeof showDamageText === 'function') showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
        
        meshMap[ev.targetId].position.y += 0.8;
        setTimeout(() => {
            if(meshMap[ev.targetId]) meshMap[ev.targetId].position.y -= 0.8;
        }, 200);
    }
}

// ⭐️ 직업에 따른 모션 및 타이밍 완벽 분리
window.handlePlayBrawlAnimation = function(attackEvents) {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            let job = attacker.job;
            
            let dx = target.baseX - attacker.baseX;
            let dz = target.baseZ - attacker.baseZ;
            let dist = Math.sqrt(dx*dx + dz*dz);
            
            // 1️⃣ 캐스팅 딜러 (마법사, 사제): 느리게 공중 부양 후 강력한 투사체
            if (job === '마법사' || job === '사제') {
                attacker.targetX = attacker.baseX + dx * 0.1;
                attacker.targetZ = attacker.baseZ + dz * 0.1;
                attacker.baseX = attacker.targetX; attacker.baseZ = attacker.targetZ;
                attacker.isAttacking = 'casting';
                
                setTimeout(() => {
                    let projMesh = createProjectileMesh(job);
                    let startY = (window.getTerrainHeight ? window.getTerrainHeight(attacker.baseX, attacker.baseZ) : 0) + 2.5;
                    let targetY = (window.getTerrainHeight ? window.getTerrainHeight(target.baseX, target.baseZ) : 0) + 1.5;
                    projMesh.position.set(attacker.baseX, startY, attacker.baseZ);
                    scene.add(projMesh);
                    projectiles.push({ mesh: projMesh, job: job, startX: attacker.baseX, startY: startY, startZ: attacker.baseZ, targetX: target.baseX, targetY: targetY, targetZ: target.baseZ, progress: 0 });
                }, 800); // 0.8초간 기 모으기
                
                setTimeout(() => applyDamageEffect(ev, target), 1400); // 느린 발사 타격
                setTimeout(() => attacker.isAttacking = false, 1600);
            } 
            // 2️⃣ 스피드 근접 딜러 (도적, 암살자): 순식간에 파고들어 찌르기
            else if (job === '도적' || job === '암살자') {
                let stopDist = 2.5;
                let newX, newZ;
                if (dist > stopDist) {
                    newX = attacker.baseX + (dx / dist) * (dist - stopDist);
                    newZ = attacker.baseZ + (dz / dist) * (dist - stopDist);
                } else { newX = attacker.baseX; newZ = attacker.baseZ; }
                
                let clamped = clampToArena(newX, newZ);
                attacker.targetX = clamped.x; attacker.targetZ = clamped.z;
                attacker.baseX = attacker.targetX; attacker.baseZ = attacker.targetZ;
                attacker.isAttacking = 'fast_melee';
                
                setTimeout(() => applyDamageEffect(ev, target), 200); // 눈 깜짝할 새 타격
                setTimeout(() => attacker.isAttacking = false, 400);
            }
            // 3️⃣ 속사 원거리 딜러 (궁수): 빠르고 날렵한 화살 발사
            else if (job === '궁수') {
                attacker.targetX = attacker.baseX + dx * 0.1; attacker.targetZ = attacker.baseZ + dz * 0.1;
                attacker.baseX = attacker.targetX; attacker.baseZ = attacker.targetZ;
                attacker.isAttacking = 'fast_ranged';
                
                setTimeout(() => {
                    let projMesh = createProjectileMesh(job);
                    let startY = (window.getTerrainHeight ? window.getTerrainHeight(attacker.baseX, attacker.baseZ) : 0) + 2.5;
                    let targetY = (window.getTerrainHeight ? window.getTerrainHeight(target.baseX, target.baseZ) : 0) + 1.5;
                    projMesh.position.set(attacker.baseX, startY, attacker.baseZ);
                    scene.add(projMesh);
                    projectiles.push({ mesh: projMesh, job: job, startX: attacker.baseX, startY: startY, startZ: attacker.baseZ, targetX: target.baseX, targetY: targetY, targetZ: target.baseZ, progress: 0 });
                }, 200); // 0.2초만에 발사
                
                setTimeout(() => applyDamageEffect(ev, target), 600);
                setTimeout(() => attacker.isAttacking = false, 800);
            }
            // 4️⃣ 탱커: 방패로 묵직하게 밀치기
            else if (job === '탱커') {
                let stopDist = 3.0;
                let newX, newZ;
                if (dist > stopDist) {
                    newX = attacker.baseX + (dx / dist) * (dist - stopDist);
                    newZ = attacker.baseZ + (dz / dist) * (dist - stopDist);
                } else { newX = attacker.baseX; newZ = attacker.baseZ; }
                
                let clamped = clampToArena(newX, newZ);
                attacker.targetX = clamped.x; attacker.targetZ = clamped.z;
                attacker.baseX = attacker.targetX; attacker.baseZ = attacker.targetZ;
                attacker.isAttacking = 'shield_bash';
                
                setTimeout(() => applyDamageEffect(ev, target), 500);
                setTimeout(() => attacker.isAttacking = false, 900);
            }
            // 5️⃣ 근력 전사 (전사, 버서커, 요리사 등): 휠윈드 회전 베기
            else {
                let stopDist = 3.5;
                let newX, newZ;
                if (dist > stopDist) {
                    newX = attacker.baseX + (dx / dist) * (dist - stopDist);
                    newZ = attacker.baseZ + (dz / dist) * (dist - stopDist);
                } else { newX = attacker.baseX; newZ = attacker.baseZ; }
                
                let clamped = clampToArena(newX, newZ);
                attacker.targetX = clamped.x; attacker.targetZ = clamped.z;
                attacker.baseX = attacker.targetX; attacker.baseZ = attacker.targetZ;
                attacker.isAttacking = 'heavy_melee';
                
                setTimeout(() => applyDamageEffect(ev, target), 600);
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
            charModel.scale.set(1.8, 1.8, 1.8);
            scene.add(charModel); 
            meshMap[e.id] = charModel;
        }

        let mesh = meshMap[e.id];
        
        // ⭐️ 모션별 대시(이동) 속도 차별화
        let moveSpeed = 0.05; 
        if (e.isAttacking === 'fast_melee') moveSpeed = 0.2; // 도적 순보
        if (e.isAttacking === 'casting') moveSpeed = 0.02; // 마법사 제자리 고정
        
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * moveSpeed;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * moveSpeed;
        
        let targetHeight = window.getTerrainHeight ? window.getTerrainHeight(e.x, e.z) : 0;
        if (e.y === undefined || isNaN(e.y)) e.y = targetHeight;
        e.y += (targetHeight - e.y) * 0.2; 
        
        let isMoving = Math.abs(e.targetX - e.x) > 0.1 || Math.abs(e.targetZ - e.z) > 0.1;
        let jumpY = isMoving ? Math.abs(Math.sin(time * 4)) * 0.6 : Math.sin(time * 1.5 + e.x) * 0.05;
        
        // ⭐️ 직업 모션 회전축 연산
        if (e.isAttacking === 'heavy_melee') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y += time * 8; // 휠윈드 회전
            mesh.rotation.x = 0;
        } else if (e.isAttacking === 'shield_bash') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            mesh.rotation.x = Math.PI / 4; // 방패 밀치기
        } else if (e.isAttacking === 'fast_melee') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            mesh.rotation.x = Math.PI / 6; // 빠르고 낮게 찌르기
        } else if (e.isAttacking === 'casting') {
            e.y += 1.5; // 공중 부양
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
            mesh.rotation.x = 0;
        } else if (e.isAttacking === 'fast_ranged') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
            mesh.rotation.x = 0;
        } else {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.x = 0;
            if (isMoving) { mesh.rotation.y = Math.atan2(e.targetX - e.x, e.targetZ - e.z); } 
            else { mesh.rotation.y = Math.sin(time * 0.5 + e.z) * 0.15; }
        }
    });
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        // ⭐️ 투사체 비행 속도 차별화
        if (p.job === '궁수' || p.job === '암살자') {
            p.progress += 0.06; // 물리 투사체는 빠름
        } else {
            p.progress += 0.03; // 마법 구체는 묵직함
        }

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
