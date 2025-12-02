// src/views/GameDetail.tsx
import Papa from "papaparse";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
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

type GameRow = {
  game: string;
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  helpful_sum?: number;
  funny_sum?: number;
  positive_rate?: number; // 0..1
  platform?: string;
  genre?: string;
  provider?: string;
};

type Review = {
  id: string;
  user: string;
  date: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  helpful?: number;
  funny?: number;
};

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const MOCK_GAME: GameRow = {
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
  provider: "Lunar Games",
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    user: "player1",
    date: "2025-11-08",
    text: "Love the new raid but matchmaking is slow.",
    sentiment: "negative",
    helpful: 12,
  },
  {
    id: "r2",
    user: "player2",
    date: "2025-11-07",
    text: "Great visuals and story.",
    sentiment: "positive",
    helpful: 5,
  },
  {
    id: "r3",
    user: "player3",
    date: "2025-11-06",
    text: "Crashes occasionally on my laptop.",
    sentiment: "negative",
    helpful: 2,
  },
  {
    id: "r4",
    user: "player4",
    date: "2025-11-05",
    text: "Balance feels better after patch.",
    sentiment: "positive",
    helpful: 4,
  },
  {
    id: "r5",
    user: "player5",
    date: "2025-11-04",
    text: "Some UI parts are confusing.",
    sentiment: "neutral",
    helpful: 1,
  },
];

export default function GameDetail({
  game,
  reviews,
  onClose,
}: {
  game?: GameRow | null;
  reviews?: Review[];
  onClose: () => void;
}) {
  if (!game) return null;

  const sentimentAgg = useMemo(() => {
    const pos = game.positive || 0;
    const neu = game.neutral || 0;
    const neg = game.negative || 0;
    return [
      { name: "Positive", value: pos },
      { name: "Neutral", value: neu },
      { name: "Negative", value: neg },
    ];
  }, [game]);

  // Fake 6-month trend (you can replace with real monthly data)
  const monthlyTrend = useMemo(() => {
    // produce synthetic months proportional to total_reviews
    const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    const base = Math.max(1, Math.round((game.total_reviews || 1000) / 6));
    return months.map((m, i) => ({
      month: m,
      reviews: Math.round(base * (0.7 + i * 0.1)),
    }));
  }, [game]);

  const [localReviews, setLocalReviews] = useState<Review[]>(
    reviews || MOCK_REVIEWS
  );
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const totalReviews = game.total_reviews || localReviews.length;
  const positivePct = game.positive_rate
    ? Math.round((game.positive_rate || 0) * 100)
    : Math.round(((game.positive || 0) / Math.max(1, totalReviews)) * 100);

  function markReviewSentiment(id: string, sentiment: Review["sentiment"]) {
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sentiment } : r))
    );
  }

  function exportReviewsCSV() {
    const csv = Papa.unparse(localReviews);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(game?.game || "game").replace(/\s+/g, "_")}_reviews.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-auto"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">{game.game}</h2>
            <div className="text-sm text-muted-foreground">
              {game.platform} • {game.genre} • Provider: {game.provider ?? "—"}
            </div>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-1 rounded-full bg-slate-50 text-sm">
                Total reviews: {totalReviews.toLocaleString()}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-50 text-sm">
                Positive: {positivePct}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={exportReviewsCSV}>Export reviews</Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total reviews" value={String(totalReviews)} />
            <StatCard title="Positive %" value={`${positivePct}%`} />
            <StatCard
              title="Helpful votes"
              value={String(game.helpful_sum ?? 0)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sentiment Pie */}
            <Card className="rounded-2xl col-span-1">
              <CardHeader>
                <CardTitle>Sentiment distribution</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentAgg}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={90}
                      label
                    >
                      {sentimentAgg.map((s, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend */}
            <Card className="rounded-2xl col-span-2">
              <CardHeader>
                <CardTitle>Reviews trend (6 months)</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 240 }}>
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
          </div>

          {/* Recent reviews */}
          <Card className="rounded-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Un Marked ({localReviews.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setLocalReviews([])}>
                  Clear
                </Button>
                <Button onClick={exportReviewsCSV}>Export</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {localReviews.map((r) => (
                  <div key={r.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {r.user} • {r.date}
                        </div>
                        <div className="mt-1 text-slate-800">{r.text}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            r.sentiment === "positive"
                              ? "bg-green-50 text-green-700"
                              : r.sentiment === "negative"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {r.sentiment}
                        </div>

                        {/* Action Report to Admin */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(r);
                            setReportDialogOpen(true);
                            const message = window.prompt(
                              "Please enter your report message:"
                            );
                            if (message) {
                              setReportMessage(message);
                              handleReportSubmission(r.id, message);
                            }

                            function handleReportSubmission(
                              id: string,
                              message: string
                            ) {
                              alert(
                                `Report submitted for review ID ${id}: ${message}`
                              );
                            }
                          }}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Report to Admin
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {localReviews.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No reviews available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report to Admin Dialog */}
      </div>
    </div>
  );
}

/*
Usage notes:

- Import and render as modal when user clicks a game:
  import GameDetail from "./GameDetail";
  const [openGame, setOpenGame] = useState<GameRow | null>(null);

  <Button onClick={() => setOpenGame(myGame)}>Details</Button>
  {openGame && <GameDetail game={openGame} reviews={someReviews} onClose={() => setOpenGame(null)} />}

- If you want a route page, render <GameDetail game={...} reviews={...} onClose={() => history.back()} />.

- Replace MOCK data with real API data for production.
*/
