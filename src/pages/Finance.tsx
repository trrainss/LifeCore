import { useMemo, useState } from "react";
import { useAppState } from "../hooks/useAppState";
import Layout from "../components/Layout";
import { Card, SectionTitle, Badge, Button } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import StatCard, { StatGrid } from "../components/ui/StatCard";
import Icon from "../components/Icon";
import TrendLine from "../components/charts/TrendLine";
import CategoryDonut from "../components/charts/CategoryDonut";
import { categoryBreakdown, dailyFlow, financeSummary } from "../utils/analytics";
import { formatDateHuman, formatMoney, lastNDays, today } from "../utils/dates";
import type { TxCategory } from "../types";

const CATEGORIES: TxCategory[] = [
  "Продукты", "Транспорт", "Жильё", "Коммуналка", "Связь",
  "Развлечения", "Здоровье", "Образование",
  "Зарплата", "Фриланс", "Прочее",
];

export default function Finance() {
  const { state, addTransaction, removeTransaction } = useAppState();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TxCategory>("Продукты");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const monthTx = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(today().slice(0, 7))),
    [state.transactions]
  );
  const { income, expense, balance } = financeSummary(monthTx);
  const savingsRate = income ? Math.round(((income - expense) / income) * 100) : 0;

  const breakdown = useMemo(() => categoryBreakdown(monthTx), [monthTx]);
  const flow = useMemo(() => dailyFlow(state.transactions), [state.transactions]);

  const visibleTx = [...state.transactions]
    .filter((t) => filter === "all" || t.type === filter)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 40);

  const submit = () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    addTransaction({ type, amount: n, category, date: today(), note: note.trim() || category });
    setAmount("");
    setNote("");
  };

  return (
    <Layout title="Финансы">
      <div className="space-y-6">
        <StatGrid>
          <StatCard label="Доходы за месяц" value={formatMoney(income)} icon="arrowUp" color="#34C77B" hint="зарплата и фриланс" />
          <StatCard label="Расходы за месяц" value={formatMoney(expense)} icon="arrowDown" color="#FF5D73" hint={`${monthTx.filter((t) => t.type === "expense").length} операций`} />
          <StatCard label="Баланс" value={formatMoney(balance)} icon="wallet" color="#4DA3FF" delta={savingsRate} />
          <StatCard label="Норма сбережений" value={`${savingsRate}%`} icon="target" color="#9B6BFF" hint="доля доходов, которая остаётся" />
        </StatGrid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Динамика */}
          <Card className="rise-in xl:col-span-2">
            <SectionTitle title="Движение денег" subtitle="доходы и расходы, последние 14 дней" />
            <div className="flex flex-wrap gap-2">
              <Badge color="#34C77B">доходы</Badge>
              <Badge color="#FF5D73">расходы</Badge>
            </div>
            <TrendLine data={flow} xKey="day" yKey="income" color="#34C77B" height={130} />
            <TrendLine data={flow} xKey="day" yKey="expense" color="#FF5D73" height={130} />
          </Card>

          {/* Категории */}
          <Card className="rise-in">
            <SectionTitle title="Расходы по категориям" subtitle="текущий месяц" />
            <CategoryDonut data={breakdown} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Форма + таблица */}
          <div className="space-y-6 xl:col-span-2">
            <Card className="rise-in">
              <SectionTitle title="Добавить операцию" />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-5"
              >
                <div className="col-span-2 sm:col-span-1">
                  <div className="mb-1.5 text-xs font-semibold text-core-muted">Тип</div>
                  <div className="flex rounded-lg border border-black/10 p-0.5">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
                          type === t
                            ? t === "income"
                              ? "bg-core-good/15 text-core-good"
                              : "bg-core-bad/15 text-core-bad"
                            : "text-core-muted hover:text-core-ink"
                        }`}
                      >
                        {t === "income" ? "Доход" : "Расход"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="col-span-2 sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-semibold text-core-muted">Сумма, Br</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
                  />
                </label>
                <label className="col-span-2 sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-semibold text-core-muted">Категория</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TxCategory)}
                    className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm outline-none focus:border-core-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-semibold text-core-muted">Заметка</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="необязательно"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-core-accent focus:ring-2 focus:ring-core-accent/20"
                  />
                </label>
                <div className="col-span-2 flex items-end sm:col-span-1">
                  <Button type="submit" className="w-full" disabled={!amount}>
                    <Icon name="plus" size={16} />
                    Добавить
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="rise-in" padded={false}>
              <div className="flex items-center justify-between p-5 pb-3">
                <SectionTitle title="Таблица транзакций" subtitle="последние 40 операций" />
                <div className="flex rounded-lg border border-black/10 p-0.5">
                  {([["all", "Все"], ["income", "Доходы"], ["expense", "Расходы"]] as const).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        filter === k ? "bg-core-accent text-white" : "text-core-muted hover:text-core-ink"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                {visibleTx.length === 0 ? (
                  <EmptyState
                    compact
                    title="Операций пока нет"
                    hint="Добавьте первую операцию через форму выше — статистика и графики заполнятся автоматически."
                  />
                ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-black/5 text-left text-xs text-core-muted">
                      <th className="px-5 py-2.5 font-medium">Дата</th>
                      <th className="px-3 py-2.5 font-medium">Категория</th>
                      <th className="px-3 py-2.5 font-medium">Заметка</th>
                      <th className="px-5 py-2.5 text-right font-medium">Сумма</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTx.map((t) => (
                      <tr key={t.id} className="border-b border-black/[0.04] transition-colors hover:bg-black/[0.02]">
                        <td className="whitespace-nowrap px-5 py-2.5 text-core-muted">{formatDateHuman(t.date)}</td>
                        <td className="px-3 py-2.5">
                          <Badge color={t.type === "income" ? "#34C77B" : "#4DA3FF"}>{t.category}</Badge>
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-core-muted">{t.note}</td>
                        <td className={`whitespace-nowrap px-5 py-2.5 text-right font-semibold tabular-nums ${
                          t.type === "income" ? "text-core-good" : "text-core-ink"
                        }`}>
                          {t.type === "income" ? "+" : "−"}{formatMoney(t.amount)}
                        </td>
                        <td className="pr-3">
                          <button
                            onClick={() => removeTransaction(t.id)}
                            className="rounded-lg p-1.5 text-core-muted transition-colors hover:bg-core-bad/10 hover:text-core-bad"
                            aria-label="Удалить"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </Card>
          </div>

          {/* Топ категорий */}
          <Card className="rise-in">
            <SectionTitle title="Топ расходов" subtitle="за текущий месяц" />
            {breakdown.length === 0 ? (
              <EmptyState
                compact
                title="Расходов пока нет"
                hint="Как только добавите первые траты, здесь появится разбивка по категориям."
              />
            ) : (
            <ul className="space-y-3">
              {breakdown.slice(0, 7).map((c, i) => {
                const max = breakdown[0]?.value ?? 1;
                return (
                  <li key={c.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="tabular-nums text-core-muted">{formatMoney(c.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.05]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(c.value / max) * 100}%`,
                          background: ["#4DA3FF", "#9B6BFF", "#34C77B", "#FFB020", "#FF5D73", "#5BC8F5", "#F28CB1"][i % 7],
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            )}
            {breakdown.length > 0 && (
            <div className="mt-5 rounded-lg bg-core-accent/[0.06] p-3.5 text-xs leading-relaxed text-core-muted">
              Совет: держите расходы на «Развлечения» в пределах 10% дохода — сейчас это{" "}
              {income
                ? Math.round(((breakdown.find((b) => b.name === "Развлечения")?.value ?? 0) / income) * 100)
                : 0}
              %.
            </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

