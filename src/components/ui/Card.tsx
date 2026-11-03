import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: React.CSSProperties;
};

/** Белая карточка с мягкой тенью и скруглением 12px — базовый элемент системы */
export function Card({ children, className = "", padded = true, style }: CardProps) {
  return (
    <div
      style={style}
      className={`overflow-hidden rounded-xl bg-white shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex min-w-0 items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight text-core-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-core-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  color = "#4DA3FF",
  soft = true,
}: {
  children: ReactNode;
  color?: string;
  soft?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={
        soft
          ? { background: `${color}1A`, color }
          : { background: color, color: "#fff" }
      }
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "soft";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary:
      "bg-core-accent text-white hover:bg-[#3b93f5] shadow-[0_10px_20px_-6px_rgba(77,163,255,0.5)]",
    ghost:
      "bg-white/60 text-core-ink hover:bg-white border border-black/5",
    soft: "bg-core-accent/10 text-core-accent hover:bg-core-accent/20",
    danger: "bg-core-bad/10 text-core-bad hover:bg-core-bad/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
