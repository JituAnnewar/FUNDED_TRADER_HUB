import { GlassPanel } from "@/components/ui/glass-panel";
import type { GoalProgress } from "@/lib/analytics/goals";
import { formatMoney } from "@/lib/format";
import { formatDateIST } from "@/lib/time";

export function GoalList({ goals }: { goals: GoalProgress[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {goals.map(({ goal, current, pct }) => (
        <li key={goal.id}>
          <GlassPanel className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="font-medium">{goal.title}</h3>
              <span className="num text-sm text-accent">{pct.toFixed(0)}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-label={goal.title}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-profit shadow-[0_0_12px_var(--c-accent)]" style={{ width: `${pct}%` }} />
            </div>
            <p className="num mt-2 flex justify-between text-xs text-muted">
              <span>
                {formatMoney(current)} of {formatMoney(goal.target_amount)}
              </span>
              {goal.deadline && <span>by {formatDateIST(new Date(goal.deadline))}</span>}
            </p>
          </GlassPanel>
        </li>
      ))}
    </ul>
  );
}
