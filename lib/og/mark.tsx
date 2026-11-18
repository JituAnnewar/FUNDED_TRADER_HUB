/** Candlestick brand mark for generated images (ImageResponse supports a subset of CSS: flexbox only). */
export function MarkImage({ size }: { size: number }) {
  const u = size / 32;
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#05070A", borderRadius: size * 0.22 }}>
      <div style={{ position: "relative", width: 24 * u, height: 24 * u, display: "flex" }}>
        <div style={{ position: "absolute", left: 5.25 * u, top: 3 * u, width: 1.5 * u, height: 18 * u, background: "#FF3D6E", borderRadius: u }} />
        <div style={{ position: "absolute", left: 3.5 * u, top: 8 * u, width: 5 * u, height: 8 * u, background: "#FF3D6E", borderRadius: u }} />
        <div style={{ position: "absolute", left: 17.25 * u, top: 1 * u, width: 1.5 * u, height: 20 * u, background: "#16F2A0", borderRadius: u }} />
        <div style={{ position: "absolute", left: 15.5 * u, top: 4 * u, width: 5 * u, height: 13 * u, background: "linear-gradient(180deg, #29D4FF, #16F2A0)", borderRadius: u }} />
      </div>
    </div>
  );
}
