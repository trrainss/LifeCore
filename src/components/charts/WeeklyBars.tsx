import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  data: Array<{ day: string; value: number }>;
  color?: string;
  height?: number;
};

/** Столбчатый график за неделю с мягкими скруглениями */
export default function WeeklyBars({
  data,
  color = "#4DA3FF",
  height = 180,
}: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#7a7a80", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, max]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#7a7a80", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(28,28,30,0.04)" }}
          contentStyle={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 12px 24px -8px rgba(28,28,30,0.15)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={26}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? color : `${color}66`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
