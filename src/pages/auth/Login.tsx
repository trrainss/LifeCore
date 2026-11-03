import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  AuthShell,
  AuthField,
  AuthError,
  ConfigWarning,
  SubmitButton,
  useAuthForm,
} from "./AuthParts";

export default function Login() {
  const { signIn } = useAuth();
  const { email, setEmail, password, setPassword, error, busy, guard } = useAuthForm();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    guard(() => signIn(email.trim(), password));
  };

  return (
    <AuthShell
      footer={
        <>
          Нет аккаунта?{" "}
          <Link to="/register" className="font-medium text-core-accent hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <h2 className="text-lg font-bold tracking-tight">Вход</h2>
      <p className="mt-1 text-sm text-core-muted">Войдите, чтобы открыть свои данные</p>
      <div className="mt-4">
        <ConfigWarning />
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {error && <AuthError message={error} />}
        <SubmitButton busy={busy}>Войти</SubmitButton>
      </form>
    </AuthShell>
  );
}
