#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chuẩn hoá dữ liệu Steam Reviews (nhiều schema khác nhau).
- Hỗ trợ các cột thường gặp:
  text: review / review_text / text / content
  game: app_name (hoặc fallback từ app_id)
  sentiment: recommended / voted_up / is_recommended / review_score (suy luận)
  helpful: review_votes / votes_up / votes_helpful
  funny: votes_funny (nếu có)
  playtime: *playtime* (nếu có)
- Xuất:
  public/dataset/steam_reviews_small.csv
  public/dataset/provider_agg.csv
  public/dataset/admin_flags.csv
  public/svm/outputs/metrics.json, confusion_matrix.csv (dummy nếu chưa train)
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys, json
from datetime import datetime

# ==== CẤU HÌNH INPUT ====
# Cho phép truyền path qua argv, nếu không sẽ dùng đường dẫn mặc định
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"D:/Study/Master/HK1_2025/Hệ thống thông minh/BTL/data/raw/dataset.csv")

# ==== CẤU HÌNH OUTPUT ====
OUT_PUBLIC = Path("public")
(OUT_PUBLIC / "dataset").mkdir(parents=True, exist_ok=True)
(OUT_PUBLIC / "svm" / "outputs").mkdir(parents=True, exist_ok=True)

def first_match(cols, candidates):
    """Trả về tên cột đầu tiên trong 'candidates' có trong 'cols' (case-insensitive)."""
    lower = {c.lower(): c for c in cols}
    for name in candidates:
        if name in lower:
            return lower[name]
    return None

def infer_sentiment_from_score(series: pd.Series) -> np.ndarray:
    """Suy luận sentiment từ review_score (đa dạng miền giá trị)."""
    # ép numeric; lỗi -> NaN
    s = pd.to_numeric(series, errors="coerce")
    # Xét miền giá trị thực có trong dữ liệu
    unique = set(x for x in s.dropna().unique().tolist())
    # Case phổ biến: {0,1}
    if unique.issubset({0,1}):
        return np.where(s >= 1, "positive", "negative")
    # Case {-1,0,1}
    if unique.issubset({-1,0,1}):
        return np.where(s > 0, "positive", np.where(s < 0, "negative", "neutral"))
    # Case khác: >0 pos, =0 neu, <0 neg
    return np.where(s > 0, "positive", np.where(s < 0, "negative", "neutral"))

def main():
    if not RAW.exists():
        raise FileNotFoundError(f"Không tìm thấy file input: {RAW}")

    print(f"[INFO] Đọc dữ liệu từ: {RAW}")
    df = pd.read_csv(RAW, low_memory=False)
    print(f"[INFO] Columns: {df.columns.tolist()}")

    # ==== TÌM CỘT TEXT ====
    col_text = first_match(df.columns, [
        "review", "review_text", "text", "content"
    ])
    if not col_text:
        raise ValueError("Không tìm thấy cột chứa nội dung review (review/review_text/text/content).")

    # ==== TÊN GAME ====
    col_game = first_match(df.columns, ["app_name", "game", "title"])
    col_appid = first_match(df.columns, ["app_id", "appid", "app"])
    if not col_game and not col_appid:
        raise ValueError("Không có app_name hoặc app_id để xác định tên game.")

    # ==== SENTIMENT ====
    # Ưu tiên cột nhị phân khuyến nghị: recommended / voted_up / is_recommended / recommend
    col_reco = first_match(df.columns, [
        "recommended", "voted_up", "is_recommended", "recommend"
    ])
    # Nếu không có, thử suy luận từ review_score
    col_score = first_match(df.columns, ["review_score", "score", "rating"])
    if not col_reco and not col_score:
        raise ValueError("Không có cột recommended/voted_up/is_recommended và cũng không có review_score để suy luận sentiment.")

    # ==== CÁC CỘT PHỤ ====
    col_help = first_match(df.columns, ["review_votes", "votes_up", "votes_helpful", "helpful"])
    col_funny = first_match(df.columns, ["votes_funny", "funny"])
    col_play  = first_match(df.columns, ["playtime", "author.playtime_forever", "playtime_forever"])
    col_id    = first_match(df.columns, ["review_id", "id", "cid"])

    # ==== CHUẨN HOÁ GIÁ TRỊ ====
    # text
    text = df[col_text].astype(str).str.replace(r"\s+", " ", regex=True).str.strip()

    # game
    if col_game:
        game_series = df[col_game].astype(str).str.strip()
    else:
        game_series = ("Unknown_" + df[col_appid].astype(str)).str.strip()

    # sentiment
    if col_reco:
        # coi như bool-like: True/1/Yes -> positive, còn lại negative
        raw = df[col_reco].astype(str).str.lower().str.strip()
        sentiment = np.where(raw.isin(["true","1","yes","y"]), "positive", "negative")
    else:
        sentiment = infer_sentiment_from_score(df[col_score])

    # helpful/funny/playtime
    helpful = df[col_help] if col_help else 0
    funny   = df[col_funny] if col_funny else 0
    play    = df[col_play] if col_play else 0

    # id
    rid = pd.Series(df[col_id].astype(str) if col_id else pd.Series(range(1, len(df)+1), dtype=str))

    # timestamp (nếu không có cột thời gian, gán now)
    ts_candidates = [c for c in df.columns if any(k in c.lower() for k in ["time", "date", "posted", "created", "updated"])]
    if ts_candidates:
        col_time = ts_candidates[0]
        ts = pd.to_datetime(df[col_time], errors="coerce")
    else:
        ts = pd.to_datetime(datetime.utcnow())

    # ==== 1) END-USER CSV ====
    enduser = pd.DataFrame({
        "id": rid,
        "game": game_series,
        "text": text,
        "sentiment": sentiment,
        "timestamp": pd.to_datetime(ts)
    })
    enduser = enduser[enduser["text"].str.len() > 5].dropna(subset=["game"]).head(5000)
    out_enduser = OUT_PUBLIC / "dataset" / "steam_reviews_small.csv"
    enduser.to_csv(out_enduser, index=False)
    print(f"[OK] Wrote: {out_enduser} ({len(enduser)} rows)")

    # ==== 2) PROVIDER AGG ====
    prov = pd.DataFrame({
        "game": game_series,
        "sentiment": sentiment,
        "helpful": helpful,
        "funny": funny
    })
    agg = prov.groupby("game", dropna=True).agg(
        total_reviews=("sentiment", "count"),
        positive=("sentiment", lambda s: (s=="positive").sum()),
        negative=("sentiment", lambda s: (s=="negative").sum()),
        helpful_sum=("helpful", "sum"),
        funny_sum=("funny", "sum")
    ).reset_index()
    # neutral có thể xuất hiện nếu dùng review_score 3-mức
    neutral_counts = prov.groupby(["game","sentiment"]).size().unstack(fill_value=0)
    agg["neutral"] = neutral_counts.get("neutral", 0).values if "neutral" in neutral_counts.columns else 0
    agg["positive_rate"] = (agg["positive"] / agg["total_reviews"]).round(4)
    out_provider = OUT_PUBLIC / "dataset" / "provider_agg.csv"
    agg.sort_values("total_reviews", ascending=False).to_csv(out_provider, index=False)
    print(f"[OK] Wrote: {out_provider} ({len(agg)} games)")

    # ==== 3) ADMIN FLAGS (demo) ====
    flags = []
    text_head = text.head(10000)
    for t in text_head:
        f = []
        if len(t) < 15: f.append("short_spam")
        if t.isupper() and len(t) > 15: f.append("all_caps")
        if "http://" in t or "https://" in t: f.append("has_link")
        flags.append(",".join(f))
    admin = pd.DataFrame({
        "id": rid.head(10000),
        "game": game_series.head(10000),
        "text": text_head,
        "sentiment": sentiment[:10000],
        "helpful": (helpful[:10000] if hasattr(helpful, "__len__") else 0),
        "funny": (funny[:10000] if hasattr(funny, "__len__") else 0),
        "playtime": (play[:10000] if hasattr(play, "__len__") else 0),
        "flag": flags
    })
    out_admin = OUT_PUBLIC / "dataset" / "admin_flags.csv"
    admin.to_csv(out_admin, index=False)
    print(f"[OK] Wrote: {out_admin} ({len(admin)} rows)")

    # ==== 4) Dummy DS outputs (để UI chạy trước) ====
    metrics = {"accuracy": 0.85, "precision": 0.84, "recall": 0.83, "f1": 0.835}
    (OUT_PUBLIC / "svm" / "outputs" / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    cm = np.array([[1200, 300],[260, 1240]])
    pd.DataFrame(cm).to_csv(OUT_PUBLIC / "svm" / "outputs" / "confusion_matrix.csv", index=False)
    print(f"[OK] Wrote: {OUT_PUBLIC / 'svm' / 'outputs' / 'metrics.json'} and confusion_matrix.csv")

if __name__ == "__main__":
    main()
