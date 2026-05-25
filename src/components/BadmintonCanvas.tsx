import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MorphParticles } from './MorphParticles';

interface CameraControllerProps {
  scrollState: {
    progress: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
  };
}

const CameraController: React.FC<CameraControllerProps> = ({ scrollState }) => {
  useFrame((state) => {
    // 1. Mouse interactive parallax offset
    const parallaxX = state.pointer.x * 0.4;
    const parallaxY = state.pointer.y * 0.3;

    // 2. Smooth camera positioning with parallax drift interpolation
    const targetX = scrollState.cameraX + parallaxX;
    const targetY = scrollState.cameraY + parallaxY;
    const targetZ = scrollState.cameraZ;

    // Linear interpolation for camera positions (creating a smooth lag feel)
    state.camera.position.x += (targetX - state.camera.position.x) * 0.08;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.08;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.08;

    // 3. Dynamic camera focus point
    state.camera.lookAt(scrollState.lookAtX, scrollState.lookAtY, scrollState.lookAtZ);
  });

  return null;
};

export interface BadmintonCanvasProps {
  scrollState: {
    progress: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
  };
}

export const BadmintonCanvas: React.FC<BadmintonCanvasProps> = ({ scrollState }) => {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0.4, 4.5], fov: 60, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: false, stencil: false, depth: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#030307']} />
        
        {/* Lights (Particles are self-illuminated, but ambient helps outline R3F spaces) */}
        <ambientLight intensity={0.1} />

        {/* Morphing Particles */}
        <MorphParticles scrollState={scrollState} />

        {/* Smooth Camera movement controller */}
        <CameraController scrollState={scrollState} />
      </Canvas>
    </div>
  );
};
