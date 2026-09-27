import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

/**
 * The Study World of MAKAUT NEXUS — a miniature floating library rendered in
 * real 3D: a wall of glowing textbooks, an open book radiating knowledge, a
 * portal whose colour tracks the student's library progress, and paper notes
 * drifting through the air. Falls back to a rich CSS scene where WebGL is
 * unavailable (tests, old devices).
 */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function canUseWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

const SPINE_COLORS = [
  '#22d3ee', '#8b5cf6', '#3b82f6', '#34d399', '#f59e0b', '#f472b6',
  '#38bdf8', '#a78bfa', '#10b981', '#fbbf24', '#60a5fa', '#c084fc',
];

/** Back wall: rows of colourful textbook spines on dark shelves. */
function BookWall() {
  const books = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; z: number; color: string }[] = [];
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y = -1.15 + r * 0.78;
      let x = -4.6;
      let i = 0;
      while (x < 4.6) {
        const w = 0.16 + ((r * 13 + i * 7) % 5) * 0.05;
        const h = 0.5 + ((r * 5 + i * 3) % 5) * 0.055;
        out.push({
          x: x + w / 2,
          y: y + h / 2,
          w,
          h,
          z: -3.6 + (((r + i) % 3) * 0.05),
          color: SPINE_COLORS[(r * 13 + i * 7) % SPINE_COLORS.length],
        });
        x += w + 0.045;
        i++;
      }
    }
    return out;
  }, []);

  return (
    <group>
      {/* shelves */}
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <mesh key={r} position={[0, -1.2 + r * 0.78, -3.7]}>
          <boxGeometry args={[9.6, 0.07, 0.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      {/* back board */}
      <mesh position={[0, 1.4, -3.95]}>
        <boxGeometry args={[9.8, 5.6, 0.1]} />
        <meshStandardMaterial color="#0a1024" roughness={0.9} />
      </mesh>
      {/* spines */}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <boxGeometry args={[b.w, b.h, 0.34]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.28}
            roughness={0.45}
            metalness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Open book at the heart of the world, breathing softly. */
function OpenBook({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    if (!reduced) {
      group.current.position.y = 0.05 + Math.sin(t * 1.1) * 0.08;
      group.current.rotation.y = Math.sin(t * 0.35) * 0.28;
    }
  });
  return (
    <group ref={group} position={[0, 0.05, -0.6]}>
      {/* left page */}
      <mesh rotation={[0, 0.32, 0.06]} position={[-0.62, 0, 0]}>
        <boxGeometry args={[1.18, 0.045, 1.5]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#38bdf8" emissiveIntensity={0.18} roughness={0.55} />
      </mesh>
      {/* right page */}
      <mesh rotation={[0, -0.32, -0.06]} position={[0.62, 0, 0]}>
        <boxGeometry args={[1.18, 0.045, 1.5]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#8b5cf6" emissiveIntensity={0.18} roughness={0.55} />
      </mesh>
      {/* spine */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.16, 0.1, 1.55]} />
        <meshStandardMaterial color="#1e3a5f" emissive="#22d3ee" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      {/* knowledge beam rising off the pages */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.02, 0.34, 1.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 0.6, 0.3]} intensity={5} color="#67e8f9" distance={6} />
    </group>
  );
}

/** Progress portal — its glow shifts cyan → emerald as the library fills up. */
function Portal({ pct, reduced }: { pct: number; reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const color = useMemo(() => {
    const c1 = new THREE.Color('#22d3ee');
    const c2 = new THREE.Color('#34d399');
    return c1.clone().lerp(c2, Math.min(1, Math.max(0, pct / 100)));
  }, [pct]);
  useFrame((state, delta) => {
    if (ring.current && !reduced) ring.current.rotation.z += delta * 0.3;
    if (ring.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * (reduced ? 0.01 : 0.035);
      ring.current.scale.setScalar(s);
    }
  });
  return (
    <group position={[0, 1.05, -2.6]}>
      <mesh ref={ring}>
        <torusGeometry args={[1.35, 0.05, 16, 80]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.3} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.3, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* orbiting XP sparks */}
      {[0, 1, 2].map((i) => (
        <XpOrbit key={i} index={i} reduced={reduced}>
          <mesh>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#a5f3fc" />
          </mesh>
        </XpOrbit>
      ))}
    </group>
  );
}

function XpOrbit({
  index,
  reduced,
  children,
}: {
  index: number;
  reduced: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const speed = reduced ? 0 : 0.8 + index * 0.25;
    const a = state.clock.elapsedTime * speed + (index * Math.PI * 2) / 3;
    ref.current.position.set(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.1);
  });
  return <group ref={ref}>{children}</group>;
}

/** Loose notes drifting through the room. */
function PaperNotes({ reduced }: { reduced: boolean }) {
  const notes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: -3.4 + ((i * 1.7) % 6.8),
        y: -1 + ((i * 0.83) % 2.6),
        z: -2.4 + ((i * 1.13) % 3.4),
        speed: 0.14 + (i % 5) * 0.05,
        spin: 0.2 + (i % 4) * 0.12,
        color: SPINE_COLORS[i % SPINE_COLORS.length],
        phase: (i / 16) * Math.PI * 2,
      })),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current || reduced) return;
    group.current.children.forEach((child, i) => {
      const n = notes[i];
      child.position.y += delta * n.speed * 0.55;
      child.rotation.x += delta * n.spin;
      child.rotation.z += delta * n.spin * 0.6;
      child.position.x += Math.sin(state.clock.elapsedTime * 0.7 + n.phase) * delta * 0.16;
      if (child.position.y > 2.6) child.position.y = -1.6;
    });
  });
  return (
    <group ref={group}>
      {notes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshStandardMaterial
            color={n.color}
            emissive={n.color}
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Subtle pointer parallax around the whole room. */
function WorldRig({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      state.pointer.x * 0.16,
      0.04,
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -state.pointer.y * 0.07,
      0.04,
    );
  });
  return <group ref={ref}>{children}</group>;
}

function Hud({
  level,
  xp,
  pct,
}: {
  level: number;
  xp: number;
  pct: number;
}) {
  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
          📚 The Study World
        </span>
        <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-200">
          Level {level} · {xp.toLocaleString()} XP
        </span>
      </div>
      <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">
          Library world power
        </p>
        <div className="mt-1.5 h-2 w-44 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
            style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
          />
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 hidden text-right text-[11px] leading-relaxed text-slate-300/80 sm:block">
        <p>
          <span className="text-cyan-300">+10 XP</span> per note ·{' '}
          <span className="text-violet-300">+15 XP</span> per DPP
        </p>
        <p className="text-slate-400">Read · Solve · Level up · Repeat</p>
      </div>
    </>
  );
}

/** CSS-only world used where WebGL is missing (tests, ancient GPUs). */
function CssWorld({ pct, reduced }: { pct: number; reduced: boolean }) {
  const spines = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        w: 8 + ((i * 7) % 9),
        h: 44 + ((i * 13) % 34),
        color: SPINE_COLORS[i % SPINE_COLORS.length],
        tilt: ((i * 31) % 7) - 3,
      })),
    [],
  );
  return (
    <div
      data-testid="library-world-fallback"
      className="absolute inset-0 overflow-hidden bg-[#070b18]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(80%_70%_at_80%_110%,rgba(139,92,246,0.14),transparent_60%)]" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-[58%] rounded-full border-2 border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_80px_rgba(52,211,153,0.35)]" />
      <div className="absolute inset-x-[6%] top-[16%] bottom-[18%] flex flex-col justify-around">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="relative">
            <div className="flex items-end gap-[4px] px-2" style={{ transform: `rotate(${row % 2 ? 0.4 : -0.4}deg)` }}>
              {spines.slice(row * 14, row * 14 + 14).map((s, i) => (
                <div
                  key={i}
                  className={`rounded-[2px] border-t-2 border-black/30 ${reduced ? '' : 'animate-[noteFloat_5.5s_ease-in-out_infinite]'}`}
                  style={{
                    width: s.w,
                    height: s.h,
                    background: `linear-gradient(180deg, ${s.color}, ${s.color}99)`,
                    transform: `rotate(${s.tilt * 0.4}deg)`,
                    animationDelay: `${(i % 7) * 0.35}s`,
                    boxShadow: `0 0 14px ${s.color}44`,
                  }}
                />
              ))}
            </div>
            <div className="mt-1 h-[7px] rounded-sm bg-slate-800/90 shadow-[0_6px_18px_rgba(0,0,0,0.5)]" />
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl drop-shadow-[0_0_30px_rgba(34,211,238,0.55)]">
        📖
      </div>
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-black/40 px-3 py-1 text-[11px] font-semibold text-emerald-200"
        title="Library progress"
      >
        {Math.round(pct)}% world powered
      </div>
    </div>
  );
}

export interface LibraryWorldSceneProps {
  /** 0–100 library read/solve progress — drives the portal colour. */
  progressPct: number;
  level: number;
  xp: number;
  className?: string;
}

export default function LibraryWorldScene({
  progressPct,
  level,
  xp,
  className = '',
}: LibraryWorldSceneProps) {
  const [webgl] = useState(() => canUseWebGL());
  const [reduced] = useState(() => prefersReducedMotion());
  const pct = Math.max(0, Math.min(100, progressPct));

  return (
    <div
      data-testid="library-world-scene"
      className={`relative h-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-[#05070f] md:h-[460px] ${className}`}
      style={{ perspective: '1200px' }}
    >
      {webgl ? (
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0.35, 5.6], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
        >
          <fog attach="fog" args={['#04060f', 7, 24]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 6, 5]} intensity={0.5} />
          <pointLight position={[-4, 1, 2]} intensity={12} color="#22d3ee" distance={16} />
          <pointLight position={[4, 2, 1]} intensity={10} color="#8b5cf6" distance={16} />
          <Stars radius={40} depth={12} count={600} factor={2} saturation={0} fade speed={0.4} />
          <WorldRig reduced={reduced}>
            <BookWall />
            <Portal pct={pct} reduced={reduced} />
            <OpenBook reduced={reduced} />
            <PaperNotes reduced={reduced} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
              <planeGeometry args={[24, 24]} />
              <meshStandardMaterial color="#070b18" roughness={0.85} metalness={0.25} />
            </mesh>
            <gridHelper args={[24, 24, '#164e63', '#0c4a6e']} position={[0, -1.54, 0]} />
          </WorldRig>
        </Canvas>
      ) : (
        <CssWorld pct={pct} reduced={reduced} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
      <Hud level={level} xp={xp} pct={pct} />
    </div>
  );
}
