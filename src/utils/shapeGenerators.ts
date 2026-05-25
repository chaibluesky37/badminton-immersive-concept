/**
 * shapeGenerators.ts
 * Generates coordinate and color arrays for morphing particles.
 * All shapes generate exactly N particles to match vertex buffer requirements.
 */

// Helper to generate a random point inside a sphere
function randomInSphere(radius: number): [number, number, number] {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = radius * Math.pow(Math.random(), 1/3); // Cube root for uniform distribution
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ];
}

// Helper to linearly interpolate (mix) values
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

// 1. Shuttlecock: cork hemisphere (bottom) + flared skirt (top)
export function generateShuttlecock(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const scale = 1.25;

  // Distribute particle counts to exactly sum to count
  const corkCount = Math.floor(count * 0.20);   // 4,000 pts
  const collarCount = Math.floor(count * 0.08); // 1,600 pts
  const ribCount = Math.floor(count * 0.15);    // 3,000 pts
  const threadCount = Math.floor(count * 0.05); // 1,000 pts
  const trailCount = Math.floor(count * 0.05);  // 1,000 pts
  const featherCount = count - corkCount - collarCount - ribCount - threadCount - trailCount; // ~9,400 pts

  let idx = 0;

  // 1. Rounded Cork Base (Hemisphere pointing downwards)
  const R_cork = 0.35 * scale;
  const yCorkCenter = -0.55 * scale;
  for (let i = 0; i < corkCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random()); // 0 to PI/2 (upper half, but we negate Y to point down)
    
    // 75% on the outer shell for crisp outline, 25% inside for volume glow
    const isShell = Math.random() < 0.75;
    const r = R_cork * (isShell ? 1.0 : Math.pow(Math.random(), 1/3));

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = yCorkCenter - r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Glowing intense Neon Blue
    colors[idx * 3] = 0.0;
    colors[idx * 3 + 1] = 0.75;
    colors[idx * 3 + 2] = 1.0;
    idx++;
  }

  // 2. Collar Ring (Ribbon band directly above cork)
  const yCollarMin = -0.55 * scale;
  const yCollarMax = -0.47 * scale;
  const R_collar = 0.35 * scale;
  for (let i = 0; i < collarCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const y = yCollarMin + Math.random() * (yCollarMax - yCollarMin);
    
    // Add slight thickness to the band
    const r = R_collar + (Math.random() - 0.5) * 0.008;

    positions[idx * 3] = r * Math.cos(angle);
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = r * Math.sin(angle);

    // Glowing bright Cyan
    colors[idx * 3] = 0.0;
    colors[idx * 3 + 1] = 0.95;
    colors[idx * 3 + 2] = 1.0;
    idx++;
  }

  // 3. Radial Feather Ribs (16 clean curves curving outward/upward)
  const R_base = 0.33 * scale; // narrow waist at the collar
  const R_top = 0.82 * scale;  // wide feather skirt top
  const yBase = -0.47 * scale;
  const yTop = 0.98 * scale;
  const H = yTop - yBase;

  const ptsPerRib = Math.floor(ribCount / 16);
  for (let k = 0; k < 16; k++) {
    const angle_k = (k / 16) * Math.PI * 2;
    const currentRibPts = (k === 15) ? (ribCount - (ptsPerRib * 15)) : ptsPerRib;

    for (let i = 0; i < currentRibPts; i++) {
      const t = Math.random(); // parameter from 0.0 to 1.0
      const y = yBase + t * H;
      const r = R_base + (R_top - R_base) * Math.pow(t, 1.45); // Flared profile

      positions[idx * 3] = r * Math.cos(angle_k) + (Math.random() - 0.5) * 0.004;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = r * Math.sin(angle_k) + (Math.random() - 0.5) * 0.004;

      // Bright Cyan-White for rib lines
      colors[idx * 3] = 0.75 + t * 0.25;
      colors[idx * 3 + 1] = 0.92 + t * 0.08;
      colors[idx * 3 + 2] = 1.0;
      idx++;
    }
  }

  // 4. Feather Panels (16 panels with clear negative space gaps)
  // Each panel k spans from angle_k to angle_k + (2 * PI / 16) * 0.55 (leaves 45% gap)
  const ptsPerFeather = Math.floor(featherCount / 16);
  for (let k = 0; k < 16; k++) {
    const angle_k = (k / 16) * Math.PI * 2;
    const currentFeatherPts = (k === 15) ? (featherCount - (ptsPerFeather * 15)) : ptsPerFeather;

    for (let i = 0; i < currentFeatherPts; i++) {
      const t = 0.32 + Math.random() * 0.68; // Feathers exist in the upper part (t from 0.32 to 1.0)
      const u = Math.random(); // angular width span (0.0 to 1.0)

      const y = yBase + t * H;
      const r = R_base + (R_top - R_base) * Math.pow(t, 1.45);
      
      // Feather angular width: 55% of spacing
      const theta = angle_k + u * (Math.PI * 2 / 16) * 0.55;

      positions[idx * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * 0.004;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 0.004;

      // Brighter highlight edges: if near the rib (u < 0.12), outer edge (u > 0.88), or top crown (t > 0.95)
      const isEdge = (u < 0.12 || u > 0.88 || t > 0.95);
      if (isEdge) {
        // Bright cyan-white highlight
        colors[idx * 3] = 0.85;
        colors[idx * 3 + 1] = 0.95;
        colors[idx * 3 + 2] = 1.0;
      } else {
        // Sparse light cyan/blue holographic panels
        colors[idx * 3] = 0.22;
        colors[idx * 3 + 1] = 0.60;
        colors[idx * 3 + 2] = 0.88;
      }
      idx++;
    }
  }

  // 5. Wrapping Threads (Two horizontal rings holding the feathers together)
  const threadT1 = 0.28;
  const threadT2 = 0.62;
  const rThread1 = R_base + (R_top - R_base) * Math.pow(threadT1, 1.45);
  const rThread2 = R_base + (R_top - R_base) * Math.pow(threadT2, 1.45);
  const yThread1 = yBase + threadT1 * H;
  const yThread2 = yBase + threadT2 * H;

  for (let i = 0; i < threadCount; i++) {
    const isRing1 = Math.random() < 0.5;
    const r = isRing1 ? rThread1 : rThread2;
    const y = isRing1 ? yThread1 : yThread2;

    const angle = Math.random() * Math.PI * 2;

    positions[idx * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * 0.006;
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.004;
    positions[idx * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * 0.006;

    // Glowing cyan/gold thread lines
    colors[idx * 3] = 0.1;
    colors[idx * 3 + 1] = 0.85;
    colors[idx * 3 + 2] = 1.0;
    idx++;
  }

  // 6. Supportive Elegant Trails (1 or 2 elegant spirals wrapping around)
  for (let i = 0; i < trailCount; i++) {
    const t = i / trailCount;
    // Single helix trail winding around
    const y = -0.8 * scale + t * 2.1 * scale;
    const r = scale * (0.40 + 0.50 * Math.pow(t, 1.45)) * 1.15; // slightly outer path
    const theta = t * 6.5 * Math.PI + (Math.random() - 0.5) * 0.06;

    positions[idx * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * 0.02;
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.02;
    positions[idx * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 0.02;

    // Lower opacity, thin atmospheric glow (faint blue/gold blend)
    colors[idx * 3] = mix(0.08, 0.32, t) * 0.6;
    colors[idx * 3 + 1] = mix(0.25, 0.28, t) * 0.6;
    colors[idx * 3 + 2] = mix(0.45, 0.08, t) * 0.6;
    idx++;
  }

  // Guarantee exact count
  while (idx < count) {
    positions[idx * 3] = 0;
    positions[idx * 3 + 1] = 0;
    positions[idx * 3 + 2] = 0;
    colors[idx * 3] = 1;
    colors[idx * 3 + 1] = 1;
    colors[idx * 3 + 2] = 1;
    idx++;
  }

  return { positions, colors };
}

// 2. Court Grid: badminton court lines + net mesh + active player indicators
export function generateCourtGrid(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Badminton court dimensions scaled (length = 6, width = 3, y = -0.8)
  const L = 5.6; // total length (-2.8 to 2.8)
  const W = 2.6; // total width (-1.3 to 1.3)
  const yCourt = -0.8;

  // Let's define the key lines of a badminton court:
  // 1. Sidelines: left outer, right outer, left inner, right inner
  // 2. Baselines: back outer, back inner (long service line for doubles)
  // 3. Short service lines (at z = -0.76 and z = 0.76)
  // 4. Center line (z from short service line to baseline, dividing left/right service courts)
  // 5. Net line (z = 0)
  
  // We can define line segments. A line segment is from point A to point B.
  const segments: Array<{ a: [number, number, number]; b: [number, number, number]; weight: number }> = [
    // Outer boundaries
    { a: [-W/2, yCourt, -L/2], b: [W/2, yCourt, -L/2], weight: 1 }, // Back baseline
    { a: [-W/2, yCourt, L/2], b: [W/2, yCourt, L/2], weight: 1 },  // Front baseline
    { a: [-W/2, yCourt, -L/2], b: [-W/2, yCourt, L/2], weight: 2 }, // Left doubles sideline
    { a: [W/2, yCourt, -L/2], b: [W/2, yCourt, L/2], weight: 2 },  // Right doubles sideline

    // Inner boundaries
    { a: [-W/2 + 0.18, yCourt, -L/2], b: [-W/2 + 0.18, yCourt, L/2], weight: 1 }, // Left singles sideline
    { a: [W/2 - 0.18, yCourt, -L/2], b: [W/2 - 0.18, yCourt, L/2], weight: 1 },  // Right singles sideline
    { a: [-W/2, yCourt, -L/2 + 0.32], b: [W/2, yCourt, -L/2 + 0.32], weight: 1 }, // Back doubles service line
    { a: [-W/2, yCourt, L/2 - 0.32], b: [W/2, yCourt, L/2 - 0.32], weight: 1 },  // Front doubles service line
    
    // Short service lines
    { a: [-W/2, yCourt, -0.76], b: [W/2, yCourt, -0.76], weight: 1 },
    { a: [-W/2, yCourt, 0.76], b: [W/2, yCourt, 0.76], weight: 1 },

    // Center service lines
    { a: [0, yCourt, -L/2], b: [0, yCourt, -0.76], weight: 1 },
    { a: [0, yCourt, L/2], b: [0, yCourt, 0.76], weight: 1 },
  ];

  // Calculate total weight to distribute points
  let totalWeight = 0;
  segments.forEach(s => totalWeight += s.weight);

  const linesCount = Math.floor(count * 0.45);
  const netCount = Math.floor(count * 0.35);
  const activeCount = count - linesCount - netCount;

  let idx = 0;

  // 1. Distribute points on the lines
  segments.forEach((seg, sIdx) => {
    const segCount = (sIdx === segments.length - 1) 
      ? (linesCount - idx) 
      : Math.floor((seg.weight / totalWeight) * linesCount);

    for (let i = 0; i < segCount; i++) {
      const t = Math.random();
      const x = seg.a[0] + (seg.b[0] - seg.a[0]) * t;
      const y = seg.a[1] + (seg.b[1] - seg.a[1]) * t + (Math.random() - 0.5) * 0.01;
      const z = seg.a[2] + (seg.b[2] - seg.a[2]) * t;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Soft glowing cyan for court lines
      colors[idx * 3] = 0.1;
      colors[idx * 3 + 1] = 0.7;
      colors[idx * 3 + 2] = 0.9;
      idx++;
    }
  });

  // 2. Net Mesh: at z = 0, x from -W/2 to W/2, y from yCourt to yCourt + 0.65
  // We make grid pattern lines
  const netH = 0.65;
  const netTop = yCourt + netH;
  for (let i = 0; i < netCount; i++) {
    // Distribute on the net plane
    const x = (Math.random() - 0.5) * W;
    const y = yCourt + Math.random() * netH;
    const z = (Math.random() - 0.5) * 0.02; // very thin

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Faint grid lines color (semi-translucent soft white-blue)
    const isNetCord = y > netTop - 0.04; // net top tape is brighter
    if (isNetCord) {
      colors[idx * 3] = 0.9;
      colors[idx * 3 + 1] = 0.95;
      colors[idx * 3 + 2] = 1.0;
    } else {
      colors[idx * 3] = 0.25;
      colors[idx * 3 + 1] = 0.35;
      colors[idx * 3 + 2] = 0.5;
    }
    idx++;
  }

  // 3. Active Court Status indicators (floating circles, rings, active session pulses)
  // Let's create two active playing zones at both halves
  const zone1Center = [0, yCourt + 0.1, -1.8];
  const zone2Center = [0, yCourt + 0.1, 1.8];

  const halfActive = Math.floor(activeCount / 2);
  for (let i = 0; i < activeCount; i++) {
    const center = (i < halfActive) ? zone1Center : zone2Center;
    const isCourtOne = (i < halfActive);
    
    // We can distribute particles in orbits or circular ripples to make it look "active"
    let x = 0, y = 0, z = 0;
    let r = 0, g = 0, b = 0;

    // Split active particles into: ripples (50%), floating sparks (50%)
    if (i % 2 === 0) {
      // Circular ripples expanding
      const radius = 0.2 + (i % 5) * 0.15 + Math.random() * 0.05;
      const angle = Math.random() * Math.PI * 2;
      x = center[0] + Math.cos(angle) * radius;
      y = center[1] + (Math.random() - 0.5) * 0.03;
      z = center[2] + Math.sin(angle) * radius;

      // Color scheme: court 1 (neon green/cyan), court 2 (soft gold/orange reserved)
      if (isCourtOne) {
        // Active - Green/Cyan
        r = 0.0; g = 1.0; b = 0.6;
      } else {
        // Reserved - Soft gold/amber
        r = 1.0; g = 0.7; b = 0.1;
      }
    } else {
      // Floating sparks rising
      const radius = Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      x = center[0] + Math.cos(angle) * radius;
      y = center[1] + Math.random() * 1.2;
      z = center[2] + Math.sin(angle) * radius;

      if (isCourtOne) {
        r = 0.2; g = 0.8; b = 1.0; // Neon blue sparks
      } else {
        r = 0.9; g = 0.8; b = 0.4; // Gold sparks
      }
    }

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    colors[idx * 3] = r;
    colors[idx * 3 + 1] = g;
    colors[idx * 3 + 2] = b;
    idx++;
  }

  // Guarantee exact count
  while (idx < count) {
    positions[idx * 3] = 0;
    positions[idx * 3 + 1] = yCourt;
    positions[idx * 3 + 2] = 0;
    colors[idx * 3] = 1;
    colors[idx * 3 + 1] = 1;
    colors[idx * 3 + 2] = 1;
    idx++;
  }

  return { positions, colors };
}

// 3. Player Journey: Smash pose silhouette + motion trails wrapping around the body
export function generatePlayerSilhouette(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Define skeleton nodes for a mid-air badminton smash
  // Joint coordinates centered
  const head = [0, 1.2, 0];
  const neck = [0, 1.0, 0];
  const spine = [0.05, 0.4, -0.05];
  const hips = [0.1, -0.1, -0.1];
  
  // Left Arm (extended for balance)
  const lShoulder = [-0.15, 0.95, 0.1];
  const lElbow = [-0.45, 1.1, 0.25];
  const lHand = [-0.7, 1.2, 0.4];

  // Right Arm (hitting/raised high)
  const rShoulder = [0.25, 0.95, -0.1];
  const rElbow = [0.45, 1.45, -0.2];
  const rHand = [0.65, 1.95, -0.05];

  // Racket
  const racketTip = [1.1, 2.8, 0.3];
  
  // Left Leg (tucked up)
  const lHip = [-0.05, -0.2, 0.05];
  const lKnee = [-0.25, -0.6, 0.3];
  const lFoot = [-0.15, -0.9, 0.5];

  // Right Leg (kicked back for arch)
  const rHip = [0.2, -0.2, -0.15];
  const rKnee = [0.4, -0.7, -0.4];
  const rFoot = [0.65, -0.9, -0.7];

  // Helper to interpolate between two joints
  function getPointOnBone(a: number[], b: number[], noiseAmt: number): [number, number, number] {
    const t = Math.random();
    const x = a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * noiseAmt;
    const y = a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * noiseAmt;
    const z = a[2] + (b[2] - a[2]) * t + (Math.random() - 0.5) * noiseAmt;
    return [x, y, z];
  }

  const silhouetteCount = Math.floor(count * 0.5);
  const trailCount = Math.floor(count * 0.45);
  const racketCount = count - silhouetteCount - trailCount;

  let idx = 0;

  // 1. Generate player silhouette
  // We pick bones randomly
  const bones = [
    { start: neck, end: head, weight: 1.5, thickness: 0.12 }, // Head
    { start: neck, end: spine, weight: 2, thickness: 0.1 },  // Upper torso
    { start: spine, end: hips, weight: 2, thickness: 0.1 },  // Lower torso
    // Left Arm
    { start: lShoulder, end: lElbow, weight: 1, thickness: 0.06 },
    { start: lElbow, end: lHand, weight: 1, thickness: 0.05 },
    // Right Arm
    { start: rShoulder, end: rElbow, weight: 1, thickness: 0.06 },
    { start: rElbow, end: rHand, weight: 1, thickness: 0.05 },
    // Left Leg
    { start: lHip, end: lKnee, weight: 1.2, thickness: 0.07 },
    { start: lKnee, end: lFoot, weight: 1.2, thickness: 0.06 },
    // Right Leg
    { start: rHip, end: rKnee, weight: 1.2, thickness: 0.07 },
    { start: rKnee, end: rFoot, weight: 1.2, thickness: 0.06 },
  ];

  let totalBoneWeight = 0;
  bones.forEach(b => totalBoneWeight += b.weight);

  bones.forEach((bone, bIdx) => {
    const bonePoints = (bIdx === bones.length - 1)
      ? (silhouetteCount - idx)
      : Math.floor((bone.weight / totalBoneWeight) * silhouetteCount);

    for (let i = 0; i < bonePoints; i++) {
      const pt = getPointOnBone(bone.start, bone.end, bone.thickness);
      positions[idx * 3] = pt[0];
      positions[idx * 3 + 1] = pt[1];
      positions[idx * 3 + 2] = pt[2];

      // Player body colors: glowing deep blues, cyans, and white Highlights
      const t = Math.random();
      colors[idx * 3] = 0.05;                   // R
      colors[idx * 3 + 1] = 0.4 + t * 0.5;      // G (light cyan/blue)
      colors[idx * 3 + 2] = 0.8 + t * 0.2;      // B
      idx++;
    }
  });

  // 2. Generate Racket: shaft + oval head
  // Shaft goes from rHand [0.65, 1.95, -0.05] to racketBase [0.8, 2.2, 0.05]
  const rBase = [0.75, 2.2, 0.05];
  const racketCenter = [0.95, 2.5, 0.17];
  
  const racketShaftCount = Math.floor(racketCount * 0.3);
  const racketHeadCount = racketCount - racketShaftCount;

  // Shaft points
  for (let i = 0; i < racketShaftCount; i++) {
    const pt = getPointOnBone(rHand, rBase, 0.015);
    positions[idx * 3] = pt[0];
    positions[idx * 3 + 1] = pt[1];
    positions[idx * 3 + 2] = pt[2];

    // Metallic silver/cyan
    colors[idx * 3] = 0.6;
    colors[idx * 3 + 1] = 0.8;
    colors[idx * 3 + 2] = 0.95;
    idx++;
  }

  // Racket Head: oval centered at racketCenter
  // Major axis along racket axis (towards racketTip)
  // Let's create points along the rim and some strings inside
  const axisX = racketTip[0] - rBase[0];
  const axisY = racketTip[1] - rBase[1];
  const axisZ = racketTip[2] - rBase[2];
  const axisLen = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);
  const dirX = axisX / axisLen;
  const dirY = axisY / axisLen;
  const dirZ = axisZ / axisLen;

  // Orthogonal direction for width of racket (arbitrary normal vector)
  const orthX = -dirY;
  const orthY = dirX;
  const orthZ = 0.0;

  for (let i = 0; i < racketHeadCount; i++) {
    let x = 0, y = 0, z = 0;
    const isRim = Math.random() < 0.4;
    
    const rx = 0.3; // length radius
    const ry = 0.22; // width radius

    if (isRim) {
      const theta = Math.random() * Math.PI * 2;
      const dL = Math.cos(theta) * rx;
      const dW = Math.sin(theta) * ry;

      x = racketCenter[0] + dirX * dL + orthX * dW;
      y = racketCenter[1] + dirY * dL + orthY * dW;
      z = racketCenter[2] + dirZ * dL + orthZ * dW;
    } else {
      // Netting strings
      const u = (Math.random() - 0.5) * 2; // -1 to 1
      const v = (Math.random() - 0.5) * 2; // -1 to 1
      // check if inside ellipse
      if (u*u + v*v <= 1.0) {
        const dL = u * rx;
        const dW = v * ry;
        x = racketCenter[0] + dirX * dL + orthX * dW;
        y = racketCenter[1] + dirY * dL + orthY * dW;
        z = racketCenter[2] + dirZ * dL + orthZ * dW;
      } else {
        // scale to fit boundary
        const dist = Math.sqrt(u*u + v*v);
        const dL = (u / dist) * rx * Math.random();
        const dW = (v / dist) * ry * Math.random();
        x = racketCenter[0] + dirX * dL + orthX * dW;
        y = racketCenter[1] + dirY * dL + orthY * dW;
        z = racketCenter[2] + dirZ * dL + orthZ * dW;
      }
    }

    // Glowing Neon Yellow/Cyan for racket
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    colors[idx * 3] = 0.1;
    colors[idx * 3 + 1] = 0.9;
    colors[idx * 3 + 2] = 1.0;
    idx++;
  }

  // 3. Motion Trails: abstract curves wrapping around the player
  // Let's create a beautiful helical sweep starting from below, passing through the body and shooting off the racket tip
  for (let i = 0; i < trailCount; i++) {
    const t = (i / trailCount); // 0 to 1
    
    // Animate helix: height goes from -1.5 up to 3.2
    const y = -1.5 + t * 4.7;
    const radius = 1.2 * (1.0 - t * 0.7); // narrows down as it goes up
    const speed = 12.0; // rotations
    const angle = t * speed * Math.PI + (Math.random() - 0.5) * 0.1;

    // Path
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;

    // Add some random dispersion to make the trail look smoky/glowing
    const dispersion = 0.1 + (1.0 - t) * 0.2;
    x += (Math.random() - 0.5) * dispersion;
    z += (Math.random() - 0.5) * dispersion;
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.1;
    positions[idx * 3 + 2] = z;

    // Trail morphs color from dark blue at bottom, cyan in middle, gold at the racket tip!
    if (t < 0.4) {
      // Dark to Neon Blue
      colors[idx * 3] = 0.0;
      colors[idx * 3 + 1] = 0.3;
      colors[idx * 3 + 2] = 0.9;
    } else if (t < 0.8) {
      // Neon Cyan
      colors[idx * 3] = 0.0;
      colors[idx * 3 + 1] = 0.85;
      colors[idx * 3 + 2] = 1.0;
    } else {
      // Gold highlights shooting off the racket
      const goldBlend = (t - 0.8) / 0.2; // 0 to 1
      colors[idx * 3] = 0.0 + goldBlend * 1.0;
      colors[idx * 3 + 1] = 0.85 - goldBlend * 0.05;
      colors[idx * 3 + 2] = 1.0 - goldBlend * 0.8; // B goes down to 0.2
    }
    
    // Add extra brightness to trails
    colors[idx * 3] *= 1.3;
    colors[idx * 3 + 1] *= 1.3;
    colors[idx * 3 + 2] *= 1.3;

    idx++;
  }

  // Guarantee exact count
  while (idx < count) {
    positions[idx * 3] = 0;
    positions[idx * 3 + 1] = 0;
    positions[idx * 3 + 2] = 0;
    colors[idx * 3] = 1;
    colors[idx * 3 + 1] = 1;
    colors[idx * 3 + 2] = 1;
    idx++;
  }

  return { positions, colors };
}

// 4. Ranking System: Tower / Ladder
// A cylindrical tower structure with 4 tiered platform discs, central pillar, and spiral nodes
export function generateRankingTower(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const levelCount = 4;
  const yBottom = -1.2;
  const yTop = 1.5;
  const H = yTop - yBottom; // 2.7

  // Level Y coordinates
  const Ys = [-1.2, -0.4, 0.4, 1.2];
  // Radii of platforms
  const Radii = [1.5, 1.1, 0.8, 0.5];

  const platformPointsCount = Math.floor(count * 0.45);
  const pillarPointsCount = Math.floor(count * 0.2);
  const helixPointsCount = Math.floor(count * 0.2);
  const playerNodesCount = count - platformPointsCount - pillarPointsCount - helixPointsCount;

  let idx = 0;

  // 1. Generate Platform Discs (4 levels)
  const ptsPerPlatform = Math.floor(platformPointsCount / levelCount);
  for (let l = 0; l < levelCount; l++) {
    const currentPlatformPts = (l === levelCount - 1) ? (platformPointsCount - (ptsPerPlatform * (levelCount - 1))) : ptsPerPlatform;
    const y = Ys[l];
    const rMax = Radii[l];

    for (let i = 0; i < currentPlatformPts; i++) {
      let x = 0, z = 0;
      const isRim = Math.random() < 0.4;
      
      if (isRim) {
        // Platform boundary ring
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * rMax;
        z = Math.sin(angle) * rMax;
      } else {
        // Inside the disc
        const angle = Math.random() * Math.PI * 2;
        const r = rMax * Math.sqrt(Math.random());
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      }

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.02;
      positions[idx * 3 + 2] = z;

      // Colors: gold top tier, silver second, bronze third, cyan bottom
      if (l === 3) {
        // Gold
        colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.8; colors[idx * 3 + 2] = 0.2;
      } else if (l === 2) {
        // Silver/White
        colors[idx * 3] = 0.8; colors[idx * 3 + 1] = 0.85; colors[idx * 3 + 2] = 0.9;
      } else if (l === 1) {
        // Bronze/Orange
        colors[idx * 3] = 0.8; colors[idx * 3 + 1] = 0.45; colors[idx * 3 + 2] = 0.2;
      } else {
        // Cyan/Blue
        colors[idx * 3] = 0.0; colors[idx * 3 + 1] = 0.6; colors[idx * 3 + 2] = 0.9;
      }
      idx++;
    }
  }

  // 2. Generate Central Pillar and vertical support rods
  // Central core is a cylinder of radius 0.15, from yBottom to yTop
  // Plus 3 outer columns connecting levels
  for (let i = 0; i < pillarPointsCount; i++) {
    const isCentral = Math.random() < 0.6;
    const y = yBottom + Math.random() * H;
    let x = 0, z = 0;

    if (isCentral) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.12 * Math.random();
      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r;
    } else {
      // Outer rods: 3 rods at 120 degree offsets, at radius = 0.7
      const rodIdx = Math.floor(Math.random() * 3);
      const angle = (rodIdx / 3) * Math.PI * 2;
      const rRod = 0.7;
      x = Math.cos(angle) * rRod + (Math.random() - 0.5) * 0.03;
      z = Math.sin(angle) * rRod + (Math.random() - 0.5) * 0.03;
    }

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Dim, high-tech grid column (faint blue)
    colors[idx * 3] = 0.15;
    colors[idx * 3 + 1] = 0.35;
    colors[idx * 3 + 2] = 0.5;
    idx++;
  }

  // 3. Helix winding around the tower (ranking progression path)
  for (let i = 0; i < helixPointsCount; i++) {
    const t = i / helixPointsCount; // 0 to 1
    const y = yBottom + t * H;
    const rHelix = 1.6 - t * 1.1; // spiral inwards
    const angle = t * 6.0 * Math.PI; // 3 rotations

    const x = Math.cos(angle) * rHelix + (Math.random() - 0.5) * 0.04;
    const z = Math.sin(angle) * rHelix + (Math.random() - 0.5) * 0.04;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Glowing cyan/pink trail
    colors[idx * 3] = 0.2 + t * 0.6; // transitions from blue to violet/pink
    colors[idx * 3 + 1] = 0.8 - t * 0.6;
    colors[idx * 3 + 2] = 1.0;
    idx++;
  }

  // 4. Player Nodes: clusters of particles forming glowing spheres at levels
  // These represent player profiles moving up/down the ranking
  const nodeCount = 8;
  const ptsPerNode = Math.floor(playerNodesCount / nodeCount);
  
  // Define positions for 8 player nodes on platforms
  const nodes = [
    { pos: [0.9, Ys[0] + 0.15, 0.9], col: [0.0, 0.9, 1.0] },  // Level 0
    { pos: [-0.9, Ys[0] + 0.15, -0.9], col: [0.0, 0.9, 1.0] },
    { pos: [0.7, Ys[1] + 0.15, -0.4], col: [0.9, 0.5, 0.2] },  // Level 1
    { pos: [-0.6, Ys[1] + 0.15, 0.6], col: [0.9, 0.5, 0.2] },
    { pos: [0.5, Ys[2] + 0.15, 0.4], col: [0.8, 0.8, 0.9] },  // Level 2
    { pos: [-0.4, Ys[2] + 0.15, -0.4], col: [0.8, 0.8, 0.9] },
    { pos: [0.25, Ys[3] + 0.15, 0.25], col: [1.0, 0.8, 0.1] }, // Level 3 (Global Top)
    { pos: [-0.25, Ys[3] + 0.15, -0.25], col: [1.0, 0.8, 0.1] }
  ];

  nodes.forEach((node, nIdx) => {
    const currentNodesCount = (nIdx === nodeCount - 1) ? (playerNodesCount - (ptsPerNode * (nodeCount - 1))) : ptsPerNode;
    for (let i = 0; i < currentNodesCount; i++) {
      // Generate in a small sphere
      const pt = randomInSphere(0.08 + Math.random() * 0.04);
      
      positions[idx * 3] = node.pos[0] + pt[0];
      positions[idx * 3 + 1] = node.pos[1] + pt[1];
      positions[idx * 3 + 2] = node.pos[2] + pt[2];

      colors[idx * 3] = node.col[0];
      colors[idx * 3 + 1] = node.col[1];
      colors[idx * 3 + 2] = node.col[2];
      idx++;
    }
  });

  return { positions, colors };
}

// 5. Venue Admin: Floating high-tech holographic dashboard/control panel
export function generateDashboard(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // We design several elements:
  // 1. A tilted holographic background plate: x in [-1.6, 1.6], y in [-1.0, 1.0], z = 0 (tilted slightly in 3D)
  // 2. Bar chart: 5 bars at the bottom
  // 3. Donut chart (circular ring of points) in the upper right
  // 4. Line graph waves in the upper left
  // 5. Text outline/indicators (dots representing HUD elements)

  const backgroundCount = Math.floor(count * 0.35);
  const barCount = Math.floor(count * 0.25);
  const donutCount = Math.floor(count * 0.2);
  const lineCount = count - backgroundCount - barCount - donutCount;

  let idx = 0;

  // Plane tilt angle in 3D (tilted back slightly for depth)
  // We can define a local coordinate system and transform to world space
  const tiltAngle = -0.15; // pitch rotation around X
  const rollAngle = 0.2;  // yaw/roll around Y

  function toWorld(lx: number, ly: number, lz: number): [number, number, number] {
    // Apply pitch (tilt) around X axis
    const cosX = Math.cos(tiltAngle);
    const sinX = Math.sin(tiltAngle);
    
    // Rotate Y & Z
    const ry = ly * cosX - lz * sinX;
    const rz = ly * sinX + lz * cosX;

    // Apply yaw (roll) around Y axis
    const cosY = Math.cos(rollAngle);
    const sinY = Math.sin(rollAngle);
    const rx = lx * cosY + rz * sinY;
    const rwz = -lx * sinY + rz * cosY;

    return [rx, ry, rwz];
  }

  // 1. Background Grid Plate: a thin border outline and a dotted grid
  const gridRows = 16;
  const gridCols = 24;
  const wBack = 2.4;
  const hBack = 1.6;

  for (let i = 0; i < backgroundCount; i++) {
    let lx = 0, ly = 0, lz = 0;
    let isBorder = Math.random() < 0.3;
    let r = 0.1, g = 0.4, b = 0.8; // default HUD blue

    if (isBorder) {
      // Outer border points
      const borderSelector = Math.random();
      const t = Math.random() - 0.5; // -0.5 to 0.5
      if (borderSelector < 0.25) {
        // Top edge
        lx = t * wBack; ly = hBack / 2;
      } else if (borderSelector < 0.5) {
        // Bottom edge
        lx = t * wBack; ly = -hBack / 2;
      } else if (borderSelector < 0.75) {
        // Left edge
        lx = -wBack / 2; ly = t * hBack;
      } else {
        // Right edge
        lx = wBack / 2; ly = t * hBack;
      }
      lz = (Math.random() - 0.5) * 0.02;
      r = 0.2; g = 0.6; b = 1.0; // Brighter border
    } else {
      // Grid points (aligned to grid lines, with some fuzziness)
      const col = Math.floor(Math.random() * gridCols);
      const row = Math.floor(Math.random() * gridRows);
      
      lx = (-0.5 + col / (gridCols - 1)) * wBack + (Math.random() - 0.5) * 0.01;
      ly = (-0.5 + row / (gridRows - 1)) * hBack + (Math.random() - 0.5) * 0.01;
      lz = (Math.random() - 0.5) * 0.01;

      // Dotted faint grid
      r = 0.05; g = 0.2; b = 0.5;
    }

    const worldPt = toWorld(lx, ly, lz);
    positions[idx * 3] = worldPt[0];
    positions[idx * 3 + 1] = worldPt[1];
    positions[idx * 3 + 2] = worldPt[2];

    colors[idx * 3] = r;
    colors[idx * 3 + 1] = g;
    colors[idx * 3 + 2] = b;
    idx++;
  }

  // 2. Bar Chart: 5 vertical bars at the bottom
  // x-range on dashboard: -1.0 to -0.1, y-range: -0.6 to 0.0
  const barNum = 5;
  const barWidth = 0.12;
  const barGap = 0.08;
  const startX = -1.0;
  const baseLineY = -0.6;
  const barHeights = [0.4, 0.7, 0.55, 0.9, 0.75]; // normalized heights

  const ptsPerBar = Math.floor(barCount / barNum);
  for (let b = 0; b < barNum; b++) {
    const currentBarPts = (b === barNum - 1) ? (barCount - (ptsPerBar * (barNum - 1))) : ptsPerBar;
    const bHeight = barHeights[b] * 0.7; // actual height in dashboard units
    const bCenterX = startX + b * (barWidth + barGap) + barWidth / 2;

    for (let i = 0; i < currentBarPts; i++) {
      // Random position inside the bar volume
      const lx = bCenterX + (Math.random() - 0.5) * barWidth;
      const ly = baseLineY + Math.random() * bHeight;
      const lz = 0.05 + (Math.random() - 0.5) * 0.02; // floats slightly in front

      const worldPt = toWorld(lx, ly, lz);
      positions[idx * 3] = worldPt[0];
      positions[idx * 3 + 1] = worldPt[1];
      positions[idx * 3 + 2] = worldPt[2];

      // Bar color: cyan to green gradient based on height
      const tHeight = (ly - baseLineY) / bHeight;
      colors[idx * 3] = 0.0;
      colors[idx * 3 + 1] = 0.6 + tHeight * 0.4; // turns bright green at the top
      colors[idx * 3 + 2] = 1.0 - tHeight * 0.5; // less blue at the top
      idx++;
    }
  }

  // 3. Donut Chart: in the upper right
  // Center: [0.6, 0.3], Outer Radius: 0.35, Inner Radius: 0.22
  const dCenterX = 0.6;
  const dCenterY = 0.3;
  const dOuterR = 0.32;
  const dInnerR = 0.20;

  for (let i = 0; i < donutCount; i++) {
    // Generate inside a ring
    const angle = Math.random() * Math.PI * 2;
    const r = dInnerR + (dOuterR - dInnerR) * Math.sqrt(Math.random());
    const lx = dCenterX + Math.cos(angle) * r;
    const ly = dCenterY + Math.sin(angle) * r;
    const lz = 0.05 + (Math.random() - 0.5) * 0.02;

    const worldPt = toWorld(lx, ly, lz);
    positions[idx * 3] = worldPt[0];
    positions[idx * 3 + 1] = worldPt[1];
    positions[idx * 3 + 2] = worldPt[2];

    // Colors divided into sections (e.g. 120deg blue, 150deg green, 90deg gold)
    const deg = (angle + Math.PI) / (Math.PI * 2); // 0 to 1
    if (deg < 0.4) {
      // Neon Blue section
      colors[idx * 3] = 0.0; colors[idx * 3 + 1] = 0.5; colors[idx * 3 + 2] = 1.0;
    } else if (deg < 0.75) {
      // Emerald Green section
      colors[idx * 3] = 0.1; colors[idx * 3 + 1] = 0.9; colors[idx * 3 + 2] = 0.4;
    } else {
      // Gold/Amber section
      colors[idx * 3] = 1.0; colors[idx * 3 + 1] = 0.75; colors[idx * 3 + 2] = 0.1;
    }
    idx++;
  }

  // 4. Line graph waves: in the upper left
  // x-range: -1.0 to 0.0, base Y: 0.3. Plot a sine wave representing statistics
  const lStartX = -1.0;
  const lWidth = 0.95;
  const lBaseY = 0.35;

  for (let i = 0; i < lineCount; i++) {
    const isMainLine = Math.random() < 0.5;
    
    if (isMainLine) {
      // Core curve points
      const t = Math.random(); // 0 to 1
      const lx = lStartX + t * lWidth;
      // Wavy sine curve
      const ly = lBaseY + Math.sin(t * 8.0) * 0.2 + Math.cos(t * 3.0) * 0.1;
      const lz = 0.06 + (Math.random() - 0.5) * 0.01;

      const worldPt = toWorld(lx, ly, lz);
      positions[idx * 3] = worldPt[0];
      positions[idx * 3 + 1] = worldPt[1];
      positions[idx * 3 + 2] = worldPt[2];

      // Glowing pink/violet line
      colors[idx * 3] = 1.0;
      colors[idx * 3 + 1] = 0.1;
      colors[idx * 3 + 2] = 0.6;
    } else {
      // Under-line fill area or minor dots
      const t = Math.random();
      const lx = lStartX + t * lWidth;
      const curveY = lBaseY + Math.sin(t * 8.0) * 0.2 + Math.cos(t * 3.0) * 0.1;
      const ly = lBaseY - 0.2 + Math.random() * (curveY - (lBaseY - 0.2));
      const lz = 0.04 + (Math.random() - 0.5) * 0.02;

      const worldPt = toWorld(lx, ly, lz);
      positions[idx * 3] = worldPt[0];
      positions[idx * 3 + 1] = worldPt[1];
      positions[idx * 3 + 2] = worldPt[2];

      // Faint purple fill
      colors[idx * 3] = 0.3;
      colors[idx * 3 + 1] = 0.05;
      colors[idx * 3 + 2] = 0.4;
    }
    idx++;
  }

  return { positions, colors };
}

// 6. Ecosystem: Giant connected neural-net cosmic map
// Consists of 1 central large node sphere, 8 outer medium node spheres, 
// orbital dust rings, and connecting coordinate webs
export function generateEcosystem(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const centerSphereCount = Math.floor(count * 0.18);
  const outerSpheresCount = Math.floor(count * 0.32); // 8 spheres of 4% each
  const connectionsCount = Math.floor(count * 0.3);
  const orbitalRingsCount = count - centerSphereCount - outerSpheresCount - connectionsCount;

  let idx = 0;

  // 1. Central Core Sphere: at [0, 0, 0], R = 0.45
  for (let i = 0; i < centerSphereCount; i++) {
    const pt = randomInSphere(0.4);
    positions[idx * 3] = pt[0];
    positions[idx * 3 + 1] = pt[1];
    positions[idx * 3 + 2] = pt[2];

    // Core color: gold & white core
    const t = Math.random();
    colors[idx * 3] = 1.0;            // R
    colors[idx * 3 + 1] = 0.8 + t * 0.2; // G
    colors[idx * 3 + 2] = 0.3 + t * 0.7; // B
    idx++;
  }

  // 2. Outer Spheres: 8 hub nodes on a sphere of radius R = 1.8
  const outerCenterRadius = 1.7;
  const outerNodePositions: Array<[number, number, number]> = [];
  
  // Distribute 8 points evenly on a sphere using Fibonacci spiral or simple math
  for (let s = 0; s < 8; s++) {
    const phi = Math.acos(-1.0 + (2.0 * s) / 8);
    const theta = Math.sqrt(8.0 * Math.PI) * phi;
    
    const sx = outerCenterRadius * Math.sin(phi) * Math.cos(theta);
    const sy = outerCenterRadius * Math.sin(phi) * Math.sin(theta);
    const sz = outerCenterRadius * Math.cos(phi);
    
    outerNodePositions.push([sx, sy, sz]);
  }

  const ptsPerOuter = Math.floor(outerSpheresCount / 8);
  outerNodePositions.forEach((nodePos, sIdx) => {
    const currentOuterCount = (sIdx === 7) ? (outerSpheresCount - (ptsPerOuter * 7)) : ptsPerOuter;
    
    // Different colors for different hubs (representing: Booking, Venue, Player, Tournaments, etc.)
    let hubColor = [0.0, 0.8, 1.0]; // Default neon blue
    if (sIdx === 0) hubColor = [0.0, 1.0, 0.5]; // green
    if (sIdx === 1) hubColor = [1.0, 0.5, 0.0]; // orange
    if (sIdx === 2) hubColor = [1.0, 0.2, 0.6]; // pink
    if (sIdx === 3) hubColor = [0.8, 0.3, 1.0]; // purple
    if (sIdx === 4) hubColor = [1.0, 0.85, 0.1]; // gold
    if (sIdx === 5) hubColor = [0.1, 0.9, 0.9]; // cyan

    for (let i = 0; i < currentOuterCount; i++) {
      const pt = randomInSphere(0.12 + Math.random() * 0.06);
      positions[idx * 3] = nodePos[0] + pt[0];
      positions[idx * 3 + 1] = nodePos[1] + pt[1];
      positions[idx * 3 + 2] = nodePos[2] + pt[2];

      colors[idx * 3] = hubColor[0];
      colors[idx * 3 + 1] = hubColor[1];
      colors[idx * 3 + 2] = hubColor[2];
      idx++;
    }
  });

  // 3. Connections: lines of points connecting the center sphere to outer spheres, and outer spheres to each other
  // Let's create lines: center -> each outer node, plus outer node -> neighboring outer nodes
  // Let's define the connections array
  const connLines: Array<{ from: [number, number, number]; to: [number, number, number] }> = [];
  
  // Center to outer nodes
  outerNodePositions.forEach(pos => {
    connLines.push({ from: [0, 0, 0], to: pos });
  });

  // Outer nodes to neighbor outer nodes
  for (let i = 0; i < 8; i++) {
    // connect to next index
    connLines.push({ from: outerNodePositions[i], to: outerNodePositions[(i + 1) % 8] });
    // connect to index + 3 (cross connection)
    connLines.push({ from: outerNodePositions[i], to: outerNodePositions[(i + 3) % 8] });
  }

  const ptsPerConn = Math.floor(connectionsCount / connLines.length);
  connLines.forEach((line, lIdx) => {
    const currentConnCount = (lIdx === connLines.length - 1) ? (connectionsCount - (ptsPerConn * (connLines.length - 1))) : ptsPerConn;
    
    for (let i = 0; i < currentConnCount; i++) {
      const t = Math.random();
      // add slight waviness/noise to connections
      const noise = (Math.random() - 0.5) * 0.03;
      
      const x = line.from[0] + (line.to[0] - line.from[0]) * t + noise;
      const y = line.from[1] + (line.to[1] - line.from[1]) * t + noise;
      const z = line.from[2] + (line.to[2] - line.from[2]) * t + noise;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Blend color between the two nodes
      colors[idx * 3] = 0.15;
      colors[idx * 3 + 1] = 0.45;
      colors[idx * 3 + 2] = 0.75;
      idx++;
    }
  });

  // 4. Orbital Rings: large rings of dust orbiting the whole system
  // We'll make two intersecting rings of radius 2.3 and 2.5
  const ring1Count = Math.floor(orbitalRingsCount * 0.5);
  const ring2Count = orbitalRingsCount - ring1Count;

  // Ring 1: flat horizontal ring
  for (let i = 0; i < ring1Count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 2.0 + Math.random() * 0.6; // thick band
    
    const x = Math.cos(angle) * r;
    const y = (Math.random() - 0.5) * 0.1;
    const z = Math.sin(angle) * r;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Glowing cyan/white dust
    const blend = Math.random();
    colors[idx * 3] = 0.0 + blend * 0.5;
    colors[idx * 3 + 1] = 0.6 + blend * 0.4;
    colors[idx * 3 + 2] = 0.9 + blend * 0.1;
    idx++;
  }

  // Ring 2: tilted ring
  const ringAngle = 0.8; // tilt around X axis
  for (let i = 0; i < ring2Count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1.8 + Math.random() * 0.7; // thick band

    const rx = Math.cos(angle) * r;
    const ry = (Math.random() - 0.5) * 0.15;
    const rz = Math.sin(angle) * r;

    // Apply rotation around X axis
    const cosX = Math.cos(ringAngle);
    const sinX = Math.sin(ringAngle);
    const x = rx;
    const y = ry * cosX - rz * sinX;
    const z = ry * sinX + rz * cosX;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    // Glowing purple/gold dust
    const blend = Math.random();
    colors[idx * 3] = 0.7 + blend * 0.3; // R
    colors[idx * 3 + 1] = 0.3 + blend * 0.5; // G
    colors[idx * 3 + 2] = 0.9 - blend * 0.7; // B
    idx++;
  }

  return { positions, colors };
}

export function generateScatteredDust(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Generate scattered points inside a spherical volume
    const radius = 2.2 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2.0 * Math.random() - 1.0);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Cyan-white soft glowing colors
    const blend = Math.random();
    colors[i * 3] = 0.1 + blend * 0.5;      // R
    colors[i * 3 + 1] = 0.7 + blend * 0.25;  // G
    colors[i * 3 + 2] = 1.0;                 // B
  }
  return { positions, colors };
}
