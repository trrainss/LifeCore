import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState, Settings } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { today } from "../utils/dates";
import { useAuth } from "./useAuth";

// Состояние приложения живёт в Supabase (Postgres) и изолировано по пользователю:
// RLS-политики фильтруют строки по auth.uid(). Новый аккаунт стартует пустым.

const Ctx = createContext<AppStateContext | null>(null);

type AppStateContext = {
  state: AppState;
  reload: () => Promise<void>;
  toggleHabit: (habitId: string, date?: string) => Promise<void>;
  addHabit: (habit: { name: string; icon: string; color: string; targetPerWeek: number }) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  checkAntiHabit: (id: string) => Promise<void>;
  relapseAntiHabit: (id: string) => Promise<void>;
  addAntiHabit: (habit: { name: string; icon: string; color: string }) => Promise<void>;
  removeAntiHabit: (id: string) => Promise<void>;
  addTask: (task: { title: string; priority: string; due: string; estimateMin?: number }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addFocusTime: (id: string, minutes: number) => Promise<void>;
  addTransaction: (tx: { type: string; amount: number; category: string; date: string; note: string }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  logHealth: (log: { sleepHours: number; waterGlasses: number; steps: number; mood: number }) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  resetData: () => Promise<void>;
};

// ---------- Чтение состояния текущего пользователя ----------

async function fetchAll(): Promise<AppState> {
  const [h, hc, a, acd, ar, t, tx, hl, p] = await Promise.all([
    supabase.from("habits").select("*").order("created_at"),
    supabase.from("habit_completions").select("habit_id, date"),
    supabase.from("anti_habits").select("*").order("created_at"),
    supabase.from("anti_clean_days").select("anti_id, date"),
    supabase.from("anti_relapses").select("anti_id, date"),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("health").select("*").order("date"),
    supabase.from("profiles").select("*").maybeSingle(),
  ]);

  for (const res of [h, hc, a, acd, ar, t, tx, hl, p]) {
    if (res.error) throw res.error;
  }

  const completionsByHabit = new Map<string, string[]>();
  for (const row of hc.data ?? []) {
    const list = completionsByHabit.get(row.habit_id) ?? [];
    list.push(row.date);
    completionsByHabit.set(row.habit_id, list);
  }

  const cleanByAnti = new Map<string, string[]>();
  for (const row of acd.data ?? []) {
    const list = cleanByAnti.get(row.anti_id) ?? [];
    list.push(row.date);
    cleanByAnti.set(row.anti_id, list);
  }

  const relapseByAnti = new Map<string, string[]>();
  for (const row of ar.data ?? []) {
    const list = relapseByAnti.get(row.anti_id) ?? [];
    list.push(row.date);
    relapseByAnti.set(row.anti_id, list);
  }

  const prof = p.data;
  return {
    settings: {
      userName: prof?.user_name ?? "Друг",
      dailyWaterGoal: prof?.daily_water_goal ?? 8,
      dailyStepsGoal: prof?.daily_steps_goal ?? 10000,
      sleepGoal: prof?.sleep_goal ?? 8,
    },
    habits: (h.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      targetPerWeek: row.target_per_week,
      completions: completionsByHabit.get(row.id) ?? [],
    })),
    antiHabits: (a.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      record: row.record,
      cleanDays: cleanByAnti.get(row.id) ?? [],
      relapses: relapseByAnti.get(row.id) ?? [],
    })),
    tasks: (t.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      priority: row.priority,
      due: row.due,
      done: row.done,
      estimateMin: row.estimate_min,
      spentMin: row.spent_min,
    })),
    transactions: (tx.data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      date: row.date,
      note: row.note,
    })),
    health: (hl.data ?? []).map((row) => ({
      date: row.date,
      sleepHours: Number(row.sleep_hours),
      waterGlasses: row.water_glasses,
      steps: row.steps,
      mood: row.mood,
    })),
  };
}

// ---------- Очистка данных текущего пользователя ----------

async function clearMyData() {
  // RLS гарантирует, что удалятся только строки текущего пользователя
  await supabase.from("habit_completions").delete().neq("habit_id", "__none__");
  await supabase.from("habits").delete().neq("id", "__none__");
  await supabase.from("anti_clean_days").delete().neq("anti_id", "__none__");
  await supabase.from("anti_relapses").delete().neq("anti_id", "__none__");
  await supabase.from("anti_habits").delete().neq("id", "__none__");
  await supabase.from("tasks").delete().neq("id", "__none__");
  await supabase.from("transactions").delete().neq("id", "__none__");
  await supabase.from("health").delete().neq("date", "1970-01-01");
}

// ---------- Провайдер: рендерится только для авторизованного пользователя ----------

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const next = await fetchAll();
      setState(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные из Supabase.");
    }
  }, [user]);

  useEffect(() => {
    setState(null);
    setError(isSupabaseConfigured ? null : "config");
    load();
  }, [user, load]);

  /** Выполняет мутацию и перечитывает состояние. */
  const mutate = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      const res = await fn();
      if (res && typeof res === "object" && "error" in res && res.error) {
        const msg = (res.error as { message?: string }).message ?? "Ошибка запроса";
        throw new Error(msg);
      }
      const next = await fetchAll();
      setState(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Действие не выполнено.");
    }
  }, []);

  const actions = useMemo(
    () => ({
      reload: load,

      toggleHabit: (habitId: string, date = today()) =>
        mutate(async () => {
          const { data } = await supabase
            .from("habit_completions")
            .select("habit_id")
            .eq("habit_id", habitId)
            .eq("date", date)
            .maybeSingle();
          if (data) {
            return await supabase
              .from("habit_completions")
              .delete()
              .eq("habit_id", habitId)
              .eq("date", date);
          }
          return await supabase.from("habit_completions").insert({ habit_id: habitId, date });
        }),

      addHabit: (habit: { name: string; icon: string; color: string; targetPerWeek: number }) =>
        mutate(async () =>
          await supabase.from("habits").insert({
            id: `h-${Date.now()}`,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            target_per_week: habit.targetPerWeek,
          })
        ),

      removeHabit: (id: string) =>
        mutate(async () => await supabase.from("habits").delete().eq("id", id)),

      checkAntiHabit: (id: string) =>
        mutate(async () => {
          const date = today();
          const { data: existing } = await supabase
            .from("anti_clean_days")
            .select("anti_id")
            .eq("anti_id", id)
            .eq("date", date)
            .maybeSingle();
          if (existing) return;
          const ins = await supabase.from("anti_clean_days").insert({ anti_id: id, date });
          if (ins.error) return ins;
          // Пересчитываем серию и обновляем рекорд
          const { data: clean, error: cleanErr } = await supabase
            .from("anti_clean_days")
            .select("date")
            .eq("anti_id", id);
          if (cleanErr) return cleanErr;
          const streak = currentStreak((clean ?? []).map((r) => r.date));
          const { data: anti, error: antiErr } = await supabase
            .from("anti_habits")
            .select("record")
            .eq("id", id)
            .maybeSingle();
          if (antiErr) return antiErr;
          if (anti && streak > anti.record) {
            return await supabase.from("anti_habits").update({ record: streak }).eq("id", id);
          }
        }),

      relapseAntiHabit: (id: string) =>
        mutate(async () =>
          await supabase
            .from("anti_relapses")
            .upsert(
              { anti_id: id, date: today() },
              { onConflict: "anti_id,date", ignoreDuplicates: true }
            )
        ),

      addAntiHabit: (habit: { name: string; icon: string; color: string }) =>
        mutate(async () =>
          await supabase.from("anti_habits").insert({
            id: `a-${Date.now()}`,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            record: 0,
          })
        ),

      removeAntiHabit: (id: string) =>
        mutate(async () => await supabase.from("anti_habits").delete().eq("id", id)),

      addTask: (task: { title: string; priority: string; due: string; estimateMin?: number }) =>
        mutate(async () =>
          await supabase.from("tasks").insert({
            id: `t-${Date.now()}`,
            title: task.title,
            priority: task.priority,
            due: task.due,
            estimate_min: task.estimateMin ?? 30,
          })
        ),

      toggleTask: (id: string) =>
        mutate(async () => {
          const { data } = await supabase.from("tasks").select("done").eq("id", id).maybeSingle();
          if (!data) return;
          return await supabase.from("tasks").update({ done: !data.done }).eq("id", id);
        }),

      removeTask: (id: string) =>
        mutate(async () => await supabase.from("tasks").delete().eq("id", id)),

      addFocusTime: (id: string, minutes: number) =>
        mutate(async () => {
          if (minutes <= 0) return;
          const { data } = await supabase.from("tasks").select("spent_min").eq("id", id).maybeSingle();
          if (!data) return;
          return await supabase
            .from("tasks")
            .update({ spent_min: data.spent_min + minutes })
            .eq("id", id);
        }),

      addTransaction: (tx: { type: string; amount: number; category: string; date: string; note: string }) =>
        mutate(async () =>
          await supabase.from("transactions").insert({
            id: `tx-${Date.now()}`,
            type: tx.type === "income" ? "income" : "expense",
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            note: tx.note,
          })
        ),

      removeTransaction: (id: string) =>
        mutate(async () => await supabase.from("transactions").delete().eq("id", id)),

      logHealth: (log: { sleepHours: number; waterGlasses: number; steps: number; mood: number }) =>
        mutate(async () =>
          await supabase.from("health").upsert(
            {
              date: today(),
              sleep_hours: log.sleepHours,
              water_glasses: log.waterGlasses,
              steps: log.steps,
              mood: log.mood,
            },
            { onConflict: "user_id,date" }
          )
        ),

      updateSettings: (patch: Partial<Settings>) =>
        mutate(async () => {
          // upsert: работает и когда профиль создан триггером, и когда его нет
          const { data: existing, error: selErr } = await supabase
            .from("profiles")
            .select("user_name, daily_water_goal, daily_steps_goal, sleep_goal")
            .eq("id", user?.id ?? "")
            .maybeSingle();
          if (selErr) return selErr;
          return await supabase.from("profiles").upsert({
            id: user?.id,
            user_name: patch.userName ?? existing?.user_name ?? "Друг",
            daily_water_goal: patch.dailyWaterGoal ?? existing?.daily_water_goal ?? 8,
            daily_steps_goal: patch.dailyStepsGoal ?? existing?.daily_steps_goal ?? 10000,
            sleep_goal: patch.sleepGoal ?? existing?.sleep_goal ?? 8,
          });
        }),

      resetData: () =>
        mutate(async () => {
          await clearMyData();
        }),
    }),
    [load, mutate, user]
  );

  // Экран загрузки / ошибки
  if (!state || error) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)]">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-core-ink"
          >
            <circle cx="12" cy="12" r="8.25" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          </svg>
          <h1 className="mt-3 text-center text-lg font-bold tracking-tight">LifeCore</h1>

          {error === "config" ? (
            <>
              <p className="mt-2 text-center text-sm leading-relaxed text-core-muted">
                Подключите Supabase, чтобы данные хранились в облаке:
              </p>
              <ol className="mt-4 list-decimal space-y-2 rounded-lg bg-black/[0.03] p-4 pl-8 text-sm leading-relaxed text-core-muted">
                <li>
                  Создайте проект на{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-core-accent underline"
                  >
                    supabase.com
                  </a>
                </li>
                <li>
                  Выполните <code className="rounded bg-black/5 px-1">supabase/schema.sql</code> в SQL Editor
                </li>
                <li>
                  Скопируйте <code className="rounded bg-black/5 px-1">.env.example</code> в{" "}
                  <code className="rounded bg-black/5 px-1">.env</code> и вставьте URL и anon-ключ
                </li>
                <li>
                  Перезапустите <code className="rounded bg-black/5 px-1">npm run dev</code>
                </li>
              </ol>
            </>
          ) : error ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-core-muted">
                Не удалось получить данные. Проверьте, что миграция{" "}
                <code className="rounded bg-black/5 px-1">supabase/migrate-to-auth.sql</code> выполнена.
              </p>
              <p className="mt-2 break-words rounded-lg bg-core-bad/[0.06] p-3 text-xs text-core-bad">
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  load();
                }}
                className="mt-4 w-full rounded-lg bg-core-accent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#3b93f5] active:scale-[0.97]"
              >
                Повторить
              </button>
            </>
          ) : (
            <p className="mt-2 text-center text-sm text-core-muted">Загружаем данные…</p>
          )}
        </div>
      </div>
    );
  }

  const value: AppStateContext = { state, ...actions };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

/** Текущая серия чистых дней (включая сегодня, если он чистый). */
export function currentStreak(cleanDays: string[]): number {
  const set = new Set(cleanDays);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const cursor = new Date();
  if (!set.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
