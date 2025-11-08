// components/MisclassifiedList.tsx
import * as React from "react";
import { Button } from "../ui/button";
import { Copy, RotateCcw, Trash2, AlertCircle, Check } from "lucide-react";

type Sample = { text: string; y_true: number; y_pred: number };

const labelTone = (v: number) =>
  v === 1
    ? "bg-green-100 text-green-700 ring-1 ring-green-200"
    : "bg-red-100 text-red-700 ring-1 ring-red-200";

function Chip({ label, tone }: { label: React.ReactNode; tone: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function highlight(text: string) {
  // Dùng regex không có 'g' khi test để tránh stateful lastIndex
  const splitRegex = /(amazing|awesome|love|great|excellent|bug|boring|terrible|bad|crash|lag)/gi;
  const testRegex = /(amazing|awesome|love|great|excellent|bug|boring|terrible|bad|crash|lag)/i;

  const parts = text.split(splitRegex);
  return (
    <>
      {parts.map((p, i) =>
        testRegex.test(p) ? (
          <mark key={i} className="rounded px-1 bg-amber-100/70 ring-1 ring-amber-200">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function Row({ s }: { s: Sample }) {
  const [expanded, setExpanded] = React.useState(false);
  const predOk = s.y_pred === s.y_true;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm 
      ${predOk ? "border-slate-200" : "border-red-200/70"} 
      hover:shadow-sm transition-shadow`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${predOk ? "bg-slate-200" : "bg-red-300"}`} />
      <div className="p-3 pl-4 md:p-4 md:pl-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Chip
              label={
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  True: {s.y_true}
                </>
              }
              tone={labelTone(s.y_true)}
            />
            <Chip
              label={
                <>
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />
                  Pred: {s.y_pred}
                </>
              }
              tone={labelTone(s.y_pred)}
            />
          </div>

          <div className="flex items-center gap-1.5 opacity-90">
            {/* Không dùng size, style bằng className */}
            <Button
              variant="secondary"
              className="rounded-lg h-8 px-3 text-xs"
              onClick={() => navigator.clipboard.writeText(s.text)}
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>

            <Button variant="secondary" className="rounded-lg h-8 px-3 text-xs">
              <RotateCcw className="h-4 w-4 mr-1" /> Requeue
            </Button>

            {/* Destructive: vẫn dùng variant="secondary" + lớp màu đỏ */}
            <Button
              variant="default"
              className="rounded-lg h-8 px-3 text-xs bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Exclude
            </Button>
          </div>
        </div>

        <div className="mt-2 text-sm leading-6 tracking-tight text-slate-800">
          <p className={expanded ? "" : "line-clamp-3"}>{highlight(s.text || "")}</p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MisclassifiedList({ data }: { data: Sample[] }) {
  return (
    <div className="space-y-3">
      {data.map((s, i) => (
        <Row key={i} s={s} />
      ))}
    </div>
  );
}
