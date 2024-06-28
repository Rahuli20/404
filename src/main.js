import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Physics setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({ mass: 0 });
floorBody.addShape(floorShape);
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);

// Load model
const loader = new GLTFLoader();
loader.load('src/BURGER.glb', function(gltf) {
    const model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Set color
        }
    });

    // Add physics body for the model
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)); // Adjust dimensions if necessary
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(0, 10, 0);
    world.addBody(body);

    // Store model and body
    model.userData.body = body;
    scene.add(model);

    animate();
}, undefined, function(error) {
    console.error(error);
});

// Camera positioning
camera.position.z = 5;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update physics
    world.step(1 / 60);

    // Update model positions based on physics
    scene.children.forEach(child => {
        if (child.userData.body) {
            child.position.copy(child.userData.body.position);
            child.quaternion.copy(child.userData.body.quaternion);
        }
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseDown(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const body = intersect.object.userData.body;

        if (body) {
            // Apply a force to the body
            const force = new CANNON.Vec3(mouse.x * 10, mouse.y * 10, 0);
            body.applyImpulse(force, body.position);
        }
    }
}

window.addEventListener('mousedown', onMouseDown);