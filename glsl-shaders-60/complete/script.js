import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, controls;
let object, ambient, light, clock, uniforms, tmpVec;

const vShader = `
varying vec3 vPosition;
varying vec2 vUv;

void main(){
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fShader = `
uniform int numSteps;
uniform float stepSize;
uniform float densityScale;
uniform vec3 camPos;
uniform sampler2D tex;
uniform int width;
uniform int height;
uniform float uvZ;
uniform int numLightSteps;
uniform float lightStepSize;
uniform vec3 lightDir;
uniform float lightAbsorb;
uniform float darknessThreshold;
uniform float transmittance;
uniform vec3 color;
uniform vec3 shadowColor;

varying vec3 vPosition;
varying vec2 vUv;

vec3 sampleTexture3D( sampler2D tex, vec3 uv){
  uv = clamp(uv, 0.0, 1.0);
  int index = int(float(width * height) * uv.z);
  vec2 cellSize = vec2( 1.0/float(width), 1.0/float(height));
  vec2 cellPos = vec2( index % width, height - index/height - 1);
  vec2 uv2 = (uv.xy + cellPos) * cellSize;
  return texture2D(tex, uv2).rgb;
}

vec2 raymarch(){
  float density = 0.0;
  float transmission = transmittance;
  float lightAccumulation = 0.0;
  float finalLight = 0.0;
  
  vec3 rayOrigin = vec3(vPosition);
  vec3 rayDirection = normalize( rayOrigin - camPos );
  vec3 offset = vec3(0.5);
  vec3 lightDirN = normalize(lightDir);
  
  for(int i=0; i<numSteps; i++){
    vec3 samplePos = rayOrigin + offset;
    density += sampleTexture3D(tex, samplePos).r * densityScale;
    
    //light loop
    vec3 lightRayOrigin = samplePos;
    
    for(int j=0; j<numLightSteps; j++){
      lightAccumulation += sampleTexture3D( tex, lightRayOrigin).r;
      lightRayOrigin += lightDirN * lightStepSize;
    }
    
    float lightTransmission = exp(-lightAccumulation);
    float shadow = darknessThreshold + lightTransmission * ( 1.0 - darknessThreshold);
    finalLight += density * transmission * shadow;
    transmission *= exp(-density * lightAbsorb);
    
    rayOrigin += rayDirection * stepSize;
  }
  
  transmission = 1.0 - exp(-density);
  
  return vec2( finalLight, transmission);
}

void main(){
  vec2 result = raymarch();
  vec3 col = mix(shadowColor, color, result.x);
  gl_FragColor = vec4( col, result.y );
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
    numSteps: { value: 64 },
    stepSize: { value: 0.017 },
    densityScale: { value: 0.25 },
    camPos: { value: new THREE.Vector3() },
    tex: { value: new THREE.TextureLoader().setPath('../../images/').load('VolumeCloud.png')},
    width: { value: 8 },
    height: { value: 8 },
    uvZ: { value: 0.5 },
    numLightSteps: { value: 8 },
    lightStepSize: { value: 0.12 },
    lightAbsorb: { value: 0.3 },
    darknessThreshold: { value: 0.18 },
    transmittance: { value: 1.0 },
    lightDir: { value: new THREE.Vector3() },
    color: { value: new THREE.Color(0xFFFFFF )},
    shadowColor: { value: new THREE.Color(0x879CB0 )}
  };
  
  uniforms.tex.value.generateMipmaps = false;
  
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
    densityScale: 0.06,
    lightAbsorb: 0.3,
    darknessThreshold: 0.18,
    transmittance: 1.0
  }
  
  gui.add( options, 'densityScale', 0, 1, 0.01 ).onChange( value => { uniforms.densityScale.value = value });
   gui.add( options, 'lightAbsorb', 0, 5, 0.1 ).onChange( value => { uniforms.lightAbsorb.value = value });
   gui.add( options, 'darknessThreshold', 0, 1, 0.01 ).onChange( value => { uniforms.darknessThreshold.value = value });
   gui.add( options, 'transmittance', 0, 1, 0.01 ).onChange( value => { uniforms.transmittance.value = value });
  
  window.addEventListener('resize', onWindowResize );
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
 
}

function animate() {

  requestAnimationFrame( animate );

  //Set camera position to object space
  tmpVec.copy(camera.position);
  object.worldToLocal(tmpVec);
  uniforms.camPos.value.copy(tmpVec);
  
  //Set light position to object space
  tmpVec.copy(light.position);
  object.worldToLocal(tmpVec);
  uniforms.lightDir.value.copy(tmpVec);
  
  object.rotation.y += 0.01;
  
  renderer.render(scene, camera);

}