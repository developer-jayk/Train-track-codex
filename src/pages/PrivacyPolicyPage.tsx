import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Globe, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface PrivacyPolicyPageProps {
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="privacy-page">
      <Navbar activePage="privacy" onNavigate={onNavigate} />

      <main className="privacy-main-container">
        {/* Hero Header */}
        <section className="privacy-hero-section">
          <div className="privacy-brand-tag">
            <span className="brand-pill">LEGAL & TRANSPARENCY</span>
          </div>
          <h1 className="privacy-main-title">Privacy Policy</h1>
          <p className="privacy-tagline">“Integrity, transparency, and respect for passenger privacy.”</p>
          <div className="privacy-divider-line" />
          <p className="privacy-last-updated">Last updated: September 19, 2026</p>
          <p className="privacy-intro-text">
            SETU (“Bridging Every Journey Together”) is an experimental railway intelligence initiative designed to provide accurate train delay forecasting and operational telemetry. This Privacy Policy outlines how user queries are processed and confirms our commitment to non-intrusive, anonymous access.
          </p>
        </section>

        {/* Policy Content Cards */}
        <div className="policy-cards-stack">
          {/* 1. Information We Collect */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Eye size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">1. Information We Collect</h2>
            </div>
            <div className="policy-card-body">
              <p>
                SETU does <strong>not</strong> require user registration, account creation, mobile phone verification, or login credentials to access train tracking and ETA predictions.
              </p>
              <p>
                When you interact with the application, the only operational input transmitted is the train number or search query you submit to query live rail status. We do not gather personal profile data, government IDs, biometric data, or financial details.
              </p>
            </div>
          </article>

          {/* 2. Train Search and Journey Information */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <ShieldCheck size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">2. Train Search and Journey Information</h2>
            </div>
            <div className="policy-card-body">
              <p>
                When a user queries a train number (such as <code>12123</code> or <code>22221</code>), this identifier is sent to the backend server solely to calculate delay estimations and fetch corridor waypoint geometry.
              </p>
              <p>
                <strong>The current application does not permanently store, index, or profile individual user search or journey histories.</strong> All lookup queries are handled transiently in memory to generate real-time responses and are not stored in persistent passenger databases.
              </p>
            </div>
          </article>

          {/* 3. How Information Is Used */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <RefreshCw size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">3. How Information Is Used</h2>
            </div>
            <div className="policy-card-body">
              <p>The information submitted through the interface is utilized solely for:</p>
              <ul className="policy-bullet-list">
                <li>Retrieving live train progress, waypoint stations, and section delays.</li>
                <li>Executing the Gradient Boosting machine learning model to compute downstream ETA predictions.</li>
                <li>Displaying atmospheric telemetry (visibility and weather conditions) along the corridor.</li>
                <li>Processing optional feedback submissions voluntarily provided by users.</li>
              </ul>
              <p>We do not use search data for targeted advertising, automated profiling, or commercial marketing.</p>
            </div>
          </article>

          {/* 4. Data Storage */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Database size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">4. Data Storage</h2>
            </div>
            <div className="policy-card-body">
              <p>
                SETU operates without a permanent passenger tracking database. The Python backend utilizes short-lived in-memory caching stores (with a time-to-live of approximately 30 seconds) purely to avoid redundant requests to external telemetry providers.
              </p>
              <p>
                Once this temporary window lapses, cache entries are overwritten or cleared automatically.
              </p>
            </div>
          </article>

          {/* 5. Third-Party Services / APIs */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Globe size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">5. Third-Party Services / APIs</h2>
            </div>
            <div className="policy-card-body">
              <p>
                To provide accurate weather context and railway running telemetry, SETU interfaces with third-party web services through our Python backend, including:
              </p>
              <ul className="policy-bullet-list">
                <li><strong>Weather Telemetry Services:</strong> Public meteorology endpoints (e.g., Open-Meteo) to fetch regional visibility and weather descriptions by coordinate.</li>
                <li><strong>Railway Information Telemetry:</strong> Upstream railway data feeds used by the backend to determine current train station checkpoints and delay minutes.</li>
              </ul>
              <p>
                These third-party requests originate from our backend server, not from your personal device, ensuring that your personal IP address is not directly forwarded to these external providers.
              </p>
            </div>
          </article>

          {/* 6. Cookies and Local Storage */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Lock size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">6. Cookies and Local Storage</h2>
            </div>
            <div className="policy-card-body">
              <p>
                SETU does not use tracking cookies, advertising beacons, or third-party analytics pixels.
              </p>
              <p>
                Standard client-side browser memory may store the current URL hash parameter (e.g., <code>#track?q=12123</code>) to allow convenient page reloads within your current session. This information remains solely on your device.
              </p>
            </div>
          </article>

          {/* 7. Data Security */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <CheckCircle2 size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">7. Data Security</h2>
            </div>
            <div className="policy-card-body">
              <p>
                We implement appropriate security practices across client-server communication using standard HTTP/HTTPS protocols. Because SETU does not collect or store passwords, financial data, or sensitive personal dossiers, the potential exposure of personal information is inherently minimized.
              </p>
            </div>
          </article>

          {/* 8. Data Retention */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Database size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">8. Data Retention</h2>
            </div>
            <div className="policy-card-body">
              <p>
                Because train searches are handled transiently in live sessions, SETU retains zero persistent search logs. Temporary memory buffers in backend execution automatically expire within seconds.
              </p>
            </div>
          </article>

          {/* 9. User Rights */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <ShieldCheck size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">9. User Rights</h2>
            </div>
            <div className="policy-card-body">
              <p>
                Every user has the right to access SETU anonymously without identity disclosure. Because we do not store personal profiles, there are no private records or behavioral dossiers held on our servers to modify, export, or erase.
              </p>
            </div>
          </article>

          {/* 10. Children's Privacy */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Lock size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">10. Children's Privacy</h2>
            </div>
            <div className="policy-card-body">
              <p>
                SETU is a general-purpose railway utility intended for travelers of all ages. We do not knowingly collect, solicit, or maintain personal information from children under the age of 13.
              </p>
            </div>
          </article>

          {/* 11. Changes to This Privacy Policy */}
          <article className="policy-card glass-panel">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <RefreshCw size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">11. Changes to This Privacy Policy</h2>
            </div>
            <div className="policy-card-body">
              <p>
                We may refine or expand this Privacy Policy as new capabilities or integrations are introduced to the SETU platform. Any updates will be posted directly to this page along with a revised "Last updated" date.
              </p>
            </div>
          </article>

          {/* 12. Contact */}
          <article className="policy-card glass-panel policy-contact-card">
            <div className="policy-card-header">
              <div className="policy-icon-box">
                <Mail size={20} className="policy-icon" />
              </div>
              <h2 className="policy-card-title">12. Contact</h2>
            </div>
            <div className="policy-card-body">
              <p>
                If you have questions, feedback, or inquiries regarding this Privacy Policy or SETU's data practices, please reach out to the project maintainers at:
              </p>
              <div className="contact-placeholder-box">
                <code className="contact-placeholder">[SETU CONTACT EMAIL]</code>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      <style>{`
        .privacy-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #080d15;
          color: #ffffff;
        }

        .privacy-main-container {
          flex: 1;
          max-width: 920px;
          margin: 0 auto;
          width: 100%;
          padding: 50px 24px 70px 24px;
        }

        .privacy-hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 44px;
        }

        .privacy-brand-tag {
          margin-bottom: 16px;
        }

        .brand-pill {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #df9b3e;
          background: rgba(223, 155, 62, 0.12);
          border: 1px solid rgba(223, 155, 62, 0.35);
          padding: 5px 14px;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .privacy-main-title {
          font-family: var(--font-serif);
          font-size: 42px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .privacy-tagline {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 18px;
          color: #df9b3e;
          margin-bottom: 16px;
        }

        .privacy-divider-line {
          width: 50px;
          height: 2px;
          background: #3b82f6;
          border-radius: 2px;
          margin-bottom: 16px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        }

        .privacy-last-updated {
          font-size: 12.5px;
          color: #94a3b8;
          margin-bottom: 14px;
          font-weight: 500;
        }

        .privacy-intro-text {
          max-width: 720px;
          font-size: 14.5px;
          line-height: 1.7;
          color: #cbd5e1;
        }

        .policy-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .policy-card {
          padding: 24px 26px;
          background: rgba(14, 23, 38, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .policy-card:hover {
          border-color: rgba(223, 155, 62, 0.3);
          transform: translateY(-2px);
        }

        .policy-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .policy-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          flex-shrink: 0;
        }

        .policy-card-title {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .policy-card-body {
          font-size: 14px;
          line-height: 1.65;
          color: #cbd5e1;
        }

        .policy-card-body p {
          margin-bottom: 10px;
        }

        .policy-card-body p:last-child {
          margin-bottom: 0;
        }

        .policy-card-body code {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          color: #f3cf7a;
          font-size: 13px;
        }

        .policy-bullet-list {
          list-style: disc;
          padding-left: 20px;
          margin: 10px 0 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .policy-bullet-list li {
          color: #cbd5e1;
        }

        .policy-contact-card {
          border-color: rgba(59, 130, 246, 0.3);
        }

        .contact-placeholder-box {
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(223, 155, 62, 0.45);
          border-radius: 8px;
          display: inline-block;
        }

        .contact-placeholder {
          color: #f3cf7a;
          font-weight: 600;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .privacy-main-container {
            padding: 36px 18px 50px 18px;
          }
          .privacy-main-title {
            font-size: 32px;
          }
          .policy-card {
            padding: 20px 18px;
          }
        }
      `}</style>
    </div>
  );
};
