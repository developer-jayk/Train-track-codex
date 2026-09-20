import React, { useState, useEffect, useRef } from 'react';
import { Train, X, AlertCircle, RefreshCw, Calendar, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { TrainHeaderCard } from '../components/TrainHeaderCard';
import { PredictionConfidenceCard } from '../components/PredictionConfidenceCard';
import { NextStationCard } from '../components/NextStationCard';
import { InformationMessageCard } from '../components/InformationMessageCard';
import { DelayCausesCard } from '../components/DelayCausesCard';
import { RouteProgressCard } from '../components/RouteProgressCard';
import { FullRouteModal } from '../components/FullRouteModal';
import { Footer } from '../components/Footer';
import { trainService } from '../services/trainService';
import { TrainData, StationStopDetail } from '../types/index';
import { DEFAULT_TRAIN_NUMBER } from '../data/mockTrainData';

interface TrackTrainPageProps {
  initialTrainNumber?: string;
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

const TODAY_DATE = new Date().toISOString().slice(0, 10);

export const TrackTrainPage: React.FC<TrackTrainPageProps> = ({
  initialTrainNumber = DEFAULT_TRAIN_NUMBER,
  onNavigate,
}) => {
  const [searchInput, setSearchInput] = useState(initialTrainNumber);
  const [journeyDate, setJourneyDate] = useState<string>(TODAY_DATE);
  const [boardingStation, setBoardingStation] = useState<string>('');
  const [currentTrain, setCurrentTrain] = useState<TrainData | null>(null);
  const [availableStops, setAvailableStops] = useState<StationStopDetail[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState(initialTrainNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Checking train...');
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  const lastLoadedKey = useRef<string>('');

  // Parse URL hash parameters (e.g. #track?train=12123&date=2026-09-15&boarding=KYN)
  const parseUrlParams = () => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const qs = hash.substring(qIndex + 1);
      const params = new URLSearchParams(qs);
      const train = params.get('train') || params.get('q');
      const date = params.get('date');
      const boarding = params.get('boarding') || params.get('boarding_station');
      return { train, date, boarding };
    }
    return {};
  };

  useEffect(() => {
    const urlParams = parseUrlParams();
    const trainToLoad = urlParams.train || initialTrainNumber || DEFAULT_TRAIN_NUMBER;
    const dateToLoad = urlParams.date || TODAY_DATE;
    const boardingToLoad = urlParams.boarding || '';

    setSearchInput(trainToLoad);
    setJourneyDate(dateToLoad);
    setBoardingStation(boardingToLoad);

    const reqKey = `${trainToLoad}_${dateToLoad}_${boardingToLoad}`;
    if (reqKey !== lastLoadedKey.current) {
      loadTrainJourney(trainToLoad, dateToLoad, boardingToLoad);
    }
  }, [initialTrainNumber]);

  /**
   * Primary Journey Fetching Function
   * Strictly validates train number, journey date, and boarding station against real backend.
   * Immediately clears stale train data before dispatching the request.
   */
  const loadTrainJourney = async (trainNum: string, dateVal?: string, boardingVal?: string) => {
    const cleanNum = trainNum.trim();
    if (!cleanNum) {
      setApiError('Please enter a train number.');
      setCurrentTrain(null);
      setNotFound(false);
      return;
    }

    const activeDate = (dateVal || journeyDate || TODAY_DATE).trim();
    const activeBoarding = (boardingVal !== undefined ? boardingVal : boardingStation).trim();

    const reqKey = `${cleanNum}_${activeDate}_${activeBoarding}`;
    lastLoadedKey.current = reqKey;

    // RULE 2: Immediately clear old train result while new request is processed
    setCurrentTrain(null);
    setNotFound(false);
    setApiError(null);
    setIsLoading(true);
    setLoadingMessage('Checking train...');
    setSearchedQuery(cleanNum);

    try {
      // Step 1: Query backend prediction & train status
      const data = await trainService.fetchTrainDelayPrediction(cleanNum, activeDate, activeBoarding);

      if (data) {
        setCurrentTrain(data);
        setNotFound(false);
        setApiError(null);
        setSearchInput(data.trainNumber);
        setSearchedQuery(data.trainNumber);
        if (data.journeyDate) setJourneyDate(data.journeyDate);
        if (data.boardingStation) setBoardingStation(data.boardingStation);

        // Store available stops for boarding selector & full route modal
        if (data.fullRouteStations && data.fullRouteStations.length > 0) {
          setAvailableStops(data.fullRouteStations);
        } else {
          // Fallback fetch route geometry if not directly in forecast
          const stops = await trainService.fetchTrainRoute(cleanNum, activeDate);
          if (stops) setAvailableStops(stops);
        }

        // RULE 21: Preserve state in URL hash
        const urlParams = new URLSearchParams();
        urlParams.set('train', data.trainNumber);
        if (activeDate) urlParams.set('date', activeDate);
        if (activeBoarding) urlParams.set('boarding', activeBoarding);
        window.location.hash = `track?${urlParams.toString()}`;
      } else {
        // RULE 1: Train not found in backend
        setCurrentTrain(null);
        setNotFound(true);
        setApiError(null);
        setAvailableStops([]);
        setSearchInput(cleanNum);
        setSearchedQuery(cleanNum);

        const urlParams = new URLSearchParams();
        urlParams.set('train', cleanNum);
        window.location.hash = `track?${urlParams.toString()}`;
      }
    } catch (err: any) {
      console.error('[TrackTrainPage] Backend error loading journey:', err);
      setCurrentTrain(null);
      setNotFound(false);
      setAvailableStops([]);
      const errMsg = err?.message || 'Unable to fetch journey data. Please try again.';
      setApiError(errMsg);
      setSearchInput(cleanNum);
      setSearchedQuery(cleanNum);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setApiError('Please enter a train number.');
      return;
    }
    loadTrainJourney(searchInput.trim(), journeyDate, boardingStation);
  };

  const handleClear = () => {
    setSearchInput('');
  };

  const handleExampleClick = (exampleNum: string) => {
    setSearchInput(exampleNum);
    setBoardingStation('');
    loadTrainJourney(exampleNum, journeyDate, '');
  };

  const handleDateChange = (newDate: string) => {
    setJourneyDate(newDate);
    if (searchInput.trim()) {
      setLoadingMessage('Fetching journey information...');
      loadTrainJourney(searchInput.trim(), newDate, boardingStation);
    }
  };

  const handleBoardingChange = (newBoarding: string) => {
    setBoardingStation(newBoarding);
    if (searchInput.trim()) {
      setLoadingMessage('Calculating prediction...');
      loadTrainJourney(searchInput.trim(), journeyDate, newBoarding);
    }
  };

  return (
    <div className="track-train-page">
      {/* Top Navbar */}
      <Navbar activePage="track" onNavigate={onNavigate} />

      {/* Main Track Dashboard Container */}
      <div className="dashboard-wrapper">
        {/* Search Header Row */}
        <div className="track-search-header">
          {/* Centered Search Bar & Journey Selector */}
          <div className="search-bar-center-col">
            <form className="track-search-form" onSubmit={handleSearchSubmit}>
              <div className="track-input-pill">
                <Train size={18} className="input-train-icon" strokeWidth={2} />
                <input
                  type="text"
                  className="track-input-field"
                  placeholder="Enter train number (e.g. 12123, 22221)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="clear-input-btn"
                    onClick={handleClear}
                    title="Clear input"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button type="submit" className="search-action-btn" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Loading status indicator */}
            {isLoading && (
              <div className="track-loading-indicator">
                <span className="loading-dot-pulse"></span>
                <span>{loadingMessage}</span>
              </div>
            )}

            {/* Journey Configuration Bar: Date & Boarding Station */}
            {currentTrain && !isLoading && (
              <div className="journey-config-bar glass-panel">
                {/* Journey Date Selector */}
                <div className="config-item">
                  <label className="config-label" htmlFor="journey-date-input">
                    <Calendar size={13} className="config-icon" />
                    Journey Date
                  </label>
                  <input
                    id="journey-date-input"
                    type="date"
                    className="config-date-input"
                    value={journeyDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                  <div className="quick-date-chips">
                    <button
                      type="button"
                      className={`quick-chip ${journeyDate === TODAY_DATE ? 'chip-active' : ''}`}
                      onClick={() => handleDateChange(TODAY_DATE)}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`quick-chip ${journeyDate === '2026-09-15' ? 'chip-active' : ''}`}
                      onClick={() => handleDateChange('2026-09-15')}
                    >
                      15 Sep (Historical)
                    </button>
                  </div>
                </div>

                <div className="config-divider" />

                {/* Boarding Station Dropdown */}
                <div className="config-item">
                  <label className="config-label" htmlFor="boarding-station-select">
                    <MapPin size={13} className="config-icon" />
                    Boarding Station
                  </label>
                  <select
                    id="boarding-station-select"
                    className="config-select"
                    value={boardingStation}
                    onChange={(e) => handleBoardingChange(e.target.value)}
                  >
                    <option value="">Select Boarding Stop ({availableStops.length} stops)...</option>
                    {availableStops.map((st) => (
                      <option key={st.stationCode} value={st.stationCode}>
                        {st.stationCode} - {st.stationName} (Dep: {st.scheduledDeparture} / Arr: {st.scheduledArrival})
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Full Route Action */}
                <div className="config-item config-btn-item">
                  <button
                    type="button"
                    className="config-full-route-btn"
                    onClick={() => setIsRouteModalOpen(true)}
                  >
                    <Navigation size={14} />
                    <span>View Full Route</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Example Chips */}
            <div className="search-examples-row">
              <span className="examples-label">Try examples:</span>
              <button
                type="button"
                className="example-link"
                onClick={() => handleExampleClick('12123')}
              >
                12123
              </button>
              <button
                type="button"
                className="example-link"
                onClick={() => handleExampleClick('22221')}
              >
                22221
              </button>
              <button
                type="button"
                className="example-link"
                onClick={() => handleExampleClick('12051')}
              >
                12051
              </button>
            </div>
          </div>

          {/* Right Subtext */}
          <div className="track-header-right-text">
            <span>A smarter, smoother</span>
            <span>railway experience for a</span>
            <span>more connected India.</span>
          </div>
        </div>

        {/* 3-Column Content Layout: Success State */}
        {currentTrain && !notFound && !apiError && (
          <div className={`track-grid-layout ${isLoading ? 'loading-dim' : ''}`}>
            {/* Left Column: Train Hero Card */}
            <aside className="track-left-col">
              <div className="train-image-card">
                <img
                  src="/train_card_clean.png"
                  alt="Different Journeys A Closer India"
                  className="train-card-img"
                />
              </div>
            </aside>

            {/* Middle Column: Primary Status & Predictions */}
            <main className="track-middle-col">
              <TrainHeaderCard train={currentTrain} />
              <PredictionConfidenceCard train={currentTrain} />
              <NextStationCard train={currentTrain} />
              <InformationMessageCard message={currentTrain.infoMessage} />
            </main>

            {/* Right Column: Explanations & Route Progress */}
            <aside className="track-right-col">
              <DelayCausesCard factors={currentTrain.delayFactors} />
              <RouteProgressCard
                stops={currentTrain.routeStops}
                onViewFullRoute={() => setIsRouteModalOpen(true)}
              />
            </aside>
          </div>
        )}

        {/* 3-Column Content Layout: API Error State */}
        {apiError && (
          <div className="track-grid-layout not-found-layout">
            <aside className="track-left-col">
              <div className="train-image-card">
                <img
                  src="/train_card_clean.png"
                  alt="Different Journeys A Closer India"
                  className="train-card-img"
                />
              </div>
            </aside>

            <main className="track-middle-col not-found-middle">
              <div className="not-found-card glass-panel">
                <div className="not-found-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <AlertCircle size={36} strokeWidth={2} className="alert-icon" />
                </div>
                <h2 className="not-found-title">{apiError}</h2>
                <p className="not-found-query-text">
                  {apiError.includes('No journey data available for this date')
                    ? `No journey records found for train ${searchedQuery} on ${journeyDate}.`
                    : `Could not complete the query for train "${searchedQuery}".`}
                </p>
                <div className="not-found-action-chips" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="not-found-chip-btn"
                    onClick={() => loadTrainJourney(searchedQuery, TODAY_DATE, '')}
                  >
                    <RefreshCw size={16} />
                    <span>Reset to Today's Journey</span>
                  </button>
                </div>
              </div>
            </main>

            <aside className="track-right-col not-found-right">
              <div className="directory-card glass-panel">
                <h3 className="directory-title">Active Corridor Trains</h3>
                <p className="directory-subtitle">
                  Select any active train to view live telemetry and AI delay predictions:
                </p>

                <div className="directory-list">
                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('12123')}
                  >
                    <div className="item-header">
                      <span className="item-badge">12123</span>
                      <span className="item-name">Mumbai LTT Express</span>
                    </div>
                    <span className="item-route">Lokmanya Tilak Terminus → Varanasi</span>
                  </div>

                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('22221')}
                  >
                    <div className="item-header">
                      <span className="item-badge">22221</span>
                      <span className="item-name">Rajdhani Express</span>
                    </div>
                    <span className="item-route">Hazrat Nizamuddin → Mumbai Central</span>
                  </div>

                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('12051')}
                  >
                    <div className="item-header">
                      <span className="item-badge">12051</span>
                      <span className="item-name">Jan Shatabdi Express</span>
                    </div>
                    <span className="item-route">Lokmanya Tilak Terminus → Varanasi</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* 3-Column Content Layout: Clean Not Found State */}
        {notFound && !apiError && (
          <div className={`track-grid-layout not-found-layout ${isLoading ? 'loading-dim' : ''}`}>
            {/* Left Column: Preserved Train Artwork Card */}
            <aside className="track-left-col">
              <div className="train-image-card">
                <img
                  src="/train_card_clean.png"
                  alt="Different Journeys A Closer India"
                  className="train-card-img"
                />
              </div>
            </aside>

            {/* Middle Column: Not Found Card */}
            <main className="track-middle-col not-found-middle">
              <div className="not-found-card glass-panel">
                <div className="not-found-icon-wrap">
                  <AlertCircle size={36} strokeWidth={2} className="alert-icon" />
                </div>
                <h2 className="not-found-title">Train not found</h2>
                <p className="not-found-query-text">
                  No live telemetry or schedule data found for <span className="highlight-query">"{searchedQuery}"</span>
                </p>
                <p className="not-found-help-text">
                  The Python backend confirmed this train number does not exist. Please check the train number. Currently active trains on SETU corridor:
                </p>

                <div className="not-found-action-chips">
                  <button
                    type="button"
                    className="not-found-chip-btn"
                    onClick={() => handleExampleClick('12123')}
                  >
                    <Train size={16} />
                    <span>12123 — Mumbai LTT Express</span>
                  </button>
                  <button
                    type="button"
                    className="not-found-chip-btn"
                    onClick={() => handleExampleClick('22221')}
                  >
                    <Train size={16} />
                    <span>22221 — Rajdhani Express</span>
                  </button>
                  <button
                    type="button"
                    className="not-found-chip-btn"
                    onClick={() => handleExampleClick('12051')}
                  >
                    <Train size={16} />
                    <span>12051 — Jan Shatabdi Express</span>
                  </button>
                </div>
              </div>
            </main>

            {/* Right Column: Available Trains Directory */}
            <aside className="track-right-col not-found-right">
              <div className="directory-card glass-panel">
                <h3 className="directory-title">Active Corridor Trains</h3>
                <p className="directory-subtitle">
                  Click any route below to view real-time delay telemetry and AI prediction factors:
                </p>

                <div className="directory-list">
                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('12123')}
                  >
                    <div className="item-header">
                      <span className="item-badge">12123</span>
                      <span className="item-name">Mumbai LTT Express</span>
                    </div>
                    <span className="item-route">Lokmanya Tilak Terminus → Varanasi</span>
                  </div>

                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('22221')}
                  >
                    <div className="item-header">
                      <span className="item-badge">22221</span>
                      <span className="item-name">Rajdhani Express</span>
                    </div>
                    <span className="item-route">Hazrat Nizamuddin → Mumbai Central</span>
                  </div>

                  <div
                    className="directory-item"
                    onClick={() => handleExampleClick('12051')}
                  >
                    <div className="item-header">
                      <span className="item-badge">12051</span>
                      <span className="item-name">Jan Shatabdi Express</span>
                    </div>
                    <span className="item-route">Lokmanya Tilak Terminus → Varanasi</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Full Route Modal */}
      {currentTrain && (
        <FullRouteModal
          isOpen={isRouteModalOpen}
          onClose={() => setIsRouteModalOpen(false)}
          trainNumber={currentTrain.trainNumber}
          trainName={currentTrain.trainName}
          journeyDate={currentTrain.journeyDate || journeyDate}
          boardingStation={currentTrain.boardingStation || boardingStation}
          stations={currentTrain.fullRouteStations || availableStops}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

      <style>{`
        .track-train-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #080e18;
          color: #ffffff;
        }

        .dashboard-wrapper {
          flex: 1;
          padding: 8px 24px 24px 0px;
          max-width: 1760px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Search Header */
        .track-search-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-left: 28px;
          padding-right: 8px;
        }

        .search-bar-center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 auto;
          transform: translateX(50px);
        }

        .track-search-form {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .track-input-pill {
          display: flex;
          align-items: center;
          width: 390px;
          height: 42px;
          background: rgba(16, 26, 42, 0.85);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 9999px;
          padding: 0 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: all 0.25s ease;
        }

        .track-input-pill:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 14px rgba(59, 130, 246, 0.35);
        }

        .input-train-icon {
          color: #94a3b8;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .track-input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 500;
        }

        .track-input-field::placeholder {
          color: #64748b;
        }

        .clear-input-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: color 0.15s ease;
        }

        .clear-input-btn:hover {
          color: #f1f5f9;
        }

        .search-action-btn {
          height: 42px;
          padding: 0 24px;
          background: #2563eb;
          border: none;
          border-radius: 9999px;
          color: #ffffff;
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .search-action-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
        }

        .search-action-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .track-loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: 2px;
          font-size: 13px;
          color: #fbbf24;
          font-weight: 500;
          animation: fadeIn 0.2s ease-in;
        }

        .loading-dot-pulse {
          width: 8px;
          height: 8px;
          background-color: #fbbf24;
          border-radius: 50%;
          animation: dotPulse 1.2s infinite ease-in-out;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(0.7); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 8px rgba(251, 191, 36, 0.6); }
        }

        /* Journey Configuration Bar */
        .journey-config-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 18px;
          background: rgba(13, 22, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-top: 4px;
          margin-bottom: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .config-icon {
          color: #38bdf8;
        }

        .config-date-input {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f1f5f9;
          font-family: var(--font-body);
          font-size: 13px;
          padding: 4px 10px;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.2s;
        }

        .config-date-input:focus {
          border-color: #3b82f6;
        }

        .quick-date-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .quick-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 10.5px;
          padding: 1px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .quick-chip.chip-active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }

        .config-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.08);
        }

        .config-select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f1f5f9;
          font-family: var(--font-body);
          font-size: 13px;
          padding: 5px 12px;
          border-radius: 6px;
          outline: none;
          max-width: 320px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .config-select:focus {
          border-color: #3b82f6;
        }

        .config-btn-item {
          justify-content: flex-end;
          padding-left: 8px;
        }

        .config-full-route-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(223, 155, 62, 0.12);
          border: 1px solid rgba(223, 155, 62, 0.3);
          color: #df9b3e;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .config-full-route-btn:hover {
          background: rgba(223, 155, 62, 0.22);
          border-color: rgba(223, 155, 62, 0.5);
          transform: translateY(-1px);
        }

        .search-examples-row {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12.5px;
        }

        .examples-label {
          color: #94a3b8;
        }

        .example-link {
          color: #94a3b8;
          background: none;
          border: none;
          font-family: var(--font-display);
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 0;
        }

        .example-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .track-header-right-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
          text-align: right;
          max-width: 240px;
        }

        /* 3-Column Grid */
        .track-grid-layout {
          display: grid;
          grid-template-columns: 310px 1.25fr 1.05fr;
          gap: 18px;
          align-items: stretch;
          flex: 1;
          transition: opacity 0.2s ease;
        }

        .loading-dim {
          opacity: 0.6;
          pointer-events: none;
        }

        /* Left Column */
        .track-left-col {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .train-image-card {
          width: 100%;
          height: 100%;
          border-radius: 0 16px 16px 0;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: none;
          box-shadow: 4px 8px 24px rgba(0, 0, 0, 0.4);
          background: #0d1522;
          display: flex;
        }

        .train-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Middle Column */
        .track-middle-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .track-middle-col > * {
          margin-bottom: 0 !important;
        }

        /* Right Column */
        .track-right-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .track-right-col > * {
          margin-bottom: 0 !important;
        }

        /* Not Found Middle Card */
        .not-found-middle {
          justify-content: center;
        }

        .not-found-card {
          padding: 36px 32px;
          background: rgba(13, 22, 36, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .not-found-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
          margin-bottom: 18px;
        }

        .not-found-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .not-found-query-text {
          font-size: 15px;
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        .highlight-query {
          color: #f59e0b;
          font-weight: 600;
        }

        .not-found-help-text {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .not-found-action-chips {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 360px;
        }

        .not-found-chip-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .not-found-chip-btn:hover {
          background: rgba(37, 99, 235, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
          transform: translateY(-1px);
        }

        /* Not Found Right Directory Card */
        .not-found-right {
          justify-content: center;
        }

        .directory-card {
          padding: 28px 24px;
          background: rgba(13, 22, 36, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
        }

        .directory-title {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .directory-subtitle {
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 18px;
        }

        .directory-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .directory-item {
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .directory-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateX(3px);
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .item-badge {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .item-route {
          font-size: 12px;
          color: #94a3b8;
          padding-left: 2px;
        }

        @media (max-width: 1400px) {
          .track-grid-layout {
            grid-template-columns: 260px 1.2fr 1fr;
            gap: 14px;
          }
          .journey-config-bar {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 1100px) {
          .track-train-page {
            height: auto;
          }
          .dashboard-wrapper {
            padding-left: 20px;
            padding-right: 20px;
          }
          .track-grid-layout {
            grid-template-columns: 1fr;
          }
          .track-left-col {
            max-height: 420px;
          }
          .train-image-card {
            border-radius: 16px;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 420px;
          }
          .search-bar-center-col {
            transform: none;
            width: 100%;
          }
          .track-search-header {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding-left: 0;
          }
          .track-header-right-text {
            align-items: center;
            text-align: center;
          }
          .journey-config-bar {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .track-input-pill {
            width: 100%;
          }
          .track-search-form {
            flex-direction: column;
            width: 100%;
          }
          .search-action-btn {
            width: 100%;
          }
          .journey-config-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .config-divider {
            display: none;
          }
          .config-select {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
