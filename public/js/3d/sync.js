// public/js/3d/sync.js

let projectiles = []; // 투사체 배열

// 🛑 전장 이탈 방지용 좌표 보정 함수
function clampToArena(x, z, maxRadius = 14) {
    let dist = Math.sqrt(x*x + z*z);
    if (dist > maxRadius) {
        return { x: x * (maxRadius / dist), z: z * (maxRadius / dist) };
    }
    return { x, z };
}

// 1️⃣ 캐릭터 스폰 및 상태 동기화
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

// 2️⃣ 피격 이펙트 처리
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

// 3️⃣ 공격 애니메이션 트리거 세팅
window.handlePlayBrawlAnimation = function(attackEvents) {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            let job = attacker.job;
            
            let dx = target.baseX - attacker.baseX;
            let dz = target.baseZ - attacker.baseZ;
            let dist = Math.sqrt(dx*dx + dz*dz);
            
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
                }, 800); 
                
                setTimeout(() => applyDamageEffect(ev, target), 1400); 
                setTimeout(() => attacker.isAttacking = false, 1600);
            } 
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
                
                setTimeout(() => applyDamageEffect(ev, target), 200); 
                setTimeout(() => attacker.isAttacking = false, 400);
            }
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
                }, 200); 
                
                setTimeout(() => applyDamageEffect(ev, target), 600);
                setTimeout(() => attacker.isAttacking = false, 800);
            }
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

// 실시간 소켓 수신 연결 (리플레이가 아닐 때만)
socket.on('updatePlayers', data => { if(!isReplaying) handle3DUpdatePlayers(data); });
socket.on('playBrawlAnimation', data => { if(!isReplaying) handlePlayBrawlAnimation(data); });
