/**
 * One-shot converter: ASCII/binary STL → web-optimized GLB.
 * Usage: node scripts/convert-stl.mjs "<input.stl>" "<output.glb>" [targetTriangles]
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, simplify, prune } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";

const [, , input, output, targetArg] = process.argv;
if (!input || !output) {
  console.error('Usage: node scripts/convert-stl.mjs "<input.stl>" "<output.glb>" [targetTriangles]');
  process.exit(1);
}
const targetTriangles = Number(targetArg) || 80_000;

function parseSTL(buf) {
  const headText = buf.subarray(0, 512).toString("ascii");
  const isAscii = headText.trimStart().startsWith("solid") && headText.includes("facet");
  if (!isAscii) {
    // binary: 80-byte header, uint32 count, 50 bytes per facet
    const count = buf.readUInt32LE(80);
    const positions = new Float32Array(count * 9);
    for (let i = 0; i < count; i++) {
      const off = 84 + i * 50 + 12; // skip normal
      for (let v = 0; v < 9; v++) {
        positions[i * 9 + v] = buf.readFloatLE(off + v * 4);
      }
    }
    return positions;
  }
  const text = buf.toString("ascii");
  const out = [];
  const re = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  return Float32Array.from(out);
}

const buf = readFileSync(input);
const positions = parseSTL(buf);
const srcTris = positions.length / 9;
console.log(`Parsed ${srcTris.toLocaleString()} triangles from ${input}`);

const doc = new Document();
const buffer = doc.createBuffer();
const posAccessor = doc.createAccessor("POSITION").setType("VEC3").setArray(positions).setBuffer(buffer);
const prim = doc.createPrimitive().setAttribute("POSITION", posAccessor);
const mesh = doc.createMesh("phoenix-hand").addPrimitive(prim);
const node = doc.createNode("phoenix-hand").setMesh(mesh);
doc.createScene("scene").addChild(node);

const ratio = Math.min(1, targetTriangles / srcTris);
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001 }),
  prune()
);

const finalPrim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const finalTris = finalPrim.getIndices()
  ? finalPrim.getIndices().getCount() / 3
  : finalPrim.getAttribute("POSITION").getCount() / 3;
console.log(`Simplified to ${finalTris.toLocaleString()} triangles (ratio ${ratio.toFixed(2)})`);

mkdirSync(dirname(output), { recursive: true });
await new NodeIO().registerExtensions(ALL_EXTENSIONS).write(output, doc);
console.log(`Wrote ${output}`);
