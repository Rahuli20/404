import * as THREE from 'three';
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

// Create cubes with physics
const cubes = [];
const cubeBodies = [];

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('https://uploads-ssl.webflow.com/667ec7a0c58c8e9576e597ca/667edab80b7c577e45e2936d_texture.jpg'); // Replace with your texture path
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(0.1, 0.1); // Adjust repeat values as needed to control texture scale

const cubeGeometry = new THREE.BoxGeometry(150, 150, 150);
const cubeMaterial = new THREE.MeshPhongMaterial({ map: texture }); // Apply texture to material

for (let i = 0; i < 100; i++) {
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(
    (Math.random() - 0.5) * window.innerWidth,
    (Math.random() * window.innerHeight / 2) + window.innerHeight / 2,
    0
  );
  cube.castShadow = true; // Enable shadow casting
  cube.receiveShadow = true; // Enable shadow receiving
  scene.add(cube);

  const cubeShape = new CANNON.Box(new CANNON.Vec3(50, 50, 50));
  const cubeBody = new CANNON.Body({ mass: 5 });
  cubeBody.addShape(cubeShape);
  cubeBody.position.copy(cube.position);
  cubeBody.linearDamping = 0.1; // Damping to reduce "floaty" feel
  world.addBody(cubeBody);

  cubes.push(cube);
  cubeBodies.push(cubeBody);
}

// Drag Controls
const dragControls = new DragControls(cubes, camera, renderer.domElement);
let selectedCube = null;
let dragging = false;

dragControls.addEventListener('dragstart', function (event) {
  selectedCube = event.object;
  dragging = true;
});

dragControls.addEventListener('drag', function (event) {
  if (dragging && selectedCube) {
    const index = cubes.indexOf(selectedCube);
    const cubeBody = cubeBodies[index];
    const newPos = new CANNON.Vec3(event.object.position.x, event.object.position.y, 0);
    cubeBody.position.copy(newPos);
  }
});

dragControls.addEventListener('dragend', function () {
  selectedCube = null;
  dragging = false;
});

// Shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for better appearance

function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  cubes.forEach((cube, i) => {
    const cubeBody = cubeBodies[i];
    cube.position.copy(cubeBody.position);
    cube.quaternion.copy(cubeBody.quaternion);
  });

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});