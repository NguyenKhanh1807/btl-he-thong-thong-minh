import { PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer } from "recharts";

interface PieSentimentProps {
  data: { name: string; value: number }[];
  colors: string[];
}

export function PieSentiment({ data, colors }: PieSentimentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <RTooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
