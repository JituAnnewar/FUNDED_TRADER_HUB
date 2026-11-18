"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { decodeLandDots, GLOBE_CITIES, latLonToXYZ, type GlobeCity } from "@/lib/geo/globe";
import { LAND_DOTS_B64 } from "@/lib/geo/land-dots";

const R = 2;
const VIOLET = new THREE.Color("#7C5CFF");
const CYAN = new THREE.Color("#22D3EE");
const SOFT = new THREE.Color("#A594FF");
const HOME = GLOBE_CITIES.find((c) => c.id === "home") as GlobeCity;
/** Rotation that brings Mumbai to the front (lon 0 faces +z). */
const HOME_ROT = -(HOME.lon * Math.PI) / 180 + 0.1;

/* Intro timing, kept in step with the CSS poster (.intro-globe starts at 0.5 s, lasts 2.6 s). */
const INTRO_START = 0.5;
const INTRO_LEN = 2.6;
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);

export interface IntroClock {
  /** performance.now() in seconds at which the intro began. */
  t0: number;
  skip: boolean;
}

function introProgress(clock: IntroClock): number {
  if (clock.skip) return 1;
  return easeOut((performance.now() / 1000 - clock.t0 - INTRO_START) / INTRO_LEN);
}

/* ───────── Shaders ───────── */

const dotsVert = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vec3 n = normalize(normalMatrix * position);
    float facing = clamp(n.z, 0.0, 1.0);
    float twinkle = 0.7 + 0.3 * sin(uTime * 1.3 + aPhase);
    vAlpha = twinkle * smoothstep(0.0, 0.3, facing);
    vY = position.y;
    gl_PointSize = uSize * uPixelRatio * (8.0 / -mv.z);
  }
`;
const dotsFrag = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vY;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.2, d) * vAlpha * 0.95;
    vec3 col = mix(uColorA, uColorB, smoothstep(-1.4, 1.6, vY));
    gl_FragColor = vec4(col, a);
  }
`;

const fresnelVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const globeFrag = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
    float key = max(dot(vN, normalize(vec3(-0.6, 0.7, 0.5))), 0.0);
    vec3 base = vec3(0.03, 0.035, 0.09) + vec3(0.05, 0.05, 0.16) * key;
    vec3 rim = mix(uViolet, uCyan, clamp(vN.y * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(base + rim * f * 0.55, 1.0);
  }
`;
const atmoFrag = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float i = pow(clamp(0.66 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.2);
    vec3 col = mix(uViolet, uCyan, clamp(vN.y * 0.5 + 0.6, 0.0, 1.0));
    gl_FragColor = vec4(col * i * 1.1, i);
  }
`;

const arcVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const arcFrag = /* glsl */ `
  uniform float uDraw;
  uniform float uTime;
  uniform float uOffset;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    if (vUv.x > uDraw) discard;
    float p = fract(uTime * 0.32 + uOffset);
    float pulse = smoothstep(0.1, 0.0, abs(vUv.x - p));
    float head = smoothstep(0.06, 0.0, abs(vUv.x - uDraw)) * step(uDraw, 0.999);
    float a = 0.28 + pulse * 0.9 + head;
    gl_FragColor = vec4(uColor * (0.8 + pulse * 1.8 + head * 2.0), a);
  }
`;

/* ───────── Pieces ───────── */

function LandDots() {
  const { gl } = useThree();
  const { geometry, material } = useMemo(() => {
    const pos = decodeLandDots(LAND_DOTS_B64, R * 1.002);
    const phase = new Float32Array(pos.length / 3);
    for (let i = 0; i < phase.length; i++) phase[i] = ((i * 2654435761) % 1000) / 159.15;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: dotsVert,
      fragmentShader: dotsFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 3.6 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uColorA: { value: SOFT.clone().multiplyScalar(1.15) },
        uColorB: { value: CYAN.clone().multiplyScalar(1.15) },
      },
    });
    return { geometry: g, material: m };
  }, [gl]);

  useFrame(({ clock }) => {
    (material.uniforms.uTime as { value: number }).value = clock.elapsedTime;
  });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points geometry={geometry} material={material} />;
}

function GlobeBody() {
  const uniforms = useMemo(() => ({ uViolet: { value: VIOLET }, uCyan: { value: CYAN } }), []);
  return (
    <>
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial vertexShader={fresnelVert} fragmentShader={globeFrag} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.16}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          vertexShader={fresnelVert}
          fragmentShader={atmoFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function makeArc(from: GlobeCity, to: GlobeCity): THREE.TubeGeometry {
  const a = new THREE.Vector3(...latLonToXYZ(from.lat, from.lon, R));
  const b = new THREE.Vector3(...latLonToXYZ(to.lat, to.lon, R));
  const angle = a.angleTo(b);
  const lift = R * (1.08 + angle * 0.22);
  const c1 = a.clone().lerp(b, 0.28).normalize().multiplyScalar(lift);
  const c2 = a.clone().lerp(b, 0.72).normalize().multiplyScalar(lift);
  const curve = new THREE.CubicBezierCurve3(a, c1, c2, b);
  return new THREE.TubeGeometry(curve, 96, 0.009, 6, false);
}

function Arc({ to, open, index, intro }: { to: GlobeCity; open: boolean; index: number; intro: IntroClock }) {
  const geometry = useMemo(() => makeArc(HOME, to), [to]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: arcVert,
        fragmentShader: arcFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uDraw: { value: 0 },
          uTime: { value: 0 },
          uOffset: { value: index * 0.27 },
          uColor: { value: CYAN.clone() },
        },
      }),
    [index],
  );
  const target = open ? CYAN : SOFT;

  useFrame(({ clock }) => {
    const u = material.uniforms as Record<string, { value: number | THREE.Color }>;
    // Arcs draw in one after another once the globe has arrived.
    const since = intro.skip
      ? 99
      : performance.now() / 1000 - intro.t0 - (INTRO_START + INTRO_LEN * 0.55 + index * 0.18);
    u.uDraw!.value = easeOut(since / 1.2);
    u.uTime!.value = clock.elapsedTime;
    (u.uColor!.value as THREE.Color).lerp(open ? target : target.clone().multiplyScalar(0.55), 0.05);
  });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <mesh geometry={geometry} material={material} />;
}

const Z = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);

export type LabelMap = Record<string, HTMLElement | null>;

function CityMarker({ city, open, labels }: { city: GlobeCity; open: boolean; labels?: LabelMap }) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const tip = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const { normal, pos, qFace, qBeam } = useMemo(() => {
    const n = new THREE.Vector3(...latLonToXYZ(city.lat, city.lon, 1));
    return {
      normal: n,
      pos: n.clone().multiplyScalar(R * 1.004),
      qFace: new THREE.Quaternion().setFromUnitVectors(Z, n),
      qBeam: new THREE.Quaternion().setFromUnitVectors(Y, n),
    };
  }, [city]);
  const home = city.id === "home";
  const color = home ? "#FFFFFF" : open ? "#22D3EE" : "#A594FF";
  const beamLen = home ? 0.42 : open ? 0.55 : 0.18;

  useFrame(({ clock, camera, size }) => {
    const t = (clock.elapsedTime * 0.6 + (home ? 0.5 : 0)) % 1;
    if (ring.current) {
      ring.current.scale.setScalar(1 + t * 3.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (open || home ? 0.9 : 0.45);
    }
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + Math.sin(clock.elapsedTime * 2 + city.lat) * 0.15;
    }
    const label = labels?.[city.id];
    if (label && ring.current && beam.current) {
      ring.current.getWorldPosition(world);
      camDir.copy(camera.position).sub(world).normalize();
      const facing = world.clone().normalize().dot(camDir);
      // Label sits just above the beam tip, projected to screen pixels.
      beam.current.localToWorld(tip.set(0, beamLen / 2 + 0.1, 0));
      tip.project(camera);
      const x = (tip.x * 0.5 + 0.5) * size.width;
      const y = (-tip.y * 0.5 + 0.5) * size.height;
      label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      label.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.2) * 3)));
    }
  });

  return (
    <group>
      <mesh position={pos} quaternion={qFace}>
        <circleGeometry args={[0.032, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={pos} quaternion={qFace}>
        <ringGeometry args={[0.034, 0.046, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={normal.clone().multiplyScalar(R + beamLen / 2)} quaternion={qBeam}>
        <cylinderGeometry args={[0.004, 0.012, beamLen, 8, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function OrbitRing() {
  const sat = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * 0.35;
    sat.current?.position.set(Math.cos(a) * R * 1.55, 0, Math.sin(a) * R * 1.55);
  });
  return (
    <group rotation={[1.25, 0.2, -0.35]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 1.55, 0.0035, 8, 200]} />
        <meshBasicMaterial color="#7C5CFF" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh ref={sat}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#22D3EE" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Stars({ count }: { count: number }) {
  const geometry = useMemo(() => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 18 + rand() * 50;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      p[i * 3 + 2] = r * Math.cos(ph) - 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#C7CEFF" size={0.11} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

/** Camera fly-in, pointer parallax and scroll response. */
function Rig({ globe, intro }: { globe: React.RefObject<THREE.Group | null>; intro: IntroClock }) {
  const pointer = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0, s: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera, clock }, delta) => {
    const p = introProgress(intro);
    const scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    const k = 1 - Math.pow(0.001, delta);
    smooth.current.x += (pointer.current.x - smooth.current.x) * k * 0.6;
    smooth.current.y += (pointer.current.y - smooth.current.y) * k * 0.6;
    smooth.current.s += (scroll - smooth.current.s) * k;

    const s = smooth.current;
    camera.position.set(s.x * 0.5, -s.y * 0.35 + s.s * 0.6, 42 + (9.6 - 42) * p - s.s * 1.6);
    camera.lookAt(0, s.s * 0.6, 0);

    const g = globe.current;
    if (g) {
      g.rotation.y = HOME_ROT - (1 - p) * 2.6 + clock.elapsedTime * 0.035 + s.s * 1.4;
      g.rotation.x = 0.32 + s.y * 0.08;
      g.rotation.z = -0.12;
    }
  });
  return null;
}

function Ready({ onReady }: { onReady?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady?.());
  });
  return null;
}

export default function GlobeScene({
  active,
  lowPower,
  openIds,
  intro,
  labels,
  onReady,
}: {
  active: boolean;
  lowPower: boolean;
  openIds: string[];
  /** Shared, mutable intro clock owned by the hero (so CSS and WebGL stay in step). */
  intro: IntroClock;
  /** DOM label elements by city id (rendered by the hero, outside the canvas). */
  labels?: LabelMap;
  onReady?: () => void;
}) {
  const [quality, setQuality] = useState<"high" | "low">(lowPower ? "low" : "high");
  const low = quality === "low";
  const globe = useRef<THREE.Group>(null);
  const targets = GLOBE_CITIES.filter((c) => c.id !== "home");

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, low ? 1.25 : 1.75]}
      camera={{ position: [0, 0, 42], fov: 35, near: 0.1, far: 140 }}
      gl={{ antialias: !low, powerPreference: "high-performance", alpha: true }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <AdaptiveDpr pixelated={false} />
      <Ready onReady={onReady} />
      <Stars count={low ? 700 : 1800} />
      <Rig globe={globe} intro={intro} />
      <group ref={globe}>
        <GlobeBody />
        <LandDots />
        {targets.map((c, i) => (
          <Arc key={c.id} to={c} open={openIds.includes(c.id)} index={i} intro={intro} />
        ))}
        {GLOBE_CITIES.map((c) => (
          <CityMarker key={c.id} city={c} open={c.id === "home" || openIds.includes(c.id)} labels={labels} />
        ))}
      </group>
      <OrbitRing />
    </Canvas>
  );
}
