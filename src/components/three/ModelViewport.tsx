import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import HandModel from "./HandModel";

/** The one 3D moment: the printable hand, slowly turning. Lazy-loaded. */
const ModelViewport = () => {
  const controls = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const { active } = useProgress();
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative w-full h-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [3.4, 1.9, 3.4], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: "pan-y" }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 3]} intensity={1.5} />
        <directionalLight position={[-5, 2, -4]} intensity={0.35} />

        <Suspense fallback={null}>
          <HandModel />
        </Suspense>

        <OrbitControls
          ref={controls}
          enableZoom={false}
          enablePan={false}
          autoRotate={autoRotate && !reducedMotion}
          autoRotateSpeed={0.9}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.7}
          onStart={() => {
            setAutoRotate(false);
            clearTimeout(idleTimer.current);
          }}
          onEnd={() => {
            clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => setAutoRotate(true), 2500);
          }}
        />
      </Canvas>

      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="fig-label">Loading model</p>
        </div>
      )}
    </div>
  );
};

export default ModelViewport;
