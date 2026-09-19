import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Train,
  Calendar,
  MapPin,
  User,
  Mail,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { feedbackService, FeedbackData } from '../services/feedbackService';

interface FeedbackPageProps {
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

const FEEDBACK_TYPES = [
  'General Feedback',
  'Bug Report',
  'Train Data Issue',
  'ETA / Prediction Feedback',
  'UI / Design Feedback',
  'Feature Request',
  'Other',
];

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Needs Major Improvement',
  2: 'Needs Improvement',
  3: "It's Okay",
  4: 'Good Experience',
  5: 'Excellent Experience',
};

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('General Feedback');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [boardingStation, setBoardingStation] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmissionError(null);

    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setValidationError('Please enter your feedback message before submitting.');
      return;
    }

    const payload: FeedbackData = {
      name: name.trim(),
      email: email.trim(),
      feedbackType,
      rating,
      message: cleanMessage,
      trainNumber: trainNumber.trim(),
      journeyDate: journeyDate.trim(),
      boardingStation: boardingStation.trim(),
    };

    setIsSubmitting(true);

    try {
      const result = await feedbackService.submitFeedback(payload);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmissionError(result.message || 'Unable to send feedback. Please try again.');
      }
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setSubmissionError('Unable to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setFeedbackType('General Feedback');
    setRating(5);
    setMessage('');
    setTrainNumber('');
    setJourneyDate('');
    setBoardingStation('');
    setSubmitted(false);
    setValidationError(null);
    setSubmissionError(null);
  };

  const currentRatingScore = hoverRating !== null ? hoverRating : rating;
  const currentRatingText = RATING_DESCRIPTIONS[currentRatingScore] || 'Excellent Experience';

  return (
    <div className="feedback-page">
      {/* Navigation */}
      <Navbar activePage="feedback" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="feedback-main-wrapper">
        {/* Clean Atmospheric Background Accents */}
        <div className="ambient-glow" />

        <div className="feedback-container">
          {/* Header Section */}
          <header className="feedback-header">
            <div className="header-pill">
              <Sparkles size={13} className="pill-icon" />
              <span>PASSENGER VOICES</span>
            </div>
            <h1 className="header-title">Share Your Feedback</h1>
            <p className="header-subtitle">Help us make every journey smarter.</p>
            <p className="header-supporting">
              Your feedback helps us improve SETU's train tracking and prediction experience.
            </p>
          </header>

          {/* Success State */}
          {submitted ? (
            <div className="feedback-card glass-panel success-view">
              <div className="success-icon-badge">
                <CheckCircle2 size={54} strokeWidth={2} />
              </div>
              <h2 className="success-title">Thank you for your feedback.</h2>
              <p className="success-subtitle">
                Your feedback has been sent successfully.
              </p>
              <p className="success-body">
                We value your time and insights. Every submission directly guides our route simulation
                accuracy, weather telemetry parsing, and interface enhancements.
              </p>
              <div className="success-actions-row">
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  <RefreshCw size={15} />
                  <span>Submit Another Response</span>
                </button>
                <button type="button" className="btn-primary" onClick={() => onNavigate('track')}>
                  <Train size={16} />
                  <span>Return to Track Train</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* Main Form Card */
            <div className="feedback-card glass-panel">
              {/* Submission Error Banner */}
              {submissionError && (
                <div className="feedback-alert-banner alert-error">
                  <div className="alert-header">
                    <AlertCircle size={20} className="alert-icon" />
                    <div className="alert-text-block">
                      <strong className="alert-title">Something went wrong</strong>
                      <span className="alert-desc">{submissionError || 'Unable to send feedback. Please try again.'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="alert-retry-btn"
                    onClick={(e) => handleSubmit(e as any)}
                    disabled={isSubmitting}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Validation Error Banner */}
              {validationError && (
                <div className="feedback-alert-banner alert-validation">
                  <AlertCircle size={18} className="alert-icon" />
                  <span className="alert-desc">{validationError}</span>
                </div>
              )}

              <form className="feedback-form" onSubmit={handleSubmit} noValidate>
                {/* 1. Overall Experience Rating */}
                <section className="form-group-block">
                  <label className="group-label">
                    Overall Experience Rating <span className="req-asterisk">*</span>
                  </label>
                  <div className="rating-interactive-box">
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = currentRatingScore >= starVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            className={`star-button ${isFilled ? 'star-filled' : 'star-empty'}`}
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            aria-label={`Rate ${starVal} of 5 stars`}
                            title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                          >
                            <Star
                              size={26}
                              strokeWidth={1.8}
                              className="star-icon"
                              fill={isFilled ? '#df9b3e' : 'none'}
                              color={isFilled ? '#df9b3e' : '#64748b'}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="rating-text-pill">
                      <span className="rating-score-num">{currentRatingScore} / 5</span>
                      <span className="rating-sep">•</span>
                      <span className="rating-desc-label">{currentRatingText}</span>
                    </div>
                  </div>
                </section>

                {/* 2. Feedback Category */}
                <section className="form-group-block">
                  <label className="group-label" htmlFor="feedback-category-select">
                    Feedback Category <span className="req-asterisk">*</span>
                  </label>
                  <div className="select-container">
                    <select
                      id="feedback-category-select"
                      className="form-control form-select"
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                    >
                      {FEEDBACK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* 3. Message Textarea */}
                <section className="form-group-block">
                  <div className="label-with-meta">
                    <label className="group-label" htmlFor="feedback-message-textarea">
                      Message <span className="req-asterisk">*</span>
                    </label>
                    <span className="char-count-pill">{message.length} characters</span>
                  </div>
                  <textarea
                    id="feedback-message-textarea"
                    className={`form-control form-textarea ${validationError && !message.trim() ? 'field-error' : ''}`}
                    placeholder="Tell us what you experienced, what could be improved, or what you liked..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    required
                  />
                </section>

                {/* Section Separator */}
                <hr className="form-divider" />

                {/* 4. Personal Information ("About You") */}
                <section className="form-section-group">
                  <div className="section-title-wrap">
                    <h2 className="section-title">About You</h2>
                    <p className="section-subtitle">
                      Optional — leave your contact details if you'd like us to follow up.
                    </p>
                  </div>

                  <div className="two-col-grid">
                    <div className="form-group-block">
                      <label className="group-label" htmlFor="feedback-name-input">
                        <User size={13} className="label-icon" />
                        <span>Your Name</span>
                        <span className="optional-tag">(optional)</span>
                      </label>
                      <input
                        id="feedback-name-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Aditi Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="form-group-block">
                      <label className="group-label" htmlFor="feedback-email-input">
                        <Mail size={13} className="label-icon" />
                        <span>Email Address</span>
                        <span className="optional-tag">(optional)</span>
                      </label>
                      <input
                        id="feedback-email-input"
                        type="email"
                        className="form-control"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Section Separator */}
                <hr className="form-divider" />

                {/* 5. Journey Context */}
                <section className="form-section-group">
                  <div className="section-title-wrap">
                    <h2 className="section-title">Journey Context</h2>
                    <p className="section-subtitle">Helpful when reporting a specific train or prediction.</p>
                  </div>

                  <div className="three-col-grid">
                    <div className="form-group-block">
                      <label className="group-label" htmlFor="feedback-train-input">
                        <Train size={13} className="label-icon" />
                        <span>Train Number</span>
                      </label>
                      <input
                        id="feedback-train-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. 12123"
                        value={trainNumber}
                        onChange={(e) => setTrainNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-group-block">
                      <label className="group-label" htmlFor="feedback-date-input">
                        <Calendar size={13} className="label-icon" />
                        <span>Journey Date</span>
                      </label>
                      <input
                        id="feedback-date-input"
                        type="date"
                        className="form-control date-picker-control"
                        value={journeyDate}
                        onChange={(e) => setJourneyDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group-block">
                      <label className="group-label" htmlFor="feedback-station-input">
                        <MapPin size={13} className="label-icon" />
                        <span>Boarding Station</span>
                      </label>
                      <input
                        id="feedback-station-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. LTT or CSMT"
                        value={boardingStation}
                        onChange={(e) => setBoardingStation(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Submit Area */}
                <div className="submit-footer-area">
                  <button type="submit" className="submit-action-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={17} className="btn-spinner" />
                        <span>Sending feedback...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Feedback</span>
                        <ArrowRight size={17} className="btn-arrow" />
                      </>
                    )}
                  </button>
                  <p className="privacy-reassurance">
                    We use your feedback only to improve the SETU experience.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

      {/* Scoped Styling matching SETU Visual Language */}
      <style>{`
        .feedback-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #080d15;
          color: #ffffff;
          position: relative;
        }

        .feedback-main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 24px 70px 24px;
          position: relative;
        }

        .ambient-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 1200px;
          height: 380px;
          background: radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.12) 0%, rgba(20, 184, 166, 0.04) 45%, rgba(8, 13, 21, 0) 75%);
          pointer-events: none;
          z-index: 0;
        }

        .feedback-container {
          width: 100%;
          max-width: 940px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Header Section */
        .feedback-header {
          text-align: center;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(223, 155, 62, 0.12);
          border: 1px solid rgba(223, 155, 62, 0.28);
          color: #df9b3e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 12px;
        }

        .pill-icon {
          color: #df9b3e;
        }

        .header-title {
          font-family: var(--font-display, 'Outfit', sans-serif);
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          font-size: 16px;
          font-weight: 500;
          color: #38bdf8;
          margin: 0 0 8px 0;
        }

        .header-supporting {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 580px;
          line-height: 1.5;
        }

        /* Main Card */
        .feedback-card {
          width: 100%;
          background: rgba(13, 22, 38, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 38px 44px;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.65), 0 0 35px rgba(59, 130, 246, 0.05);
          transition: border-color 0.25s ease;
        }

        .feedback-card:hover {
          border-color: rgba(255, 255, 255, 0.14);
        }

        /* Alerts */
        .feedback-alert-banner {
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .alert-text-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alert-title {
          font-weight: 600;
          color: #ffffff;
        }

        .alert-desc {
          font-size: 13px;
          color: #fca5a5;
        }

        .alert-retry-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .alert-retry-btn:hover {
          background: rgba(239, 68, 68, 0.35);
        }

        .alert-validation {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
        }

        .alert-validation .alert-icon {
          color: #f59e0b;
        }

        /* Form Controls & Groups */
        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .group-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          letter-spacing: 0.01em;
        }

        .req-asterisk {
          color: #ef4444;
          font-weight: 700;
        }

        .optional-tag {
          font-size: 11.5px;
          color: #64748b;
          font-weight: 400;
        }

        .label-icon {
          color: #38bdf8;
        }

        .label-with-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .char-count-pill {
          font-size: 11.5px;
          color: #64748b;
          font-variant-numeric: tabular-nums;
        }

        .form-control {
          width: 100%;
          background: rgba(16, 26, 44, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .form-control:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18), inset 0 2px 4px rgba(0, 0, 0, 0.2);
          background: rgba(20, 32, 54, 0.85);
        }

        .form-control::placeholder {
          color: #64748b;
        }

        .form-textarea {
          min-height: 155px;
          line-height: 1.6;
          resize: vertical;
        }

        .form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }

        .form-select option {
          background: #0e1726;
          color: #ffffff;
          padding: 8px;
        }

        .field-error {
          border-color: rgba(239, 68, 68, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
        }

        .date-picker-control::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }

        /* 5-Star Interactive Rating Box */
        .rating-interactive-box {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          padding: 12px 18px;
          background: rgba(16, 26, 44, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        .stars-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .star-button {
          background: transparent;
          border: none;
          padding: 4px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .star-button:hover {
          transform: scale(1.18);
        }

        .star-button:active {
          transform: scale(0.95);
        }

        .star-icon {
          transition: all 0.2s ease;
        }

        .star-filled .star-icon {
          filter: drop-shadow(0 0 6px rgba(223, 155, 62, 0.45));
        }

        .rating-text-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(223, 155, 62, 0.1);
          border: 1px solid rgba(223, 155, 62, 0.22);
          border-radius: 9999px;
        }

        .rating-score-num {
          font-family: var(--font-display, sans-serif);
          font-size: 13px;
          font-weight: 700;
          color: #df9b3e;
          font-variant-numeric: tabular-nums;
        }

        .rating-sep {
          color: rgba(223, 155, 62, 0.4);
        }

        .rating-desc-label {
          font-size: 13px;
          font-weight: 600;
          color: #fde68a;
          letter-spacing: 0.01em;
        }

        /* Divider */
        .form-divider {
          border: none;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 6px 0;
        }

        /* Section Groups */
        .form-section-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .section-subtitle {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
        }

        /* Grids */
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .three-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        /* Submit Area */
        .submit-footer-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding-top: 10px;
        }

        .submit-action-btn {
          width: 100%;
          max-width: 320px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0d9488 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #ffffff;
          font-family: var(--font-display, sans-serif);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35), 0 0 12px rgba(13, 148, 136, 0.2);
        }

        .submit-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.5), 0 0 18px rgba(13, 148, 136, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .submit-action-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-action-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .btn-arrow {
          transition: transform 0.2s ease;
        }

        .submit-action-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(3px);
        }

        .btn-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .privacy-reassurance {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          text-align: center;
        }

        /* Success Card View */
        .success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 56px 40px;
          animation: popIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .success-icon-badge {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          margin-bottom: 22px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
        }

        .success-title {
          font-family: var(--font-display, sans-serif);
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .success-subtitle {
          font-size: 16px;
          font-weight: 500;
          color: #38bdf8;
          margin: 0 0 16px 0;
        }

        .success-body {
          font-size: 14px;
          color: #94a3b8;
          max-width: 580px;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .success-actions-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          font-size: 13.5px;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: #2563eb;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .feedback-card {
            padding: 30px 24px;
          }

          .three-col-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .two-col-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }

        @media (max-width: 600px) {
          .feedback-main-wrapper {
            padding: 24px 16px 50px 16px;
          }

          .feedback-header {
            margin-bottom: 20px;
          }

          .header-title {
            font-size: 26px;
          }

          .header-subtitle {
            font-size: 14.5px;
          }

          .feedback-card {
            padding: 24px 18px;
            border-radius: 18px;
          }

          .rating-interactive-box {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .submit-action-btn {
            max-width: 100%;
          }

          .success-actions-row {
            flex-direction: column;
            width: 100%;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
