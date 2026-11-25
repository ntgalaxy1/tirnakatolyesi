/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Home,
  Images,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react';
import {
  BlockedSlotRecord,
  CustomerGalleryItem,
  Language,
  ReservationItem,
  ReservationStatus,
  SiteDesignItem,
  TimeSlotConfig,
  UserAccount,
} from './types';
import {
  INITIAL_BLOCKED_SLOTS,
  INITIAL_CUSTOMER_GALLERY,
  INITIAL_RESERVATIONS,
  INITIAL_SITE_DESIGNS,
  INITIAL_TIME_SLOTS,
} from './data';
import { getDesignTitle, t } from './i18n';
import { SiteGallerySection } from './components/SiteGallerySection';
import { CustomerGallerySection } from './components/CustomerGallerySection';
import { BookingAndAiStudio } from './components/BookingAndAiStudio';
import { MyReservationsView } from './components/MyReservationsView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { PWAInstallButton } from './components/PWAInstallButton';

type ActiveRoute = 'home' | 'my-reservations' | 'admin';

const LANGUAGES: { code: Language; label: string; title: string }[] = [
  { code: 'fa', label: 'FA', title: 'فارسی (RTL)' },
  { code: 'tr', label: 'TR', title: 'Türkçe (LTR)' },
  { code: 'en', label: 'EN', title: 'English (LTR)' },
];

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tirnak_lang');
      if (saved === 'fa' || saved === 'tr' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'fa';
  });

  const [activeRoute, setActiveRoute] = useState<ActiveRoute>(() =>
    window.location.pathname === '/admin' ? 'admin' : 'home'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent Customer/Admin Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('tirnak_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Application Data State
  const [siteDesigns, setSiteDesigns] = useState<SiteDesignItem[]>(INITIAL_SITE_DESIGNS);
  const [customerGallery, setCustomerGallery] =
    useState<CustomerGalleryItem[]>(INITIAL_CUSTOMER_GALLERY);
  const [reservations, setReservations] = useState<ReservationItem[]>(INITIAL_RESERVATIONS);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>(INITIAL_TIME_SLOTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>(INITIAL_BLOCKED_SLOTS);

  // Currently selected design for the AI Try-On & Booking Studio
  const [selectedDesign, setSelectedDesign] = useState<SiteDesignItem>(INITIAL_SITE_DESIGNS[0]);

  const tr = t(lang);

  // Sync HTML dir and lang attributes and persist in localStorage when user switches FA (RTL) / TR (LTR) / EN (LTR)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('tirnak_lang', lang);
    } catch {
      // Ignore
    }
  }, [lang]);

  // Support browser back/forward for /admin route
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setActiveRoute('admin');
      } else {
        setActiveRoute('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load latest state from backend API on mount
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        if (data.siteDesigns) setSiteDesigns(data.siteDesigns);
        if (data.customerGallery) setCustomerGallery(data.customerGallery);
        if (data.reservations) setReservations(data.reservations);
        if (data.timeSlots) setTimeSlots(data.timeSlots);
        if (data.blockedSlots) setBlockedSlots(data.blockedSlots);
      })
      .catch(() => {
        // Keep deterministic local seed data if offline
      });
  }, []);

  const navigateTo = (route: ActiveRoute, sectionId?: string) => {
    setActiveRoute(route);
    setMobileMenuOpen(false);
    const targetPath = route === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    if (route === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUserAuthenticated = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('tirnak_user_session', JSON.stringify(user));
    } catch {
      // Ignore storage quota errors
    }
    if (user.role === 'admin') {
      navigateTo('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('tirnak_user_session');
    } catch {
      // Ignore
    }
    if (activeRoute === 'admin') {
      navigateTo('home');
    }
  };

  // Triggered when user clicks «تست روی دست من» / "Elimde Dene" / "Try on My Hand" on any Site Gallery card
  const handleTryOnDesignFromGallery = (design: SiteDesignItem) => {
    setSelectedDesign(design);
    navigateTo('home', 'booking-studio');
  };

  // Admin Handlers
  const handleUpdateReservationStatus = async (id: string, status: ReservationStatus) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const handlePublishToCustomerGallery = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/publish-gallery`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.customerGalleryItem) {
        setCustomerGallery((prev) => [data.customerGalleryItem, ...prev]);
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, publishedToCustomerGallery: true, status: 'completed' }
              : r
          )
        );
      }
    } catch {
      // Fallback local publish if offline
    }
  };

  const handleToggleBlockedSlot = async (date: string, time: string) => {
    const res = await fetch('/api/schedule/toggle-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    });
    const data = await res.json();
    if (res.ok && data.blockedSlots) {
      setBlockedSlots(data.blockedSlots);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 flex flex-col bg-[#FAF0E6] text-[#3B132A] pb-16 md:pb-0">
      {/* Sticky Top Header: Responsive 1-Row Layout across 320px to Desktop */}
      <header className="sticky top-0 z-40 w-full max-w-full bg-[#FAF0E6]/95 backdrop-blur-md border-b border-[#3B132A]/12">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 h-16 min-w-0 overflow-hidden">
          {/* Zone 1: Brand Title + Official Logo Lockup */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="flex items-center gap-2 min-w-0 shrink-0"
          >
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain bg-[#FFFDFB] p-0.5 border border-[#3B132A]/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="font-brand-serif text-base sm:text-xl font-bold tracking-tight text-[#3B132A] truncate">
              Tırnak Atölyesi
            </span>
          </a>

          {/* Zone 2: Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-sm font-medium text-[#3B132A]/85 min-w-0"
            aria-label={tr.navHome}
          >
            <a
              href="#site-gallery"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'site-gallery');
              }}
              className="hover:text-[#D42663] hover:underline underline-offset-8 transition-colors break-words"
            >
              {tr.navSiteGallery}
            </a>
            <a
              href="#booking-studio"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'booking-studio');
              }}
              className="hover:text-[#D42663] hover:underline underline-offset-8 transition-colors break-words"
            >
              {tr.navBookingStudio}
            </a>
            <a
              href="#customer-gallery"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'customer-gallery');
              }}
              className="hover:text-[#D42663] hover:underline underline-offset-8 transition-colors break-words"
            >
              {tr.navCustomerGallery}
            </a>
            <a
              href="#my-reservations"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('my-reservations');
              }}
              className={`hover:text-[#D42663] hover:underline underline-offset-8 transition-colors break-words ${
                activeRoute === 'my-reservations' ? 'text-[#D42663] font-bold' : ''
              }`}
            >
              {tr.navMyReservations}
            </a>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('admin');
              }}
              className={`hover:text-[#D42663] hover:underline underline-offset-8 transition-colors break-words ${
                activeRoute === 'admin' ? 'text-[#D42663] font-bold' : ''
              }`}
            >
              {tr.navAdmin}
            </a>
          </nav>

          {/* Zone 3: Compact 3-Language Segmented Switcher (FA | TR | EN) + Primary CTA + Mobile Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            {/* Compact Single-Row Segmented Language Switcher (FA | TR | EN) */}
            <div
              role="group"
              aria-label="Language Switcher"
              data-testid="header-language-switcher"
              dir="ltr"
              className="inline-flex items-center rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 p-0.5 shrink-0"
            >
              {LANGUAGES.map((item) => {
                const active = lang === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    title={item.title}
                    data-testid={`lang-btn-${item.code}`}
                    onClick={() => setLang(item.code)}
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#3B132A] text-[#FFFDFB] shadow-xs'
                        : 'text-[#3B132A]/70 hover:text-[#D42663]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigateTo('home', 'booking-studio')}
              className="hidden md:inline-flex px-3.5 py-2 rounded-xl bg-[#D42663] text-white text-xs font-semibold hover:bg-[#B81D53] transition-colors cursor-pointer shadow-xs break-words"
            >
              {tr.heroPrimaryCta}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-[#3B132A] hover:border-[#D42663] cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Constrained Mobile Drawer Menu with 3-Language Switcher & Quick Links */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-4 bg-[#FAF0E6]/95 border-b border-[#3B132A]/15 overflow-x-hidden">
            <div className="w-[calc(100vw-2rem)] max-w-lg mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 p-4 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3B132A]/10 min-w-0">
                <span className="text-xs font-bold text-[#3B132A]/75 break-words min-w-0">
                  {tr.brandSubtitle}
                </span>
                <div
                  dir="ltr"
                  className="inline-flex items-center rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 p-0.5 shrink-0"
                >
                  {LANGUAGES.map((item) => {
                    const active = lang === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setLang(item.code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#3B132A] text-[#FFFDFB]'
                            : 'text-[#3B132A]/75 hover:text-[#D42663]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold w-full max-w-full min-w-0">
                <button
                  type="button"
                  onClick={() => navigateTo('home', 'site-gallery')}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#FAF0E6] text-start text-[#3B132A] hover:text-[#D42663] break-words"
                >
                  {tr.navSiteGallery}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('home', 'booking-studio')}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#FAF0E6] text-start text-[#D42663] font-bold break-words"
                >
                  {tr.navBookingStudio}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('home', 'customer-gallery')}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#FAF0E6] text-start text-[#3B132A] hover:text-[#D42663] break-words"
                >
                  {tr.navCustomerGallery}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('my-reservations')}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#FAF0E6] text-start text-[#3B132A] hover:text-[#D42663] break-words"
                >
                  {tr.navMyReservations}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#FAF0E6] text-start text-[#3B132A] hover:text-[#D42663] break-words"
                >
                  {tr.navAdmin}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full max-w-full min-w-0 py-2.5 px-3 rounded-xl bg-[#3B132A] text-center text-[#FFFDFB] break-words"
                >
                  {tr.loginRegisterBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full min-w-0 overflow-hidden">
        {activeRoute === 'home' && (
          <>
            {/* HERO SECTION with Official Attached Brand Logo, Service Badges, Auth & PWA Install */}
            <section className="pt-6 sm:pt-8 pb-12 sm:pb-14 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden min-w-0">
              {/* Utility Bar inside Hero (Hero Badge, User Auth, PWA Install) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-[#3B132A]/10 w-full max-w-full min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#3B132A]/75 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                  <span className="font-semibold text-[#D42663] break-words min-w-0">
                    {tr.heroBadge}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                  {/* Customer / Admin Auth Status */}
                  {currentUser ? (
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-1.5 text-xs max-w-full min-w-0">
                      <User className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                      <span className="font-bold text-[#3B132A] break-words">
                        {currentUser.fullName}
                      </span>
                      <button
                        type="button"
                        onClick={handleLogout}
                        aria-label={tr.logoutBtn}
                        className="text-[#D42663] hover:underline inline-flex items-center gap-1 cursor-pointer break-words"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>{tr.logoutBtn}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      data-testid="open-auth-modal-btn"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:border-[#D42663] transition-colors cursor-pointer max-w-full min-w-0 break-words"
                    >
                      <User className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                      <span className="break-words">{tr.loginRegisterBtn}</span>
                    </button>
                  )}

                  {/* Mandatory In-App PWA Install Button */}
                  <PWAInstallButton lang={lang} variant="toolbar" />
                </div>
              </div>

              {/* Hero 2-Column Balanced Split (`items-stretch`) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch w-full max-w-full min-w-0">
                {/* Text & Editorial Column (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6 text-start min-w-0 max-w-full">
                  <div className="space-y-5 min-w-0 max-w-full">
                    {/* Official Brand Logo Card */}
                    <div className="inline-flex flex-wrap items-center gap-3.5 p-3 pe-4 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/12 shadow-xs max-w-full min-w-0">
                      <img
                        src="/assets/logo.png"
                        alt="Tırnak Atölyesi Official Brand Logo"
                        className="h-14 sm:h-20 w-auto object-contain rounded-xl shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5 text-start min-w-0">
                        <p className="font-brand-serif text-lg sm:text-xl font-bold text-[#3B132A] break-words">
                          Tırnak Atölyesi
                        </p>
                        <p className="text-xs font-medium text-[#7B2869] tracking-wide break-words">
                          {tr.brandSubtitle}
                        </p>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#3B132A] leading-tight break-words">
                      {tr.heroTitle}
                    </h1>

                    <p className="text-sm sm:text-lg text-[#3B132A]/80 leading-relaxed max-w-2xl break-words">
                      {tr.heroDescription}
                    </p>

                    {/* Trilingual Hero Service Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 min-w-0 max-w-full">
                      {tr.heroServiceBadges.map((badge) => (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => navigateTo('home', 'booking-studio')}
                          className="px-3 py-1.5 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/12 text-xs font-bold text-[#3B132A] hover:border-[#D42663] hover:text-[#D42663] transition-colors cursor-pointer break-words min-w-0"
                        >
                          ✦ {badge.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hero CTAs & Brand Color Swatch Ribbon */}
                  <div className="space-y-6 pt-2 min-w-0 max-w-full">
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-full min-w-0">
                      <button
                        type="button"
                        onClick={() => navigateTo('home', 'booking-studio')}
                        className="w-full sm:w-auto max-w-full min-w-0 py-3.5 px-5 sm:px-6 rounded-2xl bg-[#3B132A] text-[#FFFDFB] text-sm sm:text-base font-bold hover:bg-[#D42663] transition-colors inline-flex items-center justify-center gap-2.5 shadow-md cursor-pointer break-words"
                      >
                        <Wand2 className="w-5 h-5 text-[#E5A93B] shrink-0" />
                        <span className="break-words">{tr.heroPrimaryCta}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('home', 'site-gallery')}
                        className="w-full sm:w-auto max-w-full min-w-0 py-3.5 px-5 sm:px-6 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/20 text-[#3B132A] text-sm sm:text-base font-semibold hover:border-[#D42663] transition-colors cursor-pointer text-center break-words"
                      >
                        {tr.heroSecondaryCta}
                      </button>
                    </div>

                    {/* Extracted 5-Nail Crown Color Palette Strip */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#3B132A]/75 min-w-0">
                      <span className="break-words">{tr.nailColorLabel}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: '#E5A93B' }}
                          title="Marigold Gold"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: '#F3769B' }}
                          title="Blush Pink"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: '#D42663' }}
                          title="Raspberry Magenta"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: '#7B2869' }}
                          title="Mulberry Purple"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: '#F7AD93' }}
                          title="Warm Peach"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Media Showcase Column (5 cols) */}
                <div className="lg:col-span-5 flex flex-col min-w-0 max-w-full">
                  <div className="relative flex-1 w-full max-w-full min-w-0 rounded-3xl overflow-hidden border border-[#3B132A]/15 bg-[#FFFDFB] shadow-md aspect-square sm:min-h-[320px]">
                    <img
                      src={selectedDesign.imageUrl}
                      alt={getDesignTitle(selectedDesign, lang)}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3B132A]/90 via-[#3B132A]/50 to-transparent p-4 sm:p-6 text-[#FFFDFB] space-y-1.5 text-start">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#F7AD93]">
                        <span className="font-mono font-bold break-words">
                          {selectedDesign.code}
                        </span>
                        <span className="break-words">{tr.heroPreviewBadge}</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold break-words">
                        {getDesignTitle(selectedDesign, lang)}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateTo('home', 'booking-studio')}
                        className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-[#E5A93B] hover:underline cursor-pointer break-words"
                      >
                        <Wand2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="break-words">{tr.tryOnWithAiBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width 5-Service Highlights Row Below Hero Split */}
              <div className="mt-12 pt-10 border-t border-[#3B132A]/10 text-start w-full max-w-full min-w-0">
                <h2 className="text-lg font-bold text-[#3B132A] mb-5 break-words">
                  {tr.servicesTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-full min-w-0">
                  {tr.serviceHighlights.map((srv, idx) => (
                    <div
                      key={srv.id}
                      className="w-full max-w-full min-w-0 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/12 p-4 flex flex-col justify-between space-y-2 text-start overflow-hidden"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-[#D42663]">
                          0{idx + 1}.
                        </span>
                        <h3 className="text-sm font-bold text-[#3B132A] mt-1 break-words">
                          {srv.title}
                        </h3>
                        <p className="text-xs text-[#3B132A]/70 mt-1 leading-relaxed break-words">
                          {srv.desc}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-[#7B2869] pt-2 border-t border-[#3B132A]/10 tabular-nums break-words">
                        {srv.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* GALLERY SECTION 1: «تصاویر نمونه خود سایت» / "Salon Tasarımları" / "Official Salon Designs" */}
            <div className="border-t border-[#3B132A]/10 w-full max-w-full min-w-0">
              <SiteGallerySection
                lang={lang}
                designs={siteDesigns}
                onTryOnDesign={handleTryOnDesignFromGallery}
              />
            </div>

            {/* 3-STEP APPOINTMENT BOOKING WIZARD & DUAL IMAGE UPLOAD STUDIO */}
            <div className="border-t border-[#3B132A]/10 bg-[#FAF0E6] w-full max-w-full min-w-0">
              <BookingAndAiStudio
                lang={lang}
                currentUser={currentUser}
                siteDesigns={siteDesigns}
                selectedDesign={selectedDesign}
                onSelectDesign={setSelectedDesign}
                reservations={reservations}
                timeSlots={timeSlots}
                blockedSlots={blockedSlots}
                onReservationCreated={(newRes) =>
                  setReservations((prev) => [newRes, ...prev])
                }
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </div>

            {/* GALLERY SECTION 2: «نمونه تصاویر مشتریان» / "Müşteri Galerisi" / "Customer Showcase" */}
            <div className="border-t border-[#3B132A]/10 w-full max-w-full min-w-0">
              <CustomerGallerySection lang={lang} items={customerGallery} />
            </div>
          </>
        )}

        {activeRoute === 'my-reservations' && (
          <MyReservationsView
            lang={lang}
            currentUser={currentUser}
            reservations={reservations}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeRoute === 'admin' && (
          <AdminDashboard
            lang={lang}
            currentUser={currentUser}
            onAdminAuthenticated={handleUserAuthenticated}
            reservations={reservations}
            onUpdateReservationStatus={handleUpdateReservationStatus}
            onPublishToCustomerGallery={handlePublishToCustomerGallery}
            siteDesigns={siteDesigns}
            onAddSiteDesign={(d) => setSiteDesigns((prev) => [d, ...prev])}
            onUpdateSiteDesign={(updated) =>
              setSiteDesigns((prev) =>
                prev.map((d) => (d.id === updated.id ? updated : d))
              )
            }
            onDeleteSiteDesign={(id) =>
              setSiteDesigns((prev) => prev.filter((d) => d.id !== id))
            }
            customerGallery={customerGallery}
            onAddCustomerGalleryItem={(item) =>
              setCustomerGallery((prev) => [item, ...prev])
            }
            onDeleteCustomerGalleryItem={(id) =>
              setCustomerGallery((prev) => prev.filter((c) => c.id !== id))
            }
            timeSlots={timeSlots}
            blockedSlots={blockedSlots}
            onToggleBlockedSlot={handleToggleBlockedSlot}
          />
        )}
      </main>

      {/* Deep Aubergine Brand Footer */}
      <footer className="bg-[#3B132A] text-[#FFFDFB] py-12 mt-16 w-full max-w-full min-w-0 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-start min-w-0 max-w-full">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi Official Logo"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-[#FAF0E6] p-1.5 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="font-brand-serif text-xl font-bold text-[#FFFDFB] break-words">
                Tırnak Atölyesi
              </p>
              <p className="text-xs text-[#F7AD93] mt-0.5 break-words">{tr.brandSubtitle}</p>
              <p className="text-xs text-[#FFFDFB]/65 mt-1 break-words">
                https://tirnakatolyesi.ir • {tr.footerTagline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#FFFDFB]/80 min-w-0 max-w-full">
            <a
              href="#site-gallery"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'site-gallery');
              }}
              className="hover:text-[#E5A93B] transition-colors break-words"
            >
              {tr.navSiteGallery}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#booking-studio"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'booking-studio');
              }}
              className="hover:text-[#E5A93B] transition-colors break-words"
            >
              {tr.navBookingStudio}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#customer-gallery"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home', 'customer-gallery');
              }}
              className="hover:text-[#E5A93B] transition-colors break-words"
            >
              {tr.navCustomerGallery}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('admin');
              }}
              className="hover:text-[#E5A93B] transition-colors break-words"
            >
              {tr.navAdmin} (/admin)
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Tab Bar (Visible only on mobile viewports, strictly constrained) */}
      <nav
        aria-label={tr.navHome}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full bg-[#FFFDFB]/95 backdrop-blur-md border-t border-[#3B132A]/15 grid grid-cols-5 items-center h-14 px-1 overflow-hidden"
      >
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold cursor-pointer min-w-0 ${
            activeRoute === 'home' ? 'text-[#D42663]' : 'text-[#3B132A]/70'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="mt-0.5 truncate max-w-full px-0.5">{tr.navHome}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('home', 'site-gallery')}
          className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-[#3B132A]/70 cursor-pointer min-w-0"
        >
          <Images className="w-4 h-4 shrink-0" />
          <span className="mt-0.5 truncate max-w-full px-0.5">{tr.navSiteGallery}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('home', 'booking-studio')}
          className="flex flex-col items-center justify-center py-1 text-[10px] font-bold text-[#D42663] cursor-pointer min-w-0"
        >
          <Wand2 className="w-4 h-4 shrink-0" />
          <span className="mt-0.5 truncate max-w-full px-0.5">{tr.tryOnWithAiBtn}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('my-reservations')}
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold cursor-pointer min-w-0 ${
            activeRoute === 'my-reservations' ? 'text-[#D42663]' : 'text-[#3B132A]/70'
          }`}
        >
          <CalendarCheck className="w-4 h-4 shrink-0" />
          <span className="mt-0.5 truncate max-w-full px-0.5">{tr.navMyReservations}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('admin')}
          className={`flex flex-col items-center justify-center py-1 text-[10px] font-semibold cursor-pointer min-w-0 ${
            activeRoute === 'admin' ? 'text-[#D42663]' : 'text-[#3B132A]/70'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="mt-0.5 truncate max-w-full px-0.5">{tr.navAdmin}</span>
        </button>
      </nav>

      {/* Customer & Admin Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        onSuccess={handleUserAuthenticated}
      />
    </div>
  );
}
