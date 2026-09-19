import React from 'react';

interface FooterProps {
  onNavigate?: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent, page: 'privacy' | 'feedback') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(page);
    }
  };

  return (
    <footer className="setu-footer">
      <div className="footer-left">
        <span className="footer-brand">SETU</span>
        <span className="footer-divider">|</span>
        <span className="footer-tagline">Bridging Every Journey Together</span>
      </div>

      <div className="footer-right">
        <a
          href="#feedback"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'feedback')}
        >
          Feedback
        </a>
        <span className="footer-divider">|</span>
        <a
          href="#privacy"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'privacy')}
        >
          Privacy Policy
        </a>
        <span className="footer-divider">|</span>
        <a
          href="#privacy"
          className="footer-link"
          onClick={(e) => handleLinkClick(e, 'privacy')}
        >
          Terms
        </a>
        <span className="footer-divider">|</span>
        <span className="footer-credit">Made for a more connected India <span className="heart">❤️</span></span>
      </div>

      <style>{`
        .setu-footer {
          width: 100%;
          height: 52px;
          background: #080e18;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          font-size: 12.5px;
          color: #94a3b8;
          z-index: 10;
        }

        .footer-left, .footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-brand {
          font-weight: 800;
          letter-spacing: 2px;
          color: #ffffff;
        }

        .footer-divider {
          color: rgba(255, 255, 255, 0.2);
        }

        .footer-tagline {
          color: #94a3b8;
        }

        .footer-link {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #ffffff;
        }

        .footer-credit {
          color: #94a3b8;
        }

        .heart {
          color: #ef4444;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .setu-footer {
            height: auto;
            flex-direction: column;
            gap: 8px;
            padding: 16px 20px;
            text-align: center;
          }
          .footer-left, .footer-right {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </footer>
  );
};
