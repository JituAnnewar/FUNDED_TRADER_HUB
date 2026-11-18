"use client";

import { Loader2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatMoney } from "@/lib/format";
import { breakevenWinRate, challengePlan, expectancyR, positionSize, recoveryPct } from "@/lib/tools/calc";
import type { McInput, McResult } from "@/lib/tools/monte-carlo";
import type { DrawdownType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "size", label: "Position size" },
  { id: "rr", label: "Risk-reward" },
  { id: "recovery", label: "Drawdown recovery" },
  { id: "planner", label: "Challenge planner" },
  { id: "mc", label: "Monte Carlo simulator" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const inputCls = "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm num outline-none focus-visible:border-accent";

function Num({ label, value, onChange, step = "any", suffix, min = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: string; suffix?: string; min?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <span className="relative block">
        <input type="number" inputMode="decimal" min={min} step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} className={cn(inputCls, suffix && "pr-12")} />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

function Result({ label, children, tone }: { label: string; children: React.ReactNode; tone?: "profit" | "loss" | "gold" | "accent" }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("num mt-1 text-2xl font-semibold", tone === "profit" && "text-profit", tone === "loss" && "text-loss", tone === "gold" && "text-gold", tone === "accent" && "text-accent")}>{children}</p>
    </div>
  );
}

const ok = (n: number) => Number.isFinite(n) && n >= 0;

function PositionSize() {
  const [mode, setMode] = useState<"forex" | "futures">("forex");
  const [balance, setBalance] = useState(100_000);
  const [risk, setRisk] = useState(0.5);
  const [stop, setStop] = useState(20);
  const [value, setValue] = useState(10);
  const r = ok(balance) && ok(risk) && ok(stop) && ok(value) ? positionSize({ balance, riskPct: risk, stop, valuePerUnit: value }) : null;
  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 rounded-xl border border-line p-1" role="group" aria-label="Instrument type">
        {(["forex", "futures"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setValue(m === "forex" ? 10 : 5); }} className={cn("rounded-lg px-3 py-1.5 text-xs", mode === m ? "bg-accent text-bg" : "text-muted")}>
            {m === "forex" ? "Forex / gold (lots)" : "Futures (contracts)"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Num label="Account balance" value={balance} onChange={setBalance} suffix="$" />
        <Num label="Risk per trade" value={risk} onChange={setRisk} suffix="%" step="0.05" />
        <Num label={mode === "forex" ? "Stop distance" : "Stop distance"} value={stop} onChange={setStop} suffix={mode === "forex" ? "pips" : "ticks"} />
        <Num label={mode === "forex" ? "Pip value per lot" : "Tick value per contract"} value={value} onChange={setValue} suffix="$" />
      </div>
      {r && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Result label="Money at risk" tone="loss">
            {formatMoney(r.risk)}
          </Result>
          <Result label={mode === "forex" ? "Position size" : "Contracts"} tone="accent">
            {mode === "forex" ? `${r.units.toFixed(2)} lots` : `${Math.floor(r.units)} contracts`}
          </Result>
        </div>
      )}
      <p className="text-xs text-muted">Standard lot pip value is about $10 on USD-quoted pairs. On XAUUSD, 1 lot = 100 oz, so a $0.10 move ≈ $10 per lot.</p>
    </div>
  );
}

function RiskReward() {
  const [rr, setRr] = useState(2);
  const [wr, setWr] = useState(45);
  const be = ok(rr) ? breakevenWinRate(rr) : NaN;
  const ex = ok(rr) && ok(wr) ? expectancyR(wr, rr) : NaN;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Num label="Reward-to-risk (R)" value={rr} onChange={setRr} step="0.1" suffix=": 1" />
        <Num label="Your win rate" value={wr} onChange={setWr} suffix="%" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Result label="Break-even win rate">{Number.isFinite(be) ? `${be.toFixed(1)}%` : "—"}</Result>
        <Result label="Expectancy per trade" tone={ex > 0 ? "profit" : ex < 0 ? "loss" : undefined}>
          {Number.isFinite(ex) ? `${ex > 0 ? "+" : ex < 0 ? "−" : ""}${Math.abs(ex).toFixed(2)}R` : "—"}
        </Result>
      </div>
    </div>
  );
}

function Recovery() {
  const [loss, setLoss] = useState(10);
  const need = ok(loss) && loss < 100 ? recoveryPct(loss) : Infinity;
  const rows = [5, 10, 20, 30, 50];
  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <Num label="Drawdown" value={loss} onChange={setLoss} suffix="%" />
      </div>
      <Result label="Gain needed to get back to break-even" tone="gold">
        {Number.isFinite(need) ? `${need.toFixed(2)}%` : "Not recoverable"}
      </Result>
      <table className="w-full max-w-sm text-sm">
        <caption className="mb-2 text-left text-xs text-muted">Reference</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r} className="border-t border-line">
              <td className="num py-1.5 text-loss">−{r}%</td>
              <td className="num py-1.5 text-right text-profit">+{recoveryPct(r).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Planner() {
  const [target, setTarget] = useState(8);
  const [daily, setDaily] = useState(0.75);
  const [dailyLoss, setDailyLoss] = useState(5);
  const [minDays, setMinDays] = useState(4);
  const plan = ok(target) && ok(daily) ? challengePlan({ targetPct: target, dailyReturnPct: daily, dailyLossPct: dailyLoss, minDays }) : null;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Num label="Profit target" value={target} onChange={setTarget} suffix="%" />
        <Num label="Average daily return" value={daily} onChange={setDaily} suffix="%" step="0.05" />
        <Num label="Daily loss limit" value={dailyLoss} onChange={setDailyLoss} suffix="%" />
        <Num label="Minimum trading days" value={minDays} onChange={setMinDays} step="1" />
      </div>
      {plan ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="Trading days to target" tone="accent">
              {plan.daysToTarget}
            </Result>
            <Result label="With compounding">{plan.daysCompounded}</Result>
          </div>
          <ul className="space-y-1 text-sm">
            <li className={plan.meetsMinDays ? "text-profit" : "text-amber"}>{plan.meetsMinDays ? "Meets the minimum trading days." : `You would hit the target before the ${minDays}-day minimum. Keep trading small until then.`}</li>
            <li className={plan.aggressive ? "text-amber" : "text-muted"}>
              {plan.aggressive ? "This daily return is more than half the daily loss limit. One bad day could end the challenge." : "Daily return is well inside the daily loss limit."}
            </li>
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">Enter a daily return above 0%.</p>
      )}
    </div>
  );
}

function MonteCarlo() {
  const [inp, setInp] = useState<McInput>({ winRatePct: 45, avgR: 2, riskPct: 0.75, targetPct: 8, dailyLossPct: 5, maxLossPct: 10, drawdownType: "static", tradesPerDay: 2, maxDays: 30, sims: 5000 });
  const [res, setRes] = useState<McResult | null>(null);
  const [running, setRunning] = useState(false);
  const worker = useRef<Worker | null>(null);
  const set = <K extends keyof McInput>(k: K) => (v: McInput[K]) => setInp((x) => ({ ...x, [k]: v }));

  useEffect(() => () => worker.current?.terminate(), []);

  function run() {
    worker.current?.terminate();
    const w = new Worker(new URL("../../lib/tools/mc.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    setRunning(true);
    w.onmessage = (e: MessageEvent<McResult>) => {
      setRes(e.data);
      setRunning(false);
      w.terminate();
    };
    w.onerror = () => setRunning(false);
    w.postMessage({ ...inp, seed: Math.floor(Math.random() * 1e9) });
  }

  const maxCount = res ? Math.max(1, ...res.distribution.map((d) => d.count)) : 1;
  const allVals = res ? res.samples.flatMap((s) => s.path) : [];
  const yMin = Math.min(100 - inp.maxLossPct - 1, ...allVals);
  const yMax = Math.max(100 + inp.targetPct + 1, ...allVals);
  const maxLen = res ? Math.max(2, ...res.samples.map((s) => s.path.length)) : 2;
  const y = (v: number) => 150 - ((v - yMin) / (yMax - yMin)) * 140 - 5;
  const COLORS: Record<string, string> = { pass: "#16F2A0", breach_daily: "#FF3D6E", breach_max: "#FF3D6E", timeout: "#8A96A8" };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Num label="Win rate" value={inp.winRatePct} onChange={set("winRatePct")} suffix="%" />
        <Num label="Average win (R)" value={inp.avgR} onChange={set("avgR")} step="0.1" suffix="R" />
        <Num label="Risk per trade" value={inp.riskPct} onChange={set("riskPct")} step="0.05" suffix="%" />
        <Num label="Profit target" value={inp.targetPct} onChange={set("targetPct")} suffix="%" />
        <Num label="Trades per day" value={inp.tradesPerDay} onChange={set("tradesPerDay")} step="1" min={1} />
        <Num label="Daily loss limit" value={inp.dailyLossPct} onChange={set("dailyLossPct")} suffix="%" />
        <Num label="Max loss limit" value={inp.maxLossPct} onChange={set("maxLossPct")} suffix="%" />
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Drawdown type</span>
          <select value={inp.drawdownType} onChange={(e) => set("drawdownType")(e.target.value as DrawdownType)} className={inputCls}>
            <option value="static">Static</option>
            <option value="trailing_eod">Trailing (end of day)</option>
            <option value="trailing_intraday">Trailing (intraday)</option>
          </select>
        </label>
        <Num label="Days allowed" value={inp.maxDays} onChange={set("maxDays")} step="1" min={1} />
        <Num label="Simulations" value={inp.sims} onChange={set("sims")} step="1000" min={100} />
      </div>
      <Button type="button" onClick={run} disabled={running}>
        {running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
        {running ? "Running…" : "Run simulation"}
      </Button>

      {res && (
        <div className="space-y-5" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Result label="Pass" tone="profit">{res.passPct.toFixed(1)}%</Result>
            <Result label="Breach: daily loss" tone="loss">{res.breachDailyPct.toFixed(1)}%</Result>
            <Result label="Breach: max loss" tone="loss">{res.breachMaxPct.toFixed(1)}%</Result>
            <Result label="Out of time">{res.timeoutPct.toFixed(1)}%</Result>
          </div>
          {res.medianDaysToPass !== null && <p className="text-sm text-muted">Median time to pass: <span className="num text-fg">{res.medianDaysToPass}</span> trading days.</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Final result distribution</h3>
              <svg viewBox="0 0 400 160" className="h-44 w-full" role="img" aria-label="Histogram of final account change across simulations">
                {res.distribution.map((d, i) => {
                  const h = (d.count / maxCount) * 140;
                  return (
                    <rect key={i} x={i * 20 + 1} y={150 - h} width={18} height={h} rx={2} fill={d.to <= 0 ? "var(--c-loss)" : "var(--c-profit)"} opacity={0.85}>
                      <title>{`${d.from.toFixed(1)}% to ${d.to.toFixed(1)}%: ${d.count}`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Sample equity paths</h3>
              <svg viewBox="0 0 400 160" className="h-44 w-full" role="img" aria-label="Sample simulated equity paths">
                <line x1="0" x2="400" y1={y(100 + inp.targetPct)} y2={y(100 + inp.targetPct)} stroke="var(--c-profit)" strokeDasharray="4 4" opacity={0.5} />
                <line x1="0" x2="400" y1={y(100 - inp.maxLossPct)} y2={y(100 - inp.maxLossPct)} stroke="var(--c-loss)" strokeDasharray="4 4" opacity={0.5} />
                <line x1="0" x2="400" y1={y(100)} y2={y(100)} stroke="rgba(255,255,255,0.15)" />
                {res.samples.map((s, i) => (
                  <polyline key={i} fill="none" stroke={COLORS[s.outcome]} strokeWidth="1.4" opacity={0.85} points={s.path.map((v, j) => `${(j / (maxLen - 1)) * 400},${y(v)}`).join(" ")} />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-muted">A simplified model: fixed risk per trade, independent outcomes, no slippage or news. Use it to compare settings, not to predict results.</p>
    </div>
  );
}

export function ToolsPanel() {
  const [tab, setTab] = useState<TabId>("size");
  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Calculators" className="inline-flex gap-1 rounded-xl border border-line bg-white/[0.02] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn("rounded-lg px-3.5 py-2 text-sm whitespace-nowrap", tab === t.id ? "bg-accent text-bg" : "text-muted hover:text-fg")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <GlassPanel className="p-5 sm:p-8" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "size" && <PositionSize />}
        {tab === "rr" && <RiskReward />}
        {tab === "recovery" && <Recovery />}
        {tab === "planner" && <Planner />}
        {tab === "mc" && <MonteCarlo />}
      </GlassPanel>
    </div>
  );
}
