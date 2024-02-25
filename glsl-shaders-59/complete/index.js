//Based on https://blog.theodo.com/2019/04/webgl-from-scratch/ 

let canvas, gl, program, position, glRect, index = 1, time, images, tex;

init();

function init() {
    gl = setupWebGl();

    const vertices = [
    { position: [0, 0], uv: [0, 1] },
    { position: [0, window.innerHeight], uv: [0, 0] },
    { position: [window.innerWidth, window.innerHeight], uv: [1, 0] },
    { position: [window.innerWidth, 0], uv: [1, 1] }
    ];

    glRect = createQuadElement();

    program = setupProgram();

    set1fUniform(program, "u_duration", 2.0);
    
    position = createAttribute(program, "position", vertices);
    const uv = createAttribute(program, "uv", vertices);
  
    images = [ new Image(), new Image() ];
  
    //createTexture( 0 );
    //createTexture( 1 );
    //loadTexture("../images/sa1.jpeg", 0);
    //loadTexture("../images/sa2.jpeg", 1);
  
    index = 0;
    updateImages(1);
 
    addButtonEvents();

    onWindowResize();

    drawElement(glRect);

    window.addEventListener( 'resize', onWindowResize );
  
    animate();
}

function animate(){
  const elapsedTime = (Date.now() - time) / 1000.0;
  //console.log(elapsedTime.toFixed(2));
  set1fUniform(program, 'u_time', elapsedTime);
  
  drawElement(glRect);
  
  requestAnimationFrame( animate )
}

function setupWebGl() {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl");
    if (gl == null) throw "WebGl2 not Supported";
    return gl;
}

function addButtonEvents(){
    const prev = document.getElementById("prev");

    prev.onclick = () => {
      updateImages(-1);
    };

    const next = document.getElementById("next");

    next.onclick = () => {
      updateImages(1);
    };
}

function createQuadElement() {
    const indices = [0, 1, 2, 0, 2, 3];

    //Create indices buffer
    const indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    return {
        length: indices.length,
        indexBuffer
    };
}

function loadTexture(url, index=0) {
    if (!gl) return;

    let active = gl.TEXTURE0 + index;

    gl.activeTexture(active);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel,
    );
  
    const image = new Image();
    image.onload = () => {
      gl.activeTexture(active);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image,
      );
  
      // WebGL1 has different requirements for power of 2 images
      // vs. non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // No, it's not a power of 2. Turn off mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };

    image.src = url;

    set1iUniform(program, `u_tex_${index+1}`, index);
  
    return texture;
  }
  
  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

function setupProgram() {
    const vshader = `
uniform vec2 screen_size;

attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {	
  vUv = uv;
  
  vec2 coord = 2.0 * (position / screen_size) - 1.0;
  gl_Position = vec4(coord.xy, 1, 1);
}
`
const fshader = `
  precision mediump float;

  uniform float u_time;
  uniform float u_duration;
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
    vec3 col1 = texture2D(u_tex_1, vUv).rgb;
    vec3 col2 = texture2D(u_tex_2, uv).rgb;
    float fade = smoothstep(delta*2.5, delta*1.0, len);
    vec3 color = mix(col1, col2, fade);
    gl_FragColor = vec4(color, 1.0); 
  }
`
const fshader2 = `
  precision mediump float;

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
  }`

  const fshader3 = `
  precision mediump float;

  uniform sampler2D u_tex_1;
  uniform sampler2D u_tex_2;

  varying vec2 vUv;

  void main (void)
  {
    vec3 texel = vec3(0.5);

    if (vUv.y < 0.5){
        texel = texture2D(u_tex_1, vUv).rgb;
    }else{
        texel = texture2D(u_tex_2, vUv).rgb;
    }
    gl_FragColor = vec4(texel, 1.0); 
  }
`

    return compileShaders(vshader, fshader);
}

function set2fUniform(program, uniformName, values) {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    gl.uniform2f(uniformLocation, values[0], values[1]);
}

function set1fUniform(program, uniformName, value) {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    gl.uniform1f(uniformLocation, value);
}

function set1iUniform(program, uniformName, value) {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    gl.uniform1i(uniformLocation, value);
}

function createAttribute(program, name, vertices) {

    const values = vertices.map(vertex => vertex[name]);
    const size = values[0].length;

    const buffer = gl.createBuffer();
    const attributeLocation = gl.getAttribLocation(program, name);

    gl.enableVertexAttribArray(attributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
        attributeLocation,
        size, // Size
        gl.FLOAT, // Type
        false, // Normalize
        0, // Stride
        0 // Offset
    );

    const attribute = {
        values,
        buffer,
        refresh() {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.flat()), gl.STATIC_DRAW);
        }
    };

    attribute.refresh();

    return attribute;
}

function makeShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        //console.warn(source);
        //throw "Shader is Invalid";
        const message = gl.getShaderInfoLog(shader);
        if (message.length > 0) {
            /* message may be an error or a warning */
            throw message;
        }
        gl.deleteShader(shader);
    }
    return shader;
}

function makeProgram(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        throw "Unable to link Program";
    }
    return program;
}

function compileShaders(vertexSource, fragmentSource) {
    const vertexShader = makeShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = makeProgram(vertexShader, fragmentShader);
    gl.useProgram(program);
    return program;
}

function drawElement(element) {
    gl.drawElements(
        gl.TRIANGLES,
        element.length,
        gl.UNSIGNED_SHORT,
        element.indexBuffer
    );
}

const info = [
  {name:"Rhino", text:"Rhinoceroses are large, herbivorous mammals identified by their characteristic horned snouts. The word \"rhinoceros\" comes from the Greek \"rhino\" (nose) and \"ceros\" (horn). "},
  {name:"Lion", text:"Lions go on the hunt for food mostly from dusk till dawn. Female lions do 85-90% of the prides hunting, whilst the male lions patrol the territory and protect the pride."},
  {name:"Leopard", text:"Leopards are skilled climbers, and like to rest in the branches of trees during the day. They are strong beasts, too, and can carry their heavy prey up into the trees so that pesky scavengers, such as hyenas, don’t steal their meal!"},
  {name:"Elephant", text:"These magnificent mammals spend between 12 to 18 hours eating grass, plants and fruit every single day! They use their long trunks to smell their food and lift it up into their mouth – yum!"},
  {name:"Giraffe", text:"Female giraffes give birth standing up. The result? Newborns are welcomed to the world with a 1.5m drop to the ground! Ouch! But these infants are quick to get on their feet – within 30 minutes they are standing, and only hours later they”re able to run with their mothers."}
];

function onWindowResize() {
    if (canvas){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    if (program){
        set2fUniform( program, "screen_size", [window.innerWidth, window.innerHeight]);
    }

    if (position){
        position.values[0] = [0, 0];
        position.values[1] = [0, window.innerHeight];
        position.values[2] = [window.innerWidth, window.innerHeight];
        position.values[3] = [window.innerWidth, 0];
        position.refresh();
    }

    if (gl){
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    }

    if (glRect) drawElement(glRect);
}

function createTexture(index){ 
  // Create a texture.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, index, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  
  set1iUniform(program, `u_tex_${index+1}`, index);
  
  if (images && images[index] ){
      images[index].addEventListener('load', () => {
      // Now that the image has loaded copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, index, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[index]);
        //gl.generateMipmap(gl.TEXTURE_2D);
      });
    }
}

function checkSameOrigin(url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
      return false;
    }
    return true;
  }

function updateImages(inc){
  //if (!images || !images[0] || !images[1] ) return false;
  
  //const path = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/sa';
  const path = '../images/sa';
  
  index += inc;
  checkRange();
  const url1 = `${path}${index}.jpeg`;

  loadTexture(url1, 0);
  /*if (checkSameOrigin(url1)){
    images[0].src = url1;
  }else{
    cacheImage( url1, images[0]);
  }*/

  index += inc;
  checkRange();
  const url2 = `${path}${index}.jpeg`;

  /*if (checkSameOrigin(url2)){
    images[1].src = url2;
  }else{
    cacheImage( url2, images[1]);
  }*/
  loadTexture(url2, 1);

  time = Date.now();
  
  function checkRange( min=1, max=5 ){
    if (index<min) index = max;
    if (index>max) index = min;
  }
  
  async function cacheImage( url, img){
        const options = {
            method: "GET",
            origin: "*"
        }
    
        let response = await fetch(url, options)
    
        if (response.status === 200) {
            
            const imageBlob = await response.blob()
            const imageObjectURL = URL.createObjectURL(imageBlob);
    
            img.src = imageObjectURL;
        }else {
            console.log("HTTP-Error: " + response.status)
        }
  }
}