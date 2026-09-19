import React from 'react';
import { MapPin } from 'lucide-react';
import { TrainData } from '../types/index';

interface NextStationCardProps {
  train: TrainData;
}

export const NextStationCard: React.FC<NextStationCardProps> = ({ train }) => {
  return (
    <div className="next-station-card glass-panel">
      <div className="station-left">
        <div className="pin-icon-wrap">
          <MapPin size={22} strokeWidth={2} />
        </div>
        <div className="station-text-group">
          <span className="station-subtitle">Next Station</span>
          <div className="station-name-row">
            <span className="station-main-name">{train.nextStationName}</span>
          </div>
          <span className="station-eta-tag">{train.nextStationEta}</span>
        </div>
      </div>

      <div className="station-right">
        <span className="platform-label">Platform</span>
        <span className="platform-value">{train.platform}</span>
      </div>

      <style>{`
        .next-station-card {
          padding: 14px 24px;
          background: rgba(13, 22, 36, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .station-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .pin-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .station-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .station-subtitle {
          font-size: 13px;
          color: #94a3b8;
        }

        .station-name-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .station-main-name {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .station-eta-tag {
          font-size: 13.5px;
          color: #94a3b8;
          font-weight: 400;
        }

        .station-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          padding-right: 8px;
        }

        .platform-label {
          font-size: 13px;
          color: #94a3b8;
        }

        .platform-value {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};
