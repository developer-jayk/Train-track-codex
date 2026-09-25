# SETU AI: Intelligent Train ETA Forecasting & Dynamic Delay Propagation System

## Simple dashboard

The project now includes a beginner-friendly static dashboard in `index.html`, `dashboard.css`, and `dashboard.js`.

1. Start the backend from the `backend` folder:

   ```powershell
   uvicorn main:app --reload --port 8000
   ```

2. Start the frontend from the project root:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the Vite URL and log in with the demo account:

   - Username: `student`
   - Password: `setu123`

The dashboard calls the forecast, route/telemetry, fleet overview, station board, dispatch solver, and feedback APIs. To point the dashboard at a deployed backend, set `window.SETU_API_URL` before `dashboard.js` loads, or set `localStorage.setItem("setu_api_url", "https://your-backend.example")` in the browser console.

Hackathon-ready additions include a live telemetry monitor that refreshes every three seconds, corridor route intelligence with station markers, a calculated journey-risk score, and a downloadable plain-text train report. These are connected to existing backend endpoints rather than decorative demo controls.

Gemini is optional and is used only for plain-language explanations of verified forecast facts. Put a newly rotated key in `backend/.env` as `GEMINI_API_KEY=...`; never put it in browser JavaScript. Gemini does not replace a railway live-status provider.

The browser login is only a simple demo gate. It is not a secure authentication system; production login should be implemented as a backend-authenticated flow with hashed passwords and sessions or tokens.

## Deploy on Render

This repository includes [`render.yaml`](./render.yaml). Create a new Render Blueprint from the GitHub repository, add the secret environment variables when prompted, and deploy. The deployed dashboard is available at `/dashboard/`; the API health check is available at `/health`. The root URL `/` redirects to the dashboard.

SETU AI is a next-generation predictive intelligence platform built to eliminate downstream arrival blind spots across massive rail networks like Indian Railways. By pairing advanced machine learning with Explainable AI (XAI), the platform upgrades traditional reactive tracking into an active, probabilistic dispatching ecosystem.

---
## 📸 Interactive System Preview

| Live Geospatial Tracking & Telemetry | Explainable AI (XAI) & Delay Intervals |
| :--- | :--- |
| Real-time multi-corridor WebSocket rake movement <br><br> Dynamic vector polylines across 4 Indian Railway trunk routes | Uncertainty bounds & root-cause <br><br> Breakdown of hold reasons (+14m Precedence, +8m Fog) |


---

## ⚡ Why Existing Systems Fail vs. Our Solution


| Feature | Legacy Rail Tracking (NTES / Apps) | RailForecast AI Engine |
| :--- | :--- | :--- |
| **Delay Calculation** | Static & linear | Compounding ML model accounting for section density |
| **ETA Reliability** | Single deterministic timestamp (frequently wrong) | Probabilistic Confidence Intervals** |
| **Transparency (XAI)** | Blank delay status or generic "operational reason" | **Quantified root causes** (Precedence hold vs. Weather) |
| **Corridor Awareness** | Siloed to individual trains | **Fleet-wide radar** tracking cascade congestion |
| **Map Rendering** | Static station-to-station straight lines | **Vector polylines + Sub-second WebSocket interpolation** |


---

## 🚀 The Proposed Solution


**SETU AI** operates as a two-way predictive system designed specifically for **commuters** and **network dispatchers**. By synthesizing historical schedule performance, real-time line occupancy, live meteorological feeds, and locomotive precedence protocols, the engine outputs highly accurate arrival projections alongside transparent explanations for service disruptions.


---

## 🧠 Machine Learning & Inference Pipeline

The engine formulates delay propagation as an asymmetric non-linear regression problem:

$$Delta_{\text{downstream}} = f(\Delta_{\text{current}}, D_{\text{remaining}}, V_{\text{weather}}, P_{\text{rake}}, H_{\text{density}})$$

```text
[ Feature Extraction ]
  ├── Current Delay (mins)
  ├── Distance to Terminal (km)
  ├── Live Atmospheric Visibility (Open-Meteo API in meters)
  ├── Priority Class (1.0 for Rajdhani/Vande Bharat, 0.4 for Passenger/Freight)
  └── Headway Saturation Index (0.0 to 1.0)
         │
         ▼
[ Scikit-Learn Gradient Boosting Regressor ]
         │
         ├── Mean Prediction (Compounding ETA Delay)
         ├── Quantile Loss Regression (P10 lower bound & P90 upper bound)
         └── Attribution Engine (XAI feature weight extraction)
```

---
## 📐 Production Architecture & Data Flow
```

┌─────────────────────────────────────────────────────────────┐
│                       External Data Layer                   │
│   RapidAPI (IRCTC Telemetry)  │   Open-Meteo Weather API    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         FastAPI Resilient Ingestion & Caching Layer         │
│   • 30s TTL In-Memory Store (Zero API Quota Burnout)        │
│   • Graceful Deterministic Fallback Engine                  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      ML & XAI Predictor      │ │ Geospatial Route Simulator │
│ • Compounding Delay Model    │ │ • Multi-Corridor Polylines │
│ • P10-P90 Confidence Windows │ │ • Dynamic Lat/Lng Stepper  │
│ • Root-Cause Attribution     │ │ • Block Section Resolution │
└──────────────┬───────────────┘ └─────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Client Communication Interfaces             │
│    REST Endpoints (/api/v1)   │   WebSocket Stream (/ws)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Frontend Mission Control (Leaflet)            │
│  Real-time Rake Motion • Dynamic Routes • Fleet Radar Table │
└─────────────────────────────────────────────────────────────┘
```


---
## 🛣️ Covered High-Density Corridors
The geospatial simulator maps real Indian Railway trunk routes dynamically based on train numbers:

Central Corridor: Lokmanya Tilak Terminus (Mumbai) → Varanasi Junction (Train #12123)

Grand Chord Route: New Delhi → Prayagraj → Howrah (Train #22436, #12301)

Western Trunk Line: Hazrat Nizamuddin (Delhi) → Kota → Mumbai Central (Train #12951)

Southern Corridor: KSR Bengaluru → Jolarpettai → MGR Chennai Central (Train #12007)



## 🔌 SETU AI: Core API Reference & Response Schemas

SETU AI implements a rigorous, strongly-typed data validation ecosystem constructed via **FastAPI Validation Layouts** and **Pydantic Structural Model Contracts**. The platform operates under a strict `REAL_DATA_FIRST` engineering mandate. Developers can access and audit local interactive Swagger environments at `http://127.0.0`.

---

### 🧠 1. Passenger Intelligence: ML Delay Prediction & Explainable AI (XAI)
* **Resource Path:** `GET /api/v1/trains/{train_number}/forecast`
* **Functional Overview:** Simultaneously aggregates static scheduling matrices and live transit metrics from the `RailRadar` streaming pipeline. It merges these inputs with real-time atmospheric variables via the `Open-Meteo` framework, channeling the final feature arrays into an asymmetric Gradient Boosting Regressor model.
* **URL Parameters:**
  * `date` (Optional String, expected format: `YYYY-MM-DD` — defaults to the active Indian Standard Time boundary if omitted).
  * `boarding_station` (Optional String — verifies the argument against confirmed route stop codes).
  * `mode` (Optional String, configuration limits: `live` | `simulated` | `demo`).
* **⚠️ Error Handling Matrix:** 
  * `400 Bad Request` — Triggered if the train identifier length falls outside the 3–8 character boundary, or if the specified `boarding_station` does not map to a valid stop along the official route itinerary.
  * `404 Not Found` — Issued when the train code is completely missing from current live monitoring grids or the static evaluation environment.
  * `503 Service Unavailable` — Returned if the primary railway data stream experiences an outage. The system strictly avoids substituting synthetic or placeholder data under this condition.

#### Production JSON Payload (200 OK — Hybrid Processing)
```json
{
  "train_number": "12123",
  "train_name": "Deccan Queen Express",
  "journey_date": "2026-09-25",
  "boarding_station": "LTT",
  "telemetry_source": "RAILRADAR_AUTHORITATIVE_LIVE",
  "data_source": "railradar",
  "data_mode": "hybrid",
  "current_status": "Running late by 15 mins",
  "current_speed_kmh": 85,
  "current_delay_mins": 15,
  "predicted_downstream_delay_mins": 34,
  "confidence_score": 88,
  "prediction_interval": {
    "p10_mins": 28,
    "p90_mins": 42
  },
  "next_station": "Karjat Junction",
  "weather_telemetry": {
    "visibility_meters": 450,
    "condition": "Severe Fog Alert",
    "weather_status": "available"
  },
  "platform": "Platform 3",
  "platform_status": "available",
  "previous_station_departure": {
    "station_code": "KYN",
    "station_name": "Kalyan Junction",
    "scheduled_departure": "19:10",
    "actual_departure": "19:25",
    "departure_delay_mins": 15
  },
  "root_causes": [
    {
      "factor": "Section Headway Density (0.74)",
      "impact_mins": 11
    },
    {
      "factor": "Dense Fog & Poor Visibility (450m)",
      "impact_mins": 8
    }
  ],
  "timeline": [
    {
      "station": "Lokmanya Tilak Terminus",
      "scheduled": "18:40",
      "predicted": "18:40",
      "status": "Departed"
    }
  ],
  "historical_data_status": "LIVE_FEED"
}
```

---

### 💬 2. Prediction Context & Narrative Explainer
* **Resource Path:** `POST /api/v1/trains/{train_number}/explanation`
* **Functional Overview:** Transmits a calculated prediction dataset directly into the Gemini LLM infrastructure, translating complex mathematical distribution models into intuitive, plain-text alerts for travelers.
* **Payload Structure (JSON):**
```json
{
  "forecast": {
    "train_number": "12123",
    "current_delay_mins": 15,
    "weather_telemetry": { "condition": "Severe Fog Alert" }
  }
}
```

---

### 🗺️ 3. Geographic Telemetry: Route Polylines & Live Mapping Data
* **Resource Path:** `GET /api/v1/trains/{train_number}/route-geometry`
* **Functional Overview:** Retrieves authenticated GeoJSON vectors and ordered node sequences directly from the `RailRadar` engine, facilitating smooth polyline rendering on front-end Leaflet canvas elements.
* **URL Parameters:** `date` (Optional), `mode` (Supported values: `live` | `simulated` | `demo`).

#### Production JSON Payload (200 OK)
```json
{
  "train_number": "12123",
  "status": "ACTIVE_GEOJSON_VERIFIED",
  "data_source": "railradar",
  "data_mode": "live",
  "polyline": [
    [19.0667, 72.8900],
    [19.2345, 73.1389]
  ],
  "critical_waypoints": [
    { "code": "LTT", "name": "Lokmanya Tilak Terminus", "lat": 19.0667, "lng": 72.8900 }
  ],
  "stations": []
}
```

---

### 📊 4. Locational & Operational Telemetry Tracker
* **Resource Path:** `GET /api/v1/trains/{train_number}/telemetry`
* **Functional Overview:** A lightweight, high-frequency polling endpoint designed to return current moving-block telemetry values for isolated active locomotives.

---

### 🧳 5. Station Platform Assignments & Coach Layouts
* **Resource Path:** `GET /api/v1/trains/{train_number}/coaches/{station_code}`
* **Functional Overview:** Pulls explicit physical coach arrangements, train reversal states, and exact arrival platform configurations without using synthetic estimates.

#### Production JSON Payload (200 OK)
```json
{
  "train_number": "12123",
  "train_name": "Deccan Queen Express",
  "station_code": "KYN",
  "station_name": "Kalyan Junction",
  "platform": "3",
  "platform_status": "available",
  "reversal": false,
  "total_coaches": 22,
  "formation": "ENG-GEN-A1-B1-B2-S1-S2-GEN",
  "rake": [],
  "data_source": "railradar"
}
```

---

### 🔍 6. Inter-Station Transit Discovery Engine
* **Resource Path:** `GET /api/v1/trains/between/{from_station}/{to_station}`
* **Functional Overview:** Details scheduled rolling stock operating directly between two designated transportation hubs over a chosen time horizon.

---

### 🏓 7. Live Terminal Departure & Arrival Boards
* **Resource Path:** `GET /api/v1/stations/{station_code}/board`
* **Functional Overview:** Generates an active log of scheduled versus adjusted train movement timings across a distinct station hub, using a customizable sliding lookahead window.
* **URL Parameters:** `hours` (Integer value — falls back to a 4-hour window by default).

---

### 📡 8. Network Operations Radar: Regional Fleet Overview
* **Resource Path:** `GET /api/v1/corridor/fleet-overview`
* **Functional Overview:** Monitored tracking of multiple active assets (`12919`, `12123`, `22221`, `22436`, `12301`) over saturated trunk lines to diagnose and mitigate cascading infrastructure delays.

#### Corridor System Risk Architecture
* 🟢 **NOMINAL** — Efficient train pacing across the designated block section.
* 🟡 **MODERATE PROPAGATION** — Minor downstream delay leaking into subsequent segments.
* 🔴 **CRITICAL BOTTLENECK** — Pervasive gridlock and capacity saturation causing network immobility.

---

### 🎛️ 9. Dispatch Simulation Architecture: "What-If" Optimizer
* **Resource Path:** `POST /api/v1/authority/dispatch-solve`
* **Functional Overview:** Evaluates safety margins and headway gaps (`<3.2km`) between conflicting traffic demands, proposing dynamic loop-line siding holds to prioritize express trains.
* **URL Parameters:** `train_a` (String), `train_b` (String), `overtakes_allowed` (Boolean).

#### Production JSON Payload (200 OK)
```json
{
  "section": "Satna (STA) - Manikpur (MKP) Single Line Block",
  "conflict_identified": "Train 12123 trailing Train 12301 within headway threshold (<3.2km)",
  "optimal_action": "Hold Train 12123 at Satna Loop Line 2 for 7 minutes",
  "rationale": "Clears path for higher priority rake 12301 avoiding cascade delay across 4 following sections",
  "projected_systemic_delay_saved_mins": 24,
  "execution_status": "APPROVED_DISPATCH_PLAN"
}
```

---

### ✉️ 10. Passenger Feedback Ingestion Pipeline (Anti-Abuse Protected)
* **Resource Path:** `POST /api/v1/feedback`
* **Functional Overview:** Collects live crowd-sourced observations and maps them to appropriate internal developer logs.
* **🛡️ Security Rate Limiting:** Enforces a rigid limit of 5 submissions per rolling 10-minute window per client IP address to prevent system abuse (Returns `429 Too Many Requests`).

#### Input Schema Specification (`FeedbackSubmissionRequest`):
```json
{
  "feedback_type": "Variance Report",
  "rating": 5,
  "message": "Train is currently held right outside the outer signal.",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "train_number": "12123",
  "journey_date": "2026-09-25",
  "boarding_station": "LTT"
}
```

---

### 🔌 11. Sub-Second Real-Time Telemetry Streaming (WebSockets)
* **Connection Handshake:** `ws://127.0.0.1:8000/ws/trains/{train_number}/live`
* **Functional Overview:** Establishes a persistent, bidirectional WebSocket connection pushing coordinate payloads every **2 seconds** to drive real-time asset tracking animations on map frontends.

#### Outbound Telemetry Data Frame:
```json
{
  "train_number": "12123",
  "telemetry": {
    "latitude": 19.0667,
    "longitude": 72.8900,
    "current_speed_kmh": 78,
    "active_block_section": "CR-KYN-IGP-02",
    "section_progress_pct": 64.5,
    "timestamp": 1790382900.2
  },
  "server_timestamp": 1790382902.5
}
```


## ⚙️ Quickstart & Local Setup

Prerequisites Python 3.10 or higher

Git

Installation Steps Bash

### 1. Clone the repository
```bash
git clone https://github.com/sahejpreet-glitch/Train-track-codex.git cd Train-track-codex
```

### 2. Set up virtual environment
```bash
python -m venv venv
```

#### On Windows:
```bash
.\venv\Scripts\activate
```

#### On Linux/macOS:
```bash
source venv/bin/activate
```

### 3. Install core dependencies
```bash
pip install -r requirements.txt
```

### 4. Launch backend server

```bash
uvicorn main:app --reload --port 8000
```
View Live Dashboard Open index.html in any modern web browser or run with VS Code Live Server. The dashboard will automatically latch onto ws://127.0.0.1:8000 and stream live data.

Interactive Swagger Docs: http://127.0.0

System Health Endpoint: http://127.0.0


---

## 👥 Engineering Team
Developed for the Hackathon by:IIT BHU

Backend, ML & Geospatial Architecture: Ayush Kumar & Jay Kumar

Project Lead & Frontend Integration: Sahejpreet Singh
