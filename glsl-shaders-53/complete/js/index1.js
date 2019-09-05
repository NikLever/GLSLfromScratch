const vshader = `
#include <common>
#include <lights_pars_begin>

varying vec3 vLightIntensity;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;
varying vec3 vTangent;
varying vec3 vBitangent;

void main() {
  #include <simple_lambert_vertex>
  vLightIntensity = vLightFront + ambientLightColor;

  vUv = uv;
  vPosition = position;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vModelMatrix = modelMatrix;
  
  vTangent = normalize( transformedTangent );
  vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fshader = `
uniform vec3 u_brick_color;
uniform vec3 u_mortar_color;
uniform vec2 u_resolution;
uniform float u_scale;
uniform sampler2D u_normal_map;
uniform vec2 u_normal_scale;
				
varying vec3 vPosition;
varying vec3 vLightIntensity;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

#extension GL_OES_standard_derivatives : enable

float brick(vec2 pt, float mortar_height, float edge_thickness){
  if (pt.y>0.5) pt.x = fract(pt.x + 0.5);
  //Draw vertical lines
  float result = 1.0 - smoothstep(mortar_height/2.0, mortar_height/2.0 + edge_thickness, pt.x) + smoothstep(1.0 - mortar_height/2.0 - edge_thickness, 1.0 - mortar_height/2.0, pt.x);
  //Draw top and bottom lines
  result += 1.0 - smoothstep(mortar_height/2.0, mortar_height/2.0 + edge_thickness, pt.y) + smoothstep(1.0 - mortar_height/2.0 - edge_thickness, 1.0 - mortar_height/2.0, pt.y);
  //Draw middle line
  result += smoothstep(0.5 - mortar_height/2.0 - edge_thickness, 0.5 - mortar_height/2.0, pt.y) - smoothstep(0.5 + mortar_height/2.0, 0.5 + mortar_height/2.0 + edge_thickness, pt.y);
  return clamp(result, 0.0, 1.0);
}

vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {

  // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

  vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
  vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
  vec2 st0 = dFdx( vUv.st );
  vec2 st1 = dFdy( vUv.st );

  float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude

  vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
  vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
  vec3 N = normalize( surf_norm );
  mat3 tsn = mat3( S, T, N );

  vec3 mapN = texture2D( u_normal_map, vUv ).xyz * 2.0 - 1.0;

  mapN.xy *= u_normal_scale;
  mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );

  return normalize( tsn * mapN );
}

void main(){
  vec3 worldPosition = ( vModelMatrix * vec4( vPosition, 1.0 )).xyz;
  vec3 viewVector = normalize(cameraPosition - worldPosition);
  vec3 N = perturbNormal2Arb( viewVector, vTangent );
  vec3 lightIntensity = vLightIntensity - dot(vWorldNormal, N);

  vec2 uv = fract(vUv*u_scale);
  vec3 color = mix(u_brick_color, u_mortar_color, brick(uv, 0.05, 0.001));
  gl_FragColor = vec4(vLightIntensity * color, 1.0);
}
`






const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const ambient = new THREE.AmbientLight(0x555555);
const light = new THREE.DirectionalLight(0xaaaaaa, 0.6);
light.position.set(0,2,6);
scene.add(ambient);
scene.add(light);

const uniforms = THREE.UniformsUtils.merge( [
  THREE.UniformsLib[ "common" ],
  THREE.UniformsLib[ "lights" ]
]);
uniforms.u_resolution = { value: new THREE.Vector2(1.0, 1.0) };
uniforms.u_brick_color = { value: new THREE.Color(0xcb4154) };
uniforms.u_mortar_color = { value: new THREE.Color(0xaaaaaa) };
uniforms.u_normal_map = { value: new THREE.TextureLoader().load('../images/bricks-bump.jpg') };
uniforms.u_normal_scale = { value: new THREE.Vector2(1,1) };
uniforms.u_scale = { value: 3.0 };

const geometry = new THREE.BoxGeometry( 1, 1, 1 );			
const material = new THREE.ShaderMaterial( {
  lights: true,
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader
} );

const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 2;

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