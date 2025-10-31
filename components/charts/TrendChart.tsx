import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export function TrendLine({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <RTooltip />
        <Legend />
        <Line type="monotone" dataKey="pos" name="Positive" stroke="#16a34a" strokeWidth={2} />
        <Line type="monotone" dataKey="neu" name="Neutral" stroke="#eab308" strokeWidth={2} />
        <Line type="monotone" dataKey="neg" name="Negative" stroke="#dc2626" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendBar({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <RTooltip />
        <Legend />
        <Bar dataKey="pos" name="Positive" fill="#16a34a" />
        <Bar dataKey="neu" name="Neutral" fill="#eab308" />
        <Bar dataKey="neg" name="Negative" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}
