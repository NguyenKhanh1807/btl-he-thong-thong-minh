import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Filter, Download } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { TrendBar } from "../components/charts/TrendChart";
import { trendData, tableData } from "../data/mock";

export default function ProviderView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Positive % (All Titles)" value="64%" />
        <StatCard title="Titles Watched" value="148" />
        <StatCard title="Reports this Month" value="12" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sentiment Trend by Week</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <TrendBar data={trendData} />
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
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.game} className="border-t">
                    <td className="py-2 font-medium">{row.game}</td>
                    <td className="text-green-700">{row.positive}%</td>
                    <td className="text-yellow-700">{row.neutral}%</td>
                    <td className="text-red-700">{row.negative}%</td>
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
