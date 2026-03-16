function showDamageText(mesh, text, color, isCrit) {
    const vector = new THREE.Vector3();
    mesh.getWorldPosition(vector);
    vector.y += 2; 
    vector.project(camera);
    
    const container = document.getElementById('battleContainer');
    const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * container.clientHeight;
    
    const div = document.createElement('div'); div.innerText = text;
    div.style.position = 'absolute'; div.style.left = x + 'px'; div.style.top = y + 'px';
    div.style.color = color; div.style.fontWeight = 'bold';
    div.style.fontSize = isCrit ? '32px' : '20px'; div.style.pointerEvents = 'none'; 
    div.style.textShadow = '2px 2px 5px rgba(0,0,0,0.8)'; 
    div.style.transition = 'all 0.8s cubic-bezier(0.25, 1.5, 0.5, 1)'; div.style.zIndex = '100';
    div.style.transform = 'translate(-50%, -50%)'; 
    
    container.appendChild(div);
    
    setTimeout(() => { 
        div.style.top = (y - 80) + 'px'; 
        div.style.transform = 'translate(-50%, -50%) scale(1.2)';
        div.style.opacity = '0'; 
    }, 50);
    setTimeout(() => div.remove(), 850);
}
