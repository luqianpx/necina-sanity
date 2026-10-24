import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Calendar,
  MapPin,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  Mail,
  BookOpen,
  Building,
  Target,
  FileText,
  Clock,
  ShieldCheck,
  Download,
  ZoomIn,
  Copy,
  Check,
  QrCode,
  X,
  Image as ImageIcon,
  Share2,
  Maximize2
} from 'lucide-react';
import type { Locale } from '../types';
import { EVENTS_LIST } from '../officialContent';
import { useSanityEvents } from '../services/sanityEvents';

interface EventDetailPageProps {
  locale: Locale;
  defaultView?: 'overview' | 'poster';
  dataSource?: 'local' | 'sanity';
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  locale,
  defaultView = 'overview',
  dataSource = 'local'
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isZh = locale === 'zh';

  const sanity = useSanityEvents(dataSource === 'sanity');
  const allEvents = dataSource === 'sanity' ? sanity.events : EVENTS_LIST;
  const event = slug ? allEvents.find((e) => e.slug === slug || e.id === slug) : undefined;

  // View mode: 'overview' or 'poster'
  const initialView = defaultView === 'poster' || searchParams.get('view') === 'poster' ? 'poster' : 'overview';
  const [viewMode, setViewMode] = useState<'overview' | 'poster'>(initialView);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  useEffect(() => {
    if (searchParams.get('view') === 'poster' || defaultView === 'poster') {
      setViewMode('poster');
    }
  }, [searchParams, defaultView]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, viewMode]);

  // SEO & Schema.org JSON-LD structured data injection
  useEffect(() => {
    if (!event) return;

    const pageTitle = isZh
      ? `${event.title_zh}${viewMode === 'poster' ? ' [活动宣传海报/宣传页]' : ''} | NECINA 纽英伦中华资讯网络协会`
      : `${event.title}${viewMode === 'poster' ? ' [Official Promotional Poster & Flyer]' : ''} | NECINA`;
    const pageDesc = isZh ? event.description_zh : event.description;
    const origin = window.location.origin;
    const canonicalUrl = `${origin}/events/${event.slug}${viewMode === 'poster' ? '?view=poster' : ''}`;
    const imageUrl = (event.posterImage || event.image).startsWith('http')
      ? (event.posterImage || event.image)
      : `${origin}${event.posterImage || event.image}`;

    document.title = pageTitle;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    // OpenGraph Tags
    const setMetaProperty = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaProperty('og:title', pageTitle);
    setMetaProperty('og:description', pageDesc);
    setMetaProperty('og:image', imageUrl);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:type', 'article');
    setMetaProperty('og:site_name', 'NECINA');

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Schema.org JSON-LD Event metadata
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: isZh ? event.title_zh : event.title,
      description: isZh ? event.description_zh : event.description,
      image: [imageUrl],
      startDate: event.id === 'yes-kickoff-launch' ? '2026-10-17T09:30:00-04:00' : '2025-08-09T09:30:00-04:00',
      endDate: event.id === 'yes-kickoff-launch' ? '2026-12-12T11:30:00-05:00' : '2026-05-16T17:00:00-04:00',
      eventStatus: event.status === 'upcoming' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCompleted',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: isZh ? event.venue_zh : event.venue,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '39 Marrett Rd',
          addressLocality: 'Lexington',
          addressRegion: 'MA',
          postalCode: '02421',
          addressCountry: 'US'
        }
      },
      organizer: {
        '@type': 'Organization',
        name: isZh ? '纽英伦中华资讯网络协会 (NECINA)' : 'NECINA',
        url: origin
      },
      offers: {
        '@type': 'Offer',
        url: event.registrationUrl || canonicalUrl,
        availability: 'https://schema.org/InStock',
        price: '0',
        priceCurrency: 'USD'
      }
    };

    const schemaId = 'necina-event-jsonld';
    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => {
      const el = document.getElementById(schemaId);
      if (el) el.remove();
    };
  }, [event, isZh, viewMode]);

  if (dataSource === 'sanity' && sanity.loading) {
    return <div className="min-h-screen pt-40 text-center text-slate-400">Loading…</div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-36 pb-24 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-primary">
            <Calendar className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white">
            {isZh ? '未找到该活动' : 'Event Not Found'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isZh
              ? '抱歉，您访问的活动页面不存在或已被更新。请返回活动页面查看全部官方活动与回顾。'
              : 'The requested event could not be found. Please return to the events calendar.'}
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-lg transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isZh ? '返回全部活动' : 'Back to All Events'}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Find index for next/previous navigation
  const currentIndex = allEvents.findIndex((e) => e.id === event.id);
  const prevEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : undefined;
  const nextEvent = currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : undefined;

  const posterSrc = event.posterImage || event.image || '/yes 2026.jpg';
  const photoSrc = event.photoImage || event.image || '/yes 2026.jpg';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events/${event.slug}?view=poster`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const switchView = (mode: 'overview' | 'poster') => {
    setViewMode(mode);
    setSearchParams(mode === 'poster' ? { view: 'poster' } : {});
  };

  const t = {
    allEvents: isZh ? '活动与新闻' : 'Events & News',
    youthCategory: isZh ? '青年创业' : 'Youth',
    verifiedSource: isZh ? '核验自微信公众号官方推文' : 'Verified WeChat Official Article',
    viewWeChatSource: isZh ? '查看微信原文链接' : 'View Original WeChat Article',
    concluded: isZh ? '往期活动圆满举行并归档' : 'Concluded Successfully • Archived',
    dateLabel: isZh ? '活动周期 / 时间' : 'Date & Schedule',
    venueLabel: isZh ? '举办场地 / 地点' : 'Location / Venues',
    organizerLabel: isZh ? '主办机构' : 'Organizer',
    coOrganizerLabel: isZh ? '联合协办与合作机构' : 'Participating & Co-Organizers',
    audienceLabel: isZh ? '适合对象 / 申请群体' : 'Target Audience',
    statusLabel: isZh ? '活动状态' : 'Event Status',
    registerBtn: isZh ? '查看官方报名与申请表单' : 'View Registration / Application Form',
    contactBtn: isZh
      ? `邮件咨询 (${event?.contactEmail || 'necinainfo@gmail.com'})`
      : `Contact (${event?.contactEmail || 'necinainfo@gmail.com'})`,
    highlightsTitle: isZh ? '本期项目核心亮点' : 'Key Program Highlights',
    curriculumTitle: isZh ? '模块化实战训练营大纲' : 'Modular Bootcamp Curriculum & Agenda',
    facultyTitle: isZh ? '特邀导师与评审专家团队' : 'Featured Faculty, Mentors & Judges',
    fullContentTitle: isZh ? '活动详细背景与原文报道' : 'Detailed Event Overview & Coverage',
    sourceNoticeTitle: isZh ? '官方内容核验与透明度声明' : 'Official Source & Verification Statement',
    sourceNoticeBody: isZh
      ? '本页面内容严格基于 NECINA 官方微信公众号推文（链接附后）及官方历史项目档案整理，保留了原文的所有核心时间、地点、导师与课程设置。若有最新批次课程招募，请认准官方渠道报名。'
      : 'This page is synchronized strictly against the official NECINA WeChat Official Account publication and historical program archives, preserving all verified dates, curriculum modules, mentor details, and application paths.',
    prevEvent: isZh ? '上一个活动' : 'Previous Event',
    nextEvent: isZh ? '下一个活动' : 'Next Event',
    tabOverview: isZh ? '图文报道与大纲' : 'Overview & Details',
    tabPoster: isZh ? '活动官方海报 / 宣传页' : 'Official Poster & Flyer',
    posterBadge: isZh ? '官方活动宣传页' : 'Official Promo Flyer',
    posterTitle: isZh ? '活动官方宣传海报' : 'Official Event Promotional Poster',
    posterSubtitle: isZh
      ? '适用于社交媒体、微信朋友圈与群聊传播的官方高精度宣传海报'
      : 'High-resolution official publicity poster for social media and community distribution',
    downloadPoster: isZh ? '下载 / 保存海报原图' : 'Download Full Poster',
    zoomPoster: isZh ? '点击全屏高清放大' : 'Fullscreen Zoom Preview',
    copyFlyerLink: isZh ? '复制宣传页专属链接' : 'Copy Promo Page Link',
    copiedMsg: isZh ? '宣传页链接已复制到剪贴板！' : 'Flyer link copied to clipboard!',
    shareWeChat: isZh ? '微信 / 朋友圈分享' : 'WeChat / Social Share',
    cohortPhotoTitle: isZh ? '往届青年创业实训营学员与导师现场' : 'Past Cohort Students & Executive Mentors',
    posterFlyerNotice: isZh
      ? '海报宣传页由 NECINA 青年创业团队精心制作，专为展示 AI 驱动青年创业领袖计划（YES）所设计。欢迎分享给有志于科技创新的 9–12 年级高中生与家长。'
      : 'This promotional poster flyer is designed by the NECINA Youth team to showcase the AI-Driven Youth Entrepreneurship Leadership Program (YES). Feel free to share with high school students and parents.',
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen pt-24 sm:pt-28 pb-24 selection:bg-primary/30">
      {/* 1. TOP BREADCRUMB & VERIFICATION BAR */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link to="/events" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.allEvents}</span>
            </Link>
            <span>/</span>
            <Link
              to={`/events?category=${event.category}`}
              className="text-primary hover:underline"
            >
              {isZh ? event.category_zh : event.category}
            </Link>
            <span>/</span>
            <span className="text-white font-bold truncate max-w-xs sm:max-w-md">
              {isZh ? event.title_zh : event.title}
            </span>
            {viewMode === 'poster' && (
              <>
                <span>/</span>
                <span className="text-primary font-bold">{isZh ? '宣传页' : 'Flyer'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors text-[11px] font-bold"
                title={event.sourceUrl}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.verifiedSource}</span>
                <ExternalLink className="w-3 h-3 text-emerald-400/70" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER: OVERVIEW VS. POSTER PROMO PAGE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-4 p-2 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchView('overview')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                viewMode === 'overview'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.tabOverview}</span>
            </button>

            <button
              onClick={() => switchView('poster')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
                viewMode === 'poster'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>{t.tabPoster}</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold ml-1">
                {isZh ? '宣传页' : 'Flyer'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-colors"
              >
                <span>{isZh ? '报名通道' : 'Registration'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </a>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-white/10 transition-colors"
              title={t.copyFlyerLink}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{isZh ? '已复制' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isZh ? '复制链接' : 'Copy Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: DEDICATED PROMOTIONAL POSTER & FLYER SHOWCASE (宣传页) */}
      {/* ========================================================================= */}
      {viewMode === 'poster' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Header Banner */}
          <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary/10 border border-primary/30 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 text-xs font-black uppercase tracking-wider">
                  ★ {t.posterBadge}
                </span>
                {event.status === 'upcoming' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{isZh ? '火热招募中 (10/17开课)' : 'Registration Open (Starts Oct 17)'}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.concluded}</span>
                  </span>
                )}

                {event.cost && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    ★ {isZh ? event.cost_zh || event.cost : event.cost}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {isZh ? event.title_zh : event.title}
              </h1>

              {(event.subtitle || event.subtitle_zh) && (
                <p className="text-base sm:text-lg text-primary-light font-medium">
                  {isZh ? event.subtitle_zh : event.subtitle}
                </p>
              )}

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                {t.posterFlyerNotice}
              </p>
            </div>
          </div>

          {/* Main Showcase Grid: Full Poster Flyer + Summary Sidebar */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: The Promotional Poster Card */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative rounded-3xl overflow-hidden border-2 border-primary/40 bg-slate-950 shadow-2xl shadow-primary/20 group">
                <div
                  className="relative cursor-pointer overflow-hidden"
                  onClick={() => setShowLightbox(true)}
                  title={t.zoomPoster}
                >
                  <img
                    src={posterSrc}
                    alt={isZh ? `${event.title_zh} 官方宣传海报` : `${event.title} Official Poster`}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="px-4 py-2 rounded-xl bg-slate-900/90 text-white font-bold text-xs backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg">
                      <ZoomIn className="w-4 h-4 text-primary" />
                      <span>{t.zoomPoster}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Poster Action Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <a
                    href={posterSrc}
                    download="NECINA_YES_Youth_Program_Poster.jpg"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadPoster}</span>
                  </a>

                  <button
                    onClick={() => setShowLightbox(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold border border-white/10 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-primary" />
                    <span>{t.zoomPoster}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-white/10 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{isZh ? '已复制' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.copyFlyerLink}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t.shareWeChat}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Key Flyer Information, Highlights & Actions */}
            <div className="lg:col-span-5 space-y-6">
              {/* Quick Info Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>{isZh ? '宣传页核心提要' : 'Flyer Quick Facts'}</span>
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3 text-slate-300">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t.dateLabel}
                      </span>
                      <span className="font-semibold text-white">
                        {isZh ? event.date_zh : event.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-slate-300">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t.audienceLabel}
                      </span>
                      <span className="font-semibold text-white">
                        {isZh ? event.targetAudience_zh : event.targetAudience}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-slate-300">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t.venueLabel}
                      </span>
                      <span className="font-semibold text-white">
                        {isZh ? event.venue_zh : event.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-slate-300">
                    <Building className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t.organizerLabel}
                      </span>
                      <span className="font-semibold text-white">
                        {isZh ? event.organizer_zh : event.organizer}
                      </span>
                    </div>
                  </div>

                  {event.cost && (
                    <div className="flex items-start gap-3 text-slate-300">
                      <Award className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isZh ? '课程费用 / 学费' : 'Tuition / Cost'}
                        </span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {isZh ? event.cost_zh || event.cost : event.cost}
                        </span>
                      </div>
                    </div>
                  )}

                  {event.contactEmail && (
                    <div className="flex items-start gap-3 text-slate-300">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isZh ? '官方咨询邮箱' : 'Contact Email'}
                        </span>
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {event.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA Buttons */}
                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  {event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/30 transition-all transform active:scale-95"
                    >
                      <span>{isZh ? (event.registrationText_zh || t.registerBtn) : (event.registrationText || t.registerBtn)}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {event.sourceUrl && (
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{t.viewWeChatSource}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => switchView('overview')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs border border-white/10 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{isZh ? '查看完整课程模块与图文报道' : 'View Full Curriculum & Details'}</span>
                  </button>
                </div>
              </div>

              {/* Program Highlights Brief */}
              {event.highlights && event.highlights.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.highlightsTitle}</span>
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {(isZh ? event.highlights_zh || event.highlights : event.highlights).map((hl, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cohort Photo Showcase Card */}
              {photoSrc && (
                <div className="rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl group">
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={photoSrc}
                      alt={t.cohortPhotoTitle}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  </div>
                  <div className="p-4 bg-slate-900/90 text-xs">
                    <span className="font-semibold text-slate-300 block">
                      {t.cohortPhotoTitle}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isZh ? '波士顿线下实战营与 MIT 总决赛盛况' : 'Live Boston Bootcamp & MIT Capstone Showcase'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: FULL EVENT OVERVIEW, DETAILS, CURRICULUM & MENTORS (图文详情) */}
      {/* ========================================================================= */}
      {viewMode === 'overview' && (
        <>
          {/* HERO HEADER SECTION */}
          <header className="relative pt-10 pb-16 lg:pb-20 border-b border-white/5 overflow-hidden">
            <div className="absolute top-0 right-10 w-[550px] h-[550px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Left Column: Event Title, Tagline & Description */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 text-xs font-bold uppercase tracking-wider">
                      {isZh ? event.category_zh : event.category}
                    </span>

                    {event.status === 'upcoming' ? (
                      <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{isZh ? '火热招募中 (10/17开课)' : 'Registration Open (Starts Oct 17)'}</span>
                      </span>
                    ) : (
                      <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.concluded}</span>
                      </span>
                    )}

                    {event.cost && (
                      <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                        ★ {isZh ? event.cost_zh || event.cost : event.cost}
                      </span>
                    )}

                    <button
                      onClick={() => switchView('poster')}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isZh ? '查看宣传海报单页' : 'View Promo Poster'}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                    {isZh ? event.title_zh : event.title}
                  </h1>

                  {(event.subtitle || event.subtitle_zh) && (
                    <div className="inline-block p-4 rounded-2xl bg-white/5 border border-primary/30 text-primary-light font-semibold text-base sm:text-lg leading-snug">
                      <span className="text-primary font-bold mr-2">✦</span>
                      {isZh ? event.subtitle_zh : event.subtitle}
                    </div>
                  )}

                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    {isZh ? event.description_zh : event.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    {event.registrationUrl && (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all transform active:scale-95"
                      >
                        <span>{isZh ? (event.registrationText_zh || t.registerBtn) : (event.registrationText || t.registerBtn)}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => switchView('poster')}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-sm border border-emerald-500/40 transition-all"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{t.tabPoster}</span>
                    </button>

                    {event.sourceUrl && (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all"
                      >
                        <span>{t.viewWeChatSource}</span>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    )}

                    <a
                      href={`mailto:${event.contactEmail || 'necinainfo@gmail.com'}`}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-white/10 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{t.contactBtn}</span>
                    </a>
                  </div>
                </div>

                {/* Right Column: Poster Card & Key Metadata */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl overflow-hidden border border-primary/30 bg-slate-900 shadow-2xl relative group">
                    <div
                      className="relative h-72 sm:h-80 overflow-hidden cursor-pointer"
                      onClick={() => switchView('poster')}
                      title={t.tabPoster}
                    >
                      <img
                        src={posterSrc}
                        alt={isZh ? event.title_zh : event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-[11px] font-bold text-slate-200 border border-white/10 inline-block">
                          {isZh ? '活动官方海报 • 点击切换至宣传页' : 'Official Event Poster • Click for Flyer'}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      </div>
                    </div>

                    {/* Key Metadata Grid */}
                    <div className="p-6 space-y-4 text-xs">
                      <div className="flex items-start gap-3 text-slate-300">
                        <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {t.dateLabel}
                          </span>
                          <span className="font-semibold text-white">
                            {isZh ? event.date_zh : event.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-slate-300">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {t.venueLabel}
                          </span>
                          <span className="font-semibold text-white">
                            {isZh ? event.venue_zh : event.venue}
                          </span>
                        </div>
                      </div>

                      {event.targetAudience && (
                        <div className="flex items-start gap-3 text-slate-300">
                          <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {t.audienceLabel}
                            </span>
                            <span className="font-semibold text-white">
                              {isZh ? event.targetAudience_zh : event.targetAudience}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 text-slate-300">
                        <Building className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {t.organizerLabel}
                          </span>
                          <span className="font-semibold text-white">
                            {isZh ? event.organizer_zh : event.organizer}
                          </span>
                        </div>
                      </div>

                      {event.cost && (
                        <div className="flex items-start gap-3 text-slate-300">
                          <Award className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isZh ? '课程费用 / 学费' : 'Tuition / Cost'}
                            </span>
                            <span className="font-bold text-emerald-400 text-sm">
                              {isZh ? event.cost_zh || event.cost : event.cost}
                            </span>
                          </div>
                        </div>
                      )}

                      {event.contactEmail && (
                        <div className="flex items-start gap-3 text-slate-300">
                          <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isZh ? '官方咨询邮箱' : 'Contact Email'}
                            </span>
                            <a
                              href={`mailto:${event.contactEmail}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {event.contactEmail}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Poster Link CTA */}
                      <div className="pt-2">
                        <button
                          onClick={() => switchView('poster')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>{isZh ? '打开完整官方宣传海报单页' : 'Open Full Promotional Poster Page'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN BODY & STRUCTURED SECTIONS */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
            {/* SECTION A: KEY PROGRAM HIGHLIGHTS */}
            {event.highlights && event.highlights.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.highlightsTitle}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {(isZh ? event.highlights_zh || event.highlights : event.highlights).map(
                    (hl, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span>Highlight 0{idx + 1}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          {hl}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* SECTION B: MODULAR CURRICULUM & WORKSHOP SESSIONS */}
            {event.curriculum && event.curriculum.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.curriculumTitle}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.curriculum.map((curr, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider inline-block">
                          Module {idx + 1}
                        </span>
                        <h3 className="text-base font-bold text-white leading-snug">
                          {isZh ? curr.title_zh : curr.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isZh ? curr.desc_zh : curr.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION C: DETAILED OVERVIEW & FULL REPORTAGE */}
            {event.paragraphs && event.paragraphs.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.fullContentTitle}
                  </h2>
                </div>

                <article className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-white/10 space-y-5 text-slate-300 leading-relaxed text-base font-normal">
                  {(isZh ? event.paragraphs_zh || event.paragraphs : event.paragraphs).map(
                    (p, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {p}
                      </p>
                    )
                  )}
                </article>
              </section>
            )}

            {/* SECTION D: FEATURED FACULTY & MENTORS */}
            {event.speakers && event.speakers.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.facultyTitle}
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {(isZh ? event.speakers_zh || event.speakers : event.speakers).map(
                    (spk, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <h3 className="text-sm font-bold text-white">{spk}</h3>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* SECTION E: OFFICIAL PROMOTIONAL POSTER PREVIEW IN OVERVIEW */}
            <section className="p-8 rounded-3xl bg-slate-900/70 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
                  <img
                    src={posterSrc}
                    alt={t.posterTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>{t.posterTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {t.posterSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => switchView('poster')}
                  className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>{isZh ? '进入活动宣传单页' : 'Open Promotional Flyer'}</span>
                </button>
                <a
                  href={posterSrc}
                  download="NECINA_YES_Youth_Poster.jpg"
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isZh ? '保存海报' : 'Download'}</span>
                </a>
              </div>
            </section>

            {/* SECTION F: TRANSPARENCY & SOURCE VERIFICATION BOX */}
            <section className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t.sourceNoticeTitle}
                  </h3>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Source: {event.sourceUrl || 'NECINA Official Archive'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {t.sourceNoticeBody}
              </p>

              {event.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors"
                  >
                    <span>{t.viewWeChatSource}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </section>

            {/* PREV / NEXT NAVIGATION BAR */}
            <nav
              aria-label="Event Navigation"
              className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold"
            >
              {prevEvent ? (
                <Link
                  to={`/events/${prevEvent.slug}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase text-slate-500 block">{t.prevEvent}</span>
                    <span className="truncate max-w-xs block text-white">{isZh ? prevEvent.title_zh : prevEvent.title}</span>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              <Link
                to="/events"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                {isZh ? '返回活动总览' : 'Back to Events Overview'}
              </Link>

              {nextEvent ? (
                <Link
                  to={`/events/${nextEvent.slug}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 block">{t.nextEvent}</span>
                    <span className="truncate max-w-xs block text-white">{isZh ? nextEvent.title_zh : nextEvent.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </main>
        </>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL: FULLSCREEN HIGH-RES POSTER PREVIEW */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6"
            onClick={() => setShowLightbox(false)}
          >
            <div
              className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Poster Image */}
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[75vh]">
                <img
                  src={posterSrc}
                  alt={isZh ? `${event.title_zh} 海报` : `${event.title} Poster`}
                  className="w-full h-full object-contain max-h-[75vh]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Toolbar in Modal */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={posterSrc}
                  download="NECINA_YES_Youth_Poster.jpg"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.downloadPoster}</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{isZh ? '已复制宣传页链接' : 'Link Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary" />
                      <span>{t.copyFlyerLink}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* WECHAT SHARE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {isZh ? '微信分享宣传页' : 'Share to WeChat'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isZh
                    ? '复制本宣传页链接或长按保存上方海报，即可直接发送至微信好友或朋友圈。'
                    : 'Copy the flyer link or save the poster image to share with friends and social groups.'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
                {/* SVG QR Code Simulation */}
                <div className="w-44 h-44 bg-slate-950 rounded-xl flex flex-col items-center justify-center p-4 text-white">
                  <QrCode className="w-24 h-24 text-primary" />
                  <span className="text-[10px] text-slate-400 font-mono mt-2">
                    necina.org/events/yes
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (isZh ? '链接已成功复制！' : 'Link Copied!') : t.copyFlyerLink}</span>
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  {isZh ? '关闭' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailPage;
