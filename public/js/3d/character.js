// public/js/3d/character.js

function createDetailedCharacter(job, gradeColor) {
    const wrapper = new THREE.Group(); 
    const group = new THREE.Group(); 

    const matBody = new THREE.MeshStandardMaterial({ color: gradeColor, roughness: 0.6 });
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.8, roughness: 0.3 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.9 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const matMagic = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const matRage = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), matSkin); head.position.y = 1.2; group.add(head);
    
    // 몸통(원기둥)의 높이는 0.8이고 중심이 0.4에 있으므로, 발바닥은 정확히 Y = 0 입니다.
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.8, 16), matBody); torso.position.y = 0.4; group.add(torso);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), matBody); armL.position.set(-0.5, 0.6, 0); armL.rotation.z = Math.PI/6; group.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), matBody); armR.position.set(0.5, 0.6, 0); armR.rotation.z = -Math.PI/6; group.add(armR);

    if (job === '전사') {
        const helm = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32, 0, Math.PI*2, 0, Math.PI/2), matMetal); helm.position.y = 1.2; group.add(helm);
        const sword = new THREE.Group(); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.05), matMetal); const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matGold); const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), matDark);
        blade.position.y = 0.6; grip.position.y = -0.15; sword.add(blade, guard, grip); sword.position.set(0.7, 0.5, 0.2); sword.rotation.x = Math.PI/4; group.add(sword);
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32), matMetal); shield.rotation.x = Math.PI/2; shield.rotation.y = Math.PI; shield.position.set(-0.6, 0.4, 0.3); group.add(shield);
    } 
    else if (job === '마법사') {
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 32), matDark); hat.position.y = 2.0; group.add(hat);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 32), matDark); brim.position.y = 1.45; group.add(brim);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), matWood); const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2), matMagic);
        orb.position.y = 0.8; staff.add(orb); staff.position.set(0.7, 0.5, 0.2); group.add(staff);
    }
    else if (job === '도적') {
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), matDark); hood.position.y = 1.2; group.add(hood);
        const dagger = new THREE.Group(); const dBlade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6), matMetal); dBlade.position.y = 0.3; dagger.add(dBlade);
        const daggerL = dagger.clone(); daggerL.position.set(-0.7, 0.5, 0.2); daggerL.rotation.x = Math.PI/4; group.add(daggerL);
        const daggerR = dagger.clone(); daggerR.position.set(0.7, 0.5, 0.2); daggerR.rotation.x = Math.PI/4; group.add(daggerR);
    }
    else if (job === '사제') {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 16, 32), matGold); halo.position.y = 2.0; halo.rotation.x = Math.PI/2; group.add(halo);
        const cross = new THREE.Group(); const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), matGold); const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), matGold);
        c2.position.y = 0.3; cross.add(c1, c2); cross.position.set(0.7, 0.5, 0.2); group.add(cross);
    }
    else if (job === '버서커') {
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1), matRage); eyeL.position.set(-0.2, 1.3, 0.55); group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1), matRage); eyeR.position.set(0.2, 1.3, 0.55); group.add(eyeR);
        const axe = new THREE.Group(); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), matWood); const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), matMetal);
        head1.position.set(0.3, 0.3, 0); handle.add(head1); axe.add(handle);
        const axeL = axe.clone(); axeL.position.set(-0.7, 0.5, 0.2); group.add(axeL);
        const axeR = axe.clone(); axeR.position.set(0.7, 0.5, 0.2); axeR.rotation.y = Math.PI; group.add(axeR);
    }
    else if (job === '탱커') {
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.6), matMetal); shoulder.position.y = 0.8; group.add(shoulder);
        const tShield = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.1), matMetal); tShield.position.set(0, 0.4, 0.5); group.add(tShield);
    }
    else if (job === '궁수') {
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 16, 32, Math.PI), matWood); bow.rotation.z = -Math.PI/2; bow.position.set(0.7, 0.5, 0.2); group.add(bow);
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.8), matWood); quiver.position.set(0, 0.5, -0.4); quiver.rotation.z = Math.PI/6; group.add(quiver);
    }
    else if (job === '팔라딘') {
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.45), matGold); chestPlate.position.y = 0.4; group.add(chestPlate);
        const hammer = new THREE.Group(); const hHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), matDark); const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), matMetal);
        hHead.position.y = 0.5; hammer.add(hHandle, hHead); hammer.position.set(0.7, 0.5, 0.2); group.add(hammer);
    }
    else if (job === '암살자') {
        const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.61, 0.2, 32), matDark); mask.position.y = 1.2; group.add(mask);
        const shuriken = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 4), matMetal); shuriken.rotation.x = Math.PI/2; shuriken.position.set(0, 0.5, -0.4); group.add(shuriken);
    }
    else if (job === '요리사') {
        const cHatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4), matWhite); cHatBase.position.y = 1.7; group.add(cHatBase);
        const cHatTop = new THREE.Mesh(new THREE.SphereGeometry(0.5), matWhite); cHatTop.position.y = 2.0; cHatTop.scale.set(1, 0.6, 1); group.add(cHatTop);
        const pan = new THREE.Group(); const pHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), matDark); const pHead = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.05, 16), matDark);
        pHead.position.y = 0.3; pHead.rotation.x = Math.PI/2; pan.add(pHandle, pHead); pan.position.set(0.7, 0.5, 0.2); pan.rotation.x = Math.PI/4; group.add(pan);
    }

    group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    
    // 🛠️ 핵심 수정: 발바닥 오프셋(+1.1)을 아예 지워버려서, 캐릭터의 발이 블록 윗면에 정확하게 밀착되게 만듦!
    wrapper.add(group);
    wrapper.scale.set(1.8, 1.8, 1.8);
    
    return wrapper;
}
