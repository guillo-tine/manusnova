import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/**
 * Pre-split, pre-shaded parts, made by scripts/bake-hand.mjs from assets-src/hand.glb.
 * Splitting the print plate and computing creased normals used to happen here, in the
 * browser, and froze the page for up to several seconds on slow machines.
 */
const MODEL_URL = "/models/hand-parts.glb";
useGLTF.preload(MODEL_URL);

/* The PLA the hands print in. WebGL can't read CSS vars. */
const CLAY_PLA = "#D2704A";

export const partMaterial = new THREE.MeshPhysicalMaterial({
  color: CLAY_PLA,
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.35,
  clearcoatRoughness: 0.35,
  sheen: 0.4,
  sheenColor: new THREE.Color("#ffb392"),
  transparent: true,
  opacity: 0,
});

export type Part = {
  geometry: THREE.BufferGeometry;
  /** undoes the file's compression: positions are stored as small integers plus this scale/offset */
  unpack: { position: THREE.Vector3; scale: THREE.Vector3 };
  /** where the part sits on the print plate (plate lies flat, Y is up) */
  home: THREE.Vector3;
  /** how far the part rises (+) or sinks (-) along Y when the plate separates */
  lift: number;
  radius: number;
};

type Extras = { home: [number, number, number]; lift: number; radius: number };

export function useParts(): Part[] {
  const gltf = useGLTF(MODEL_URL);
  return useMemo(() => {
    const parts: Part[] = [];
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // the file can nest the mesh one level under the node that carries the extras
      const x = (m.userData.home ? m.userData : m.parent?.userData) as Extras;
      parts.push({
        geometry: m.geometry,
        unpack: { position: m.position.clone(), scale: m.scale.clone() },
        home: new THREE.Vector3(...x.home),
        lift: x.lift,
        radius: x.radius,
      });
    });
    return parts;
  }, [gltf]);
}
