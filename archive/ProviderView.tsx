import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "../components/StatCard";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import GameDetail from "./GameDetail";

type Row = {
  game: string;
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  helpful_sum: number;
  funny_sum: number;
  positive_rate: number;
  platform: string;
  genre: string;
};

const COLORS = ["#2B6CB0", "#4FD1C5", "#63B3ED", "#805AD5", "#F6AD55"];

const MOCK_ROWS: Row[] = [
  {
    game: "Mythic Quest",
    total_reviews: 18000,
    positive: 13000,
    neutral: 3000,
    negative: 2000,
    helpful_sum: 4500,
    funny_sum: 800,
    positive_rate: 0.72,
    platform: "PC",
    genre: "RPG",
  },
  {
    game: "Hero Clash",
    total_reviews: 12500,
    positive: 9000,
    neutral: 2500,
    negative: 1000,
    helpful_sum: 2700,
    funny_sum: 600,
    positive_rate: 0.76,
    platform: "Android",
    genre: "Action",
  },
  {
    game: "Farm Town",
    total_reviews: 8700,
    positive: 6400,
    neutral: 1500,
    negative: 800,
    helpful_sum: 1200,
    funny_sum: 300,
    positive_rate: 0.74,
    platform: "iOS",
    genre: "Simulation",
  },
  {
    game: "Puzzle Land",
    total_reviews: 6400,
    positive: 4500,
    neutral: 1100,
    negative: 800,
    helpful_sum: 1100,
    funny_sum: 200,
    positive_rate: 0.7,
    platform: "Android",
    genre: "Puzzle",
  },
  {
    game: "Sky Raiders",
    total_reviews: 22000,
    positive: 19000,
    neutral: 2000,
    negative: 1000,
    helpful_sum: 6700,
    funny_sum: 900,
    positive_rate: 0.86,
    platform: "PC",
    genre: "Shooter",
  },
  {
    game: "Zombie March",
    total_reviews: 15800,
    positive: 11000,
    neutral: 3200,
    negative: 1600,
    helpful_sum: 2300,
    funny_sum: 400,
    positive_rate: 0.7,
    platform: "Android",
    genre: "Horror",
  },
  {
    game: "Fantasy League",
    total_reviews: 21000,
    positive: 18000,
    neutral: 2000,
    negative: 1000,
    helpful_sum: 4800,
    funny_sum: 500,
    positive_rate: 0.85,
    platform: "iOS",
    genre: "RPG",
  },
  {
    game: "Drift Max",
    total_reviews: 9400,
    positive: 7400,
    neutral: 1300,
    negative: 700,
    helpful_sum: 1400,
    funny_sum: 250,
    positive_rate: 0.78,
    platform: "PC",
    genre: "Racing",
  },
  {
    game: "Chess Arena",
    total_reviews: 3100,
    positive: 2300,
    neutral: 500,
    negative: 300,
    helpful_sum: 400,
    funny_sum: 100,
    positive_rate: 0.74,
    platform: "Web",
    genre: "Board",
  },
  {
    game: "PixelCraft",
    total_reviews: 5400,
    positive: 4300,
    neutral: 600,
    negative: 500,
    helpful_sum: 1000,
    funny_sum: 200,
    positive_rate: 0.8,
    platform: "PC",
    genre: "Sandbox",
  },
];

export default function ProviderView() {
  const [rows, setRows] = useState<Row[]>(MOCK_ROWS);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [minReviews, setMinReviews] = useState<number>(0);
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [openGame, setOpenGame] = useState<any>(null);

  // KPI
  const overallPositive = useMemo(() => {
    const tot = rows.reduce((s, r) => s + r.total_reviews, 0);
    const pos = rows.reduce((s, r) => s + r.positive, 0);
    return tot > 0 ? Math.round((pos / tot) * 100) : 0;
  }, [rows]);

  const helpfulSum = rows.reduce((s, r) => s + r.helpful_sum, 0);
  const titlesCount = rows.length;

  const platforms = [
    "All",
    ...Array.from(new Set(rows.map((r) => r.platform))),
  ];
  const top10 = useMemo(
    () =>
      [...rows].sort((a, b) => b.total_reviews - a.total_reviews).slice(0, 10),
    [rows]
  );

  const sentimentAgg = useMemo(() => {
    const pos = rows.reduce((s, r) => s + r.positive, 0);
    const neu = rows.reduce((s, r) => s + r.neutral, 0);
    const neg = rows.reduce((s, r) => s + r.negative, 0);
    return [
      { name: "Positive", value: pos },
      { name: "Neutral", value: neu },
      { name: "Negative", value: neg },
    ];
  }, [rows]);

  const monthlyTrend = [
    { month: "Jun", reviews: 42000 },
    { month: "Jul", reviews: 46000 },
    { month: "Aug", reviews: 44000 },
    { month: "Sep", reviews: 47000 },
    { month: "Oct", reviews: 50000 },
    { month: "Nov", reviews: 53000 },
  ];

  const filtered = rows
    .filter((r) => r.total_reviews >= minReviews)
    .filter((r) =>
      platformFilter === "All" ? true : r.platform === platformFilter
    )
    .filter((r) =>
      query ? r.game.toLowerCase().includes(query.toLowerCase()) : true
    );

  const toggleStar = (game: string) => {
    setStarred((s) => ({ ...s, [game]: !s[game] }));
  };

  const increasePositives = (game: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.game === game
          ? {
              ...r,
              positive: r.positive + 1,
              total_reviews: r.total_reviews + 1,
            }
          : r
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Positive % (All Titles)"
          value={`${overallPositive}%`}
        />
        <StatCard title="Titles in Dataset" value={String(titlesCount)} />
        <StatCard title="Helpful Votes (sum)" value={String(helpfulSum)} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <input
          placeholder="Search games..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        />
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={minReviews}
          onChange={(e) => setMinReviews(Number(e.target.value))}
          className="px-3 py-2 border rounded-md text-sm w-32"
          placeholder="Min reviews"
        />
        <Button
          variant="secondary"
          className="rounded-xl"
          onClick={() => {
            setQuery("");
            setPlatformFilter("All");
            setMinReviews(0);
          }}
        >
          Reset
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Top 10 Games by Total Reviews</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" hide />
                <YAxis />
                <RTooltip />
                <Legend />
                <Bar
                  dataKey="total_reviews"
                  name="Total Reviews"
                  fill="#3b82f6"
                />
                <Bar dataKey="positive" name="Positive" fill="#22c55e" />
                <Bar dataKey="negative" name="Negative" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentAgg}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  label
                >
                  {sentimentAgg.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Line trend */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Total Reviews Trend (6 months)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RTooltip />
              <Line
                type="monotone"
                dataKey="reviews"
                stroke="#2B6CB0"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
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
                  <th>Platform</th>
                  <th>Genre</th>
                  <th>Positive</th>
                  <th>Neutral</th>
                  <th>Negative</th>
                  <th>Total</th>
                  <th>Positive rate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.game} className="border-t">
                    <td className="py-2 font-medium flex items-center gap-2">
                      <button
                        onClick={() => toggleStar(row.game)}
                        className="text-xs px-2 py-1 rounded-md bg-slate-100"
                      >
                        {starred[row.game] ? "★" : "☆"}
                      </button>
                      {row.game}
                    </td>
                    <td>{row.platform}</td>
                    <td>{row.genre}</td>
                    <td className="text-green-700">{row.positive}</td>
                    <td className="text-yellow-700">{row.neutral}</td>
                    <td className="text-red-700">{row.negative}</td>
                    <td>{row.total_reviews}</td>
                    <td>{Math.round(row.positive_rate * 100)}%</td>
                    <td className="flex gap-2">
                      {/* <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => increasePositives(row.game)}
                      >
                        +1 Positive
                      </Button> */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setOpenGame({
                            id: "prov-001",
                            name: row.game.includes("Mythic")
                              ? "Lunar Games"
                              : "Default Provider",
                            contact: "contact@provider.example",
                            country: "VN",
                            status: "Active",
                            revenue: Math.round(row.total_reviews * 0.12),
                            games: filtered
                              .filter((g) => g.platform === row.platform)
                              .slice(0, 20),
                          })
                        }
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal detail */}
      {openGame && (
        <GameDetail game={openGame} onClose={() => setOpenGame(null)} />
      )}
    </div>
  );
}
