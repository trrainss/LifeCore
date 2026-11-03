// Общие типы данных LifeCore

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerWeek: number; // целевое количество выполнений в неделю
  /** ISO-даты (YYYY-MM-DD) дней, когда привычка выполнена */
  completions: string[];
};

export type AntiHabit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** ISO-даты чистых дней (когда человек удержался) */
  cleanDays: string[];
  /** ISO-даты срывов */
  relapses: string[];
  record: number; // личный рекорд серии, дней
};

export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  priority: TaskPriority;
  due: string; // ISO-дата
  done: boolean;
  estimateMin: number; // оценка времени
  spentMin: number; // фактически сфокусировано
};

export type TxCategory =
  | "Продукты"
  | "Транспорт"
  | "Жильё"
  | "Коммуналка"
  | "Связь"
  | "Развлечения"
  | "Здоровье"
  | "Образование"
  | "Зарплата"
  | "Фриланс"
  | "Прочее";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: TxCategory;
  date: string; // ISO-дата
  note: string;
};

export type HealthLog = {
  date: string; // ISO-дата
  sleepHours: number;
  waterGlasses: number;
  steps: number;
  mood: 1 | 2 | 3 | 4 | 5; // 1 — плохо, 5 — отлично
};

export type Settings = {
  userName: string;
  dailyWaterGoal: number;
  dailyStepsGoal: number;
  sleepGoal: number;
};

export type AppState = {
  habits: Habit[];
  antiHabits: AntiHabit[];
  tasks: Task[];
  transactions: Transaction[];
  health: HealthLog[];
  settings: Settings;
};
