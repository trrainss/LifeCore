import type { AppState, Habit } from "../types";
import { lastNDays, today, weekdayShort } from "./dates";

/** Данные для графика привычек за неделю: сколько выполнено в каждый день */
export function habitWeeklyData(habits: Habit[]) {
  return lastNDays(7).map((date) => {
    const done = habits.filter((h) => h.completions.includes(date)).length;
    return { day: weekdayShort(date), date, value: done };
  });
}

/** Процент выполнения привычки за последние 7 дней относительно цели */
export function habitWeekProgress(habit: Habit): number {
  const week = lastNDays(7);
  const done = week.filter((d) => habit.completions.includes(d)).length;
  return Math.min(100, Math.round((done / habit.targetPerWeek) * 100));
}

export function habitTodayDone(habit: Habit): boolean {
  return habit.completions.includes(today());
}

export function antiStreak(cleanDays: string[], relapses: string[]): number {
  const relapseSet = new Set(relapses);
  const days = lastNDays(60);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (relapseSet.has(d)) break;
    if (d === today() && !cleanDays.includes(d)) {
      // сегодня ещё не отмечен — серия не растёт, но и не рвётся
      continue;
    }
    streak++;
  }
  return streak;
}

export function financeSummary(transactions: AppState["transactions"]) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function categoryBreakdown(transactions: AppState["transactions"]) {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function dailyFlow(transactions: AppState["transactions"]) {
  return lastNDays(14).map((date) => {
    const day = transactions.filter((t) => t.date === date);
    return {
      date,
      day: date.slice(8),
      income: day.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: day.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });
}

/** Коэффициент корреляции Пирсона между двумя рядами */
function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

export type Insight = {
  text: string;
  tone: "good" | "warn" | "bad" | "info";
};

/** Русская плюрализация: 1 день / 2 дня / 5 дней */
function pluralRu(n: number, one: string, two: string, five: string): string {
  const m10 = Math.abs(n) % 10;
  const m100 = Math.abs(n) % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return two;
  return five;
}

/** Автоматические выводы и корреляции для модуля «Аналитика» */
export function buildInsights(state: AppState): {
  correlations: Array<{ label: string; value: number }>;
  insights: Insight[];
} {
  const days = lastNDays(30);
  const healthByDate = new Map(state.health.map((h) => [h.date, h]));

  const habitsDone = days.map((d) =>
    state.habits.filter((h) => h.completions.includes(d)).length
  );
  const sleep = days.map((d) => healthByDate.get(d)?.sleepHours ?? 0);
  const steps = days.map((d) => healthByDate.get(d)?.steps ?? 0);
  const mood = days.map((d) => healthByDate.get(d)?.mood ?? 0);
  const tasksDone = days.map((d) =>
    state.tasks.filter((t) => t.done && t.due === d).length
  );
  const focusMin = days.map(
    (d) =>
      state.tasks
        .filter((t) => t.due === d)
        .reduce((s, t) => s + t.spentMin, 0) / 60
  );
  const expenseByDay = days.map(
    (d) =>
      state.transactions
        .filter((t) => t.date === d && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0) / 100
  );

  const correlations = [
    { label: "Сон → Настроение", value: pearson(sleep, mood) },
    { label: "Привычки → Настроение", value: pearson(habitsDone, mood) },
    { label: "Шаги → Сон", value: pearson(steps, sleep) },
    { label: "Фокус → Выполненные задачи", value: pearson(focusMin, tasksDone) },
    { label: "Сон → Продуктивность", value: pearson(sleep, tasksDone) },
    { label: "Траты → Настроение", value: pearson(expenseByDay, mood) },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const insights: Insight[] = [];

  // Аккаунт без данных: не строим выводы из пустоты
  const isEmpty =
    state.habits.length === 0 &&
    state.antiHabits.length === 0 &&
    state.tasks.length === 0 &&
    state.transactions.length === 0 &&
    state.health.length === 0;
  if (isEmpty) {
    return {
      correlations,
      insights: [
        {
          text: "Данных пока нет. Добавьте первую привычку, задачу или трату — через несколько дней здесь появятся взаимосвязи и рекомендации.",
          tone: "info",
        },
      ],
    };
  }

  const top = correlations[0];
  if (top && Math.abs(top.value) > 0.35) {
    insights.push({
      text: `Самая сильная связь: «${top.label}» (r = ${top.value.toFixed(2)}). ${
        top.value > 0
          ? "Рост одного показателя сопровождается ростом другого."
          : "Рост одного показателя сопровождается снижением другого."
      }`,
      tone: "info",
    });
  }

  const sleepValues = sleep.filter((v) => v > 0);
  if (sleepValues.length >= 3) {
    const avgSleep = sleepValues.reduce((s, v) => s + v, 0) / sleepValues.length;
    if (avgSleep < state.settings.sleepGoal - 0.5) {
      insights.push({
        text: `Средний сон за период — ${avgSleep.toFixed(1)} ч, это ниже цели (${state.settings.sleepGoal} ч). Попробуйте ложиться на 30–40 минут раньше.`,
        tone: "warn",
      });
    } else {
      insights.push({
        text: `Средний сон за период — ${avgSleep.toFixed(1)} ч, вы держитесь цели. Отличная база для продуктивности.`,
        tone: "good",
      });
    }
  }

  const bestHabit = [...state.habits]
    .map((h) => ({ h, p: habitWeekProgress(h) }))
    .sort((a, b) => b.p - a.p)[0];
  const worstHabit = [...state.habits]
    .map((h) => ({ h, p: habitWeekProgress(h) }))
    .sort((a, b) => a.p - b.p)[0];
  if (bestHabit && worstHabit) {
    insights.push({
      text: `«${bestHabit.h.name}» — самая стабильная привычка недели (${bestHabit.p}% от цели). «${worstHabit.h.name}» отстаёт (${worstHabit.p}%) — стоит привязать её к утреннему ритуалу.`,
      tone: "info",
    });
  }

  // Вывод по самой длинной серии удержания (любая анти-привычка пользователя)
  const bestAnti = state.antiHabits
    .map((a) => ({ a, streak: antiStreak(a.cleanDays, a.relapses) }))
    .sort((x, y) => y.streak - x.streak)[0];
  if (bestAnti && bestAnti.streak > 0) {
    insights.push({
      text: `«${bestAnti.a.name}»: серия удержания ${bestAnti.streak} ${pluralRu(bestAnti.streak, "день", "дня", "дней")} при рекорде ${bestAnti.a.record}. Отмечайте день хотя бы раз в сутки — серия не обнулится.`,
      tone: bestAnti.streak >= 7 ? "good" : "warn",
    });
  }

  const { income, expense } = financeSummary(
    state.transactions.filter((t) => days.includes(t.date))
  );
  if (expense > income * 0.9 && income > 0) {
    insights.push({
      text: `За месяц расходы закрыли ${(expense / Math.max(income, 1) * 100).toFixed(0)}% доходов. Рекомендуется откладывать минимум 15% в начале месяца.`,
      tone: "bad",
    });
  } else if (income > 0) {
    insights.push({
      text: `Норма сбережений за месяц — ${(((income - expense) / income) * 100).toFixed(0)}%. Финансовая подушка растёт.`,
      tone: "good",
    });
  }

  return { correlations, insights };
}
