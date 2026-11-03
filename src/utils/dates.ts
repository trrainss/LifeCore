// Утилиты для работы с датами (ISO YYYY-MM-DD)

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISO(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Последние n дней, от старых к новым. Включая сегодня. */
export function lastNDays(n: number, end: string = today()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export function weekdayShort(iso: string): string {
  const names = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return names[new Date(iso + "T00:00:00").getDay()];
}

export function formatDateHuman(iso: string): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("ru-BY", {
    style: "currency",
    currency: "BYN",
    maximumFractionDigits: 2,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ru-BY").format(n);
}

/** Склонение: plural(5, ["день", "дня", "дней"]) */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}
