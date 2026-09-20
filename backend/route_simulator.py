# backend/route_simulator.py
import time
import math
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
        return {
            "train_number": clean_no,
            "polyline": [[p["lat"], p["lng"]] for p in CORRIDOR_WAYPOINTS],
            "waypoints": CORRIDOR_WAYPOINTS
        }

    def get_telemetry_for_train(self, train_no: str) -> Dict[str, Any]:
        clean_no = str(train_no).strip()
        if clean_no not in self.train_states:
            self._init_train_state(clean_no)

        state = self.train_states[clean_no]
        total_segments = len(CORRIDOR_WAYPOINTS) - 1
        idx = state["segment_idx"] % total_segments
        origin = CORRIDOR_WAYPOINTS[idx]
        target = CORRIDOR_WAYPOINTS[idx + 1]

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