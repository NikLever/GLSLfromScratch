const vshader = `
varying vec3 vPosition;
void main() {	
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;

varying vec3 vPosition;

float rect(vec2 pt, vec2 anchor, vec2 size, vec2 center){
  //return 0 if not in rect and 1 if it is
  //step(edge, x) 0.0 is returned if x < edge, and 1.0 is returned otherwise.
  vec2 p = pt - center;
  vec2 halfsize = size/2.0;
  float horz = step(-halfsize.x - anchor.x, p.x) - step(halfsize.x - anchor.x, p.x);
  float vert = step(-halfsize.y - anchor.y, p.y) - step(halfsize.y - anchor.y, p.y);
  return horz*vert;
}

mat2 getRotationMatrix(float theta){
  float s = sin(theta);
  float c = cos(theta);
  return mat2(c, -s, s, c);
}

void main (void)
{
  vec2 center = vec2(0.0);
  vec2 pt = vPosition.xy - center;
  mat2 mat = getRotationMatrix(u_time);
  pt = mat * pt;
  pt += center;
  vec3 color = u_color * rect(pt, vec2(0.15), vec2(0.3), center);
  gl_FragColor = vec4(color, 1.0); 
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
  u_color: { value: new THREE.Color(0xffff00) },
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