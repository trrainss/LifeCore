import { useMemo } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/Icon";
import TrendLine from "../components/charts/TrendLine";
import WeeklyBars from "../components/charts/WeeklyBars";
import { buildInsights, habitWeeklyData, habitWeekProgress } from "../utils/analytics";
import { formatMoney, lastNDays } from "../utils/dates";

export default function Analytics() {
  const { state } = useAppState();
  const { correlations, insights } = useMemo(() => buildInsights(state), [state]);

  const days30 = lastNDays(30);
  const healthByDate = new Map(state.health.map((h) => [h.date, h]));

  // Сводный индекс дня: привычки + задачи + здоровье, 0..100
  const coreIndex = days30.map((d) => {
    const habitsDone = state.habits.filter((h) => h.completions.includes(d)).length;
    const habitsPct = state.habits.length ? (habitsDone / state.habits.length) * 100 : 0;
    const tasksDone = state.tasks.filter((t) => t.done && t.due === d).length;
    const tasksTotal = Math.max(1, state.tasks.filter((t) => t.due === d).length);
    const tasksPct = (tasksDone / tasksTotal) * 100;
    const h = healthByDate.get(d);
    const moodPct = h ? (h.mood / 5) * 100 : 50;
    return {
      day: d.slice(8),
      index: Math.round((habitsPct * 0.4 + tasksPct * 0.35 + moodPct * 0.25)),
    };
  });

  const expenseTrend = days30.map((d) => ({
    day: d.slice(8),
    expense:
      state.transactions
        .filter((t) => t.date === d && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0) / 100,
  }));

  const habitRanking = [...state.habits]
    .map((h) => ({ name: h.name, color: h.color, progress: habitWeekProgress(h) }))
    .sort((a, b) => b.progress - a.progress);

  const avgIndex = Math.round(coreIndex.reduce((s, d) => s + d.index, 0) / coreIndex.length);

  return (
    <Layout title="Аналитика">
      <div className="space-y-6">
        {/* Индекс дня */}
        <div className="rise-in flex flex-col gap-5 rounded-xl bg-white/80 p-6 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(28,28,30,0.07)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none" stroke="#4DA3FF" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - avgIndex / 100)}
                  style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
                />
              </svg>
              <div className="text-center">
                <div className="text-2xl font-bold">{avgIndex}</div>
                <div className="text-[10px] text-core-muted">из 100</div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Индекс LifeCore</h2>
              <p className="mt-1 max-w-md text-sm text-core-muted">
                Средний баланс привычек (40%), задач (35%) и самочувствия (25%) за последние 30 дней.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Badge color="#4DA3FF">{state.habits.length} привычек</Badge>
            <Badge color="#34C77B">{state.tasks.filter((t) => t.done).length} задач закрыто</Badge>
            <Badge color="#9B6BFF">{state.health.length} дней наблюдений</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Автоматические выводы */}
          <Card className="rise-in xl:col-span-2">
            <SectionTitle
              title="Автоматические выводы"
              subtitle="система анализирует привычки, здоровье, задачи и финансы"
            />
            <ul className="space-y-3">
              {insights.map((ins, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-black/5 p-3.5 transition-colors hover:bg-black/[0.02]"
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background:
                        ins.tone === "good" ? "#34C77B14" :
                        ins.tone === "warn" ? "#FFB02014" :
                        ins.tone === "bad" ? "#FF5D7314" : "#4DA3FF14",
                      color:
                        ins.tone === "good" ? "#34C77B" :
                        ins.tone === "warn" ? "#FFB020" :
                        ins.tone === "bad" ? "#FF5D73" : "#4DA3FF",
                    }}
                  >
                    <Icon name={ins.tone === "good" ? "check" : ins.tone === "bad" ? "arrowDown" : "spark"} size={15} />
                  </span>
                  <p className="text-sm leading-relaxed">{ins.text}</p>
                </li>
              ))}
            </ul>
          </Card>

          {/* Корреляции */}
          <Card className="rise-in">
            <SectionTitle title="Корреляции" subtitle="коэффициент Пирсона, 30 дней" />
            <ul className="space-y-3.5">
              {correlations.map((c) => {
                const strength = Math.abs(c.value);
                const positive = c.value >= 0;
                return (
                  <li key={c.label} className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-core-muted">{c.label}</span>
                      <span className={`font-semibold tabular-nums ${positive ? "text-core-good" : "text-core-bad"}`}>
                        {c.value >= 0 ? "+" : ""}{c.value.toFixed(2)}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-black/[0.05]">
                      <div
                        className="absolute top-0 h-full rounded-full transition-all duration-700"
                        style={{
                          left: positive ? "50%" : `${50 - (strength / 2) * 100}%`,
                          width: `${(strength / 2) * 100}%`,
                          background: positive ? "#34C77B" : "#FF5D73",
                        }}
                      />
                      <div className="absolute left-1/2 top-[-2px] h-3 w-px bg-black/15" />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-core-muted">
              Значения выше |0.35| считаются заметной связью. Корреляция не означает причинность, но помогает находить закономерности.
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rise-in">
            <SectionTitle title="Индекс LifeCore" subtitle="последние 30 дней" />
            <TrendLine data={coreIndex} xKey="day" yKey="index" color="#4DA3FF" height={220} />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Расходы" subtitle="рублей в день в день, 30 дней" />
            <TrendLine data={expenseTrend} xKey="day" yKey="expense" color="#FF5D73" height={220} unit=" ×100 Br" />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Привычки за неделю" subtitle="выполнений в день" />
            <WeeklyBars data={habitWeeklyData(state.habits)} height={200} />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Рейтинг привычек" subtitle="% выполнения цели за неделю" />
            {habitRanking.length === 0 ? (
              <EmptyState
                compact
                title="Привычек пока нет"
                hint="Добавьте привычки в разделе «Привычки» — здесь появится их рейтинг."
              />
            ) : (
            <ul className="space-y-3.5">
              {habitRanking.map((h) => (
                <li key={h.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{h.name}</span>
                    <span className="tabular-nums text-core-muted">{h.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${h.progress}%`, background: h.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            )}
            <div className="mt-5 flex items-center justify-between rounded-lg bg-black/[0.03] p-3.5 text-sm">
              <span className="text-core-muted">Расходы за месяц</span>
              <span className="font-semibold">
                {formatMoney(
                  state.transactions
                    .filter((t) => t.type === "expense" && t.date.startsWith(lastNDays(1)[0].slice(0, 7)))
                    .reduce((s, t) => s + t.amount, 0)
                )}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
