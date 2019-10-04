const vshader = `
varying vec2 vUv;
void main() {	
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color_a;
uniform vec3 u_color_b;

varying vec2 vUv;

float line(float x, float y, float line_width, float edge_thickness){
	float half_line_width = line_width * 0.5;
  return smoothstep(x-half_line_width-edge_thickness, x-half_line_width, y) - smoothstep(x+half_line_width, x+half_line_width+edge_thickness, y);
}


float brick(vec2 pt, float mortar_height, float edge_thickness){
  float result = line(pt.y, 0.0, mortar_height, edge_thickness);
  result += line(pt.y, 0.5, mortar_height, edge_thickness);
  result += line(pt.y, 1.0, mortar_height, edge_thickness);
  if (pt.y>0.5) pt.x = fract(pt.x + 0.5);
  result += line(pt.x, 0.5, mortar_height, edge_thickness);

  return clamp(result, 0.0, 1.0);
}

void main (void)
{
  vec2 uv = fract(vUv * 10.0);
  vec3 color = mix(u_color_a, u_color_b, brick(uv, 0.05, 0.001));
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
  u_color_a: { value: new THREE.Color(0xcb4154) },
  u_color_b: { value: new THREE.Color(0xaaaaaa) },
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