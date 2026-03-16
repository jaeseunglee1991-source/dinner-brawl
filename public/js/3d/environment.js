// public/js/3d/environment.js

// 🗺️ X, Z 좌표에 따른 지형의 높이(단차)를 수학적으로 계산하는 함수
window.getTerrainHeight = function(x, z) {
    let dist = Math.sqrt(x*x + z*z);
    if (dist > 18) return -10; // 전장 밖은 절벽
    
    // 사인파를 이용해 울퉁불퉁한 계단식 고저차 생성
    let h = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 3.0;
    // 중앙은 약간 평평하게, 외곽은 조금 높게
    h += (dist * 0.1);
    
    return Math.floor(h); // 소수점을 버려 딱딱 떨어지는 '계단(단차)' 형태 생성
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

    // 🎨 테마별 색상 및 조명 세팅
    if (theme === 'VOLCANO') {
        scene.background = new THREE.Color(0x2c0500); scene.fog = new THREE.FogExp2(0x2c0500, 0.02); mainLight.color.setHex(0xff7979);
        blockMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 1.0 }); // 화산암
        subMat = new THREE.MeshBasicMaterial({ color: 0xff4757 }); // 용암
        
        // 배경 바닥 (용암)
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), subMat);
        lava.rotation.x = -Math.PI / 2; lava.position.y = -3; environmentGroup.add(lava);

        // 🌋 화산 오브젝트 생성
        const volcano = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 16), blockMat);
        volcano.position.set(-25, 2, -25); environmentGroup.add(volcano);
        const lavaTip = new THREE.Mesh(new THREE.SphereGeometry(2), subMat);
        lavaTip.position.set(-25, 8, -25); environmentGroup.add(lavaTip);

    } else if (theme === 'OCEAN') {
        scene.background = new THREE.Color(0x7ed6df); scene.fog = new THREE.FogExp2(0x7ed6df, 0.02); mainLight.color.setHex(0xffffff);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.8 }); // 모래
        subMat = new THREE.MeshStandardMaterial({ color: 0xbadc58, roughness: 1.0 }); // 풀밭
        
        const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: 0x22a6b3, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2; water.position.y = -1; environmentGroup.add(water);

        // 🌴 야자수 오브젝트
        for(let i=0; i<3; i++) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), new THREE.MeshStandardMaterial({color: 0x8b4513}));
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 5), subMat);
            trunk.position.set(20 - i*15, 2, -25 + i*5); leaves.position.set(20 - i*15, 6, -25 + i*5);
            environmentGroup.add(trunk, leaves);
        }

    } else if (theme === 'SNOW') {
        scene.background = new THREE.Color(0xc7ecee); scene.fog = new THREE.FogExp2(0xc7ecee, 0.03); mainLight.color.setHex(0xdff9fb);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); // 눈
        subMat = new THREE.MeshStandardMaterial({ color: 0x81ecec, transparent: true, opacity: 0.7 }); // 얼음

        // ⛄ 눈사람 오브젝트
        const snowmanBody = new THREE.Mesh(new THREE.SphereGeometry(2), blockMat);
        const snowmanHead = new THREE.Mesh(new THREE.SphereGeometry(1.2), blockMat);
        snowmanBody.position.set(25, 2, -15); snowmanHead.position.set(25, 4.5, -15);
        environmentGroup.add(snowmanBody, snowmanHead);

    } else if (theme === 'DESERT') {
        scene.background = new THREE.Color(0xfad390); scene.fog = new THREE.FogExp2(0xfad390, 0.02); mainLight.color.setHex(0xf8c291);
        blockMat = new THREE.MeshStandardMaterial({ color: 0xe58e26, roughness: 1.0 }); // 짙은 모래
        subMat = new THREE.MeshStandardMaterial({ color: 0xf6b93b, roughness: 0.9 }); // 밝은 모래

        // 🔺 피라미드 오브젝트
        const pyramid = new THREE.Mesh(new THREE.ConeGeometry(10, 15, 4), blockMat);
        pyramid.position.set(-25, 5, -25); pyramid.rotation.y = Math.PI / 4;
        environmentGroup.add(pyramid);

    } else if (theme === 'RUINS') {
        scene.background = new THREE.Color(0x2d3436); scene.fog = new THREE.FogExp2(0x2d3436, 0.03); mainLight.color.setHex(0x636e72);
        blockMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 }); // 돌
        subMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 1.0 }); // 어두운 돌

        // 🏛️ 고대 부서진 기둥들
        for(let i=0; i<5; i++) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 8 + Math.random()*6, 2), blockMat);
            pillar.position.set(Math.cos(i) * 22, 4, Math.sin(i) * 22);
            pillar.rotation.y = Math.random(); pillar.rotation.z = (Math.random() - 0.5) * 0.3; // 살짝 기울어짐
            environmentGroup.add(pillar);
        }
    }

    // 🧱 격자형(Voxel) 단차 지형 생성
    const blockSize = 2; // 블록 1개의 크기
    const blockGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    
    // -18 부터 +18 까지 2씩 증가하며 격자 생성
    for(let x = -18; x <= 18; x += blockSize) {
        for(let z = -18; z <= 18; z += blockSize) {
            let dist = Math.sqrt(x*x + z*z);
            if (dist > 18) continue; // 원형 투기장 형태 유지

            // 우리가 위에서 만든 수학 공식으로 해당 위치의 높이를 가져옴
            let h = window.getTerrainHeight(x, z);
            
            // 바둑판 무늬를 위해 번갈아가며 재질 적용
            let isAlt = (Math.abs(x) + Math.abs(z)) % 4 === 0;
            let mesh = new THREE.Mesh(blockGeo, isAlt ? subMat : blockMat);
            
            // 높이에 맞춰 블록 배치 (바닥을 꽉 채우기 위해 아래로 길게 늘림)
            mesh.scale.y = 5 + h; 
            mesh.position.set(x, h - (5 + h)/2 + 1, z);
            mesh.receiveShadow = true; mesh.castShadow = true;
            
            environmentGroup.add(mesh);
        }
    }

    let roundText = document.getElementById('roundText');
    if(roundText && roundText.innerText === "대기 중...") roundText.innerHTML = `[ <span style="color:#f1c40f;">${themeNames[theme]}</span> ] 전장 입장 완료!`;
}
