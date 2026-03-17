// public/js/3d/character.js

// GLTF 로더 전역 생성
const gltfLoader = new THREE.GLTFLoader();

function createDetailedCharacter(job, gradeColor) {
    const wrapper = new THREE.Group(); 
    
    // 모델이 로드되기 전까지 보여줄 임시 더미(투명 박스)
    const dummyGeo = new THREE.BoxGeometry(1, 2, 1);
    const dummyMat = new THREE.MeshBasicMaterial({ visible: false });
    const dummyMesh = new THREE.Mesh(dummyGeo, dummyMat);
    wrapper.add(dummyMesh);

    // ⭐️ Step 2에서 저장한 파일 경로를 적어줍니다.
    const modelPath = '/models/idle.glb';

    gltfLoader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        
        // 믹사모 모델은 보통 크기가 커서 스케일을 줄여야 맞습니다. (상황에 맞춰 조절)
        model.scale.set(0.015, 0.015, 0.015);
        
        // 모델 전체에 그림자 적용
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // 애니메이션 믹서(재생기) 세팅
        const mixer = new THREE.AnimationMixer(model);
        if (gltf.animations && gltf.animations.length > 0) {
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }

        // 렌더링 루프에서 애니메이션을 업데이트할 수 있도록 wrapper에 저장
        wrapper.userData.mixer = mixer;
        
        wrapper.add(model);
    }, undefined, (error) => {
        console.error('모델 로드 실패:', error);
    });
    
    return wrapper;
}
