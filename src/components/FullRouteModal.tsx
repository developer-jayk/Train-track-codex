import React from 'react';
import { X, MapPin, Clock, Navigation, AlertTriangle } from 'lucide-react';
import { StationStopDetail } from '../types/index';

interface FullRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  boardingStation?: string;
  stations: StationStopDetail[];
}

export const FullRouteModal: React.FC<FullRouteModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  journeyDate,
  boardingStation,
  stations,
}) => {
  if (!isOpen) return null;

  return (
    <div className="full-route-overlay" onClick={onClose}>
      <div className="full-route-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-pill">
              <Navigation size={13} style={{ marginRight: 6 }} />
              COMPLETE ROUTE TIMETABLE
            </div>
            <h2 className="modal-title">
              <span className="modal-train-no">{trainNumber}</span>
              <span className="modal-train-name">{trainName}</span>
            </h2>
            <div className="modal-subtitle-row">
              <span className="modal-date-tag">
                <Clock size={13} style={{ marginRight: 4 }} />
                Journey Date: {journeyDate}
              </span>
              {boardingStation && (
                <span className="modal-boarding-tag">
                  <MapPin size={13} style={{ marginRight: 4 }} />
                  Boarding: {boardingStation}
                </span>
              )}
              <span className="modal-stops-count">{stations.length} Scheduled Stops</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Route Timetable" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Route Table / List */}
        <div className="modal-body-scroll">
          {stations.length === 0 ? (
            <div className="no-stops-message">
              <AlertTriangle size={24} className="warn-icon" />
              <p>No complete route schedule returned for this train date.</p>
            </div>
          ) : (
            <div className="route-stops-table">
              <div className="table-header-row">
                <span className="th-col col-station">Station & Code</span>
                <span className="th-col col-sched">Scheduled (Arr / Dep)</span>
                <span className="th-col col-actual">Actual / Est. (Arr / Dep)</span>
                <span className="th-col col-delay">Delay</span>
                <span className="th-col col-status">Status</span>
              </div>

              {stations.map((stop, idx) => {
                const isLast = idx === stations.length - 1;
                const isDeparted = stop.status === 'Departed' || stop.status === 'Arrived';
                const isInTransit = stop.status === 'In Transit';
                const isBoarding =
                  stop.isBoarding ||
                  (boardingStation &&
                    (boardingStation.toUpperCase() === stop.stationCode.toUpperCase() ||
                      boardingStation.toUpperCase() === stop.stationName.toUpperCase()));

                return (
                  <div
                    key={stop.stationCode}
                    className={`stop-row ${isDeparted ? 'row-departed' : isInTransit ? 'row-active' : 'row-upcoming'} ${
                      isBoarding ? 'row-boarding-highlight' : ''
                    }`}
                  >
                    {/* Station Name & Code */}
                    <div className="td-col col-station">
                      <div className="station-node-visual">
                        <span
                          className={`node-dot ${
                            isDeparted ? 'dot-departed' : isInTransit ? 'dot-active' : 'dot-upcoming'
                          }`}
                        />
                        {!isLast && <span className="node-line" />}
                      </div>
                      <div className="station-meta-info">
                        <div className="station-name-line">
                          <span className="station-title">{stop.stationName}</span>
                          <span className="station-code-pill">({stop.stationCode})</span>
                          {isBoarding && <span className="boarding-badge">YOUR BOARDING STOP</span>}
                        </div>
                        <div className="station-extra-meta">
                          {stop.platform && <span className="platform-tag">{stop.platform}</span>}
                          <span className="distance-tag">{stop.distanceKm} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Timings */}
                    <div className="td-col col-sched">
                      <div className="time-pair">
                        <span className="time-sub">Arr: {stop.scheduledArrival}</span>
                        <span className="time-sub">Dep: {stop.scheduledDeparture}</span>
                      </div>
                    </div>

                    {/* Actual / Predicted Timings */}
                    <div className="td-col col-actual">
                      <div className="time-pair">
                        <span className="time-val actual-time">Arr: {stop.actualArrival}</span>
                        <span className="time-val actual-time">Dep: {stop.actualDeparture}</span>
                      </div>
                    </div>

                    {/* Delay */}
                    <div className="td-col col-delay">
                      {stop.delayMin > 0 ? (
                        <span className="delay-badge-val late">+{stop.delayMin} min</span>
                      ) : (
                        <span className="delay-badge-val ontime">On Time</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="td-col col-status">
                      <span className={`status-pill pill-${stop.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                        {isInTransit && <span className="pulse-ping" />}
                        {stop.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="footer-notice">
            Timetable derived from official corridor dispatch schedule and real-time telemetry.
          </span>
          <button type="button" className="close-action-btn" onClick={onClose}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        .full-route-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(3, 7, 18, 0.75);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
        }

        .full-route-modal {
          width: 100%;
          max-width: 980px;
          max-height: 85vh;
          background: rgba(10, 16, 28, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 130, 246, 0.1);
          animation: modalAppear 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          padding: 22px 28px 18px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: rgba(13, 22, 38, 0.6);
        }

        .modal-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(223, 155, 62, 0.12);
          color: #df9b3e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(223, 155, 62, 0.25);
          margin-bottom: 8px;
        }

        .modal-title {
          font-family: var(--font-display, sans-serif);
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .modal-train-no {
          color: #60a5fa;
          font-variant-numeric: tabular-nums;
        }

        .modal-subtitle-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #94a3b8;
        }

        .modal-date-tag,
        .modal-boarding-tag {
          display: inline-flex;
          align-items: center;
          color: #cbd5e1;
        }

        .modal-stops-count {
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .modal-body-scroll {
          padding: 16px 28px;
          overflow-y: auto;
          flex: 1;
        }

        .no-stops-message {
          padding: 48px;
          text-align: center;
          color: #94a3b8;
        }

        .route-stops-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .table-header-row {
          display: grid;
          grid-template-columns: 2.2fr 1.6fr 1.6fr 1fr 1fr;
          padding: 10px 16px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .stop-row {
          display: grid;
          grid-template-columns: 2.2fr 1.6fr 1.6fr 1fr 1fr;
          padding: 12px 16px;
          border-radius: 10px;
          align-items: center;
          transition: background 0.15s ease;
          border: 1px solid transparent;
        }

        .stop-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .row-active {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.25);
        }

        .row-boarding-highlight {
          border-left: 3px solid #df9b3e;
          background: rgba(223, 155, 62, 0.06);
        }

        .col-station {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .station-node-visual {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 14px;
        }

        .node-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 2;
        }

        .dot-departed {
          background: #3b82f6;
          box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
        }

        .dot-active {
          background: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
          border: 2px solid #ffffff;
        }

        .dot-upcoming {
          background: #334155;
          border: 2px solid #475569;
        }

        .node-line {
          position: absolute;
          top: 12px;
          width: 2px;
          height: 38px;
          background: rgba(255, 255, 255, 0.08);
          z-index: 1;
        }

        .station-meta-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .station-name-line {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .station-title {
          font-size: 14.5px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .station-code-pill {
          font-size: 12px;
          color: #94a3b8;
          font-variant-numeric: tabular-nums;
        }

        .boarding-badge {
          background: rgba(223, 155, 62, 0.2);
          color: #df9b3e;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(223, 155, 62, 0.35);
        }

        .station-extra-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: #64748b;
        }

        .platform-tag {
          color: #38bdf8;
        }

        .time-pair {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12.5px;
        }

        .time-sub {
          color: #94a3b8;
        }

        .actual-time {
          color: #e2e8f0;
          font-weight: 500;
        }

        .delay-badge-val {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .delay-badge-val.late {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .delay-badge-val.ontime {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .pill-departed,
        .pill-arrived {
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }

        .pill-intransit {
          background: rgba(16, 185, 129, 0.18);
          color: #34d399;
          position: relative;
        }

        .pulse-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .pill-upcoming {
          background: rgba(100, 116, 139, 0.15);
          color: #94a3b8;
        }

        .modal-footer {
          padding: 16px 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(13, 22, 38, 0.6);
        }

        .footer-notice {
          font-size: 12px;
          color: #64748b;
        }

        .close-action-btn {
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-action-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .table-header-row {
            display: none;
          }

          .stop-row {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            padding: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          .col-station,
          .col-sched,
          .col-actual,
          .col-delay,
          .col-status {
            width: 100%;
          }

          .modal-title {
            font-size: 19px;
          }
        }
      `}</style>
    </div>
  );
};
