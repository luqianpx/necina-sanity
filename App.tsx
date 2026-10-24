
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import OfficialNavbar from './components/OfficialNavbar';
import OfficialFooter from './components/OfficialFooter';
import OfficialHome from './pages/OfficialHome';
import AboutPage from './pages/AboutPage';
import LeadershipPage from './pages/LeadershipPage';
import ProgramsPage from './pages/ProgramsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MediaPage from './pages/MediaPage';
import GetInvolvedPage from './pages/GetInvolvedPage';
import AnniversaryPage from './pages/AnniversaryPage';
import HighlightDetail from './components/HighlightDetail';
import AIAssistant from './components/AIAssistant';
import type { Locale, DesignStyle } from './types';
import { STYLE_TOKENS } from './constants';

const BRAND = {
  primary: '#29B0E9',
  primaryHover: '#218DBA',
  primaryDark: '#1B7297',
  bg1: '#EAF7FD',
  bg2: '#D4EFFB',
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
};

const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('necina_locale');
    return saved === 'zh' || saved === 'en' ? saved : 'en';
  });

  const designStyle: DesignStyle = 'modern';

  useEffect(() => {
    const tokens = STYLE_TOKENS?.[designStyle];
    if (tokens) {
      Object.entries(tokens).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value as string);
      });
    }
    document.documentElement.style.setProperty('--brand', BRAND.primary);
    document.documentElement.style.setProperty('--brandHover', BRAND.primaryHover);
    document.documentElement.style.setProperty('--brandDark', BRAND.primaryDark);
    document.documentElement.style.setProperty('--brandBg1', BRAND.bg1);
    document.documentElement.style.setProperty('--brandBg2', BRAND.bg2);
    document.documentElement.setAttribute('data-style', designStyle);
  }, [designStyle]);

  useEffect(() => {
    document.documentElement.setAttribute('data-locale', locale);
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('necina_locale', locale);
  }, [locale]);

  return (
    <div
      className="min-h-screen transition-all duration-500 ease-in-out bg-slate-950 text-white"
      style={{
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
      }}
    >
      <OfficialNavbar locale={locale} setLocale={setLocale} />
      <ScrollToTop />

      <main key={locale} className="min-h-screen">
        <Routes>
          <Route path="/" element={<OfficialHome locale={locale} />} />
          <Route path="/about" element={<AboutPage locale={locale} />} />
          <Route path="/leadership" element={<LeadershipPage locale={locale} />} />
          <Route path="/programs" element={<ProgramsPage locale={locale} />} />
          <Route path="/programs/:slug" element={<ProgramDetailPage locale={locale} />} />
          <Route path="/events" element={<EventsPage locale={locale} />} />
          <Route path="/events/:slug" element={<EventDetailPage locale={locale} />} />
          <Route path="/events/:slug/poster" element={<EventDetailPage locale={locale} defaultView="poster" />} />
          {/* Sanity trial: same pages, data read from Sanity. Original routes above are unchanged. */}
          <Route path="/sanity/events" element={<EventsPage locale={locale} dataSource="sanity" />} />
          <Route path="/sanity/events/:slug" element={<EventDetailPage locale={locale} dataSource="sanity" />} />
          <Route path="/sanity/events/:slug/poster" element={<EventDetailPage locale={locale} defaultView="poster" dataSource="sanity" />} />
          <Route path="/media" element={<MediaPage locale={locale} />} />
          <Route path="/get-involved" element={<GetInvolvedPage locale={locale} />} />
          <Route path="/anniversary" element={<AnniversaryPage locale={locale} />} />
          <Route path="/highlights/:id" element={<HighlightDetail locale={locale} />} />
          <Route path="*" element={<OfficialHome locale={locale} />} />
        </Routes>
      </main>

      <OfficialFooter locale={locale} />
      <AIAssistant />
    </div>
  );
};

export default App;
