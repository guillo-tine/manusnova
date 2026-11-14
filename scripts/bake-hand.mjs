// Bakes the print-plate model into ready-to-draw parts, once, at build time.
//
// The source file is one mesh: every part of the hand laid flat on a print plate. The site
// needs those parts separately, with smooth-but-creased normals. Doing that in the browser
// (welding ~39k vertices, union-finding ~80k triangles, recomputing normals for 30 parts)
// froze the main thread for 0.5s on a fast machine and 3.6s on a slow one, right as the
// page revealed itself. This script does the identical work here instead, then compresses
// the result, so the browser only has to decode it.
//
//   node scripts/bake-hand.mjs            reads  assets-src/hand.glb (source only, never deployed)
//                                         writes public/models/hand-parts.glb
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import * as THREE from "three";
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Document } from "@gltf-transform/core";

const SRC = "assets-src/hand.glb";
// /models/* is served as immutable for a year (vercel.json): a re-bake must use a new filename
// and update MODEL_URL in HandModel.tsx, or returning visitors keep the old model.
const OUT = "public/models/hand-parts.glb";

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

const src = await io.read(SRC);
const prim = src.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute("POSITION").getArray();
const I = prim.getIndices().getArray();
const count = P.length / 3;

// Weld coincident vertices, then union-find triangles into parts
const weld = new Int32Array(count);
const seen = new Map();
for (let i = 0; i < count; i++) {
  const k = `${Math.round(P[i * 3] * 1e4)},${Math.round(P[i * 3 + 1] * 1e4)},${Math.round(P[i * 3 + 2] * 1e4)}`;
  let id = seen.get(k);
  if (id === undefined) seen.set(k, (id = seen.size));
  weld[i] = id;
}
const parent = Int32Array.from({ length: seen.size }, (_, i) => i);
const find = (x) => {
  while (parent[x] !== x) x = parent[x] = parent[parent[x]];
  return x;
};
for (let t = 0; t < I.length; t += 3) {
  const a = find(weld[I[t]]);
  parent[find(weld[I[t + 1]])] = a;
  parent[find(weld[I[t + 2]])] = a;
}
const groups = new Map();
for (let t = 0; t < I.length; t += 3) {
  const r = find(weld[I[t]]);
  let g = groups.get(r);
  if (!g) groups.set(r, (g = []));
  g.push(I[t], I[t + 1], I[t + 2]);
}

// Whole-plate bounds: centre it and scale its longest side to 1
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < count; i++) for (let a = 0; a < 3; a++) {
  min[a] = Math.min(min[a], P[i * 3 + a]);
  max[a] = Math.max(max[a], P[i * 3 + a]);
}
const center = min.map((m, a) => (m + max[a]) / 2);
const unit = 1 / Math.max(...max.map((m, a) => m - min[a]));

/** Deterministic pseudo-random, so the layout is identical on every build. */
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const rand = rng(11);

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene("hand");
const sorted = [...groups.values()].sort((a, b) => b.length - a.length);
let triangles = 0;

sorted.forEach((tris, i) => {
  // STL is Z-up; lay the plate flat: (x, y, z) -> (x, z, -y)
  const verts = new Float32Array(tris.length * 3);
  tris.forEach((vi, j) => {
    verts[j * 3] = (P[vi * 3] - center[0]) * unit;
    verts[j * 3 + 1] = (P[vi * 3 + 2] - center[2]) * unit;
    verts[j * 3 + 2] = -(P[vi * 3 + 1] - center[1]) * unit;
  });
  const raw = new THREE.BufferGeometry();
  raw.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  raw.computeBoundingBox();
  const home = new THREE.Vector3();
  raw.boundingBox.getCenter(home);
  raw.translate(-home.x, -home.y, -home.z);
  // smooth across gentle curves, keep the printed edges crisp; then share vertices again
  const g = mergeVertices(toCreasedNormals(raw, Math.PI / 5));
  g.computeBoundingSphere();

  // Big parts stay near the plate; small ones fan out above and below in even layers
  const layer = i === 0 ? 0 : ((i % 6) - 2.5) / 2.5;
  const lift = layer * (i < 3 ? 0.12 : 0.34) + (rand() - 0.5) * 0.06;

  const idx = g.getIndex().array;
  triangles += idx.length / 3;
  const p = doc.createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.getAttribute("position").array)).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.getAttribute("normal").array)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(idx.length > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)).setBuffer(buffer));
  const node = doc.createNode(`part-${i}`)
    .setMesh(doc.createMesh(`part-${i}`).addPrimitive(p))
    // where it sits on the plate, how far it separates, and its size, read back by the site
    .setExtras({ home: [home.x, home.y, home.z], lift, radius: g.boundingSphere.radius });
  scene.addChild(node);
});
doc.getRoot().setDefaultScene(scene);

// Reorder for the vertex cache, quantize, and compress
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(OUT, doc);

const { statSync } = await import("node:fs");
console.log(`${sorted.length} parts, ${triangles} triangles -> ${OUT} (${Math.round(statSync(OUT).size / 1024)} KB, was ${Math.round(statSync(SRC).size / 1024)} KB)`);
