const vshader = `
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
uniform vec2 u_resolution;

varying vec3 vPosition;

#include <noise>

void main(){
  vec2 p = vPosition.xy;
  float scale = 800.0;
  vec3 color;
  bool marble = true;

  p *= scale;

  if (marble){
    float d = perlin(p.x, p.y) * scale;
    float u = p.x + d;
    float v = p.y + d;
    d = perlin(u, v) * scale;
    float noise = perlin(p.x + d, p.y + d);
    color = vec3(0.6 * (vec3(2.0 * noise) - vec3(noise * 0.1, noise * 0.2 - sin(u / 30.0) * 0.1, noise * 0.3 + sin(v / 40.0) * 0.2)));
  }else{
    color = vec3(perlin(p.x, p.y));
  }
  gl_FragColor = vec4(color, 1.0);
}
`






const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 10 );
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const uniforms = {};
uniforms.u_time = { value: 0.0 };
uniforms.u_resolution = { value: new THREE.Vector2() };
uniforms.u_LightColor = { value: new THREE.Color(0xbb905d) };
uniforms.u_DarkColor = { value: new THREE.Color(0x7d490b) };
uniforms.u_Frequency = { value: 2.0 };
uniforms.u_NoiseScale = { value: 6.0 };
uniforms.u_RingScale = { value: 0.6 };
uniforms.u_Contrast = { value: 4.0 };

const geometry = new THREE.PlaneGeometry( 2, 2 );
const material = new THREE.ShaderMaterial( {
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader
} );

const plane = new THREE.Mesh( geometry, material );
scene.add( plane );

camera.position.z = 1;

onWindowResize();
if (!('ontouchstart' in window)) window.addEventListener( 'resize', onWindowResize, false );

animate();

function onWindowResize( event ) {
  const aspectRatio = window.innerWidth/window.innerHeight;
  let width, height;
  if (aspectRatio>=1){
    width = 1;
    height = (window.innerHeight/window.innerWidth) * width;
    
  }else{
    width = aspectRatio;
    height = 1;
  }
  camera.left = -width;
  camera.right = width;
  camera.top = height;
  camera.bottom = -height;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  uniforms.u_resolution.value.x = window.innerWidth;
  uniforms.u_resolution.value.y = window.innerHeight;
}

function animate() {
  requestAnimationFrame( animate );
  uniforms.u_time.value += clock.getDelta();
  renderer.render( scene, camera );
}