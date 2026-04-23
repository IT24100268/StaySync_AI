import math
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / 'ml' / 'room_recommender.pkl'
META_PATH  = Path(__file__).resolve().parent / 'ml' / 'model_meta.pkl'

model    = joblib.load(MODEL_PATH)
meta     = joblib.load(META_PATH)
encoders = meta['encoders']
FEATURES = meta['feature_cols']

# ── Cache ────────────────────────────────────────────────────────────────────
# FIX #7: cache the hostel DataFrame so every request doesn't trigger a full
# DB scan. Call invalidate_hostel_cache() whenever a room is approved/updated.
_hostel_cache: pd.DataFrame | None = None


def invalidate_hostel_cache() -> None:
    global _hostel_cache
    _hostel_cache = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points (km)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _safe_encode(encoder, value: str, col_name: str):
    """
    FIX #1 / #5: encode a categorical value safely.
    Returns the integer code, or raises ValueError with a clear message
    instead of letting sklearn crash or silently returning -1 into the model.
    """
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    known = list(encoder.classes_)
    raise ValueError(
        f"Unknown value '{value}' for column '{col_name}'. "
        f"Known values: {known}"
    )


def _build_hostels_df() -> pd.DataFrame:
    """
    Query approved rooms from DB, encode features, and return a clean DataFrame.
    Rows with unknown categorical values are DROPPED so they never enter the model.
    """
    global _hostel_cache
    if _hostel_cache is not None:
        return _hostel_cache

    from rooms.models import Room

    qs = Room.objects.filter(status='APPROVED') \
        .exclude(latitude=None).exclude(longitude=None) \
        .values(
            'id', 'hostel_id', 'title', 'area', 'gender_allowed', 'room_type',
            'price', 'estimated_rating', 'latitude', 'longitude', 'address',
            'attached_bathroom', 'ac_available', 'fan_available',
            'furnished', 'study_table', 'cupboard', 'balcony',
        )

    df = pd.DataFrame(list(qs))
    if df.empty:
        return df

    df.rename(columns={'price': 'rent_lkr', 'title': 'listing_name'}, inplace=True)

    # Normalise to match training labels
    df['gender_allowed'] = df['gender_allowed'].str.title()
    df['room_type']      = df['room_type'].str.title()

    df.dropna(
        subset=['hostel_id', 'area', 'gender_allowed', 'room_type', 'rent_lkr'],
        inplace=True,
    )

    # FIX #2: drop hostel rows whose categorical values are not in the encoder.
    # Previously, unknown values were encoded as -1 and silently passed to the
    # model, corrupting predictions.
    def safe_encode_col(col: str) -> pd.Series:
        le = encoders[col]
        mask = df[col].isin(le.classes_)
        encoded = df[col].copy()
        encoded[~mask] = np.nan          # mark unknowns for dropping
        encoded[mask]  = le.transform(df.loc[mask, col])
        return encoded

    df['area_enc']           = safe_encode_col('area')
    df['gender_allowed_enc'] = safe_encode_col('gender_allowed')
    df['room_type_enc']      = safe_encode_col('room_type')

    # Drop rows where ANY categorical encoding failed
    df.dropna(subset=['area_enc', 'gender_allowed_enc', 'room_type_enc'], inplace=True)

    # Convert to int after dropping NaN rows
    df['area_enc']           = df['area_enc'].astype(int)
    df['gender_allowed_enc'] = df['gender_allowed_enc'].astype(int)
    df['room_type_enc']      = df['room_type_enc'].astype(int)

    # Encode boolean facility columns
    facility_cols = [
        'attached_bathroom', 'ac_available', 'fan_available',
        'furnished', 'study_table', 'cupboard', 'balcony',
    ]
    for col in facility_cols:
        df[col + '_enc'] = df[col].astype(int)

    # FIX #4 (estimated_rating): fill missing ratings with the column mean so
    # rooms with no reviews don't look artificially perfect or terrible.
    if df['estimated_rating'].isna().any():
        mean_rating = df['estimated_rating'].mean()
        df['estimated_rating'] = df['estimated_rating'].fillna(mean_rating)

    df.reset_index(drop=True, inplace=True)
    _hostel_cache = df
    return df


def _generate_reason(hostel: pd.Series, student: dict, distance_km: float | None) -> str:
    reasons = []
    rent        = hostel['rent_lkr']
    rent_budget = student['rent_budget']
    wanted      = student['facilities']

    if rent <= rent_budget:
        saving = rent_budget - rent
        reasons.append(
            f"Rent is LKR {int(rent):,} — within your budget "
            f"with LKR {int(saving):,} to spare"
        )
    else:
        reasons.append(f"Rent is LKR {int(rent):,} — slightly over budget but close")

    matched = [f for f in wanted if hostel.get(f + '_enc', 0) == 1]
    if matched:
        names = [f.replace('_', ' ').title() for f in matched]
        reasons.append(f"Has your requested facilities: {', '.join(names)}")

    rating = hostel['estimated_rating']
    if rating >= 4.5:
        reasons.append(f"Highly rated at {rating:.1f}/5.0")
    elif rating >= 4.0:
        reasons.append(f"Well rated at {rating:.1f}/5.0")

    # FIX #8: use actual distance instead of a misleading "near X" label.
    if distance_km is not None:
        if distance_km < 0.5:
            reasons.append(f"Located in {hostel['area']} — very close by")
        elif distance_km < 3.0:
            reasons.append(
                f"Located in {hostel['area']}, "
                f"{distance_km:.1f} km from your preferred area"
            )
        else:
            reasons.append(
                f"Located in {hostel['area']}, "
                f"{distance_km:.1f} km away"
            )
    elif hostel['area'] == student['area']:
        reasons.append(f"Located exactly in {student['area']}")
    else:
        reasons.append(f"Located in {hostel['area']}")

    if hostel['room_type'] == student['room_type']:
        reasons.append(f"Matches your {student['room_type'].lower()} room preference")

    return '. '.join(reasons) + '.'


# ── Public API ────────────────────────────────────────────────────────────────

def recommend_rooms(
    area: str,
    gender: str,
    total_budget: float,
    room_type: str,
    facilities: list[str] | None = None,
    top_n: int = 5,
    student_lat: float | None = None,
    student_lng: float | None = None,
) -> list[dict]:
    """
    Return up to `top_n` ranked room recommendations.

    Parameters
    ----------
    area          : student's preferred area string (must match encoder classes)
    gender        : 'Boys' | 'Girls' | 'Both'
    total_budget  : MONTHLY total budget in LKR  (FIX #3 — callers must pass monthly)
    room_type     : 'Single' | 'Shared'
    facilities    : list of desired facility keys, e.g. ['ac_available', 'furnished']
    top_n         : number of results to return
    student_lat   : optional student GPS latitude  (enables distance feature)
    student_lng   : optional student GPS longitude (enables distance feature)
    """
    if facilities is None:
        facilities = []

    # FIX #3: document that total_budget is monthly. 40 % goes to rent.
    rent_budget = int(total_budget * 0.40)

    # FIX #1 / #5: validate student-side categoricals upfront — fail fast with
    # a clear error rather than silently passing -1 into the model.
    try:
        area_enc   = _safe_encode(encoders['area'],           area,      'area')
        gender_enc = _safe_encode(encoders['gender_allowed'], gender,    'gender_allowed')
        type_enc   = _safe_encode(encoders['room_type'],      room_type, 'room_type')
    except ValueError as exc:
        raise ValueError(f"Invalid student input: {exc}") from exc

    hostels_df = _build_hostels_df()
    if hostels_df.empty:
        return []

    # FIX #9: apply gender filter BEFORE building the pool so the fallback
    # path also respects gender compatibility.
    gender_mask = (
        (hostels_df['gender_allowed'] == gender) |
        (hostels_df['gender_allowed'] == 'Both')
    )
    gender_compatible = hostels_df[gender_mask]

    if gender_compatible.empty:
        return []

    # Prefer exact area; fall back to all gender-compatible rooms if needed.
    area_filtered = gender_compatible[gender_compatible['area'] == area]
    pool = area_filtered if len(area_filtered) >= top_n else gender_compatible

    rows = []
    for _, hostel in pool.iterrows():
        rent = hostel['rent_lkr']

        area_match  = 1.0 if hostel['area'] == area else 0.6
        type_match  = 1.0 if hostel['room_type'] == room_type else 0.0
        h_gender    = hostel['gender_allowed']
        gender_match = 1.0 if h_gender == gender else 0.8  # 'Both' rooms

        # FIX #6: compute haversine distance when coordinates are available and
        # add it as a model feature. Previously lat/lng were stored but ignored.
        if (student_lat is not None and student_lng is not None
                and hostel['latitude'] and hostel['longitude']):
            dist_km = _haversine_km(
                student_lat, student_lng,
                float(hostel['latitude']), float(hostel['longitude']),
            )
            # Normalise: 0 km → 1.0 proximity, 20 km → ~0.0
            proximity_score = max(0.0, 1.0 - dist_km / 20.0)
        else:
            dist_km         = None
            proximity_score = area_match   # fall back to binary area match

        row = {
            'student_area_enc':    area_enc,
            'student_gender_enc':  gender_enc,
            'student_type_enc':    type_enc,
            'student_rent_budget': rent_budget,

            'want_bathroom':  1 if 'attached_bathroom' in facilities else 0,
            'want_ac':        1 if 'ac_available'      in facilities else 0,
            'want_fan':       1 if 'fan_available'      in facilities else 0,
            'want_furnished': 1 if 'furnished'          in facilities else 0,
            'want_study':     1 if 'study_table'        in facilities else 0,
            'want_cupboard':  1 if 'cupboard'           in facilities else 0,
            'want_balcony':   1 if 'balcony'            in facilities else 0,

            'hostel_area_enc':   hostel['area_enc'],
            'hostel_gender_enc': hostel['gender_allowed_enc'],
            'hostel_type_enc':   hostel['room_type_enc'],
            'rent_lkr':          rent,
            'estimated_rating':  hostel['estimated_rating'],
            'has_bathroom':      hostel['attached_bathroom_enc'],
            'has_ac':            hostel['ac_available_enc'],
            'has_fan':           hostel['fan_available_enc'],
            'has_furnished':     hostel['furnished_enc'],
            'has_study':         hostel['study_table_enc'],
            'has_cupboard':      hostel['cupboard_enc'],
            'has_balcony':       hostel['balcony_enc'],

            'rent_over_budget':  max(0, rent - rent_budget),
            'rent_under_budget': max(0, rent_budget - rent),
            'area_match':        area_match,
            'type_match':        type_match,
            'gender_match':      gender_match,
            'proximity_score':   proximity_score,   # FIX #6 — new distance feature

            '_hostel_index': hostel.name,
            '_dist_km':      dist_km,
        }
        rows.append(row)

    if not rows:
        return []

    pred_df = pd.DataFrame(rows)

    # Only pass columns the model was trained on (guards against extra cols crashing predict)
    model_input = pred_df[[c for c in FEATURES if c in pred_df.columns]]
    pred_df['fit_score'] = model.predict(model_input)

    top_df = pred_df.sort_values('fit_score', ascending=False).head(top_n)

    results = []
    for rank, (_, row) in enumerate(top_df.iterrows(), start=1):
        hostel = hostels_df.loc[row['_hostel_index']]
        student_input = {
            'area':        area,
            'gender':      gender,
            'rent_budget': rent_budget,
            'room_type':   room_type,
            'facilities':  facilities,
        }
        results.append({
            'rank':              rank,
            'id':                int(hostel['id']),
            'hostel_id':         hostel['hostel_id'],
            'listing_name':      hostel['listing_name'],
            'area':              hostel['area'],
            'room_type':         hostel['room_type'],
            'gender_allowed':    hostel['gender_allowed'],
            'rent_lkr':          int(hostel['rent_lkr']),
            'estimated_rating':  float(hostel['estimated_rating']),
            'attached_bathroom': bool(hostel['attached_bathroom']),
            'ac_available':      bool(hostel['ac_available']),
            'fan_available':     bool(hostel['fan_available']),
            'furnished':         bool(hostel['furnished']),
            'study_table':       bool(hostel['study_table']),
            'cupboard':          bool(hostel['cupboard']),
            'balcony':           bool(hostel['balcony']),
            'address':           hostel['address'],
            'latitude':          float(hostel['latitude']) if hostel['latitude'] else None,
            'longitude':         float(hostel['longitude']) if hostel['longitude'] else None,
            'distance_km':       round(row['_dist_km'], 2) if row['_dist_km'] is not None else None,
            'fit_score':         round(float(row['fit_score']), 4),
            'reason':            _generate_reason(hostel, student_input, row['_dist_km']),
        })

    return results