import React from 'react';
import { Train, Gauge, Clock, ArrowUpRight } from 'lucide-react';
import { TrainData } from '../types/index';

interface TrainHeaderCardProps {
  train: TrainData;
}

export const TrainHeaderCard: React.FC<TrainHeaderCardProps> = ({ train }) => {
  return (
    <div className="train-header-card glass-panel">
      {/* Top Header Row */}
      <div className="train-header-top">
        <div className="train-id-section">
          <div className="train-icon-badge">
            <Train size={24} strokeWidth={2} />
          </div>
          <div className="train-info-text">
            <div className="train-number-title">
              <span className="train-num">{train.trainNumber}</span>
              <span className="train-name">{train.trainName}</span>
            </div>
            <div className="train-route">
              <span>{train.routeFrom}</span>
              <span className="route-arrow">→</span>
              <span>{train.routeTo}</span>
            </div>
            {(train.journeyDate || train.boardingStation) && (
              <div className="train-journey-meta-row">
                {train.journeyDate && (
                  <span className="journey-meta-badge">
                    Date: <strong>{train.journeyDate}</strong>
                  </span>
                )}
                {train.boardingStation && (
                  <span className="journey-meta-badge boarding-highlight-badge">
                    Boarding: <strong>{train.boardingStation}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="train-status-section">
          <div className="live-status-pill">
            <span className="status-dot" />
            <span className="status-label">{train.statusText}</span>
          </div>
          <span className="last-updated-text">{train.lastUpdatedText}</span>
        </div>
      </div>

      {/* Previous Station Departure Telemetry (Section 12) */}
      {train.previousStationDeparture && (
        <div className="prev-station-departure-banner">
          <div className="prev-station-left">
            <span className="prev-label-pill">PREVIOUS STATION TELEMETRY</span>
            <span className="prev-station-title">
              {train.previousStationDeparture.stationName} ({train.previousStationDeparture.stationCode})
            </span>
          </div>
          <div className="prev-station-right">
            <span className="time-chip">
              Scheduled Dep: <strong>{train.previousStationDeparture.scheduledDeparture}</strong>
            </span>
            <span className="time-chip">
              Actual Dep: <strong>{train.previousStationDeparture.actualDeparture}</strong>
            </span>
            <span className="departure-delay-chip">
              Dep. Delay: <strong>+{train.previousStationDeparture.departureDelayMin} min</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3 Metric Cards Row */}
      <div className="train-metrics-row">
        {/* Metric 1: Current Speed */}
        <div className="metric-card">
          <div className="metric-icon-wrap">
            <Gauge size={20} strokeWidth={2} />
          </div>
          <div className="metric-body">
            <div className="metric-value-row">
              <span className="metric-val">{train.currentSpeedKmH}</span>
              <span className="metric-unit">km/h</span>
            </div>
            <span className="metric-label">Current Speed</span>
          </div>
        </div>

        {/* Metric 2: Current Delay */}
        <div className="metric-card">
          <div className="metric-icon-wrap">
            <Clock size={20} strokeWidth={2} />
          </div>
          <div className="metric-body">
            <div className="metric-value-row">
              <span className="metric-val delay-amber">+{train.currentDelayMin} min</span>
            </div>
            <span className="metric-label">Current Delay</span>
          </div>
        </div>

        {/* Metric 3: Predicted Delay (Highlighted) */}
        <div className="metric-card predicted-delay-card">
          <div className="predicted-arrow">
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </div>
          <div className="metric-body">
            <div className="metric-value-row">
              <span className="metric-val delay-coral">+{train.predictedDelayMin} min</span>
            </div>
            <span className="metric-label">Predicted Delay</span>
          </div>
        </div>
      </div>

      <style>{`
        .train-header-card {
          padding: 18px 24px 16px 24px;
          background: rgba(13, 22, 36, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
        }

        .train-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
        }

        .train-id-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .train-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        .train-info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .train-number-title {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .train-num {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .train-name {
          font-size: 18px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .train-route {
          font-size: 13.5px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .train-journey-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .journey-meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .journey-meta-badge strong {
          color: #60a5fa;
        }

        .boarding-highlight-badge {
          border-color: rgba(223, 155, 62, 0.35);
          background: rgba(223, 155, 62, 0.12);
        }

        .boarding-highlight-badge strong {
          color: #df9b3e;
        }

        .prev-station-departure-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(30, 41, 59, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .prev-station-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .prev-label-pill {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 3px 8px;
          border-radius: 9999px;
          letter-spacing: 0.05em;
        }

        .prev-station-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #f8fafc;
        }

        .prev-station-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .time-chip {
          font-size: 12px;
          color: #94a3b8;
        }

        .time-chip strong {
          color: #e2e8f0;
        }

        .departure-delay-chip {
          font-size: 12px;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .route-arrow {
          color: #64748b;
          font-size: 14px;
        }

        .train-status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 6px 14px;
          border-radius: 9999px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulse-dot 2s infinite ease-in-out;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .status-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #10b981;
        }

        .last-updated-text {
          font-size: 12px;
          color: #64748b;
        }

        .train-metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.15fr;
          gap: 14px;
        }

        .metric-card {
          background: rgba(18, 29, 46, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .metric-icon-wrap {
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .metric-val {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .metric-unit {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 400;
        }

        .delay-amber {
          color: #f97316;
        }

        .delay-coral {
          color: #f43f5e;
        }

        .metric-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
        }

        .predicted-delay-card {
          background: linear-gradient(135deg, rgba(35, 20, 30, 0.8) 0%, rgba(20, 28, 44, 0.7) 100%);
          border: 1px solid rgba(244, 63, 94, 0.35);
          box-shadow: inset 0 0 16px rgba(244, 63, 94, 0.08);
        }

        .predicted-arrow {
          position: absolute;
          top: 14px;
          right: 14px;
          color: #f43f5e;
        }

        @media (max-width: 640px) {
          .train-metrics-row {
            grid-template-columns: 1fr;
          }
          .train-header-top {
            flex-direction: column;
            align-items: flex-start;
          }
          .train-status-section {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
