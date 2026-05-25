/**
 * morphShader.ts
 * GLSL Vertex and Fragment shaders for particle morphing and background dust.
 * Includes shared simplex/curl noise functions for organic sways.
 */

// Shared GLSL Noise utility to keep code DRY and maintainable
const NoiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3)));
  }

  vec3 snoiseVec3(vec3 x) {
    float s  = snoise(vec3(x));
    float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 5.2));
    float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
    return vec3(s, s1, s2);
  }

  vec3 curlNoise(vec3 p) {
    const float e = .1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p_x0 = snoiseVec3(p - dx);
    vec3 p_x1 = snoiseVec3(p + dx);
    vec3 p_y0 = snoiseVec3(p - dy);
    vec3 p_y1 = snoiseVec3(p + dy);
    vec3 p_z0 = snoiseVec3(p - dz);
    vec3 p_z1 = snoiseVec3(p + dz);

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const float divisor = 1.0 / (2.0 * e);
    return normalize(vec3(x, y, z) * divisor);
  }
`;

// 1. Morphing Shape Particles Shader Material
export const MorphShader = {
  uniforms: {
    uProgress: { value: 0.0 },       // 0.0 to 6.0 morph progress
    uTime: { value: 0.0 },           // Animation clock
    uNoiseStrength: { value: 0.35 },  // Max displacement amplitude during morph
    uBaseSize: { value: 28.0 },      // Base particle size
    uPixelRatio: { value: 1.0 },     // Screen pixel ratio
    uOpacity: { value: 0.85 },       // Overall material opacity
  },

  vertexShader: `
    uniform float uProgress;
    uniform float uTime;
    uniform float uNoiseStrength;
    uniform float uBaseSize;
    uniform float uPixelRatio;

    attribute vec3 aPosition0;
    attribute vec3 aPosition1;
    attribute vec3 aPosition2;
    attribute vec3 aPosition3;
    attribute vec3 aPosition4;
    attribute vec3 aPosition5;

    attribute vec3 aColor0;
    attribute vec3 aColor1;
    attribute vec3 aColor2;
    attribute vec3 aColor3;
    attribute vec3 aColor4;
    attribute vec3 aColor5;

    attribute float aSize;

    varying vec3 vColor;
    varying vec3 vPosition;

    ${NoiseGLSL}

    void main() {
      vec3 posStart;
      vec3 posEnd;
      vec3 colStart;
      vec3 colEnd;
      float t = 0.0;

      // Determine which shapes to interpolate between based on uProgress (0.0 to 6.0)
      if (uProgress < 1.0) {
        // Procedurally generated Scattered Dust as shape index 0
        // Use aPosition0 (Shuttlecock) coordinates as seeds to distribute randomly in space
        float rand = fract(sin(dot(aPosition0.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float theta = rand * 6.2831853;
        float phi = acos(fract(sin(dot(aPosition0.yz, vec2(53.123, 18.234))) * 43758.5453) * 2.0 - 1.0);
        float r = 2.0 + fract(sin(dot(aPosition0.xz, vec2(43.123, 93.345))) * 43758.5453) * 1.8;
        
        posStart = vec3(r * sin(phi) * cos(theta), r * sin(phi) * sin(theta), r * cos(phi));
        posEnd = aPosition0; // Assembles into Shuttlecock
        
        colStart = mix(vec3(0.05, 0.60, 0.95), vec3(0.70, 0.90, 1.0), rand);
        colEnd = aColor0;
        
        t = uProgress;
      } else if (uProgress < 2.0) {
        posStart = aPosition0; posEnd = aPosition1;
        colStart = aColor0;    colEnd = aColor1;
        t = uProgress - 1.0;
      } else if (uProgress < 3.0) {
        posStart = aPosition1; posEnd = aPosition2;
        colStart = aColor1;    colEnd = aColor2;
        t = uProgress - 2.0;
      } else if (uProgress < 4.0) {
        posStart = aPosition2; posEnd = aPosition3;
        colStart = aColor2;    colEnd = aColor3;
        t = uProgress - 3.0;
      } else if (uProgress < 5.0) {
        posStart = aPosition3; posEnd = aPosition4;
        colStart = aColor3;    colEnd = aColor4;
        t = uProgress - 4.0;
      } else {
        posStart = aPosition4; posEnd = aPosition5;
        colStart = aColor4;    colEnd = aColor5;
        t = clamp(uProgress - 5.0, 0.0, 1.0);
      }

      // Smooth step the interpolation factor to make the start and end of each morph snap nicely
      float smoothT = smoothstep(0.0, 1.0, t);

      // Base linear/smooth morph position
      vec3 basePosition = mix(posStart, posEnd, smoothT);
      
      // Interpolate colors
      vColor = mix(colStart, colEnd, smoothT);

      // Dissolve Turbulence: bell curve that peaks at smoothT = 0.5
      float noiseFactor = sin(smoothT * 3.14159265);
      
      // Calculate curl noise based on current position and time
      vec3 noiseOffset = curlNoise(basePosition * 1.6 + vec3(0.0, uTime * 0.25, 0.0));
      
      // Gentle holographic breathe/hover animation (bobbing up/down + local wave)
      float bob = sin(uTime * 0.45) * 0.14;
      vec3 drift = vec3(
        sin(uTime * 0.30 + basePosition.z * 1.6) * 0.11,
        cos(uTime * 0.24 + basePosition.x * 1.6) * 0.09 + bob,
        sin(uTime * 0.36 + basePosition.y * 1.6) * 0.11
      );

      // Final displaced position
      vec3 finalPosition = basePosition + (noiseOffset * uNoiseStrength * noiseFactor) + drift;
      vPosition = finalPosition;

      // Model view projection
      vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Sparkling/twinkling effect for morphing points
      float mainPulse = 0.88 + 0.12 * sin(uTime * 2.2 + basePosition.x * 30.0 + basePosition.y * 15.0);
      gl_PointSize = (uBaseSize * aSize * mainPulse * uPixelRatio) / (-mvPosition.z);
    }
  `,

  fragmentShader: `
    uniform float uOpacity;
    varying vec3 vColor;
    varying vec3 vPosition;

    void main() {
      // Convert standard square point to a soft round glow
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distSq = dot(coord, coord);

      if (distSq > 0.25) discard;

      // Soft circular gradient falloff
      float alpha = smoothstep(0.25, 0.04, distSq);

      // Super intense glowing core for simulated bloom
      float centerGlow = smoothstep(0.12, 0.0, distSq) * 1.5;
      float coreGlow = smoothstep(0.04, 0.0, distSq) * 2.0;

      vec3 finalColor = vColor + vec3(centerGlow * 0.5) + vec3(coreGlow);
      gl_FragColor = vec4(finalColor, alpha * uOpacity);
    }
  `
};

// 2. Ambient Background Floating Dust Shader Material
export const DustShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uBaseSize: { value: 16.0 },
    uPixelRatio: { value: 1.0 },
    uOpacity: { value: 0.28 }, // Dim opacity to stay in the background
  },

  vertexShader: `
    uniform float uTime;
    uniform float uBaseSize;
    uniform float uPixelRatio;

    attribute float aSize;

    varying vec3 vColor;
    varying vec3 vPosition;

    ${NoiseGLSL}

    void main() {
      vColor = color; // color attribute is pre-injected by Three.js when vertexColors = true
      
      // Infinite slow diagonal drift with wrap-around to keep the space active
      // Viewport box dimensions: X size 9.0 (-4.5 to 4.5), Y size 6.5 (-3.25 to 3.25), Z size 5.0 (-2.5 to 2.5)
      vec3 boxSize = vec3(9.0, 6.5, 5.0);
      vec3 halfBox = boxSize * 0.5;
      
      // Very slow drift speed to avoid distraction, but enough to feel alive
      vec3 velocity = vec3(0.06, 0.04, 0.02);
      vec3 drifted = position + velocity * uTime;
      
      // Modulo wrapping
      vec3 wrapped;
      wrapped.x = mod(drifted.x + halfBox.x, boxSize.x) - halfBox.x;
      wrapped.y = mod(drifted.y + halfBox.y, boxSize.y) - halfBox.y;
      wrapped.z = mod(drifted.z + halfBox.z, boxSize.z) - halfBox.z;
      
      // Add curl noise wind currents on top of linear drift for wavy flow
      vec3 wind = curlNoise(wrapped * 0.5 + vec3(uTime * 0.02, uTime * 0.03, uTime * 0.01)) * 0.65;
      vec3 finalPosition = wrapped + wind;
      vPosition = finalPosition;

      vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Sparkling/twinkling effect for ambient background dust
      float pulse = 0.70 + 0.30 * sin(uTime * 1.5 + position.x * 25.0 + position.y * 12.0);
      gl_PointSize = (uBaseSize * aSize * pulse * uPixelRatio) / (-mvPosition.z);
    }
  `,

  fragmentShader: `
    uniform float uOpacity;
    varying vec3 vColor;
    varying vec3 vPosition;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distSq = dot(coord, coord);

      if (distSq > 0.25) discard;

      // Soft bokeh gradient falloff (so background dust blends softly)
      float alpha = smoothstep(0.25, 0.02, distSq);

      gl_FragColor = vec4(vColor, alpha * uOpacity);
    }
  `
};
