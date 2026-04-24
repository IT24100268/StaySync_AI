"""
Run this script to (re)train the smart-room recommender using live Django DB data.

Usage (from backend/ directory):
    python -m rooms.ml.train_recommender

It will:
  1. Export approved rooms from DB → room feature matrix + pkl
  2. Export RoomInteraction rows   → interactions pkl
  3. Export RoomSearchHistory rows → search history pkl
  4. Save all artifacts to rooms/ml/
"""
from __future__ import annotations

import os
import sys
import django

# ── Bootstrap Django ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder

ML_DIR = Path(__file__).resolve().parent

CATEGORICAL_COLS = ["budget_range", "gender_allowed", "room_type", "area"]
NUMERIC_COLS     = ["monthly_rent_lkr", "distance_to_uoj_km", "rating", "max_capacity"]
BOOLEAN_COLS     = ["wifi", "attached_bath", "ac", "meals_included", "parking"]

INTERACTION_EVENT_WEIGHTS = {"click": 1.0, "view": 1.5, "save": 3.0}


def _budget_range(price: float) -> str:
    if price < 10000:  return "budget"
    if price < 20000:  return "mid"
    if price < 35000:  return "premium"
    return "luxury"


def export_rooms() -> pd.DataFrame:
    from rooms.models import Room
    qs = Room.objects.filter(status="APPROVED").values(
        "id", "title", "area", "gender_allowed", "room_type",
        "price", "estimated_rating", "distance_from_university",
        "attached_bathroom", "ac_available", "fan_available",
        "max_capacity",
    )
    df = pd.DataFrame(list(qs))
    if df.empty:
        raise ValueError("No approved rooms in DB.")

    # Rename to match recommender column names
    df.rename(columns={
        "id":                      "room_id",
        "price":                   "monthly_rent_lkr",
        "estimated_rating":        "rating",
        "distance_from_university":"distance_to_uoj_km",
        "attached_bathroom":       "attached_bath",
        "ac_available":            "ac",
        "fan_available":           "wifi",   # closest available boolean
    }, inplace=True)

    df["room_id"]      = df["room_id"].astype(str)
    df["budget_range"] = df["monthly_rent_lkr"].apply(float).apply(_budget_range)
    df["meals_included"] = 0
    df["parking"]        = 0
    df["is_available"]   = 1
    df["title"]          = df["title"].fillna("Room")
    df["max_capacity"]   = df["max_capacity"].fillna(1).astype(float)

    # Normalise categoricals to title-case to match encoder expectations
    df["gender_allowed"] = df["gender_allowed"].str.title()
    df["room_type"]      = df["room_type"].str.title()
    df["area"]           = df["area"].fillna("unknown")

    return df


def export_interactions() -> pd.DataFrame:
    from rooms.models import RoomInteraction
    qs = RoomInteraction.objects.all().values(
        "user_id", "room_id", "event_type", "time_spent", "created_at"
    )
    df = pd.DataFrame(list(qs))
    if df.empty:
        return pd.DataFrame(columns=["user_id", "room_id", "event_type",
                                     "time_spent_seconds", "timestamp",
                                     "interaction_score"])
    df.rename(columns={"time_spent": "time_spent_seconds",
                       "created_at": "timestamp"}, inplace=True)
    df["room_id"] = df["room_id"].astype(str)

    def _time_score(s):
        s = float(s or 0)
        if s < 10:  return 0.0
        if s < 30:  return 1.0
        return 2.0

    df["event_weight"]      = df["event_type"].map(INTERACTION_EVENT_WEIGHTS).fillna(1.0)
    df["time_score"]        = df["time_spent_seconds"].apply(_time_score)
    df["interaction_score"] = df["event_weight"] + df["time_score"]
    return df


def export_search_history() -> pd.DataFrame:
    from rooms.models import RoomSearchHistory
    qs = RoomSearchHistory.objects.all().values(
        "user_id", "budget_min", "budget_max",
        "max_distance", "gender_allowed", "created_at"
    )
    df = pd.DataFrame(list(qs))
    if df.empty:
        return pd.DataFrame(columns=["user_id", "budget_min", "budget_max",
                                     "max_distance_km", "wifi", "attached_bath",
                                     "gender_allowed", "timestamp"])
    df.rename(columns={"max_distance": "max_distance_km",
                       "created_at":   "timestamp"}, inplace=True)
    df["wifi"]          = 0
    df["attached_bath"] = 0
    df["gender_allowed"] = df["gender_allowed"].fillna("unknown").str.lower()
    return df


def build_feature_matrix(rooms_df: pd.DataFrame):
    pipeline = ColumnTransformer(transformers=[
        ("cat",  OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS),
        ("num",  MinMaxScaler(),                         NUMERIC_COLS),
        ("bool", "passthrough",                          BOOLEAN_COLS),
    ])
    matrix = pipeline.fit_transform(rooms_df)
    return matrix, pipeline


def main():
    print("Exporting rooms from DB...")
    rooms_df = export_rooms()
    print(f"  {len(rooms_df)} approved rooms exported.")

    print("Building feature matrix...")
    feature_matrix, preprocessor = build_feature_matrix(rooms_df)

    print("Exporting interactions from DB...")
    interactions_df = export_interactions()
    print(f"  {len(interactions_df)} interaction records.")

    print("Exporting search history from DB...")
    search_df = export_search_history()
    print(f"  {len(search_df)} search records.")

    # Save artifacts
    joblib.dump(feature_matrix,   ML_DIR / "room_feature_matrix.pkl")
    joblib.dump(rooms_df["room_id"].tolist(), ML_DIR / "room_ids.pkl")
    joblib.dump({
        "preprocessor":      preprocessor,
        "categorical_columns": CATEGORICAL_COLS,
        "numeric_columns":     NUMERIC_COLS,
        "boolean_columns":     BOOLEAN_COLS,
    }, ML_DIR / "model_artifacts.pkl")
    rooms_df.to_csv(ML_DIR / "rooms_processed.csv", index=False)
    interactions_df.to_csv(ML_DIR / "user_interactions_processed.csv", index=False)
    search_df.to_csv(ML_DIR / "search_history_processed.csv", index=False)

    print(f"\nAll artifacts saved to: {ML_DIR}")
    print("Done. Run this script again whenever rooms or behaviour data changes significantly.")


if __name__ == "__main__":
    main()
