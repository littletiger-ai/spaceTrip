import * as THREE from 'three';
import { Spaceship } from './js/Spaceship.js';
import { SolarSystem } from './js/SolarSystem.js';

// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.0002);

// Stars Background
const starGeo = new THREE.BufferGeometry();
const starCount = 10000;
const posArray = new Float32Array(starCount * 3);
for(let i=0; i<starCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 4000; // Large area
}
starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starMat = new THREE.PointsMaterial({
    size: 1.5, 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// Camera & Renderer
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2.0); // Increased intensity
scene.add(ambientLight);

// Game Objects
const solarSystem = new SolarSystem(scene);
const spaceship = new Spaceship(scene, camera);

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();

    spaceship.update(delta);
    solarSystem.update(delta);

    renderer.render(scene, camera);
}

animate();
