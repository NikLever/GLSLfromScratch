/*const vshader = `
precision highp float;
precision highp int;

#include <common>
#include <lights_pars_begin>

varying vec3 vLightIntensity;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
//varying vec2 vUv2;

void main() {
  #include <simple_lambert_vertex>
  vLightIntensity = vLightFront + ambientLightColor;

  vNormal = normal;
  vUv = uv;
  //vUv2 = uv2;
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );  
}
`*/

const vshader = `
 #include <meshphong_vert>
`

const fshader = `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`
/*const fshader = `
precision highp float;
precision highp int;

uniform vec3 u_brick_color;
uniform vec3 u_mortar_color;
uniform vec2 u_resolution;
uniform float u_scale;
uniform sampler2D u_bump_map;

uniform float time;
uniform vec2 lpxy;
uniform float lpz;
uniform float tmp;
uniform float sc;
//uniform samplerCube iChannel1;

varying mat4 vModelMatrix;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vLightFront;
//varying vec2 vUv2;

vec2 enlight(vec3 p, vec3 n, vec3 lp){
	vec3 toLight = normalize(lp - p);
	float lamb = clamp(dot(n, toLight), 0.0, 1.0);
	vec3 rd = normalize(p - cameraPosition);
	vec3 nr = n * dot(n, -rd);
	vec3 refl = normalize(-rd + (nr + rd) * 2.0);
	float fresnel = 1.0 - clamp(dot(n, -rd), 0.0, 1.0);
	float phong = pow(clamp(dot(refl, toLight), 0.0, 1.0), 20.0);
	phong *= (1.0 + fresnel) * lamb;
	return vec2(lamb, phong);
}
  
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

void main() {
	vec3 lp = vec3(lpxy.x, lpz, lpxy.y);
	vec3 p = (vModelMatrix * vec4(vPosition, 1.0)).xyz;
	vec3 n = normalize(vec3(vModelMatrix * vec4(vNormal, 0.0)));
	float ns = 1.0;
	vec3 t = p * sc;
	vec3 ts = p * sc * 10.;
	vec2 tx = vec2(sin(ts.y), sin(ts.z));
	vec2 ty = vec2(sin(ts.x), sin(ts.z));
	vec2 tz = vec2(sin(ts.x), sin(ts.y));
	tx = texture2D(u_bump_map, t.yz).rg - 0.5;
	ty = texture2D(u_bump_map, t.xz).rg - 0.5;
	tz = texture2D(u_bump_map, t.xy).rg - 0.5;
	tx *= tmp;
	ty *= tmp;
	tz *= tmp;
	if (n.x > 0.0) tx = -tx;
	if (n.y < 0.0) ty = -ty;
	if (n.z > 0.0) tz = -tz;
	vec3 nx = normalize(n * ns + tx.x * cross(n, vec3(0, 0, 1)) + tx.y * cross(n, vec3(0, 1, 0)));
	vec3 ny = normalize(n * ns + ty.x * cross(n, vec3(0, 0, 1)) + ty.y * cross(n, vec3(0, 1, 0)));
	vec3 nz = normalize(n * ns + tz.x * cross(n, vec3(0, 1, 0)) + tz.y * cross(n, vec3(1, 0, 0)));
	vec3 w = abs(n);
	w = vec3(pow(w.x, tmp), pow(w.y, tmp), pow(w.z, tmp));
	w /= dot(w, vec3(1, 1, 1));
	n = normalize(nx * w.x + ny * w.y + nz * w.z);
	vec2 l1 = enlight(p, n, lp) * 0.8;
	vec2 l2 = enlight(p, n, vec3(lp.z, lp.y, -lp.x)) * 0.6;
	vec2 l3 = enlight(p, n, -lp) * 0.4;
	float lamb = l2.x + l1.x + l3.x;
	float phong = l2.y + l1.y + l3.y;
	vec3 rd = normalize(p - cameraPosition);
	vec3 nr = n * dot(n, -rd);
	vec3 refl = normalize(-rd + (nr + rd) * 2.0);
	//vec4 rc = textureCube(iChannel1, refl);
	vec2 uv = fract(vUv*u_scale);
  	vec3 color = vLightFront * mix(u_brick_color, u_mortar_color, brick(uv, 0.05, 0.001));
	//gl_FragColor = vec4(lamb * color + (0.3 + fresnel * 0.5) * rc.rgb * (0.6 + color * 0.3) + phong, 1.0);
	gl_FragColor = vec4(lamb * color + phong, 1.0);
`
*/







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

const bumpMap = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/bricks-bump.jpg');
const uniforms = THREE.UniformsUtils.merge( [
  THREE.UniformsLib[ "common" ],
  THREE.UniformsLib[ "lights" ]
]);
uniforms.u_resolution = { value: new THREE.Vector2(1.0, 1.0) };
uniforms.u_brick_color = { value: new THREE.Color(0xcb4154) };
uniforms.u_mortar_color = { value: new THREE.Color(0xaaaaaa) };
uniforms.diffuse = { value: new THREE.Color(0xff0000) };
uniforms.specular = { value: new THREE.Color(0x222222) };
uniforms.shininess = { value: 25 };
uniforms.bumpMap = { value: bumpMap };
uniforms.bumpScale = { value: 12 };
//uniforms.u_scale = { value: 3.0 };

const material1 = new THREE.MeshPhongMaterial({
	color: 0x552811,
	specular: 0x222222,
	shininess: 25,
	bumpMap: bumpMap,
	bumpScale: 12
});

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