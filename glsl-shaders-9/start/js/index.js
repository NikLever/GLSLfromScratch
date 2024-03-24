const vshader = `
varying vec3 v_position;
varying vec2 v_uv;

void main() {	
  v_position = position;
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

varying vec3 v_position; 
varying vec2 v_uv;

float rect(vec2 pt, vec2 size, vec2 center){
  //return 0 if not in box and 1 if it is
  //step(edge, x) 0.0 is returned if x < edge, and 1.0 is returned otherwise.
  vec2 halfsize = size * 0.5;
  vec2 p = pt - center;
  float horz = step(-halfsize.x, p.x) - step(halfsize.x, p.x);
  float vert = step(-halfsize.y, p.y) - step(halfsize.y, p.y);
  return horz * vert;
}

float circle(vec2 pt, vec2 center, float radius){
  vec2 p = pt - center;
  return 1.0 - step(radius, length(p));
}

float circle(vec2 pt, vec2 center, float radius, bool soften){
  vec2 p = pt - center;
  float edge = (soften) ? radius * 0.5 : 0.0;
  return 1.0 - smoothstep(radius-edge, radius+edge, length(p));
}

float circle(vec2 pt, vec2 center, float radius, float line_width){
  vec2 p = pt - center;
  float len = length(p);
  float half_line_width = line_width / 2.0;
  return step(radius-half_line_width, len) - step(radius+half_line_width, len);
}

float circle(vec2 pt, vec2 center, float radius, float line_width, bool soften){
  vec2 p = pt - center;
  float len = length(p);
  float half_line_width = line_width / 2.0;
  float edge = (soften) ? radius * 0.05 : 0.0;
  return smoothstep(radius-half_line_width-edge, radius-half_line_width, len) - smoothstep(radius+half_line_width, radius+half_line_width+edge, len);
}

float line(float a, float b, float line_width, float edge_thickness){
  float half_line_width = line_width * 0.5;
  return smoothstep(a-half_line_width-edge_thickness, a-half_line_width, b) - smoothstep(a+half_line_width, a+half_line_width+edge_thickness, b);
}

void main (void)
{
  vec3 color = vec3(1.0, 1.0, 0.0) * rect(v_position.xy, vec2(1.0), vec2(0.0));
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
  u_color_a: { value: new THREE.Color(0xff0000) },
  u_color_b: { value: new THREE.Color(0x00ffff) },
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