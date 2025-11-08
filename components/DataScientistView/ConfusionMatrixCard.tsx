import * as React from "react";
import Papa from "papaparse";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";

type Props = {
  title?: string;
  imageUrl?: string;      // e.g. "/svm/outputs/confusion_matrix.png"
  csvUrl?: string;        // e.g. "/svm/outputs/confusion_matrix.csv"
  labels?: string[];      // optional: ["Negative","Positive"]
};

export default function ConfusionMatrixCard({
  title = "Confusion Matrix",
  imageUrl,
  csvUrl,
  labels,
}: Props) {
  const [hasImg, setHasImg] = React.useState(false);
  const [mat, setMat] = React.useState<number[][]>([]);
  const [normalize, setNormalize] = React.useState<"none" | "row" | "all">("row");

  React.useEffect(() => {
    if (!imageUrl) return;
    fetch(imageUrl, { method: "HEAD" })
      .then((r) => setHasImg(r.ok))
      .catch(() => setHasImg(false));
  }, [imageUrl]);

  React.useEffect(() => {
    if (!csvUrl) return;
    Papa.parse(csvUrl, {
      download: true,
      header: false,
      dynamicTyping: true,
      complete: (res) => {
        const rows = (res.data as any[]).filter((r) => Array.isArray(r) && r.length > 0);
        if (rows.length) setMat(rows.map((r: any[]) => r.map((x) => Number(x))));
      },
    });
  }, [csvUrl]);

  const normMat = React.useMemo(() => {
    if (!mat.length) return [];
    if (normalize === "none") return mat;
    if (normalize === "row") {
      return mat.map((row) => {
        const s = row.reduce((a, b) => a + b, 0) || 1;
        return row.map((v) => (v / s) * 100);
      });
    }
    // "all"
    const total = mat.flat().reduce((a, b) => a + b, 0) || 1;
    return mat.map((row) => row.map((v) => (v / total) * 100));
  }, [mat, normalize]);

  const maxVal = React.useMemo(() => {
    const arr = normalize === "none" ? mat.flat() : normMat.flat();
    return arr.length ? Math.max(...arr) : 1;
  }, [mat, normMat, normalize]);

  const fmt = (v: number) =>
    normalize === "none" ? v.toString() : `${v.toFixed(1)}%`;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {mat.length > 0 && (
            <select
              className="h-9 rounded-lg border px-2 text-sm"
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as any)}
            >
              <option value="row">Normalize: Row</option>
              <option value="all">Normalize: Global</option>
              <option value="none">Raw counts</option>
            </select>
          )}
          {csvUrl && (
            <Button
              variant="secondary"
              className="h-9 rounded-lg px-3 text-xs"
              onClick={() => window.open(csvUrl!, "_blank")}
            >
              Download CSV
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {hasImg ? (
          <img src={imageUrl} alt="Confusion Matrix" className="w-full rounded-xl border" />
        ) : mat.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-xl">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {mat[0].map((_, j) => (
                    <th key={j} className="p-2 text-center">
                      Pred {labels?.[j] ?? j}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normMat.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">True {labels?.[i] ?? i}</td>
                    {row.map((v, j) => {
                      const intensity = v / (maxVal || 1);
                      const bg =
                        normalize === "none"
                          ? intensity > 0.7
                            ? "bg-green-200"
                            : intensity > 0.2
                            ? "bg-yellow-100"
                            : "bg-red-100"
                          : intensity > 0.7
                          ? "bg-green-200"
                          : intensity > 0.4
                          ? "bg-green-100"
                          : "bg-slate-50";
                      return (
                        <td key={j} className="p-1 text-center">
                          <div className={`mx-auto min-w-16 px-2 py-2 rounded ${bg}`}>
                            {fmt(v)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No confusion matrix image/CSV found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
