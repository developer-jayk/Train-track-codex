import React from 'react';
import { TrainData } from '../types/index';

interface PredictionConfidenceCardProps {
  train: TrainData;
}

export const PredictionConfidenceCard: React.FC<PredictionConfidenceCardProps> = ({ train }) => {
  // SVG circular gauge calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (train.confidencePercent / 100) * circumference;

  return (
    <div className="confidence-card glass-panel">
      <div className="confidence-left">
        <div className="gauge-wrapper">
          <svg width="68" height="68" viewBox="0 0 68 68" className="confidence-gauge">
            {/* Background circle */}
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
              fill="none"
            />
            {/* Progress arc */}
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke="#10b981"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="none"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))',
                transition: 'stroke-dashoffset 0.8s ease',
              }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-val">{train.confidencePercent}%</span>
          </div>
        </div>

        <div className="confidence-title-group">
          <h3 className="confidence-title">Prediction Confidence</h3>
          <p className="confidence-sub">{train.confidenceText}</p>
        </div>
      </div>

      <div className="confidence-right">
        <span className="range-label">Expected delay range</span>
        <span className="range-value">
          +{train.expectedDelayRange[0]} to +{train.expectedDelayRange[1]} min
        </span>
        <div className="range-bar-track">
          <div className="range-bar-indicator" />
        </div>
      </div>

      <style>{`
        .confidence-card {
          padding: 14px 24px;
          background: rgba(13, 22, 36, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .confidence-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .gauge-wrapper {
          position: relative;
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .confidence-gauge {
          transform: rotate(0deg);
        }

        .gauge-center-text {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-val {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: #10b981;
        }

        .confidence-title-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .confidence-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .confidence-sub {
          font-size: 13px;
          color: #94a3b8;
        }

        .confidence-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          min-width: 170px;
        }

        .range-label {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .range-value {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.3px;
        }

        .range-bar-track {
          width: 130px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
          position: relative;
        }

        .range-bar-indicator {
          position: absolute;
          left: 15%;
          width: 70%;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
        }

        @media (max-width: 640px) {
          .confidence-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .confidence-right {
            align-items: flex-start;
            width: 100%;
          }
          .range-bar-track {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
