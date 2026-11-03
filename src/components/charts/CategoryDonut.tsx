import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const PALETTE = [
  "#4DA3FF",
  "#9B6BFF",
  "#34C77B",
  "#FFB020",
  "#FF5D73",
  "#5BC8F5",
  "#F28CB1",
];

type Props = {
  data: Array<{ name: string; value: number }>;
  height?: number;
};

/** Кольцевая диаграмма категорий */
export default function CategoryDonut({ data, height = 220 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 12px 24px -8px rgba(28,28,30,0.15)",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full shrink-0 space-y-2 sm:w-44">
        {data.slice(0, 6).map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-core-muted">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              {d.name}
            </span>
            <span className="font-medium">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
