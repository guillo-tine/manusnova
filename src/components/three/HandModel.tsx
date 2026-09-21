import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const MODEL_URL = "/models/phoenix-hand.glb";
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
  /** where the part sits on the print plate (plate lies flat, Y is up) */
  home: THREE.Vector3;
  /** how far the part rises (+) or sinks (-) along Y when the plate separates */
  lift: number;
  radius: number;
};

/** Deterministic pseudo-random, so the layout is identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * The model file is a print plate: all 30 Phoenix Hand parts laid flat.
 * Split it into its separate parts (connected pieces of mesh) and give each
 * a place in a floating exploded view.
 */
export function useParts(): Part[] {
  const gltf = useGLTF(MODEL_URL);
  return useMemo(() => {
    let src: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!src && m.isMesh) src = m.geometry;
    });
    const geo = src as unknown as THREE.BufferGeometry;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const idx = geo.getIndex()!;

    // Weld coincident vertices, then union-find triangles into parts
    const weld = new Int32Array(pos.count);
    const seen = new Map<string, number>();
    for (let i = 0; i < pos.count; i++) {
      const k = `${pos.getX(i).toFixed(6)},${pos.getY(i).toFixed(6)},${pos.getZ(i).toFixed(6)}`;
      let id = seen.get(k);
      if (id === undefined) seen.set(k, (id = seen.size));
      weld[i] = id;
    }
    const parent = Int32Array.from({ length: seen.size }, (_, i) => i);
    const find = (x: number) => {
      while (parent[x] !== x) x = parent[x] = parent[parent[x]];
      return x;
    };
    for (let t = 0; t < idx.count; t += 3) {
      const a = find(weld[idx.getX(t)]);
      parent[find(weld[idx.getX(t + 1)])] = a;
      parent[find(weld[idx.getX(t + 2)])] = a;
    }
    const groups = new Map<number, number[]>();
    for (let t = 0; t < idx.count; t += 3) {
      const r = find(weld[idx.getX(t)]);
      let g = groups.get(r);
      if (!g) groups.set(r, (g = []));
      g.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2));
    }

    geo.computeBoundingBox();
    const plate = new THREE.Vector3();
    geo.boundingBox!.getSize(plate);
    const unit = 1 / Math.max(plate.x, plate.y, plate.z);

    const sorted = [...groups.values()].sort((a, b) => b.length - a.length);
    const center = new THREE.Vector3();
    geo.boundingBox!.getCenter(center);
    const rand = rng(11);

    return sorted.map((tris, i) => {
      // STL is Z-up; lay the plate flat: (x, y, z) -> (x, z, -y)
      const verts = new Float32Array(tris.length * 3);
      tris.forEach((vi, j) => {
        verts[j * 3] = (pos.getX(vi) - center.x) * unit;
        verts[j * 3 + 1] = (pos.getZ(vi) - center.z) * unit;
        verts[j * 3 + 2] = -(pos.getY(vi) - center.y) * unit;
      });
      const raw = new THREE.BufferGeometry();
      raw.setAttribute("position", new THREE.BufferAttribute(verts, 3));
      raw.computeBoundingBox();
      const home = new THREE.Vector3();
      raw.boundingBox!.getCenter(home);
      raw.translate(-home.x, -home.y, -home.z);
      // smooth across gentle curves, keep the printed edges crisp
      const g = toCreasedNormals(raw, Math.PI / 5);
      g.computeBoundingSphere();

      // Big parts stay near the plate; small ones fan out above and below in even layers
      const layer = i === 0 ? 0 : ((i % 6) - 2.5) / 2.5;
      const lift = layer * (i < 3 ? 0.12 : 0.34) + (rand() - 0.5) * 0.06;
      return { geometry: g, home, lift, radius: g.boundingSphere!.radius };
    });
  }, [gltf]);
}
