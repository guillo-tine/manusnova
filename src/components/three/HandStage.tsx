import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { partMaterial, useParts, type Part } from "./HandModel";
import { reducedMotion, stage } from "@/lib/stage";

/**
 * Per-section look. Placement is not set here: every [data-pose] section holds a
 * [data-slot] element reserved in its own layout, and the model is fitted inside
 * that box each frame, so it can never overlap the section's text.
 * e: how far the parts separate; rx: tilt toward the camera; o / mo: opacity (desktop / phone).
 */
type Look = { e: number; rx: number; o: number; mo: number };

const LOOKS: Record<string, Look> = {
  hero:    { e: 0.45, rx: 0.6,  o: 1, mo: 1 },
  design:  { e: 0.08, rx: 0.7,  o: 1, mo: 1 },
  free:    { e: 0.8,  rx: 0.4,  o: 1, mo: 1 },
  team:    { e: 0.3,  rx: 0.6,  o: 1, mo: 0.14 },
  request: { e: 0.5,  rx: 0.5,  o: 1, mo: 1 },
};

type Anchor = { start: number; end: number; look: Look; slots: HTMLElement[] };

/** Scroll ranges (in viewport-center document coordinates) during which each section's look holds. */
function useAnchors() {
  const anchors = useRef<Anchor[]>([]);
  useEffect(() => {
    const measure = () => {
      anchors.current = Array.from(document.querySelectorAll<HTMLElement>("[data-pose]"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          const top = r.top + window.scrollY;
          const inset = Math.min(window.innerHeight, r.height) / 2;
          return {
            start: top + inset,
            end: top + r.height - inset,
            look: LOOKS[el.dataset.pose!],
            slots: Array.from(el.querySelectorAll<HTMLElement>("[data-slot]")),
          };
        })
        .filter((a) => a.look && a.slots.length)
        .sort((a, b) => a.start - b.start);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);
  return anchors;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The visible slot's box in viewport pixels (slots hidden at this breakpoint measure 0). */
function slotRect(a: Anchor) {
  for (const el of a.slots) {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) return r;
  }
  return null;
}

/** Which two sections we're between, and how far. */
function locate(anchors: Anchor[], y: number): [Anchor, Anchor, number] | null {
  if (!anchors.length) return null;
  const first = anchors[0];
  if (y <= first.end) return [first, first, 0];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    if (y < b.start) return [a, b, smooth((y - a.end) / (b.start - a.end))];
    if (y <= b.end) return [b, b, 0];
  }
  const last = anchors[anchors.length - 1];
  return [last, last, 0];
}

/**
 * Rotation-invariant footprint of the parts: they spin about Y, so horizontally they
 * sweep a disc of radius `disc`; vertically they span [yMin, yMax] at a given separation.
 */
function footprint(parts: Part[], e: number) {
  let disc = 0, yMin = Infinity, yMax = -Infinity;
  for (const p of parts) {
    disc = Math.max(disc, Math.hypot(p.home.x, p.home.z) + p.radius);
    const y = p.home.y + p.lift * e;
    yMin = Math.min(yMin, y - p.radius);
    yMax = Math.max(yMax, y + p.radius);
  }
  return { disc, yMin, yMax };
}

const Cluster = () => {
  const parts = useParts();
  const root = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);
  const anchors = useAnchors();
  const still = useMemo(reducedMotion, []);
  const cur = useRef({ x: 0, y: 0, s: 0, e: 3, rx: 0.5, turn: 0, o: 0 });
  const started = useRef(false);

  useFrame((state, delta) => {
    const g = root.current;
    const where = locate(anchors.current, window.scrollY + window.innerHeight / 2);
    if (!g || !where) return;
    const [A, B, t] = where;
    const ra = slotRect(A);
    const rb = slotRect(B) ?? ra;
    if (!ra || !rb) return;

    const dt = Math.min(delta, 1 / 20);
    const vw = window.innerWidth, vh = window.innerHeight;
    const narrow = vw < 768;
    const worldPerPx = state.viewport.height / vh;
    const revealed = stage.revealedAt > 0;

    const e = lerp(A.look.e, B.look.e, t);
    const rx = lerp(A.look.rx, B.look.rx, t);
    const o = narrow ? lerp(A.look.mo, B.look.mo, t) : lerp(A.look.o, B.look.o, t);

    // Target box: the slot, inset so parts never touch its edges
    const box = {
      l: lerp(ra.left, rb.left, t), r: lerp(ra.right, rb.right, t),
      t: lerp(ra.top, rb.top, t), b: lerp(ra.bottom, rb.bottom, t),
    };
    const pad = 0.06;
    const bw = (box.r - box.l) * (1 - pad * 2) * worldPerPx;
    const bh = (box.b - box.t) * (1 - pad * 2) * worldPerPx;

    // Fit the footprint (at the separation we're heading to) inside the box
    const f = footprint(parts, revealed ? e : 3);
    const projW = 2 * f.disc;
    const projH = 2 * f.disc * Math.sin(rx) + (f.yMax - f.yMin) * Math.cos(rx);
    const s = Math.max(0.01, Math.min(bw / projW, bh / projH));
    const cx = ((box.l + box.r) / 2 - vw / 2) * worldPerPx;
    const cy = -((box.t + box.b) / 2 - vh / 2) * worldPerPx;
    const yMid = ((f.yMax + f.yMin) / 2) * Math.cos(rx) * s;

    const target = {
      x: cx,
      y: cy - yMid,
      s,
      e: revealed ? e : 3,
      rx,
      // scrubbed straight from scroll: about 55 degrees of turn per screen
      turn: (window.scrollY / vh) * 0.95,
      o: revealed ? o : 0,
    };

    const c = cur.current;
    if (!started.current) {
      Object.assign(c, target, { o: 0, turn: -0.9 });
      started.current = true;
    }
    // the opening converges slowly; after that the model tracks its slot tightly
    const sinceReveal = revealed ? (performance.now() - stage.revealedAt) / 1000 : 0;
    const intro = sinceReveal < 2.2;
    const settle = 1 - Math.exp(-dt * (intro ? 1.9 : 9));
    c.x = lerp(c.x, target.x, settle);
    c.y = lerp(c.y, target.y, settle);
    c.s = lerp(c.s, target.s, settle);
    c.e = lerp(c.e, target.e, 1 - Math.exp(-dt * (intro ? 1.9 : 6)));
    c.rx = lerp(c.rx, target.rx, settle);
    c.o = lerp(c.o, target.o, 1 - Math.exp(-dt * 2.4));
    c.turn = lerp(c.turn, target.turn, settle);

    const time = state.clock.elapsedTime;
    g.position.set(c.x, c.y, 0);
    g.scale.setScalar(c.s);
    g.rotation.set(c.rx, c.turn + (still ? 0 : time * 0.03), 0);

    parts.forEach((part, i) => {
      const m = meshes.current[i];
      if (m) m.position.set(part.home.x, part.home.y + part.lift * c.e, part.home.z);
    });
    partMaterial.opacity = c.o;
    partMaterial.depthWrite = c.o > 0.97;
  });

  return (
    <group ref={root}>
      {parts.map((part, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) meshes.current[i] = m;
          }}
          geometry={part.geometry}
          material={partMaterial}
        />
      ))}
    </group>
  );
};

/** Fixed full-screen WebGL layer behind the page. */
const HandStage = () => (
  <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 5]} intensity={4.5} color="#fff4ec" />
      <directionalLight position={[-6, 3, -4]} intensity={5} color="#e6edff" />
      <directionalLight position={[0, -5, 3]} intensity={1.2} />
      <directionalLight position={[0, 1, 8]} intensity={0.9} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1} environmentIntensity={1.4}>
          <Lightformer form="rect" intensity={3} position={[0, 5, 3]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={2} position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
          <Lightformer form="ring" intensity={1.5} position={[5, 0, 3]} rotation-y={-Math.PI / 3} scale={3} />
        </Environment>
        <Cluster />
      </Suspense>
    </Canvas>
  </div>
);

export default HandStage;
