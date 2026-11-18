"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

/** Procedural gold medal: coin body, raised rim, inner disc and a star emblem. */
function Coin({ spin }: { spin: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    if (spin) ref.current.rotation.y += dt * 0.7;
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.06;
  });
  const gold = { color: "#F5C451", metalness: 1, roughness: 0.22 } as const;
  const star = [0, 1, 2, 3, 4];
  return (
    <group ref={ref} rotation={[0.25, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.2, 96]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[0.11, -0.11].map((z) => (
        <group key={z} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
          <mesh>
            <torusGeometry args={[1.28, 0.06, 16, 96]} />
            <meshStandardMaterial color="#FFD978" metalness={1} roughness={0.15} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.92, 0.025, 12, 96]} />
            <meshStandardMaterial color="#C99A33" metalness={1} roughness={0.3} />
          </mesh>
          {star.map((i) => (
            <mesh key={i} rotation={[0, 0, (i * 2 * Math.PI) / 5]} position={[0, 0, 0.02]}>
              <coneGeometry args={[0.16, 0.7, 3]} />
              <meshStandardMaterial color="#FFE39A" metalness={1} roughness={0.18} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function CoinScene({ active, spin }: { active: boolean; spin: boolean }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 4.4], fov: 40 }} gl={{ alpha: true }} aria-hidden="true">
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <Environment resolution={128}>
        <Lightformer intensity={3} position={[0, 3, 3]} scale={[6, 1, 1]} color="#ffffff" />
        <Lightformer intensity={2} position={[-4, 0, 2]} scale={[1, 6, 1]} color="#29D4FF" />
        <Lightformer intensity={2} position={[4, -1, 2]} scale={[1, 6, 1]} color="#F5C451" />
        <Lightformer intensity={1} position={[0, -3, -3]} scale={[8, 1, 1]} color="#ffffff" />
      </Environment>
      <Coin spin={spin} />
    </Canvas>
  );
}
