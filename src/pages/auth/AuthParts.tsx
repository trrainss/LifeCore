import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

/** Общая оболочка для страниц входа/регистрации */
export function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <span className="text-core-ink">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="8.25" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">LifeCore</h1>
          <p className="mt-1 text-sm text-core-muted">система управления жизнью</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)]">
          {children}
        </div>

        <div className="mt-4 text-center text-sm text-core-muted">{footer}</div>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-core-muted transition-colors hover:text-core-ink"
        >
          Вернуться к приложению
        </Link>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-core-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
      />
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-core-bad/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-core-bad">
      {message}
    </p>
  );
}

export function SubmitButton({ children, busy }: { children: ReactNode; busy: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-core-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_20px_-6px_rgba(77,163,255,0.5)] transition-all duration-200 hover:bg-[#3b93f5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? "Подождите…" : children}
    </button>
  );
}

/** Хук-помощник для состояния формы */
export function useAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const guard = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const err = await action();
    setBusy(false);
    if (err) setError(err);
    return !err;
  };

  return { email, setEmail, password, setPassword, error, busy, guard };
}

export type { FormEvent };
