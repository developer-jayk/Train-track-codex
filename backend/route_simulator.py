# route_simulator.py
import time
import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from external_apis import KNOWN_TRAINS

# 1. Authentic Indian Railway Corridors with Timetable Stops
CORRIDORS: Dict[str, List[Dict[str, Any]]] = {
    # Mumbai to Varanasi (Central Corridor - e.g. 12123 Mumbai LTT Express)
    "MUMBAI_VARANASI": [
        {"code": "LTT", "name": "Lokmanya Tilak Terminus", "lat": 19.0699, "lng": 72.8931, "sched_arr": "--:--", "sched_dep": "00:15 AM", "dist_km": 0.0, "platform": "PF 1"},
        {"code": "KYN", "name": "Kalyan Junction", "lat": 19.2364, "lng": 73.1306, "sched_arr": "00:57 AM", "sched_dep": "01:00 AM", "dist_km": 35.0, "platform": "PF 4"},
        {"code": "IGP", "name": "Igatpuri (Ghat Section)", "lat": 19.6967, "lng": 73.5593, "sched_arr": "02:40 AM", "sched_dep": "02:45 AM", "dist_km": 120.0, "platform": "PF 2"},
        {"code": "BSL", "name": "Bhusaval Junction", "lat": 21.0478, "lng": 75.7865, "sched_arr": "06:45 AM", "sched_dep": "06:50 AM", "dist_km": 424.0, "platform": "PF 3"},
        {"code": "ET",  "name": "Itarsi Junction", "lat": 22.6127, "lng": 77.7621, "sched_arr": "11:20 AM", "sched_dep": "11:30 AM", "dist_km": 731.0, "platform": "PF 1"},
        {"code": "JBP", "name": "Jabalpur", "lat": 23.1686, "lng": 79.9537, "sched_arr": "02:50 PM", "sched_dep": "03:00 PM", "dist_km": 975.0, "platform": "PF 2"},
        {"code": "KTE", "name": "Katni Junction", "lat": 23.8343, "lng": 80.3986, "sched_arr": "04:15 PM", "sched_dep": "04:20 PM", "dist_km": 1066.0, "platform": "PF 5"},
        {"code": "STA", "name": "Satna", "lat": 24.5708, "lng": 80.8289, "sched_arr": "05:50 PM", "sched_dep": "05:55 PM", "dist_km": 1164.0, "platform": "PF 2"},
        {"code": "MKP", "name": "Manikpur", "lat": 25.0486, "lng": 81.1165, "sched_arr": "07:30 PM", "sched_dep": "07:32 PM", "dist_km": 1242.0, "platform": "PF 1"},
        {"code": "PRYJ","name": "Prayagraj Junction", "lat": 25.4358, "lng": 81.8463, "sched_arr": "09:10 PM", "sched_dep": "09:35 PM", "dist_km": 1344.0, "platform": "PF 4"},
        {"code": "BSB", "name": "Varanasi Junction", "lat": 25.3267, "lng": 82.9868, "sched_arr": "11:45 PM", "sched_dep": "--:--", "dist_km": 1478.0, "platform": "PF 9"}
    ],
    # Delhi to Varanasi / Howrah (Grand Chord Route - e.g. 12301 / 22436 / 12561)
    "DELHI_HOWRAH": [
        {"code": "NDLS", "name": "New Delhi", "lat": 28.6430, "lng": 77.2194, "sched_arr": "--:--", "sched_dep": "04:50 PM", "dist_km": 0.0, "platform": "PF 16"},
        {"code": "ALJN", "name": "Aligarh Junction", "lat": 27.8974, "lng": 78.0880, "sched_arr": "06:15 PM", "sched_dep": "06:17 PM", "dist_km": 131.0, "platform": "PF 3"},
        {"code": "TDL",  "name": "Tundla Junction", "lat": 27.2065, "lng": 78.2435, "sched_arr": "07:05 PM", "sched_dep": "07:07 PM", "dist_km": 209.0, "platform": "PF 4"},
        {"code": "CNB",  "name": "Kanpur Central", "lat": 26.4547, "lng": 80.3507, "sched_arr": "09:32 PM", "sched_dep": "09:37 PM", "dist_km": 440.0, "platform": "PF 1"},
        {"code": "PRYJ", "name": "Prayagraj Junction", "lat": 25.4358, "lng": 81.8463, "sched_arr": "11:43 PM", "sched_dep": "11:45 PM", "dist_km": 635.0, "platform": "PF 5"},
        {"code": "DDU",  "name": "Pt. Deen Dayal Upadhyaya", "lat": 25.2798, "lng": 83.1162, "sched_arr": "01:42 AM", "sched_dep": "01:52 AM", "dist_km": 787.0, "platform": "PF 2"},
        {"code": "GAYA", "name": "Gaya Junction", "lat": 24.8027, "lng": 84.9996, "sched_arr": "03:58 AM", "sched_dep": "04:01 AM", "dist_km": 992.0, "platform": "PF 1"},
        {"code": "DHN",  "name": "Dhanbad Junction", "lat": 23.7957, "lng": 86.4304, "sched_arr": "06:43 AM", "sched_dep": "06:48 AM", "dist_km": 1193.0, "platform": "PF 2"},
        {"code": "ASN",  "name": "Asansol Junction", "lat": 23.6889, "lng": 86.9661, "sched_arr": "07:35 AM", "sched_dep": "07:40 AM", "dist_km": 1251.0, "platform": "PF 5"},
        {"code": "HWH",  "name": "Howrah Terminal", "lat": 22.5838, "lng": 88.3426, "sched_arr": "09:55 AM", "sched_dep": "--:--", "dist_km": 1451.0, "platform": "PF 8"}
    ],
    # Delhi to Mumbai (Western Trunk Route - e.g. 12951 / 22221)
    "DELHI_MUMBAI": [
        {"code": "NZM",  "name": "Hazrat Nizamuddin", "lat": 28.5888, "lng": 77.2534, "sched_arr": "--:--", "sched_dep": "04:30 PM", "dist_km": 0.0, "platform": "PF 4"},
        {"code": "MTJ",  "name": "Mathura Junction", "lat": 27.4924, "lng": 77.6737, "sched_arr": "05:58 PM", "sched_dep": "06:00 PM", "dist_km": 134.0, "platform": "PF 2"},
        {"code": "KOTA", "name": "Kota Junction", "lat": 25.2238, "lng": 75.8648, "sched_arr": "09:05 PM", "sched_dep": "09:15 PM", "dist_km": 458.0, "platform": "PF 1"},
        {"code": "RTM",  "name": "Ratlam Junction", "lat": 23.3340, "lng": 75.0376, "sched_arr": "00:15 AM", "sched_dep": "00:18 AM", "dist_km": 725.0, "platform": "PF 4"},
        {"code": "BRC",  "name": "Vadodara Junction", "lat": 22.3107, "lng": 73.1812, "sched_arr": "03:45 AM", "sched_dep": "03:55 AM", "dist_km": 986.0, "platform": "PF 2"},
        {"code": "ST",   "name": "Surat", "lat": 21.2049, "lng": 72.8406, "sched_arr": "05:10 AM", "sched_dep": "05:15 AM", "dist_km": 1115.0, "platform": "PF 1"},
        {"code": "BVI",  "name": "Borivali", "lat": 19.2291, "lng": 72.8573, "sched_arr": "07:42 AM", "sched_dep": "07:44 AM", "dist_km": 1349.0, "platform": "PF 7"},
        {"code": "MMCT", "name": "Mumbai Central", "lat": 18.9696, "lng": 72.8193, "sched_arr": "08:35 AM", "sched_dep": "--:--", "dist_km": 1384.0, "platform": "PF 3"}
    ],
    # Bengaluru to Chennai (Southern Express Corridor - e.g. 12007 / 20607)
    "BANGALORE_CHENNAI": [
        {"code": "SBC",  "name": "KSR Bengaluru", "lat": 12.9781, "lng": 77.5696, "sched_arr": "--:--", "sched_dep": "06:00 AM", "dist_km": 0.0, "platform": "PF 1"},
        {"code": "KJM",  "name": "Krishnarajapuram", "lat": 13.0012, "lng": 77.6841, "sched_arr": "06:23 AM", "sched_dep": "06:25 AM", "dist_km": 14.0, "platform": "PF 2"},
        {"code": "BWT",  "name": "Bangarapet", "lat": 12.9967, "lng": 78.2045, "sched_arr": "07:08 AM", "sched_dep": "07:10 AM", "dist_km": 70.0, "platform": "PF 4"},
        {"code": "JTJ",  "name": "Jolarpettai Junction", "lat": 12.5562, "lng": 78.5772, "sched_arr": "08:18 AM", "sched_dep": "08:20 AM", "dist_km": 145.0, "platform": "PF 3"},
        {"code": "KPD",  "name": "Katpadi Junction (Vellore)", "lat": 12.9734, "lng": 79.1378, "sched_arr": "09:28 AM", "sched_dep": "09:30 AM", "dist_km": 229.0, "platform": "PF 1"},
        {"code": "AJJ",  "name": "Arakkonam Junction", "lat": 13.0784, "lng": 79.6677, "sched_arr": "10:18 AM", "sched_dep": "10:20 AM", "dist_km": 290.0, "platform": "PF 2"},
        {"code": "PER",  "name": "Perambur", "lat": 13.1075, "lng": 80.2337, "sched_arr": "10:58 AM", "sched_dep": "11:00 AM", "dist_km": 353.0, "platform": "PF 1"},
        {"code": "MAS",  "name": "MGR Chennai Central", "lat": 13.0827, "lng": 80.2755, "sched_arr": "11:30 AM", "sched_dep": "--:--", "dist_km": 359.0, "platform": "PF 2"}
    ]
}

CORRIDOR_WAYPOINTS = CORRIDORS["MUMBAI_VARANASI"]


def _add_minutes_to_timestr(timestr: str, minutes: int) -> str:
    """Helper to add minutes to a time string like '01:00 AM'."""
    if not timestr or timestr == "--:--":
        return "--:--"
    try:
        dt = datetime.strptime(timestr.strip(), "%I:%M %p")
        dt += timedelta(minutes=minutes)
        return dt.strftime("%I:%M %p")
    except Exception:
        return timestr


class MultiTrainCorridorTracker:
    def __init__(self):
        self.train_states: Dict[str, Dict[str, Any]] = {}
        self.total_steps = 40

    def _get_corridor_for_train(self, train_no: str) -> Optional[List[Dict[str, Any]]]:
        """Maps recognized train numbers to their authentic Indian railway corridor."""
        train_str = str(train_no).strip()

        # Strict validation: if train is not known/registered, return None
        if train_str not in KNOWN_TRAINS:
            return None

        # Route assignment
        if train_str in ["12301", "12302", "22436", "12561", "22201"]:
            return CORRIDORS["DELHI_HOWRAH"]
        elif train_str in ["12951", "12952", "12953", "22221"]:
            return CORRIDORS["DELHI_MUMBAI"]
        elif train_str in ["12007", "12008", "20607"]:
            return CORRIDORS["BANGALORE_CHENNAI"]
        else:
            return CORRIDORS["MUMBAI_VARANASI"]

    def _init_train_state(self, train_no: str):
        waypoints = self._get_corridor_for_train(train_no)
        if not waypoints:
            return
        seed = int(train_no) if train_no.isdigit() else sum(ord(c) for c in train_no)
        start_idx = seed % (len(waypoints) - 1)
        start_step = (seed * 5) % self.total_steps
        base_speed = 68 + (seed % 32)

        self.train_states[train_no] = {
            "segment_idx": start_idx,
            "step": start_step,
            "base_speed": base_speed
        }

    def get_route_geometry_for_train(self, train_no: str) -> Optional[Dict[str, Any]]:
        """Returns the specific route polyline, waypoints, and station stops."""
        waypoints = self._get_corridor_for_train(train_no)
        if not waypoints:
            return None

        polyline = [[p["lat"], p["lng"]] for p in waypoints]
        return {
            "polyline": polyline,
            "waypoints": waypoints
        }

    def get_full_route_schedule(
        self,
        train_no: str,
        current_delay_mins: int = 14,
        journey_date: Optional[str] = None,
        boarding_station: Optional[str] = None,
        is_historical: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Builds the complete station schedule timetable for the selected train and journey date.
        Distinguishes departed, in-transit, and upcoming stops with actual vs scheduled times.
        """
        waypoints = self._get_corridor_for_train(train_no)
        if not waypoints:
            return None

        if train_no not in self.train_states:
            self._init_train_state(train_no)

        state = self.train_states.get(train_no, {"segment_idx": 1})
        active_idx = len(waypoints) - 1 if is_historical else state["segment_idx"]

        stations_output = []
        for i, wp in enumerate(waypoints):
            # Calculate actual times
            if is_historical:
                status = "Departed" if i < len(waypoints) - 1 else "Arrived"
                delay = current_delay_mins
            elif i < active_idx:
                status = "Departed"
                delay = current_delay_mins
            elif i == active_idx or i == active_idx + 1:
                status = "In Transit"
                delay = current_delay_mins
            else:
                status = "Upcoming"
                delay = current_delay_mins

            act_arr = _add_minutes_to_timestr(wp["sched_arr"], delay) if wp["sched_arr"] != "--:--" else "--:--"
            act_dep = _add_minutes_to_timestr(wp["sched_dep"], delay) if wp["sched_dep"] != "--:--" else "--:--"

            is_b_station = False
            if boarding_station:
                clean_b = boarding_station.strip().upper()
                is_b_station = (clean_b == wp["code"].upper()) or (clean_b in wp["name"].upper())

            stations_output.append({
                "station_code": wp["code"],
                "station_name": wp["name"],
                "scheduled_arrival": wp["sched_arr"],
                "scheduled_departure": wp["sched_dep"],
                "actual_arrival": act_arr if (status in ["Departed", "Arrived"] or is_historical) else wp["sched_arr"],
                "actual_departure": act_dep if (status in ["Departed", "Arrived"] or is_historical) else wp["sched_dep"],
                "delay_mins": delay if (status in ["Departed", "Arrived", "In Transit"] or is_historical) else 0,
                "status": status,
                "distance_km": wp["dist_km"],
                "platform": wp["platform"],
                "is_boarding": is_b_station
            })

        # Calculate previous station departure telemetry
        prev_idx = max(0, active_idx - 1)
        prev_wp = waypoints[prev_idx]
        prev_sched_dep = prev_wp["sched_dep"] if prev_wp["sched_dep"] != "--:--" else prev_wp["sched_arr"]
        prev_act_dep = _add_minutes_to_timestr(prev_sched_dep, current_delay_mins)

        prev_departure_telemetry = {
            "station_code": prev_wp["code"],
            "station_name": prev_wp["name"],
            "scheduled_departure": prev_sched_dep,
            "actual_departure": prev_act_dep,
            "departure_delay_mins": current_delay_mins
        }

        return {
            "stations": stations_output,
            "previous_station_departure": prev_departure_telemetry
        }

    def get_telemetry_for_train(self, train_no: str) -> Optional[Dict[str, Any]]:
        waypoints = self._get_corridor_for_train(train_no)
        if not waypoints:
            return None

        if train_no not in self.train_states:
            self._init_train_state(train_no)

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

    def get_full_track_geometry(self) -> List[List[float]]:
        return [[p["lat"], p["lng"]] for p in CORRIDOR_WAYPOINTS]


corridor_tracker = MultiTrainCorridorTracker()