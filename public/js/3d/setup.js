// public/js/3d/setup.js

canvas = document.getElementById('gameCanvas');
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(15, 30, 15);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048; // 그림자 해상도 증가
mainLight.shadow.mapSize.height = 2048;

// 🛠️ 그림자가 맵 전체를 완벽하게 덮도록 범위 확장
mainLight.shadow.camera.left = -25;
mainLight.shadow.camera.right = 25;
mainLight.shadow.camera.top = 25;
mainLight.shadow.camera.bottom = -25;
scene.add(mainLight);

// 🛠️ 카메라를 더 높게(Y: 35) 띄우고 앞당겨서(Z: 25) 맵 전체와 장식물들이 모두 보이게 함
camera.position.set(0, 35, 25);
camera.lookAt(0, 0, 0);

environmentGroup = new THREE.Group();
scene.add(environmentGroup);

function resizeCanvas() { 
    const container = document.getElementById('battleContainer');
    if(!container) return;
    const w = container.clientWidth; const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);
