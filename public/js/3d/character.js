// public/js/3d/character.js

const gltfLoader = new THREE.GLTFLoader();

function createDetailedCharacter(job, gradeColor) {
    const wrapper = new THREE.Group(); 
    
    // ⭐️ 스테이트 머신을 위한 전용 저장소
    wrapper.userData = { 
        mixer: null, 
        actions: {}, 
        currentAction: null 
    };

    const dummyGeo = new THREE.BoxGeometry(1, 2, 1);
    const dummyMat = new THREE.MeshBasicMaterial({ visible: false });
    wrapper.add(new THREE.Mesh(dummyGeo, dummyMat));

    // 여러 애니메이션이 하나로 합쳐진 모델 경로 (예시)
    const modelPath = '/models/character.glb';

    gltfLoader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.015, 0.015, 0.015);
        model.position.y = 1.1; // 발바닥 오프셋
        
        model.traverse((child) => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });

        const mixer = new THREE.AnimationMixer(model);
        wrapper.userData.mixer = mixer;

        // ⭐️ 파일 안의 모든 애니메이션 클립을 꺼내서 저장
        gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            // 클립의 이름(예: 'Idle', 'Run', 'Attack')을 통일해두면 편합니다.
            wrapper.userData.actions[clip.name] = action;
        });

        // ⭐️ 기본 상태를 'Idle(대기)'로 시작
        if(wrapper.userData.actions['Idle']) {
            wrapper.userData.actions['Idle'].play();
            wrapper.userData.currentAction = wrapper.userData.actions['Idle'];
        } else if(gltf.animations.length > 0) {
            const firstAction = mixer.clipAction(gltf.animations[0]);
            firstAction.play();
            wrapper.userData.currentAction = firstAction;
        }

        wrapper.add(model);
    });

    // ⭐️ 핵심 로직: 모션 부드럽게 섞기 (CrossFade)
    wrapper.userData.changeState = function(stateName) {
        const newAction = this.actions[stateName];
        const oldAction = this.currentAction;

        // 해당 모션이 없거나, 이미 재생 중인 모션이면 무시
        if (!newAction || newAction === oldAction) return;

        // 공격 모션은 1번만 재생되도록 설정 (반복 안 함)
        if (stateName === 'Attack') {
            newAction.setLoop(THREE.LoopOnce, 1);
            newAction.clampWhenFinished = true; // 끝나면 마지막 프레임에 정지
        } else {
            newAction.setLoop(THREE.LoopRepeat, Infinity); // 달리기, 대기는 무한 반복
        }

        newAction.reset();
        newAction.play();
        
        // 0.2초 동안 자연스럽게 이전 모션에서 새 모션으로 전환
        if (oldAction) {
            newAction.crossFadeFrom(oldAction, 0.2, true);
        }

        this.currentAction = newAction;
    };

    return wrapper;
}
