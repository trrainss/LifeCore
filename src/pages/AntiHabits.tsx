import { useState } from "react";
import { useAppState, currentStreak } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge, Button } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ProgressRing from "../components/ui/ProgressRing";
import Icon from "../components/Icon";
import { antiStreak } from "../utils/analytics";
import { lastNDays, today, weekdayShort, plural } from "../utils/dates";

const ICON_CHOICES = ["smoke", "phone", "burger", "spark", "moon", "target"];
const COLOR_CHOICES = ["#FF5D73", "#FF8A3D", "#F2C14E", "#9B6BFF", "#4DA3FF"];

export default function AntiHabits() {
  const { state, checkAntiHabit, relapseAntiHabit, addAntiHabit, removeAntiHabit } = useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("smoke");
  const [color, setColor] = useState("#FF5D73");

  const week = lastNDays(7);
  const bestStreak = Math.max(0, ...state.antiHabits.map((a) => antiStreak(a.cleanDays, a.relapses)));

  const submit = () => {
    if (!name.trim()) return;
    addAntiHabit({ name: name.trim(), icon, color });
    setName("");
    setFormOpen(false);
  };

  return (
    <Layout title="Анти-привычки">
      <div className="space-y-6">
        {/* Герой: серия */}
        <div className="rise-in flex flex-col items-center gap-5 rounded-xl bg-white/80 p-6 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] backdrop-blur-xl sm:flex-row">
          <ProgressRing
            value={bestStreak ? Math.min(100, (bestStreak / Math.max(...state.antiHabits.map((a) => a.record), 1)) * 100) : 0}
            size={92}
            stroke={8}
            color="#FF5D73"
          >
            <div className="text-center">
              <div className="text-lg font-bold">{bestStreak}</div>
              <div className="text-[10px] text-core-muted">дней удержания</div>
            </div>
          </ProgressRing>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold tracking-tight">Кнопка «Сегодня не сорвался»</h2>
            <p className="mt-1 text-sm text-core-muted">
              Отмечайте каждый чистый день. Серия растёт, кольцевой таймер заполняется, рекорд обновляется автоматически.
            </p>
          </div>
          <Button onClick={() => setFormOpen((v) => !v)}>
            <Icon name="plus" size={16} />
            Добавить
          </Button>
        </div>

        {formOpen && (
          <Card className="rise-in">
            <SectionTitle title="Новая анти-привычка" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-core-muted">Название</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Энергетики"
                  className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
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
              <div className="sm:col-span-2">
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

        {/* Карточки анти-привычек */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {state.antiHabits.length === 0 && (
            <div className="lg:col-span-3">
              <EmptyState
                title="Список анти-привычек пуст"
                hint="Нажмите «Добавить» выше: например, «Курение», «Скроллинг соцсетей» или «Фастфуд»."
              />
            </div>
          )}
          {state.antiHabits.map((a, idx) => {
            const streak = antiStreak(a.cleanDays, a.relapses);
            const checkedToday = a.cleanDays.includes(today());
            const pct = Math.min(100, (streak / Math.max(a.record, 1)) * 100);
            const relapses30 = a.relapses.filter((d) => week.includes(d) || true).length;

            return (
              <Card key={a.id} className="rise-in" style={{ "--i": idx } as React.CSSProperties}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: `${a.color}14`, color: a.color }}
                    >
                      <Icon name={a.icon} size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold leading-tight">{a.name}</div>
                      <Badge color={checkedToday ? "#34C77B" : a.color}>
                        {checkedToday ? "сегодня чисто" : "не отмечено"}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAntiHabit(a.id)}
                    className="shrink-0 rounded-lg p-1.5 text-core-muted transition-colors hover:bg-core-bad/10 hover:text-core-bad"
                    aria-label="Удалить"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                {/* Кольцевой таймер удержания */}
                <div className="my-5 flex flex-col items-center">
                  <ProgressRing value={pct} size={140} stroke={10} color={a.color}>
                    <div className="text-center">
                      <div className="text-3xl font-bold tracking-tight">{streak}</div>
                      <div className="text-[11px] text-core-muted">
                        {plural(streak, ["день", "дня", "дней"])} держитесь
                      </div>
                    </div>
                  </ProgressRing>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-xs text-core-muted">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="fire" size={14} style={{ color: a.color }} />
                      рекорд: {a.record} {plural(a.record, ["день", "дня", "дней"])}
                    </span>
                    <span>· срывов за 30 дней: {relapses30}</span>
                  </div>
                </div>

                {/* Неделя */}
                <div className="flex gap-1.5">
                  {week.map((d) => {
                    const clean = a.cleanDays.includes(d);
                    const relapse = a.relapses.includes(d);
                    return (
                      <div
                        key={d}
                        title={d}
                        className={`flex h-9 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-md text-[10px] font-medium ${
                          relapse
                            ? "bg-core-bad/15 text-core-bad"
                            : clean
                            ? "text-white"
                            : "bg-black/[0.04] text-core-muted"
                        }`}
                        style={clean && !relapse ? { background: a.color } : undefined}
                      >
                        {weekdayShort(d)}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={checkedToday ? "soft" : "primary"}
                    className="min-w-0 flex-1"
                    onClick={() => checkAntiHabit(a.id)}
                    disabled={checkedToday}
                  >
                    {checkedToday ? "Сегодня удержался" : "Сегодня не сорвался"}
                  </Button>
                  <Button variant="danger" className="shrink-0" onClick={() => relapseAntiHabit(a.id)}>
                    Сорвался
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
