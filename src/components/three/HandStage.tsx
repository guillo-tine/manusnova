import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { partMaterial, useParts, type Part } from "./HandModel";
import { onRead, onRemeasure, reducedMotion, stage, startingDpr, view, weakDevice } from "@/lib/stage";

/**
 * Per-section look. Placement is not set here: every [data-pose] section holds a
 * [data-slot] element reserved in its own layout, and the model is fitted inside
 * that box each frame, so it can never overlap the section's text.
 * e: how far the parts separate; rx: tilt toward the camera; o / mo: opacity (desktop / phone).
 */
type Look = { e: number; rx: number; o: number; mo: number };

const LOOKS: Record<string, Look> = {
  hero:    { e: 0.28, rx: 0.5,  o: 1, mo: 1 },
  design:  { e: 0.08, rx: 0.7,  o: 1, mo: 1 },
  // reading sections: the model steps back so the text has the stage
  quiet:   { e: 0.3,  rx: 0.6,  o: 0, mo: 0 },
  count:   { e: 0.55, rx: 0.45, o: 1, mo: 1 },
  free:    { e: 0.8,  rx: 0.4,  o: 1, mo: 1 },
  // on phones the names fill the screen; the model steps out rather than sit behind them
  team:    { e: 0.3,  rx: 0.6,  o: 1, mo: 0 },
  request: { e: 0.5,  rx: 0.5,  o: 1, mo: 1 },
};

type Box = { l: number; r: number; t: number; b: number };
type Anchor = {
  start: number;
  end: number;
  look: Look;
  /** every reserved box in the section; only one is visible at a given breakpoint */
  slots: HTMLElement[];
  /** the visible one, picked when the layout changes so the frame reads just one rect */
  slot: HTMLElement | null;
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

/**
 * Measures the page during the frame's read phase only, and hands the render loop
 * plain numbers. The render loop never touches the DOM, so scrolling and drawing
 * can't force the browser into repeated layout passes.
 */
function useStageTargets() {
  const anchors = useRef<Anchor[]>([]);
  const target = useRef({ box: { l: 0, r: 0, t: 0, b: 0 } as Box, e: 0, rx: 0.5, o: 0, ready: false });

  useEffect(() => {
    const stopMeasure = onRemeasure(() => {
      anchors.current = Array.from(document.querySelectorAll<HTMLElement>("[data-pose]"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          const top = r.top + window.scrollY;
          const inset = Math.min(window.innerHeight, r.height) / 2;
          const slots = Array.from(el.querySelectorAll<HTMLElement>("[data-slot]"));
          return {
            start: top + inset,
            end: top + r.height - inset,
            look: LOOKS[el.dataset.pose!],
            slots,
            // slots hidden at this breakpoint measure 0; offsetWidth is the cheap check
            slot: slots.find((s) => s.offsetWidth > 1 && s.offsetHeight > 1) ?? null,
          };
        })
        .filter((a) => a.look && a.slot)
        .sort((a, b) => a.start - b.start);
    });

    const stopRead = onRead(() => {
      const where = locate(anchors.current, view.y + view.h / 2);
      if (!where) return;
      const [A, B, t] = where;
      // at most two rects per frame, and nothing has written to the DOM yet
      const ra = A.slot!.getBoundingClientRect();
      const rb = A === B ? ra : B.slot!.getBoundingClientRect();
      const narrow = view.w < 768;
      const tg = target.current;
      tg.box.l = lerp(ra.left, rb.left, t);
      tg.box.r = lerp(ra.right, rb.right, t);
      tg.box.t = lerp(ra.top, rb.top, t);
      tg.box.b = lerp(ra.bottom, rb.bottom, t);
      tg.e = lerp(A.look.e, B.look.e, t);
      tg.rx = lerp(A.look.rx, B.look.rx, t);
      // Leaving for a reading section, the model clears out in the first stretch of the
      // transition; arriving at a showpiece, it waits until the last stretch. It is never
      // half-visible over text that is already on screen.
      const oa = narrow ? A.look.mo : A.look.o;
      const ob = narrow ? B.look.mo : B.look.o;
      const ft = ob < oa ? Math.min(1, t * 2.5) : ob > oa ? Math.max(0, (t - 0.6) / 0.4) : t;
      tg.o = lerp(oa, ob, ft);
      tg.ready = true;
    });

    return () => {
      stopMeasure();
      stopRead();
    };
  }, []);

  return target;
}

const Cluster = () => {
  const parts = useParts();
  const root = useRef<THREE.Group>(null);
  const holders = useRef<THREE.Group[]>([]);
  const target = useStageTargets();
  const still = useMemo(reducedMotion, []);
  const cur = useRef({ x: 0, y: 0, s: 0, e: 3, rx: 0.5, turn: 0, o: 0 });
  const started = useRef(false);
  const { gl, scene, camera } = useThree();
  const [compiled, setCompiled] = useState(false);

  // Compile every shader before the first draw. compileAsync uses the browser's parallel
  // compile where it exists, so this happens off the critical path instead of freezing the
  // first visible frame.
  useEffect(() => {
    let live = true;
    const done = () => {
      if (!live) return;
      setCompiled(true);
      stage.sceneReady = true;
    };
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      live = false;
    };
  }, [gl, scene, camera]);

  useFrame((state, delta) => {
    const g = root.current;
    const tg = target.current;
    if (!g || !tg.ready) return;

    const dt = Math.min(delta, 1 / 20);
    const worldPerPx = state.viewport.height / view.h;
    const revealed = stage.revealedAt > 0;
    const e = revealed ? tg.e : 3;

    // Target box: the slot, inset so parts never touch its edges
    const pad = 0.06;
    const bw = (tg.box.r - tg.box.l) * (1 - pad * 2) * worldPerPx;
    const bh = (tg.box.b - tg.box.t) * (1 - pad * 2) * worldPerPx;

    // Fit the footprint (at the separation we're heading to) inside the box
    const f = footprint(parts, e);
    const projW = 2 * f.disc;
    const projH = 2 * f.disc * Math.sin(tg.rx) + (f.yMax - f.yMin) * Math.cos(tg.rx);
    const s = Math.max(0.01, Math.min(bw / projW, bh / projH));
    const cx = ((tg.box.l + tg.box.r) / 2 - view.w / 2) * worldPerPx;
    const cy = -((tg.box.t + tg.box.b) / 2 - view.h / 2) * worldPerPx;
    const yMid = ((f.yMax + f.yMin) / 2) * Math.cos(tg.rx) * s;

    const target_ = {
      x: cx,
      y: cy - yMid,
      s,
      e,
      rx: tg.rx,
      // scrubbed straight from scroll: about 55 degrees of turn per screen
      turn: (view.y / view.h) * 0.95,
      o: revealed ? tg.o : 0,
    };

    const c = cur.current;
    if (!started.current) {
      Object.assign(c, target_, { o: 0, turn: -0.9 });
      started.current = true;
    }
    // the opening converges slowly; after that the model tracks its slot tightly
    const sinceReveal = revealed ? (performance.now() - stage.revealedAt) / 1000 : 0;
    const intro = sinceReveal < 2.2;
    const settle = 1 - Math.exp(-dt * (intro ? 1.9 : 9));
    c.x = lerp(c.x, target_.x, settle);
    c.y = lerp(c.y, target_.y, settle);
    c.s = lerp(c.s, target_.s, settle);
    c.e = lerp(c.e, target_.e, 1 - Math.exp(-dt * (intro ? 1.9 : 6)));
    c.rx = lerp(c.rx, target_.rx, settle);
    c.o = lerp(c.o, target_.o, 1 - Math.exp(-dt * (intro ? 2.4 : 7)));
    c.turn = lerp(c.turn, target_.turn, settle);

    const time = state.clock.elapsedTime;
    g.position.set(c.x, c.y, 0);
    g.scale.setScalar(c.s);
    g.rotation.set(c.rx, c.turn + (still ? 0 : time * 0.03), 0);

    for (let i = 0; i < parts.length; i++) {
      const h = holders.current[i];
      if (h) {
        const part = parts[i];
        h.position.set(part.home.x, part.home.y + part.lift * c.e, part.home.z);
      }
    }
    partMaterial.opacity = c.o;
    partMaterial.depthWrite = c.o > 0.97;
  });

  return (
    <group ref={root} visible={compiled}>
      {parts.map((part, i) => (
        <group
          key={i}
          ref={(g) => {
            if (g) holders.current[i] = g;
          }}
        >
          <mesh
            geometry={part.geometry}
            material={partMaterial}
            position={part.unpack.position}
            scale={part.unpack.scale}
          />
        </group>
      ))}
    </group>
  );
};

/**
 * Watches real frame rate and gives back resolution when the machine can't keep up,
 * so a slow laptop or phone drops pixels rather than frames.
 */
const Adaptive = ({ max, onStruggle }: { max: number; onStruggle: () => void }) => {
  const setDpr = useThree((s) => s.setDpr);
  return (
    <PerformanceMonitor
      flipflops={3}
      onChange={({ factor }) => setDpr(Math.min(max, 1 + factor * (max - 1)))}
      onFallback={() => {
        setDpr(1);
        onStruggle();
      }}
    />
  );
};

/** Fixed full-screen WebGL layer behind the page. */
const HandStage = () => {
  const max = useMemo(startingDpr, []);
  const [lite, setLite] = useState(weakDevice);

  useEffect(() => {
    if (!lite) return;
    // clearcoat and sheen are the two costly terms in this shader; the parts still read as PLA
    partMaterial.clearcoat = 0;
    partMaterial.sheen = 0;
    partMaterial.needsUpdate = true;
    document.documentElement.classList.add("is-lite");
  }, [lite]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, max]}
        camera={{ position: [0, 0, 7], fov: 30 }}
        gl={{
          antialias: !weakDevice(),
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
      >
        <Adaptive max={max} onStruggle={() => setLite(true)} />
        <ambientLight intensity={lite ? 0.85 : 0.6} />
        <directionalLight position={[4, 5, 5]} intensity={4.5} color="#fff4ec" />
        <directionalLight position={[-6, 3, -4]} intensity={5} color="#e6edff" />
        <directionalLight position={[0, -5, 3]} intensity={1.2} />
        <directionalLight position={[0, 1, 8]} intensity={0.9} />
        <Suspense fallback={null}>
          {!lite && (
            <Environment resolution={256} frames={1} environmentIntensity={1.4}>
              <Lightformer form="rect" intensity={3} position={[0, 5, 3]} scale={[10, 2, 1]} />
              <Lightformer form="rect" intensity={2} position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
              <Lightformer form="ring" intensity={1.5} position={[5, 0, 3]} rotation-y={-Math.PI / 3} scale={3} />
            </Environment>
          )}
          <Cluster />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HandStage;
