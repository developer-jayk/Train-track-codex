# TEAM_NAME AI: Intelligent Train ETA Forecasting & Dynamic Delay Propagation System

An end-to-end predictive intelligence platform engineered to eliminate downstream delay blindspots in mega-scale rail networks like Indian Railways. By combining machine learning with Explainable AI (XAI), **TEAM_NAME AI** transforms reactive train tracking into proactive, probabilistic dispatch and transit scheduling.

---

## 🎯 The Core Problem

Traditional rail tracking systems are **reactive**. They only report delays *after* a train has physically passed a sensor checkpoint. This creates critical operational bottlenecks:

* **Downstream Compounding Blindspot:** Naive calculations fail to forecast how minor upstream delays compound exponentially due to junction saturation.
* **Static Deterministic Figures:** Passengers receive static arrival times that fluctuate wildly, causing anxiety and missed multi-modal connections.
* **Opacity in Root Causes:** Commuters receive generic "delayed" flags with zero context regarding weather (e.g., heavy fog) or operational choices.
* **Dispatcher Data Silos:** Railway authorities lack real-time predictive simulation tools to evaluate how a single routing decision ripples across a busy corridor.

---

## 🚀 The Proposed Solution

**TEAM_NAME AI** is a dual-stakeholder predictive engine designed for both **passengers** and **railway dispatch authorities**.The system fuses historical corridor data, live section density, real-time weather feeds, and train priority matrices to deliver highly accurate downstream forecasts and transparent delay reasons.

---

## ✨ Key Features & Technical Innovation

### 🔮 1. Proactive Downstream Forecasting
Predicts station-level arrival and departure times up to **4–5 stations in advance** before physical delays manifest.

### 📊 2. Confidence Interval Modeling
Replaces misleading static timestamps with quantified prediction windows and probabilistic reliability scores.

### 🧠 3. Explainable AI (XAI) Root-Cause Attribution
Translates black-box ML predictions into human-readable delay drivers (e.g., *70% Fog Visibility Impact vs. 30% Precedence Track Regulation*).

### 🎛️ 4. Dual-Stakeholder Interactive Portals
* **For Commuters:** Visualizes transit connection risks and live tracking.
* **For Operators:** A complete "What-If" sandbox suite allowing dispatchers to simulate how holding a lower-priority rake ripples across upcoming traffic corridors.

### 🛡️ 5. Resilient Architecture
Built with a **3-tier graceful degradation pipeline** and open, low-latency B2B REST APIs to feed third-party ride-hailing and transit logistics platforms seamlessly.

---

## 🛠️ Tech Stack & Production Environment

The project leverages a robust, modern data and API layer designed for high throughput and rapid analytical execution:

* **API & Web Layer:** `FastAPI` (v0.141.1) & `Uvicorn` (v0.53.0) for high-performance asynchronous networking.
* **Machine Learning Engine:** `Scikit-Learn` (v1.9.1) & `SciPy` (v1.18.1) for predictive modeling.
* **Data Processing Pipeline:** `Pandas` (v3.0.5) & `NumPy` (v2.5.3) for rapid real-time matrix transformations.
* **Async Telemetry Networking:** `HTTPX` (v0.28.1) & `AnyIO` (v4.15.1) for non-blocking fetch of live weather telemetry.
* **Data Validation:** `Pydantic` (v2.13.5) ensuring strict, error-free incoming API payloads.

---

## ⚙️ Local Installation & Setup

Get the system up and running on your local machine in two quick steps.

### Prerequisites
Make sure you have Python 3.10+ installed on your system.

### 1. Clone & Install Dependencies
Navigate into your project folder and install the required packages:
```bash
pip install -r requirements.txt
```

### 2. Launch the Predictive Server
Start the local FastAPI development server using Uvicorn:
```bash
uvicorn main:app --reload
```
Once started, you can access the interactive API docs at `http://127.0.0`.

---

## 💼 Business & Societal Impact

### 🗺️ Passenger Experience
Reduces severe station waiting anxiety and eliminates missed connecting trains via automated, predictive connection-risk alerts.

### 🚉 Station Operations
Mitigates dangerous platform overcrowding by streamlining passenger arrival patterns and optimizing train turnaround cycles.

### 🔌 Ecosystem Integration
Powers external third-party platforms (ride-hailing, transit logistics, and hospitality) with low-latency APIs for just-in-time station pickups.
