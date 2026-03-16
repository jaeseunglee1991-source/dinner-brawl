// public/js/3d/environment.js

// 🗺️ 수정됨: 단차를 캐릭터 무릎 높이(0.5 단위)로 아주 얕게 제한
window.getTerrainHeight = function(x, z) {
    let dist = Math.sqrt(x*x + z*z);
    if (dist > 16) return -5; // 전장 밖 (절벽)
    
    // 중앙(반경 8)은 완전 평평하게 유지
    if (dist < 8) return 0;
    
    // 외곽은 최대 1.0 높이를 넘지 않는 0.5 단위의 얕은 계단
    let h = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5;
    return Math.max(0, Math.floor(h * 2) / 2); 
};

function buildEnvironment(roomId) {
    if (!roomId) return;
    
    while(environmentGroup.children.length > 0){ environmentGroup.remove(environmentGroup.children[0]); }

    let hash = 0;
    for (let i = 0; i < roomId.length; i++) hash += roomId.charCodeAt(i);
    const themes = ['VOLCANO', 'OCEAN', 'SNOW', 'DESERT', 'RUINS'];
    const themeNames = { 'VOLCANO': '🌋 끓어오르는 화산', 'OCEAN': '🌊 푸른 바다 위', 'SNOW': '❄️ 혹한의 설원', 'DESERT': '🏜️ 작열하는 사막', 'RUINS': '🏛️ 잊혀진 고대 유적' };
    const theme = themes[hash % themes.length];

    let blockMat, subMat;

    if (theme === 'VOLCANO') {
        scene.background = new THREE.Color(0x2c0500); scene.fog = new THREE.FogExp2(0x2c0500, 0.02); mainLight.color.setHex(0xff7979);
        blockMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 1.0 }); 
        subMat = new THREE.MeshBasicMaterial({ color: 0xff4757 }); 
        
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), subMat);
        lava.rotation.x = -Math.PI / 2; lava.position.y = -2; environmentGroup.add(lava);

        const volcano = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 16), blockMat);
        volcano.position.set(-25, 2, -25); environmentGroup.add(volcano);
        const lavaTip = new THREE.Mesh(new THREE.SphereGeometry(2), subMat);
        lavaTip.position.set(-25, 8, -25); environmentGroup.add(lavaTip);

    } else if (theme === 'OCEAN') {
        scene.background = new THREE.Color(0x7ed6df); scene.fog = new THREE.FogExp2(0x7ed6df, 0.02); mainLight.color.setHex(0xffffff);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.8 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0xbadc58, roughness: 1.0 }); 
        
        const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: 0x22a6b3, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2; water.position.y = -1; environmentGroup.add(water);

        for(let i=0; i<3; i++) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), new THREE.MeshStandardMaterial({color: 0x8b4513}));
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 5), subMat);
            trunk.position.set(20 - i*15, 2, -25 + i*5); leaves.position.set(20 - i*15, 6, -25 + i*5);
            environmentGroup.add(trunk, leaves);
        }

    } else if (theme === 'SNOW') {
        scene.background = new THREE.Color(0xc7ecee); scene.fog = new THREE.FogExp2(0xc7ecee, 0.03); mainLight.color.setHex(0xdff9fb);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0x81ecec, transparent: true, opacity: 0.7 }); 

        const snowmanBody = new THREE.Mesh(new THREE.SphereGeometry(2), blockMat);
        const snowmanHead = new THREE.Mesh(new THREE.SphereGeometry(1.2), blockMat);
        snowmanBody.position.set(25, 2, -15); snowmanHead.position.set(25, 4.5, -15);
        environmentGroup.add(snowmanBody, snowmanHead);

    } else if (theme === 'DESERT') {
        scene.background = new THREE.Color(0xfad390); scene.fog = new THREE.FogExp2(0xfad390, 0.02); mainLight.color.setHex(0xf8c291);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xe58e26, roughness: 1.0 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0xf6b93b, roughness: 0.9 }); 

        const pyramid = new THREE.Mesh(new THREE.ConeGeometry(10, 15, 4), blockMat);
        pyramid.position.set(-25, 5, -25); pyramid.rotation.y = Math.PI / 4;
        environmentGroup.add(pyramid);

    } else if (theme === 'RUINS') {
        scene.background = new THREE.Color(0x2d3436); scene.fog = new THREE.FogExp2(0x2d3436, 0.03); mainLight.color.setHex(0x636e72);
        blockMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 1.0 }); 

        for(let i=0; i<5; i++) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 8 + Math.random()*6, 2), blockMat);
            pillar.position.set(Math.cos(i) * 22, 4, Math.sin(i) * 22);
            pillar.rotation.y = Math.random(); pillar.rotation.z = (Math.random() - 0.5) * 0.3; 
            environmentGroup.add(pillar);
        }
    }

    const blockSize = 2; 
    const blockGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    
    for(let x = -16; x <= 16; x += blockSize) {
        for(let z = -16; z <= 16; z += blockSize) {
            let dist = Math.sqrt(x*x + z*z);
            if (dist > 16) continue; 

            let h = window.getTerrainHeight(x, z);
            let isAlt = (Math.abs(x) + Math.abs(z)) % 4 === 0;
            let mesh = new THREE.Mesh(blockGeo, isAlt ? subMat : blockMat);
            
            mesh.scale.y = 10 + h; 
            mesh.position.set(x, h - (10 + h)/2, z); 
            mesh.receiveShadow = true; mesh.castShadow = true;
            
            environmentGroup.add(mesh);
        }
    }

    let roundText = document.getElementById('roundText');
    if(roundText && roundText.innerText === "대기 중...") roundText.innerHTML = `[ <span style="color:#f1c40f;">${themeNames[theme]}</span> ] 전장 입장 완료!`;
}
