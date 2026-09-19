import React from 'react';
import { Home, Train, Info, Search, User } from 'lucide-react';

interface NavbarProps {
  activePage: 'home' | 'track' | 'about' | 'privacy' | 'feedback';
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  return (
    <header className="setu-navbar">
      <div className="navbar-left">
        <button className="navbar-brand" onClick={() => onNavigate('home')}>
          <span className="brand-logo-text">SETU</span>
        </button>
        <span className="navbar-divider">|</span>
        <span className="navbar-tagline">Bridging Every Journey Together</span>
      </div>

      <nav className="navbar-center">
        <button
          className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <Home size={17} strokeWidth={2} />
          <span>Home</span>
        </button>

        <button
          className={`nav-link ${activePage === 'track' ? 'active' : ''}`}
          onClick={() => onNavigate('track')}
        >
          <Train size={17} strokeWidth={2} />
          <span>Track Train</span>
          {activePage === 'track' && <span className="active-indicator" />}
        </button>

        <button
          className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
          onClick={() => onNavigate('about')}
        >
          <Info size={17} strokeWidth={2} />
          <span>About</span>
        </button>
      </nav>

      <div className="navbar-right">
        <button className="nav-icon-btn" title="Search" onClick={() => onNavigate('track')}>
          <Search size={18} strokeWidth={2} />
        </button>
        <button className="nav-icon-btn" title="Profile / Account">
          <User size={18} strokeWidth={2} />
        </button>
      </div>

      <style>{`
        .setu-navbar {
          width: 100%;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          background: rgba(10, 16, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .brand-logo-text {
          font-family: var(--font-sans);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 2.5px;
          color: #ffffff;
        }

        .navbar-divider {
          color: rgba(255, 255, 255, 0.25);
          font-size: 16px;
        }

        .navbar-tagline {
          font-size: 13.5px;
          color: #94a3b8;
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        .navbar-center {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          padding: 8px 12px;
          border-radius: 6px;
          position: relative;
          transition: all 0.2s ease;
          background: none;
          border: none;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-link.active {
          color: #ffffff;
        }

        .active-indicator {
          position: absolute;
          bottom: -16px;
          left: 12px;
          right: 12px;
          height: 2.5px;
          background: #3b82f6;
          border-radius: 2px;
          box-shadow: 0 0 8px #3b82f6;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .nav-icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        @media (max-width: 900px) {
          .navbar-tagline, .navbar-divider {
            display: none;
          }
          .navbar-center {
            gap: 14px;
          }
        }
      `}</style>
    </header>
  );
};
