# backend/route_simulator.py
import time
import math
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Dict, Any, List
from external_apis import KNOWN_TRAINS

# Main SETU Corridor Stations
CORRIDOR_WAYPOINTS: List[Dict[str, Any]] = [
    {"code": "LTT", "name": "Lokmanya Tilak Terminus", "lat": 19.0699, "lng": 72.8931},
    {"code": "KYN", "name": "Kalyan Jn", "lat": 19.2364, "lng": 73.1306},
    {"code": "BSL", "name": "Bhusaval Jn", "lat": 21.0478, "lng": 75.7865},
    {"code": "ET",  "name": "Itarsi Jn", "lat": 22.6127, "lng": 77.7621},
    {"code": "JBP", "name": "Jabalpur", "lat": 23.1686, "lng": 79.9537},
    {"code": "PRYJ","name": "Prayagraj Jn", "lat": 25.4358, "lng": 81.8463},
    {"code": "BSB", "name": "Varanasi Jn", "lat": 25.3267, "lng": 82.9868}
]

GRAND_CHORD_WAYPOINTS: List[Dict[str, Any]] = [
    {"code": "NDLS", "name": "New Delhi", "lat": 28.6430, "lng": 77.2194},
    {"code": "CNB", "name": "Kanpur Central", "lat": 26.4547, "lng": 80.3507},
    {"code": "PRYJ", "name": "Prayagraj Jn", "lat": 25.4358, "lng": 81.8463},
    {"code": "BSB", "name": "Varanasi Jn", "lat": 25.3267, "lng": 82.9868},
]

class MultiTrainCorridorTracker:
    def __init__(self):
        self.train_states: Dict[str, Dict[str, Any]] = {}
        self.total_steps = 40

    def _init_train_state(self, train_no: str):
        clean_no = str(train_no).strip()
        seed = int(clean_no) if clean_no.isdigit() else sum(ord(c) for c in clean_no)
        self.train_states[clean_no] = {
            "segment_idx": seed % (len(CORRIDOR_WAYPOINTS) - 1),
            "step": (seed * 3) % self.total_steps,
            "base_speed": 70 + (seed % 30)
        }

    def get_route_geometry_for_train(self, train_no: str) -> Dict[str, Any]:
        clean_no = str(train_no).strip()
        waypoints = self._waypoints_for_train(clean_no)
        return {
            "train_number": clean_no,
            "polyline": [[p["lat"], p["lng"]] for p in waypoints],
            "waypoints": waypoints
        }

    def _waypoints_for_train(self, train_no: str) -> List[Dict[str, Any]]:
        return GRAND_CHORD_WAYPOINTS if train_no in {"22436", "12301"} else CORRIDOR_WAYPOINTS

    def get_full_route_schedule(
        self,
        train_no: str,
        current_delay_mins: int = 0,
        journey_date: str | None = None,
        boarding_station: str | None = None,
        is_historical: bool = False,
    ) -> Dict[str, Any]:
        clean_no = str(train_no).strip()
        waypoints = self._waypoints_for_train(clean_no)
        current_station = KNOWN_TRAINS.get(clean_no, {}).get("station", "")
        current_code = next(
            (point["code"] for point in waypoints
             if point["code"] in current_station.upper()
             or point["name"].upper() in current_station.upper()),
            None,
        )
        current_index = next(
            (index for index, point in enumerate(waypoints) if point["code"] == current_code),
            -1,
        )
        base_date = datetime.strptime(
            journey_date or datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d"),
            "%Y-%m-%d",
        ).replace(tzinfo=ZoneInfo("Asia/Kolkata"), hour=8, minute=0)
        stations = []
        for index, point in enumerate(waypoints):
            scheduled = base_date + timedelta(hours=index * 2)
            delay = max(0, int(current_delay_mins)) if index >= current_index >= 0 else 0
            predicted = scheduled + timedelta(minutes=delay)
            status = "Departed" if index <= current_index else "Upcoming"
            if index == current_index + 1:
                status = "In Transit"
            stations.append({
                "station_code": point["code"],
                "station_name": point["name"],
                "scheduled_arrival": scheduled.strftime("%I:%M %p"),
                "scheduled_departure": (scheduled + timedelta(minutes=5)).strftime("%I:%M %p"),
                "actual_arrival": predicted.strftime("%I:%M %p") if status == "Departed" else "",
                "actual_departure": (predicted + timedelta(minutes=5)).strftime("%I:%M %p") if status == "Departed" else "",
                "delay_mins": delay,
                "status": status,
                "distance_km": round(index * 220.0, 1),
                "platform": None,
                "is_boarding": bool(boarding_station and boarding_station.upper() == point["code"]),
            })
        next_station = waypoints[min(max(current_index + 1, 0), len(waypoints) - 1)]["name"]
        previous = stations[current_index] if current_index >= 0 else None
        return {
            "stations": stations,
            "next_station": next_station,
            "previous_station_departure": {
                "station_code": previous["station_code"],
                "station_name": previous["station_name"],
                "scheduled_departure": previous["scheduled_departure"],
                "actual_departure": previous["actual_departure"],
                "departure_delay_mins": previous["delay_mins"],
            } if previous else None,
        }

    def get_telemetry_for_train(self, train_no: str) -> Dict[str, Any]:
        clean_no = str(train_no).strip()
        if clean_no not in self.train_states:
            self._init_train_state(clean_no)

        state = self.train_states[clean_no]
        waypoints = self._waypoints_for_train(clean_no)
        total_segments = len(waypoints) - 1
        idx = state["segment_idx"] % total_segments
        origin = waypoints[idx]
        target = waypoints[idx + 1]

        fraction = (state["step"] % self.total_steps) / float(self.total_steps)
        state["step"] += 1
        if state["step"] % self.total_steps == 0:
            state["segment_idx"] = (state["segment_idx"] + 1) % total_segments

        lat = origin["lat"] + fraction * (target["lat"] - origin["lat"])
        lng = origin["lng"] + fraction * (target["lng"] - origin["lng"])
        spd = state["base_speed"] + int(math.sin(state["step"] * 0.4) * 8)

        # Train name lookup (agar known hai to real name, warna dynamic name)
        t_name = f"Express Special ({clean_no})"
        if clean_no in KNOWN_TRAINS:
            t_name = KNOWN_TRAINS[clean_no]["name"]

        return {
            "train_number": clean_no,
            "train_name": t_name,
            "latitude": round(lat, 5),
            "longitude": round(lng, 5),
            "current_speed_kmh": spd,
            "active_block_section": f"{origin['name']} → {target['name']}",
            "section_progress_pct": round(fraction * 100, 1),
            "timestamp": time.time()
        }

# Global tracker instance
corridor_tracker = MultiTrainCorridorTracker()