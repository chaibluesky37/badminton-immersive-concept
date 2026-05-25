import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MorphShader, DustShader } from '../shaders/morphShader';
import {
  generateShuttlecock,
  generateCourtGrid,
  generatePlayerSilhouette,
  generateRankingTower,
  generateDashboard,
  generateEcosystem
} from '../utils/shapeGenerators';

export interface MorphParticlesProps {
  scrollState: {
    progress: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
  };
  noiseStrength?: number;
  baseSize?: number;
}

export const MorphParticles: React.FC<MorphParticlesProps> = ({
  scrollState,
  noiseStrength = 0.35,
  baseSize = 28.0
}) => {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const dustGeomRef = useRef<THREE.BufferGeometry>(null);
  const dustMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const particleCount = 20000;

  // Background dust config
  const dustCount = 3500;
  const dustData = useMemo(() => {
    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      // Distribute in a large viewport box
      positions[i * 3] = (Math.random() - 0.5) * 9.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5.0;

      // Soft blue and amber glows
      const isGold = Math.random() < 0.35;
      if (isGold) {
        colors[i * 3] = 0.45;
        colors[i * 3 + 1] = 0.35;
        colors[i * 3 + 2] = 0.12;
      } else {
        colors[i * 3] = 0.12;
        colors[i * 3 + 1] = 0.28;
        colors[i * 3 + 2] = 0.45;
      }

      sizes[i] = 0.25 + Math.random() * 0.45;
    }
    return { positions, colors, sizes };
  }, [dustCount]);

  // 1. Generate 3D shape data once (6 shapes, index 0 is Shuttlecock)
  const shapes = useMemo(() => {
    return [
      generateShuttlecock(particleCount),
      generateCourtGrid(particleCount),
      generatePlayerSilhouette(particleCount),
      generateRankingTower(particleCount),
      generateDashboard(particleCount),
      generateEcosystem(particleCount)
    ];
  }, [particleCount]);

  // Random size variation array for particle sparkles
  const sizes = useMemo(() => {
    const s = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      s[i] = 0.4 + Math.random() * 1.0;
    }
    return s;
  }, [particleCount]);

  // 2. Set up shader geometry attributes
  useEffect(() => {
    if (!geomRef.current) return;
    const geom = geomRef.current;

    // Attach shape positions and colors as custom attributes (6 shapes)
    for (let i = 0; i < 6; i++) {
      geom.setAttribute(`aPosition${i}`, new THREE.BufferAttribute(shapes[i].positions, 3));
      geom.setAttribute(`aColor${i}`, new THREE.BufferAttribute(shapes[i].colors, 3));
    }

    // Attach size variation attribute
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Set initial default 'position' to prevent Three.js bounding sphere warnings
    geom.setAttribute('position', new THREE.BufferAttribute(shapes[0].positions, 3));
    
    // Compute bounding sphere once
    geom.computeBoundingSphere();
  }, [shapes, sizes]);

  // Set up dust geometry attributes
  useEffect(() => {
    if (!dustGeomRef.current) return;
    const geom = dustGeomRef.current;
    geom.setAttribute('position', new THREE.BufferAttribute(dustData.positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(dustData.colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(dustData.sizes, 1));
    geom.computeBoundingSphere();
  }, [dustData]);

  // 3. Setup Custom Material Uniforms
  const pixelRatio = useMemo(() => {
    return typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
  }, []);

  const uniforms = useMemo(() => {
    return {
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uNoiseStrength: { value: noiseStrength },
      uBaseSize: { value: baseSize },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0.85 }
    };
  }, [noiseStrength, baseSize, pixelRatio]);

  const dustUniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uBaseSize: { value: 22.0 },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0.30 }
    };
  }, [pixelRatio]);

  // 4. Update shader uniforms per frame
  useFrame((state) => {
    // Alternating horizontal position offsets based on scroll progress:
    // Sections: 0 (Hero - start/scattered: right), 0 (Hero - formed shuttlecock: right),
    // 1 (Booking - center-right), 2 (Player - left), 3 (Rankings - right), 4 (Admin - left), 5 (Ecosystem - right)
    const offsets = [1.4, 1.4, 0.8, -1.4, 1.4, -1.4, 1.4];
    const progress = scrollState.progress;
    const idx = Math.floor(progress);
    const fraction = progress - idx;
    const startOffset = offsets[Math.min(idx, 6)];
    const endOffset = offsets[Math.min(idx + 1, 6)];
    const currentOffset = THREE.MathUtils.lerp(startOffset, endOffset, fraction);

    if (pointsRef.current) {
      pointsRef.current.position.x = currentOffset;
      // Slow continuous rotation around Y axis to reveal 3D volume
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.04;
    }

    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms;
      // Direct uniform updates from shared scroll state & clock (zero React render overhead)
      uniforms.uProgress.value = scrollState.progress;
      uniforms.uTime.value = state.clock.getElapsedTime();
      uniforms.uNoiseStrength.value = noiseStrength;
      uniforms.uBaseSize.value = baseSize;
    }

    if (dustMaterialRef.current) {
      dustMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group>
      {/* Main Morphing Shapes */}
      <points ref={pointsRef}>
        <bufferGeometry ref={geomRef} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={MorphShader.vertexShader}
          fragmentShader={MorphShader.fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Background Ambient Dust (Never Morphs, Always Floats) */}
      <points>
        <bufferGeometry ref={dustGeomRef} />
        <shaderMaterial
          ref={dustMaterialRef}
          vertexShader={DustShader.vertexShader}
          fragmentShader={DustShader.fragmentShader}
          uniforms={dustUniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors={true}
        />
      </points>
    </group>
  );
};
