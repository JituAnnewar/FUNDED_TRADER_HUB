"use client";

import { AdaptiveDpr, Grid, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface CandleData {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  delay: number;
}

function buildCandles(n: number): CandleData[] {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const out: CandleData[] = [];
  let price = 0.4;
  for (let i = 0; i < n; i++) {
    const move = 0.14 + (rand() - 0.42) * 0.9;
    const open = price;
    const close = Math.max(0.25, price + move * 1.6);
    const high = Math.max(open, close) + rand() * 0.5 + 0.08;
    const low = Math.max(0.02, Math.min(open, close) - rand() * 0.35 - 0.05);
    out.push({ x: (i - n / 2) * 0.42, open, close, high, low, delay: 0.25 + i * 0.045 });
    price = close;
  }
  return out;
}

const UP = new THREE.Color("#16F2A0");
const DOWN = new THREE.Color("#FF3D6E");

/** Critically-damped spring progress 0→1 with a slight overshoot. */
function springAt(t: number): number {
  if (t <= 0) return 0;
  const k = 7;
  return 1 - Math.exp(-k * t) * Math.cos(k * 0.9 * t);
}

function Candles({ count }: { count: number }) {
  const data = useMemo(() => buildCandles(count), [count]);
  const bodies = useRef<(THREE.Mesh | null)[]>([]);
  const wicks = useRef<(THREE.Mesh | null)[]>([]);
  const start = useRef<number | null>(null);

  useFrame(({ clock }) => {
    start.current ??= clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    data.forEach((c, i) => {
      const p = springAt(t - c.delay);
      const body = bodies.current[i];
      const wick = wicks.current[i];
      const bodyH = Math.max(0.03, Math.abs(c.close - c.open));
      const wickH = c.high - c.low;
      if (body) {
        body.scale.set(1, Math.max(0.0001, p), 1);
        body.position.y = Math.min(c.open, c.close) * p + (bodyH * p) / 2 + (1 - Math.min(1, p)) * -0.5;
        body.visible = p > 0.001;
      }
      if (wick) {
        wick.scale.set(1, Math.max(0.0001, p), 1);
        wick.position.y = c.low * p + (wickH * p) / 2;
        wick.visible = p > 0.001;
      }
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {data.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? UP : DOWN;
        const bodyH = Math.max(0.03, Math.abs(c.close - c.open));
        return (
          <group key={i} position={[c.x, 0, 0]}>
            <mesh ref={(m) => void (wicks.current[i] = m)}>
              <boxGeometry args={[0.025, c.high - c.low, 0.025]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            <mesh ref={(m) => void (bodies.current[i] = m)}>
              <boxGeometry args={[0.24, bodyH, 0.24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={up ? 1.1 : 0.9}
                metalness={0.2}
                roughness={0.35}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CameraRig({ autoRotate }: { autoRotate: boolean }) {
  const gyro = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      gyro.current = { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 30)) };
    };
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  useFrame(({ clock, camera, pointer }) => {
    const t = clock.elapsedTime;
    const orbit = autoRotate ? Math.sin(t * 0.08) * 0.35 : 0;
    const px = pointer.x || gyro.current.x;
    const py = pointer.y || -gyro.current.y;
    const radius = 11;
    const angle = orbit + px * 0.18;
    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const targetY = 3.2 + py * 0.6;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    camera.lookAt(0, 2.2, 0);
  });
  return null;
}

export default function HeroScene({ active, lowPower }: { active: boolean; lowPower: boolean }) {
  const [quality, setQuality] = useState<"high" | "low">(lowPower ? "low" : "high");
  const low = quality === "low";

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, low ? 1.25 : 1.5]}
      camera={{ position: [0, 3.2, 11], fov: 42, near: 0.1, far: 80 }}
      gl={{ antialias: !low, powerPreference: "high-performance", alpha: true }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <AdaptiveDpr pixelated={false} />
      <fog attach="fog" args={["#05070A", 9, 30]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 6, 4]} intensity={30} color="#29D4FF" />
      <group position={[0, -0.6, 0]}>
        <Candles count={low ? 26 : 40} />
        <Grid
          position={[0, -0.01, 0]}
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#0f3a4a"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#29D4FF"
          fadeDistance={28}
          fadeStrength={1.6}
        />
      </group>
      <Sparkles count={low ? 40 : 140} scale={[18, 7, 10]} position={[0, 2.5, -1]} size={low ? 2 : 2.6} speed={0.25} opacity={0.6} color="#29D4FF" />
      <CameraRig autoRotate />
      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}
