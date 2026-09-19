# SETU AI: Intelligent Train ETA Forecasting & Dynamic Delay Propagation System

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



## 🔌 API Specification & Sample Responses

Below are the endpoints and data models used in the system.


### 1. ML Delay Forecast & XAI
* **Endpoint:** `GET /api/v1/trains/{train_number}/forecast`
* **Description:** Returns machine learning delay predictions along with explainable AI (XAI) root causes.

#### Sample JSON Response
```json
{
  "train_number": "12123",
  "train_name": "Deccan Queen Express",
  "current_delay_mins": 15,
  "predicted_downstream_delay_mins": 34,
  "confidence_score": 88,
  "prediction_interval": {
    "p10_mins": 28,
    "p90_mins": 42
  },
  "weather_telemetry": {
    "visibility_meters": 450,
    "condition": "Severe Fog Alert"
  },
  "root_causes": [
    {
      "factor": "Precedence Loop Line Hold",
      "impact_mins": 11
    },
    {
      "factor": "Weather Fog Speed Restriction",
      "impact_mins": 8
    }
  ]
}
```


### 2. Multi-Train Fleet Radar
* **Endpoint:** `GET /api/v1/corridor/fleet-overview`
* **Description:** Returns the active corridor state across all tracked rakes. 

#### Systemic Risk Levels
The system categorizes risk into three distinct statuses:
* 🟢 **NOMINAL** – Normal operating conditions.
* 🟡 **MODERATE PROPAGATION** – Minor delays spreading through the corridor.
* 🔴 **CRITICAL BOTTLENECK** – Severe congestion causing major holdups.


### 3. Sub-Second Broadcasts
* **Description:** Continuous coordinate streams sent every **2 seconds** to ensure ultra-smooth marker transitions on user interface (UI) maps.
* **Data Fields Transmitted:**
  * `lat` (Latitude)
  * `lng` (Longitude)
  * `speed_kmh` (Speed in Kilometers per Hour)
  * `active_block_section` (Current track block)

---

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


