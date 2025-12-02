import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import { Search, Filter, Shield, Users2, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import { PieSentiment } from "../components/charts/PieSentiment";
import { TrendLine } from "../components/charts/TrendChart";
import { motion } from "framer-motion";
import GameDetail from "./GameDetail";

type Sentiment = "positive" | "neutral" | "negative";

type Row = {
  id: string;
  game: string;
  text: string;
  sentiment: Sentiment;
  timestamp?: string;

  user?: string;
  date?: string;
  helpful?: number;
  funny?: number;
};

const COLORS = ["#22c55e", "#94a3b8", "#ef4444"]; // pos / neu / neg
const CSV_PATH = "/dataset/steam_reviews_small.csv";

type GameRowForDetail = {
  game: string;
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  helpful_sum?: number;
  funny_sum?: number;
  positive_rate?: number;
};

const PAGE_SIZE = 10;

export default function EndUserView() {
  const [allReviews, setAllReviews] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameRowForDetail | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Papa.parse<Row>(CSV_PATH, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const rows = (res.data || [])
          .filter((r: any) => r?.text && r?.game)
          .map((r: any, idx: number) => ({
            id: r.id ?? String(idx + 1),
            game: String(r.game),
            text: String(r.text),
            sentiment: String(r.sentiment || "").toLowerCase() as Sentiment,
            timestamp: r.timestamp ? String(r.timestamp) : undefined,
          }));
        setAllReviews(rows);
      },
    });
  }, []);

  // reset page khi query hoặc dữ liệu đổi
  useEffect(() => {
    setPage(1);
  }, [query, allReviews.length]);

  const filteredReviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allReviews;
    return allReviews.filter((r) => r.game.toLowerCase().includes(q));
  }, [allReviews, query]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;

  // đảm bảo page không vượt quá totalPages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReviews = useMemo(
    () => filteredReviews.slice(startIndex, startIndex + PAGE_SIZE),
    [filteredReviews, startIndex]
  );

  const pieData = useMemo(() => {
    const cnt = { positive: 0, neutral: 0, negative: 0 };
    for (const r of allReviews) cnt[r.sentiment] = (cnt[r.sentiment] || 0) + 1;
    return [
      { name: "Positive", value: cnt.positive },
      { name: "Neutral", value: cnt.neutral },
      { name: "Negative", value: cnt.negative },
    ];
  }, [allReviews]);

  const trendData = useMemo(
    () => [
      { label: "Positive", value: allReviews.filter((r) => r.sentiment === "positive").length },
      { label: "Neutral", value: allReviews.filter((r) => r.sentiment === "neutral").length },
      { label: "Negative", value: allReviews.filter((r) => r.sentiment === "negative").length },
    ],
    [allReviews]
  );

  // Aggregate theo game cho GameDetail
  const gamesAgg = useMemo<GameRowForDetail[]>(() => {
    const map = new Map<string, GameRowForDetail>();

    for (const r of allReviews) {
      if (!map.has(r.game)) {
        map.set(r.game, {
          game: r.game,
          total_reviews: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          helpful_sum: 0,
          funny_sum: 0,
          positive_rate: 0,
        });
      }
      const g = map.get(r.game)!;
      g.total_reviews += 1;
      if (r.sentiment === "positive") g.positive += 1;
      else if (r.sentiment === "neutral") g.neutral += 1;
      else g.negative += 1;

      if (typeof r.helpful === "number") g.helpful_sum! += r.helpful;
      if (typeof r.funny === "number") g.funny_sum! += r.funny;
    }

    for (const g of map.values()) {
      g.positive_rate = g.total_reviews > 0 ? g.positive / g.total_reviews : 0;
    }

    return Array.from(map.values());
  }, [allReviews]);

  // Reviews theo game cho GameDetail
  const detailReviews = useMemo(() => {
    if (!selectedGame) return [];
    return allReviews
      .filter((r) => r.game === selectedGame.game)
      .map((r) => ({
        id: r.id,
        user: r.user ?? r.id,
        date: r.date ?? r.timestamp ?? "",
        text: r.text,
        sentiment: r.sentiment,
        helpful: r.helpful,
        funny: r.funny,
      }));
  }, [allReviews, selectedGame]);

  const overallPositive =
    allReviews.length > 0
      ? Math.round(
          (allReviews.filter((r) => r.sentiment === "positive").length / allReviews.length) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search game..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Button className="rounded-xl" variant="secondary">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard title="Overall Positive" value={`${overallPositive}%`} icon={LineChartIcon} />
        <StatCard
          title="Games in dataset"
          value={String(new Set(allReviews.map((r) => r.game)).size)}
          icon={Users2}
        />
        <StatCard title="Reviews Loaded" value={String(allReviews.length)} icon={Shield} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 rounded-2xl">
          <CardHeader>
            <CardTitle>Community Sentiment</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <PieSentiment data={pieData} colors={COLORS} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Sentiment Totals</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <TrendLine data={trendData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews with pagination */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paginatedReviews.map((r) => {
            const snippet =
              r.text.length > 280 ? r.text.slice(0, 280).trimEnd() + "…" : r.text;

            return (
              <motion.div
                key={r.id}
                onClick={() => {
                  const g = gamesAgg.find((g) => g.game === r.game);
                  if (g) setSelectedGame(g);
                }}
                className="flex items-start justify-between p-3 rounded-xl border cursor-pointer hover:bg-slate-50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">#{r.id}</span>
                    <span className="font-medium">{r.game}</span>
                    {r.timestamp && (
                      <span className="text-xs text-muted-foreground">• {r.timestamp}</span>
                    )}
                  </div>
                  <div className="text-sm">{snippet}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Click to view game details
                  </div>
                </div>
                <Badge
                  toneClassName={
                    r.sentiment === "positive"
                      ? "bg-green-100 text-green-700"
                      : r.sentiment === "neutral"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {r.sentiment}
                </Badge>
              </motion.div>
            );
          })}

          {filteredReviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews found.</p>
          )}

          {filteredReviews.length > 0 && (
            <div className="flex items-center justify-between pt-3 mt-1 border-t">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                {filteredReviews.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(
                      startIndex + PAGE_SIZE,
                      filteredReviews.length
                    )}`}{" "}
                of {filteredReviews.length} reviews
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
        </CardContent>
      </Card>

      {selectedGame && (
        <GameDetail
          game={selectedGame}
          reviews={detailReviews}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}