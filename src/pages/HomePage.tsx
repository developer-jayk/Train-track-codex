import React, { useState, useRef, useEffect } from 'react';
import { Search, Train, Network, Users, ArrowRight } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

interface HomePageProps {
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback', trainQuery?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });

      const handleEnded = () => {
        // Freeze on final frame
        video.pause();
      };

      video.addEventListener('ended', handleEnded);
      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || '12123';
    onNavigate('track', query);
  };

  const handleSuggestionClick = (val: string) => {
    onNavigate('track', val);
  };

  return (
    <div className="home-container">
      {/* Background Video & Fallback */}
      <div className="video-background-layer">
        <video
          ref={videoRef}
          className="hero-bg-video"
          src="/sunrise.mp4"
          poster="/background_sunrise.png"
          autoPlay
          muted
          playsInline
        />
        <div className="hero-atmosphere-overlay" />
      </div>

      {/* Left Glassmorphism Sidebar */}
      <Sidebar activePage="home" onNavigate={onNavigate} />

      {/* Main Hero Viewport */}
      <main className="home-main-content">
        {/* Top-Right Branding Badge */}
        <div className="hero-top-right">
          <div className="smarter-railway-title">
            <span>A SMARTER</span>
            <span>RAILWAY</span>
            <span>TOMORROW</span>
          </div>
          <div className="golden-accent-line" />
        </div>

        {/* Center Hero Section */}
        <div className="hero-center-section">
          {/* Main Headline */}
          <h1 className="hero-headline">
            Bridging Every<br />
            Journey <span className="highlight-gold">Together</span>
          </h1>

          {/* Subheading Tracked Label */}
          <div className="hero-tracked-label">
            PREDICT &nbsp; PLAN &nbsp; CONNECT
          </div>

          {/* Search Bar Form */}
          <form className="hero-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-pill-container">
              <Search size={22} className="search-icon-lens" />
              <input
                type="text"
                className="search-pill-input"
                placeholder="Search train number, station or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit-circle" aria-label="Submit search">
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {/* Search Helper Text */}
          <div className="search-helper-row">
            <span className="helper-label">Eg. </span>
            <button
              type="button"
              className="helper-chip"
              onClick={() => handleSuggestionClick('12101')}
            >
              12101
            </button>
            <span className="helper-sep">or</span>
            <button
              type="button"
              className="helper-chip"
              onClick={() => handleSuggestionClick('12123')}
            >
              CSMT → Howrah
            </button>
          </div>
        </div>

        {/* Bottom 3-Column Features Section (Clean floating with dividers, matching reference) */}
        <div className="hero-bottom-features">
          {/* Column 1: PREDICT */}
          <div className="bottom-feature-item">
            <div className="feature-icon-wrapper">
              <Train size={28} className="feature-gold-icon" strokeWidth={1.8} />
            </div>
            <span className="feature-title">PREDICT</span>
            <span className="feature-subtitle">Smarter ETAs</span>
          </div>

          <div className="feature-vertical-divider" />

          {/* Column 2: PLAN */}
          <div className="bottom-feature-item">
            <div className="feature-icon-wrapper">
              <Network size={28} className="feature-gold-icon" strokeWidth={1.8} />
            </div>
            <span className="feature-title">PLAN</span>
            <span className="feature-subtitle">Better Journeys</span>
          </div>

          <div className="feature-vertical-divider" />

          {/* Column 3: CONNECT */}
          <div className="bottom-feature-item">
            <div className="feature-icon-wrapper">
              <Users size={28} className="feature-gold-icon" strokeWidth={1.8} />
            </div>
            <span className="feature-title">CONNECT</span>
            <span className="feature-subtitle">A Stronger India</span>
          </div>
        </div>
      </main>

      <style>{`
        .home-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          background-color: #080d14;
        }

        /* Video Background */
        .video-background-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
        }

        .hero-bg-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .hero-atmosphere-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(5, 10, 18, 0.45) 0%,
            rgba(5, 10, 18, 0.1) 40%,
            rgba(5, 10, 18, 0.25) 100%
          );
          pointer-events: none;
        }

        /* Main Content Layout */
        .home-main-content {
          position: relative;
          z-index: 10;
          flex: 1;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 44px 70px 42px 70px;
          overflow-y: auto;
        }

        /* Top Right Badge */
        .hero-top-right {
          align-self: flex-end;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .smarter-railway-title {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 2.2px;
          color: #ffffff;
          line-height: 1.45;
          text-align: right;
        }

        .golden-accent-line {
          width: 42px;
          height: 2.5px;
          background: #df9b3e;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(223, 155, 62, 0.6);
        }

        /* Center Hero */
        .hero-center-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 720px;
          margin-top: -20px;
        }

        .hero-headline {
          font-family: var(--font-serif);
          font-size: 64px;
          font-weight: 600;
          line-height: 1.1;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin-bottom: 24px;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.65);
        }

        .highlight-gold {
          color: #f3cf7a;
          font-family: var(--font-serif);
          font-weight: 600;
        }

        .hero-tracked-label {
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 4.5px;
          color: #cbd5e1;
          margin-bottom: 26px;
          text-transform: uppercase;
        }

        /* Search Bar */
        .hero-search-form {
          width: 100%;
          max-width: 560px;
          margin-bottom: 14px;
        }

        .search-pill-container {
          display: flex;
          align-items: center;
          background: rgba(10, 20, 35, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 9999px;
          padding: 8px 10px 8px 22px;
          box-shadow: 0 8px 36px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition: all 0.3s ease;
        }

        .search-pill-container:focus-within {
          border-color: rgba(223, 155, 62, 0.7);
          box-shadow: 0 8px 36px rgba(0, 0, 0, 0.5), 0 0 16px rgba(223, 155, 62, 0.35);
        }

        .search-icon-lens {
          color: #94a3b8;
          margin-right: 14px;
          flex-shrink: 0;
        }

        .search-pill-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 15.5px;
          font-family: var(--font-sans);
        }

        .search-pill-input::placeholder {
          color: #94a3b8;
          font-size: 15px;
        }

        .search-submit-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #df9b3e;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0b1320;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-submit-circle:hover {
          background: #f6c278;
          transform: scale(1.06);
          box-shadow: 0 0 14px rgba(223, 155, 62, 0.7);
        }

        /* Search Helper */
        .search-helper-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-left: 22px;
          font-size: 13.5px;
          color: #94a3b8;
        }

        .helper-label {
          color: #64748b;
        }

        .helper-chip {
          background: none;
          border: none;
          color: #cbd5e1;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .helper-chip:hover {
          color: #df9b3e;
          text-decoration: underline;
        }

        .helper-sep {
          color: #64748b;
        }

        /* Bottom 3 Features - Clean floating layout like reference */
        .hero-bottom-features {
          align-self: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 8px 16px;
        }

        .bottom-feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          min-width: 130px;
        }

        .feature-icon-wrapper {
          margin-bottom: 4px;
        }

        .feature-gold-icon {
          color: #df9b3e;
          filter: drop-shadow(0 2px 8px rgba(223, 155, 62, 0.5));
        }

        .feature-title {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 2.2px;
          color: #ffffff;
        }

        .feature-subtitle {
          font-size: 13px;
          color: #94a3b8;
        }

        .feature-vertical-divider {
          width: 1px;
          height: 42px;
          background: rgba(255, 255, 255, 0.18);
        }

        @media (max-width: 1200px) {
          .hero-headline {
            font-size: 48px;
          }
        }

        @media (max-width: 900px) {
          .home-container {
            flex-direction: column;
            overflow-y: auto;
            height: auto;
            min-height: 100vh;
          }
          .landing-sidebar {
            width: 100%;
            height: auto;
            min-width: 100%;
          }
          .sidebar-bottom-section {
            display: none;
          }
          .home-main-content {
            padding: 30px 24px;
            height: auto;
            min-height: calc(100vh - 120px);
          }
          .hero-top-right {
            display: none;
          }
          .hero-center-section {
            margin-top: 20px;
            margin-bottom: 40px;
          }
          .hero-bottom-features {
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          .feature-vertical-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
