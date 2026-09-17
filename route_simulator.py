# route_simulator.py
import time
import math
from typing import Dict, Any, List

# 1. Real Indian Railway Corridors
CORRIDORS = {
    # Mumbai to Varanasi (Central Corridor)
    "MUMBAI_VARANASI": [
        {"code": "LTT", "name": "Lokmanya Tilak Terminus", "lat": 19.0699, "lng": 72.8931},
        {"code": "KYN", "name": "Kalyan Junction", "lat": 19.2364, "lng": 73.1306},
        {"code": "IGP", "name": "Igatpuri (Ghat Section)", "lat": 19.6967, "lng": 73.5593},
        {"code": "BSL", "name": "Bhusaval Junction", "lat": 21.0478, "lng": 75.7865},
        {"code": "ET",  "name": "Itarsi Junction", "lat": 22.6127, "lng": 77.7621},
        {"code": "JBP", "name": "Jabalpur", "lat": 23.1686, "lng": 79.9537},
        {"code": "KTE", "name": "Katni Junction", "lat": 23.8343, "lng": 80.3986},
        {"code": "STA", "name": "Satna", "lat": 24.5708, "lng": 80.8289},
        {"code": "MKP", "name": "Manikpur", "lat": 25.0486, "lng": 81.1165},
        {"code": "PRYJ","name": "Prayagraj Junction", "lat": 25.4358, "lng": 81.8463},
        {"code": "BSB", "name": "Varanasi Junction", "lat": 25.3267, "lng": 82.9868}
    ],
    # Delhi to Varanasi / Howrah (Grand Chord Route)
    "DELHI_HOWRAH": [
        {"code": "NDLS", "name": "New Delhi", "lat": 28.6430, "lng": 77.2194},
        {"code": "ALJN", "name": "Aligarh Junction", "lat": 27.8974, "lng": 78.0880},
        {"code": "TDL",  "name": "Tundla Junction", "lat": 27.2065, "lng": 78.2435},
        {"code": "CNB",  "name": "Kanpur Central", "lat": 26.4547, "lng": 80.3507},
        {"code": "PRYJ", "name": "Prayagraj Junction", "lat": 25.4358, "lng": 81.8463},
        {"code": "DDU",  "name": "Pt. Deen Dayal Upadhyaya", "lat": 25.2798, "lng": 83.1162},
        {"code": "GAYA", "name": "Gaya Junction", "lat": 24.8027, "lng": 84.9996},
        {"code": "DHN",  "name": "Dhanbad Junction", "lat": 23.7957, "lng": 86.4304},
        {"code": "ASN",  "name": "Asansol Junction", "lat": 23.6889, "lng": 86.9661},
        {"code": "HWH",  "name": "Howrah Terminal", "lat": 22.5838, "lng": 88.3426}
    ],
    # Delhi to Mumbai (Western Trunk Route)
    "DELHI_MUMBAI": [
        {"code": "NZM",  "name": "Hazrat Nizamuddin", "lat": 28.5888, "lng": 77.2534},
        {"code": "MTJ",  "name": "Mathura Junction", "lat": 27.4924, "lng": 77.6737},
        {"code": "KOTA", "name": "Kota Junction", "lat": 25.2238, "lng": 75.8648},
        {"code": "RTM",  "name": "Ratlam Junction", "lat": 23.3340, "lng": 75.0376},
        {"code": "BRC",  "name": "Vadodara Junction", "lat": 22.3107, "lng": 73.1812},
        {"code": "ST",   "name": "Surat", "lat": 21.2049, "lng": 72.8406},
        {"code": "BVI",  "name": "Borivali", "lat": 19.2291, "lng": 72.8573},
        {"code": "MMCT", "name": "Mumbai Central", "lat": 18.9696, "lng": 72.8193}
    ],
    # Bengaluru to Chennai (Southern Express Corridor)
    "BANGALORE_CHENNAI": [
        {"code": "SBC",  "name": "KSR Bengaluru", "lat": 12.9781, "lng": 77.5696},
        {"code": "KJM",  "name": "Krishnarajapuram", "lat": 13.0012, "lng": 77.6841},
        {"code": "BWT",  "name": "Bangarapet", "lat": 12.9967, "lng": 78.2045},
        {"code": "JTJ",  "name": "Jolarpettai Junction", "lat": 12.5562, "lng": 78.5772},
        {"code": "KPD",  "name": "Katpadi Junction (Vellore)", "lat": 12.9734, "lng": 79.1378},
        {"code": "AJJ",  "name": "Arakkonam Junction", "lat": 13.0784, "lng": 79.6677},
        {"code": "PER",  "name": "Perambur", "lat": 13.1075, "lng": 80.2337},
        {"code": "MAS",  "name": "MGR Chennai Central", "lat": 13.0827, "lng": 80.2755}
    ]
}

# Backward compatibility waypoint fallback
CORRIDOR_WAYPOINTS = CORRIDORS["MUMBAI_VARANASI"]


class MultiTrainCorridorTracker:
    def __init__(self):
        self.train_states: Dict[str, Dict[str, Any]] = {}
        self.total_steps = 40

    def _get_corridor_for_train(self, train_no: str) -> List[Dict[str, Any]]:
        """Maps specific train numbers or their hash to unique Indian railway routes."""
        train_str = str(train_no).strip()
        
        # Specific famous trains mapped to their actual routes:
        if train_str in ["12301", "12302", "22436", "12561"]:  # Vande Bharat / Rajdhani to East
            return CORRIDORS["DELHI_HOWRAH"]
        elif train_str in ["12951", "12952", "12953"]:        # August Kranti / Mumbai Rajdhani
            return CORRIDORS["DELHI_MUMBAI"]
        elif train_str in ["12007", "12008", "20607"]:        # Southern Vande Bharat / Shatabdi
            return CORRIDORS["BANGALORE_CHENNAI"]
        
        # Kisi bhi unknown number ke liye deterministic dynamic route pick karo
        seed = int(train_str) if train_str.isdigit() else sum(ord(c) for c in train_str)
        corridor_keys = list(CORRIDORS.keys())
        selected_key = corridor_keys[seed % len(corridor_keys)]
        return CORRIDORS[selected_key]

    def _init_train_state(self, train_no: str):
        waypoints = self._get_corridor_for_train(train_no)
        seed = int(train_no) if train_no.isdigit() else sum(ord(c) for c in train_no)
        
        start_idx = seed % (len(waypoints) - 1)
        start_step = (seed * 5) % self.total_steps
        base_speed = 68 + (seed % 32)

        self.train_states[train_no] = {
            "segment_idx": start_idx,
            "step": start_step,
            "base_speed": base_speed
        }

    def get_route_geometry_for_train(self, train_no: str) -> Dict[str, Any]:
        """Returns the specific route polyline and waypoint stations for that train."""
        waypoints = self._get_corridor_for_train(train_no)
        polyline = [[p["lat"], p["lng"]] for p in waypoints]
        return {
            "polyline": polyline,
            "waypoints": waypoints
        }

    def get_telemetry_for_train(self, train_no: str) -> Dict[str, Any]:
        if train_no not in self.train_states:
            self._init_train_state(train_no)

        waypoints = self._get_corridor_for_train(train_no)
        state = self.train_states[train_no]
        
        idx = state["segment_idx"] % (len(waypoints) - 1)
        origin = waypoints[idx]
        target = waypoints[idx + 1]

        fraction = (state["step"] % self.total_steps) / float(self.total_steps)
        state["step"] += 1

        if state["step"] % self.total_steps == 0:
            state["segment_idx"] = (state["segment_idx"] + 1) % (len(waypoints) - 1)

        curr_lat = origin["lat"] + fraction * (target["lat"] - origin["lat"])
        curr_lng = origin["lng"] + fraction * (target["lng"] - origin["lng"])
        dynamic_speed = state["base_speed"] + int(math.sin(state["step"] * 0.3) * 5)

        return {
            "latitude": round(curr_lat, 5),
            "longitude": round(curr_lng, 5),
            "current_speed_kmh": dynamic_speed,
            "active_block_section": f"{origin['name']} ({origin['code']}) → {target['name']} ({target['code']})",
            "section_progress_pct": round(fraction * 100, 1),
            "timestamp": time.time()
        }

    # Backward compatibility
    def get_full_track_geometry(self) -> List[List[float]]:
        return [[p["lat"], p["lng"]] for p in CORRIDOR_WAYPOINTS]

corridor_tracker = MultiTrainCorridorTracker()