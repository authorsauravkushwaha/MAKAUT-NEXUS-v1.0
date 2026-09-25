import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';

/** Lightweight ambient scene for the landing page: a young core with orbiting sparks. */
function HeroCore() {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const swarm = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y += delta * 0.2;
      core.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    }
    if (shell.current) shell.current.rotation.y -= delta * 0.1;
    if (swarm.current) swarm.current.rotation.y += delta * 0.16;
  });

  const sparks = Array.from({ length: 7 }, (_, i) => ({
    r: 3 + (i % 3) * 1.1,
    phase: (i / 7) * Math.PI * 2,
    tilt: 0.2 + (i % 4) * 0.2,
    color: ['#22d3ee', '#8b5cf6', '#3b82f6', '#67e8f9', '#a78bfa', '#38bdf8', '#22d3ee'][i],
    speed: 0.2 + (i % 3) * 0.08,
  }));

  return (
    <group position={[0, -1.4, -1.5]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.5, 4]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={1.5} roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.32} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.7, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight intensity={22} color="#67e8f9" distance={20} />

      <group ref={swarm}>
        {sparks.map((s, i) => (
          <group key={i} rotation={[s.tilt, s.phase, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[s.r, 0.006, 6, 120]} />
              <meshBasicMaterial color={s.color} transparent opacity={0.2} />
            </mesh>
            <OrbitSpark radius={s.r} speed={s.speed} color={s.color} />
          </group>
        ))}
      </group>
    </group>
  );
}

function OrbitSpark({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius);
      if (mat.current) mat.current.opacity = 0.55 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.075, 12, 12]} />
      <meshBasicMaterial ref={mat} color={color} transparent />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 2.4, 11], fov: 50 }} gl={{ antialias: true, alpha: true }}>
      <fog attach="fog" args={['#04060d', 16, 46]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 10, 4]} intensity={0.4} />
      <Stars radius={60} depth={25} count={2200} factor={3} saturation={0} fade speed={0.35} />
      <HeroCore />
      <OrbitControls enablePan={false} enableZoom={false} enableDamping autoRotate autoRotateSpeed={0.25} />
    </Canvas>
  );
}
