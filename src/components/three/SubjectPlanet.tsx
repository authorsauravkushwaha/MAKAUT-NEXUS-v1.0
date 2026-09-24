import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { CourseDef } from '@/types';

export type PlanetState = 'unstarted' | 'in-progress' | 'high' | 'completed' | 'attention';

export function planetState(progressPct: number): PlanetState {
  if (progressPct <= 0.5) return 'unstarted';
  if (progressPct >= 100) return 'completed';
  if (progressPct < 45) return 'attention';
  if (progressPct >= 70) return 'high';
  return 'in-progress';
}

interface Props {
  course: CourseDef;
  progressPct: number;
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  onSelect: (courseId: string) => void;
}

/**
 * A subject planet. Its visual state communicates academic status before
 * any number is read: dark → unstarted, glowing ring → in progress,
 * bright orbit → high progress, pulsing ring → needs attention.
 */
export function SubjectPlanet({ course, progressPct, radius, speed, phase, tilt, onSelect }: Props) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const state = planetState(progressPct);
  const color = course.color;

  const size = 0.42 + (progressPct / 100) * 0.34;

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  useFrame((_, delta) => {
    if (orbitRef.current) orbitRef.current.rotation.y += delta * speed;
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.4;
      const base = hovered ? 1.14 : 1;
      const pulse = state === 'attention' ? 1 + Math.sin(Date.now() * 0.004) * 0.07 : 1;
      planetRef.current.scale.setScalar(THREE.MathUtils.lerp(planetRef.current.scale.x, base * pulse, 0.12));
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity =
        state === 'unstarted' ? 0.12 : state === 'attention' ? 0.55 + Math.sin(Date.now() * 0.005) * 0.35 : state === 'high' ? 0.85 : 0.55;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, hovered ? Math.min(1, baseOpacity + 0.3) : baseOpacity, 0.1);
    }
  });

  const bright = state === 'high' || state === 'completed';

  return (
    <group rotation={[tilt, phase, 0]}>
      {/* orbit line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 6, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>

      <group ref={orbitRef}>
        <group position={[radius, 0, 0]}>
          <mesh
            ref={planetRef}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(course.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = 'auto';
            }}
          >
            <icosahedronGeometry args={[size, 3]} />
            <meshStandardMaterial
              color={state === 'unstarted' ? '#1a2436' : color}
              emissive={new THREE.Color(state === 'unstarted' ? '#0a1220' : color)}
              emissiveIntensity={state === 'unstarted' ? 0.15 : bright ? 0.9 : 0.55}
              roughness={0.35}
              metalness={0.25}
            />
          </mesh>

          {/* atmosphere glow */}
          <mesh scale={1.75}>
            <icosahedronGeometry args={[size, 2]} />
            <primitive object={glowMaterial} attach="material" />
          </mesh>

          {/* status ring */}
          <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0.4, 0]}>
            <torusGeometry args={[size * 1.55, 0.028, 8, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>

          {bright && (
            <mesh rotation={[Math.PI / 2.4, 0.4, 0]}>
              <torusGeometry args={[size * 2.0, 0.006, 6, 64]} />
              <meshBasicMaterial color={'#ffffff'} transparent opacity={0.35} />
            </mesh>
          )}

          {/* clickable label */}
          <Html
            position={[0, size + 0.55, 0]}
            center
            distanceFactor={9}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={() => onSelect(course.id)}
              className="group flex flex-col items-center gap-1 whitespace-nowrap rounded-xl border border-white/10 bg-[#070b18]/85 px-2.5 py-1.5 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:scale-105"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100">{course.short}</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-12 rounded-full bg-white/15 overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${progressPct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                </span>
                <span className="text-[9px] font-mono" style={{ color }}>
                  {Math.round(progressPct)}%
                </span>
              </span>
            </button>
          </Html>
        </group>
      </group>
    </group>
  );
}
