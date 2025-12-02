import { useEffect, useMemo, useState } from "react";
import React from "react";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { ReloadIcon } from "../components/ui/reload-icon";
import { RefreshCw, UploadCloud, Play, Database, SlidersHorizontal } from "lucide-react";
import { Download } from "lucide-react";

// Existing DS components in your project
import MisclassifiedList from "../components/DataScientistView/MisclassifiedList";
import TopFeatures from "../components/DataScientistView/TopFeatures";
import ConfusionMatrixCard from "../components/DataScientistView/ConfusionMatrixCard";
import BatchPredictSummary from "../components/DataScientistView/BatchPredictSummary";
import { RunParams } from "../components/DataScientistView/RunParams"

/* ---------------- Types ---------------- */

type Metrics = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc?: number;
  params?: Record<string, any>;
};

// predictions.csv (y_true,y_pred) & predictions_new.csv (text,pred)
type PredRow = { text: string; y_true?: number | null; y_pred?: number | null };

type Sample = { text: string; y_true: number; y_pred: number };

// Generic dataset row (free-form CSV columns)
type AnyRow = Record<string, any>;

/* ---------------- Paths/Endpoints ---------------- */

const BASE = "/svm/outputs";
const PATH = {
  METRICS: `${BASE}/metrics.json`,
  CM_PNG: `${BASE}/confusion_matrix.png`,
  ROC_PNG: `${BASE}/roc_curve.png`,
  CM_CSV: `${BASE}/confusion_matrix.csv`,
  TOP_TXT: `${BASE}/top_features.txt`,
  PRED_CSV: `${BASE}/predictions.csv`,
  PRED_NEW_CSV: `${BASE}/predictions_new.csv`,
};

// API endpoints (adjust to your backend)
const API = {
  TRAIN: "/svm/train", // POST {params, datasetRef}
  RUNS: "/svm/runs.json", // GET list of past runs
  DATASETS_LIST: "/svm/datasets/list.json", // GET available server-side datasets
  UPLOAD: "/svm/datasets/upload", // POST form-data {file}
};

/* ---------------- Helper: numeric correlation ---------------- */

type SVMParams = {
  kernel: "linear" | "rbf" | "poly" | "sigmoid" | string;
  C: number;
  gamma: "scale" | "auto" | number | string;
  degree?: number;
  test_size: number;
  ngram_range?: [number, number] | number[];
  max_features?: number;
  [k: string]: any;
};

function parseMaybeJSON<T = any>(x: any): T | null {
  if (x == null) return null;
  if (typeof x === "object") return x as T;
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      // đôi khi backend ghi JSON -> string rồi lại JSON.stringify lần nữa
      // thử thêm một lần bóc
      try {
        const once = JSON.parse(x);
        return typeof once === "string" ? (JSON.parse(once) as T) : (once as T);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function normalizeParams(raw: any): SVMParams | null {
  // một số backend hay bọc { params: {...} } hoặc lưu mảng [meta, params]
  let p: any = raw;
  if (Array.isArray(p)) {
    // nếu là mảng, lấy phần có nhiều key nhất
    p = p.reduce((best, cur) =>
      cur && typeof cur === "object" &&
        Object.keys(cur).length > Object.keys(best || {}).length
        ? cur
        : best,
      null as any);
  }
  if (p && typeof p === "object" && p.params) p = p.params;

  const parsed = parseMaybeJSON<SVMParams>(p) ?? p;
  if (!parsed || typeof parsed !== "object") return null;

  // ép kiểu số cho chắc
  const num = (v: any) =>
    typeof v === "number" ? v : (Number(v) as number);

  return {
    kernel: (parsed as any).kernel,
    C: num((parsed as any).C),
    gamma: (parsed as any).gamma,
    degree: (parsed as any).degree != null ? num((parsed as any).degree) : undefined,
    test_size: num((parsed as any).test_size),
    ngram_range: (parsed as any).ngram_range,
    max_features: (parsed as any).max_features != null ? num((parsed as any).max_features) : undefined,
    ...parsed,
  };
}


function computeCorrelationMatrix(rows: AnyRow[], maxCols = 20) {
  if (!rows || rows.length === 0) return { cols: [] as string[], corr: [] as number[][] };
  // Pick numeric columns
  const keys = Object.keys(rows[0]);
  const numericCols = keys.filter((k) => rows.every((r) => r[k] === null || r[k] === undefined || typeof r[k] === "number" || (!isNaN(Number(r[k])) && String(r[k]).trim() !== "")));
  const cols = numericCols.slice(0, maxCols);
  const data = rows.map((r) => cols.map((c) => (typeof r[c] === "number" ? r[c] : Number(r[c]))));
  const n = data.length;
  if (n === 0 || cols.length === 0) return { cols: [] as string[], corr: [] as number[][] };
  const mean: number[] = cols.map((_, j) => data.reduce((s, row) => s + (isFinite(row[j]) ? row[j] : 0), 0) / n);
  const std: number[] = cols.map((_, j) => Math.sqrt(
    data.reduce((s, row) => {
      const v = row[j];
      return s + (isFinite(v) ? (v - mean[j]) ** 2 : 0);
    }, 0) / Math.max(1, n - 1)
  ));
  const corr: number[][] = cols.map(() => cols.map(() => 0));
  for (let i = 0; i < cols.length; i++) {
    for (let j = i; j < cols.length; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) {
        const vi = data[k][i];
        const vj = data[k][j];
        if (isFinite(vi) && isFinite(vj)) {
          s += ((vi - mean[i]) * (vj - mean[j]));
        }
      }
      const denom = Math.max(1e-9, (n - 1) * std[i] * std[j]);
      const c = denom === 0 ? 0 : s / denom;
      corr[i][j] = c;
      corr[j][i] = c;
    }
  }
  return { cols, corr };
}

/* ---------------- Main ---------------- */

export default function DataScientistView() {
  /* ---- Metrics & artifacts ---- */
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [rocPngOk, setRocPngOk] = useState<boolean>(false);

  const [predRows, setPredRows] = useState<PredRow[]>([]);

  /* ---- Dataset preview ---- */
  const [datasetUrl, setDatasetUrl] = useState<string>("D:\\Study\\Master\\HK1_2025\\Hệ thống thông minh\\BTL\\data\\raw\\dataset.csv");
  const [datasetRows, setDatasetRows] = useState<AnyRow[]>([]);
  const [headN, setHeadN] = useState<number>(10);

  /* ---- Heatmap ---- */
  const [heatCols, setHeatCols] = useState<string[]>([]);
  const [heatCorr, setHeatCorr] = useState<number[][]>([]);
  // Heatmap for train section (reuse numeric corr)
  const [showHeatmapTrain, setShowHeatmapTrain] = useState(true);

  const recomputeHeatmapFromCurrent = () => {
    // lấy tối đa 1000 dòng hiện có để tính
    const sample = datasetRows.slice(0, 1000);
    const { cols, corr } = computeCorrelationMatrix(sample);
    setHeatCols(cols);
    setHeatCorr(corr);
  };


  /* ---- Retrain params ---- */
  const [isTraining, setIsTraining] = useState(false);
  const [kernel, setKernel] = useState<string>("linear");
  const [C, setC] = useState<number>(1.0);
  const [gammaMode, setGammaMode] = useState<string>("scale"); // "scale" | "auto" | "value"
  const [gammaValue, setGammaValue] = useState<number>(0.1);
  const [degree, setDegree] = useState<number>(3);
  const [testSize, setTestSize] = useState<number>(0.2);
  const [ngramMin, setNgramMin] = useState<number>(1);
  const [ngramMax, setNgramMax] = useState<number>(2);
  const [maxFeatures, setMaxFeatures] = useState<number>(50000);

  /* ---- History ---- */
  type Run = { id: string; created_at: string; accuracy?: number; f1?: number; params?: Record<string, any> };
  const [runs, setRuns] = useState<Run[]>([]);

  /* ---- Datasets on server ---- */
  const [serverDatasets, setServerDatasets] = useState<string[]>([]);

  // Load metrics
  useEffect(() => {
    fetch(`${PATH.METRICS}?t=${Date.now()}`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : Promise.reject("metrics not found")))
      .then((j: Metrics) => setMetrics(j))
      .catch(() => setMetrics(null));
  }, []);

  // Check ROC
  useEffect(() => {
    fetch(PATH.ROC_PNG, { method: "HEAD" })
      .then((r) => setRocPngOk(r.ok))
      .catch(() => setRocPngOk(false));
  }, []);

  // Predictions for misclassified (uses your existing pipeline)
  useEffect(() => {
    Papa.parse(PATH.PRED_CSV, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const rows = (res.data as any[]).filter((r) => r?.text !== undefined);
        setPredRows(rows as PredRow[]);
      },
    });
  }, []);

  // Load dataset preview (head N)
  const [datasetErr, setDatasetErr] = useState<string | null>(null);

  const loadDataset = async (url: string) => {
    try {
      setDatasetErr(null);
      // lấy response trước để kiểm tra
      const resp = await fetch(url, { method: "GET" });
      const ct = resp.headers.get("content-type") || "";
      const text = await resp.text();

      // phát hiện HTML (fallback SPA) hoặc content-type không phải CSV/text
      const looksHtml = /^\s*<!doctype html|^\s*<html/i.test(text);
      const isCsvLike = /text\/csv|application\/csv|text\/plain/i.test(ct) || url.endsWith(".csv");

      if (looksHtml || (!isCsvLike && text.split("\n").length < 2)) {
        setDatasetRows([]);
        setHeatCols([]);
        setHeatCorr([]);
        setDatasetErr(
          "Không tải được CSV. URL đang trả về HTML (có thể do proxy hoặc đường dẫn sai). Hãy kiểm tra lại static mount / proxy và Content-Type."
        );
        return;
      }

      // parse từ chuỗi text để tránh Papa tải lại lần nữa
      Papa.parse<AnyRow>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = (res.data as AnyRow[]).filter((r) => r && Object.keys(r).length > 0);
          setDatasetRows(rows);
          const sample = rows.slice(0, 1000);
          const { cols, corr } = computeCorrelationMatrix(sample);
          setHeatCols(cols);
          setHeatCorr(corr);
        },
        error: (err: { message?: string }) => {
          setDatasetErr("Lỗi parse CSV: " + (err?.message ?? "unknown"));
        },
      });
    } catch (e: any) {
      setDatasetErr("Không tải được CSV: " + (e?.message || String(e)));
    }
  };

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(API.UPLOAD, { method: "POST", body: fd });
      if (res.ok) {
        const j = await res.json();
        if (j?.path) setDatasetUrl(j.path);
      }
    } catch { /* ignore */ }

    // Preview ngay từ file local
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => {
        const rows = (r.data as AnyRow[]).filter((x) => x && Object.keys(x).length > 0);
        setDatasetRows(rows);
        const sample = rows.slice(0, 1000);
        const { cols, corr } = computeCorrelationMatrix(sample);
        setHeatCols(cols);
        setHeatCorr(corr);
      },
      error: (err: any) => {
        setDatasetErr("Lỗi parse CSV: " + (err?.message ?? String(err)));
      },
    });
  };

  useEffect(() => {
    if (datasetUrl) loadDataset(datasetUrl);
  }, [datasetUrl]);

  // Load runs history
  const fetchRuns = () => {
    fetch(API.RUNS)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: Run[]) => setRuns((arr || []).sort((a, b) => (a.created_at > b.created_at ? -1 : 1))))
      .catch(() => setRuns([]));
  };
  useEffect(() => { fetchRuns(); }, []);

  // Load available datasets on server (optional)
  useEffect(() => {
    fetch(API.DATASETS_LIST)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: string[]) => setServerDatasets(arr || []))
      .catch(() => setServerDatasets([]));
  }, []);

  const cards = useMemo(() => {
    const m = metrics ?? {};
    const pct = (v?: number) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—");
    return [
      { k: "Accuracy", v: pct(m.accuracy) },
      { k: "Precision", v: pct(m.precision) },
      { k: "Recall", v: pct(m.recall) },
      { k: "F1-score", v: pct(m.f1) },
      { k: "ROC-AUC", v: typeof m.roc_auc === "number" ? m.roc_auc.toFixed(3) : "—" },
    ];
  }, [metrics]);

  const misclassified: Sample[] = useMemo(() => {
    return predRows
      .filter((r) =>
        r.text !== undefined &&
        Number.isFinite(Number(r.y_true)) &&
        Number.isFinite(Number(r.y_pred)) &&
        Number(r.y_true) !== Number(r.y_pred)
      )
      .map((r) => ({ text: String(r.text ?? ""), y_true: Number(r.y_true), y_pred: Number(r.y_pred) }))
      .slice(0, 10);
  }, [predRows]);

  const onUploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(API.UPLOAD, { method: "POST", body: fd });
    if (res.ok) {
      const j = await res.json();
      if (j?.path) setDatasetUrl(j.path);
      // immediate preview from local file too
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (r) => {
          const rows = (r.data as AnyRow[]).filter((x) => x && Object.keys(x).length > 0);
          setDatasetRows(rows);
          const sample = rows.slice(0, 1000);
          const { cols, corr } = computeCorrelationMatrix(sample);
          setHeatCols(cols);
          setHeatCorr(corr);
        },
      });
    }
  };

  const startTraining = async () => {
    // tái dùng pipeline train có sẵn
    await triggerTrain();
  };

  const reloadArtifacts = async () => {
    // 1) Reload metrics & ROC
    try {
      const [m, rocOk] = await Promise.all([
        fetch(`${PATH.METRICS}?t=${Date.now()}`, { cache: "no-store" }).then(r => (r.ok ? r.json() : null)),
        fetch(PATH.ROC_PNG, { method: "HEAD", cache: "no-store" }).then(r => r.ok).catch(() => false),
      ]);
      setMetrics(m ?? null);
      setRocPngOk(rocOk);
    } catch { /* ignore */ }

    // 2) Reload predictions cho MisclassifiedList
    Papa.parse(PATH.PRED_CSV, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const rows = (res.data as any[]).filter((r) => r?.text !== undefined);
        setPredRows(rows as PredRow[]);
      },
    });
  };

  const visibleRows = useMemo(() => datasetRows.slice(0, headN), [datasetRows, headN]);
  const tableCols = useMemo(() => (visibleRows[0] ? Object.keys(visibleRows[0]) : []), [visibleRows]);

  const triggerTrain = async () => {
    setIsTraining(true);
    try {
      const gamma = gammaMode === "value" ? gammaValue : gammaMode; // string or number
      const body = {
        datasetRef: datasetUrl,
        params: {
          kernel,
          C: Number(C),
          gamma,
          degree: Number(degree),
          test_size: Number(testSize),
          ngram_range: [Number(ngramMin), Number(ngramMax)],
          max_features: Number(maxFeatures),
        },
      };
      const res = await fetch(API.TRAIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Train failed");
      // Best-effort refresh of metrics & history
      fetch(PATH.METRICS)
        .then((r) => (r.ok ? (r.json() as Promise<Metrics>) : null))
        .then((m) => {
          if (m) setMetrics(m);
        })
        .catch(() => { /* ignore */ });

      fetchRuns();

      fetchRuns();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto mb-6">
          <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-xl">Upload Dataset</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl">Train History</TabsTrigger>
        </TabsList>

        {/* ---------------- OVERVIEW ---------------- */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {cards.map((c) => (
              <Card key={c.k} className="rounded-2xl">
                <CardHeader><CardTitle>{c.k}</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold">{c.v}</CardContent>
              </Card>
            ))}
          </div>

          {/* Train Controls */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" /> Retrain Model
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust parameters and launch a new training job.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Hàng 1: Kernel - C - Test size */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Kernel */}
                <div className="col-span-12 md:col-span-3">
                  <Label className="text-sm mb-1 block">Kernel</Label>
                  <Select
                    value={kernel}
                    onValueChange={setKernel}
                    /* QUAN TRỌNG: width đặt ở Select, không phải SelectTrigger */
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                  >
                    <SelectTrigger className="hidden" />
                    <SelectContent>
                      <SelectItem value="linear">linear</SelectItem>
                      <SelectItem value="rbf">rbf</SelectItem>
                      <SelectItem value="poly">poly</SelectItem>
                      <SelectItem value="sigmoid">sigmoid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* C */}
                <div className="col-span-12 md:col-span-4">
                  <Label className="text-sm mb-1 block">C</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={C}
                    onChange={(e) => setC(Number(e.target.value))}
                    className="w-full h-10"
                  />
                </div>

                {/* Test size */}
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-sm mb-1 block">Test size</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.95"
                    value={testSize}
                    onChange={(e) => setTestSize(Number(e.target.value))}
                    className="w-full h-10"
                  />
                </div>
              </div>

              {/* Hàng 2: N-gram range + Max features */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* ngram min */}
                <div className="col-span-6 md:col-span-3">
                  <Label className="text-sm mb-1 block">N-gram min</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={ngramMin}
                    onChange={(e) => setNgramMin(Number(e.target.value))}
                    className="w-full h-10"
                  />
                </div>

                {/* ngram max */}
                <div className="col-span-6 md:col-span-3">
                  <Label className="text-sm mb-1 block">N-gram max</Label>
                  <Input
                    type="number"
                    min={ngramMin}
                    max={5}
                    value={ngramMax}
                    onChange={(e) => setNgramMax(Number(e.target.value))}
                    className="w-full h-10"
                  />
                </div>

                {/* max features */}
                <div className="col-span-12 md:col-span-6">
                  <Label className="text-sm mb-1 block">Max features (TF-IDF)</Label>
                  <Input
                    type="number"
                    step={1000}
                    value={maxFeatures}
                    onChange={(e) => setMaxFeatures(Number(e.target.value))}
                    className="w-full h-10"
                  />
                </div>
              </div>

              {/* Nút */}
              <div className="flex items-center gap-4 pt-4">
                {/* Start Training */}
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={startTraining}
                  disabled={isTraining}
                >
                  <Play className="w-4 h-4" />
                  {isTraining ? "Training..." : "Start Training"}
                </Button>

                {/* Reload Artifacts */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={reloadArtifacts}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Artifacts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Confusion Matrix & ROC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConfusionMatrixCard
              title="Confusion Matrix"
              imageUrl={PATH.CM_PNG}
              csvUrl={PATH.CM_CSV}
              labels={["Negative", "Positive"]}
            />
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>ROC Curve</CardTitle></CardHeader>
              <CardContent>
                {rocPngOk ? (
                  <img src={PATH.ROC_PNG} alt="ROC Curve" className="w-full rounded-xl border" />
                ) : (
                  <div className="text-sm text-muted-foreground">No ROC curve image found.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Features */}
          <Card className="rounded-2xl">
            <TopFeatures source={PATH.TOP_TXT} />
          </Card>

          {/* Dataset quick head inside overview */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Dataset Preview</CardTitle>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex items-center gap-2 w-full md:w-2/3">
                  <Label className="min-w-20">CSV URL</Label>
                  <Input value={datasetUrl} onChange={(e) => setDatasetUrl(e.target.value)} placeholder="/path/to/your.csv" />
                  <Button variant="secondary" className="rounded-xl" onClick={() => loadDataset(datasetUrl)}>
                    <RefreshCw className="h-4 w-4 mr-2" />Load
                  </Button>
                </div>
                {serverDatasets.length > 0 && (
                  <div className="flex items-center gap-2 w-full md:w-1/3">
                    <Label className="min-w-24">Server set</Label>
                    <Select onValueChange={(v) => setDatasetUrl(v)}>
                      <SelectTrigger><SelectValue placeholder="Pick dataset" /></SelectTrigger>
                      <SelectContent>
                        {serverDatasets.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label>Head</Label>
                  <Select value={String(headN)} onValueChange={(v) => setHeadN(Number(v))}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {tableCols.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) => (
                      <tr key={i} className="odd:bg-muted/30">
                        {tableCols.map((c) => (
                          <td key={c} className="px-3 py-2 whitespace-nowrap max-w-[360px] overflow-hidden text-ellipsis">{String(row[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---- Heatmap in Retrain section ---- */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Feature correlation</span> (numeric columns, up to 20)
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showHeatmapTrain}
                        onChange={(e) => setShowHeatmapTrain(e.target.checked)}
                      />
                      Show heatmap
                    </label>
                    <Button variant="secondary" className="rounded-xl" onClick={recomputeHeatmapFromCurrent}>
                      Recompute
                    </Button>
                  </div>
                </div>

                {showHeatmapTrain ? (
                  heatCols.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No numeric columns detected for correlation.
                    </div>
                  ) : (
                    <TooltipProvider delayDuration={50}>
                      <div className="overflow-auto rounded-xl border">
                        <div className="inline-block">
                          <div
                            className="grid p-2"
                            style={{ gridTemplateColumns: `140px repeat(${heatCols.length}, 28px)` }}
                          >
                            {/* header */}
                            <div />
                            {heatCols.map((c) => (
                              <div
                                key={c}
                                className="text-[10px] text-muted-foreground rotate-[-60deg] origin-left translate-y-4 whitespace-nowrap h-10"
                              >
                                {c}
                              </div>
                            ))}

                            {/* rows */}
                            {heatCols.map((rName, rIdx) => (
                              <React.Fragment key={`row-${rName}`}>
                                <div className="text-[11px] pr-2 py-1 whitespace-nowrap sticky left-0 bg-background/80">
                                  {rName}
                                </div>
                                {heatCols.map((cName, cIdx) => {
                                  const v = heatCorr?.[rIdx]?.[cIdx] ?? 0;
                                  // map [-1,1] -> blue-white-red
                                  const x = Math.max(-1, Math.min(1, v));
                                  const hue = ((x + 1) / 2) * 240; // 0..240
                                  const bg = `hsl(${240 - hue} 85% ${50 - Math.abs(x) * 25}% / 0.95)`;
                                  return (
                                    <Tooltip key={`${rIdx}-${cIdx}`}>
                                      <TooltipTrigger asChild>
                                        <div className="w-7 h-7 border" style={{ background: bg }} />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">
                                        <div className="font-mono">
                                          {rName} × {cName}: {v.toFixed(3)}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TooltipProvider>
                  )
                ) : null}
              </div>

            </CardContent>
          </Card>

          {/* Misclassified samples */}
          {misclassified.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Misclassified Samples</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <MisclassifiedList data={misclassified} />
              </CardContent>
            </Card>
          )}

          {/* Quick summary from predictions_new.csv */}
          <BatchPredictSummary csvUrl={PATH.PRED_NEW_CSV} />
        </TabsContent>

        {/* ---------------- UPLOAD ---------------- */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5" /> Upload CSV
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* ----------- Cột 1: Upload CSV ----------- */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose CSV file</label>

                  <input
                    id="file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                    className="block w-full rounded-xl border p-3"
                  />

                  <p className="text-xs text-muted-foreground">
                    After upload, the dataset will be previewed and used as the current training source.
                  </p>
                </div>

                {/* ----------- Cột 2: Sample CSV box ----------- */}
                <div className="rounded-xl border p-4">
                  <h4 className="font-medium mb-1">Need a sample CSV?</h4>

                  <p className="text-sm text-muted-foreground mb-3">
                    Download a small sample formatted for this model (columns: <code>text</code>, <code>label</code>).
                    <br />
                    It’s derived from the Kaggle “Steam Reviews” dataset.
                    <br />
                  </p>

                  <div className="flex flex-wrap gap-3">

                    {/* Nút Download sample.csv */}
                    <a
                      href="/samples/steam_reviews_sample.csv"
                      download
                      className="
                        group relative inline-flex items-center gap-2
                        rounded-lg bg-primary text-primary-foreground
                        px-4 py-2 text-sm font-medium
                        shadow-sm ring-1 ring-primary/40
                        transition
                        hover:bg-primary/90 hover:shadow
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        overflow-hidden
                      "
                    >
                      <span
                        className="
                          pointer-events-none absolute inset-0 rounded-lg
                          bg-gradient-to-r from-transparent via-white/30 to-transparent
                          -translate-x-full
                          transition-transform duration-700 ease-out
                          group-hover:translate-x-full
                        "
                      />

                      <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Download sample.csv
                    </a>

                    {/* Link Kaggle */}
                    <a
                      href="https://www.kaggle.com/datasets/andrewmvd/steam-reviews"
                      target="_blank"
                      rel="noreferrer"
                      className="
                        inline-flex items-center rounded-lg border
                        px-4 py-2 text-sm
                        hover:bg-accent hover:text-accent-foreground transition
                      "
                    >
                      View dataset on Kaggle
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* live preview re-used from Overview */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Current Dataset (head)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="min-w-20">Head</Label>
                <Select value={String(headN)} onValueChange={(v) => setHeadN(Number(v))}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="secondary" onClick={() => loadDataset(datasetUrl)} className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />Refresh
                </Button>
              </div>
              <div className="w-full overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {tableCols.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) => (
                      <tr key={i} className="odd:bg-muted/30">
                        {tableCols.map((c) => (
                          <td key={c} className="px-3 py-2 whitespace-nowrap max-w-[360px] overflow-hidden text-ellipsis">{String(row[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- HISTORY ---------------- */}
        <TabsContent value="history" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Training Runs</CardTitle>
              <Button variant="secondary" className="rounded-xl" onClick={fetchRuns}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No runs found.</div>
              ) : (
                <div className="w-full overflow-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Run ID</th>
                        <th className="px-3 py-2 text-left">Accuracy</th>
                        <th className="px-3 py-2 text-left">F1</th>
                        <th className="px-3 py-2 text-left">Params</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r) => (
                        <tr key={r.id} className="odd:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">{r.id}</td>
                          <td className="px-3 py-2">{typeof r.accuracy === "number" ? (r.accuracy * 100).toFixed(1) + "%" : "—"}</td>
                          <td className="px-3 py-2">{typeof r.f1 === "number" ? (r.f1 * 100).toFixed(1) + "%" : "—"}</td>
                          <td className="px-3 py-2 align-top">
                            <RunParams raw={r.params} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
