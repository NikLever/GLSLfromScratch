const runtime = new ShaderFrogRuntime();
runtime.load( 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/Electronic_knot.json', function( shaderData ) {
  // Get the Three.js material you can assign to your objects
  const material = runtime.get( shaderData.name );
  const envmap = new THREE.CubeTextureLoader()
  .setPath( 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/' )
  .load( [
    'skybox2_px.jpg',
    'skybox2_nx.jpg',
    'skybox2_py.jpg',
    'skybox2_ny.jpg',
    'skybox2_pz.jpg',
    'skybox2_nz.jpg'
  ] );
  scene.background = envmap;
  material.uniforms.reflectionSampler.value = envmap;
  const knot = new THREE.Mesh( geometry, material );
  scene.add( knot );
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 1000 );
runtime.registerCamera( camera );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.TorusKnotGeometry( 1, 0.5, 100, 16 );
const clock = new THREE.Clock();

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
  runtime.updateShaders(clock.getElapsedTime());
  renderer.render( scene, camera );
}