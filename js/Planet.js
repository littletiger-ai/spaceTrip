import * as THREE from 'three';

export class Planet {
    constructor(parentObject, config) {
        this.parentObject = parentObject;
        this.config = config; // { name, radius, distance, color, speed, moons: [], isStar: bool, type: 'gas'|'terrestrial' }
        this.angle = Math.random() * Math.PI * 2;
        
        // This group holds the planet mesh and any children (moons)
        // It moves to the orbital position
        this.systemGroup = new THREE.Group();
        this.parentObject.add(this.systemGroup);

        this.mesh = this.createMesh();
        this.systemGroup.add(this.mesh);

        // Label
        this.createLabel();

        // Moons
        this.moons = [];
        if (config.moons) {
            config.moons.forEach(moonConfig => {
                const moon = new Planet(this.systemGroup, { 
                    ...moonConfig, 
                    type: 'terrestrial', // Moons are usually terrestrial
                    speed: moonConfig.speed * 4 // Faster orbits
                });
                this.moons.push(moon);
            });
        }

        // Orbit Line
        this.createOrbit();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.config.radius, 32, 32);
        const texture = this.generateTexture();
        
        let material;
        if (this.config.isStar) {
            material = new THREE.MeshBasicMaterial({ 
                color: this.config.color,
                map: texture
            });
            // Add a glow sprite or point light
            const light = new THREE.PointLight(this.config.color, 3, 0, 0); // Increased intensity, decay 0
            this.systemGroup.add(light);
            
            // Add a glow mesh (slightly larger)
            const glowGeo = new THREE.SphereGeometry(this.config.radius * 1.2, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: this.config.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            this.systemGroup.add(glow);

        } else {
            material = new THREE.MeshStandardMaterial({ 
                map: texture,
                roughness: 0.7,
                metalness: 0.2,
                color: 0xffffff,
                emissive: this.config.color,
                emissiveIntensity: 0.15 // Give it a slight self-illumination so color is visible even in shadow
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    generateTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const color = new THREE.Color(this.config.color);
        const r = Math.floor(color.r * 255);
        const g = Math.floor(color.g * 255);
        const b = Math.floor(color.b * 255);

        // Background - Make it slightly lighter base
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, size, size);

        // Procedural Details
        if (this.config.type === 'gas' || this.config.isStar) {
            // Stripes/Noise for Gas Giants or Sun
            ctx.globalCompositeOperation = 'overlay'; // Use overlay instead of multiply to keep colors vibrant
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
                const y = Math.random() * size;
                const h = Math.random() * 100;
                ctx.fillRect(0, y, size, h);
            }
             ctx.globalCompositeOperation = 'multiply';
             for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
                const y = Math.random() * size;
                const h = Math.random() * 100;
                ctx.fillRect(0, y, size, h);
            }
        } else {
            // Craters/Patches for Terrestrial
            ctx.globalCompositeOperation = 'multiply';
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const rad = Math.random() * 30 + 5;
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,0,0,0.1)`; // Lighter shadows
                ctx.fill();
            }
            // Add some highlights
             ctx.globalCompositeOperation = 'overlay';
             for (let i = 0; i < 20; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const rad = Math.random() * 20 + 5;
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,0.1)`;
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createLabel() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // High resolution for clear text
        const fontSize = 48;
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Heiti SC", sans-serif`;
        
        const text = this.config.name;
        const textWidth = ctx.measureText(text).width;
        
        canvas.width = textWidth + 20;
        canvas.height = fontSize + 20;
        
        // Re-set font after resize
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Heiti SC", sans-serif`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.fillRect(0, 0, canvas.width, canvas.height); // Optional background
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Stroke
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
        
        // Fill
        ctx.fillStyle = 'white';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        
        // Scale sprite based on text aspect ratio
        const scale = this.config.radius * 3; // Base scale on planet radius
        // Ensure minimum size for visibility
        const minScale = 10;
        const finalScale = Math.max(scale, minScale);
        
        sprite.scale.set(finalScale * (canvas.width / canvas.height), finalScale, 1);
        sprite.position.y = this.config.radius + finalScale * 0.6; // Position above planet
        
        this.systemGroup.add(sprite);
    }

    createOrbit() {
        if (this.config.distance > 0) {
            const curve = new THREE.EllipseCurve(
                0, 0,
                this.config.distance, this.config.distance,
                0, 2 * Math.PI,
                false,
                0
            );
            const points = curve.getPoints(128);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            geometry.rotateX(Math.PI / 2);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x444444, // Slightly brighter orbit lines
                transparent: true, 
                opacity: 0.3 
            });
            const orbit = new THREE.Line(geometry, material);
            this.parentObject.add(orbit);
        }
    }

    update(delta) {
        // Orbit
        if (this.config.distance > 0) {
            this.angle += this.config.speed * delta * 0.2;
            const x = Math.cos(this.angle) * this.config.distance;
            const z = Math.sin(this.angle) * this.config.distance;
            this.systemGroup.position.set(x, 0, z);
        }

        // Self Rotation
        this.mesh.rotation.y += delta * 0.5;

        // Update Moons
        this.moons.forEach(moon => moon.update(delta));
    }
}
