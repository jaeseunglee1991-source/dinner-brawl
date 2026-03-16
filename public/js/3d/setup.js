canvas = document.getElementById('gameCanvas');
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(15, 25, 15);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

camera.position.set(0, 22, 25);
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
