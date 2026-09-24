import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import type { CourseDef } from '@/types';

interface ModuleNodeDef {
  id: string;
  index: string;
  title: string;
  hours: number;
  progressPct: number;
}

function ModuleNode({
  mod,
  color,
  angle,
  onSelect,
}: {
  mod: ModuleNodeDef;
  color: string;
  angle: number;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = 0.35 + Math.sin(t * 1.2 + angle * 3) * 0.18;
      const s = hover ? 1.12 : 1;
      ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.4 + Math.sin(t * 2 + angle) * 0.2 + (hover ? 0.25 : 0);
      ring.current.rotation.z += 0.005;
    }
  });

  const r = 3.6;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const done = mod.progressPct >= 100;
  const attention = mod.progressPct < 50;

  return (
    <group position={[x, 0, z]}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(mod.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={mod.progressPct > 0 ? color : '#1a2436'}
            emissive={new THREE.Color(mod.progressPct > 0 ? color : '#0a1220')}
            emissiveIntensity={hover ? 1.2 : done ? 1 : 0.55}
            roughness={0.3}
            metalness={0.35}
            wireframe={mod.progressPct === 0}
          />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.02, 8, 48]} />
          <meshBasicMaterial color={attention ? '#fb7185' : color} transparent opacity={0.6} />
        </mesh>

        <Html position={[0, 1.15, 0]} center distanceFactor={8} zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => onSelect(mod.id)}
            className="flex flex-col items-center gap-0.5 whitespace-nowrap rounded-xl border border-white/10 bg-[#070b18]/85 px-3 py-1.5 backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400/40"
          >
            <span className="font-mono text-[9px] tracking-widest text-cyan-300/80">{mod.index}</span>
            <span className="max-w-[150px] truncate text-[10px] font-semibold text-slate-100">{mod.title}</span>
            <span className="text-[9px] text-slate-400">
              {mod.hours}h · <span style={{ color }}>{Math.round(mod.progressPct)}%</span>
            </span>
          </button>
        </Html>
      </group>
    </group>
  );
}

/** Subject detail environment: course nucleus + floating module objectives. */
export function CourseScene({
  course,
  modules,
  onSelectModule,
}: {
  course: CourseDef;
  modules: ModuleNodeDef[];
  onSelectModule: (id: string) => void;
}) {
  return (
    <Canvas dpr={[1, 1.7]} camera={{ position: [0, 4.5, 9.5], fov: 46 }} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 16, 40]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={14} color={course.color} distance={18} />
      <directionalLight position={[6, 8, 4]} intensity={0.4} />
      <Stars radius={50} depth={20} count={1600} factor={2.6} fade speed={0.3} />

      <CourseNucleus course={course} modules={modules} />

      {/* connector lines */}
      {modules.map((m, i) => {
        const angle = (i / modules.length) * Math.PI * 2 + Math.PI / 4;
        const r = 3.6;
        return (
          <mesh key={m.id} position={[(Math.cos(angle) * r) / 2, 0.1, (Math.sin(angle) * r) / 2]} rotation={[-Math.PI / 2, 0, angle]}>
            <planeGeometry args={[r, 0.012]} />
            <meshBasicMaterial color={course.color} transparent opacity={0.3} />
          </mesh>
        );
      })}

      {modules.map((m, i) => (
        <ModuleNode
          key={m.id}
          mod={m}
          color={course.color}
          angle={(i / modules.length) * Math.PI * 2 + Math.PI / 4}
          onSelect={onSelectModule}
        />
      ))}
    </Canvas>
  );
}

/** Rotating central nucleus of the subject environment (must live inside Canvas). */
function CourseNucleus({ course, modules }: { course: CourseDef; modules: ModuleNodeDef[] }) {
  const center = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (center.current) center.current.rotation.y += d * 0.3;
  });
  return (
    <group>
      <mesh ref={center}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color={course.color}
          emissive={new THREE.Color(course.color)}
          emissiveIntensity={0.85}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.55, 32, 32]} />
        <meshBasicMaterial color={course.color} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Html center position={[0, 0, 0]} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div className="rounded-2xl border border-white/10 bg-[#04060d]/75 px-4 py-3 text-center backdrop-blur-md">
          <div className="font-display text-[13px] font-bold tracking-wide text-white">{course.title}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-slate-400">
            {course.hours} hours · {modules.length} modules
          </div>
        </div>
      </Html>
    </group>
  );
}
