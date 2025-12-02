import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";
import { StatCard } from "../components/StatCard";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

type GameRow = {
  game: string;
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  platform?: string;
  genre?: string;
};

type ProviderInfo = {
  id: string;
  name: string;
  contact: string;
  country: string;
  status: string;
  revenue: number;
  totalGames: number;
  games?: GameRow[];
};

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function ProviderDetail({
  provider,
  onClose,
}: {
  provider: ProviderInfo | null;
  onClose: () => void;
}) {
  if (!provider) return null;

  const games = provider.games || [];
  const totalReviews = games.reduce((s, g) => s + (g.total_reviews || 0), 0);
  const totalPositive = games.reduce((s, g) => s + (g.positive || 0), 0);
  const overallPositiveRate = totalReviews
    ? Math.round((totalPositive / totalReviews) * 100)
    : 0;

  const sentiment = useMemo(() => {
    const pos = games.reduce((s, g) => s + (g.positive || 0), 0);
    const neu = games.reduce((s, g) => s + (g.neutral || 0), 0);
    const neg = games.reduce((s, g) => s + (g.negative || 0), 0);
    return [
      { name: "Positive", value: pos },
      { name: "Neutral", value: neu },
      { name: "Negative", value: neg },
    ];
  }, [games]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-auto"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">{provider.name}</h3>
            <div className="text-sm text-slate-500">
              {provider.contact} • {provider.country}
            </div>
            <div className="mt-2 text-sm">
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  provider.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {provider.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => alert("Trigger payout / message provider")}>
              Message / Payout
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Games" value={String(provider.totalGames)} />
            <StatCard title="Total Reviews" value={String(totalReviews)} />
            <StatCard title="Avg Positive" value={`${overallPositiveRate}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-2xl col-span-2">
              <CardHeader>
                <CardTitle>Games (by reviews)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">Game</th>
                        <th>Platform</th>
                        <th>Genre</th>
                        <th>Positive</th>
                        <th>Negative</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((g) => (
                        <tr key={g.game} className="border-t">
                          <td className="py-2 font-medium">{g.game}</td>
                          <td>{g.platform}</td>
                          <td>{g.genre}</td>
                          <td className="text-green-700">{g.positive}</td>
                          <td className="text-red-700">{g.negative}</td>
                          <td>{g.total_reviews}</td>
                          <td className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                alert(`Open game detail for ${g.game}`)
                              }
                            >
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => alert(`Flag ${g.game}`)}
                            >
                              Flag
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Sentiment</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentiment}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      label
                    >
                      {sentiment.map((s, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Feedback (sample)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mocked items — replace with real feed */}
                <div className="p-3 border rounded">
                  <div className="text-sm text-slate-500">
                    Mythic Quest • @player1 • 2025-11-08
                  </div>
                  <div className="mt-1">
                    Love the new raid event but matchmaking is slow.
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost">
                      Mark Positive
                    </Button>
                    <Button size="sm" variant="destructive">
                      Mark Negative
                    </Button>
                    <Button size="sm" variant="outline">
                      Create Ticket
                    </Button>
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-slate-500">
                    Sky Raiders • @pilot99 • 2025-11-07
                  </div>
                  <div className="mt-1">
                    Game crashes after 10 minutes on my PC.
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost">
                      Mark Positive
                    </Button>
                    <Button size="sm" variant="destructive">
                      Mark Negative
                    </Button>
                    <Button size="sm" variant="outline">
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
