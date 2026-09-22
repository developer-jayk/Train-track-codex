# backend/test_real_data.py
"""
Verification Script for SETU Real Data First Architecture
Tests all required trains from Section 15 and inspects raw and parsed telemetry.
"""

import httpx
import json
import os
from datetime import datetime

API_BASE = "http://127.0.0.1:8000"
RAPIDAPI_HOST = "irctc1.p.rapidapi.com"
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")

TRAINS_TO_TEST = [
    "12123",  # Deccan Queen Express
    "22221",  # Mumbai CSMT Rajdhani
    "12051",  # Jan Shatabdi Express
    "15623",  # BGKT KYQ Express
    "22436",  # Vande Bharat Express
    "12301",  # Howrah Rajdhani Express
    "12951",  # Mumbai Tejas Rajdhani
    "12007",  # Shatabdi Express
    "12625",  # Kerala Express (another real train)
    "99999",  # Definitely invalid train number
]

def test_trains():
    results = []
    print("=" * 80)
    print("SETU REAL DATA FIRST VERIFICATION SUITE")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 80)

    for train_no in TRAINS_TO_TEST:
        print(f"\n[TESTING TRAIN]: {train_no}")
        
        # 1. Query Raw RapidAPI Endpoint Directly
        rapid_url = f"https://{RAPIDAPI_HOST}/api/v1/liveTrainStatus"
        headers = {"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST}
        params = {"trainNo": train_no, "startDay": "0"}
        
        raw_status_code = None
        raw_body_snippet = None
        try:
            r_rapid = httpx.get(rapid_url, headers=headers, params=params, timeout=5.0)
            raw_status_code = r_rapid.status_code
            raw_body_snippet = r_rapid.text[:200]
        except Exception as e:
            raw_status_code = "EXCEPTION"
            raw_body_snippet = str(e)

        print(f"  1. Raw RapidAPI Status: {raw_status_code}")
        print(f"     Raw Body Snippet: {raw_body_snippet}")

        # 2. Query SETU Live Forecast Endpoint (Standard Mode)
        backend_url = f"{API_BASE}/api/v1/trains/{train_no}/forecast"
        b_res = httpx.get(backend_url, timeout=5.0)
        
        print(f"  2. SETU Backend HTTP Status: {b_res.status_code}")
        
        parsed_record = {
            "train_number": train_no,
            "raw_rapidapi_status": raw_status_code,
            "raw_rapidapi_snippet": raw_body_snippet,
            "backend_http_status": b_res.status_code,
            "data_mode": None,
            "train_name": None,
            "journey_date": None,
            "current_location": None,
            "current_delay": None,
            "current_speed": None,
            "platform": None,
            "platform_status": None,
            "station_sequence": None,
            "scheduled_times": None,
            "actual_times": None,
            "detail": None
        }

        if b_res.status_code == 200:
            data = b_res.json()
            parsed_record.update({
                "data_mode": data.get("data_mode"),
                "train_name": data.get("train_name"),
                "journey_date": data.get("journey_date"),
                "current_location": data.get("current_status"),
                "current_delay": data.get("current_delay_mins"),
                "current_speed": data.get("current_speed_kmh"),
                "platform": data.get("platform"),
                "platform_status": data.get("platform_status"),
                "station_sequence": [st["station"] for st in data.get("timeline", [])],
                "confidence_score": data.get("confidence_score")
            })
            print(f"     [Parsed] Data Mode: {parsed_record['data_mode']}")
            print(f"     [Parsed] Train: {parsed_record['train_name']}")
            print(f"     [Parsed] Platform: {parsed_record['platform']} (status: {parsed_record['platform_status']})")
            print(f"     [Parsed] Confidence: {parsed_record.get('confidence_score')}%")
        else:
            err_data = b_res.json()
            parsed_record["detail"] = err_data.get("detail")
            parsed_record["data_mode"] = "unavailable" if b_res.status_code == 503 else ("not_found" if b_res.status_code == 404 else "error")
            print(f"     [Error Response Detail]: {parsed_record['detail']}")

        # 3. Query SETU Simulation Mode (Explicit Demo Inspection)
        if train_no in ["12123", "22221", "12051", "99999"]:
            sim_res = httpx.get(f"{backend_url}?mode=simulated", timeout=5.0)
            print(f"  3. Demo/Simulated Mode HTTP: {sim_res.status_code}")
            if sim_res.status_code == 200:
                s_json = sim_res.json()
                print(f"     [Simulated] data_mode: {s_json.get('data_mode')}, platform: {s_json.get('platform')}, confidence: {s_json.get('confidence_score')}%")
            else:
                print(f"     [Simulated Error]: {sim_res.json().get('detail')}")

        results.append(parsed_record)

    # Save complete test output to scratch
    with open("backend/test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\n" + "=" * 80)
    print("Verification complete! Full results written to backend/test_results.json")
    print("=" * 80)

if __name__ == "__main__":
    test_trains()
