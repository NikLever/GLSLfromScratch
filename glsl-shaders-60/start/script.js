import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, controls;
let object, ambient, light, clock, uniforms, tmpVec;

const vShader = `
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fShader = `
void main(){
  gl_FragColor = vec4( 1.0, 0, 0, 1.0);
}
`;

init();
animate();

function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //
  clock = new THREE.Clock();
  
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10 );
  camera.position.z = 1.7;
  
  tmpVec = new THREE.Vector3()

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6688ff);
  
  light = new THREE.DirectionalLight();
  light.position.set( 1, 1, 0 );
  scene.add( light );
  
  uniforms = {
  };
  
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vShader,
    fragmentShader: fShader,
    transparent: true
  });
  object = new THREE.Mesh( geometry, material );
  scene.add( object );
  
  const gui = new GUI();
  const options = { 
  }
  
  window.addEventListener('resize', onWindowResize );
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
 
}

function animate() {

  requestAnimationFrame( animate );

  object.rotation.y += 0.01;
  
  renderer.render(scene, camera);

}