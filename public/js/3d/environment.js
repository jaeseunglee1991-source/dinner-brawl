// public/js/3d/environment.js

// 🗺️ 전장 중앙은 평평하게, 외곽은 얕은 계단으로 단차 생성
window.getTerrainHeight = function(x, z) {
    let dist = Math.sqrt(x*x + z*z);
    if (dist > 15) return -5; // 전장 밖은 절벽
    if (dist < 7) return 0;   // 중앙 평지
    
    // 무릎 높이(0.5 단위)의 얕은 계단화
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
        
        // ⭐️ 용암 수위를 올려서 블록 사이로 찰랑거리게 만듦
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), subMat);
        lava.rotation.x = -Math.PI / 2; lava.position.y = 0.3; environmentGroup.add(lava);

        // ⭐️ 화산을 화면 안쪽으로 당겨옴
        const volcano = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 16), blockMat);
        volcano.position.set(-14, 2, -14); environmentGroup.add(volcano);
        const lavaTip = new THREE.Mesh(new THREE.SphereGeometry(2), subMat);
        lavaTip.position.set(-14, 8, -14); environmentGroup.add(lavaTip);

    } else if (theme === 'OCEAN') {
        scene.background = new THREE.Color(0x7ed6df); scene.fog = new THREE.FogExp2(0x7ed6df, 0.02); mainLight.color.setHex(0xffffff);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.8 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0xbadc58, roughness: 1.0 }); 
        
        // ⭐️ 바닷물 수위를 올려서 해변가 느낌 극대화
        const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: 0x22a6b3, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2; water.position.y = 0.3; environmentGroup.add(water);

        // ⭐️ 야자수를 화면 안쪽으로 당겨옴
        for(let i=0; i<3; i++) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), new THREE.MeshStandardMaterial({color: 0x8b4513}));
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 5), subMat);
            trunk.position.set(13 - i*8, 2, -13 + i*5); leaves.position.set(13 - i*8, 6, -13 + i*5);
            environmentGroup.add(trunk, leaves);
        }

    } else if (theme === 'SNOW') {
        scene.background = new THREE.Color(0xc7ecee); scene.fog = new THREE.FogExp2(0xc7ecee, 0.03); mainLight.color.setHex(0xdff9fb);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0x81ecec, transparent: true, opacity: 0.7 }); 

        const snowmanBody = new THREE.Mesh(new THREE.SphereGeometry(2), blockMat);
        const snowmanHead = new THREE.Mesh(new THREE.SphereGeometry(1.2), blockMat);
        snowmanBody.position.set(14, 1, -10); snowmanHead.position.set(14, 3.5, -10);
        environmentGroup.add(snowmanBody, snowmanHead);

    } else if (theme === 'DESERT') {
        scene.background = new THREE.Color(0xfad390); scene.fog = new THREE.FogExp2(0xfad390, 0.02); mainLight.color.setHex(0xf8c291);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xe58e26, roughness: 1.0 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0xf6b93b, roughness: 0.9 }); 

        const pyramid = new THREE.Mesh(new THREE.ConeGeometry(10, 15, 4), blockMat);
        pyramid.position.set(-15, 5, -15); pyramid.rotation.y = Math.PI / 4;
        environmentGroup.add(pyramid);

    } else if (theme === 'RUINS') {
        scene.background = new THREE.Color(0x2d3436); scene.fog = new THREE.FogExp2(0x2d3436, 0.03); mainLight.color.setHex(0x636e72);
        blockMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 }); 
        subMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 1.0 }); 

        for(let i=0; i<5; i++) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 8 + Math.random()*6, 2), blockMat);
            pillar.position.set(Math.cos(i) * 14, 4, Math.sin(i) * 14);
            pillar.rotation.y = Math.random(); pillar.rotation.z = (Math.random() - 0.5) * 0.3; 
            environmentGroup.add(pillar);
        }
    }

    const blockSize = 2; 
    // 🛠️ 핵심 수정: 블록의 기본 높이를 1로 고정하여 윗면(Top) 계산이 오차 없이 떨어지게 함
    const blockGeo = new THREE.BoxGeometry(blockSize, 1, blockSize);
    
    for(let x = -16; x <= 16; x += blockSize) {
        for(let z = -16; z <= 16; z += blockSize) {
            let dist = Math.sqrt(x*x + z*z);
            if (dist > 15) continue; 

            let h = window.getTerrainHeight(x, z);
            let isAlt = (Math.abs(x) + Math.abs(z)) % 4 === 0;
            let mesh = new THREE.Mesh(blockGeo, isAlt ? subMat : blockMat);
            
            // 🛠️ 핵심 수정: 윗면이 무조건 정확한 고도(h)에 일치하도록 세팅
            mesh.scale.y = 10 + h; 
            mesh.position.set(x, h - (10 + h)/2, z); 
            mesh.receiveShadow = true; mesh.castShadow = true;
            
            environmentGroup.add(mesh);
        }
    }

    let roundText = document.getElementById('roundText');
    if(roundText && roundText.innerText === "대기 중...") roundText.innerHTML = `[ <span style="color:#f1c40f;">${themeNames[theme]}</span> ] 전장 입장 완료!`;
}
