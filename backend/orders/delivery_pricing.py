import math
import os
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import Dict, Optional

import requests
from django.conf import settings
from django.utils import timezone


GOOGLE_DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


class DeliveryPricingError(Exception):
    pass


@dataclass
class RouteMetrics:
    distance_km: float
    duration_min: float
    google_traffic_eta_min: float
    route_link: str
    source: str


def _to_float(value: Optional[float]) -> Optional[float]:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _validate_lat_lng(latitude: Optional[float], longitude: Optional[float], label: str) -> None:
    if latitude is None or longitude is None:
        raise DeliveryPricingError(f"{label} coordinates are required.")
    if not (-90 <= latitude <= 90):
        raise DeliveryPricingError(f"{label} latitude must be between -90 and 90.")
    if not (-180 <= longitude <= 180):
        raise DeliveryPricingError(f"{label} longitude must be between -180 and 180.")


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def _build_route_link(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> str:
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={origin_lat},{origin_lng}"
        f"&destination={dest_lat},{dest_lng}"
        "&travelmode=driving"
    )


def _time_period_from_hour(hour: int) -> str:
    if 5 <= hour <= 10:
        return "Morning"
    if 11 <= hour <= 15:
        return "Afternoon"
    if 16 <= hour <= 18:
        return "Evening"
    if 19 <= hour <= 22:
        return "Dinner"
    return "Night"


def _nearest_ten(value: float) -> int:
    return int(round(value / 10.0) * 10)


def _ensure_ml_dependencies():
    try:
        import joblib  # noqa: F401
    except Exception as exc:  # pragma: no cover - dependency check
        raise DeliveryPricingError(
            "joblib is not installed in backend environment. Run: pip install joblib xgboost scikit-learn pandas"
        ) from exc

    try:
        import pandas  # noqa: F401
    except Exception as exc:  # pragma: no cover - dependency check
        raise DeliveryPricingError(
            "pandas is not installed in backend environment. Run: pip install pandas"
        ) from exc


@lru_cache(maxsize=4)
def _load_model(path: str):
    _ensure_ml_dependencies()
    import joblib

    if not os.path.exists(path):
        raise DeliveryPricingError(f"Model file not found: {path}")
    try:
        return joblib.load(path)
    except Exception as exc:
        raise DeliveryPricingError(f"Failed to load model: {path}") from exc


def _build_model_paths() -> Dict[str, str]:
    eta_path = getattr(settings, "DELIVERY_ETA_MODEL_PATH", "")
    fee_path = getattr(settings, "DELIVERY_FEE_MODEL_PATH", "")
    if not eta_path or not fee_path:
        raise DeliveryPricingError("Delivery model paths are not configured.")
    return {"eta": eta_path, "fee": fee_path}


def _get_route_metrics_from_google(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> RouteMetrics:
    api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
    if not api_key or "your-google-maps-api-key" in api_key.lower():
        raise DeliveryPricingError("GOOGLE_MAPS_API_KEY is missing or placeholder.")

    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "mode": "driving",
        "departure_time": "now",
        "traffic_model": "best_guess",
        "key": api_key,
    }
    timeout = int(getattr(settings, "DELIVERY_AI_TIMEOUT_SECONDS", 20))
    response = requests.get(GOOGLE_DISTANCE_MATRIX_URL, params=params, timeout=timeout)
    response.raise_for_status()

    payload = response.json()
    if payload.get("status") != "OK":
        raise DeliveryPricingError(f"Google Distance Matrix error: {payload.get('status')}")

    rows = payload.get("rows") or []
    elements = rows[0].get("elements") if rows else None
    element = elements[0] if elements else None
    if not element or element.get("status") != "OK":
        status_text = element.get("status") if element else "UNKNOWN"
        raise DeliveryPricingError(f"No route found from Google API: {status_text}")

    distance_km = float(element["distance"]["value"]) / 1000.0
    duration_min = float(element["duration"]["value"]) / 60.0
    traffic_min = float((element.get("duration_in_traffic") or element["duration"])["value"]) / 60.0

    return RouteMetrics(
        distance_km=distance_km,
        duration_min=duration_min,
        google_traffic_eta_min=traffic_min,
        route_link=_build_route_link(origin_lat, origin_lng, dest_lat, dest_lng),
        source="google",
    )


def _get_route_metrics_fallback(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> RouteMetrics:
    distance_km = _haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    base_speed = float(getattr(settings, "DELIVERY_AI_DEFAULT_SPEED_KMPH", 25.0))
    traffic_multiplier = float(getattr(settings, "DELIVERY_AI_FALLBACK_TRAFFIC_MULTIPLIER", 1.15))
    duration_min = max(1.0, (distance_km / max(1.0, base_speed)) * 60.0)
    traffic_eta = duration_min * traffic_multiplier

    return RouteMetrics(
        distance_km=distance_km,
        duration_min=duration_min,
        google_traffic_eta_min=traffic_eta,
        route_link=_build_route_link(origin_lat, origin_lng, dest_lat, dest_lng),
        source="haversine-fallback",
    )


def _get_route_metrics(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> RouteMetrics:
    try:
        return _get_route_metrics_from_google(origin_lat, origin_lng, dest_lat, dest_lng)
    except Exception:
        return _get_route_metrics_fallback(origin_lat, origin_lng, dest_lat, dest_lng)


def estimate_delivery_quote(
    *,
    restaurant_lat: Optional[float],
    restaurant_lng: Optional[float],
    student_lat: Optional[float],
    student_lng: Optional[float],
    order_type: str = "delivery",
    preparation_time_min: float = 0.0,
) -> Dict[str, object]:
    r_lat = _to_float(restaurant_lat)
    r_lng = _to_float(restaurant_lng)
    s_lat = _to_float(student_lat)
    s_lng = _to_float(student_lng)

    _validate_lat_lng(r_lat, r_lng, "Restaurant")
    _validate_lat_lng(s_lat, s_lng, "Student")

    model_paths = _build_model_paths()
    eta_model = _load_model(model_paths["eta"])
    fee_model = _load_model(model_paths["fee"])

    route = _get_route_metrics(r_lat, r_lng, s_lat, s_lng)
    now = timezone.localtime()
    hour = now.hour
    day_of_week = now.strftime("%A")
    day_of_week_num = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(day_of_week)
    time_period = _time_period_from_hour(hour)
    is_weekend = 1 if day_of_week in {"Saturday", "Sunday"} else 0
    is_peak = 1 if time_period in {"Dinner", "Evening"} else 0

    import pandas as pd

    eta_features = pd.DataFrame(
        [
            {
                "distance_km": route.distance_km,
                "duration_min": route.duration_min,
                "hour": hour,
                "day_of_week": day_of_week,
                "time_period": time_period,
                "origin_type": "restaurant",
                "destination_type": "hostel",
            }
        ]
    )
    predicted_traffic_eta = float(eta_model.predict(eta_features)[0])
    predicted_traffic_eta = max(1.0, predicted_traffic_eta)

    fee_features = pd.DataFrame(
        [
            {
                "distance_km": route.distance_km,
                "traffic_duration_min": predicted_traffic_eta,
                "hour": hour,
                "time_period": time_period,
                "is_peak": is_peak,
                "is_weekend": is_weekend,
                "day_of_week_num": day_of_week_num,
            }
        ]
    )
    predicted_fee_raw = max(0.0, float(fee_model.predict(fee_features)[0]))
    predicted_fee_rounded = max(0, _nearest_ten(predicted_fee_raw))

    is_delivery = str(order_type or "delivery").lower() == "delivery"
    delivery_charge = float(predicted_fee_rounded if is_delivery else 0.0)
    delivery_fee_raw = float(predicted_fee_raw if is_delivery else 0.0)
    delivery_fee_rounded = float(predicted_fee_rounded if is_delivery else 0.0)

    prep = max(0.0, float(preparation_time_min or 0.0))
    total_eta = predicted_traffic_eta + prep

    model_version = (
        f"eta={os.path.basename(model_paths['eta'])};"
        f"fee={os.path.basename(model_paths['fee'])}"
    )

    return {
        "distance_km": round(route.distance_km, 3),
        "route_duration_min": round(route.duration_min, 2),
        "google_traffic_eta_min": round(route.google_traffic_eta_min, 2),
        "predicted_traffic_eta_min": round(predicted_traffic_eta, 2),
        "preparation_time_min": round(prep, 2),
        "total_eta_min": round(total_eta, 2),
        "predicted_delivery_fee_raw": round(predicted_fee_raw, 2),
        "predicted_delivery_fee_rounded": float(predicted_fee_rounded),
        "delivery_fee_raw": round(delivery_fee_raw, 2),
        "delivery_fee_rounded": round(delivery_fee_rounded, 2),
        "delivery_charge": round(delivery_charge, 2),
        "maps_route_url": route.route_link,
        "route_source": route.source,
        "time_period": time_period,
        "day_of_week": day_of_week,
        "hour": hour,
        "model_version": model_version,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
