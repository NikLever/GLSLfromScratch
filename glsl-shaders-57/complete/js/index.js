var camera, scene, renderer, composer;
var object, light;

var glslPass;

init();
animate();

function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  //

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 400;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

  object = new THREE.Object3D();
  scene.add( object );

  var geometry = new THREE.SphereBufferGeometry( 1, 4, 4 );

  for ( var i = 0; i < 100; i ++ ) {

    var material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random(), flatShading: true } );

    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
    mesh.position.multiplyScalar( Math.random() * 400 );
    mesh.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
    mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
    object.add( mesh );

  }

  scene.add( new THREE.AmbientLight( 0x222222 ) );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 1, 1, 1 );
  scene.add( light );

  // postprocessing

  composer = new THREE.EffectComposer( renderer );
  composer.addPass( new THREE.RenderPass( scene, camera ) );

  glslPass = new THREE.ShaderPass({
    uniforms: {
      "tDiffuse": { value: null },
      "amount":   { value: 1.0 }
    },
    vertexShader: 
    `varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
        fragmentShader: 
        `uniform float time;
    uniform vec2 resolution;
    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    float random(vec2 c){
      return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float inRect(vec2 pt, float left, float right, float top, float bottom){
      return (step(left, pt.x) - step(right, pt.x)) * (step(bottom, pt.y) - step(top, pt.y));
    }

    float inRect(vec2 pt, float left, float right, float top, float bottom, float edgeWidth ){
      return (smoothstep(left-edgeWidth, left, pt.x) - smoothstep(right, right+edgeWidth, pt.x)) * (smoothstep(bottom-edgeWidth, bottom, pt.y) - smoothstep(top, top+edgeWidth, pt.y));
    }

    const float amount = 1.0;

    void main(void){
      vec3 bg = texture2D(tDiffuse, vUv).rgb;
      vec3 grey = vec3(length(bg));
      float delta = inRect(vUv, 0.5, 0.8, 0.8, 0.2, 0.2);
      vec3 color = mix(bg, grey, clamp(delta, 0.0, 1.0));
      gl_FragColor = vec4(color, 1.0);
    }`
  }
                                 );
  glslPass.renderToScreen = true;
  composer.addPass( glslPass );


  //

  if (!('ontouchstart' in window)) window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
  composer.setSize( window.innerWidth, window.innerHeight );


}

function animate() {

  requestAnimationFrame( animate );

  object.rotation.x += 0.005;
  object.rotation.y += 0.01;

  composer.render();
  //renderer.render(scene, camera);

}