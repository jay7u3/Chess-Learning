import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

function PawnModel() {
  const pawnRef = useRef();
  const { scene } = useGLTF("/pawn.glb");

  useFrame(() => {
    if (pawnRef.current) {
      pawnRef.current.rotation.y += 0.005;
    }
  });

  return <primitive ref={pawnRef} object={scene} scale={0.2} position={[0, -1, 0]} />;
}
