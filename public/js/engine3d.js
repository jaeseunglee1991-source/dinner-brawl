// public/js/engine3d.js

const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.9);
light.position.set(10, 20, 10);
scene.add(light);
camera.position.set(0, 0, 18);

function resizeCanvas() { 
    const container = document.getElementById('battleContainer');
    if(!container) return;
    const w = container.clientWidth; const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeCanvas);

function createStickman(job, gradeColor) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: gradeColor });
    const blackMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const grayMat = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });
    const brownMat = new THREE.MeshPhongMaterial({ color: 0x8e44ad });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), bodyMat);
    head.position.y = 1.2; group.add(head);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8), bodyMat);
    torso.position.y = 0.3; group.add(torso);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), bodyMat);
    armL.position.set(-0.4, 0.6, 0); armL.rotation.z = Math.PI/4; group.add(armL);
    
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), bodyMat);
    armR.position.set(0.4, 0.6, 0); armR.rotation.z = -Math.PI/4; group.add(armR);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), bodyMat);
    legL.position.set(-0.2, -0.5, 0); group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), bodyMat);
    legR.position.set(0.2, -0.5, 0); group.add(legR);

    if (job === '전사') {
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), grayMat);
        sword.position.set(0.8, 0.5, 0); group.add(sword);
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), brownMat);
        shield.rotation.x = Math.PI/2; shield.position.set(-0.8, 0.4, 0.2); group.add(shield);
    } 
    else if (job === '도적') {
        const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), grayMat);
        dagger.position.set(0.8, 0.3, 0); group.add(dagger);
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 16, Math.PI), brownMat);
        bow.rotation.y = Math.PI/2; bow.position.set(0, 0.5, -0.3); group.add(bow);
    }
    else if (job === '사제') {
        const habit = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.4, 16), blackMat);
        habit.position.y = 1.3; group.add(habit);
        const habitBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.1), blackMat);
        habitBack.position.set(0, 0.8, -0.5); group.add(habitBack);
        const maceHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), brownMat);
        maceHandle.position.set(0.8, 0.5, 0); group.add(maceHandle);
        const maceHead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), grayMat);
        maceHead.position.set(0.8, 1.0, 0); group.add(maceHead);
    }
    else if (job === '버서커') {
        const axeG = new THREE.Group();
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), brownMat);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), grayMat);
        b.position.set(0.2, 0.2, 0); axeG.add(h); axeG.add(b);
        
        const axe1 = axeG.clone(); axe1.position.set(0.8, 0.4, 0); group.add(axe1);
        const axe2 = axeG.clone(); axe2.position.set(-0.8, 0.4, 0); axe2.rotation.y = Math.PI; group.add(axe2);
    }
    else if (job === '암살자') {
        const mask = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.52), blackMat);
        mask.position.y = 1.1; group.add(mask);
        const shuri = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 4), grayMat);
        shuri.rotation.x = Math.PI/2; shuri.position.set(0.8, 0.5, 0); group.add(shuri);
    }
    return group;
}

function showDamageText(mesh, text, color, isCrit) {
    const vector = mesh.position.clone(); vector.project(camera);
    const container = document.getElementById('battleContainer');
    const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * container.clientHeight;
    
    const div = document.createElement('div'); div.innerText = text;
    div.style.position = 'absolute'; div.style.left = x + 'px'; div.style.top = y + 'px';
    div.style.color = color; div.style.fontWeight = 'bold';
    div.style.fontSize = isCrit ? '26px' : '18px'; div.style.pointerEvents = 'none'; 
    div.style.textShadow = '2px 2px 4px black'; div.style.transition = 'all 1s ease-out'; div.style.zIndex = '100';
    
    container.appendChild(div);
    setTimeout(() => { div.style.top = (y - 50) + 'px'; div.style.opacity = '0'; }, 50);
    setTimeout(() => div.remove(), 1050);
}

socket.on('playBrawlAnimation', (attackEvents) => {
    attackEvents.forEach(ev => {
        let attacker = entities[ev.attackerId]; let target = entities[ev.targetId];
        if(attacker && target) {
            attacker.targetX = target.x; attacker.targetY = target.y;
            setTimeout(() => {
                let text = ev.damage === 999 ? "💥폭발!" : (ev.damage === 0 ? "빗나감" : `-${ev.damage}`);
                let color = ev.isCrit ? "#ff4757" : (ev.damage === 999 ? "#ff7f50" : "white");
                if(meshMap[ev.targetId]) showDamageText(meshMap[ev.targetId], text, color, ev.isCrit);
                attacker.targetX = attacker.baseX; attacker.targetY = attacker.baseY;
            }, 400); 
        }
    });
});

function gameLoop() {
    requestAnimationFrame(gameLoop);
    Object.values(entities).forEach(e => {
        if(!e.isAlive) {
            if(meshMap[e.id]) { scene.remove(meshMap[e.id]); delete meshMap[e.id]; }
            return;
        }

        if(!meshMap[e.id]) {
            const stickman = createStickman(e.job, e.color);
            scene.add(stickman);
            meshMap[e.id] = stickman;
        }

        let mesh = meshMap[e.id];
        if(e.targetX !== undefined) e.x += (e.targetX - e.x) * 0.15;
        if(e.targetY !== undefined) e.y += (e.targetY - e.y) * 0.15;
        
        mesh.position.set(e.x, e.y, 0);
        mesh.position.y += Math.sin(Date.now() * 0.005 + e.x) * 0.02; // 바운딩 효과
    });
    renderer.render(scene, camera);
}
gameLoop();
