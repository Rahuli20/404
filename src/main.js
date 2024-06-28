import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import * as CANNON from 'cannon-es';

const canvas = document.getElementById('myCanvas');
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2, window.innerWidth / 2,
  window.innerHeight / 2, window.innerHeight / -2, 
  1, 1000
);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.z = 500;

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

// Add directional light for shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, 100);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Set up shadow properties for the light
directionalLight.shadow.mapSize.width = 1024; // default
directionalLight.shadow.mapSize.height = 1024; // default
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 500; // default

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -2500, 0); // Increase gravity to make objects fall faster
world.defaultContactMaterial.friction = 0.3; // Adjust friction to make interactions more realistic
world.defaultContactMaterial.restitution = 0.1; // Adjust restitution (bounciness) if needed

// Create ground plane
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.position.y = -window.innerHeight / 2; // Position at the bottom of the viewport
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to align with the world's x-axis
world.addBody(groundBody);

// Load GLB model
const loader = new GLTFLoader();
loader.load('https://cdn.jsdelivr.net/gh/Rahuli20/404@main/src/BURGER.glb', (gltf) => {
  const model = gltf.scene;
  const models = [];
  const modelBodies = [];

  for (let i = 0; i < 300; i++) {
    const modelClone = model.clone();
    modelClone.scale.set(10, 10, 10); // Set the custom scale for the model
    modelClone.position.set(
      (Math.random() - 0.5) * window.innerWidth,
      (Math.random() * window.innerHeight / 2) + window.innerHeight / 2,
      0
    );
    modelClone.castShadow = true; // Enable shadow casting
    modelClone.receiveShadow = true; // Enable shadow receiving
    scene.add(modelClone);

    const modelBox = new THREE.Box3().setFromObject(modelClone);
    const modelSize = new THREE.Vector3();
    modelBox.getSize(modelSize);
    const halfExtents = new CANNON.Vec3(modelSize.x / 2, modelSize.y / 2, modelSize.z / 2);

    const modelShape = new CANNON.Box(halfExtents);
    const modelBody = new CANNON.Body({ mass: 5 });
    modelBody.addShape(modelShape);
    modelBody.position.copy(modelClone.position);
    modelBody.linearDamping = 0.1; // Damping to reduce "floaty" feel
    world.addBody(modelBody);

    models.push(modelClone);
    modelBodies.push(modelBody);
  }

  // Drag Controls
  const dragControls = new DragControls(models, camera, renderer.domElement);
  let selectedModel = null;
  let dragging = false;

  dragControls.addEventListener('dragstart', function (event) {
    selectedModel = event.object;
    dragging = true;
  });

  dragControls.addEventListener('drag', function (event) {
    if (dragging && selectedModel) {
      const index = models.indexOf(selectedModel);
      const modelBody = modelBodies[index];
      const newPos = new CANNON.Vec3(event.object.position.x, event.object.position.y, 0);
      modelBody.position.copy(newPos);
    }
  });

  dragControls.addEventListener('dragend', function () {
    selectedModel = null;
    dragging = false;
  });

  function animate() {
    requestAnimationFrame(animate);

    world.step(1 / 60);

    models.forEach((model, i) => {
      const modelBody = modelBodies[i];
      model.position.copy(modelBody.position);
      model.quaternion.copy(modelBody.quaternion);
    });

    renderer.render(scene, camera);
  }

  animate();
});

// Shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for better appearance

// Handle window resize
window.addEventListener('resize', () => {
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
