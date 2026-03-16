function buildEnvironment(roomId) {
    if (!roomId) return;
    
    while(environmentGroup.children.length > 0){ environmentGroup.remove(environmentGroup.children[0]); }

    let hash = 0;
    for (let i = 0; i < roomId.length; i++) hash += roomId.charCodeAt(i);
    const themes = ['VOLCANO', 'OCEAN', 'SNOW', 'DESERT', 'RUINS'];
    const themeNames = { 'VOLCANO': '🌋 끓어오르는 화산', 'OCEAN': '🌊 푸른 바다 위', 'SNOW': '❄️ 혹한의 설원', 'DESERT': '🏜️ 작열하는 사막', 'RUINS': '🏛️ 잊혀진 고대 유적' };
    const theme = themes[hash % themes.length];

    const arenaGeo = new THREE.CylinderGeometry(18, 16, 2, 64);
    let arenaMat;

    if (theme === 'VOLCANO') {
        scene.background = new THREE.Color(0x2c0500); scene.fog = new THREE.FogExp2(0x2c0500, 0.025); mainLight.color.setHex(0xffa502);
        arenaMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, roughness: 1.0 });
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
        lava.rotation.x = -Math.PI / 2; lava.position.y = -5; environmentGroup.add(lava);
    } else if (theme === 'OCEAN') {
        scene.background = new THREE.Color(0x7ed6df); scene.fog = new THREE.FogExp2(0x7ed6df, 0.02); mainLight.color.setHex(0xffffff);
        arenaMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f6, roughness: 0.3 });
        const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: 0x22a6b3, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2; water.position.y = -3; environmentGroup.add(water);
    } else if (theme === 'SNOW') {
        scene.background = new THREE.Color(0xc7ecee); scene.fog = new THREE.FogExp2(0xc7ecee, 0.035); mainLight.color.setHex(0xdff9fb);
        arenaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    } else if (theme === 'DESERT') {
        scene.background = new THREE.Color(0xf6e58d); scene.fog = new THREE.FogExp2(0xf6e58d, 0.03); mainLight.color.setHex(0xfad390);
        arenaMat = new THREE.MeshStandardMaterial({ color: 0xe58e26, roughness: 1.0 });
    } else if (theme === 'RUINS') {
        scene.background = new THREE.Color(0x2d3436); scene.fog = new THREE.FogExp2(0x2d3436, 0.035); mainLight.color.setHex(0xb2bec3);
        arenaMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.9 });
        for(let i=0; i<6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 6 + Math.random()*5, 2), arenaMat);
            pillar.position.set(Math.cos(angle) * 16, 2, Math.sin(angle) * 16);
            pillar.rotation.y = Math.random(); pillar.castShadow = true; pillar.receiveShadow = true;
            environmentGroup.add(pillar);
        }
    }

    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = -1; arena.receiveShadow = true;
    environmentGroup.add(arena);

    let roundText = document.getElementById('roundText');
    if(roundText && roundText.innerText === "대기 중...") roundText.innerHTML = `[ <span style="color:#f1c40f;">${themeNames[theme]}</span> ] 전장 입장 완료!`;
}
