import React from 'react';
import { Info } from 'lucide-react';

interface InformationMessageCardProps {
  message: string;
}

export const InformationMessageCard: React.FC<InformationMessageCardProps> = ({ message }) => {
  return (
    <div className="info-message-banner">
      <div className="info-icon-badge">
        <Info size={18} strokeWidth={2.5} />
      </div>
      <p className="info-message-text">{message}</p>

      <style>{`
        .info-message-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(30, 58, 110, 0.45);
          border: 1px solid rgba(59, 130, 246, 0.35);
          border-radius: 12px;
          backdrop-filter: blur(12px);
        }

        .info-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
        }

        .info-message-text {
          font-size: 13.5px;
          line-height: 1.5;
          color: #e2e8f0;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};
