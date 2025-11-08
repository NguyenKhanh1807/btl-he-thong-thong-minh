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

type Sentiment = "positive" | "neutral" | "negative";
type Row = {
  id: string;
  game: string;
  text: string;
  sentiment: Sentiment;
  timestamp?: string;
};

const COLORS = ["#22c55e", "#94a3b8", "#ef4444"]; // pos / neu / neg
const CSV_PATH = "/dataset/steam_reviews_small.csv";

export default function EndUserView() {
  const [allReviews, setAllReviews] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

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

  const reviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allReviews.slice(0, 50);
    return allReviews.filter((r) => r.game.toLowerCase().includes(q)).slice(0, 50);
  }, [allReviews, query]);

  const pieData = useMemo(() => {
    const cnt = { positive: 0, neutral: 0, negative: 0 };
    for (const r of allReviews) cnt[r.sentiment] = (cnt[r.sentiment] || 0) + 1;
    return [
      { name: "Positive", value: cnt.positive },
      { name: "Neutral", value: cnt.neutral },
      { name: "Negative", value: cnt.negative },
    ];
  }, [allReviews]);

  // trend demo: gom theo sentiment (nếu muốn theo tuần, dùng dayjs/Date để group theo ISO week)
  const trendData = useMemo(
    () => [
      { label: "Positive", value: allReviews.filter((r) => r.sentiment === "positive").length },
      { label: "Neutral", value: allReviews.filter((r) => r.sentiment === "neutral").length },
      { label: "Negative", value: allReviews.filter((r) => r.sentiment === "negative").length },
    ],
    [allReviews]
  );

  const overallPositive =
    allReviews.length > 0 ? Math.round((allReviews.filter((r) => r.sentiment === "positive").length / allReviews.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search game..." className="pl-9 rounded-xl" />
        </div>
        <Button className="rounded-xl" variant="secondary">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard title="Overall Positive" value={`${overallPositive}%`} icon={LineChartIcon} />
        <StatCard title="Games in dataset" value={String(new Set(allReviews.map((r) => r.game)).size)} icon={Users2} />
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between p-3 rounded-xl border">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  {r.id} → <span className="font-medium">{r.game}</span>
                </div>
                <div className="text-sm">{r.text}</div>
              </div>
              <Badge
                toneClassName={
                  r.sentiment === "positive" ? "bg-green-100 text-green-700" : r.sentiment === "neutral" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }
              >
                {r.sentiment}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
