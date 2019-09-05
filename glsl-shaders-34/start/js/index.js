const vshader = `
varying vec2 vUv;
void main() {	
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex;

varying vec2 vUv;

void main() {
  vec2 uv;
  vec2 noise = vec2(0.0);

  // Generate noisy y value
  uv = vec2(vUv.x*0.7 - 0.01, fract(vUv.y - u_time*0.27));
  noise.y = (texture2D(u_tex, uv).a-0.5)*2.0;
  uv = vec2(vUv.x*0.45 + 0.033, fract(vUv.y*1.9 - u_time*0.61));
  noise.y += (texture2D(u_tex, uv).a-0.5)*2.0;
  uv = vec2(vUv.x*0.8 - 0.02, fract(vUv.y*2.5 - u_time*0.51));
  noise.y += (texture2D(u_tex, uv).a-0.5)*2.0;
  
  noise = clamp(noise, -1.0, 1.0);

  float perturb = (1.0 - vUv.y) * 0.35 + 0.02;
  noise = (noise * perturb) + vUv - 0.02;

  vec4 color = texture2D(u_tex, noise);
  color = vec4(color.r*2.0, color.g*0.9, (color.g/color.r)*0.2, 1.0);
  noise = clamp(noise, 0.05, 1.0);
  color.a = texture2D(u_tex, noise).b*2.0;
  color.a = color.a*texture2D(u_tex, vUv).b;

  gl_FragColor = color;
}
`






const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 10 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const clock = new THREE.Clock();

const geometry = new THREE.PlaneGeometry( 2, 2 );
const uniforms = {
  u_tex: { value: new THREE.TextureLoader().load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/flame.png") },
  u_time: { value: 0.0 },
  u_mouse: { value:{ x:0.0, y:0.0 }},
  u_resolution: { value:{ x:0, y:0 }}
}

const material = new THREE.ShaderMaterial( {
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader
} );

const plane = new THREE.Mesh( geometry, material );
scene.add( plane );

camera.position.z = 1;

onWindowResize();
if ('ontouchstart' in window){
  document.addEventListener('touchmove', move);
}else{
  window.addEventListener( 'resize', onWindowResize, false );
  document.addEventListener('mousemove', move);
}

function move(evt){
  uniforms.u_mouse.value.x = (evt.touches) ? evt.touches[0].clientX : evt.clientX;
  uniforms.u_mouse.value.y = (evt.touches) ? evt.touches[0].clientY : evt.clientY;
}

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