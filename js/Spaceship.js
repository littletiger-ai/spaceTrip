import * as THREE from 'three';

export class Spaceship {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.speed = 0;
        this.maxSpeed = 100;
        this.acceleration = 30;
        this.rotationSpeed = 2.0;
        this.friction = 0.98; // Simple damping

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
        
        // Start near "Earth" (we will place planets later)
        this.mesh.position.set(100, 0, 100); 

        this.keys = {
            forward: false, // Now map to Space
            brake: false,   // Now map to Enter
            pitchUp: false, // Up Arrow / W
            pitchDown: false, // Down Arrow / S
            left: false,    // Left Arrow / A
            right: false,   // Right Arrow / D
            boost: false    // Maybe Shift? Or keep Space as boost+forward
        };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Rocket Body (Cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.8, 1, 6, 16);
        bodyGeo.rotateX(Math.PI / 2); // Cylinder points up Y, rotate to point along Z
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeee, 
            roughness: 0.3, 
            metalness: 0.5 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Nose Cone
        const noseGeo = new THREE.ConeGeometry(0.8, 2, 16);
        noseGeo.rotateX(-Math.PI / 2); // Point to -Z
        noseGeo.translate(0, 0, -4); // Move to front
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        group.add(nose);

        // Fins
        const finShape = new THREE.Shape();
        finShape.moveTo(0, 0);
        finShape.lineTo(0, 2);
        finShape.lineTo(1.5, 0.5);
        finShape.lineTo(1.5, -0.5);
        finShape.lineTo(0, -2);
        finShape.lineTo(0, 0);

        const finExtrudeSettings = {
            steps: 1,
            depth: 0.2,
            bevelEnabled: false
        };
        const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
        const finMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.z = 2.5; // Back of the rocket
            fin.rotation.z = (Math.PI / 2) * i;
            // Align fin correctly
            fin.rotateY(Math.PI / 2); 
            fin.translateZ(0.8); // Move out from center
            group.add(fin);
        }

        // Engine Nozzle
        const engineGeo = new THREE.CylinderGeometry(0.6, 1.0, 1, 16, 1, true);
        engineGeo.rotateX(Math.PI / 2);
        engineGeo.translate(0, 0, 3.5);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const nozzle = new THREE.Mesh(engineGeo, engineMat);
        group.add(nozzle);

        // Engine Glow Mesh
        const glowGeo = new THREE.CylinderGeometry(0.4, 0.8, 1.5, 8);
        glowGeo.rotateX(Math.PI / 2);
        glowGeo.translate(0, 0, 4.0);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        this.engineMesh = new THREE.Mesh(glowGeo, glowMat);
        group.add(this.engineMesh);

        return group;
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.keys.pitchUp = true; break;
            case 'ArrowDown':
            case 'KeyS': this.keys.pitchDown = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.keys.left = true; break;
            case 'ArrowRight':
            case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.forward = true; break; // Space to Accelerate
            case 'Enter': this.keys.brake = true; break; // Enter to Decelerate
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.keys.pitchUp = false; break;
            case 'ArrowDown':
            case 'KeyS': this.keys.pitchDown = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.keys.left = false; break;
            case 'ArrowRight':
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.forward = false; break;
            case 'Enter': this.keys.brake = false; break;
        }
    }

    update(delta) {
        // Rotation (Yaw)
        if (this.keys.left) {
            this.mesh.rotateY(this.rotationSpeed * delta);
        }
        if (this.keys.right) {
            this.mesh.rotateY(-this.rotationSpeed * delta);
        }

        // Rotation (Pitch)
        if (this.keys.pitchUp) {
            this.mesh.rotateX(this.rotationSpeed * delta); // Rotate UP (around local X)
        }
        if (this.keys.pitchDown) {
            this.mesh.rotateX(-this.rotationSpeed * delta); // Rotate DOWN
        }

        // Acceleration
        if (this.keys.forward) {
            // Space is pressed, accelerate
            this.speed += this.acceleration * delta;
        } else if (this.keys.brake) {
            // Enter is pressed, decelerate quickly
            this.speed -= this.acceleration * 2 * delta;
        } else {
            // Drag / Inertia
            // Keep some speed if nothing pressed, but slowly decay
            // If user wants to cruise, they can tap space. 
            // Let's make drag very low so it feels like space
            this.speed -= this.speed * 0.1 * delta; 
        }

        // Engine visual
        if (this.keys.forward) {
            this.engineMesh.scale.setScalar(1.0 + Math.random() * 0.2);
            this.engineMesh.material.color.setHex(0x00ffff); // Boost color default
        } else {
            this.engineMesh.scale.setScalar(1.0);
            this.engineMesh.material.color.setHex(0x550000);
        }

        // Clamp speed
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed)); // No reverse for now, just brake to stop

        // Move
        const direction = new THREE.Vector3(0, 0, -1); // Forward is -Z
        direction.applyQuaternion(this.mesh.quaternion);
        direction.multiplyScalar(this.speed * delta);
        
        this.mesh.position.add(direction);

        // Camera Follow Logic
        this.updateCamera(delta);
    }

    updateCamera(delta) {
        // Calculate ideal offset relative to ship
        const offset = new THREE.Vector3(0, 5, 12);
        offset.applyQuaternion(this.mesh.quaternion);
        const idealPosition = this.mesh.position.clone().add(offset);
        
        // Lerp camera position
        // We need to update up vector to match ship's up vector for rolling/pitching to feel right?
        // Actually, for third person space shooter, usually camera Up stays loosely aligned or follows ship up.
        // Let's make camera follow position smoothly.
        this.camera.position.lerp(idealPosition, 5.0 * delta);
        
        // Camera LookAt
        const lookTarget = this.mesh.position.clone().add(
            new THREE.Vector3(0, 0, -20).applyQuaternion(this.mesh.quaternion)
        );
        this.camera.lookAt(lookTarget);

        // Optional: Sync camera up vector with ship up vector to prevent gimbal lock or weird views
        // But doing it instantly might be dizzy.
        // Let's try to slerp the up vector too?
        // Or simpler: just let lookAt handle orientation, but if we pitch up 90 degrees, camera might flip.
        // For full 6DOF, camera.up needs to follow ship.up
        const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
        this.camera.up.lerp(shipUp, 2.0 * delta);
    }
}
