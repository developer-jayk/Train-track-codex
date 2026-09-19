import React, { useState } from 'react';
import { CloudFog, GitMerge, TrainTrack, ChevronDown } from 'lucide-react';
import { DelayFactor } from '../types/index';

interface DelayCausesCardProps {
  factors: DelayFactor[];
}

export const DelayCausesCard: React.FC<DelayCausesCardProps> = ({ factors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderIcon = (type: DelayFactor['iconType']) => {
    switch (type) {
      case 'fog':
        return <CloudFog size={18} strokeWidth={2} />;
      case 'signal':
        return <TrainTrack size={18} strokeWidth={2} />;
      case 'network':
        return <GitMerge size={18} strokeWidth={2} />;
      default:
        return <CloudFog size={18} strokeWidth={2} />;
    }
  };

  return (
    <div className="delay-causes-card glass-panel">
      {/* Header */}
      <div className="causes-header">
        <div className="causes-header-icon-title">
          <CloudFog size={20} strokeWidth={2} className="header-weather-icon" />
          <h3 className="causes-title">Why is it delayed?</h3>
        </div>
        <p className="causes-subtitle">Top factors contributing to the delay (predicted impact)</p>
      </div>

      {/* Factors List */}
      <div className="factors-list">
        {factors.map((factor) => (
          <div key={factor.id} className="factor-row">
            <div className="factor-icon-badge">
              {renderIcon(factor.iconType)}
            </div>
            <div className="factor-info">
              <span className="factor-name">{factor.title}</span>
              {factor.subtitle && (
                <span className="factor-desc">{factor.subtitle}</span>
              )}
            </div>
            <div className="factor-impact">
              <span className="impact-val">+{factor.impactMin} min</span>
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Accordion */}
      <div className="predict-accordion">
        <button
          className="accordion-trigger"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span>How does SETU predict this?</span>
          <ChevronDown
            size={16}
            className={`accordion-chevron ${isExpanded ? 'open' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="accordion-content">
            <p>
              SETU combines hyper-local atmospheric forecasts (fog density, visibility corridors), section congestion patterns, and real-time precedence decisions between passenger and freight movements to generate compounding ETA predictions.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .delay-causes-card {
          padding: 16px 22px;
          background: rgba(13, 22, 36, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
        }

        .causes-header {
          margin-bottom: 14px;
        }

        .causes-header-icon-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .header-weather-icon {
          color: #94a3b8;
        }

        .causes-title {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
        }

        .causes-subtitle {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .factors-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 18px;
        }

        .factor-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .factor-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .factor-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .factor-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #f1f5f9;
        }

        .factor-desc {
          font-size: 12px;
          color: #94a3b8;
        }

        .factor-impact {
          text-align: right;
        }

        .impact-val {
          font-family: var(--font-display);
          font-size: 14.5px;
          font-weight: 700;
          color: #f43f5e;
          letter-spacing: 0.2px;
        }

        .predict-accordion {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }

        .accordion-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 13.5px;
          color: #94a3b8;
          padding: 4px 0;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .accordion-trigger:hover {
          color: #ffffff;
        }

        .accordion-chevron {
          transition: transform 0.25s ease;
        }

        .accordion-chevron.open {
          transform: rotate(180deg);
        }

        .accordion-content {
          padding: 12px 4px 4px 4px;
          font-size: 12.5px;
          line-height: 1.6;
          color: #94a3b8;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
