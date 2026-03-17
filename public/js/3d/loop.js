// public/js/3d/loop.js

const clock = new THREE.Clock();

function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!scene || !camera || !renderer) return;

    const delta = clock.getDelta();
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
        
        // ⭐️ 애니메이션 재생기 업데이트
        if (mesh.userData.mixer) {
            mesh.userData.mixer.update(delta);
        }
        
        let moveSpeed = 0.05; 
        if (e.isAttacking === 'fast_melee') moveSpeed = 0.2; 
        if (e.isAttacking === 'casting') moveSpeed = 0.02; 
        
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * moveSpeed;
        if(e.targetZ !== undefined) e.z += (e.targetZ - e.z) * moveSpeed;
        
        let targetHeight = window.getTerrainHeight ? window.getTerrainHeight(e.x, e.z) : 0;
        if (e.y === undefined || isNaN(e.y)) e.y = targetHeight;
        e.y += (targetHeight - e.y) * 0.2; 
        
        let isMoving = Math.abs(e.targetX - e.x) > 0.1 || Math.abs(e.targetZ - e.z) > 0.1;
        
        // ⭐️ 추가됨: 애니메이션 상태 결정 머신 (State Machine)
        let currentState = 'Idle';
        if (e.isAttacking) {
            currentState = 'Attack';
        } else if (isMoving) {
            currentState = 'Run';
        }

        // 캐릭터 모델에 상태 변경 지시
        if (mesh.userData.changeState) {
            mesh.userData.changeState(currentState);
        }
        
        // 3D 모델 자체에 내장된 걷기 애니메이션을 쓰므로 강제 점프(jumpY)는 제거함
        mesh.position.set(e.x, e.y, e.z);
        
        // 방향 회전 로직
        if (e.isAttacking === 'heavy_melee') {
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
        } else if (e.isAttacking === 'shield_bash') {
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
        } else if (e.isAttacking === 'fast_melee') {
            mesh.rotation.y = Math.atan2(e.x - e.baseX, e.z - e.baseZ);
        } else if (e.isAttacking === 'casting') {
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
        } else if (e.isAttacking === 'fast_ranged') {
            mesh.rotation.y = Math.atan2(e.targetX - e.baseX, e.targetZ - e.baseZ);
        } else {
            if (isMoving) { 
                mesh.rotation.y = Math.atan2(e.targetX - e.x, e.targetZ - e.z); 
            }
        }
    });
    
    // 투사체 처리 로직 (유지)
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
