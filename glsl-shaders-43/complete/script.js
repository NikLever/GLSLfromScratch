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
uniform float u_duration;
uniform float u_amplitude;
uniform float u_waves;
uniform sampler2D u_tex_1;
uniform sampler2D u_tex_2;

varying vec2 vUv;

void main (void)
{
  vec2 p = -1.0 + 2.0 * vUv;
  float len = length(p);
  vec2 ripple = vUv + (p/len)*cos(len*12.0-u_time*4.0)*0.03;
  float delta = u_time/u_duration;
  vec2 uv = mix(ripple, vUv, delta);
  vec3 col1 = texture2D(u_tex_1, uv).rgb;
  vec3 col2 = texture2D(u_tex_2, uv).rgb;
  float fade = smoothstep(delta*2.5, delta*1.0, len);
  vec3 color = mix(col1, col2, fade);
  gl_FragColor = vec4(color, 1.0); 
}
`
const fshader2 = `
  uniform sampler2D u_tex;
  uniform float u_time;
  uniform float u_duration;
  uniform float u_twirls;

  varying vec2 vUv;

  vec4 twirl(sampler2D tex, vec2 uv, float time){
    if (time<0.0) time = 0.0;

    vec2 center = vec2(0.5);
    vec2 tc = uv - center;
    float dist = length(tc);

    if (dist < 0.5){
      float delta = (0.5 - dist) / 0.5;
      float theta = delta * delta * time * u_twirls;
      float s = sin(theta);
      float c = cos(theta);
      mat2 mat = mat2(c,s,-s,c);
      tc = mat * tc;
      //tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
    }

    tc += center;
    vec4 color = texture2D(tex, tc);
    color.a = mix(0.0, color.a, min(u_time, 1.0));
    return color;
  }

  void main(void){
    gl_FragColor = twirl(u_tex, vUv, u_duration - u_time);
  }

            `
  



const info = [
  {name:"Rhino", text:"Rhinoceroses are large, herbivorous mammals identified by their characteristic horned snouts. The word \"rhinoceros\" comes from the Greek \"rhino\" (nose) and \"ceros\" (horn). "},
  {name:"Lion", text:"Lions go on the hunt for food mostly from dusk till dawn. Female lions do 85-90% of the prides hunting, whilst the male lions patrol the territory and protect the pride."},
  {name:"Leopard", text:"Leopards are skilled climbers, and like to rest in the branches of trees during the day. They are strong beasts, too, and can carry their heavy prey up into the trees so that pesky scavengers, such as hyenas, don’t steal their meal!"},
  {name:"Elephant", text:"These magnificent mammals spend between 12 to 18 hours eating grass, plants and fruit every single day! They use their long trunks to smell their food and lift it up into their mouth – yum!"},
  {name:"Giraffe", text:"Female giraffes give birth standing up. The result? Newborns are welcomed to the world with a 1.5m drop to the ground! Ouch! But these infants are quick to get on their feet – within 30 minutes they are standing, and only hours later they”re able to run with their mothers."}
];

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 10 );
const config = { font:'Josefin Sans', size:16, h1size:30, padding:10, colour:'#fff', width:512, height:256, zpos:0.005, planesize: { width:1, height:0.5 } };
            
const uniforms2 = {
  u_time: { value: 0.0 },
  u_duration: { value: 2.0 },
  u_twirls: { value: 7 }
}

const material2 = new THREE.ShaderMaterial( {
  uniforms: uniforms2,
  vertexShader: vshader,
  fragmentShader: fshader2,
  transparent: true
} );

const canvasText = new CanvasText(scene, info[1], config, material2);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const clock = new THREE.Clock();

const geometry = new THREE.PlaneGeometry( 2, 1.5 );
const uniforms = {
  u_tex_1: { value: null },
  u_tex_2: { value: null },
  u_duration: { value: 2.0 },
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

function onWindowResize( event ) {
  const aspectRatio = window.innerWidth/window.innerHeight;
  let width, height;
  if (aspectRatio>=(2/1.5)){
    console.log("resize: Use width");
    width = 1;
    height = (window.innerHeight/window.innerWidth) * width;
  }else{
    console.log("resize: Use height")
    height = 1.5/2;
    width = (window.innerWidth/window.innerHeight) * height;
  }
  camera.left = -width;
  camera.right = width;
  camera.top = height;
  camera.bottom = -height;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  uniforms.u_resolution.value.x = window.innerWidth;
  uniforms.u_resolution.value.y = window.innerHeight;
  canvasText.positionText(camera, { bottom: 0.1 });
}

function animate() {
  requestAnimationFrame( animate );
  const delta = clock.getDelta();
  if (uniforms.u_time.value<uniforms.u_duration.value){
    uniforms.u_time.value += delta;
  }else{
    uniforms.u_time.value = uniforms.u_duration.value;
  }
  if (uniforms2.u_time.value<uniforms2.u_duration.value){
    uniforms2.u_time.value += delta;
  }else{
    uniforms2.u_time.value = uniforms2.u_duration.value;
  }
  renderer.render( scene, camera );
}

let index = 0;
const images = [];
const loader = new THREE.TextureLoader();
loader.setPath('https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/');
loadNextImage(loader);

function loadNextImage(loader){
  index++;
  if (index>5){
    index = 0;
    uniforms.u_tex_1.value = images[0];
    uniforms.u_tex_2.value = images[1];
    uniforms.u_time.value = 0;

    const prev = document.getElementById("prev");

    prev.onclick = function(){
      uniforms.u_time.value = 0;
      uniforms2.u_time.value = 0;
      
      if (index==4){
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[4];
      }else if (index<0){
        index = 4;
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[4];
      }else{
        uniforms.u_tex_1.value = images[index+1];
        uniforms.u_tex_2.value = images[index];
      }
      canvasText.update(info[index]);
      const msg = document.getElementById("msg");
      msg.style.display = "none";
    };

    const next = document.getElementById("next");

    next.onclick = function(){
      uniforms.u_time.value = 0;
      uniforms2.u_time.value = 0;
      index++;
      const infoIndex = (index + 1) % 5;
      canvasText.update(info[infoIndex]);
      if (index>=5){
        index = 0;
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[1];
      }else if(index==4){
        uniforms.u_tex_1.value = images[4];
        uniforms.u_tex_2.value = images[0];
      }else{
        uniforms.u_tex_1.value = images[index];
        uniforms.u_tex_2.value = images[index+1];
      }
      const msg = document.getElementById("msg");
      msg.style.display = "none";
    };

    animate();
  }else{
    loader.load(`sa${index}.jpg`, function(tex){
      images.push(tex);
      loadNextImage(loader);
    })
  }
}