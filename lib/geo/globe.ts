/**
 * Geometry shared by the WebGL globe and its static SVG poster.
 * Kept free of three.js so the poster (server-rendered) does not pull it in.
 */
import type { MarketId } from "@/lib/sessions";

export interface GlobeCity {
  id: MarketId | "home";
  label: string;
  lat: number;
  lon: number;
}

/** The four FX session centres, plus home (Mumbai, IST). */
export const GLOBE_CITIES: readonly GlobeCity[] = [
  { id: "sydney", label: "Sydney", lat: -33.87, lon: 151.21 },
  { id: "tokyo", label: "Tokyo", lat: 35.68, lon: 139.69 },
  { id: "london", label: "London", lat: 51.51, lon: -0.13 },
  { id: "new_york", label: "New York", lat: 40.71, lon: -74.01 },
  { id: "home", label: "Mumbai", lat: 19.08, lon: 72.88 },
];

/** Unit-sphere position (y up, lon 0 facing +z). Returns [x, y, z]. */
export function latLonToXYZ(lat: number, lon: number, r = 1): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return [r * Math.cos(phi) * Math.sin(lambda), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lambda)];
}

/** Decode the generated Int16 [lat*100, lon*100] pairs into a flat Float32 xyz array on the unit sphere. */
export function decodeLandDots(b64: string, r = 1): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pairs = new Int16Array(bytes.buffer);
  const out = new Float32Array((pairs.length / 2) * 3);
  for (let i = 0, j = 0; i < pairs.length; i += 2, j += 3) {
    const [x, y, z] = latLonToXYZ((pairs[i] ?? 0) / 100, (pairs[i + 1] ?? 0) / 100, r);
    out[j] = x;
    out[j + 1] = y;
    out[j + 2] = z;
  }
  return out;
}

/**
 * Orthographic projection matching public/globe-poster.svg (centre 55°E 18°N, radius 480 in a 1000 box).
 * Returns null for points on the far side.
 */
export function posterXY(lat: number, lon: number): { x: number; y: number } | null {
  const LON0 = (55 * Math.PI) / 180;
  const LAT0 = (18 * Math.PI) / 180;
  const R = 480;
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  const cosc = Math.sin(LAT0) * Math.sin(p) + Math.cos(LAT0) * Math.cos(p) * Math.cos(l - LON0);
  if (cosc < 0) return null;
  return {
    x: 500 + R * Math.cos(p) * Math.sin(l - LON0),
    y: 500 - R * (Math.cos(LAT0) * Math.sin(p) - Math.sin(LAT0) * Math.cos(p) * Math.cos(l - LON0)),
  };
}
