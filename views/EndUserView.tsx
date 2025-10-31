import * as React from "react";
import { useMemo, useState } from "react";
import { Search, Filter, Shield, Users2, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import { PieSentiment } from "../components/charts/PieSentiment";
import { TrendLine } from "../components/charts/TrendChart";
import { motion } from "framer-motion";
import { pieData, COLORS, trendData, latestReviews } from "../data/mock";

export default function EndUserView() {
  const [query, setQuery] = useState("");
  const reviews = useMemo(() => {
    if (!query) return latestReviews;
    return latestReviews.filter((r) => r.game.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

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
        <StatCard title="Overall Positive" value="63%" icon={LineChartIcon} />
        <StatCard title="Average Rating" value="4.2 / 5" icon={Users2} />
        <StatCard title="Reviews Analyzed" value="12,845" icon={Shield} />
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
            <CardTitle>Sentiment Trend (Weekly)</CardTitle>
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
                  {r.user} → <span className="font-medium">{r.game}</span>
                </div>
                <div className="text-sm">{r.text}</div>
              </div>
              <Badge
                toneClassName={
                  r.sentiment === "Positive" ? "bg-green-100 text-green-700" : r.sentiment === "Neutral" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
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
