// public/js/3d/effect.js

// 데미지 텍스트 팝업 이펙트
function showDamageText(mesh, text, color, isCrit) {
    const vector = new THREE.Vector3();
    mesh.getWorldPosition(vector);
    
    // 🌟 캐릭터가 커졌으므로 데미지 텍스트 시작 위치를 머리 위로 더 올림 (2 -> 3.5)
    vector.y += 3.5; 
    vector.project(camera);
    
    const container = document.getElementById('battleContainer');
    const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * container.clientHeight;
    
    const div = document.createElement('div'); div.innerText = text;
    div.style.position = 'absolute'; div.style.left = x + 'px'; div.style.top = y + 'px';
    div.style.color = color; div.style.fontWeight = 'bold';
    div.style.fontSize = isCrit ? '32px' : '20px'; div.style.pointerEvents = 'none'; 
    div.style.textShadow = '2px 2px 5px rgba(0,0,0,0.8)'; 
    div.style.transition = 'all 0.8s cubic-bezier(0.25, 1.5, 0.5, 1)'; div.style.zIndex = '100';
    div.style.transform = 'translate(-50%, -50%)'; 
    
    container.appendChild(div);
    
    setTimeout(() => { 
        div.style.top = (y - 80) + 'px'; 
        div.style.transform = 'translate(-50%, -50%) scale(1.2)';
        div.style.opacity = '0'; 
    }, 50);
    setTimeout(() => div.remove(), 850);
}

// 🏹 직업별 원거리 투사체 모델링 (크기 상향)
function createProjectileMesh(job) {
    let mesh;
    if (job === '마법사') {
        // 붉은 파이어볼 (크기 증가)
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
    } else if (job === '궁수') {
        // 날카로운 화살 (길이 및 두께 증가)
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), new THREE.MeshStandardMaterial({ color: 0xbdc3c7 }));
        mesh.rotation.x = Math.PI / 2;
    } else if (job === '암살자') {
        // 회전하는 십자 표창 (크기 증가)
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x2f3640 }));
        mesh.rotation.x = Math.PI / 2;
    } else if (job === '사제') {
        // 황금빛 신성한 구체 (크기 증가)
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf1c40f }));
    } else {
        // 기본 구체
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    }
    return mesh;
}
