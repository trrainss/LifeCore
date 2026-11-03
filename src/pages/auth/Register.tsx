import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import {
  AuthShell,
  AuthField,
  AuthError,
  ConfigWarning,
  SubmitButton,
  useAuthForm,
} from "./AuthParts";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { email, setEmail, password, setPassword, error, busy, guard } = useAuthForm();
  const [userName, setUserName] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    guard(async () => {
      const err = await signUp(email.trim(), password, userName.trim() || "Друг");
      if (err) return err;
      // Если включено подтверждение email — сессии нет, показываем подсказку
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate("/");
      else setDone(true);
      return null;
    });
  };

  return (
    <AuthShell
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-medium text-core-accent hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <h2 className="text-lg font-bold tracking-tight">Регистрация</h2>
      <p className="mt-1 text-sm text-core-muted">Создайте аккаунт — данные будут только вашими</p>
      <div className="mt-4">
        <ConfigWarning />
      </div>

      {done ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-lg bg-core-good/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-core-good">
            Аккаунт создан! Проверьте почту <b>{email}</b> и перейдите по ссылке из письма,
            затем войдите.
          </p>
          <Link
            to="/login"
            className="block w-full rounded-lg bg-core-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-all duration-200 hover:bg-[#3b93f5]"
          >
            Перейти ко входу
          </Link>
        </div>
      ) : (
      <form onSubmit={submit} className="mt-5 space-y-4">
        <AuthField
          label="Как вас называть"
          type="text"
          value={userName}
          onChange={setUserName}
          placeholder="Имя"
          autoComplete="given-name"
        />
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
          placeholder="Минимум 6 символов"
          autoComplete="new-password"
        />
        {error && <AuthError message={error} />}
        <SubmitButton busy={busy}>Создать аккаунт</SubmitButton>
      </form>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-core-muted">
        Если в проекте Supabase включено подтверждение email, после регистрации
        потребуется перейти по ссылке из письма.
      </p>
    </AuthShell>
  );
}
