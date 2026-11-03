import { useAppState, currentStreak } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge, Button } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import StatCard, { StatGrid } from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import WeeklyBars from "../components/charts/WeeklyBars";
import TrendLine from "../components/charts/TrendLine";
import Icon from "../components/Icon";
import { habitWeeklyData, habitTodayDone, habitWeekProgress, antiStreak, financeSummary } from "../utils/analytics";
import { formatDateHuman, formatMoney, formatNumber, plural, today, weekdayShort } from "../utils/dates";

export default function Dashboard() {
  const { state, toggleHabit, toggleTask, checkAntiHabit } = useAppState();
  const { settings, habits, antiHabits, tasks, transactions, health } = state;

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  const todayTasks = tasks.filter((t) => t.due === today());
  const doneToday = todayTasks.filter((t) => t.done).length;
  const habitsDoneToday = habits.filter(habitTodayDone).length;
  const todayHealth = health.find((h) => h.date === today());
  const { balance } = financeSummary(transactions.filter((t) => t.date.startsWith(today().slice(0, 7))));

  const weekHabitData = habitWeeklyData(habits);
  const moodData = [...health]
    .slice(-14)
    .map((h) => ({ day: h.date.slice(8), mood: h.mood }));

  const overallHabitProgress = habits.length
    ? Math.round(habits.reduce((s, h) => s + habitWeekProgress(h), 0) / habits.length)
    : 0;

  return (
    <Layout title="Панель дня">
      <div className="space-y-6">
        {/* Приветствие */}
        <div className="rise-in flex flex-col gap-4 rounded-xl bg-white/80 p-6 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold tracking-tight">
              {greeting}, {settings.userName}
            </h2>
            <p className="mt-1 text-sm text-core-muted">
              {formatDateHuman(today())}, {weekdayShort(today())}. Задач на сегодня: {todayTasks.length}, выполнено: {doneToday}.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={overallHabitProgress} size={76} color="#4DA3FF">
              <div className="text-center">
                <div className="text-sm font-bold">{overallHabitProgress}%</div>
                <div className="text-[9px] text-core-muted">привычки</div>
              </div>
            </ProgressRing>
            <ProgressRing
              value={todayTasks.length ? (doneToday / todayTasks.length) * 100 : 0}
              size={76}
              color="#34C77B"
            >
              <div className="text-center">
                <div className="text-sm font-bold">
                  {todayTasks.length ? `${doneToday}/${todayTasks.length}` : "0/0"}
                </div>
                <div className="text-[9px] text-core-muted">задачи</div>
              </div>
            </ProgressRing>
          </div>
        </div>

        {/* Мини-показатели */}
        <StatGrid>
          <StatCard
            label="Привычки сегодня"
            value={`${habitsDoneToday} / ${habits.length}`}
            hint="отмечено выполнений"
            icon="habit"
            color="#4DA3FF"
          />
          <StatCard
            label="Лучшая серия"
            value={`${Math.max(0, ...antiHabits.map((a) => antiStreak(a.cleanDays, a.relapses)))} дн.`}
            hint="удержание анти-привычек"
            icon="fire"
            color="#FF5D73"
          />
          <StatCard
            label="Баланс месяца"
            value={formatMoney(balance)}
            hint="доходы минус расходы"
            icon="wallet"
            color="#34C77B"
          />
          <StatCard
            label="Настроение"
            value={todayHealth ? `${todayHealth.mood}/5` : "—"}
            hint={todayHealth ? `${formatNumber(todayHealth.steps)} шагов` : "не отмечено"}
            icon="heart"
            color="#9B6BFF"
          />
        </StatGrid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Привычки дня */}
          <Card className="rise-in xl:col-span-2" style={{ "--i": 1 } as React.CSSProperties}>
            <SectionTitle
              title="Привычки на сегодня"
              subtitle="Отметьте выполнения одним нажатием"
              action={
                <Badge color="#4DA3FF">
                  {habitsDoneToday} из {habits.length}
                </Badge>
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {habits.length === 0 ? (
                <div className="sm:col-span-2">
                  <EmptyState
                    compact
                    title="Привычек пока нет"
                    hint="Добавьте первую привычку — и отмечайте её выполнение одним нажатием."
                  />
                </div>
              ) : (
                habits.map((h) => {
                const done = habitTodayDone(h);
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHabit(h.id)}
                    className={`group flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all duration-200 active:scale-[0.98] ${
                      done
                        ? "border-transparent bg-[#34C77B]/[0.08]"
                        : "border-black/5 bg-white hover:border-core-accent/30 hover:shadow-[0_12px_24px_-10px_rgba(77,163,255,0.35)]"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${h.color}14`, color: h.color }}
                    >
                      <Icon name={h.icon} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {h.name}
                      </span>
                      <span className="block truncate text-xs text-core-muted">
                        цель: {h.targetPerWeek}× в неделю · {habitWeekProgress(h)}%
                      </span>
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        done
                          ? "border-[#34C77B] bg-[#34C77B] text-white"
                          : "border-black/15 text-transparent group-hover:border-core-accent"
                      }`}
                    >
                      <Icon name="check" size={14} />
                    </span>
                  </button>
                );
              })
              )}
            </div>
          </Card>

          {/* Анти-привычки: таймер удержания */}
          <Card className="rise-in" style={{ "--i": 2 } as React.CSSProperties}>
            <SectionTitle title="Удержание" subtitle="Сколько дней держитесь" />
            <div className="space-y-3">
              {antiHabits.length === 0 && (
                <EmptyState
                  compact
                  title="Анти-привычек нет"
                  hint="Добавьте то, от чего хотите отказаться — серия покажет прогресс."
                />
              )}
              {antiHabits.map((a) => {
                const streak = antiStreak(a.cleanDays, a.cleanDays.includes(today()) ? a.relapses : a.relapses);
                const pct = Math.min(100, (streak / Math.max(a.record, 1)) * 100);
                return (
                  <div key={a.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-black/5 p-3">
                    <ProgressRing value={pct} size={56} stroke={5} color={a.color}>
                      <span className="text-[13px] font-bold">{streak}</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.name}</div>
                      <div className="truncate text-xs text-core-muted">
                        рекорд: {a.record} {plural(a.record, ["день", "дня", "дней"])}
                      </div>
                    </div>
                    {!a.cleanDays.includes(today()) && (
                      <Button variant="soft" className="shrink-0 !px-3 !py-1.5 !text-xs" onClick={() => checkAntiHabit(a.id)}>
                        Держусь
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Задачи дня */}
          <Card className="rise-in xl:col-span-2" style={{ "--i": 3 } as React.CSSProperties}>
            <SectionTitle
              title="Задачи дня"
              subtitle={`${doneToday} из ${todayTasks.length} выполнено`}
              action={
                <Badge color={doneToday === todayTasks.length && todayTasks.length ? "#34C77B" : "#FFB020"}>
                  {doneToday === todayTasks.length && todayTasks.length ? "Всё готово" : "В работе"}
                </Badge>
              }
            />
            {todayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-core-muted">
                На сегодня задач нет — добавьте их в модуле «Задачи».
              </p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-black/5 p-3 transition-colors hover:bg-black/[0.02]"
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        t.done
                          ? "border-[#34C77B] bg-[#34C77B] text-white"
                          : "border-black/15 text-transparent hover:border-core-accent"
                      }`}
                      aria-label={t.done ? "Снять отметку" : "Отметить выполненной"}
                    >
                      <Icon name="check" size={13} />
                    </button>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        t.done ? "text-core-muted line-through" : "font-medium"
                      }`}
                    >
                      {t.title}
                    </span>
                    <Badge
                      color={
                        t.priority === "high" ? "#FF5D73" : t.priority === "medium" ? "#FFB020" : "#4DA3FF"
                      }
                    >
                      {t.priority === "high" ? "высокий" : t.priority === "medium" ? "средний" : "низкий"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Мини-аналитика */}
          <div className="space-y-6">
            <Card className="rise-in" style={{ "--i": 4 } as React.CSSProperties}>
              <SectionTitle title="Привычки за неделю" subtitle="выполнений в день" />
              <WeeklyBars data={weekHabitData} />
            </Card>
            <Card className="rise-in" style={{ "--i": 5 } as React.CSSProperties}>
              <SectionTitle title="Настроение" subtitle="последние 14 дней" />
              <TrendLine data={moodData} xKey="day" yKey="mood" color="#9B6BFF" height={150} />
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
