// public/js/engine3d.js

const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

// 조명을 좀 더 극적으로 세팅 (금속 재질을 살리기 위함)
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(10, 20, 15);
light.castShadow = true;
scene.add(light);
const backLight = new THREE.DirectionalLight(0xaaaaaa, 0.5);
backLight.position.set(-10, 10, -15);
scene.add(backLight);

camera.position.set(0, 0, 18);

function resizeCanvas() { 
    const container = document.getElementById('battleContainer');
    if(!container) return;
    const w = container.clientWidth; const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeCanvas);

// ==========================================
// 디테일한 3D 캐릭터 생성기 (SD 스타일)
// ==========================================
function createDetailedCharacter(job, gradeColor) {
    const group = new THREE.Group();
    
    // 공통 재질 정의
    const matBody = new THREE.MeshStandardMaterial({ color: gradeColor, roughness: 0.6 });
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.8, roughness: 0.3 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.9 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const matMagic = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // 스스로 빛나는 마법 재질
    const matRage = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    // 1. 공통 신체 (SD 비율: 큰 머리, 앙증맞은 몸)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), matSkin);
    head.position.y = 1.2; group.add(head);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.8, 16), matBody);
    torso.position.y = 0.4; group.add(torso);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), matBody);
    armL.position.set(-0.5, 0.6, 0); armL.rotation.z = Math.PI/6; group.add(armL);
    
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), matBody);
    armR.position.set(0.5, 0.6, 0); armR.rotation.z = -Math.PI/6; group.add(armR);

    // 2. 직업별 디테일 장비 장착
    if (job === '전사') {
        // 철 투구
        const helm = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32, 0, Math.PI*2, 0, Math.PI/2), matMetal);
        helm.position.y = 1.2; group.add(helm);
        // 기사검
        const sword = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.05), matMetal);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matGold);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), matDark);
        blade.position.y = 0.6; grip.position.y = -0.15;
        sword.add(blade, guard, grip);
        sword.position.set(0.7, 0.5, 0.2); sword.rotation.x = Math.PI/4; group.add(sword);
        // 카이트 쉴드
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 3), matMetal);
        shield.rotation.x = Math.PI/2; shield.rotation.y = Math.PI; shield.position.set(-0.6, 0.4, 0.3); group.add(shield);
    } 
    else if (job === '마법사') {
        // 마법사 모자 (고깔)
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 32), matDark);
        hat.position.y = 2.0; group.add(hat);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 32), matDark);
        brim.position.y = 1.45; group.add(brim);
        // 빛나는 지팡이
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), matWood);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2), matMagic);
        orb.position.y = 0.8; staff.add(orb);
        staff.position.set(0.7, 0.5, 0.2); group.add(staff);
    }
    else if (job === '도적') {
        // 복면 후드
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), matDark);
        hood.position.y = 1.2; group.add(hood);
        // 쌍단검
        const dagger = new THREE.Group();
        const dBlade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6), matMetal);
        dBlade.position.y = 0.3; dagger.add(dBlade);
        const daggerL = dagger.clone(); daggerL.position.set(-0.7, 0.5, 0.2); daggerL.rotation.x = Math.PI/4; group.add(daggerL);
        const daggerR = dagger.clone(); daggerR.position.set(0.7, 0.5, 0.2); daggerR.rotation.x = Math.PI/4; group.add(daggerR);
    }
    else if (job === '사제') {
        // 천사 후광 (Halo)
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 16, 32), matGold);
        halo.position.y = 2.0; halo.rotation.x = Math.PI/2; group.add(halo);
        // 십자가 지팡이
        const cross = new THREE.Group();
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), matGold);
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), matGold);
        c2.position.y = 0.3; cross.add(c1, c2);
        cross.position.set(0.7, 0.5, 0.2); group.add(cross);
    }
    else if (job === '버서커') {
        // 광기의 빨간 눈
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1), matRage);
        eyeL.position.set(-0.2, 1.3, 0.55); group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1), matRage);
        eyeR.position.set(0.2, 1.3, 0.55); group.add(eyeR);
        // 거대 쌍도끼
        const axe = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), matWood);
        const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), matMetal);
        head1.position.set(0.3, 0.3, 0); handle.add(head1);
        axe.add(handle);
        const axeL = axe.clone(); axeL.position.set(-0.7, 0.5, 0.2); group.add(axeL);
        const axeR = axe.clone(); axeR.position.set(0.7, 0.5, 0.2); axeR.rotation.y = Math.PI; group.add(axeR);
    }
    else if (job === '탱커') {
        // 거대 어깨 방어구
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.6), matMetal);
        shoulder.position.y = 0.8; group.add(shoulder);
        // 타워 쉴드 (엄청 큰 방패)
        const tShield = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.1), matMetal);
        tShield.position.set(0, 0.4, 0.5); group.add(tShield);
    }
    else if (job === '궁수') {
        // 활
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 16, 32, Math.PI), matWood);
        bow.rotation.z = -Math.PI/2; bow.position.set(0.7, 0.5, 0.2); group.add(bow);
        // 등 뒤의 화살통
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.8), matWood);
        quiver.position.set(0, 0.5, -0.4); quiver.rotation.z = Math.PI/6; group.add(quiver);
    }
    else if (job === '팔라딘') {
        // 황금 갑옷 포인트
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.45), matGold);
        chestPlate.position.y = 0.4; group.add(chestPlate);
        // 워해머 (망치)
        const hammer = new THREE.Group();
        const hHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), matDark);
        const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), matMetal);
        hHead.position.y = 0.5; hammer.add(hHandle, hHead);
        hammer.position.set(0.7, 0.5, 0.2); group.add(hammer);
    }
    else if (job === '암살자') {
        // 닌자 마스크 (머리띠)
        const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.61, 0.2, 32), matDark);
        mask.position.y = 1.2; group.add(mask);
        // 등 뒤의 거대 수리검
        const shuriken = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 4), matMetal);
        shuriken.rotation.x = Math.PI/2; shuriken.position.set(0, 0.5, -0.4); group.add(shuriken);
    }
    else if (job === '요리사') {
        // 셰프 모자
        const cHatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4), matWhite);
        cHatBase.position.y = 1.7; group.add(cHatBase);
        const cHatTop = new THREE.Mesh(new THREE.SphereGeometry(0.5), matWhite);
        cHatTop.position.y = 2.0; cHatTop.scale.set(1, 0.6, 1); group.add(cHatTop);
        // 프라이팬
        const pan = new THREE.Group();
        const pHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), matDark);
        const pHead = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.05, 16), matDark);
        pHead.position.y = 0.3; pHead.rotation.x = Math.PI/2; pan.add(pHandle, pHead);
        pan.position.set(0.7, 0.5, 0.2); pan.rotation.x = Math.PI/4; group.add(pan);
    }

    // 약간의 그림자 처리
    group.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return group;
}

// 데미지 텍스트 출력 함수 (애니메이션 효과)
function showDamageText(mesh, text, color, isCrit) {
    const vector = mesh.position.clone(); vector.project(camera);
    const container = document.getElementById('battleContainer');
    const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * container.clientHeight;
    
    const div = document.createElement('div'); div.innerText = text;
    div.style.position = 'absolute'; div.style.left = x + 'px'; div.style.top = y + 'px';
    div.style.color = color; div.style.fontWeight = 'bold';
    div.style.fontSize = isCrit ? '32px' : '20px'; div.style.pointerEvents = 'none'; 
    div.style.textShadow = '2px 2px 5px rgba(0,0,0,0.8)'; 
    div.style.transition = 'all 0.8s cubic-bezier(0.25, 1.5, 0.5, 1)'; div.style.zIndex = '100';
    div.style.transform = 'translate(-50%, -50%)'; // 중앙 정렬
    
    container.appendChild(div);
    
    // 통통 튀어오르는 효과
    setTimeout(() => { 
        div.style.top = (y - 80) + 'px'; 
        div.style.transform = 'translate(-50%, -50%) scale(1.2)';
        div.style.opacity = '0'; 
    }, 50);
    setTimeout(() => div.remove(), 850);
}

// 소켓 애니메이션 수신
socket.on('playBrawlAnimation', (attackEvents) => {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            attacker.targetX = target.x; attacker.targetY = target.y;
            
            // 타격 시점
            setTimeout(() => {
                let text = ev.damage === 999 ? "💥즉사!" : (ev.damage === 0 ? "빗나감" : `-${ev.damage}`);
                let color = ev.isCrit ? "#ff4757" : (ev.damage === 999 ? "#ff7f50" : "#ffffff");
                if(meshMap[ev.targetId]) {
                    showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
                    // 피격 모션 (살짝 뒤로 밀림)
                    meshMap[ev.targetId].position.y += 0.5;
                    setTimeout(() => meshMap[ev.targetId].position.y -= 0.5, 100);
                }
                attacker.targetX = attacker.baseX; attacker.targetY = attacker.baseY;
            }, 300); 
        }
    });
});

// 메인 렌더링 루프
function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    const time = Date.now() * 0.003;

    Object.values(entities).forEach(e => {
        if(!e.isAlive) {
            if(meshMap[e.id]) { scene.remove(meshMap[e.id]); delete meshMap[e.id]; }
            return;
        }

        // 객체가 없다면 생성
        if(!meshMap[e.id]) {
            const charModel = createDetailedCharacter(e.job, e.color);
            scene.add(charModel);
            meshMap[e.id] = charModel;
        }

        let mesh = meshMap[e.id];
        
        // 이동 로직 (부드러운 추적)
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.2;
        if(e.targetY !== undefined) e.y += (e.targetY - e.y) * 0.2;
        
        mesh.position.set(e.x, e.y, 0);
        
        // 대기 애니메이션: 호흡하듯 상하 바운딩 및 가벼운 회전
        mesh.position.y += Math.sin(time + e.x) * 0.02; 
        
        // 타겟(적)을 향해 돌진 중일 때 회전하는 연출
        if (Math.abs(e.targetX - e.baseX) > 1) {
            mesh.rotation.z = (e.x - e.baseX) * -0.1; 
        } else {
            mesh.rotation.z = 0;
            // 평소에는 살짝 앞뒤로 흔들거림
            mesh.rotation.y = Math.sin(time * 0.5 + e.y) * 0.1; 
        }
    });
    
    renderer.render(scene, camera);
}
gameLoop();
