/**
 * Branded loader. A candlestick wick draws, the body grows, then it shrinks
 * into the wordmark. Total ≈ 1.2 s. Pure CSS (see `.loader` in globals.css):
 * no JS is needed to run or dismiss it, so it can never block the page.
 * `LoaderScript` marks repeat visits so the loader is skipped.
 */
export function Loader({ brand }: { brand: string }) {
  return (
    <div className="loader" aria-hidden="true">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 40 64" className="loader__candle h-16 w-10">
          <defs>
            <linearGradient id="ld-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#29D4FF" />
              <stop offset="1" stopColor="#16F2A0" />
            </linearGradient>
          </defs>
          <path className="loader__wick" d="M20 2v60" stroke="url(#ld-g)" strokeWidth="2" strokeLinecap="round" />
          <rect className="loader__body" x="11" y="14" width="18" height="34" rx="3" fill="url(#ld-g)" />
        </svg>
        <span className="loader__mark font-display -mt-4 text-lg font-semibold tracking-[0.3em] text-fg">
          {brand}
        </span>
      </div>
    </div>
  );
}

/** Runs before first paint. Skips the loader for anyone who has seen it before. */
export const LOADER_SCRIPT = `try{if(localStorage.getItem('seen-loader')){document.documentElement.dataset.seen='1'}else{localStorage.setItem('seen-loader','1')}}catch(e){}`;
