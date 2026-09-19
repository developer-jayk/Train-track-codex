import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { TrackTrainPage } from './pages/TrackTrainPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { FeedbackPage } from './pages/FeedbackPage';

export type AppPage = 'home' | 'track' | 'about' | 'privacy' | 'feedback';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [selectedTrain, setSelectedTrain] = useState<string>('12123');

  // Sync with browser hash if present
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (rawHash.startsWith('track')) {
        const queryMatch = rawHash.match(/q=([^&]+)/);
        if (queryMatch) {
          setSelectedTrain(decodeURIComponent(queryMatch[1]));
        }
        setCurrentPage('track');
      } else if (rawHash === 'about') {
        setCurrentPage('about');
      } else if (rawHash === 'privacy' || rawHash === 'terms') {
        setCurrentPage('privacy');
      } else if (rawHash === 'feedback') {
        setCurrentPage('feedback');
      } else {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: AppPage, trainQuery?: string) => {
    if (trainQuery) {
      setSelectedTrain(trainQuery);
      window.location.hash = `track?q=${encodeURIComponent(trainQuery)}`;
    } else {
      window.location.hash = page === 'home' ? '' : page;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="setu-app">
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'track' && (
        <TrackTrainPage
          initialTrainNumber={selectedTrain}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
      {currentPage === 'privacy' && <PrivacyPolicyPage onNavigate={handleNavigate} />}
      {currentPage === 'feedback' && <FeedbackPage onNavigate={handleNavigate} />}
    </div>
  );
};
