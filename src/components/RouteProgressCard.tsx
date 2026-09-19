import React from 'react';
import { GitCommit, ArrowRight } from 'lucide-react';
import { StationStop } from '../types/index';

interface RouteProgressCardProps {
  stops: StationStop[];
  onViewFullRoute?: () => void;
}

export const RouteProgressCard: React.FC<RouteProgressCardProps> = ({ stops, onViewFullRoute }) => {
  return (
    <div className="route-progress-card glass-panel">
      {/* Header */}
      <div className="route-header">
        <div className="route-header-title-group">
          <GitCommit size={20} strokeWidth={2} className="route-icon" />
          <h3 className="route-title">Route Progress</h3>
        </div>
        <button
          type="button"
          className="view-full-route-btn"
          onClick={onViewFullRoute}
          title="Open complete route timetable"
        >
          <span>View Full Route</span>
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Timeline */}
      <div className="stations-timeline">
        {stops.map((stop, index) => {
          const isDeparted = stop.status === 'Departed';
          const isNext = stop.status === 'Next';

          return (
            <div key={stop.stationName} className={`timeline-row ${stop.status.toLowerCase()}`}>
              {/* Vertical line indicator */}
              <div className="timeline-indicator-col">
                <div
                  className={`station-node ${
                    isDeparted ? 'node-departed' : isNext ? 'node-next' : 'node-upcoming'
                  }`}
                >
                  {isNext && <span className="next-pulse-ring" />}
                </div>
                {index < stops.length - 1 && (
                  <div
                    className={`timeline-track-line ${
                      isDeparted ? 'track-done' : isNext ? 'track-active' : 'track-upcoming'
                    }`}
                  />
                )}
              </div>

              {/* Station Info */}
              <div className="station-content">
                <div className="station-names">
                  <span className={`station-name-text ${isNext ? 'active-station-name' : ''}`}>
                    {stop.stationName}
                  </span>
                  {stop.statusSubtext ? (
                    <span className="station-sub-highlight">{stop.statusSubtext}</span>
                  ) : (
                    <span className="station-sub-muted">{stop.status}</span>
                  )}
                </div>

                {/* Times Column */}
                <div className="station-times">
                  {stop.scheduledTime && (
                    <div className="time-row">
                      <span className="time-label">Scheduled</span>
                      <span className="time-val">{stop.scheduledTime}</span>
                    </div>
                  )}

                  {stop.actualTime && (
                    <div className="time-row">
                      <span className="time-label">Actual</span>
                      <span className="time-val actual-val">
                        {stop.actualTime}
                        {stop.delayMin !== undefined && stop.delayMin > 0 && (
                          <span className="delay-badge"> (+{stop.delayMin}m)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {stop.predictedTime && (
                    <div className="time-row">
                      <span className="time-label">Predicted</span>
                      <span className="time-val predicted-val">
                        {stop.predictedTime}
                        {stop.delayMin !== undefined && stop.delayMin > 0 && (
                          <span className="delay-badge"> (+{stop.delayMin}m)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {!stop.scheduledTime && !stop.actualTime && !stop.predictedTime && isDeparted && (
                    <>
                      <div className="time-row">
                        <span className="time-label">Scheduled</span>
                        <span className="time-val">—</span>
                      </div>
                      <div className="time-row">
                        <span className="time-label">Actual</span>
                        <span className="time-val">—</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .route-progress-card {
          padding: 16px 22px;
          background: rgba(13, 22, 36, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
        }

        .route-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .route-header-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .route-icon {
          color: #94a3b8;
        }

        .route-title {
          font-size: 16.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .view-full-route-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #3b82f6;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .view-full-route-btn:hover {
          color: #60a5fa;
        }

        .stations-timeline {
          display: flex;
          flex-direction: column;
        }

        .timeline-row {
          display: flex;
          gap: 18px;
          min-height: 48px;
          position: relative;
        }

        .timeline-indicator-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 16px;
          position: relative;
        }

        .station-node {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }

        .node-departed {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .node-next {
          background: #3b82f6;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px #3b82f6;
        }

        .next-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.6);
          animation: nodePulse 2s infinite ease-in-out;
        }

        @keyframes nodePulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        .node-upcoming {
          background: transparent;
          border: 2px solid #475569;
        }

        .timeline-track-line {
          width: 2px;
          flex: 1;
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .track-done {
          background: #10b981;
        }

        .track-active {
          background: linear-gradient(180deg, #3b82f6 0%, #334155 100%);
        }

        .track-upcoming {
          background: #334155;
        }

        .station-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex: 1;
          padding-bottom: 20px;
        }

        .station-names {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .station-name-text {
          font-size: 14.5px;
          font-weight: 500;
          color: #f1f5f9;
        }

        .active-station-name {
          font-weight: 600;
          color: #ffffff;
        }

        .station-sub-muted {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .station-sub-highlight {
          font-size: 12.5px;
          color: #60a5fa;
          font-weight: 500;
        }

        .station-times {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .time-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12.5px;
        }

        .time-label {
          color: #94a3b8;
          width: 65px;
          text-align: right;
        }

        .time-val {
          color: #ffffff;
          font-weight: 500;
          font-family: var(--font-display);
        }

        .actual-val, .predicted-val {
          color: #ffffff;
        }

        .delay-badge {
          color: #f97316;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
