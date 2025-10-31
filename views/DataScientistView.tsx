import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UploadCloud, RefreshCw } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend, Bar } from "recharts";
import { confusion } from "../data/mock";

export default function DataScientistView() {
  const metrics = { accuracy: 0.89, precision: 0.87, recall: 0.86, f1: 0.86 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Accuracy" value={(metrics.accuracy * 100).toFixed(1) + "%"} />
        <StatCard title="Precision" value={(metrics.precision * 100).toFixed(1) + "%"} />
        <StatCard title="Recall" value={(metrics.recall * 100).toFixed(1) + "%"} />
        <StatCard title="F1-score" value={(metrics.f1 * 100).toFixed(1) + "%"} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Confusion Matrix (SVM)</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-xl">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload New Model
            </Button>
            <Button className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retrain
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-xl">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2">Pred: Pos</th>
                  <th className="p-2">Pred: Neu</th>
                  <th className="p-2">Pred: Neg</th>
                </tr>
              </thead>
              <tbody>
                {["True Pos", "True Neu", "True Neg"].map((rowLabel, i) => (
                  <tr key={rowLabel} className="text-center border-t">
                    <td className="p-2 text-left font-medium">{rowLabel}</td>
                    {confusion[i].map((v, j) => (
                      <td key={j} className="p-2">
                        <div className={`mx-auto w-16 h-8 rounded ${v > 380 ? "bg-green-200" : v > 60 ? "bg-yellow-200" : "bg-red-200"} flex items-center justify-center`}>{v}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Feature Importance (example)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ feat: "good", val: 0.8 }, { feat: "bad", val: 0.72 }, { feat: "love", val: 0.67 }, { feat: "bug", val: 0.53 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feat" />
              <YAxis />
              <RTooltip />
              <Legend />
              <Bar dataKey="val" name="Weight" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
