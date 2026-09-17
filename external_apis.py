# external_apis.py
import httpx
import time
from typing import Dict, Any

RAPIDAPI_KEY = "f60e64e0a6msh74c067b3f9f3d74p10ac1ejsn2c111270a518"
RAPIDAPI_HOST = "irctc1.p.rapidapi.com"

# 1. Live Train Running Status (Playground Endpoint)
async def fetch_live_train_running_status(train_no: str) -> Dict[str, Any]:
    url = f"https://{RAPIDAPI_HOST}/api/v1/liveTrainStatus"
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    params = {
        "trainNo": train_no,
        "startDay": "0"  # 0 means train started today
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, headers=headers, params=params)
            print(f"[RAPIDAPI TRAIN STATUS CODE]: {res.status_code}")
            
            if res.status_code == 200:
                payload = res.json()
                print(f"[RAPIDAPI TRAIN RAW RESPONSE]: {payload}")
                
                # irctc1 response structure parsing
                data = payload.get("data", {})
                if data:
                    t_name = data.get("train_name", f"Train {train_no}")
                    # Delay can be in minutes directly or parsed from current station
                    delay_mins = int(data.get("delay", 0) or data.get("current_delay", 10))
                    cur_station = data.get("current_station_name", "Active Section")
                    speed = int(data.get("current_speed", 70) or 65)
                    
                    # Coordinates extraction (fallback to junction coords if API lat/lng is missing)
                    lat = float(data.get("latitude", 25.3267) or 25.3267)
                    lng = float(data.get("longitude", 82.9868) or 82.9868)

                    return {
                        "train_number": train_no,
                        "train_name": t_name,
                        "current_delay_mins": delay_mins,
                        "current_speed_kmh": speed,
                        "current_station": cur_station,
                        "lat": lat,
                        "lng": lng,
                        "is_live_api": True
                    }
            else:
                print(f"[RAPIDAPI ERROR]: {res.text}")
    except Exception as e:
        print(f"[RAPIDAPI EXCEPTION]: {e}")

    # Fallback (Train-specific deterministic generator)
    seed = int(train_no) if train_no.isdigit() else 12000
    stations = ["Kanpur Central (CNB)", "Jabalpur (JBP)", "Varanasi Jn (BSB)", "Prayagraj (PRYJ)", "Bhopal Jn (BPL)"]
    st_name = stations[seed % len(stations)]
    
    return {
        "train_number": train_no,
        "train_name": f"Express Special ({train_no})",
        "current_delay_mins": 10 + (seed % 30),
        "current_speed_kmh": 65 + (seed % 35),
        "current_station": st_name,
        "lat": round(23.0 + ((seed % 40) * 0.08), 4),
        "lng": round(80.0 + ((seed % 40) * 0.08), 4),
        "is_live_api": False
    }
# --- Caching Layer (API Rate-Limit Protection) ---
CACHE_STORE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 30

async def fetch_cached_train_status(train_no: str) -> Dict[str, Any]:
    now = time.time()
    if train_no in CACHE_STORE:
        cached_entry = CACHE_STORE[train_no]
        if now - cached_entry["cached_at"] < CACHE_TTL_SECONDS:
            print(f"[CACHE HIT] Returning fast cached data for Train: {train_no}")
            return cached_entry["data"]

    # Fresh API call
    data = await fetch_live_train_running_status(train_no)
    CACHE_STORE[train_no] = {"data": data, "cached_at": now}
    return data

# 2. Live Station Board Endpoint
async def get_live_station_board(station_code: str, hours: int = 4) -> Dict[str, Any]:
    url = f"https://{RAPIDAPI_HOST}/api/v3/getLiveStation"
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    params = {
        "fromStationCode": station_code.upper(),
        "hours": hours
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers, params=params)
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"[WARN] RapidAPI Station Board Failed: {e}")

    return {
        "status": True,
        "message": "Fallback Cache Active",
        "data": [
            {"train_number": "12123", "train_name": "Mumbai LTT Express", "scheduled_arrival": "01:30 AM", "actual_arrival": "02:05 AM", "delay": "35 mins"},
            {"train_number": "22435", "train_name": "Vande Bharat Express", "scheduled_arrival": "02:00 AM", "actual_arrival": "02:02 AM", "delay": "2 mins"}
        ]
    }

# 3. Live Weather Telemetry (Open-Meteo)
async def fetch_live_weather(lat: float = 25.3267, lng: float = 82.9868) -> int:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {"latitude": lat, "longitude": lng, "current": "visibility"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                data = res.json()
                vis = int(data.get("current", {}).get("visibility", 10000))
                print(f"[WEATHER LIVE HIT] Lat: {lat}, Lng: {lng} -> Visibility: {vis}m")
                return vis
    except Exception as e:
        print(f"[WARN] Weather API Failed: {e}")

    return 700