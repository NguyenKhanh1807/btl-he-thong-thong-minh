import * as React from "react";

type Params = {
  kernel?: string;
  C?: number;
  gamma?: number | "scale" | "auto" | string;
  degree?: number;
  test_size?: number;
  ngram_range?: [number, number] | number[];
  max_features?: number;
};

export function normalizeParams(raw: any): Params | null {
  let obj: any = raw;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch {}
  }
  if (obj && typeof obj === "object" && "params" in obj && obj.params) obj = obj.params;

  const toNum = (v: any) =>
    v === undefined || v === null || v === "" ? undefined : (typeof v === "number" ? v : Number(v));
  const toRange = (v: any) =>
    Array.isArray(v) && v.length >= 2 ? ([Number(v[0]), Number(v[1])] as [number, number]) : undefined;

  const p: Params = {
    kernel: obj?.kernel ?? obj?.model_params?.kernel,
    C: toNum(obj?.C ?? obj?.c),
    gamma: obj?.gamma ?? toNum(obj?.gamma),
    degree: toNum(obj?.degree),
    test_size: toNum(obj?.test_size),
    ngram_range: toRange(obj?.ngram_range),
    max_features: toNum(obj?.max_features ?? obj?.maxFeatures),
  };
  return Object.values(p).every((v) => v === undefined) ? null : p;
}

const Pill = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <span
    className="
      inline-flex items-center gap-1 rounded-full
      bg-gradient-to-r from-slate-100 to-slate-50
      dark:from-slate-800/70 dark:to-slate-800/40
      px-3 py-1 text-xs shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/60
    "
  >
    <span className="opacity-60">{label}:</span>
    <span className="font-semibold">{value}</span>
  </span>
);

const PrettyValue = ({ v }: { v: any }) => {
  if (Array.isArray(v)) return <>{v.join(" – ")}</>;
  if (typeof v === "number") return <>{Number.isInteger(v) ? v : v.toFixed(3)}</>;
  return <>{String(v)}</>;
};

export function RunParams({ raw, showJson = false }: { raw: any; showJson?: boolean }) {
  const params = normalizeParams(raw);
  const [open, setOpen] = React.useState(false);

  if (!params) {
    return (
      <div
        className="
          rounded-xl border border-slate-200/70 bg-slate-50/40 px-3 py-2
          text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400
        "
      >
        No params
      </div>
    );
  }

  const items: Array<[string, any]> = ([
    ["kernel", params.kernel],
    ["C", params.C],
    ["gamma", params.gamma],
    ["degree", params.degree],
    ["test_size", params.test_size],
    ["ngram_range", params.ngram_range],
    ["max_features", params.max_features],
  ] as Array<[string, any]>).filter(([, v]) => v !== undefined && v !== null);

  return (
    <div
      className="
        rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm
        dark:border-slate-800/70 dark:bg-slate-900/50
      "
    >
      {/* hàng pills nổi bật chú thích parameters cho từng lượt chạy*/}
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map(([k, v]) => (
          <Pill key={k} label={k} value={<PrettyValue v={v} />} />
        ))}
      </div>

      {/* toggle JSON */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="
          mt-3 inline-flex items-center gap-2 text-xs font-medium
          text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300
        "
      >
        {open ? "Hide raw JSON" : "Show raw JSON"}
      </button>

      {open && (
        <pre
          className="
            mt-2 max-h-80 overflow-auto rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-[11px] leading-5
            text-slate-800 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-200
          "
        >
{JSON.stringify(params, null, 2)}
        </pre>
      )}
    </div>
  );
}
