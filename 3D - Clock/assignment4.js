"use strict";

var canvas, gl, color;
var bufferHourHand, bufferMinuteHand, bufferFrame, bufferWall;
var hourHandVertices, minuteHandVertices, bufferCircle, verticesWall;
var mColor, vPosition;
var minuteHand, hourHand;
var transformationMatrixLoc, modelMatrixLoc, perspectiveMatrixLoc;
var translateMatrix, scaleMatrix, rotateMatrix, modelMatrix, perspectiveMatrix, transformationMatrix;

var posX = 0,
    posY = 0,
    posZ = 5;
var tarX = 0,
    tarY = 0,
    tarZ = 0;
var rotX = 0,
    rotY = 0,
    rotZ = 0;
var fovy = 50;
var clockPosX = 0,
    clockPosY = 0,
    clockPosZ = 0;
var scale = 1;
var hour = 0,
    minute = 0;
var piece = 360;
var isPlay = 1;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Vertices
    hourHandVertices = [
        vec3(-.025, -.1, .025),
        vec3(.0, .3, .025),
        vec3(.025, .0, .025)
    ];

    minuteHandVertices = [
        vec3(-.025, -.1, .025),
        vec3(0, .5, .025),
        vec3(.025, .0, .025)
    ];

    verticesWall = [
        vec3(-1, -1, 0),
        vec3(-1, -1, -1),
        vec3(-1, 1, 0),
        vec3(-1, 1, -1)
    ];

    var vertices = [vec3(0, 0, 0)];
    for (var i = 0; i < piece; i++) {
        vertices.push(vec3(.5 * Math.cos(i), .5 * Math.sin(i)), 0.01);
        vertices.push(vec3(.5 * Math.cos(i), .5 * Math.sin(i), -0.15));
    };

    var frame = [vec3(0, 0, 0)];
    for (var i = 0; i < piece; i++) {
        frame.push(vec3(.5 * Math.cos(i), .5 * Math.sin(i), -0.15));
        vertices.push(vec3(.5 * Math.cos(i), .5 * Math.sin(i)), 0.01);
    };

    // Load the data into the GPU
    bufferFrame = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferFrame);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(frame), gl.STATIC_DRAW);

    bufferCircle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCircle);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    bufferWall = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verticesWall), gl.STATIC_DRAW);

    bufferHourHand = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferHourHand);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(hourHandVertices), gl.STATIC_DRAW);

    bufferMinuteHand = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferMinuteHand);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(minuteHandVertices), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    transformationMatrixLoc = gl.getUniformLocation(program, "transformationMatrix");
    mColor = gl.getUniformLocation(program, "color");
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    perspectiveMatrixLoc = gl.getUniformLocation(program, "perspectiveMatrix");

    //CAMERA SETTINGS - FOVY & POSITION
    document.getElementById("fovy").oninput = function (event) {
        fovy = event.target.value;
    };
    document.getElementById("camX").oninput = function (event) {
        posX = event.target.value;
    };
    document.getElementById("camY").oninput = function (event) {
        posY = event.target.value;
    };
    document.getElementById("camZ").oninput = function (event) {
        posZ = event.target.value;
    };

    //CAMERA SETTINGS - TARGET
    document.getElementById("tarX").oninput = function (event) {
        tarX = event.target.value;
    };
    document.getElementById("tarY").oninput = function (event) {
        tarY = event.target.value;
    };
    document.getElementById("tarZ").oninput = function (event) {
        tarZ = event.target.value;
    };

    //TRANSFORMATION - POSITION
    document.getElementById("inp_objX").oninput = function (event) {
        clockPosX = event.target.value;
    };
    document.getElementById("inp_objY").oninput = function (event) {
        clockPosY = event.target.value;
    };
    document.getElementById("inp_objZ").oninput = function (event) {
        clockPosZ = event.target.value;
    };

    document.getElementById("inp_obj_scale").oninput = function (event) {
        scale = event.target.value;
    };

    //TRANSFORMATION - ROTATION
    document.getElementById("rotX").oninput = function (event) {
        rotX = event.target.value;
    };
    document.getElementById("rotY").oninput = function (event) {
        rotY = event.target.value;
    };
    document.getElementById("rotZ").oninput = function (event) {
        rotZ = event.target.value;
    };

    document.getElementById("inp_hour").oninput = function (event) {
        hour = event.target.value
        document.getElementById("hourdiv").innerHTML = "Hour: " + Math.round(event.target.value);
    };
    document.getElementById("inp_minute").oninput = function (event) {
        minute = event.target.value
        document.getElementById("mindiv").innerHTML = "Minute: " + Math.round(minute);
    };
    document.getElementById("inp_animating").onchange = function (event) {
        isPlay = event.target.checked;
    };
    render();
};


function updateClock() {
    minuteHand = rotateZ(-(minute * 6));
    minuteHand = mult(transformationMatrix, minuteHand);

    hourHand = rotateZ(-(hour * 30) - minute / 2);
    hourHand = mult(transformationMatrix, hourHand);

    if (!isPlay) {
        return;
    }

    minute++;
    hour %= 12;

    if (minute == 60) {
        minute = 0;
        hour++;
    }

    document.getElementById("inp_hour").value = hour;
    document.getElementById("inp_minute").value = minute;

    document.getElementById("hourdiv").innerHTML = "Hour: " + Math.round(hour);
    document.getElementById("mindiv").innerHTML = "Minute: " + Math.round(minute);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    modelMatrix = lookAt([posX, posY, posZ], [tarX, tarY, tarZ], [0, 1, 0]);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    perspectiveMatrix = perspective(fovy, 1, .1, 50);
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));

    /*  -----   WALL  -----   */
    // Top surface
    translateMatrix = rotateZ(270);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([0, 0, 0, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Bottom surface
    translateMatrix = rotateZ(90);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([0, 0, 1, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Left surface
    translateMatrix = translate(0, 0, 0);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([1, 0, 0, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Right surface
    translateMatrix = translate(2, 0, 0);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([0, 1, 0, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Rear surfaces
    translateMatrix = rotateY(270);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([0.5, 0.5, 0.5, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    translateMatrix = rotateY(270);
    transformationMatrix = translate(0, 0, 1);
    translateMatrix = mult(translateMatrix, transformationMatrix);
    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(translateMatrix));
    gl.uniform4fv(mColor, flatten([0.5, 0.5, 0.5, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWall);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    /*  -----   CLOCK  -----   */
    var clockX = rotateX(rotX);
    var clockY = rotateY(rotY);
    var clcokZ = rotateZ(rotZ);
    var rotateClock = mult(clockX, clockY);
    rotateClock = mult(rotateClock, clcokZ);
    var scaleClock = scalem(scale, scale, 1);
    var translateClock = translate(clockPosX, clockPosY, clockPosZ);
    transformationMatrix = mult(translateClock, scaleClock);
    transformationMatrix = mult(transformationMatrix, rotateClock);

    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(transformationMatrix));

    gl.uniform4fv(mColor, flatten([.85, .85, .85, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCircle);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, Math.PI * piece);

    gl.uniform4fv(mColor, flatten([.15, .15, .15, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferFrame);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, Math.PI * piece);

    updateClock();

    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(minuteHand));
    gl.uniform4fv(mColor, flatten([0, 0, 0, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferMinuteHand);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    gl.uniformMatrix4fv(transformationMatrixLoc, false, flatten(hourHand));
    gl.uniform4fv(mColor, flatten([0, 0, 0, 1]));
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferHourHand);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    // Calls render function at each 1ms
    setTimeout(
        function () {
            requestAnimFrame(render);
        }, 1
    );
}
