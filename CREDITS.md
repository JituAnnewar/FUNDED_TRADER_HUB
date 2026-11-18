# CREDITS

- **3D models:** none imported. The candlestick hero, neon grid, particles and gold medal are built procedurally from three.js primitives in `components/three/`.
- **Images:** the demo payout certificate (`public/demo/certificate.svg`) is original SVG made for this project.
- **Fonts:** Sora, Inter and JetBrains Mono via Google Fonts (SIL Open Font License 1.1), self-hosted by `next/font`.
- **Icons:** lucide-react (ISC). X, Discord, Instagram and YouTube marks are simplified inline SVGs.
- **Charts:** TradingView Lightweight Charts™ (Apache 2.0). Attribution logo is disabled in config; the TradingView name is credited here as the licence requests.
- **Environment lighting:** drei `<Lightformer>` (procedural), no HDR files downloaded.
- Globe land outline: [Natural Earth](https://www.naturalearthdata.com/) (public domain) via the `world-atlas` package; converted to dot positions at build time by `scripts/gen-land-dots.mjs` (`lib/geo/land-dots.ts`, `public/globe-poster.svg`).
