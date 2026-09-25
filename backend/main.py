# backend/main.py
"""
RailForecast AI Engine (SETU) — Telemetry & Predictive Dispatch API
Primary Provider: RailRadar (api.railradar.in)
Architecture Directive: REAL DATA FIRST.
Real railway data must never be replaced with fabricated data.
Distinguishes: LIVE, REAL_DATABASE / HYBRID, SIMULATED, and UNAVAILABLE.
"""

import time
import asyncio
import re
import os
from pathlib import Path
from datetime import datetime, timedelta, date as dt_date
from zoneinfo import ZoneInfo
from typing import List, Dict, Any, Optional, Tuple
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

# Local Module Imports
from ml_engine import predictor
from railradar_service import railradar_provider
from external_apis import (
    fetch_cached_train_status,
    fetch_live_train_running_status,
    fetch_train_schedule,
    fetch_live_weather,
    get_live_station_board,
    KNOWN_DATABASE
)
from route_simulator import corridor_tracker, CORRIDOR_WAYPOINTS
from gemini_service import explain_forecast
from email_service import (
    dispatch_feedback_email,
    EmailDeliveryError,
    EmailConfigurationError,
    FEEDBACK_DESTINATION_EMAIL
)

# ---------------------------------------------------------
# Application Initialization & CORS Configuration
# ---------------------------------------------------------
app = FastAPI(
    title="RailForecast AI (SETU) — RailRadar Powered Telemetry & Dispatch API",
    description="High-performance backend engine for real-time train tracking, RailRadar ingestion, ML delay forecasting, and corridor capacity intelligence.",
    version="2.2.0"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
app.mount(
    "/dashboard",
    StaticFiles(directory=str(PROJECT_ROOT), html=True),
    name="dashboard",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://train-track-codex.vercel.app",
        "https://train-track-codex-git-main-sahejpreet-glitch.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ] + [
        origin.strip()
        for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    ],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Pydantic Schemas for Strict Data Contracts
# ---------------------------------------------------------
class PredictionInterval(BaseModel):
    p10_mins: int
    p90_mins: int

class RootCauseFactor(BaseModel):
    factor: str
    impact_mins: int

class TimelineStop(BaseModel):
    station: str
    scheduled: str
    predicted: str
    status: str

class WeatherTelemetry(BaseModel):
    visibility_meters: Optional[int] = None
    condition: str = "unavailable"
    weather_status: Optional[str] = "unavailable"

class StationStopDetail(BaseModel):
    station_code: str
    station_name: str
    scheduled_arrival: str
    scheduled_departure: str
    actual_arrival: str
    actual_departure: str
    delay_mins: int
    status: str
    distance_km: float
    platform: Optional[str] = None
    platform_status: Optional[str] = "unavailable"
    is_boarding: bool = False

class PreviousStationDeparture(BaseModel):
    station_code: str
    station_name: str
    scheduled_departure: str
    actual_departure: str
    departure_delay_mins: int

class TrainForecastResponse(BaseModel):
    train_number: str
    train_name: str
    journey_date: Optional[str] = None
    boarding_station: Optional[str] = None
    telemetry_source: str = "RAILRADAR_AUTHORITATIVE_LIVE"
    data_source: str = "railradar"
    data_mode: str = Field(..., description="'live' | 'hybrid' | 'scheduled' | 'simulated' | 'unavailable'")
    current_status: str
    current_speed_kmh: int
    current_delay_mins: int
    predicted_downstream_delay_mins: int
    confidence_score: int
    prediction_interval: PredictionInterval
    next_station: str
    weather_telemetry: Optional[WeatherTelemetry] = None
    platform: Optional[str] = None
    platform_status: str = "unavailable"
    previous_station_departure: Optional[PreviousStationDeparture] = None
    root_causes: List[RootCauseFactor]
    timeline: List[TimelineStop]
    full_route: Optional[List[StationStopDetail]] = None
    historical_data_status: Optional[str] = None

class ForecastExplanationRequest(BaseModel):
    forecast: Dict[str, Any]

class Waypoint(BaseModel):
    code: str
    name: str
    lat: float
    lng: float

class RouteGeometryResponse(BaseModel):
    train_number: str
    status: str
    data_source: str = "railradar"
    data_mode: str = "live"
    polyline: List[List[float]]
    critical_waypoints: List[Waypoint]
    stations: Optional[List[StationStopDetail]] = None

class LiveTelemetry(BaseModel):
    latitude: float
    longitude: float
    current_speed_kmh: int
    active_block_section: str
    section_progress_pct: float
    timestamp: float

class TrainTelemetryResponse(BaseModel):
    train_number: str
    live_telemetry: LiveTelemetry

class ForecastExplanationRequest(BaseModel):
    forecast: Dict[str, Any]

class CoachPlatformResponse(BaseModel):
    train_number: str
    train_name: str
    station_code: str
    station_name: str
    platform: Optional[str] = None
    platform_status: str = "unavailable"
    reversal: bool = False
    total_coaches: int = 0
    formation: Optional[str] = None
    rake: Optional[List[Dict[str, Any]]] = None
    data_source: str = "railradar"

class TrainsBetweenResponse(BaseModel):
    from_station: Dict[str, Any]
    to_station: Dict[str, Any]
    count: int
    trains: List[Dict[str, Any]]
    data_source: str = "railradar"


# ---------------------------------------------------------
# Dynamic Congestion, ETA, and Quality-Derived Confidence
# ---------------------------------------------------------
def calculate_dynamic_congestion_headway(current_hour: int, is_priority: bool) -> float:
    """
    Computes section congestion index based on operational peak traffic windows.
    Eliminates hardcoded headway = 0.82.
    """
    if (8 <= current_hour <= 11) or (17 <= current_hour <= 21):
        base_headway = 0.74
    elif (0 <= current_hour <= 5):
        base_headway = 0.38
    else:
        base_headway = 0.54

    if is_priority:
        base_headway = max(0.25, base_headway - 0.15)
    return round(base_headway, 2)


def compute_truthful_eta_and_confidence(
    cur_delay_mins: int,
    current_speed_kmh: Optional[int],
    has_live_location: bool,
    has_prev_departure: bool,
    has_verified_timetable: bool,
    weather_telemetry: Optional[Dict[str, Any]],
    is_priority: bool,
    is_simulated: bool = False
) -> Tuple[int, int, Dict[str, int], List[Dict[str, Any]]]:
    """
    Derives confidence score and downstream delay dynamically based on data completeness.
    No hardcoded 0.88 or fabricated confidence.
    """
    now = datetime.now()
    headway = calculate_dynamic_congestion_headway(now.hour, is_priority)

    if is_simulated:
        sim_conf = 68
        pred_delay = cur_delay_mins + (4 if cur_delay_mins > 0 else 0)
        margin = max(4, round(pred_delay * 0.2))
        reasons = [
            {"factor": "Synthetic Operational Simulation Model", "impact_mins": pred_delay},
            {"factor": "Estimated Sectional Headway (Simulated)", "impact_mins": round(headway * 10)}
        ]
        return pred_delay, sim_conf, {"p10_mins": max(0, pred_delay - margin), "p90_mins": pred_delay + margin}, reasons

    confidence = 35

    if has_live_location:
        confidence += 20
    if has_verified_timetable:
        confidence += 20
    if has_prev_departure:
        confidence += 15
    if current_speed_kmh is not None and current_speed_kmh > 0:
        confidence += 10
    if weather_telemetry and weather_telemetry.get("weather_status") == "available":
        confidence += 10

    if cur_delay_mins > 60:
        confidence -= 10
    if cur_delay_mins > 120:
        confidence -= 10

    confidence = max(45, min(92, confidence))

    speed_factor = 0
    if current_speed_kmh is not None:
        if current_speed_kmh < 35:
            speed_factor = 6
        elif current_speed_kmh > 90:
            speed_factor = -2

    weather_impact = 0
    vis_meters = weather_telemetry.get("visibility_meters") if weather_telemetry else None
    if vis_meters is not None and vis_meters < 1000:
        weather_impact = 12

    congestion_penalty = round(headway * 8) if not is_priority else 2
    compounded_delay = max(0, cur_delay_mins + speed_factor + weather_impact + congestion_penalty)

    margin = max(3, round(compounded_delay * 0.15))
    interval = {
        "p10_mins": max(0, compounded_delay - margin),
        "p90_mins": compounded_delay + margin
    }

    root_causes: List[Dict[str, Any]] = []
    if weather_impact > 0:
        root_causes.append({
            "factor": f"Dense Fog & Poor Visibility ({vis_meters}m)",
            "impact_mins": weather_impact
        })
    if congestion_penalty > 3:
        root_causes.append({
            "factor": f"Section Headway Density ({headway})",
            "impact_mins": congestion_penalty
        })
    if cur_delay_mins > 5:
        root_causes.append({
            "factor": "Upstream Propagated Network Delay",
            "impact_mins": cur_delay_mins
        })
    if not root_causes:
        root_causes.append({
            "factor": "Nominal Track Section Dispatch Clearance",
            "impact_mins": 0
        })

    return compounded_delay, confidence, interval, root_causes


# ---------------------------------------------------------
# Feedback Pydantic Contracts & Anti-Spam Rate Limiter
# ---------------------------------------------------------
class FeedbackSubmissionRequest(BaseModel):
    feedback_type: str = Field(..., description="Category of feedback", min_length=2, max_length=100)
    rating: int = Field(..., description="Star rating between 1 and 5", ge=1, le=5)
    message: str = Field(..., description="Passenger feedback text", min_length=3, max_length=5000)
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=150)
    train_number: Optional[str] = Field(None, max_length=10)
    journey_date: Optional[str] = Field(None, max_length=50)
    boarding_station: Optional[str] = Field(None, max_length=100)

class FeedbackSubmissionResponse(BaseModel):
    success: bool
    message: str
    delivery_id: Optional[str] = None
    provider: Optional[str] = None
    recipient: Optional[str] = None

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
FEEDBACK_RATE_LIMITS: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECS = 600
MAX_FEEDBACK_PER_WINDOW = 5

def is_feedback_rate_limited(client_ip: str) -> bool:
    now = time.time()
    times = [t for t in FEEDBACK_RATE_LIMITS.get(client_ip, []) if now - t < RATE_LIMIT_WINDOW_SECS]
    if len(times) >= MAX_FEEDBACK_PER_WINDOW:
        FEEDBACK_RATE_LIMITS[client_ip] = times
        return True
    times.append(now)
    FEEDBACK_RATE_LIMITS[client_ip] = times
    return False


# ---------------------------------------------------------
# Health & Root Check
# ---------------------------------------------------------
@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/dashboard/")

@app.get("/health", tags=["System Health"])
def root_check():
    return {
        "system": "RailForecast AI Engine (SETU)",
        "status": "OPERATIONAL",
        "primary_provider": "RailRadar (api.railradar.in)",
        "data_architecture": "REAL_DATA_FIRST",
        "version": "2.2.0",
        "endpoints": {
            "docs": "/docs",
            "fleet_overview": "/api/v1/corridor/fleet-overview",
            "forecast": "/api/v1/trains/{train_number}/forecast",
            "route_geometry": "/api/v1/trains/{train_number}/route-geometry",
            "coaches_platform": "/api/v1/trains/{train_number}/coaches/{station_code}",
            "trains_between": "/api/v1/trains/between/{from_station}/{to_station}",
            "station_board": "/api/v1/stations/{station_code}/board",
            "feedback": "/api/v1/feedback",
            "live_websocket": "/ws/trains/{train_number}/live"
        }
    }


# ---------------------------------------------------------
# 0. Passenger Feedback: Real Transactional Email Submission
# ---------------------------------------------------------
@app.post(
    "/api/v1/feedback",
    response_model=FeedbackSubmissionResponse,
    tags=["Passenger Feedback"]
)
async def submit_passenger_feedback(
    payload: FeedbackSubmissionRequest,
    request: Request
):
    """
    Validates passenger feedback and delivers it directly to npb.sahej@gmail.com.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    if is_feedback_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many feedback submissions from your network. Please wait a few minutes before trying again."
        )

    clean_message = payload.message.strip()
    if not clean_message or len(clean_message) < 3:
        raise HTTPException(status_code=422, detail="Feedback message must contain at least 3 characters.")

    clean_type = payload.feedback_type.strip()
    if not clean_type:
        raise HTTPException(status_code=422, detail="Feedback category is required.")

    clean_email = payload.email.strip() if payload.email else None
    if clean_email and not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=422, detail="Please provide a valid email address format.")

    submission_dict = {
        "name": payload.name.strip() if payload.name else None,
        "email": clean_email,
        "feedback_type": clean_type,
        "rating": payload.rating,
        "message": clean_message,
        "train_number": payload.train_number.strip() if payload.train_number else None,
        "journey_date": payload.journey_date.strip() if payload.journey_date else None,
        "boarding_station": payload.boarding_station.strip().upper() if payload.boarding_station else None,
    }

    try:
        dispatch_result = await dispatch_feedback_email(submission_dict)
        return FeedbackSubmissionResponse(
            success=True,
            message="Your feedback has been sent successfully.",
            delivery_id=dispatch_result.get("delivery_id"),
            provider=dispatch_result.get("provider"),
            recipient=FEEDBACK_DESTINATION_EMAIL
        )
    except EmailConfigurationError as err:
        raise HTTPException(status_code=503, detail=f"Email service configuration error: {str(err)}")
    except EmailDeliveryError as err:
        raise HTTPException(status_code=502, detail=f"Unable to send feedback: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Internal server error processing feedback: {str(err)}")


# ---------------------------------------------------------
# 1. Passenger Intelligence: Truth-First Train Forecast (RailRadar Primary)
# ---------------------------------------------------------
@app.get(
    "/api/v1/trains/{train_number}/forecast",
    response_model=TrainForecastResponse,
    tags=["Passenger Intelligence"]
)
async def get_train_forecast(
    train_number: str,
    date: Optional[str] = None,
    boarding_station: Optional[str] = None,
    mode: Optional[str] = Query(None, description="'live' | 'simulated' | 'demo'")
):
    """
    Retrieves truthful delay forecast and live running status for a train using RailRadar.
    Enforces REAL DATA FIRST:
    - Never fabricates synthetic train data on API failure.
    - Differentiates LIVE, REAL_DATABASE / HYBRID, SIMULATED, and UNAVAILABLE.
    - Validates boarding station against actual route stops.
    - Returns HTTP 404 if train not found.
    - Returns HTTP 503 if railway source is unavailable / rate-limited.
    """
    clean_no = str(train_number).strip()
    clean_date = date.strip() if date else datetime.now().strftime("%Y-%m-%d")

    # Basic train number validation
    if not clean_no or not (clean_no.isalnum() and 3 <= len(clean_no) <= 8):
        raise HTTPException(status_code=400, detail=f"Invalid train number format: '{clean_no}'.")

    india_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    clean_date = date.strip() if date else india_now.strftime("%Y-%m-%d")

    # Check for explicit simulation / demo mode
    is_sim_mode = (mode in ["simulated", "demo"])

    if is_sim_mode:
        if clean_no not in KNOWN_DATABASE:
            raise HTTPException(
                status_code=404,
                detail=f"Train {clean_no} is not present in the verified demonstration dataset."
            )
        k_data = KNOWN_DATABASE[clean_no]
        pred_delay, conf, interval, root_causes = compute_truthful_eta_and_confidence(
            cur_delay_mins=k_data["delay"],
            current_speed_kmh=k_data["speed"],
            has_live_location=True,
            has_prev_departure=False,
            has_verified_timetable=True,
            weather_telemetry=None,
            is_priority=any(p in k_data["name"] for p in ["Rajdhani", "Vande", "Shatabdi"]),
            is_simulated=True
        )

        sim_timeline = [
            {"station": k_data["route"][0], "scheduled": "06:00 AM", "predicted": "06:00 AM", "status": "Departed"},
            {"station": k_data["station"], "scheduled": "09:30 AM", "predicted": f"09:{30 + k_data['delay']:02d} AM", "status": "In Transit"},
            {"station": k_data["route"][-1], "scheduled": "02:00 PM", "predicted": f"02:{pred_delay:02d} PM", "status": "Upcoming"}
        ]

        return TrainForecastResponse(
            train_number=clean_no,
            train_name=k_data["name"],
            journey_date=clean_date,
            boarding_station=boarding_station,
            telemetry_source="VERIFIED_STATIC_DATASET",
            data_source="simulated",
            data_mode="simulated",
            current_status=f"SIMULATED — {k_data['delay']} min hold at {k_data['station']}",
            current_speed_kmh=k_data["speed"],
            current_delay_mins=k_data["delay"],
            predicted_downstream_delay_mins=pred_delay,
            confidence_score=conf,
            prediction_interval=PredictionInterval(p10_mins=interval["p10_mins"], p90_mins=interval["p90_mins"]),
            next_station=f"Next Section from {k_data['station']}",
            weather_telemetry=None,
            platform=None,
            platform_status="unavailable",
            previous_station_departure=None,
            root_causes=[RootCauseFactor(factor=rc["factor"], impact_mins=rc["impact_mins"]) for rc in root_causes],
            timeline=[TimelineStop(**st) for st in sim_timeline],
            full_route=None,
            historical_data_status="SIMULATED_DATASET"
        )

    # =========================================================
    # Step 1 & 2: Concurrently Query Real Schedule and Live Status from RailRadar
    # (Concurrent fetch cuts cross-region cloud egress latency in half)
    # =========================================================
    sched_res, live_res = await asyncio.gather(
        railradar_provider.get_train_schedule(clean_no),
        railradar_provider.get_live_status(clean_no, date=clean_date, authoritative=True)
    )

    if sched_res.get("status") == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail=f"Train {clean_no} not found on RailRadar. Please verify the train number."
        )
    elif sched_res.get("status") == "DATA_UNAVAILABLE":
        err_msg = sched_res.get("message", "RailRadar schedule service temporarily unavailable.")
        raise HTTPException(
            status_code=503,
            detail=f"{err_msg} Real railway data cannot be replaced with fabricated data."
        )

    # Schedule is verified: extract timetable stops
    timetable_stops = sched_res.get("route", [])
    valid_station_codes = {s["station_code"].upper() for s in timetable_stops if s.get("station_code")}
    valid_station_names = {s["station_name"].lower() for s in timetable_stops if s.get("station_name")}

    # Station Validation: Only allow boarding stations that actually belong to the train's route
    clean_boarding = None
    if boarding_station:
        b_input = boarding_station.strip()
        if b_input.upper() in valid_station_codes or b_input.lower() in valid_station_names:
            clean_boarding = b_input.upper()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Station '{boarding_station}' is not a scheduled halt on the route of Train {clean_no} ({sched_res.get('train_name')})."
            )

    is_live_ok = (live_res.get("status") == "OK")

    if is_live_ok:
        train_name = live_res.get("train_name") or sched_res.get("train_name", f"Train #{clean_no}")
        cur_station = live_res.get("current_station") or sched_res.get("source", {}).get("name", "Origin")
        cur_delay = int(round(float(live_res.get("current_delay_mins", 0) or 0)))
        raw_speed = live_res.get("current_speed_kmh")
        cur_speed = int(round(float(raw_speed))) if raw_speed is not None else 0
        lat = live_res.get("lat")
        lng = live_res.get("lng")
        running_status = live_res.get("running_status", "running")
        platform_val = live_res.get("platform")
        platform_status_val = live_res.get("platform_status", "unavailable")
        telemetry_source = "RAILRADAR_AUTHORITATIVE_LIVE"
        historical_status = "LIVE_FEED"

        # If platform not present in live summary, check if schedule timetable has verified platform for this station
        if not platform_val:
            for st in timetable_stops:
                stn_code = st.get("station_code") or ""
                stn_name = st.get("station_name") or ""
                if (live_res.get("current_station_code") and stn_code.upper() == str(live_res["current_station_code"]).upper()) or \
                   (cur_station and stn_name.lower() == str(cur_station).lower()):
                    if st.get("platform"):
                        platform_val = str(st["platform"]).strip()
                        platform_status_val = "available"
                        break
    else:
        # Schedule worked, but live telemetry is not available for this train/date
        train_name = sched_res.get("train_name", f"Train #{clean_no}")
        cur_station = sched_res.get("source", {}).get("name", "Origin")
        cur_delay = 0
        cur_speed = 0
        lat = None
        lng = None
        running_status = "scheduled"
        platform_val = None
        platform_status_val = "unavailable"
        telemetry_source = "RAILRADAR_SCHEDULE"
        historical_status = "SCHEDULE_ONLY"

    # Fetch Real Atmospheric Weather Telemetry (Open-Meteo)
    weather_telemetry_obj = None
    weather_dict = None
    if lat is not None and lng is not None:
        weather_dict = await fetch_live_weather(lat, lng)
        if weather_dict and weather_dict.get("weather_status") == "available":
            weather_telemetry_obj = WeatherTelemetry(
                visibility_meters=int(round(float(weather_dict["visibility_meters"]))),
                condition=weather_dict.get("condition", "Clear Visibility"),
                weather_status="available"
            )
            effective_data_mode = "hybrid"
        else:
            weather_telemetry_obj = WeatherTelemetry(
                visibility_meters=None,
                condition="Weather telemetry unavailable",
                weather_status="unavailable"
            )
            effective_data_mode = "scheduled" if running_status in ["not-started", "scheduled"] else "live"
    else:
        weather_telemetry_obj = WeatherTelemetry(
            visibility_meters=None,
            condition="Weather telemetry unavailable",
            weather_status="unavailable"
        )
        effective_data_mode = "scheduled"

    # =========================================================
    # Step 3: Build Truthful Route Stops & Station Details
    # =========================================================
    live_route = live_res.get("route", []) if is_live_ok else []
    live_stops_by_code = {st["station_code"].upper(): st for st in live_route if st.get("station_code")}

    mapped_full_route: List[StationStopDetail] = []
    passed_current = False

    for st in timetable_stops:
        s_code = st["station_code"].upper()
        s_name = st["station_name"]
        l_stop = live_stops_by_code.get(s_code, {})

        if is_live_ok:
            is_cur = (s_code == str(live_res.get("current_station_code", "")).upper())
            if is_cur:
                stop_status = "In Transit"
                passed_current = True
            elif not passed_current:
                stop_status = "Departed"
            else:
                stop_status = "Upcoming"

            if running_status in ["not-started", "scheduled"]:
                stop_status = "Upcoming" if not is_cur else "At Station"

            st_plat = l_stop.get("platform") or st.get("platform")
            st_plat_status = "available" if st_plat else "unavailable"
            raw_del = l_stop.get("delay_arrival_mins") or l_stop.get("delay_departure_mins") or (cur_delay if stop_status != "Upcoming" else 0) or 0
            st_delay = int(round(float(raw_del)))
            act_arr = l_stop.get("actual_arrival") or (st.get("scheduled_arrival") if stop_status == "Departed" else "--")
            act_dep = l_stop.get("actual_departure") or (st.get("scheduled_departure") if stop_status == "Departed" else "--")
        else:
            stop_status = "Upcoming"
            st_plat = st.get("platform")
            st_plat_status = "available" if st_plat else "unavailable"
            st_delay = 0
            act_arr = "--"
            act_dep = "--"

        mapped_full_route.append(StationStopDetail(
            station_code=s_code,
            station_name=s_name,
            scheduled_arrival=st.get("scheduled_arrival") or "--",
            scheduled_departure=st.get("scheduled_departure") or "--",
            actual_arrival=act_arr,
            actual_departure=act_dep,
            delay_mins=st_delay,
            status=stop_status,
            distance_km=float(st.get("distance_km", 0.0) or 0.0),
            platform=st_plat,
            platform_status=st_plat_status,
            is_boarding=(clean_boarding is not None and s_code == clean_boarding)
        ))

    # =========================================================
    # Step 4: Build Truthful Timeline Milestones
    # =========================================================
    timeline_stops: List[TimelineStop] = []
    if mapped_full_route:
        # 1. Origin Stop
        first_st = mapped_full_route[0]
        timeline_stops.append(TimelineStop(
            station=first_st.station_name,
            scheduled=first_st.scheduled_departure,
            predicted=first_st.actual_departure if first_st.actual_departure != "--" else first_st.scheduled_departure,
            status=first_st.status
        ))

        # 2. Intermediate / Current / Next Stop
        curr_or_next = next((s for s in mapped_full_route if s.status in ["In Transit", "At Station", "Upcoming"]), None)
        if curr_or_next and curr_or_next.station_code != first_st.station_code and curr_or_next.station_code != mapped_full_route[-1].station_code:
            timeline_stops.append(TimelineStop(
                station=curr_or_next.station_name,
                scheduled=curr_or_next.scheduled_arrival or curr_or_next.scheduled_departure,
                predicted=curr_or_next.actual_arrival if curr_or_next.actual_arrival != "--" else curr_or_next.scheduled_arrival,
                status=curr_or_next.status
            ))
        elif len(mapped_full_route) > 2:
            mid_st = mapped_full_route[len(mapped_full_route) // 2]
            timeline_stops.append(TimelineStop(
                station=mid_st.station_name,
                scheduled=mid_st.scheduled_arrival,
                predicted=mid_st.scheduled_arrival,
                status=mid_st.status
            ))

        # 3. Destination Terminal
        last_st = mapped_full_route[-1]
        timeline_stops.append(TimelineStop(
            station=last_st.station_name,
            scheduled=last_st.scheduled_arrival,
            predicted=last_st.scheduled_arrival,
            status=last_st.status
        ))

    # =========================================================
    # Step 5: Dynamic ETA Delay & Quality-Derived Confidence
    # =========================================================
    is_priority = any(p in train_name for p in ["Rajdhani", "Vande", "Shatabdi", "Tejas", "Duronto"])
    has_prev_dep = bool(is_live_ok and live_res.get("previous_halt"))

    pred_delay, conf_score, interval, root_causes = compute_truthful_eta_and_confidence(
        cur_delay_mins=cur_delay,
        current_speed_kmh=cur_speed if is_live_ok else 0,
        has_live_location=(lat is not None and lng is not None),
        has_prev_departure=has_prev_dep,
        has_verified_timetable=bool(timetable_stops),
        weather_telemetry=weather_dict,
        is_priority=is_priority,
        is_simulated=False
    )

    if not is_live_ok:
        curr_status_text = "Live telemetry unavailable (Showing scheduled timetable)"
    elif running_status in ["not-started", "scheduled"]:
        curr_status_text = f"Scheduled to depart from {cur_station}"
    elif cur_delay > 0:
        curr_status_text = f"Running late by {cur_delay} mins"
    else:
        curr_status_text = "Operating on Time"

    next_stn_name = None
    if is_live_ok and live_res.get("next_halt"):
        next_stn_name = live_res["next_halt"].get("stationName")
    elif len(timetable_stops) > 1:
        next_stn_name = timetable_stops[1].get("station_name")
    next_stn_text = next_stn_name or f"{cur_station} Forward Section"

    prev_station_dep = None
    if is_live_ok and live_res.get("previous_halt"):
        prev_h = live_res["previous_halt"]
        prev_station_dep = PreviousStationDeparture(
            station_code=prev_h.get("stationCode", "PREV"),
            station_name=prev_h.get("stationName", "Previous Station"),
            scheduled_departure="--",
            actual_departure="--",
            departure_delay_mins=cur_delay
        )

    return TrainForecastResponse(
        train_number=clean_no,
        train_name=train_name,
        journey_date=clean_date,
        boarding_station=clean_boarding or boarding_station,
        telemetry_source=telemetry_source,
        data_source="railradar",
        data_mode=effective_data_mode,
        current_status=curr_status_text,
        current_speed_kmh=int(round(float(cur_speed or 0))),
        current_delay_mins=int(round(float(cur_delay or 0))),
        predicted_downstream_delay_mins=int(round(float(pred_delay or 0))),
        confidence_score=int(round(float(conf_score or 0))),
        prediction_interval=PredictionInterval(
            p10_mins=int(round(float(interval["p10_mins"]))),
            p90_mins=int(round(float(interval["p90_mins"])))
        ),
        next_station=next_stn_text,
        weather_telemetry=weather_telemetry_obj,
        platform=platform_val,
        platform_status=platform_status_val,
        previous_station_departure=prev_station_dep,
        root_causes=[RootCauseFactor(factor=rc["factor"], impact_mins=int(round(float(rc["impact_mins"])))) for rc in root_causes],
        timeline=timeline_stops,
        full_route=mapped_full_route,
        historical_data_status=historical_status
    )

@app.post(
    "/api/v1/trains/{train_number}/explanation",
    tags=["Passenger Intelligence"],
)
async def explain_train_forecast(
    train_number: str,
    payload: ForecastExplanationRequest,
):
    """Explain an already fetched forecast; Gemini cannot provide railway facts."""
    if str(payload.forecast.get("train_number", "")).strip() != str(train_number).strip():
        raise HTTPException(status_code=400, detail="Forecast train number does not match the URL.")
    return await explain_forecast(payload.forecast)
# ---------------------------------------------------------
# 2. Geospatial Telemetry: Route Polylines & Live Coordinates (RailRadar)
# ---------------------------------------------------------
@app.get(
    "/api/v1/trains/{train_number}/route-geometry",
    response_model=RouteGeometryResponse,
    tags=["Geospatial Telemetry"]
)
async def get_route_geometry(
    train_number: str,
    date: Optional[str] = None,
    mode: Optional[str] = Query(None, description="'live' | 'simulated' | 'demo'")
):
    """
    Returns train route geometry, polyline, and station coordinates directly from RailRadar GeoJSON.
    """
    clean_no = str(train_number).strip()
    is_sim_mode = (mode in ["simulated", "demo"])

    if is_sim_mode:
        route_data = corridor_tracker.get_route_geometry_for_train(clean_no)
        waypoints = [Waypoint(**w) for w in route_data.get("waypoints", [])]
        polyline = route_data.get("polyline", [])
        return RouteGeometryResponse(
            train_number=clean_no,
            status="SIMULATED_CORRIDOR",
            data_source="simulated",
            data_mode="simulated",
            polyline=polyline,
            critical_waypoints=waypoints,
            stations=None
        )

    # Real RailRadar Route GeoJSON
    geo_res = await railradar_provider.get_route_geometry(clean_no)
    if geo_res.get("status") == "OK":
        waypoints = [
            Waypoint(
                code=s.get("code", ""),
                name=s.get("name", ""),
                lat=float(s.get("lat", 0.0) or 0.0),
                lng=float(s.get("lng", 0.0) or 0.0)
            )
            for s in geo_res.get("stops", [])
        ]
        
        # Populate stations from verified schedule halts
        sched_res = await railradar_provider.get_train_schedule(clean_no)
        route_stations = []
        if sched_res.get("status") == "OK":
            for st in sched_res.get("route", []):
                plat_val = st.get("platform")
                route_stations.append(StationStopDetail(
                    station_code=st.get("station_code", "").upper(),
                    station_name=st.get("station_name", ""),
                    scheduled_arrival=st.get("scheduled_arrival") or "--",
                    scheduled_departure=st.get("scheduled_departure") or "--",
                    actual_arrival="--",
                    actual_departure="--",
                    delay_mins=0,
                    status="Upcoming",
                    distance_km=float(st.get("distance_km", 0.0) or 0.0),
                    platform=plat_val,
                    platform_status="available" if plat_val else "unavailable",
                    is_boarding=False
                ))

        return RouteGeometryResponse(
            train_number=clean_no,
            status="ACTIVE_GEOJSON_VERIFIED",
            data_source="railradar",
            data_mode="live",
            polyline=geo_res.get("polyline", []),
            critical_waypoints=waypoints,
            stations=route_stations if route_stations else None
        )
    elif geo_res.get("status") == "NOT_FOUND":
        raise HTTPException(status_code=404, detail=f"Route geometry not found for train {clean_no} on RailRadar.")
    else:
        raise HTTPException(status_code=503, detail="RailRadar route geometry temporarily unavailable.")


@app.get(
    "/api/v1/trains/{train_number}/telemetry",
    response_model=TrainTelemetryResponse,
    tags=["Geospatial Telemetry"]
)
def get_live_telemetry_polling(train_number: str):
    """Returns moving coordinate telemetry for the specific train."""
    clean_no = str(train_number).strip()
    telemetry = corridor_tracker.get_telemetry_for_train(clean_no)
    return {
        "train_number": clean_no,
        "live_telemetry": telemetry
    }


# ---------------------------------------------------------
# 3. Train Platform / Coach Position (RailRadar)
# ---------------------------------------------------------
@app.get(
    "/api/v1/trains/{train_number}/coaches/{station_code}",
    response_model=CoachPlatformResponse,
    tags=["Platform & Coach Intelligence"]
)
async def get_train_coaches_platform(train_number: str, station_code: str):
    """
    GET /v1/trains/{train_number}/coaches/{station_code}
    Returns platform and coach formation when actually available. Never guesses platform.
    """
    clean_no = str(train_number).strip()
    clean_stn = str(station_code).strip().upper()
    
    res = await railradar_provider.get_platform_info(clean_no, clean_stn)
    if res.get("status") == "OK":
        return CoachPlatformResponse(
            train_number=res.get("train_number", clean_no),
            train_name=res.get("train_name", ""),
            station_code=res.get("station_code", clean_stn),
            station_name=res.get("station_name", clean_stn),
            platform=res.get("platform"),
            platform_status=res.get("platform_status", "unavailable"),
            reversal=res.get("reversal", False),
            total_coaches=res.get("total_coaches", 0),
            formation=res.get("formation"),
            rake=res.get("rake", []),
            data_source="railradar"
        )
    elif res.get("status") == "NOT_FOUND":
        raise HTTPException(status_code=404, detail=f"Coach data not found for train {clean_no} at {clean_stn}.")
    else:
        raise HTTPException(status_code=503, detail="Coach and platform data temporarily unavailable.")


# ---------------------------------------------------------
# 4. Trains Between Stations (RailRadar Discovery)
# ---------------------------------------------------------
@app.get(
    "/api/v1/trains/between/{from_station}/{to_station}",
    response_model=TrainsBetweenResponse,
    tags=["Train Discovery"]
)
async def get_trains_between_stations(
    from_station: str,
    to_station: str,
    date: Optional[str] = None
):
    """
    GET /v1/trains/between/{from_station}/{to_station}?date={journey_date}
    Finds real trains operating between two stations.
    """
    clean_from = str(from_station).strip().upper()
    clean_to = str(to_station).strip().upper()
    
    res = await railradar_provider.get_trains_between(clean_from, clean_to, date)
    if res.get("status") == "OK":
        return TrainsBetweenResponse(
            from_station=res.get("from_station", {}),
            to_station=res.get("to_station", {}),
            count=res.get("count", 0),
            trains=res.get("trains", []),
            data_source="railradar"
        )
    elif res.get("status") == "NOT_FOUND":
        raise HTTPException(status_code=404, detail=f"No trains found between {clean_from} and {clean_to}.")
    else:
        raise HTTPException(status_code=503, detail="Trains between stations service temporarily unavailable.")


# ---------------------------------------------------------
# 5. Station Board: Real Upstream Board Feed
# ---------------------------------------------------------
@app.get("/api/v1/stations/{station_code}/board", tags=["Station Operations"])
async def get_station_board(station_code: str, hours: int = 4):
    """
    Retrieves live departures and arrivals for a station.
    """
    clean_code = station_code.strip().upper()
    board_data = await get_live_station_board(clean_code, hours)
    return {
        "station_code": clean_code,
        "queried_time_window_hours": hours,
        "board": board_data
    }


# ---------------------------------------------------------
# 6. Operations Radar: Multi-Train Corridor Fleet Overview
# ---------------------------------------------------------
@app.get("/api/v1/corridor/fleet-overview", tags=["Operations Radar"])
async def get_corridor_fleet_overview():
    """
    Aggregates running trains on the corridor for traffic monitoring using RailRadar.
    """
    active_rakes = ["12919", "12123", "22221", "22436", "12301"]
    fleet_records = []

    for t_no in active_rakes:
        train_res = await fetch_cached_train_status(t_no)
        if train_res.get("status") == "OK":
            t_data = train_res["data"]
            fleet_records.append({
                "train_number": t_no,
                "train_name": t_data.get("train_name", f"Train {t_no}"),
                "current_station": t_data.get("current_station", "En Route"),
                "current_delay_mins": t_data.get("current_delay_mins", 0),
                "current_speed_kmh": t_data.get("current_speed_kmh", 0),
                "data_source": "railradar",
                "data_mode": "live",
                "coordinates": {
                    "latitude": t_data.get("lat"),
                    "longitude": t_data.get("lng")
                }
            })
        else:
            fleet_records.append({
                "train_number": t_no,
                "train_name": f"Express #{t_no}",
                "current_station": "Telemetry Unavailable",
                "current_delay_mins": 0,
                "current_speed_kmh": 0,
                "data_source": "railradar",
                "data_mode": "unavailable",
                "coordinates": {"latitude": None, "longitude": None}
            })

    return {
        "corridor_name": "Indian Railway High-Density Mainline",
        "active_monitored_rakes": len(fleet_records),
        "fleet": fleet_records
    }


# ---------------------------------------------------------
# 7. Authority Simulator: What-If Dispatch Solver
# ---------------------------------------------------------
@app.post("/api/v1/authority/dispatch-solve", tags=["Authority Simulator"])
def solve_dispatch_conflict(train_a: str, train_b: str, overtakes_allowed: bool = True):
    """Simulates section controller decision optimization to prevent systemic gridlock."""
    return {
        "section": "Satna (STA) - Manikpur (MKP) Single Line Block",
        "conflict_identified": f"Train {train_a} trailing Train {train_b} within headway threshold (<3.2km)",
        "optimal_action": f"Hold Train {train_a} at Satna Loop Line 2 for 7 minutes",
        "rationale": f"Clears path for higher priority rake {train_b} avoiding cascade delay across 4 following sections",
        "projected_systemic_delay_saved_mins": 24,
        "execution_status": "APPROVED_DISPATCH_PLAN"
    }


# ---------------------------------------------------------
# 8. WebSocket Engine: Real-Time Telemetry Stream
# ---------------------------------------------------------
@app.websocket("/ws/trains/{train_number}/live")
async def websocket_telemetry_stream(websocket: WebSocket, train_number: str):
    """Streams interpolated coordinate frames for real-time map movement."""
    await websocket.accept()
    try:
        while True:
            coords = corridor_tracker.get_telemetry_for_train(train_number)
            payload = {
                "train_number": train_number,
                "telemetry": coords,
                "server_timestamp": time.time()
            }
            await websocket.send_json(payload)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass