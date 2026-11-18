"use client";

import { useEffect, useRef, useState } from "react";

/** TradingView free ticker-tape embed, loaded only when scrolled near. Toggled in admin settings. */
export function TradingViewWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setLoad(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!load || !el) return;
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbols: [
        { proName: "OANDA:XAUUSD", title: "Gold" },
        { proName: "FX:EURUSD", title: "EUR/USD" },
        { proName: "FX:GBPUSD", title: "GBP/USD" },
        { proName: "FX:USDJPY", title: "USD/JPY" },
        { proName: "TVC:DXY", title: "DXY" },
      ],
      showSymbolLogo: false,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "compact",
      locale: "en",
    });
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [load]);

  return <div ref={ref} className="tradingview-widget-container min-h-12 overflow-hidden rounded-xl border border-line" aria-label="Live market prices from TradingView" />;
}
