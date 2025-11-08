from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
import json, time

ART_DIR = Path("svm/outputs")
INP_DIR = Path("svm/inputs")
RUNS_FILE = ART_DIR / "runs.json"

app = FastAPI()
app.mount("/svm/inputs",  StaticFiles(directory=str(INP_DIR)),  name="svm_inputs")
app.mount("/svm/outputs", StaticFiles(directory=str(ART_DIR)), name="svm_outputs")

class TrainBody(BaseModel):
    datasetRef: str
    params: dict

def _train_and_write(body: TrainBody):
    # TODO: gọi hàm train thật của bạn ở đây
    # train_model(body.datasetRef, **body.params)

    # demo metrics
    ART_DIR.mkdir(parents=True, exist_ok=True)
    metrics = {"accuracy": 0.91, "f1": 0.91, "params": body.params}
    (ART_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    run = {
        "id": str(int(time.time())),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "accuracy": metrics.get("accuracy"),
        "f1": metrics.get("f1"),
        "params": body.params,
    }
    runs = []
    if RUNS_FILE.exists():
        runs = json.loads(RUNS_FILE.read_text(encoding="utf-8") or "[]")
    runs.insert(0, run)
    RUNS_FILE.write_text(json.dumps(runs, indent=2), encoding="utf-8")

@app.post("/svm/train")
def train(body: TrainBody, bg: BackgroundTasks):
    bg.add_task(_train_and_write, body)
    return {"status": "started"}

@app.get("/svm/runs.json")
def get_runs():
    if RUNS_FILE.exists():
        return json.loads(RUNS_FILE.read_text(encoding="utf-8") or "[]")
    return []

@app.post("/svm/datasets/upload")
async def upload(file: UploadFile = File(...)):
    INP_DIR.mkdir(parents=True, exist_ok=True)
    dst = INP_DIR / file.filename
    dst.write_bytes(await file.read())
    return {"path": f"/svm/inputs/{file.filename}"}

@app.get("/svm/datasets/list.json")
def list_datasets():
    INP_DIR.mkdir(parents=True, exist_ok=True)
    return [f"/svm/inputs/{p.name}" for p in INP_DIR.glob("*.csv")]

@app.get("/svm/preview")
def preview(csv: str, head: int = 10):
    file = INP_DIR / Path(csv).name
    import pandas as pd
    df = pd.read_csv(file)
    return {
        "columns": list(df.columns),
        "rows": df.head(head).to_dict(orient="records")
    }

@app.get("/svm/heatmap")
def heatmap(csv: str):
    import pandas as pd
    import numpy as np
    file = INP_DIR / Path(csv).name
    df = pd.read_csv(file)

    numeric = df.select_dtypes(include=[np.number])
    if numeric.empty:
        return {"cols": [], "matrix": []}

    corr = numeric.corr()
    return {
        "cols": list(corr.columns),
        "matrix": corr.values.tolist(),
    }
