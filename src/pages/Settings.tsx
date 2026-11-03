import { useState } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Button } from "../components/ui/Card";
import Icon from "../components/Icon";
import { formatNumber } from "../utils/dates";

export default function Settings() {
  const { state, updateSettings, resetData } = useAppState();
  const { settings } = state;
  const [name, setName] = useState(settings.userName);
  const [waterGoal, setWaterGoal] = useState(settings.dailyWaterGoal);
  const [stepsGoal, setStepsGoal] = useState(settings.dailyStepsGoal);
  const [sleepGoal, setSleepGoal] = useState(settings.sleepGoal);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({
      userName: name.trim() || settings.userName,
      dailyWaterGoal: waterGoal,
      dailyStepsGoal: stepsGoal,
      sleepGoal,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Настройки">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="rise-in">
            <SectionTitle title="Профиль" subtitle="как к вам обращаться на панели дня" />
            <label className="block max-w-sm">
              <span className="mb-1.5 block text-xs font-semibold text-core-muted">Имя</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
              />
            </label>
          </Card>

          <Card className="rise-in">
            <SectionTitle title="Цели здоровья" subtitle="используются в кольцах и аналитике" />
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Сон, часов в сутки</span>
                  <span className="tabular-nums text-core-muted">{sleepGoal} ч</span>
                </div>
                <input type="range" min={5} max={11} step={0.5} value={sleepGoal} onChange={(e) => setSleepGoal(Number(e.target.value))} className="w-full accent-[#9B6BFF]" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Вода, стаканов в день</span>
                  <span className="tabular-nums text-core-muted">{waterGoal}</span>
                </div>
                <input type="range" min={4} max={14} value={waterGoal} onChange={(e) => setWaterGoal(Number(e.target.value))} className="w-full accent-[#4DA3FF]" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Шаги в день</span>
                  <span className="tabular-nums text-core-muted">{formatNumber(stepsGoal)}</span>
                </div>
                <input type="range" min={3000} max={20000} step={1000} value={stepsGoal} onChange={(e) => setStepsGoal(Number(e.target.value))} className="w-full accent-[#34C77B]" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={save}>Сохранить</Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-core-good">
                  <Icon name="check" size={16} />
                  Сохранено
                </span>
              )}
            </div>
          </Card>

          <Card className="rise-in">
            <SectionTitle title="Данные" subtitle="хранятся в облачной базе" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-relaxed text-core-muted">
                Сброс очистит таблицы в вашей базе Supabase и вернёт демонстрационный
                набор данных: привычки, транзакции за 30 дней, журнал здоровья и задачи.
                Текущие изменения будут потеряны.
              </p>
              {confirmReset ? (
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => { resetData(); setConfirmReset(false); }}>
                    Да, сбросить
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmReset(false)}>Отмена</Button>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmReset(true)}>
                  <Icon name="reset" size={16} />
                  Сбросить данные
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* О приложении */}
        <div className="space-y-6">
          <Card className="rise-in">
            <div className="flex flex-col items-center py-4 text-center">
              <span className="text-core-ink">
                <Icon name="logo" size={56} />
              </span>
              <h3 className="mt-3 text-lg font-bold tracking-tight">LifeCore</h3>
              <p className="mt-1 text-sm text-core-muted">версия 1.0.0</p>
              <p className="mt-4 max-w-[260px] text-xs leading-relaxed text-core-muted">
                Минималистичная система управления жизнью: привычки, анти-привычки,
                задачи, финансы, здоровье и аналитика — в одном спокойном интерфейсе.
              </p>
            </div>
          </Card>
          <Card className="rise-in">
            <SectionTitle title="Статистика" />
            <div className="space-y-3 text-sm">
              {[
                ["Привычек", state.habits.length],
                ["Анти-привычек", state.antiHabits.length],
                ["Задач", state.tasks.length],
                ["Транзакций", state.transactions.length],
                ["Дней здоровья", state.health.length],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-core-muted">{label}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
