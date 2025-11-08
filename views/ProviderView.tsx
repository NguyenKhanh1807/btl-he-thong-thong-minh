import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Filter, Download } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend, Bar } from "recharts";

type Row = {
  game: string;
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  helpful_sum: number;
  funny_sum: number;
  positive_rate: number;
};

const CSV_PATH = "/dataset/provider_agg.csv";

export default function ProviderView() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    Papa.parse<Row>(CSV_PATH, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => setRows((r.data as any[]).filter((x) => x?.game)),
    });
  }, []);

  const overallPositive = useMemo(() => {
    const tot = rows.reduce((s, r) => s + (r.total_reviews || 0), 0);
    const pos = rows.reduce((s, r) => s + (r.positive || 0), 0);
    return tot > 0 ? Math.round((pos / tot) * 100) : 0;
  }, [rows]);

  const titlesCount = rows.length;
  const reportsThisMonth = rows.reduce((s, r) => s + (r.helpful_sum || 0), 0); // demo

  const top10 = useMemo(() => [...rows].sort((a, b) => b.total_reviews - a.total_reviews).slice(0, 10), [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Positive % (All Titles)" value={`${overallPositive}%`} />
        <StatCard title="Titles in Dataset" value={String(titlesCount)} />
        <StatCard title="Helpful Votes (sum)" value={String(reportsThisMonth)} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top 10 Games by Total Reviews</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button className="rounded-xl" onClick={() => window.open(CSV_PATH, "_blank")}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" hide />
              <YAxis />
              <RTooltip />
              <Legend />
              <Bar dataKey="total_reviews" name="Total Reviews" fill="#3b82f6" />
              <Bar dataKey="positive" name="Positive" fill="#22c55e" />
              <Bar dataKey="negative" name="Negative" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Titles – Sentiment Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Game</th>
                  <th>Positive</th>
                  <th>Neutral</th>
                  <th>Negative</th>
                  <th>Total</th>
                  <th>Positive rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row) => (
                  <tr key={row.game} className="border-t">
                    <td className="py-2 font-medium">{row.game}</td>
                    <td className="text-green-700">{row.positive}</td>
                    <td className="text-yellow-700">{row.neutral}</td>
                    <td className="text-red-700">{row.negative}</td>
                    <td>{row.total_reviews}</td>
                    <td>{Math.round((row.positive_rate || 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
