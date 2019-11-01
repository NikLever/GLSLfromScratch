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
uniform sampler2D u_tex;
uniform float u_time;

varying vec2 vUv;

//Based on http://clockworkchilli.com/blog/8_a_fire_shader_in_glsl_for_your_webgl_games

void main (void)
{
  vec4 col;
  vec3 color;
  vec2 offset = vec2(u_time/4.0);
  if (vUv.x<0.5){
    if (vUv.y<0.5){
      col = texture2D(u_tex, vUv*2.0);
      color = vec3(col.b);
    }else{
      col = texture2D(u_tex, fract(vUv*2.0-vec2(0.0, 1.0)+offset));
      color = vec3(col.r);
    }
  }else{
    if (vUv.y<0.5){
      col = texture2D(u_tex, fract(vUv*2.0-vec2(1.0, 0.0)-offset));
      color = vec3(col.a);
    }else{
      col = texture2D(u_tex, fract(vUv*2.0-vec2(1.0, 1.0)+offset));
      color = vec3(col.g);
    }
  }

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
  u_tex: { value: new THREE.TextureLoader().load("https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/flame.png") },
  u_time: { value: 0.0 },
  u_mouse: { value:{ x:0.0, y:0.0 }},
  u_resolution: { value:{ x:0, y:0 }}
}

const material = new THREE.ShaderMaterial( {
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader, 
  transparent: true
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