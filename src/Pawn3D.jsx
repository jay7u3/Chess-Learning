import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";

function PawnModel({ isDarkMode }) {
  const pawnRef = useRef();
  const { scene } = useGLTF("/pawn.glb");

  useFrame(() => {
    if (pawnRef.current) {
      pawnRef.current.rotation.y += 0.02;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <primitive
        ref={pawnRef}
        object={scene}
        scale={1}
        position={[0, -2, 0]}
      />
    </>
  );
}

export default function Pawn3D() {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkMode(theme === "dark");
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-32 h-32 mb-4 relative overflow-hidden">
      <Canvas style={{ width: '100%', height: '100%' }}>
        <PawnModel isDarkMode={isDarkMode} />
        <OrbitControls enableZoom={false}/>
      </Canvas>
    </div>
  );
}


