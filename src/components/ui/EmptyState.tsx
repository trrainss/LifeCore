import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
};

/**
 * Заглушка для пустых разделов: новый аккаунт стартует с чистыми таблицами,
 * поэтому почти любой список может быть пустым.
 */
export default function EmptyState({ title, hint, action, compact }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/[0.015] text-center ${
        compact ? "px-4 py-6" : "px-6 py-10"
      }`}
    >
      <svg
        width={compact ? 22 : 28}
        height={compact ? 22 : 28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="mb-2 text-black/25"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" />
      </svg>
      <p className={`font-semibold ${compact ? "text-[13px]" : "text-sm"} text-core-ink`}>{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-core-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
