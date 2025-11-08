import * as React from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend, Bar,
} from "recharts";
import { Input } from "../ui/input";

type Row = { text: string; pred?: number | string; proba_pos?: number | string; proba_neg?: number | string };

function PredictText({ text, className = "" }: { text: string; className?: string }) {
  // highlight vài từ điển hình (bạn có thể thay bằng top-features)
  const splitRegex = /(amazing|awesome|love|great|excellent|bug|boring|terrible|bad|crash|lag)/gi;
  const testRegex = /(amazing|awesome|love|great|excellent|bug|boring|terrible|bad|crash|lag)/i;

  const [expanded, setExpanded] = React.useState(false);
  const parts = (text ?? "").split(splitRegex);

  return (
    <div className={className}>
      <p className={expanded ? "" : "line-clamp-3"}>
        {parts.map((p, i) =>
          testRegex.test(p) ? (
            <mark key={i} className="rounded px-1 bg-amber-100/70 ring-1 ring-amber-200">
              {p}
            </mark>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </p>
      {text && text.length > 140 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-slate-500 hover:text-slate-700"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function BatchPredictSummary({ csvUrl = "/svm/outputs/predictions_new.csv" }: { csvUrl?: string }) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [label, setLabel] = React.useState<"all" | "pos" | "neg">("all");
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const data = (res.data as any[])
          .filter((r) => r?.text !== undefined)
          .map((r) => ({
            text: String(r.text ?? ""),
            pred: typeof r.pred === "string" ? Number(r.pred) : r.pred,
            proba_pos: typeof r.proba_pos === "string" ? Number(r.proba_pos) : r.proba_pos,
            proba_neg: typeof r.proba_neg === "string" ? Number(r.proba_neg) : r.proba_neg,
          }));
        setRows(data);
      },
    });
  }, [csvUrl]);

  const counts = React.useMemo(() => {
    const pos = rows.filter((r) => Number(r.pred) === 1).length;
    const neg = rows.filter((r) => Number(r.pred) === 0).length;
    return { pos, neg };
  }, [rows]);

  const dataBar = React.useMemo(
    () => [
      { label: "Positive", value: counts.pos },
      { label: "Negative", value: counts.neg },
    ],
    [counts]
  );

  const filtered = React.useMemo(() => {
    const a = rows.filter((r) =>
      (label === "all" ||
        (label === "pos" && Number(r.pred) === 1) ||
        (label === "neg" && Number(r.pred) === 0)) &&
      (q ? r.text.toLowerCase().includes(q.toLowerCase()) : true)
    );
    return a.slice(0, 50);
  }, [rows, label, q]);

  const exportCsv = () => {
    const head = ["text", "pred", "proba_pos", "proba_neg"];
    const lines = [head.join(",")].concat(
      filtered.map((r) =>
        [JSON.stringify(r.text), r.pred ?? "", r.proba_pos ?? "", r.proba_neg ?? ""].join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "batch_predictions_filtered.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Batch Predict Summary</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text…" className="h-9 rounded-lg w-48" />
          <select
            className="h-9 rounded-lg border px-2 text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="pos">Positive</option>
            <option value="neg">Negative</option>
          </select>
          <Button variant="secondary" className="h-9 rounded-lg px-3 text-xs" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataBar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Legend />
              <Bar dataKey="value" name="Count" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} / {rows.length} rows
        </div>

        {/* Styled prediction list */}
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const pred = Number(r.pred) === 1 ? "Positive" : "Negative";
            const probaPos = typeof r.proba_pos === "number" ? r.proba_pos : undefined;
            const probaNeg = typeof r.proba_neg === "number" ? r.proba_neg : undefined;
            const score = probaPos ?? (probaNeg != null ? 1 - probaNeg : undefined); // ưu tiên proba_pos
            const pct = score != null ? Math.round(score * 100) : undefined;

            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm hover:shadow-sm transition-shadow"
              >
                {/* accent theo nhãn */}
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${pred === "Positive" ? "bg-green-400" : "bg-red-400"}`}
                />
                <div className="p-3 md:p-4">
                  {/* header (chip + prob + actions) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1
                        ${pred === "Positive"
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-red-50 text-red-700 ring-red-200"}`}
                      >
                        pred: {pred === "Positive" ? "1" : "0"} ({pred})
                      </span>

                      {pct != null && (
                        <span className="text-xs text-muted-foreground">
                          confidence: <b>{pct}%</b>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        className="h-8 px-3 text-xs rounded-lg border bg-white hover:bg-slate-50"
                        onClick={() => navigator.clipboard.writeText(r.text)}
                        title="Copy text"
                      >
                        Copy
                      </button>
                      <button
                        className="h-8 px-3 text-xs rounded-lg border bg-white hover:bg-slate-50"
                        onClick={() => alert("Queued for manual review (demo).")}
                      >
                        Review
                      </button>
                    </div>
                  </div>

                  {/* progress line (nếu có xác suất) */}
                  {pct != null && (
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${pred === "Positive" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  {/* text */}
                  <PredictText text={r.text} className="mt-3 text-sm leading-6 tracking-tight text-slate-800" />
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">No rows matched.</div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
