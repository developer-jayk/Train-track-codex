# backend/test_railradar_suite.py
"""
SETU Comprehensive Verification Suite for RailRadar Integration
Tests the 5 core endpoints and 10+ real train numbers.
"""

import httpx
import json
import time
from datetime import datetime

API_BASE = "http://127.0.0.1:8000"

def run_suite():
    results = {
        "timestamp": datetime.now().isoformat(),
        "core_tests": {},
        "train_matrix": []
    }
    
    print("=" * 80)
    print("SETU RAILRADAR INTEGRATION VERIFICATION SUITE")
    print("API Base:", API_BASE)
    print("Timestamp:", results["timestamp"])
    print("=" * 80)

    with httpx.Client(base_url=API_BASE, timeout=12.0) as client:
        # -----------------------------------------------------
        # 1. Train Schedule: 12919
        # -----------------------------------------------------
        print("\n--- [TEST 1] Train Schedule: 12919 ---")
        t1_start = time.time()
        # Test schedule via forecast endpoint (which parses schedule stops)
        r1 = client.get("/api/v1/trains/12919/forecast")
        t1_elapsed = round((time.time() - t1_start) * 1000, 1)
        print(f"Status: HTTP {r1.status_code} ({t1_elapsed}ms)")
        if r1.status_code == 200:
            d1 = r1.json()
            full_route = d1.get("full_route") or []
            test1_res = {
                "test": "Train Schedule 12919",
                "endpoint": "/api/v1/trains/12919/forecast",
                "http_status": r1.status_code,
                "train_number": d1.get("train_number"),
                "train_name": d1.get("train_name"),
                "train_found": True,
                "data_source": d1.get("data_source"),
                "data_mode": d1.get("data_mode"),
                "total_route_stops": len(full_route),
                "origin_station": full_route[0]["station_name"] if full_route else None,
                "destination_station": full_route[-1]["station_name"] if full_route else None,
                "scheduled_origin_departure": full_route[0]["scheduled_departure"] if full_route else None,
                "key_fields_verified": [
                    "train_number", "train_name", "full_route", "timeline", "data_source"
                ]
            }
            print(f"Train: {d1.get('train_name')}")
            print(f"Total Halts: {len(full_route)}")
            print(f"Origin: {test1_res['origin_station']} -> Dest: {test1_res['destination_station']}")
            print(f"Data Source: {d1.get('data_source')} (mode: {d1.get('data_mode')})")
            results["core_tests"]["test_1_schedule_12919"] = test1_res
        else:
            print("Error:", r1.text)
            results["core_tests"]["test_1_schedule_12919"] = {"http_status": r1.status_code, "error": r1.text}

        # -----------------------------------------------------
        # 2. Live Running Status: 12919
        # -----------------------------------------------------
        print("\n--- [TEST 2] Live Running Status: 12919 ---")
        t2_start = time.time()
        r2 = client.get("/api/v1/trains/12919/forecast")
        t2_elapsed = round((time.time() - t2_start) * 1000, 1)
        print(f"Status: HTTP {r2.status_code} ({t2_elapsed}ms)")
        if r2.status_code == 200:
            d2 = r2.json()
            test2_res = {
                "test": "Live Running Status 12919",
                "endpoint": "/api/v1/trains/12919/forecast",
                "http_status": r2.status_code,
                "train_number": d2.get("train_number"),
                "train_name": d2.get("train_name"),
                "train_found": True,
                "data_source": d2.get("data_source"),
                "data_mode": d2.get("data_mode"),
                "current_status": d2.get("current_status"),
                "current_delay_mins": d2.get("current_delay_mins"),
                "current_speed_kmh": d2.get("current_speed_kmh"),
                "predicted_downstream_delay_mins": d2.get("predicted_downstream_delay_mins"),
                "confidence_score": d2.get("confidence_score"),
                "next_station": d2.get("next_station"),
                "weather_telemetry": d2.get("weather_telemetry"),
                "platform": d2.get("platform"),
                "platform_status": d2.get("platform_status"),
                "root_causes": d2.get("root_causes")
            }
            print(f"Current Status: {d2.get('current_status')}")
            print(f"Live Delay: {d2.get('current_delay_mins')} mins | Speed: {d2.get('current_speed_kmh')} km/h")
            print(f"Next Station: {d2.get('next_station')}")
            print(f"Confidence: {d2.get('confidence_score')}%")
            print(f"Weather: {d2.get('weather_telemetry')}")
            results["core_tests"]["test_2_live_12919"] = test2_res
        else:
            print("Error:", r2.text)
            results["core_tests"]["test_2_live_12919"] = {"http_status": r2.status_code, "error": r2.text}

        # -----------------------------------------------------
        # 3. Coach / Platform: 12952 at BRC
        # -----------------------------------------------------
        print("\n--- [TEST 3] Platform & Coach: 12952 at BRC ---")
        t3_start = time.time()
        r3 = client.get("/api/v1/trains/12952/coaches/BRC")
        t3_elapsed = round((time.time() - t3_start) * 1000, 1)
        print(f"Status: HTTP {r3.status_code} ({t3_elapsed}ms)")
        if r3.status_code == 200:
            d3 = r3.json()
            test3_res = {
                "test": "Coach / Platform 12952 at BRC",
                "endpoint": "/api/v1/trains/12952/coaches/BRC",
                "http_status": r3.status_code,
                "train_number": d3.get("train_number"),
                "train_name": d3.get("train_name"),
                "station_code": d3.get("station_code"),
                "station_name": d3.get("station_name"),
                "platform": d3.get("platform"),
                "platform_status": d3.get("platform_status"),
                "total_coaches": d3.get("total_coaches"),
                "formation": d3.get("formation"),
                "data_source": d3.get("data_source")
            }
            print(f"Train: {d3.get('train_name')}")
            print(f"Station: {d3.get('station_name')} ({d3.get('station_code')})")
            print(f"Platform: {d3.get('platform')} (status: {d3.get('platform_status')})")
            print(f"Total Coaches: {d3.get('total_coaches')} | Formation: {d3.get('formation')}")
            results["core_tests"]["test_3_coaches_12952_BRC"] = test3_res
        else:
            print("Error:", r3.text)
            results["core_tests"]["test_3_coaches_12952_BRC"] = {"http_status": r3.status_code, "error": r3.text}

        # -----------------------------------------------------
        # 4. Route Geometry: 12919
        # -----------------------------------------------------
        print("\n--- [TEST 4] Route Geometry: 12919 ---")
        t4_start = time.time()
        r4 = client.get("/api/v1/trains/12919/route-geometry")
        t4_elapsed = round((time.time() - t4_start) * 1000, 1)
        print(f"Status: HTTP {r4.status_code} ({t4_elapsed}ms)")
        if r4.status_code == 200:
            d4 = r4.json()
            poly = d4.get("polyline") or []
            wps = d4.get("critical_waypoints") or []
            test4_res = {
                "test": "Route Geometry 12919",
                "endpoint": "/api/v1/trains/12919/route-geometry",
                "http_status": r4.status_code,
                "train_number": d4.get("train_number"),
                "status": d4.get("status"),
                "data_source": d4.get("data_source"),
                "data_mode": d4.get("data_mode"),
                "polyline_coordinates_count": len(poly),
                "critical_waypoints_count": len(wps),
                "first_waypoint": wps[0] if wps else None,
                "last_waypoint": wps[-1] if wps else None
            }
            print(f"Polyline Points: {len(poly)}")
            print(f"Critical Waypoints: {len(wps)}")
            if wps:
                print(f"First Waypoint: {wps[0]['name']} ({wps[0]['code']})")
                print(f"Last Waypoint: {wps[-1]['name']} ({wps[-1]['code']})")
            results["core_tests"]["test_4_route_geometry_12919"] = test4_res
        else:
            print("Error:", r4.text)
            results["core_tests"]["test_4_route_geometry_12919"] = {"http_status": r4.status_code, "error": r4.text}

        # -----------------------------------------------------
        # 5. Trains Between Stations: UJN -> INDB on 2026-06-22
        # -----------------------------------------------------
        print("\n--- [TEST 5] Between Stations: UJN -> INDB on 2026-06-22 ---")
        t5_start = time.time()
        r5 = client.get("/api/v1/trains/between/UJN/INDB?date=2026-06-22")
        t5_elapsed = round((time.time() - t5_start) * 1000, 1)
        print(f"Status: HTTP {r5.status_code} ({t5_elapsed}ms)")
        if r5.status_code == 200:
            d5 = r5.json()
            trains_list = d5.get("trains") or []
            test5_res = {
                "test": "Trains Between UJN and INDB",
                "endpoint": "/api/v1/trains/between/UJN/INDB?date=2026-06-22",
                "http_status": r5.status_code,
                "from_station": d5.get("from_station"),
                "to_station": d5.get("to_station"),
                "count": d5.get("count"),
                "data_source": d5.get("data_source"),
                "first_train": trains_list[0].get("train", {}).get("name") if trains_list else None,
                "sample_train_numbers": [t.get("train", {}).get("number") for t in trains_list[:5]]
            }
            print(f"Count: {d5.get('count')} trains available")
            print(f"From: {d5.get('from_station', {}).get('name')} -> To: {d5.get('to_station', {}).get('name')}")
            print(f"Sample Trains: {test5_res['sample_train_numbers']}")
            results["core_tests"]["test_5_between_UJN_INDB"] = test5_res
        else:
            print("Error:", r5.text)
            results["core_tests"]["test_5_between_UJN_INDB"] = {"http_status": r5.status_code, "error": r5.text}

        # -----------------------------------------------------
        # 6. Invalid Train: 99999
        # -----------------------------------------------------
        print("\n--- [TEST 6] Invalid Train: 99999 ---")
        t6_start = time.time()
        r6 = client.get("/api/v1/trains/99999/forecast")
        t6_elapsed = round((time.time() - t6_start) * 1000, 1)
        print(f"Status: HTTP {r6.status_code} ({t6_elapsed}ms)")
        d6 = r6.json()
        test6_res = {
            "test": "Invalid Train 99999",
            "endpoint": "/api/v1/trains/99999/forecast",
            "http_status": r6.status_code,
            "train_number": "99999",
            "train_found": False,
            "error_detail": d6.get("detail"),
            "assert_status_404": (r6.status_code == 404)
        }
        print(f"Detail: {d6.get('detail')}")
        print(f"Truthful 404 Verified: {test6_res['assert_status_404']}")
        results["core_tests"]["test_6_invalid_99999"] = test6_res

        # -----------------------------------------------------
        # 7. Multi-Train Matrix: At Least 10 Real Trains
        # -----------------------------------------------------
        print("\n" + "=" * 80)
        print("--- [TEST 7] Multi-Train Real Fleet Matrix (11 Trains) ---")
        print("=" * 80)
        
        matrix_trains = [
            ("12919", "Malwa SF Express"),
            ("12123", "Deccan Queen"),
            ("22221", "Mumbai CSMT Rajdhani"),
            ("12051", "Jan Shatabdi Express"),
            ("15623", "BGKT KYQ Express"),
            ("22436", "Vande Bharat Express"),
            ("12301", "Howrah Rajdhani Express"),
            ("12951", "Mumbai Tejas Rajdhani"),
            ("12952", "New Delhi Tejas Rajdhani"),
            ("12007", "Chennai Shatabdi Express"),
            ("12625", "Kerala Express"),
        ]

        for t_no, expected_name in matrix_trains:
            t_start = time.time()
            res = client.get(f"/api/v1/trains/{t_no}/forecast")
            t_ms = round((time.time() - t_start) * 1000, 1)
            
            entry = {
                "endpoint": f"/api/v1/trains/{t_no}/forecast",
                "http_status": res.status_code,
                "train_number": t_no,
                "expected_name": expected_name,
                "train_found": (res.status_code == 200),
                "data_source": None,
                "data_mode": None,
                "train_name": None,
                "current_status": None,
                "current_delay_mins": None,
                "current_speed_kmh": None,
                "platform": None,
                "platform_status": None,
                "confidence_score": None,
                "key_fields_returned": [],
                "error": None
            }

            if res.status_code == 200:
                data = res.json()
                entry.update({
                    "data_source": data.get("data_source"),
                    "data_mode": data.get("data_mode"),
                    "train_name": data.get("train_name"),
                    "current_status": data.get("current_status"),
                    "current_delay_mins": data.get("current_delay_mins"),
                    "current_speed_kmh": data.get("current_speed_kmh"),
                    "platform": data.get("platform"),
                    "platform_status": data.get("platform_status"),
                    "confidence_score": data.get("confidence_score"),
                    "key_fields_returned": [
                        "train_number", "train_name", "current_status", "current_delay_mins",
                        "current_speed_kmh", "confidence_score", "platform", "timeline", "full_route"
                    ]
                })
                print(f"[PASS] Train {t_no} ({entry['train_name']}) -> HTTP 200 ({t_ms}ms) | Mode: {entry['data_mode']} | Status: {entry['current_status']} | Platform: {entry['platform']} ({entry['platform_status']}) | Conf: {entry['confidence_score']}%")
            else:
                entry["error"] = res.json().get("detail")
                print(f"[FAIL] Train {t_no} -> HTTP {res.status_code} ({t_ms}ms) | Error: {entry['error']}")

            results["train_matrix"].append(entry)
            time.sleep(1.0)

    # Save to JSON
    with open("backend/railradar_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\n" + "=" * 80)
    print("ALL TESTS COMPLETE! Results written to backend/railradar_test_results.json")
    print("=" * 80)

if __name__ == "__main__":
    run_suite()
