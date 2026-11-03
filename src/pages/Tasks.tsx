import { useEffect, useRef, useState } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge, Button } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/Icon";
import TrendLine from "../components/charts/TrendLine";
import { lastNDays, today, formatDateHuman, plural } from "../utils/dates";
import type { TaskPriority } from "../types";

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: "Высокий", color: "#FF5D73" },
  medium: { label: "Средний", color: "#FFB020" },
  low: { label: "Низкий", color: "#4DA3FF" },
};

/** Таймер фокуса (Pomodoro-подобный) */
function FocusTimer({
  onAdd,
}: {
  onAdd: (minutes: number) => void;
}) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const { state } = useAppState();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const total = 25 * 60;
  const pct = ((total - seconds) / total) * 100;
  const openTasks = state.tasks.filter((t) => !t.done);

  return (
    <Card className="rise-in">
      <SectionTitle title="Таймер фокуса" subtitle="25 минут глубокой работы" />
      <div className="flex flex-col items-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(28,28,30,0.07)" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#4DA3FF"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 0.4s linear" }}
            />
          </svg>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums tracking-tight">
              {mm}:{ss}
            </div>
            <div className="text-xs text-core-muted">
              {taskId
                ? state.tasks.find((t) => t.id === taskId)?.title.slice(0, 24)
                : "выберите задачу"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => setRunning((r) => !r)} disabled={seconds === 0}>
            <Icon name={running ? "pause" : "play"} size={16} />
            {running ? "Пауза" : seconds === total ? "Старт" : "Продолжить"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setRunning(false);
              setSeconds(total);
            }}
          >
            <Icon name="reset" size={16} />
            Сброс
          </Button>
        </div>

        <select
          value={taskId ?? ""}
          onChange={(e) => setTaskId(e.target.value || null)}
          className="mt-4 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-core-accent"
        >
          <option value="">Без привязки к задаче</option>
          {openTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <Button
          variant="soft"
          className="mt-3 w-full"
          disabled={seconds === total || seconds === 0}
          onClick={() => {
            const focused = Math.round((total - seconds) / 60);
            if (focused > 0) onAdd(focused);
            setSeconds(total);
            setRunning(false);
          }}
        >
          Завершить и записать фокус
        </Button>
      </div>
    </Card>
  );
}

export default function Tasks() {
  const { state, addTask, toggleTask, removeTask, addFocusTime } = useAppState();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [due, setDue] = useState(today());

  const sorted = [...state.tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order = { high: 0, medium: 1, low: 2 };
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    return order[a.priority] - order[b.priority];
  });

  const week = lastNDays(7);
  const weeklyData = week.map((d) => ({
    day: d.slice(8),
    done: state.tasks.filter((t) => t.done && t.due === d).length,
    planned: state.tasks.filter((t) => t.due === d).length,
  }));

  const overdue = state.tasks.filter((t) => !t.done && t.due < today()).length;
  const todayCount = state.tasks.filter((t) => t.due === today()).length;

  const submit = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, due });
    setTitle("");
  };

  return (
    <Layout title="Задачи">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Список задач */}
          <div className="space-y-6 xl:col-span-2">
            <Card className="rise-in">
              <SectionTitle
                title="Список задач"
                subtitle={`${todayCount} на сегодня · ${overdue} просрочено`}
              />
              {/* Быстрое добавление */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Новая задача…"
                  className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-core-accent focus:ring-2 focus:ring-core-accent/20 sm:min-w-[160px]"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-core-accent"
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-core-accent"
                />
                <Button type="submit" className="shrink-0">
                  <Icon name="plus" size={16} />
                  Добавить
                </Button>
              </form>

              <ul className="space-y-2">
                {sorted.length === 0 && (
                  <EmptyState
                    compact
                    title="Задач пока нет"
                    hint="Добавьте первую задачу через форму выше — укажите приоритет и дедлайн."
                  />
                )}
                {sorted.map((t) => {
                  const meta = PRIORITY_META[t.priority];
                  const isOverdue = !t.done && t.due < today();
                  return (
                    <li
                      key={t.id}
                      className={`group flex min-w-0 items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
                        isOverdue
                          ? "border-core-bad/25 bg-core-bad/[0.04]"
                          : "border-black/5 hover:bg-black/[0.02]"
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 active:scale-90 ${
                          t.done
                            ? "border-[#34C77B] bg-[#34C77B] text-white"
                            : "border-black/15 text-transparent hover:border-core-accent"
                        }`}
                        aria-label={t.done ? "Вернуть в работу" : "Выполнить"}
                      >
                        <Icon name="check" size={13} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-sm ${t.done ? "text-core-muted line-through" : "font-medium"}`}>
                          {t.title}
                        </div>
                        <div className="truncate text-xs text-core-muted">
                          {formatDateHuman(t.due)}
                          {t.spentMin > 0 && ` · фокус ${Math.floor(t.spentMin / 60)}ч ${t.spentMin % 60}м`}
                          {t.estimateMin > 0 && ` · оценка ${t.estimateMin} мин`}
                        </div>
                      </div>
                      {isOverdue && <Badge color="#FF5D73">просрочено</Badge>}
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <button
                        onClick={() => removeTask(t.id)}
                        className="shrink-0 rounded-lg p-1.5 text-core-muted opacity-0 transition-all duration-200 hover:bg-core-bad/10 hover:text-core-bad group-hover:opacity-100"
                        aria-label="Удалить задачу"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Недельный обзор */}
            <Card className="rise-in">
              <SectionTitle
                title="Недельный обзор"
                subtitle="запланировано и выполнено по дням"
              />
              <div className="overflow-x-auto">
                <div className="grid min-w-[360px] grid-cols-7 gap-1.5 sm:gap-2">
                  {weeklyData.map((d) => {
                    const max = Math.max(...weeklyData.map((x) => Math.max(x.planned, 1)));
                    return (
                      <div key={d.day} className="flex min-w-0 flex-col items-center gap-2">
                        <div className="relative flex h-28 w-full items-end justify-center rounded-lg bg-black/[0.03] p-1.5">
                          <div
                            className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-core-accent/20"
                            style={{ height: `${Math.max(4, (d.planned / max) * 100)}%` }}
                          />
                          <div
                            className="relative w-full rounded-md bg-core-accent transition-all duration-500"
                            style={{ height: `${Math.max(4, (d.done / max) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-core-muted">{d.day}</span>
                        <span className="text-[11px] font-bold tabular-nums">{d.done}/{d.planned}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Таймер фокуса */}
          <div className="space-y-6">
            <FocusTimer
              onAdd={(minutes) => {
                // фокус без задачи записываем в первую открытую задачу дня
                const target =
                  state.tasks.find((t) => !t.done && t.due === today()) ?? state.tasks.find((t) => !t.done);
                if (target) addFocusTime(target.id, minutes);
              }}
            />
            <Card className="rise-in">
              <SectionTitle title="Сводка" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-core-muted">Всего задач</span>
                  <span className="font-semibold">{state.tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Выполнено</span>
                  <span className="font-semibold text-core-good">
                    {state.tasks.filter((t) => t.done).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Просрочено</span>
                  <span className="font-semibold text-core-bad">{overdue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Всего фокуса</span>
                  <span className="font-semibold">
                    {Math.floor(state.tasks.reduce((s, t) => s + t.spentMin, 0) / 60)}{" "}
                    {plural(Math.floor(state.tasks.reduce((s, t) => s + t.spentMin, 0) / 60), ["час", "часа", "часов"])}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="rise-in">
              <SectionTitle title="Фокус по дням" subtitle="часы, последние 14 дней" />
              <TrendLine
                data={lastNDays(14).map((d) => ({
                  day: d.slice(8),
                  hours:
                    Math.round(
                      (state.tasks
                        .filter((t) => t.due === d)
                        .reduce((s, t) => s + t.spentMin, 0) / 60) * 10
                    ) / 10,
                }))}
                xKey="day"
                yKey="hours"
                color="#4DA3FF"
                height={150}
                unit=" ч"
              />
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
