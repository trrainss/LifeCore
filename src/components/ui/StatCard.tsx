import type { ReactNode } from "react";
import Icon from "../Icon";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  color?: string;
  delta?: number; // процент изменения, +/-
};

/** Компактная карточка-показатель */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  color = "#4DA3FF",
  delta,
}: Props) {
  return (
    <div className="rise-in min-w-0 rounded-xl bg-white p-5 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-core-muted">{label}</div>
          <div className="mt-1.5 truncate text-2xl font-bold tabular-nums tracking-tight">{value}</div>
          {hint && <div className="mt-1 truncate text-xs text-core-muted">{hint}</div>}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}14`, color }}
        >
          <Icon name={icon} size={20} />
        </div>
      </div>
      {delta !== undefined && (
        <div
          className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
            delta >= 0 ? "text-core-good" : "text-core-bad"
          }`}
        >
          <Icon name={delta >= 0 ? "arrowUp" : "arrowDown"} size={13} />
          {Math.abs(delta)}% за неделю
        </div>
      )}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
