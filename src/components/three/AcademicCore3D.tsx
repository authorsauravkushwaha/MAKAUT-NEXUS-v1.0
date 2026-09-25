import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import type { CourseDef } from '@/types';
import { SubjectPlanet } from '@/components/three/SubjectPlanet';
import { ProgressRing } from '@/components/ui';

/* ── Central Academic Core ───────────────────────────────────────── */
function Core({ readiness, onCoreClick }: { readiness: number; onCoreClick?: () => void }) {
  const inner = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const particles = useRef<THREE.Points>(null);

  const particleGeo = useMemo(() => {
    const count = 220;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (inner.current) {
      inner.current.rotation.y += delta * 0.25;
      inner.current.rotation.x += delta * 0.1;
      const s = 1 + Math.sin(t * 1.6) * 0.035;
      inner.current.scale.setScalar(s);
    }
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.12;
      shell.current.rotation.z += delta * 0.05;
    }
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.1 + Math.sin(t * 1.6) * 0.045;
    }
    if (particles.current) particles.current.rotation.y += delta * 0.08;
  });

  return (
    <group>
      {/* inner luminous core */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.15, 4]} />
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={1.4} roughness={0.2} metalness={0.4} />
      </mesh>

      {/* wireframe shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.3} />
      </mesh>

      {/* halo */}
      <mesh ref={halo}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <points ref={particles} geometry={particleGeo}>
        <pointsMaterial size={0.045} color="#67e8f9" transparent opacity={0.75} sizeAttenuation />
      </points>

      <pointLight position={[0, 0, 0]} intensity={18} color="#67e8f9" distance={16} />

      <Html center position={[0, 0, 0]} zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
        <button
          onClick={onCoreClick}
          style={{ pointerEvents: 'auto' }}
          className="flex flex-col items-center gap-1 rounded-3xl border border-cyan-400/25 bg-[#04060d]/70 px-5 py-4 backdrop-blur-md shadow-glow-cyan transition-all hover:scale-105 hover:border-cyan-300/50"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/80">Academic Core</span>
          <ProgressRing value={readiness} size={104} stroke={7} color="#22d3ee" />
          <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400">Current readiness</span>
        </button>
      </Html>
    </group>
  );
}

/* ── Drifting dust particles for depth ───────────────────────────── */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.01;
      ref.current.position.y = Math.sin(Date.now() * 0.0002) * 0.4;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.05} color="#7dd3fc" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

/* ── Scene ───────────────────────────────────────────────────────── */
export interface CoreProps {
  courses: { course: CourseDef; progressPct: number }[];
  readiness: number;
  onSelectCourse: (courseId: string) => void;
  onCoreClick?: () => void;
}

export function AcademicCore3D({ courses, readiness, onSelectCourse, onCoreClick }: CoreProps) {
  const orbits = useMemo(
    () =>
      courses.map((_, i) => ({
        radius: 4.6 + (i % 3) * 1.5 + Math.floor(i / 3) * 0.6,
        speed: 0.14 + (i % 4) * 0.045,
        phase: (i / courses.length) * Math.PI * 2,
        tilt: ((i % 2 === 0 ? 1 : -1) * (0.18 + (i % 3) * 0.12)),
      })),
    [courses],
  );

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 5.2, 14.5], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 22, 55]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 12, 6]} intensity={0.5} color="#bae6fd" />
      <pointLight position={[-10, -6, -8]} intensity={12} color="#8b5cf6" distance={30} />

      <Stars radius={70} depth={30} count={2600} factor={3.2} saturation={0} fade speed={0.4} />
      <Dust />

      <Core readiness={readiness} onCoreClick={onCoreClick} />

      {courses.map(({ course, progressPct }, i) => (
        <SubjectPlanet
          key={course.id}
          course={course}
          progressPct={progressPct}
          radius={orbits[i].radius}
          speed={orbits[i].speed}
          phase={orbits[i].phase}
          tilt={orbits[i].tilt}
          onSelect={onSelectCourse}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={24}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 1.85}
        autoRotate
        autoRotateSpeed={0.35}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
