import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Bell, Clock, ArrowRight, CheckCircle2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { Locale } from '../types';
import { EVENTS_LIST } from '../officialContent';
import { useSanityEvents } from '../services/sanityEvents';

interface EventsPageProps {
  locale: Locale;
  dataSource?: 'local' | 'sanity';
}

export const EventsPage: React.FC<EventsPageProps> = ({ locale, dataSource = 'local' }) => {
  const isZh = locale === 'zh';
  const sanity = useSanityEvents(dataSource === 'sanity');
  const allEvents = dataSource === 'sanity' ? sanity.events : EVENTS_LIST;
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCategory = searchParams.get('category');
  const paramTab = searchParams.get('tab');

  const [selectedCategory, setSelectedCategory] = useState<string>(
    paramCategory && ['Flagship', 'AI & Tech', 'Youth', 'Entrepreneurship'].includes(paramCategory)
      ? paramCategory
      : 'all'
  );
  const upcomingCount = EVENTS_LIST.filter((e) => e.status === 'upcoming').length;
  const [activeTab, setActiveTab] = useState<'past' | 'upcoming'>(
    paramTab === 'past' ? 'past' : (paramTab === 'upcoming' ? 'upcoming' : (upcomingCount > 0 ? 'upcoming' : 'past'))
  );

  useEffect(() => {
    if (paramCategory && ['Flagship', 'AI & Tech', 'Youth', 'Entrepreneurship'].includes(paramCategory)) {
      setSelectedCategory(paramCategory);
    }
  }, [paramCategory]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleTabSelect = (tab: 'past' | 'upcoming') => {
    setActiveTab(tab);
    if (tab === 'past') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  const categories = [
    { id: 'all', label: isZh ? '全部类别' : 'All Categories' },
    { id: 'Flagship', label: isZh ? '旗舰峰会' : 'Flagship' },
    { id: 'AI & Tech', label: isZh ? '前沿科技' : 'AI & Tech' },
    { id: 'Youth', label: isZh ? '青年创业' : 'Youth' },
    { id: 'Entrepreneurship', label: isZh ? '商业领袖' : 'Entrepreneurship' },
  ];

  const filteredEvents = allEvents.filter(ev => {
    const matchesTab = ev.status === activeTab;
    const matchesCat = selectedCategory === 'all' || ev.category === selectedCategory;
    return matchesTab && matchesCat;
  });

  const t = {
    badge: isZh ? 'NECINA 活动日历与历史回顾' : 'Events, Conferences & Archives',
    title: isZh ? '汇聚全球华人智识，共赴科技浪潮' : 'Connect, Learn & Engage at Premier Tech Gatherings',
    subtitle: isZh
      ? '三十年来，NECINA 持续举办数百场高规格学术研讨会、前沿技术论坛、青年大赛与高端社交酒会，让每一位参与者拓展视野与人脉。'
      : 'For three decades, NECINA has hosted hundreds of high-caliber conferences, tech symposiums, youth competitions, and exclusive networking mixers across New England.',
    upcomingTab: isZh ? '最新待办活动' : 'Upcoming Events',
    pastTab: isZh ? '往期活动精彩回顾' : 'Past Events Archive',
    speakersLabel: isZh ? '特邀演讲嘉宾' : 'Featured Speakers',
    venueLabel: isZh ? '地点' : 'Venue',
    concluded: isZh ? '活动已圆满举行' : 'Concluded Successfully',
    announcementsTitle: isZh ? '官方重要公告与通知' : 'Official News & Announcements',
    noUpcoming: isZh ? '暂无正在开放报名的活动' : 'No upcoming event registrations currently open',
    noUpcomingSub: isZh ? '过往精彩峰会与活动均已圆满落幕并归档，新一季活动安排将在此发布，敬请关注！' : 'All prior events have concluded and are archived. Upcoming season events will be announced here soon!'
  };

  const announcements = [
    {
      date: isZh ? '2026年6月' : 'June 2026',
      title: isZh ? 'NECINA 三十周年盛大庆典与科技峰会圆满落幕' : 'NECINA 30th Anniversary Grand Ceremony & Gala Concludes',
      desc: isZh
        ? '数百位中美科技领袖、校友与学子齐聚 Bentley 大学会议中心，共同见证三十载荣耀传承。'
        : 'Over 500 tech leaders, alumni, and community members gathered at Bentley University to celebrate 30 years of impact.'
    },
    {
      date: isZh ? '2026年5月' : 'May 2026',
      title: isZh ? 'YES 青年创业大赛二十周年全场总决赛胜利举办' : 'YES 20th Anniversary Final Pitch Showcase Completed',
      desc: isZh
        ? '高中入围战队在 MIT Stata 创新中心展示经过市场验证的商业计划书，展现下一代卓越商业潜能。'
        : 'High school finalist teams presented validated prototypes and business models before distinguished venture judges at MIT.'
    },
    {
      date: isZh ? '2026年3月' : 'March 2026',
      title: isZh ? '新一届志愿者团队招募持续进行中' : 'Annual Volunteer Recruitment Ongoing',
      desc: isZh
        ? '为科技峰会策划、新媒体运营、青少年导师库及技术开发提供广阔的实践舞台与领导力平台。'
        : 'Offering leadership roles in event logistics, marketing, youth mentoring, and full-stack technical systems.'
    }
  ];

  return (
    <div className="bg-slate-950 text-white min-h-screen pt-28 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative py-16 lg:py-24 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-10 w-[550px] h-[550px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              {t.title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              {t.subtitle}
            </p>
          </div>

          {/* Sub-navigation Controls: Upcoming vs Past + Category Tabs */}
          <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold w-fit">
              <button
                onClick={() => handleTabSelect('upcoming')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === 'upcoming' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{t.upcomingTab}</span>
                {upcomingCount > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'upcoming' ? 'bg-white text-primary' : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {upcomingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabSelect('past')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'past' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.pastTab}
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. EVENT LISTINGS */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {dataSource === 'sanity' && (
            <div className="mb-8 px-4 py-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-sm text-amber-200">
              {sanity.loading
                ? 'Sanity trial: loading events…'
                : sanity.error
                  ? `Sanity trial: failed to load (${sanity.error})`
                  : `Sanity trial: ${sanity.events.length} events loaded from Sanity`}
            </div>
          )}
          {sanity.loading && dataSource === 'sanity' ? null : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/10 space-y-4">
              <Clock className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-xl font-bold text-slate-300">
                {activeTab === 'upcoming' ? t.noUpcoming : (isZh ? '此分类下暂无已列出活动' : 'No events found in this category')}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {activeTab === 'upcoming' ? t.noUpcomingSub : (isZh ? '请切换其他分类或浏览往期精彩回顾。' : 'Please check other categories or browse the past events archive.')}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-3xl bg-slate-900 border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 shadow-xl"
                >
                  <div>
                    {/* Event Banner */}
                    <Link
                      to={`/events/${ev.slug || ev.id}`}
                      className="block relative h-60 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={ev.image}
                        alt={isZh ? ev.title_zh : ev.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-bold text-primary border border-white/10">
                          {isZh ? ev.category_zh : ev.category}
                        </span>
                        {ev.id === '30th-gala' && (
                          <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-xs font-bold text-white border border-primary/40">
                            ★ 30th Anniversary
                          </span>
                        )}
                        {ev.id === 'yes-kickoff-launch' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-xs font-bold text-emerald-300 border border-emerald-500/40">
                            ★ {isZh ? '全新发布' : 'Newest'}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content Details */}
                    <div className="p-8 space-y-5">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-bold text-primary">
                          <Calendar className="w-4 h-4" />
                          <span>{isZh ? ev.date_zh : ev.date}</span>
                        </span>
                      </div>

                      <Link to={`/events/${ev.slug || ev.id}`} className="block">
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors leading-snug">
                          {isZh ? ev.title_zh : ev.title}
                        </h3>
                      </Link>

                      {(ev.subtitle || ev.subtitle_zh) && (
                        <p className="text-xs font-semibold text-primary/90 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                          {isZh ? ev.subtitle_zh : ev.subtitle}
                        </p>
                      )}

                      <p className="text-sm text-slate-300 leading-relaxed font-normal">
                        {isZh ? ev.description_zh : ev.description}
                      </p>

                      <div className="pt-2 flex items-start gap-2 text-xs text-slate-400">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{isZh ? ev.venue_zh : ev.venue}</span>
                      </div>

                      {/* Featured Speakers (if any) */}
                      {ev.speakers && ev.speakers.length > 0 && (
                        <div className="pt-3 border-t border-white/10 space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {t.speakersLabel}
                          </span>
                          <div className="text-xs text-slate-300 font-medium">
                            {(isZh ? ev.speakers_zh || ev.speakers : ev.speakers).join(' • ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-8 pt-0">
                    <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      {ev.status === 'upcoming' ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{isZh ? '火热报名中' : 'Registration Open'}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{t.concluded}</span>
                        </span>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {ev.posterImage && (
                          <Link
                            to={`/events/${ev.slug || ev.id}?view=poster`}
                            className="text-xs font-semibold text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                            title={isZh ? '查看活动官方宣传海报与宣传页' : 'View Official Promotional Poster Flyer'}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isZh ? '宣传海报' : 'Poster Flyer'}</span>
                          </Link>
                        )}

                        {ev.registrationUrl && (
                          <a
                            href={ev.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1"
                          >
                            <span>{isZh ? '报名通道' : 'Register'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}

                        <Link
                          to={`/events/${ev.slug || ev.id}`}
                          className="text-xs font-bold text-primary hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary transition-colors"
                        >
                          <span>{isZh ? '查看活动详情' : 'View Event Details'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. ANNOUNCEMENTS & NEWS BULLETINS */}
      <section className="py-20 bg-slate-900/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Press & Bulletins
            </span>
            <h2 className="text-3xl font-black text-white">
              {t.announcementsTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {announcements.map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-slate-950 border border-white/10 space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary font-bold">{item.date}</span>
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
