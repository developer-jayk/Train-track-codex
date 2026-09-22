import asyncio
from unittest.mock import patch, MagicMock
from external_apis import fetch_live_train_running_status, fetch_live_weather

sample_irctc_live_payload = {
    "status": True,
    "message": "Success",
    "data": {
        "train_number": "12123",
        "train_name": "Deccan Queen Express",
        "journey_date": "2026-09-20",
        "current_station_name": "Kalyan Jn",
        "current_station_code": "KYN",
        "previous_station_name": "Thane",
        "next_station_name": "Karjat",
        "current_delay": 14,
        "current_speed": 84,
        "actual_arrival": "17:42",
        "actual_departure": "17:44",
        "scheduled_arrival": "17:30",
        "scheduled_departure": "17:32",
        "latitude": 19.2364,
        "longitude": 73.1306,
        "platform_number": "4",
        "last_updated": "2026-09-20T17:45:00+05:30",
        "stations": [
            {"station_name": "Mumbai CSMT", "scheduled_arrival": "17:10", "actual_arrival": "17:10", "status": "Departed", "platform_number": "8"},
            {"station_name": "Kalyan Jn", "scheduled_arrival": "17:30", "actual_arrival": "17:42", "status": "In Transit", "platform_number": "4"},
            {"station_name": "Pune Jn", "scheduled_arrival": "20:25", "actual_arrival": "--", "status": "Upcoming", "platform_number": None}
        ]
    }
}

async def run_unit_test():
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = sample_irctc_live_payload
    
    with patch("httpx.AsyncClient.get", return_value=mock_res):
        parsed = await fetch_live_train_running_status("12123", "2026-09-20")
        print("=== LIVE PARSER FIELD VERIFICATION ===")
        print(f"Status: {parsed['status']}")
        d = parsed["data"]
        print("1. Raw RapidAPI response:", "Present (payload received)")
        print(f"2. Parsed train number: {d['train_number']}")
        print(f"3. Journey date: {d['journey_date']}")
        print(f"4. Station sequence: {[s['station_name'] for s in d['stations']]}")
        print(f"5. Scheduled times: Arr={d['scheduled_arrival']}, Dep={d['scheduled_departure']}")
        print(f"6. Actual times: Arr={d['actual_arrival']}, Dep={d['actual_departure']}")
        print(f"7. Current location: {d['current_station']} (Lat: {d['lat']}, Lng: {d['lng']})")
        print(f"8. Current delay: {d['current_delay_mins']} mins")
        print(f"9. Speed: {d['current_speed_kmh']} km/h")
        print(f"10. Platform availability: {d['platform']} (platform_status: '{d['platform_status']}')")
        print(f"11. Data mode: {parsed['data_mode']}")
        
        # Test missing platform behavior
        sample_irctc_live_payload["data"]["platform_number"] = None
        parsed_no_plat = await fetch_live_train_running_status("12123", "2026-09-20")
        print(f"10b. When platform missing: platform={parsed_no_plat['data']['platform']}, platform_status='{parsed_no_plat['data']['platform_status']}'")

if __name__ == "__main__":
    asyncio.run(run_unit_test())
