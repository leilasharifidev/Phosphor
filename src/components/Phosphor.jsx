import { useEffect, useRef } from "react";

const MAX_DPR = 1;

const REF_RADIUS = 3;

const REF_EXPOSURE = 3e4;

const TIME_RATE = 1;

const TAU = 6.283185307179586;

// =========================================

// HELPERS

// =========================================

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function num(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// =========================================

// HSL → RGB

// =========================================

function hueToRgb(p, q, t) {
  let x = t;

  if (x < 0) x += 1;

  if (x > 1) x -= 1;

  if (x < 1 / 6) {
    return p + (q - p) * 6 * x;
  }

  if (x < 1 / 2) {
    return q;
  }

  if (x < 2 / 3) {
    return p + (q - p) * (2 / 3 - x) * 6;
  }

  return p;
}

// =========================================

// COLOR PARSER

// =========================================

function parseColor(input, fallback) {
  if (!input) {
    return fallback;
  }

  let color = String(input).trim();

  // var(...)

  if (color.startsWith("var(")) {
    const comma = color.indexOf(",");

    if (comma < 0) {
      return fallback;
    }

    color = color.slice(comma + 1, color.lastIndexOf(")")).trim();
  }

  // =========================================

  // HEX

  // =========================================

  if (color[0] === "#") {
    const hex = color.slice(1);

    const full =
      hex.length === 3 || hex.length === 4
        ? hex

            .slice(0, 3)

            .split("")

            .map((char) => char + char)

            .join("")
        : hex.slice(0, 6);

    const number = parseInt(full, 16);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return [
      ((number >> 16) & 255) / 255,

      ((number >> 8) & 255) / 255,

      (number & 255) / 255,
    ];
  }

  // =========================================

  // RGB / RGBA / HSL / HSLA

  // =========================================

  const match = color.match(/^(rgba?|hsla?)\s*\(([^)]+)\)$/i);

  if (!match) {
    return fallback;
  }

  const parts = match[2].split(/[,\s/]+/).filter((part) => part.length > 0);

  if (parts.length < 3) {
    return fallback;
  }

  // =========================================

  // RGB

  // =========================================

  if (match[1].toLowerCase().startsWith("rgb")) {
    const raw = [
      parseFloat(parts[0]),

      parseFloat(parts[1]),

      parseFloat(parts[2]),
    ];

    if (!raw.every((value) => Number.isFinite(value))) {
      return fallback;
    }

    const scale = (text, value) =>
      text.includes("%") ? value / 100 : value / 255;

    return [
      clamp01(scale(parts[0], raw[0])),

      clamp01(scale(parts[1], raw[1])),

      clamp01(scale(parts[2], raw[2])),
    ];
  }

  // =========================================

  // HSL

  // =========================================

  const h = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360;

  const saturation = clamp01(parseFloat(parts[1]) / 100);

  const lightness = clamp01(parseFloat(parts[2]) / 100);

  if (
    !Number.isFinite(h) ||
    !Number.isFinite(saturation) ||
    !Number.isFinite(lightness)
  ) {
    return fallback;
  }

  if (saturation === 0) {
    return [lightness, lightness, lightness];
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;

  const p = 2 * lightness - q;

  return [
    hueToRgb(p, q, h + 1 / 3),

    hueToRgb(p, q, h),

    hueToRgb(p, q, h - 1 / 3),
  ];
}

// =========================================

// VERTEX SHADER

// =========================================

const VERTEX_SHADER = `

attribute vec2 aPos;

void main() {

  gl_Position = vec4(aPos, 0.0, 1.0);

}

`;

// =========================================

// FRAGMENT SHADER

// THIS IS THE ORIGINAL PHOSPHOR LOGIC

// =========================================

const FRAGMENT_SHADER = `

precision highp float;

uniform vec2  uRes;

uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseStrength;

uniform vec3  uBg;

uniform vec3  uBase;

uniform float uSpread;

uniform float uRadius;

uniform float uDist;

uniform float uTurb;

uniform float uGain;

// =========================================

// TANH

// =========================================

vec3 tanh3(vec3 x) {

  vec3 e = exp(-2.0 * abs(x));

  return sign(x) *

         (1.0 - e) /

         (1.0 + e);

}

// =========================================

// MAIN

// =========================================

void main() {

  // -----------------------------------------

  // CAMERA / RAY DIRECTION

  // -----------------------------------------

 // CAMERA / RAY DIRECTION

vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

vec2 mouse = (uMouse * uRes - 0.5 * uRes) / uRes.y;
vec2 mouseDelta = mouse - uv;
float mouseDistance = length(mouseDelta);

// Local, smooth deformation around the cursor
float mouseFalloff = exp(-mouseDistance * mouseDistance * 80.0);

vec2 mouseDirection =
    mouseDelta / max(mouseDistance, 0.0001);

// Move the sampled field locally instead of scaling the whole image
vec2 warpedUV = uv -
    mouseDirection *
    (0.035 * uMouseStrength * mouseFalloff);

vec3 dir = normalize(
    vec3(
        2.0 * warpedUV * uRes.y,
        1.0 - uRes.y
    )
);
  // -----------------------------------------

  // ACCUMULATION

  // -----------------------------------------

  vec3 acc = vec3(0.0);

  float z = 0.0;

  float d = 0.0;

  float s = 0.0;

  // -----------------------------------------

  // RAY MARCHING

  // -----------------------------------------

  for (int i = 0; i < 80; i++) {

   vec3 p = z * dir;

    // ---------------------------------------

    // ANIMATION VECTOR

    // ---------------------------------------

    vec3 a = normalize(

      cos(

        vec3(1.0, 2.0, 0.0)

        + uTime

        - d * 8.0

      )

    );

    // ---------------------------------------

    // DEPTH / DISTANCE

    // ---------------------------------------

    p.z += uDist;

    // ---------------------------------------

    // PHOSPHOR ROTATION / FIELD

    // ---------------------------------------

    a =

      a * dot(a, p)

      - cross(a, p);

    // ---------------------------------------

    // TURBULENCE

    // ---------------------------------------

    for (

      float k = 2.0;

      k < 10.0;

      k += 1.0

    ) {

      a +=

        uTurb *

        sin(a * k + uTime).yzx

        / k;

    }

    // ---------------------------------------

    // FIELD VALUE

    // ---------------------------------------

    s = a.y;

    // ---------------------------------------

    // DISTANCE FIELD

    // ---------------------------------------

    d = max(

      1e-6,

      0.1 *

      abs(length(p) - uRadius)

      +

      0.04 *

      abs(s)

    );

    // ---------------------------------------

    // MOVE THROUGH SPACE

    // ---------------------------------------

    z += d;

    // ---------------------------------------

    // ACCUMULATE LIGHT

    // ---------------------------------------

    acc +=

      (

        cos(

          s +

          vec3(0.0, 1.0, 2.0)

          * uSpread

        )

        + 1.0

      )

      / d

      * z;

  }

  // -----------------------------------------

  // GLOW

  // -----------------------------------------

  vec3 glow =

    tanh3(

      acc *

      uBase *

      uGain

    );

  // -----------------------------------------

  // COVER

  // -----------------------------------------

  float cover =

    max(

      max(glow.r, glow.g),

      glow.b

    );

  // -----------------------------------------

  // FINAL COLOR

  // -----------------------------------------

  gl_FragColor =

    vec4(

      uBg * (1.0 - cover)

      + glow,

      1.0

    );

}

`;

// =========================================

// SHADER CREATION

// =========================================

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Phosphor shader error:", gl.getShaderInfoLog(shader));

    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

// =========================================

// COMPONENT

// =========================================

function Phosphor({
  background = "#000000",

  baseColor = "#ffffff",

  spectrum = 100,

  size = 200,

  distance = 12,

  turbulence = 49,

  brightness = 176,

  speed = 100,

  style = {},
}) {
  const rootRef = useRef(null);

  const canvasRef = useRef(null);

  // -----------------------------------------

  // Keep latest props without recreating WebGL

  // -----------------------------------------

  const propsRef = useRef({
    background,

    baseColor,

    spectrum,

    size,

    distance,

    turbulence,

    brightness,

    speed,
  });

  propsRef.current = {
    background,

    baseColor,

    spectrum,

    size,

    distance,

    turbulence,

    brightness,

    speed,
  };

  // =========================================

  // WEBGL

  // =========================================

  useEffect(() => {
    const root = rootRef.current;

    const canvas = canvasRef.current;

    if (!root || !canvas) {
      return;
    }

    // ---------------------------------------

    // GET WEBGL

    // ---------------------------------------

    const gl = canvas.getContext("webgl", {
      antialias: false,

      alpha: false,

      depth: false,

      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.error("Phosphor: WebGL is unavailable.");

      return;
    }

    // =======================================

    // SHADERS

    // =======================================

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);

    const fragmentShader = compileShader(
      gl,

      gl.FRAGMENT_SHADER,

      FRAGMENT_SHADER,
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    // =======================================

    // PROGRAM

    // =======================================

    const program = gl.createProgram();

    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);

    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Phosphor link error:", gl.getProgramInfoLog(program));

      return;
    }

    gl.useProgram(program);

    // =======================================

    // FULL SCREEN TRIANGLE

    // =======================================

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,

      new Float32Array([
        -1, -1,

        3, -1,

        -1, 3,
      ]),

      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "aPos");

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // =======================================

    // UNIFORMS

    // =======================================

    const getUniform = (name) => gl.getUniformLocation(program, name);

    const uRes = getUniform("uRes");

    const uTime = getUniform("uTime");
    const uMouse = getUniform("uMouse");
    const uMouseStrength = getUniform("uMouseStrength");

    const uBg = getUniform("uBg");

    const uBase = getUniform("uBase");

    const uSpread = getUniform("uSpread");

    const uRadius = getUniform("uRadius");

    const uDist = getUniform("uDist");

    const uTurb = getUniform("uTurb");

    const uGain = getUniform("uGain");

    // =======================================

    // SIZE

    // =======================================

    let cssWidth = root.offsetWidth || 1;

    let cssHeight = root.offsetHeight || 1;

    const resizeObserver = new ResizeObserver(() => {
      cssWidth = root.offsetWidth || 1;

      cssHeight = root.offsetHeight || 1;
    });

    resizeObserver.observe(root);

    // Pointer interaction: normalized coordinates remain correct after resize.
    const pointerTarget = { x: 0.5, y: 0.5, strength: 0 };
    const pointerCurrent = { x: 0.5, y: 0.5, strength: 0 };

    const handlePointerMove = (event) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerTarget.x = clamp01((event.clientX - rect.left) / rect.width);
      pointerTarget.y = clamp01(1 - (event.clientY - rect.top) / rect.height);
      pointerTarget.strength = 1;
    };

    const handlePointerLeave = () => {
      pointerTarget.strength = 0;
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });

    // =======================================

    // REDUCED MOTION

    // =======================================

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // =======================================

    // ANIMATION

    // =======================================

    let animationFrame = 0;

    let lastTime = performance.now();

    let clock = 0;

    // =======================================

    // RENDER

    // =======================================

    const render = (now) => {
      animationFrame = requestAnimationFrame(render);

      // -------------------------------------

      // DELTA TIME

      // -------------------------------------

      const deltaTime = clamp((now - lastTime) / 1000, 0, 0.05);

      lastTime = now;

      const pointerEase = 1 - Math.exp(-deltaTime * 7.5);
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * pointerEase;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * pointerEase;
      pointerCurrent.strength +=
        (pointerTarget.strength - pointerCurrent.strength) * pointerEase;

      // -------------------------------------

      // CURRENT PROPS

      // -------------------------------------

      const props = propsRef.current;

      // -------------------------------------

      // MOTION

      // -------------------------------------

      const motion = reduceMotion ? 0 : 1;

      const rate = (clamp(num(props.speed, 50), 0, 100) / 50) * TIME_RATE;

      clock = (clock + deltaTime * motion * rate) % TAU;

      // =====================================

      // DPR

      // =====================================

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      const bufferWidth = Math.max(1, Math.round(cssWidth * dpr));

      const bufferHeight = Math.max(1, Math.round(cssHeight * dpr));

      // =====================================

      // RESIZE CANVAS

      // =====================================

      if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
        canvas.width = bufferWidth;

        canvas.height = bufferHeight;

        gl.viewport(0, 0, bufferWidth, bufferHeight);
      }

      // =====================================

      // COLORS

      // =====================================

      const bg = parseColor(props.background, [0, 0, 0]);

      const base = parseColor(props.baseColor, [1, 1, 1]);

      // =====================================

      // UNIFORM VALUES

      // =====================================

      gl.uniform2f(uRes, bufferWidth, bufferHeight);

      gl.uniform1f(uTime, clock);
      gl.uniform2f(uMouse, pointerCurrent.x, pointerCurrent.y);
      gl.uniform1f(uMouseStrength, pointerCurrent.strength);

      gl.uniform3f(uBg, bg[0], bg[1], bg[2]);

      gl.uniform3f(uBase, base[0], base[1], base[2]);

      // Spectrum

      gl.uniform1f(uSpread, clamp(num(props.spectrum, 100), 0, 100) / 100);

      // Size

      gl.uniform1f(
        uRadius,

        (clamp(num(props.size, 100), 20, 200) / 100) * REF_RADIUS,
      );

      // Distance

      gl.uniform1f(
        uDist,

        clamp(num(props.distance, 5), 2, 20),
      );

      // Turbulence

      gl.uniform1f(
        uTurb,

        clamp(num(props.turbulence, 100), 0, 200) / 100,
      );

      // Brightness

      gl.uniform1f(
        uGain,

        clamp(num(props.brightness, 100), 10, 400) / 100 / REF_EXPOSURE,
      );

      // =====================================

      // DRAW

      // =====================================

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // =======================================

    // START

    // =======================================

    animationFrame = requestAnimationFrame(render);

    // =======================================

    // CLEANUP

    // =======================================

    return () => {
      cancelAnimationFrame(animationFrame);

      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();

      if (buffer) {
        gl.deleteBuffer(buffer);
      }

      gl.deleteProgram(program);

      gl.deleteShader(vertexShader);

      gl.deleteShader(fragmentShader);
    };
  }, []);

  // =========================================

  // JSX

  // =========================================

  return (
    <div
      ref={rootRef}
      style={{
        minWidth: 0,

        minHeight: 0,

        width: "100%",

        height: "100%",

        position: "relative",

        overflow: "hidden",

        isolation: "isolate",

        background,

        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",

          display: "block",
        }}
      />
    </div>
  );
}

export default Phosphor;
