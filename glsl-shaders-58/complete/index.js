//Based on https://blog.theodo.com/2019/04/webgl-from-scratch/ 

let canvas, gl, program, position, glRect;

init();

function init() {
    gl = setupWebGl();

    const vertices = [
    { position: [0, 0], uv: [0, 0] },
    { position: [0, window.innerHeight], uv: [0, 1] },
    { position: [window.innerWidth, window.innerHeight], uv: [1, 1] },
    { position: [window.innerWidth, 0], uv: [1, 0] }
    ];

    glRect = createQuadElement();

    program = setupProgram();

    set2fUniform(program, "screen_size", [window.innerWidth, window.innerHeight]);

    position = createAttribute(program, "position", vertices);
    const uv = createAttribute(program, "uv", vertices);

    onWindowResize();

    drawElement(glRect);

    window.addEventListener( 'resize', onWindowResize );
}

function setupWebGl() {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl");
    if (gl == null) throw "WebGl not Supported";
    return gl;
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

function setupProgram() {
    const vertexSource = `
    uniform vec2 screen_size;
    attribute vec2 position;
    attribute vec2 uv;

    varying vec2 vUv;

    void main () {
        vUv = uv;
        vec2 coord = 2.0 * (position / screen_size) - 1.0;
        gl_Position = vec4(coord.xy, 1, 1);
    }
    `;
    const fragmentSource = `
    precision mediump float;

    varying vec2 vUv;

    void main () {
        gl_FragColor = vec4(vUv, 0, 1);
    }
    `;

    return compileShaders(vertexSource, fragmentSource);
}

function set2fUniform(program, uniformName, values) {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    gl.uniform2f(uniformLocation, ...values);
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
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.values.flat()), gl.STATIC_DRAW);
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
    gl.deleteShader(shader);
        console.warn(source);
        throw "Shader is Invalid";
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