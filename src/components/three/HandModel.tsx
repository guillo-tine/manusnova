import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

const MODEL_URL = "/models/phoenix-hand.glb";
useGLTF.preload(MODEL_URL);

/* Clay accent duplicated from src/index.css — WebGL can't read CSS
   custom properties. Same tone as the red PLA the hands print in. */
const CLAY_PLA = "#A85C3F";

function useHandGeometry() {
  const gltf = useGLTF(MODEL_URL);
  return useMemo(() => {
    let found: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!found && mesh.isMesh) found = mesh.geometry;
    });
    const geo = (found as unknown as THREE.BufferGeometry).clone();
    geo.computeVertexNormals();
    geo.center();
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox!.getSize(size);
    const scale = 3.4 / Math.max(size.x, size.y, size.z);
    return { geo, scale };
  }, [gltf]);
}

const HandModel = () => {
  const { geo, scale } = useHandGeometry();

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CLAY_PLA, roughness: 0.55, metalness: 0.05 }),
    []
  );

  // STL is Z-up; rotate the group so the hand stands up in Y-up world
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <mesh geometry={geo} material={material} />
    </group>
  );
};

export default HandModel;
