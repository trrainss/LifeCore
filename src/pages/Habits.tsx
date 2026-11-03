import { useState } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge, Button } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ProgressRing from "../components/ui/ProgressRing";
import WeeklyBars from "../components/charts/WeeklyBars";
import Icon from "../components/Icon";
import { habitTodayDone, habitWeekProgress, habitWeeklyData } from "../utils/analytics";
import { lastNDays, weekdayShort, plural } from "../utils/dates";

const ICON_CHOICES = ["run", "book", "spark", "globe", "drop", "moon", "target"];
const COLOR_CHOICES = ["#4DA3FF", "#9B6BFF", "#34C77B", "#FFB020", "#FF5D73", "#5BC8F5"];

export default function Habits() {
  const { state, toggleHabit, addHabit, removeHabit } = useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("run");
  const [color, setColor] = useState("#4DA3FF");
  const [target, setTarget] = useState(5);

  const week = lastNDays(7);
  const overall = state.habits.length
    ? Math.round(state.habits.reduce((s, h) => s + habitWeekProgress(h), 0) / state.habits.length)
    : 0;

  const submit = () => {
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color, targetPerWeek: target });
    setName("");
    setFormOpen(false);
  };

  return (
    <Layout title="Привычки">
      <div className="space-y-6">
        {/* Сводка */}
        <div className="rise-in flex flex-col items-center gap-5 rounded-xl bg-white/80 p-6 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] backdrop-blur-xl sm:flex-row">
          <ProgressRing value={overall} size={92} stroke={8}>
            <div className="text-center">
              <div className="text-lg font-bold">{overall}%</div>
              <div className="text-[10px] text-core-muted">от целей недели</div>
            </div>
          </ProgressRing>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold tracking-tight">
              {state.habits.length} {plural(state.habits.length, ["активная привычка", "активные привычки", "активных привычек"])}
            </h2>
            <p className="mt-1 text-sm text-core-muted">
              Отмечайте чек-ин каждый день — кольца покажут прогресс за неделю.
            </p>
          </div>
          <Button onClick={() => setFormOpen((v) => !v)}>
            <Icon name="plus" size={16} />
            Новая привычка
          </Button>
        </div>

        {/* Форма добавления */}
        {formOpen && (
          <Card className="rise-in">
            <SectionTitle title="Новая привычка" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-core-muted">Название</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Планка 5 минут"
                  className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-core-muted">
                  Цель: {target}× в неделю
                </span>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="mt-3 w-full accent-[#4DA3FF]"
                />
              </label>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-core-muted">Иконка</span>
                <div className="flex flex-wrap gap-2">
                  {ICON_CHOICES.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
                        icon === ic ? "border-core-accent bg-core-accent/10 text-core-accent" : "border-black/10 text-core-muted hover:border-core-accent/40"
                      }`}
                    >
                      <Icon name={ic} size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-core-muted">Цвет</span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_CHOICES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-9 w-9 rounded-lg transition-all duration-200 ${
                        color === c ? "ring-2 ring-offset-2 ring-core-ink/30 scale-105" : ""
                      }`}
                      style={{ background: c }}
                      aria-label={`Цвет ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={submit} disabled={!name.trim()}>Добавить</Button>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>Отмена</Button>
            </div>
          </Card>
        )}

        {/* Список привычек */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {state.habits.length === 0 && (
            <div className="lg:col-span-2">
              <EmptyState
                title="Пока нет ни одной привычки"
                hint="Нажмите «Новая привычка» выше: выберите название, иконку, цвет и цель на неделю."
              />
            </div>
          )}
          {state.habits.map((h, idx) => {
            const done = habitTodayDone(h);
            const progress = habitWeekProgress(h);
            const weekDone = week.filter((d) => h.completions.includes(d)).length;
            const streakDays = (() => {
              let s = 0;
              for (let i = 0; i < 60; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                if (h.completions.includes(iso)) s++;
                else if (i > 0) break;
                else continue;
              }
              return s;
            })();

            return (
              <Card key={h.id} className="rise-in" style={{ "--i": idx } as React.CSSProperties}>
                <div className="flex items-start gap-4">
                  <ProgressRing value={progress} size={76} stroke={7} color={h.color}>
                    <span className="text-sm font-bold">{progress}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ background: `${h.color}14`, color: h.color }}
                        >
                          <Icon name={h.icon} size={18} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold leading-tight">{h.name}</div>
                          <div className="truncate text-xs text-core-muted">
                            {weekDone}/{h.targetPerWeek} на этой неделе · серия {streakDays} {plural(streakDays, ["день", "дня", "дней"])}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeHabit(h.id)}
                        className="shrink-0 rounded-lg p-1.5 text-core-muted transition-colors hover:bg-core-bad/10 hover:text-core-bad"
                        aria-label="Удалить привычку"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>

                    {/* Чек-ин за неделю */}
                    <div className="mt-3.5 flex items-center justify-between gap-2">
                      {week.map((d) => {
                        const filled = h.completions.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleHabit(h.id)}
                            title={d}
                            className={`flex h-8 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium transition-all duration-200 active:scale-90 ${
                              filled ? "text-white" : "bg-black/[0.04] text-core-muted hover:bg-black/[0.07]"
                            }`}
                            style={filled ? { background: h.color } : undefined}
                          >
                            {weekdayShort(d)}
                            <span>{filled ? "✓" : "·"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Badge color={h.color}>
                        цель {h.targetPerWeek}× / неделю
                      </Badge>
                      <Button
                        variant={done ? "soft" : "primary"}
                        className="shrink-0 !py-1.5 !text-xs"
                        onClick={() => toggleHabit(h.id)}
                      >
                        {done ? "Выполнено сегодня" : "Чек-ин: выполнил"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Сводный график */}
        <Card className="rise-in">
          <SectionTitle title="Выполнения за неделю" subtitle="все привычки вместе" />
          <WeeklyBars data={habitWeeklyData(state.habits)} height={200} />
        </Card>
      </div>
    </Layout>
  );
}
