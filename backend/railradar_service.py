# backend/railradar_service.py
"""
Centralized RailRadar Provider Service (api.railradar.in)
Primary Authoritative Railway Data Provider for SETU.

Endpoints:
1. Train Schedule: GET /v1/trains/{train_number}?haltsOnly=true
2. Live Running Status: GET /v1/trains/{train_number}/live?authoritative=true
3. Platform & Coach Position: GET /v1/trains/{train_number}/coaches/{station_code}
4. Route GeoJSON Geometry: GET /v1/trains/{train_number}/route?format=geojson&stops=true
5. Trains Between Stations: GET /v1/trains/between/{from_station}/{to_station}?date={date}
"""

import os
import time
import logging
from typing import Dict, Any, Optional, List
import httpx

# Configure Structured Logging
logger = logging.getLogger("railradar_service")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [RailRadarProvider] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Load environment variable
def _load_env():
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    for p in [os.path.join(cur_dir, ".env"), os.path.join(os.path.dirname(cur_dir), ".env")]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception as err:
                logger.warning(f"Error reading env {p}: {err}")

_load_env()
RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY", "").strip()
RAILRADAR_BASE_URL = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in").rstrip("/")

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "railradar_cache.json")

class RailRadarProvider:
    """
    Centralized client for all RailRadar API calls.
    Enforces Bearer authentication, timeout management, structured logging,
    and strict error categorization.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = (api_key or RAILRADAR_API_KEY).strip().strip('"').strip("'")
        self.base_url = (base_url or RAILRADAR_BASE_URL).rstrip("/")
        # Production cross-region timeout: 15s connect, 25s read to handle cloud egress latency
        self.timeout = httpx.Timeout(connect=15.0, read=25.0, write=15.0, pool=15.0)
        self._cache: Dict[str, Dict[str, Any]] = self._load_disk_cache()
        self._rate_limit_reset_ts: float = 0.0
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Maintains a persistent client with connection pooling and keep-alive."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20, keepalive_expiry=60.0)
            )
        return self._client

    async def close(self):
        """Cleanly close persistent client pool if open."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _load_disk_cache(self) -> Dict[str, Dict[str, Any]]:
        try:
            if os.path.exists(CACHE_FILE):
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading disk cache: {e}")
        return {}

    def _save_disk_cache(self):
        try:
            os.makedirs(CACHE_DIR, exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f)
        except Exception as e:
            logger.warning(f"Error saving disk cache: {e}")

    def _get_headers(self) -> Dict[str, str]:
        clean_key = self.api_key.strip().strip('"').strip("'")
        if not clean_key:
            logger.error("RAILRADAR_API_KEY is not configured in backend environment!")
        return {
            "Authorization": f"Bearer {clean_key}",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        }

    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        cache_ttl: float = 0.0
    ) -> Dict[str, Any]:
        """
        Executes an authenticated HTTP request to RailRadar.
        Handles status codes: 400, 401, 404, 429, 5xx, timeouts, and network exceptions.
        Includes in-memory and disk TTL caching to prevent 429 rate-limiting.
        """
        url = f"{self.base_url}{endpoint}"
        param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items())) if params else ""
        cache_key = f"{endpoint}?{param_str}" if param_str else endpoint
        now = time.time()

        # Check Cache
        if cache_ttl > 0 and cache_key in self._cache:
            entry = self._cache[cache_key]
            if (now - entry.get("ts", 0)) < cache_ttl:
                logger.info(f"CACHE HIT [{round(now - entry['ts'], 1)}s old]: {endpoint}")
                return entry["data"]

        # If currently in a known 429 cooldown and we have any cached data, serve it
        if now < self._rate_limit_reset_ts and cache_key in self._cache:
            logger.info(f"429 Cooldown Active: Serving cached entry for {endpoint}")
            return self._cache[cache_key]["data"]

        start_time = time.time()
        clean_key = self.api_key.strip().strip('"').strip("'")
        
        if not clean_key or clean_key == "your_railradar_api_key_here":
            return {
                "status": "DATA_UNAVAILABLE",
                "error_code": "NO_API_KEY",
                "http_status": 503,
                "message": "RailRadar API key is missing. Configure RAILRADAR_API_KEY in backend/.env.",
                "data": None
            }

        try:
            client = await self._get_client()
            res = await client.get(url, headers=self._get_headers(), params=params)
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            
            logger.info(f"GET {endpoint} -> HTTP {res.status_code} ({elapsed_ms}ms)")

            # 1. Successful 200 OK
            if res.status_code == 200:
                payload = res.json()
                if payload.get("success") is False:
                    err_code = payload.get("error", {}).get("code", "API_ERROR")
                    err_msg = payload.get("error", {}).get("message", "RailRadar error")
                    return {
                        "status": "NOT_FOUND" if err_code == "TRAIN_NOT_FOUND" else "ERROR",
                        "error_code": err_code,
                        "http_status": 200,
                        "message": err_msg,
                        "data": None
                    }
                result = {
                    "status": "OK",
                    "http_status": 200,
                    "data": payload.get("data"),
                    "meta": payload.get("meta")
                }
                if cache_ttl > 0:
                    self._cache[cache_key] = {"ts": now, "data": result}
                return result

            # 2. Train / Resource Not Found (404)
            if res.status_code == 404:
                err_payload = res.json() if res.text.startswith("{") else {}
                err_msg = err_payload.get("error", {}).get("message") or f"Resource at {endpoint} not found."
                return {
                    "status": "NOT_FOUND",
                    "error_code": "TRAIN_NOT_FOUND",
                    "http_status": 404,
                    "message": err_msg,
                    "data": None
                }

            # 3. Authentication Failure (401)
            if res.status_code == 401:
                logger.critical(f"RailRadar authentication rejected (HTTP 401): {res.text}")
                return {
                    "status": "DATA_UNAVAILABLE",
                    "error_code": "UNAUTHORIZED",
                    "http_status": 401,
                    "message": "RailRadar authentication failed. Please verify the active API key.",
                    "data": None
                }

            # 4. Rate Limiting (429)
            if res.status_code == 429:
                logger.warning("RailRadar rate limit reached (HTTP 429)")
                # If we have any cached entry (even if slightly older), return it to keep SETU resilient
                if cache_key in self._cache:
                    logger.info(f"Serving stale cached entry for {endpoint} due to 429 rate limit")
                    return self._cache[cache_key]["data"]
                return {
                    "status": "DATA_UNAVAILABLE",
                    "error_code": "RATE_LIMITED",
                    "http_status": 429,
                    "message": "RailRadar API rate limit reached. Railway telemetry temporarily unavailable.",
                    "data": None
                }

            # 5. Bad Request (400)
            if res.status_code == 400:
                err_payload = res.json() if res.text.startswith("{") else {}
                err_msg = err_payload.get("error", {}).get("message") or "Bad request parameters."
                return {
                    "status": "ERROR",
                    "error_code": "BAD_REQUEST",
                    "http_status": 400,
                    "message": err_msg,
                    "data": None
                }

            # 6. Upstream Server Errors (500, 502, 503, 504)
            return {
                "status": "DATA_UNAVAILABLE",
                "error_code": "PROVIDER_ERROR",
                "http_status": res.status_code,
                "message": f"RailRadar service error (HTTP {res.status_code}). Telemetry temporarily unavailable.",
                "data": None
            }

        except httpx.TimeoutException:
            logger.warning(f"Timeout querying RailRadar: GET {endpoint} exceeded {self.timeout}s")
            return {
                "status": "DATA_UNAVAILABLE",
                "error_code": "TIMEOUT",
                "http_status": 504,
                "message": f"RailRadar request timed out on {endpoint}. Railway telemetry temporarily unavailable.",
                "data": None
            }
        except (httpx.ConnectError, httpx.NetworkError) as net_err:
            logger.warning(f"Network connection error querying RailRadar: {net_err}")
            return {
                "status": "DATA_UNAVAILABLE",
                "error_code": "NETWORK_ERROR",
                "http_status": 503,
                "message": f"Unable to reach RailRadar network: {str(net_err)}",
                "data": None
            }
        except Exception as exc:
            logger.error(f"Unexpected exception querying RailRadar {endpoint}: {exc}")
            return {
                "status": "DATA_UNAVAILABLE",
                "error_code": "EXCEPTION",
                "http_status": 500,
                "message": f"Internal error querying railway provider: {str(exc)}",
                "data": None
            }

    # ---------------------------------------------------------
    # 1. Train Schedule / Timetable Endpoint
    # ---------------------------------------------------------
    async def get_train_schedule(self, train_number: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{train_number}?haltsOnly=true
        Returns:
          - train number, name, type, source, destination, distance, duration, avgSpeed, maxSpeed
          - complete route/station sequence with scheduled arrival, departure, distance, and platform
        """
        clean_no = str(train_number).strip()
        endpoint = f"/v1/trains/{clean_no}"
        params = {"haltsOnly": "true"}

        res = await self._request(endpoint, params=params, cache_ttl=86400.0)
        if res.get("status") != "OK":
            return res

        data = res.get("data", {})
        train_info = data.get("train", {})
        raw_route = data.get("route", [])

        # Parse truthful halt stops (Do not invent missing timetable info)
        parsed_stops = []
        for st in raw_route:
            stn = st.get("station", {})
            plat_raw = st.get("platform")
            plat_val = str(plat_raw).strip() if plat_raw else None
            
            parsed_stops.append({
                "sequence": st.get("sequence", 0),
                "station_code": stn.get("code", ""),
                "station_name": stn.get("name", ""),
                "lat": stn.get("lat"),
                "lng": stn.get("lng"),
                "scheduled_arrival": st.get("arrival") or "--",
                "scheduled_departure": st.get("departure") or "--",
                "arrival_day": st.get("arrivalDay", 1),
                "departure_day": st.get("departureDay", 1),
                "distance_km": float(st.get("distance", 0.0) or 0.0),
                "speed_to_next_kmph": st.get("speedToNextStationKmph"),
                "platform": plat_val,
                "platform_status": "available" if plat_val else "unavailable",
                "coach_position": st.get("coachPosition")
            })

        return {
            "status": "OK",
            "http_status": 200,
            "data_source": "railradar",
            "train_number": train_info.get("number", clean_no),
            "train_name": train_info.get("name", f"Train #{clean_no}"),
            "train_type": train_info.get("type", "Express"),
            "category": train_info.get("category", "Express"),
            "source": train_info.get("source", {}),
            "destination": train_info.get("destination", {}),
            "distance_km": train_info.get("distance", 0),
            "duration_mins": train_info.get("duration", 0),
            "avg_speed_kmh": train_info.get("avgSpeed"),
            "max_speed_kmh": train_info.get("maxSpeed"),
            "total_halts": train_info.get("totalHalts", len(parsed_stops)),
            "run_days": train_info.get("runDays", []),
            "coach_position": train_info.get("coachPosition"),
            "route": parsed_stops
        }

    # ---------------------------------------------------------
    # 2. Live Train Running Status Endpoint
    # ---------------------------------------------------------
    async def get_live_status(
        self,
        train_number: str,
        date: Optional[str] = None,
        authoritative: bool = True
    ) -> Dict[str, Any]:
        """
        GET /v1/trains/{train_number}/live?authoritative=true
        Returns:
          - current train location, current station/section, coordinates, speed, delay
          - previous station, next station, actual arrival/departure
          - live running status, platform when explicitly provided
        """
        clean_no = str(train_number).strip()
        endpoint = f"/v1/trains/{clean_no}/live"
        params = {"authoritative": "true" if authoritative else "false"}
        if date:
            params["date"] = date.strip()

        res = await self._request(endpoint, params=params, cache_ttl=25.0)
        if res.get("status") != "OK":
            return res

        data = res.get("data", {})
        cur_loc = data.get("currentLocation", {})
        coords = cur_loc.get("coordinates", {}) if isinstance(cur_loc, dict) else {}
        train_sub = data.get("train", {})

        # Platform: never calculate, guess, or fabricate
        raw_platform = cur_loc.get("platform") or data.get("platform")
        platform_val = str(raw_platform).strip() if raw_platform else None

        # Route stops with live timestamps and delays
        raw_route = data.get("route", [])
        parsed_route = []
        for st in raw_route:
            st_plat = st.get("platform")
            parsed_route.append({
                "sequence": st.get("sequence", 0),
                "station_code": st.get("stationCode", ""),
                "station_name": st.get("stationName", ""),
                "is_halt": st.get("isHalt", True),
                "status": st.get("status", "upcoming"),
                "scheduled_arrival": st.get("scheduledArrival"),
                "scheduled_departure": st.get("scheduledDeparture"),
                "actual_arrival": st.get("actualArrival"),
                "actual_departure": st.get("actualDeparture"),
                "delay_arrival_mins": st.get("delayArrival", 0),
                "delay_departure_mins": st.get("delayDeparture", 0),
                "distance_km": st.get("distance", 0.0),
                "speed_to_next_kmph": st.get("speedToNextStationKmph"),
                "platform": str(st_plat).strip() if st_plat else None,
                "platform_status": "available" if st_plat else "unavailable"
            })

        return {
            "status": "OK",
            "http_status": 200,
            "data_source": "railradar",
            "data_mode": "live",
            "train_number": data.get("trainNumber", clean_no),
            "train_name": data.get("trainName") or train_sub.get("name", f"Train #{clean_no}"),
            "start_date": data.get("startDate"),
            "last_updated_at": data.get("lastUpdatedAt"),
            "running_status": data.get("status", "running"),
            "is_live": data.get("isLive", True),
            "tracking_mode": data.get("trackingMode", "real-time"),
            "current_delay_mins": data.get("delayMinutes", 0),
            "current_station": cur_loc.get("stationName") or "En Route",
            "current_station_code": cur_loc.get("stationCode"),
            "current_section_status": cur_loc.get("status", "running"),
            "lat": coords.get("lat"),
            "lng": coords.get("lng"),
            "current_speed_kmh": cur_loc.get("speed") or cur_loc.get("currentSpeed") or train_sub.get("avgSpeed"),
            "previous_halt": data.get("previousHalt"),
            "next_halt": data.get("nextHalt"),
            "platform": platform_val,
            "platform_status": "available" if platform_val else "unavailable",
            "route": parsed_route
        }

    # ---------------------------------------------------------
    # 3. Train Platform / Coach Position Endpoint
    # ---------------------------------------------------------
    async def get_platform_info(self, train_number: str, station_code: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{train_number}/coaches/{station_code}
        Returns:
          - platform number (strictly null if unavailable; never guess)
          - coach formation, total coaches, coach position
        """
        clean_no = str(train_number).strip()
        clean_stn = str(station_code).strip().upper()
        endpoint = f"/v1/trains/{clean_no}/coaches/{clean_stn}"

        res = await self._request(endpoint, cache_ttl=300.0)
        if res.get("status") != "OK":
            return res

        data = res.get("data", {})
        stn_info = data.get("station", {})
        plat_raw = stn_info.get("platform")
        plat_val = str(plat_raw).strip() if plat_raw else None

        return {
            "status": "OK",
            "http_status": 200,
            "data_source": "railradar",
            "train_number": data.get("trainNumber", clean_no),
            "train_name": data.get("trainName", ""),
            "station_code": stn_info.get("code", clean_stn),
            "station_name": stn_info.get("name", clean_stn),
            "platform": plat_val,
            "platform_status": "available" if plat_val else "unavailable",
            "reversal": data.get("reversal", False),
            "total_coaches": data.get("totalCoaches", 0),
            "formation": data.get("formation"),
            "rake": data.get("rake", [])
        }

    # ---------------------------------------------------------
    # 4. Train Route Geometry Endpoint
    # ---------------------------------------------------------
    async def get_route_geometry(self, train_number: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{train_number}/route?format=geojson&stops=true
        Returns:
          - GeoJSON geometry (coordinates list of [lat, lng])
          - ordered stop markers coordinates
        """
        clean_no = str(train_number).strip()
        endpoint = f"/v1/trains/{clean_no}/route"
        params = {"format": "geojson", "stops": "true"}

        res = await self._request(endpoint, params=params, cache_ttl=3600.0)
        if res.get("status") != "OK":
            return res

        data = res.get("data", {})
        geojson = data.get("geojson", {})
        geom = geojson.get("geometry", {})
        raw_coords = geom.get("coordinates", [])

        # GeoJSON is [lng, lat]; Leaflet/SETU uses [[lat, lng], ...]
        polyline: List[List[float]] = []
        if isinstance(raw_coords, list):
            for pt in raw_coords:
                if isinstance(pt, list) and len(pt) >= 2:
                    polyline.append([round(float(pt[1]), 5), round(float(pt[0]), 5)])

        stops = data.get("stops", [])
        waypoints = []
        for s in stops:
            waypoints.append({
                "sequence": s.get("sequence", 0),
                "code": s.get("code", ""),
                "name": s.get("name", ""),
                "lat": float(s.get("lat", 0.0) or 0.0),
                "lng": float(s.get("lng", 0.0) or 0.0)
            })

        return {
            "status": "OK",
            "http_status": 200,
            "data_source": "railradar",
            "train_number": data.get("trainNumber", clean_no),
            "polyline": polyline,
            "critical_waypoints": waypoints,
            "stops": stops
        }

    # ---------------------------------------------------------
    # 5. Trains Between Stations Endpoint
    # ---------------------------------------------------------
    async def get_trains_between(
        self,
        from_station: str,
        to_station: str,
        date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        GET /v1/trains/between/{from_station}/{to_station}?date={journey_date}
        Returns trains operating between two stations.
        """
        clean_from = str(from_station).strip().upper()
        clean_to = str(to_station).strip().upper()
        endpoint = f"/v1/trains/between/{clean_from}/{clean_to}"
        params = {}
        if date:
            params["date"] = date.strip()

        res = await self._request(endpoint, params=params, cache_ttl=300.0)
        if res.get("status") != "OK":
            return res

        data = res.get("data", {})
        return {
            "status": "OK",
            "http_status": 200,
            "data_source": "railradar",
            "from_station": data.get("from", {}),
            "to_station": data.get("to", {}),
            "count": data.get("count", 0),
            "trains": data.get("trains", [])
        }

# Global Singleton Instance
railradar_provider = RailRadarProvider()
