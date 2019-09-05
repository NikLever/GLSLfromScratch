const vshader = `
#include <common>
#include <lights_pars_begin>

varying vec3 vPosition;
varying mat4 vModelMatrix;
varying vec3 vWorldNormal;
varying vec3 vLightIntensity;

void main() {
  #include <simple_lambert_vertex>

  vLightIntensity = vLightFront + ambientLightColor;

  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vPosition = position;
  vModelMatrix = modelMatrix;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
uniform vec3 u_color;
uniform vec3 u_light_position;
uniform vec3 u_rim_color;
uniform float u_rim_strength;
uniform float u_rim_width;

// Example varyings passed from the vertex shader
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;
varying vec3 vLightIntensity;

void main()
{
  vec3 worldPosition = ( vModelMatrix * vec4( vPosition, 1.0 )).xyz;
  vec3 lightVector = normalize( u_light_position - worldPosition );
  vec3 viewVector = normalize(cameraPosition - worldPosition);
  float rimndotv =  max(0.0, u_rim_width - clamp(dot(vWorldNormal, viewVector), 0.0, 1.0));
  vec3 rimLight = rimndotv * u_rim_color * u_rim_strength;
  vec3 color = vLightIntensity * u_color + rimLight;

  gl_FragColor = vec4( color, 1.0 );

}
`






const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 1000 );

const light = new THREE.DirectionalLight(0xffda6f, 0.1);
light.position.set(0,1.25,1.25);
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const uniforms = THREE.UniformsUtils.merge( [
  THREE.UniformsLib[ "common" ],
  THREE.UniformsLib[ "lights" ]
]);

uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
uniforms.u_light_position = { value: light.position.clone() };
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };

const geometry = new THREE.TorusKnotGeometry( 1, 0.5, 100, 16 );			
const material = new THREE.ShaderMaterial( {
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
  lights: true
} );

const knot = new THREE.Mesh( geometry, material );
scene.add( knot );

camera.position.z = 5;

const controls = new THREE.OrbitControls(camera, renderer.domElement);

onWindowResize();
if (!('ontouchstart' in window)) window.addEventListener( 'resize', onWindowResize, false );

animate();

function onWindowResize( event ) {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}