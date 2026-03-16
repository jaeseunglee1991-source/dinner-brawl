// public/js/3d/loop.js

function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!scene || !camera || !renderer) return;

    const time = Date.now() * 0.003;

    // 1️⃣ 캐릭터 렌더링
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
        
        let moveSpeed = 0.05; 
        if (e.isAttacking === 'fast_melee') moveSpeed = 0.2; 
        if (e.isAttacking === 'casting') moveSpeed = 0.02; 
        
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * moveSpeed;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * moveSpeed;
        
        let targetHeight = window.getTerrainHeight ? window.getTerrainHeight(e.x, e.z) : 0;
        if (e.y === undefined || isNaN(e.y)) e.y = targetHeight;
        e.y += (targetHeight - e.y) * 0.2; 
        
        let isMoving = Math.abs(e.targetX - e.x) > 0.1 || Math.abs(e.targetZ - e.z) > 0.1;
        let jumpY = isMoving ? Math.abs(Math.sin(time * 4)) * 0.6 : Math.sin(time * 1.5 + e.x) * 0.05;
        
        if (e.isAttacking === 'heavy_melee') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y += time * 8; 
            mesh.rotation.x = 0;
        } else if (e.isAttacking === 'shield_bash') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            mesh.rotation.x = Math.PI / 4; 
        } else if (e.isAttacking === 'fast_melee') {
            mesh.position.set(e.x, e.y + jumpY, e.z);
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
            mesh.rotation.x = Math.PI / 6; 
        } else if (e.isAttacking === 'casting') {
            e.y += 1.5; 
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
    
    // 2️⃣ 투사체 렌더링
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.job === '궁수' || p.job === '암살자') p.progress += 0.06; 
        else p.progress += 0.03; 

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

// 최초 1회 루프 시작
gameLoop();
