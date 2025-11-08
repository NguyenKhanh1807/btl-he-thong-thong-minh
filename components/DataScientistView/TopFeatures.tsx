import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  Bar,
} from "recharts";

type Item = { term: string; weight: number; polarity: "pos" | "neg" };

function parseTopFeatures(raw: string): Item[] {
  // Hỗ trợ các format phổ biến:
  // - có tiêu đề: "Top positive features:" / "Top negative features:"
  // - mỗi dòng: "token,weight" | "token\tweight" | "token weight" | "token: weight" | "1) token (0.123)"
  const items: Item[] = [];
  let section: "pos" | "neg" | null = null;

  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  for (let ln of lines) {
    if (/^top positive/i.test(ln)) { section = "pos"; continue; }
    if (/^top negative/i.test(ln)) { section = "neg"; continue; }

    // strip số thứ tự & ngoặc
    ln = ln.replace(/^\d+\)\s*/, "").replace(/[()]/g, "");

    // tách "term,weight" / "term\tweight" / "term: weight" / "term weight"
    const m = ln.match(/^([^,;\t:]+)[,;\t:\s]+(-?\d+(\.\d+)?(?:e-?\d+)?)$/i);
    if (m) {
      const term = m[1].trim();
      const w = Number(m[2]);
      if (term && Number.isFinite(w)) {
        const pol: "pos" | "neg" = section ?? (w >= 0 ? "pos" : "neg");
        items.push({ term, weight: w, polarity: pol });
      }
      continue;
    }
  }
  // unique theo term+polarity, lấy weight lớn nhất theo absolute
  const map = new Map<string, Item>();
  for (const it of items) {
    const k = `${it.term}::${it.polarity}`;
    const prev = map.get(k);
    if (!prev || Math.abs(it.weight) > Math.abs(prev.weight)) map.set(k, it);
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
}

function tone(weight: number, pol: "pos" | "neg") {
  if (pol === "pos") {
    return weight > 0.75 ? "bg-green-200" : weight > 0.4 ? "bg-green-100" : "bg-green-50";
  }
  return Math.abs(weight) > 0.75 ? "bg-red-200" : Math.abs(weight) > 0.4 ? "bg-red-100" : "bg-red-50";
}

export default function TopFeatures({ source = "/svm/outputs/top_features.txt" }: { source?: string }) {
  const [raw, setRaw] = React.useState<string>("");
  const [q, setQ] = React.useState("");
  const [topN, setTopN] = React.useState(20);
  const [tab, setTab] = React.useState<"bars" | "chips">("bars");

  React.useEffect(() => {
    fetch(source).then((r) => r.ok ? r.text() : "").then(setRaw).catch(() => setRaw(""));
  }, [source]);

  const all = React.useMemo(() => (raw ? parseTopFeatures(raw) : []), [raw]);

  const pos = React.useMemo(
    () => all.filter((x) => x.polarity === "pos"),
    [all]
  );
  const neg = React.useMemo(
    () => all.filter((x) => x.polarity === "neg"),
    [all]
  );

  const filteredPos = React.useMemo(
    () => pos.filter((x) => (q ? x.term.toLowerCase().includes(q.toLowerCase()) : true)).slice(0, topN),
    [pos, q, topN]
  );
  const filteredNeg = React.useMemo(
    () => neg.filter((x) => (q ? x.term.toLowerCase().includes(q.toLowerCase()) : true)).slice(0, topN),
    [neg, q, topN]
  );

  // dữ liệu cho bar chart
  const posData = filteredPos.map((x) => ({ term: x.term, weight: Number(Math.abs(x.weight).toFixed(4)) }));
  const negData = filteredNeg.map((x) => ({ term: x.term, weight: Number(Math.abs(x.weight).toFixed(4)) }));

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Top Features</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search term…"
            className="h-9 rounded-lg w-44"
          />
          <select
            className="h-9 rounded-lg border px-2 text-sm"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            {[10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>Top {n}</option>
            ))}
          </select>
          <Button variant="secondary" className="h-9 rounded-lg px-3 text-xs" onClick={() => setTab(tab === "bars" ? "chips" : "bars")}>
            {tab === "bars" ? "Chips view" : "Bars view"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {tab === "bars" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px]">
              <div className="font-medium mb-2">Positive</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={posData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" hide />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="weight" name="Weight" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-muted-foreground">Showing {filteredPos.length} terms</div>
            </div>

            <div className="h-[320px]">
              <div className="font-medium mb-2">Negative</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={negData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" hide />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="weight" name="Weight" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-muted-foreground">Showing {filteredNeg.length} terms</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="font-medium mb-2">Positive</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredPos.map((x, i) => (
                  <div
                    key={`p-${i}`}
                    className={`text-xs px-2 py-1 rounded-lg border ${tone(x.weight, "pos")} flex items-center justify-between`}
                  >
                    <span className="truncate">{x.term}</span>
                    <span className="ml-2 text-muted-foreground">{x.weight.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Negative</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredNeg.map((x, i) => (
                  <div
                    key={`n-${i}`}
                    className={`text-xs px-2 py-1 rounded-lg border ${tone(x.weight, "neg")} flex items-center justify-between`}
                  >
                    <span className="truncate">{x.term}</span>
                    <span className="ml-2 text-muted-foreground">{Math.abs(x.weight).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Xuất CSV nhanh */}
        <div className="border-t pt-4 mt-6 flex justify-end">
            <Button
                variant="secondary"
                className="h-9 rounded-lg px-3 text-xs"
                onClick={() => {
                const rows = [["polarity","term","weight"], ...all.map(x => [x.polarity, x.term, x.weight])];
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "top_features.csv"; a.click();
                URL.revokeObjectURL(url);
                }}
            >
                Export CSV
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
