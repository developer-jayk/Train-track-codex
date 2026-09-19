import React from 'react';
import { Home, Users, Train } from 'lucide-react';

interface SidebarProps {
  activePage: 'home' | 'track' | 'about' | 'privacy' | 'feedback';
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  return (
    <aside className="landing-sidebar">
      {/* Top Logo & Branding */}
      <div className="sidebar-brand-section">
        <div className="setu-bridge-icon">
          <svg width="52" height="30" viewBox="0 0 56 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 28C10 14 20 6 28 6C36 6 46 14 53 28"
              stroke="#e5a952"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M6 28C13 18 21 11 28 11C35 11 43 18 50 28"
              stroke="#e5a952"
              strokeWidth="1.2"
              strokeDasharray="1 3"
              strokeLinecap="round"
            />
            <path d="M2 28H54" stroke="#f6c278" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="18" x2="16" y2="28" stroke="#df9b3e" strokeWidth="1.2" />
            <line x1="28" y1="6" x2="28" y2="28" stroke="#df9b3e" strokeWidth="1.4" />
            <line x1="40" y1="18" x2="40" y2="28" stroke="#df9b3e" strokeWidth="1.2" />
          </svg>
        </div>
        <h1 className="sidebar-setu-title">SETU</h1>
        <div className="sidebar-setu-sub">
          <span>Connecting Journeys</span>
          <span>With Intelligence</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <Home size={18} strokeWidth={2.2} />
          <span>Home</span>
        </button>

        <button
          className={`sidebar-nav-item ${activePage === 'track' ? 'active' : ''}`}
          onClick={() => onNavigate('track')}
        >
          <Train size={18} strokeWidth={2.2} />
          <span>Track Train</span>
        </button>

        <button
          className={`sidebar-nav-item ${activePage === 'about' ? 'active' : ''}`}
          onClick={() => onNavigate('about')}
        >
          <Users size={18} strokeWidth={2.2} />
          <span>About Team</span>
        </button>
      </nav>

      {/* Spacer */}
      <div className="sidebar-spacer" />

      {/* Bottom Artwork & Quote - Seamless blend like reference */}
      <div className="sidebar-bottom-section">
        <div className="rama-illustration-seamless">
          <img
            src="/rama_cliff.png"
            alt="SETU Spiritual Inspiration"
            className="rama-image-blend"
          />
          <div className="rama-fade-overlay" />
        </div>

        <blockquote className="sidebar-quote">
          <p className="quote-text">“Not just tracks,<br />but stronger<br />connections.”</p>
          <cite className="quote-author">— SETU</cite>
        </blockquote>

        {/* Tricolor Wave */}
        <div className="tricolor-wave-container">
          <svg width="56" height="26" viewBox="0 0 60 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 8C13 4 23 12 33 8C43 4 53 8 57 9"
              stroke="#ff9933"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M3 14C13 10 23 18 33 14C43 10 53 14 57 15"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M3 20C13 16 23 24 33 20C43 16 53 20 57 21"
              stroke="#138808"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <style>{`
        .landing-sidebar {
          width: 236px;
          min-width: 236px;
          height: 100vh;
          background: rgba(8, 16, 28, 0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          padding: 36px 18px 26px 18px;
          position: relative;
          z-index: 20;
          box-shadow: 6px 0 30px rgba(0, 0, 0, 0.5);
        }

        .sidebar-brand-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 38px;
        }

        .setu-bridge-icon {
          margin-bottom: 6px;
          filter: drop-shadow(0 2px 10px rgba(229, 169, 82, 0.45));
        }

        .sidebar-setu-title {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 5px;
          color: #f6e6cb;
          margin: 4px 0 2px 0;
          text-transform: uppercase;
        }

        .sidebar-setu-sub {
          display: flex;
          flex-direction: column;
          font-size: 11.5px;
          color: #94a3b8;
          letter-spacing: 0.3px;
          line-height: 1.35;
          margin-top: 2px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.25s ease;
          width: 100%;
          text-align: left;
          background: transparent;
        }

        .sidebar-nav-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }

        .sidebar-nav-item.active {
          background: #183858;
          color: #ffffff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 14px rgba(10, 30, 60, 0.6);
          font-weight: 600;
        }

        .sidebar-spacer {
          flex: 1;
        }

        .sidebar-bottom-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          margin-top: auto;
          position: relative;
        }

        .rama-illustration-seamless {
          position: relative;
          width: calc(100% + 36px);
          margin-left: -18px;
          margin-right: -18px;
          height: 180px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .rama-image-blend {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: contrast(1.1) saturate(1.15);
        }

        .rama-fade-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(8, 16, 28, 0.95) 0%,
            rgba(8, 16, 28, 0) 25%,
            rgba(8, 16, 28, 0) 75%,
            rgba(8, 16, 28, 0.95) 100%
          );
          pointer-events: none;
        }

        .sidebar-quote {
          margin-bottom: 18px;
          padding-left: 2px;
        }

        .quote-text {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 14px;
          line-height: 1.45;
          color: #f1dfc5;
          letter-spacing: 0.2px;
        }

        .quote-author {
          display: block;
          font-family: var(--font-sans);
          font-style: normal;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 1.5px;
          margin-top: 6px;
          text-transform: uppercase;
        }

        .tricolor-wave-container {
          padding-left: 2px;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
        }

        @media (max-height: 850px) {
          .rama-illustration-seamless {
            height: 130px;
          }
          .landing-sidebar {
            padding: 24px 16px 20px 16px;
          }
          .sidebar-brand-section {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </aside>
  );
};
