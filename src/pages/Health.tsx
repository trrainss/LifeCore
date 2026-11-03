import { useState } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Button } from "../components/ui/Card";
import StatCard, { StatGrid } from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import Icon from "../components/Icon";
import TrendLine from "../components/charts/TrendLine";
import { formatNumber, lastNDays, today } from "../utils/dates";

const MOOD_FACES = ["😞", "😕", "😐", "🙂", "😄"];

export default function Health() {
  const { state, logHealth } = useAppState();
  const { health, settings } = state;

  const todayLog = health.find((h) => h.date === today());
  const [sleep, setSleep] = useState(todayLog?.sleepHours ?? 7.5);
  const [water, setWater] = useState(todayLog?.waterGlasses ?? 0);
  const [steps, setSteps] = useState(todayLog?.steps ?? 0);
  const [mood, setMood] = useState<number>(todayLog?.mood ?? 3);

  const last14 = [...health].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-14);
  const avg = (key: "sleepHours" | "waterGlasses" | "steps" | "mood") =>
    last14.length
      ? Math.round((last14.reduce((s, h) => s + h[key], 0) / last14.length) * 10) / 10
      : 0;

  const sleepData = last14.map((h) => ({ day: h.date.slice(8), sleep: h.sleepHours }));
  const waterData = last14.map((h) => ({ day: h.date.slice(8), water: h.waterGlasses }));
  const stepsData = last14.map((h) => ({ day: h.date.slice(8), steps: Math.round(h.steps / 100) / 10 }));
  const moodData = last14.map((h) => ({ day: h.date.slice(8), mood: h.mood }));

  const save = () => logHealth({ sleepHours: sleep, waterGlasses: water, steps, mood: mood as 1 | 2 | 3 | 4 | 5 });

  return (
    <Layout title="Здоровье">
      <div className="space-y-6">
        <StatGrid>
          <StatCard label="Сон сегодня" value={todayLog ? `${todayLog.sleepHours} ч` : "—"} hint={`цель ${settings.sleepGoal} ч · среднее ${avg("sleepHours")} ч`} icon="moon" color="#9B6BFF" />
          <StatCard label="Вода" value={todayLog ? `${todayLog.waterGlasses} ст.` : "—"} hint={`цель ${settings.dailyWaterGoal} стаканов`} icon="drop" color="#4DA3FF" />
          <StatCard label="Шаги" value={todayLog ? formatNumber(todayLog.steps) : "—"} hint={`цель ${formatNumber(settings.dailyStepsGoal)}`} icon="run" color="#34C77B" />
          <StatCard label="Настроение" value={todayLog ? `${todayLog.mood}/5` : "—"} hint={`среднее за 14 дней: ${avg("mood")}`} icon="heart" color="#FF5D73" />
        </StatGrid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Чек-ин дня */}
          <Card className="rise-in">
            <SectionTitle title="Чек-ин дня" subtitle="заполните показатели за сегодня" />
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Сон</span>
                  <span className="tabular-nums text-core-muted">{sleep.toFixed(1)} ч</span>
                </div>
                <input type="range" min={3} max={12} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full accent-[#9B6BFF]" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Вода</span>
                  <span className="tabular-nums text-core-muted">{water} / {settings.dailyWaterGoal} стаканов</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: settings.dailyWaterGoal }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setWater(i + 1 === water ? i : i + 1)}
                      className={`flex h-9 min-w-[28px] flex-1 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                        i < water ? "bg-core-accent text-white" : "bg-black/[0.04] text-core-muted hover:bg-core-accent/20"
                      }`}
                      aria-label={`Стакан ${i + 1}`}
                    >
                      <Icon name="drop" size={15} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Шаги</span>
                  <span className="tabular-nums text-core-muted">{formatNumber(steps)}</span>
                </div>
                <input type="range" min={0} max={25000} step={500} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-[#34C77B]" />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium">Настроение</div>
                <div className="flex flex-wrap gap-2">
                  {MOOD_FACES.map((face, i) => (
                    <button
                      key={i}
                      onClick={() => setMood(i + 1)}
                      className={`flex h-11 flex-1 items-center justify-center rounded-lg text-xl transition-all duration-200 active:scale-90 ${
                        mood === i + 1 ? "bg-core-accent/15 ring-2 ring-core-accent" : "bg-black/[0.04] hover:bg-core-accent/10"
                      }`}
                      aria-label={`Настроение ${i + 1}`}
                    >
                      {face}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={save}>Сохранить чек-ин</Button>
            </div>
          </Card>

          {/* Кольца целей */}
          <Card className="rise-in">
            <SectionTitle title="Цели на сегодня" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={todayLog ? (todayLog.sleepHours / settings.sleepGoal) * 100 : 0} size={90} stroke={8} color="#9B6BFF">
                  <div className="text-center">
                    <div className="text-sm font-bold">{todayLog ? todayLog.sleepHours.toFixed(1) : "—"}</div>
                    <div className="text-[10px] text-core-muted">из {settings.sleepGoal} ч</div>
                  </div>
                </ProgressRing>
                <span className="text-xs font-medium text-core-muted">Сон</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={todayLog ? (todayLog.waterGlasses / settings.dailyWaterGoal) * 100 : 0} size={90} stroke={8} color="#4DA3FF">
                  <div className="text-center">
                    <div className="text-sm font-bold">{todayLog?.waterGlasses ?? 0}</div>
                    <div className="text-[10px] text-core-muted">стаканов</div>
                  </div>
                </ProgressRing>
                <span className="text-xs font-medium text-core-muted">Вода</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={todayLog ? (todayLog.steps / settings.dailyStepsGoal) * 100 : 0} size={90} stroke={8} color="#34C77B">
                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {todayLog ? Math.round((todayLog.steps / settings.dailyStepsGoal) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-core-muted">шаги</div>
                  </div>
                </ProgressRing>
                <span className="text-xs font-medium text-core-muted">Активность</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={todayLog ? (todayLog.mood / 5) * 100 : 0} size={90} stroke={8} color="#FF5D73">
                  <div className="text-center">
                    <div className="text-lg">{todayLog ? MOOD_FACES[todayLog.mood - 1] : "—"}</div>
                  </div>
                </ProgressRing>
                <span className="text-xs font-medium text-core-muted">Настроение</span>
              </div>
            </div>
          </Card>

          {/* Быстрая сводка */}
          <Card className="rise-in">
            <SectionTitle title="Средние за 14 дней" />
            <div className="space-y-4">
              {[
                { label: "Сон", value: `${avg("sleepHours")} ч`, color: "#9B6BFF", pct: Math.min(100, (avg("sleepHours") / 10) * 100) },
                { label: "Вода", value: `${avg("waterGlasses")} ст.`, color: "#4DA3FF", pct: Math.min(100, (avg("waterGlasses") / 10) * 100) },
                { label: "Шаги", value: formatNumber(Math.round(avg("steps"))), color: "#34C77B", pct: Math.min(100, (avg("steps") / 12000) * 100) },
                { label: "Настроение", value: `${avg("mood")} / 5`, color: "#FF5D73", pct: (avg("mood") / 5) * 100 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-core-muted">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/[0.05]">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-[#9B6BFF]/[0.07] p-3.5 text-xs leading-relaxed text-core-muted">
              Лучший сон за период: {Math.max(...last14.map((h) => h.sleepHours), 0)} ч.
              Самый активный день: {formatNumber(Math.max(...last14.map((h) => h.steps), 0))} шагов.
            </div>
          </Card>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rise-in">
            <SectionTitle title="Сон" subtitle="часы, последние 14 дней" />
            <TrendLine data={sleepData} xKey="day" yKey="sleep" color="#9B6BFF" unit=" ч" />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Вода" subtitle="стаканы в день" />
            <TrendLine data={waterData} xKey="day" yKey="water" color="#4DA3FF" unit=" ст." />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Шаги" subtitle="тысяч в день" />
            <TrendLine data={stepsData} xKey="day" yKey="steps" color="#34C77B" unit=" тыс." />
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Настроение" subtitle="шкала 1–5" />
            <TrendLine data={moodData} xKey="day" yKey="mood" color="#FF5D73" />
          </Card>
        </div>
      </div>
    </Layout>
  );
}
