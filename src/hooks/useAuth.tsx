import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContext = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Ошибка соединения с Supabase (например, проект недоступен) */
  connectionError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, userName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Текущая сессия + подписка на её изменения
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setConnectionError(null);
      setLoading(false);
    }).catch((err) => {
      console.error("Auth getSession error:", err);
      setConnectionError("Не удалось подключиться к серверу авторизации. Проверьте интернет-соединение и настройки проекта.");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? translateAuthError(error.message) : null;
    } catch (e) {
      console.error("signIn error:", e);
      return "Не удалось связаться с сервером. Проверьте интернет и настройки Supabase (.env).";
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { user_name: userName } },
      });
      return error ? translateAuthError(error.message) : null;
    } catch (e) {
      console.error("signUp error:", e);
      return "Не удалось связаться с сервером. Проверьте интернет и настройки Supabase (.env).";
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, connectionError, signIn, signUp, signOut }),
    [session, loading, connectionError, signIn, signUp, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Понятные сообщения об ошибках Supabase Auth на русском. */
function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (message.includes("User already registered")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }
  if (message.includes("Password should be at least")) {
    return "Пароль должен содержать минимум 6 символов.";
  }
  if (message.includes("Email not confirmed")) {
    return "Подтвердите email по ссылке из письма и войдите снова.";
  }
  if (message.includes("rate limit")) {
    return "Слишком много попыток. Подождите минуту и попробуйте снова.";
  }
  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "Введите корректный email.";
  }
  return message;
}
