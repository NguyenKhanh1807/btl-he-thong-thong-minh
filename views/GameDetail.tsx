// src/views/GameDetail.tsx
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
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
const PAGE_SIZE = 10;

export default function GameDetail({
  game,
  reviews,
  onClose,
}: {
  game: GameRow | null;
  reviews: Review[];
  onClose: () => void;
}) {
  if (!game) return null;

  const [localReviews, setLocalReviews] = useState<Review[]>(reviews || []);
  const [page, setPage] = useState(1);

  // đồng bộ lại khi props reviews thay đổi (phòng trường hợp reuse component)
  useEffect(() => {
    setLocalReviews(reviews || []);
    setPage(1);
  }, [reviews]);

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

  // Trend thật: group reviews theo tháng dựa trên field date
  const monthlyTrend = useMemo(() => {
    if (!localReviews.length) return [];

    const counter = new Map<string, number>();

    for (const r of localReviews) {
      if (!r.date) continue;
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`; // YYYY-MM
      counter.set(key, (counter.get(key) ?? 0) + 1);
    }

    const labels = Array.from(counter.keys()).sort();
    return labels.map((label) => ({
      month: label,
      reviews: counter.get(label)!,
    }));
  }, [localReviews]);

  const totalReviews = game.total_reviews || localReviews.length;
  const positivePct = game.positive_rate
    ? Math.round((game.positive_rate || 0) * 100)
    : Math.round(((game.positive || 0) / Math.max(1, totalReviews)) * 100);

  // pagination cho reviews
  const totalPages = Math.max(
    1,
    Math.ceil(localReviews.length / PAGE_SIZE || 1)
  );
  const startIndex = (page - 1) * PAGE_SIZE;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageReviews = useMemo(
    () => localReviews.slice(startIndex, startIndex + PAGE_SIZE),
    [localReviews, startIndex]
  );

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
              {game.platform ?? "N/A"} • {game.genre ?? "N/A"} • Provider:{" "}
              {game.provider ?? "—"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-slate-50 text-sm">
                Total reviews: {totalReviews.toLocaleString()}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-50 text-sm">
                Positive: {positivePct}%
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-50 text-sm">
                Helpful votes: {game.helpful_sum ?? 0}
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
                <CardTitle>Reviews trend (by month)</CardTitle>
              </CardHeader>
              <CardContent style={{ height: 240 }}>
                {monthlyTrend.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Not enough date information to build a trend.
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews list + pagination */}
          <Card className="rounded-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Player reviews ({localReviews.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setLocalReviews([])}>
                  Clear
                </Button>
                <Button onClick={exportReviewsCSV}>Export</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {pageReviews.map((r) => (
                  <div key={r.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {r.user} • {r.date || "N/A"}
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

                        {/* Report to Admin (đơn giản, không giả lập data) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const message = window.prompt(
                              "Please enter your report message (optional):"
                            );
                            if (message && message.trim()) {
                              alert(
                                `Report submitted for review ID ${r.id}: ${message}`
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

                {localReviews.length > 0 && (
                  <div className="flex items-center justify-between pt-3 mt-1 border-t">
                    <p className="text-xs text-muted-foreground">
                      Showing{" "}
                      {`${startIndex + 1}–${Math.min(
                        startIndex + PAGE_SIZE,
                        localReviews.length
                      )}`}{" "}
                      of {localReviews.length} reviews
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 rounded-full"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 rounded-full"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
