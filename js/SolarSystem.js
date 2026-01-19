import * as THREE from 'three';
import { Planet } from './Planet.js';

export class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        
        this.initPlanets();
        this.initAsteroids();
    }

    initPlanets() {
        // Sun
        const sun = new Planet(this.scene, {
            name: '太阳',
            radius: 40,
            distance: 0,
            color: 0xffaa00,
            speed: 0,
            isStar: true
        });
        this.planets.push(sun);

        const planetData = [
            { name: '水星', radius: 4, distance: 70, color: 0xaaaaaa, speed: 1.5, type: 'terrestrial' },
            { name: '金星', radius: 9, distance: 100, color: 0xeebb00, speed: 1.2, type: 'gas' },
            { name: '地球', radius: 10, distance: 140, color: 0x2233ff, speed: 1.0, type: 'terrestrial', moons: [
                { name: '月球', radius: 2, distance: 16, color: 0x888888, speed: 2 }
            ]},
            { name: '火星', radius: 5, distance: 180, color: 0xff3300, speed: 0.8, type: 'terrestrial', moons: [
                 { name: '火卫一', radius: 1, distance: 8, color: 0x555555, speed: 3 },
                 { name: '火卫二', radius: 0.8, distance: 10, color: 0x555555, speed: 2.5 }
            ]},
            { name: '木星', radius: 25, distance: 260, color: 0xdcae86, speed: 0.5, type: 'gas', moons: [
                { name: '木卫一', radius: 1.5, distance: 30, color: 0xffffaa, speed: 1.5 },
                { name: '木卫二', radius: 1.2, distance: 35, color: 0xaaffff, speed: 1.2 }
            ]},
            { name: '土星', radius: 22, distance: 360, color: 0xeaddcc, speed: 0.4, type: 'gas', moons: [
                { name: '土卫六', radius: 2, distance: 30, color: 0xffaa00, speed: 1.0 }
            ]},
            { name: '天王星', radius: 12, distance: 450, color: 0x88ffff, speed: 0.3, type: 'gas' },
            { name: '海王星', radius: 11, distance: 540, color: 0x3333ff, speed: 0.25, type: 'gas' },
            { name: '冥王星', radius: 3, distance: 620, color: 0x998877, speed: 0.2, type: 'terrestrial' }
        ];

        planetData.forEach(data => {
            const planet = new Planet(this.scene, data);
            this.planets.push(planet);
        });
    }

    initAsteroids() {
        const count = 1000;
        const geometry = new THREE.DodecahedronGeometry(1, 0); 
        // Lighter color and less roughness to catch more light
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            roughness: 0.6,
            metalness: 0.2
        });
        
        this.asteroidMesh = new THREE.InstancedMesh(geometry, material, count);
        this.scene.add(this.asteroidMesh);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            // Main Belt
            let dist = 210 + Math.random() * 50;
            // Kuiper Belt (outside Neptune)
            if (Math.random() > 0.7) dist = 600 + Math.random() * 200;
            // Random space debris
            if (Math.random() > 0.95) dist = Math.random() * 800;

            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = (Math.random() - 0.5) * (dist * 0.1); // Spread vertically more as we go out

            dummy.position.set(x, y, z);
            
            const scale = Math.random() * 2 + 0.5;
            dummy.scale.set(scale, scale, scale);
            
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
            dummy.updateMatrix();
            this.asteroidMesh.setMatrixAt(i, dummy.matrix);
        }
    }

    update(delta) {
        this.planets.forEach(p => p.update(delta));
        this.asteroidMesh.rotation.y += delta * 0.02;
    }
}
