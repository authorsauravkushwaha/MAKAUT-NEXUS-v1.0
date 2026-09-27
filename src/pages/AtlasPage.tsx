import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Search, LocateFixed, Compass, Zap, MapPin } from 'lucide-react';
import { useNexus } from '@/state/context';
import { librarySubjects, getSubjectLibrary, booksForSubject, libraryVideos, libraryTotals } from '@/lib/library';
import { levelProgress, levelTitle } from '@/lib/gamify';
import { cn } from '@/components/ui';

/* ── NEXUS ATLAS — the whole syllabus as one living, zoomable universe ── */

interface AtlasNode {
  id: string;
  title: string;
  short: string;
  color: string;
  x: number;
  y: number;
  z: number;
  chapters: number;
  dpps: number;
  books: number;
  videos: number;
}

interface View {
  px: number; py: number; dist: number;
  tpx: number; tpy: number; tdist: number;
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

function CameraRig({ view }: { view: View }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.12, Math.min(dt, 0.05));
    view.px += (view.tpx - view.px) * k;
    view.py += (view.tpy - view.py) * k;
    view.dist += (view.tdist - view.dist) * k;
    camera.position.set(view.px, view.py, view.dist);
    camera.lookAt(view.px, view.py, 0);
  });
  return null;
}

function GlowNode({
  n, hovered, dimmed, onOver, onOut, onClick,
}: {
  n: AtlasNode; hovered: boolean; dimmed: boolean;
  onOver: (id: string) => void; onOut: () => void; onClick: (id: string) => void;
}) {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!grp.current) return;
    const target = hovered ? 1.45 : 1;
    const s = grp.current.scale.x + (target - grp.current.scale.x) * Math.min(1, dt * 7);
    grp.current.scale.setScalar(s);
    if (hovered) grp.current.rotation.z += dt * 0.4;
  });
  const op = dimmed ? 0.22 : 1;
  return (
    <group
      ref={grp}
      position={[n.x, n.y, n.z]}
      onPointerOver={(e) => { e.stopPropagation(); onOver(n.id); }}
      onPointerOut={() => onOut()}
      onClick={(e) => { e.stopPropagation(); onClick(n.id); }}
    >
      <mesh>
        <sphereGeometry args={[0.72, 24, 24]} />
        <meshBasicMaterial color={n.color} transparent opacity={0.95 * op} />
      </mesh>
      <mesh scale={2}>
        <sphereGeometry args={[0.72, 18, 18]} />
        <meshBasicMaterial color={n.color} transparent opacity={(hovered ? 0.26 : 0.15) * op} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={3.4}>
        <sphereGeometry args={[0.72, 14, 14]} />
        <meshBasicMaterial color={n.color} transparent opacity={0.07 * op} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {hovered && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.85, 0.03, 10, 80]} />
          <meshBasicMaterial color="#e8f8ff" transparent opacity={0.95} />
        </mesh>
      )}
      <Html center distanceFactor={34} position={[0, 2.1, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={cn(
          'flex flex-col items-center gap-0.5 whitespace-nowrap rounded-lg border px-2 py-1 backdrop-blur-md transition-opacity duration-300',
          hovered ? 'border-white/30 bg-[#0a1020]/90 opacity-100' : 'border-white/10 bg-[#0a1020]/70 opacity-90',
          dimmed && 'opacity-25',
        )}>
          <span className="font-display text-[11px] font-bold tracking-wide text-white">{n.short}</span>
          <span className="text-[8.5px] uppercase tracking-[0.14em] text-slate-400">
            {n.chapters}ch · {n.books}bk · {n.videos}vid
          </span>
        </div>
      </Html>
    </group>
  );
}

function CoreHub({ onClick, dimmed }: { onClick: () => void; dimmed: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ring.current) { ring.current.rotation.z += dt * 0.25; ring.current.rotation.x += dt * 0.08; } });
  const op = dimmed ? 0.3 : 1;
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.95 * op} />
      </mesh>
      <mesh scale={2.2}>
        <sphereGeometry args={[1.25, 18, 18]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.16 * op} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={4}>
        <sphereGeometry args={[1.25, 14, 14]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.08 * op} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.6, 0.035, 10, 96]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.75 * op} />
      </mesh>
      <Html center distanceFactor={34} position={[0, 3.1, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center whitespace-nowrap rounded-lg border border-cyan-400/40 bg-[#0a1020]/85 px-2.5 py-1 backdrop-blur-md">
          <span className="font-display text-[11px] font-bold tracking-[0.18em] text-cyan-200">NEXUS CORE</span>
          <span className="text-[8.5px] uppercase tracking-[0.14em] text-slate-400">command center</span>
        </div>
      </Html>
    </group>
  );
}

function SceneContents({
  view, nodes, hovered, setHovered, query, onEnter, onCore,
}: {
  view: View; nodes: AtlasNode[]; hovered: string | null; query: string;
  setHovered: (id: string | null) => void; onEnter: (id: string) => void; onCore: () => void;
}) {
  const q = query.trim().toLowerCase();
  return (
    <>
      <fog attach="fog" args={['#04060d', 78, 165]} />
      <CameraRig view={view} />
      <Stars radius={110} depth={55} count={2600} factor={3.4} saturation={0} fade speed={0.5} />
      {nodes.map((n) => (
        <Line
          key={`e-${n.id}`}
          points={[[0, 0, 0], [n.x, n.y, n.z]]}
          color={n.color}
          lineWidth={1}
          transparent
          opacity={q && !n.title.toLowerCase().includes(q) && !n.short.toLowerCase().includes(q) ? 0.04 : 0.18}
        />
      ))}
      <CoreHub onClick={onCore} dimmed={!!q} />
      {nodes.map((n) => (
        <GlowNode
          key={n.id}
          n={n}
          hovered={hovered === n.id}
          dimmed={!!q && !n.title.toLowerCase().includes(q) && !n.short.toLowerCase().includes(q)}
          onOver={setHovered}
          onOut={() => setHovered(null)}
          onClick={onEnter}
        />
      ))}
    </>
  );
}

export function AtlasPage() {
  const navigate = useNavigate();
  const { state } = useNexus();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [zoomPct, setZoomPct] = useState(100);
  const [flyTick, setFlyTick] = useState(0);

  const view = useMemo<View>(() => ({ px: 0, py: 0, dist: 150, tpx: 0, tpy: 0, tdist: 58 }), []);

  const nodes = useMemo<AtlasNode[]>(() => {
    const vids = libraryVideos();
    return librarySubjects().map((s, i) => {
      const lib = getSubjectLibrary(s.id);
      const ang = i * 2.39996;
      const rad = 7.5 + 4.3 * Math.sqrt(i);
      return {
        id: s.id, title: s.title, short: s.short, color: s.color,
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        z: ((i % 3) - 1) * 1.9,
        chapters: lib?.chapters.length ?? 0,
        dpps: lib?.chapters.reduce((a, c) => a + c.dpps.length, 0) ?? 0,
        books: booksForSubject(s.id).length,
        videos: vids.filter((v) => v.subjectId === s.id).length,
      };
    });
  }, []);

  const totals = useMemo(() => libraryTotals(), []);
  const videoTotal = useMemo(() => libraryVideos().length, []);
  const progress = levelProgress(state.xp);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((n) => n.title.toLowerCase().includes(q) || n.short.toLowerCase().includes(q) || n.id.includes(q));
  }, [query, nodes]);

  /* wheel zoom + drag glide — native listener so we can preventDefault */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      view.tdist = clamp(view.tdist * Math.exp(e.deltaY * 0.0011), 15, 95);
      setZoomPct(Math.round((58 / view.tdist) * 100));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [view]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0, lastY = 0;
    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const worldPerPx = (0.93 * view.tdist) / Math.max(400, el.clientHeight);
      view.tpx -= (e.clientX - lastX) * worldPerPx;
      view.tpy += (e.clientY - lastY) * worldPerPx;
      view.tpx = clamp(view.tpx, -55, 55);
      view.tpy = clamp(view.tpy, -55, 55);
      lastX = e.clientX; lastY = e.clientY;
    };
    const up = () => { dragging = false; };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [view]);

  /* fly to the top search match when the query changes */
  useEffect(() => {
    if (!query.trim() || matches.length === 0) return;
    const n = matches[0];
    view.tpx = n.x; view.tpy = n.y;
    view.tdist = clamp(view.tdist, 15, 95);
    if (view.tdist > 34) view.tdist = 30;
    setZoomPct(Math.round((58 / view.tdist) * 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTick, query]);

  const reset = () => { view.tpx = 0; view.tpy = 0; view.tdist = 58; setQuery(''); setZoomPct(100); };
  const enterNode = (id: string) => navigate(`/library/${id}`);

  return (
    <div className="relative">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-400/80">The study universe</div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            Knowledge <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Atlas</span>
          </h1>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-slate-400">
            Every subject is a world. Dive in — chapters, notes, DPPs, free books and lecture videos orbit each one.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
          {[
            { k: 'Worlds', v: totals.subjects, c: 'text-cyan-300' },
            { k: 'Chapters', v: totals.chapters, c: 'text-sky-300' },
            { k: 'Books', v: totals.books, c: 'text-violet-300' },
            { k: 'Lectures', v: videoTotal, c: 'text-amber-300' },
            { k: 'DPP', v: totals.dppProblems, c: 'text-emerald-300' },
          ].map((s) => (
            <span key={s.k} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <span className={cn('font-display font-bold', s.c)}>{s.v}</span>
              <span className="uppercase tracking-[0.12em] text-slate-500">{s.k}</span>
            </span>
          ))}
        </div>
      </div>

      {/* viewport */}
      <div
        ref={wrapRef}
        className="relative h-[calc(100vh-15rem)] min-h-[520px] w-full cursor-grab overflow-hidden rounded-3xl border border-white/10 bg-[#04060d] shadow-glow-soft active:cursor-grabbing"
        data-testid="atlas-viewport"
      >
        <div className="atlas-aurora" aria-hidden />
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 50, position: [0, 0, 150], near: 0.1, far: 400 }}
          onPointerMissed={() => setHovered(null)}
        >
          <SceneContents
            view={view}
            nodes={nodes}
            hovered={hovered}
            setHovered={(id) => { setHovered(id); document.body.style.cursor = id ? 'pointer' : 'auto'; }}
            query={query}
            onEnter={enterNode}
            onCore={() => navigate('/dashboard')}
          />
        </Canvas>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="atlas-search pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-2xl border border-white/15 bg-[#070b18]/85 px-3 py-2 backdrop-blur-xl shadow-glow-soft focus-within:border-cyan-400/50">
              <Search size={14} className="shrink-0 text-cyan-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setFlyTick((t) => t + 1); }}
                placeholder="Search a subject — physics, maths, aptitude…"
                className="w-full bg-transparent text-[12.5px] text-white outline-none placeholder:text-slate-500"
              />
              {query && (
                <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[9.5px] text-slate-400">
                  {matches.length}/{nodes.length}
                </span>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200 sm:flex">
                <Zap size={11} className="text-violet-300" />
                Lv {progress.level} · {levelTitle(progress.level)}
                <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" style={{ width: `${Math.max(4, progress.pct)}%` }} />
                </span>
              </span>
              <span className="rounded-full border border-white/10 bg-[#070b18]/85 px-2.5 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-xl">
                {zoomPct}%
              </span>
              <button
                onClick={reset}
                title="Reset view"
                className="rounded-full border border-white/15 bg-[#070b18]/85 p-2 text-slate-300 backdrop-blur-xl transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
              >
                <LocateFixed size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="hidden items-center gap-2 text-[10px] text-slate-500 md:flex">
              <MapPin size={11} className="text-cyan-400/70" />
              {query && matches.length === 0
                ? <span className="text-amber-300/90">No world matches “{query}”</span>
                : <span>Click a world to open its Library · click the core for command center</span>}
            </div>
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#070b18]/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur-xl">
              <Compass size={12} className="text-violet-300/80" />
              drag to glide · scroll to dive
            </div>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(`/library/${n.id}`)}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-all',
              hovered === n.id ? 'border-white/30 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: n.color, boxShadow: `0 0 6px ${n.color}` }} />
            {n.short}
          </button>
        ))}
      </div>
    </div>
  );
}
