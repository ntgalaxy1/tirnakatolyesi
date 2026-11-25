import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  Lock,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  BlockedSlotRecord,
  CustomerGalleryItem,
  Language,
  NailCategory,
  NailShape,
  ReservationItem,
  ReservationStatus,
  SiteDesignItem,
  TimeSlotConfig,
  UserAccount,
} from '../types';
import {
  CATEGORY_LABELS,
  getCustomerServiceLabel,
  getDesignTitle,
  NAIL_SHAPE_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  t,
} from '../i18n';
import {
  IMG_FRENCH_PEARL,
  UPCOMING_PERSIAN_DATES,
} from '../data';
import { formatToman } from '../utils/bookingLogic';
import { compressImageToDataUrl } from '../utils/imageUtils';

interface AdminDashboardProps {
  lang: Language;
  currentUser: UserAccount | null;
  onAdminAuthenticated: (user: UserAccount) => void;
  reservations: ReservationItem[];
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
  onPublishToCustomerGallery: (reservationId: string) => void;
  siteDesigns: SiteDesignItem[];
  onAddSiteDesign: (design: SiteDesignItem) => void;
  onUpdateSiteDesign?: (design: SiteDesignItem) => void;
  onDeleteSiteDesign: (id: string) => void;
  customerGallery: CustomerGalleryItem[];
  onAddCustomerGalleryItem: (item: CustomerGalleryItem) => void;
  onDeleteCustomerGalleryItem: (id: string) => void;
  timeSlots: TimeSlotConfig[];
  blockedSlots: BlockedSlotRecord[];
  onToggleBlockedSlot: (date: string, time: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  currentUser,
  onAdminAuthenticated,
  reservations,
  onUpdateReservationStatus,
  onPublishToCustomerGallery,
  siteDesigns,
  onAddSiteDesign,
  onUpdateSiteDesign,
  onDeleteSiteDesign,
  customerGallery,
  onAddCustomerGalleryItem,
  onDeleteCustomerGalleryItem,
  timeSlots,
  blockedSlots,
  onToggleBlockedSlot,
}) => {
  const tr = t(lang);
  const [activeTab, setActiveTab] = useState<
    'reservations' | 'galleries' | 'schedule' | 'releases'
  >('reservations');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(
    null
  );

  // Admin Login Gate State (if not logged in as admin)
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Trilingual Site Design Form State (Add & Edit)
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [newDesignTitleFa, setNewDesignTitleFa] = useState('');
  const [newDesignTitleTr, setNewDesignTitleTr] = useState('');
  const [newDesignTitleEn, setNewDesignTitleEn] = useState('');
  const [newDesignCode, setNewDesignCode] = useState('');
  const [newDesignCategory, setNewDesignCategory] =
    useState<Exclude<NailCategory, 'all'>>('gelish');
  const [newDesignShape, setNewDesignShape] = useState<NailShape>('almond');
  const [newDesignPrice, setNewDesignPrice] = useState('780000');
  const [newDesignImage, setNewDesignImage] = useState(IMG_FRENCH_PEARL);

  // New Customer Gallery Item Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustServiceLabelFa, setNewCustServiceLabelFa] = useState('');
  const [newCustServiceLabelTr, setNewCustServiceLabelTr] = useState('');
  const [newCustServiceLabelEn, setNewCustServiceLabelEn] = useState('');
  const [newCustImage, setNewCustImage] = useState(IMG_FRENCH_PEARL);

  // Schedule Date State
  const [scheduleDate, setScheduleDate] = useState(UPCOMING_PERSIAN_DATES[0].value);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.user?.role !== 'admin') {
        setLoginError(data.error || tr.authErrorInvalidAdmin);
        return;
      }
      onAdminAuthenticated(data.user);
    } catch {
      setLoginError(tr.validationErrorGeneric);
    }
  };

  const resetDesignForm = () => {
    setEditingDesignId(null);
    setNewDesignTitleFa('');
    setNewDesignTitleTr('');
    setNewDesignTitleEn('');
    setNewDesignCode('');
    setNewDesignCategory('gelish');
    setNewDesignShape('almond');
    setNewDesignPrice('780000');
    setNewDesignImage(IMG_FRENCH_PEARL);
  };

  const handleStartEditDesign = (d: SiteDesignItem) => {
    setEditingDesignId(d.id);
    setNewDesignTitleFa(d.title_fa || d.titleFa);
    setNewDesignTitleTr(d.title_tr || d.titleTr);
    setNewDesignTitleEn(d.title_en || d.titleEn);
    setNewDesignCode(d.code);
    setNewDesignCategory(d.category);
    setNewDesignShape(d.defaultShape);
    setNewDesignPrice(String(d.priceToman));
    setNewDesignImage(d.imageUrl);
  };

  const handleSaveSiteDesignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFa = newDesignTitleFa.trim() || newDesignTitleTr.trim() || newDesignTitleEn.trim();
    if (!cleanFa) return;

    const cleanTr = newDesignTitleTr.trim() || cleanFa;
    const cleanEn = newDesignTitleEn.trim() || cleanTr;

    if (editingDesignId) {
      const res = await fetch(`/api/site-gallery/${editingDesignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleFa: cleanFa,
          titleTr: cleanTr,
          titleEn: cleanEn,
          title_fa: cleanFa,
          title_tr: cleanTr,
          title_en: cleanEn,
          category: newDesignCategory,
          defaultShape: newDesignShape,
          priceToman: Number(newDesignPrice) || 750000,
          imageUrl: newDesignImage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.design && onUpdateSiteDesign) {
        onUpdateSiteDesign(data.design);
      }
      resetDesignForm();
      return;
    }

    const res = await fetch('/api/site-gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newDesignCode || `TA-${100 + siteDesigns.length + 1}`,
        titleFa: cleanFa,
        titleTr: cleanTr,
        titleEn: cleanEn,
        title_fa: cleanFa,
        title_tr: cleanTr,
        title_en: cleanEn,
        category: newDesignCategory,
        priceToman: Number(newDesignPrice) || 750000,
        durationMin: 60,
        imageUrl: newDesignImage,
        primaryColorHex: '#D42663',
        defaultShape: newDesignShape,
      }),
    });
    const data = await res.json();
    if (res.ok && data.design) {
      onAddSiteDesign(data.design);
      resetDesignForm();
    }
  };

  const handleAddCustomerItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const labelFa = newCustServiceLabelFa.trim() || 'طراحی و ژلیش ناخن VIP';
    const labelTr = newCustServiceLabelTr.trim() || labelFa;
    const labelEn = newCustServiceLabelEn.trim() || labelTr;

    const res = await fetch('/api/customer-gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerFirstName: newCustName,
        serviceLabelFa: labelFa,
        serviceLabelTr: labelTr,
        serviceLabelEn: labelEn,
        dateFa: '۱۴۰۵/۰۹/۰۵',
        imageUrl: newCustImage,
      }),
    });
    const data = await res.json();
    if (res.ok && data.item) {
      onAddCustomerGalleryItem(data.item);
      setNewCustName('');
      setNewCustServiceLabelFa('');
      setNewCustServiceLabelTr('');
      setNewCustServiceLabelEn('');
    }
  };

  // If not logged in as admin, render clean role-based admin login card with pre-filled demo credentials
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <section className="py-12 sm:py-16 px-4 w-full max-w-md mx-auto text-start overflow-hidden min-w-0">
        <div className="w-full max-w-full min-w-0 rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-lg space-y-5 overflow-hidden">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#3B132A]/10 min-w-0">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#D42663] break-words">
                /admin • Role-Based Access
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#3B132A] break-words">
                {tr.authModalAdminTitle}
              </h2>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 w-full max-w-full min-w-0">
            <div className="w-full max-w-full min-w-0">
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
              >
                {tr.authAdminUsernameLabel}
              </label>
              <input
                id="admin-username"
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A]"
              />
            </div>

            <div className="w-full max-w-full min-w-0">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
              >
                {tr.authPasswordLabel}
              </label>
              <input
                id="admin-password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A]"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2 text-xs text-[#D42663] break-words">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              data-testid="admin-login-submit-btn"
              className="w-full max-w-full min-w-0 py-3 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-sm font-bold hover:bg-[#D42663] transition-colors flex items-center justify-center gap-2 cursor-pointer break-words"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="break-words">{tr.authSubmitAdminBtn}</span>
            </button>
          </form>

          <div className="rounded-xl bg-[#FAF0E6] p-3 text-xs text-[#3B132A]/80 space-y-1 break-words">
            <p className="font-bold text-[#3B132A] break-words">{tr.authDemoAdminHint}</p>
            <p className="font-mono break-all" dir="ltr">
              Username: <strong>admin</strong> | Password: <strong>Admin@1234</strong>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="admin-panel"
      className="py-10 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden space-y-8 text-start min-w-0"
      aria-labelledby="admin-dashboard-heading"
    >
      {/* Admin Top Header */}
      <div className="w-full max-w-full min-w-0 overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl bg-[#3B132A] text-[#FFFDFB] p-5 sm:p-8 shadow-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src="/assets/logo.png"
            alt="Tırnak Atölyesi Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-[#FAF0E6] p-1.5 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#E5A93B] font-semibold min-w-0">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="break-words">{tr.adminPanelBadge}</span>
            </div>
            <h1 id="admin-dashboard-heading" className="text-lg sm:text-2xl font-bold mt-1 break-words">
              {tr.adminPanelTitle}
            </h1>
          </div>
        </div>

        {/* Navigation Tabs inside Admin — wraps cleanly on small screens */}
        <div className="flex flex-wrap items-center gap-2 bg-[#FFFDFB]/10 p-2 rounded-2xl w-full lg:w-auto max-w-full min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer break-words min-w-0 ${
              activeTab === 'reservations'
                ? 'bg-[#D42663] text-white'
                : 'text-[#FFFDFB]/80 hover:text-white'
            }`}
          >
            {tr.adminTabReservations} ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('galleries')}
            data-testid="admin-galleries-tab-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer break-words min-w-0 ${
              activeTab === 'galleries'
                ? 'bg-[#D42663] text-white'
                : 'text-[#FFFDFB]/80 hover:text-white'
            }`}
          >
            {tr.adminTabGalleries}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer break-words min-w-0 ${
              activeTab === 'schedule'
                ? 'bg-[#D42663] text-white'
                : 'text-[#FFFDFB]/80 hover:text-white'
            }`}
          >
            {tr.adminTabSchedule}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('releases')}
            data-testid="admin-releases-tab-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer break-words min-w-0 ${
              activeTab === 'releases'
                ? 'bg-[#E5A93B] text-[#3B132A]'
                : 'text-[#E5A93B] hover:text-white'
            }`}
          >
            {lang === 'fa'
              ? 'دانلود ریلیس (کافه‌بازار / گوگل‌پلی / cPanel)'
              : lang === 'tr'
              ? 'Release & APK/AAB İndir'
              : 'Releases (APK / AAB / cPanel)'}
          </button>
        </div>
      </div>

      {/* TAB 1: RESERVATIONS QUEUE & ATTACHED IMAGES */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 w-full max-w-full min-w-0">
          {reservations.map((res) => {
            const statusInfo = STATUS_LABELS[res.status];
            return (
              <article
                key={res.id}
                data-testid={`admin-reservation-card-${res.trackingCode}`}
                className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-xs space-y-6"
              >
                {/* Top Row: Customer Info, Status Switcher, and 1-Click Publish to Customer Gallery */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#3B132A]/10 min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#3B132A]/75 min-w-0">
                      <span className="font-mono font-bold text-[#D42663] text-sm break-words">
                        {res.trackingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#3B132A] text-sm break-words">
                        {res.customerName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono break-words" dir="ltr">
                        {res.customerMobile}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 break-words">
                        <Calendar className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                        <span>{res.date}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold break-words">
                        <Clock className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                        <span>{res.timeSlot}</span>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#3B132A] break-words">
                      {SERVICE_TYPE_LABELS[res.serviceType]?.[lang] || res.serviceType}{' '}
                      {res.selectedDesignCode && (
                        <span className="text-sm font-normal text-[#3B132A]/75 break-words">
                          ({res.selectedDesignCode} — {res.selectedDesignTitle} •{' '}
                          {NAIL_SHAPE_LABELS[res.nailShape]?.[lang] || res.nailShape})
                        </span>
                      )}
                    </h3>

                    {res.notes && (
                      <p className="text-xs text-[#3B132A]/80 bg-[#FAF0E6] px-3.5 py-2 rounded-xl break-words">
                        <strong>{tr.notesLabel}:</strong> {res.notes}
                      </p>
                    )}
                  </div>

                  {/* Status Switcher + 1-Click Publish Button */}
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full">
                    <select
                      aria-label={`${tr.adminChangeStatusLabel} ${res.trackingCode}`}
                      value={res.status}
                      onChange={(e) =>
                        onUpdateReservationStatus(res.id, e.target.value as ReservationStatus)
                      }
                      className={`max-w-full min-w-0 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${statusInfo.badgeClass}`}
                    >
                      <option value="pending">{STATUS_LABELS.pending[lang]}</option>
                      <option value="confirmed">{STATUS_LABELS.confirmed[lang]}</option>
                      <option value="completed">{STATUS_LABELS.completed[lang]}</option>
                    </select>

                    {res.publishedToCustomerGallery ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700/15 text-emerald-800 text-xs font-bold break-words">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="break-words">{tr.publishedBadge}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPublishToCustomerGallery(res.id)}
                        data-testid={`publish-customer-gallery-btn-${res.trackingCode}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#D42663] text-white text-xs font-bold hover:bg-[#B81D53] transition-colors cursor-pointer break-words max-w-full min-w-0"
                      >
                        <Share2 className="w-4 h-4 shrink-0" />
                        <span className="break-words">{tr.publishToCustomerGalleryBtn}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* High-Resolution Preview + Download Cards for All 3 Attached Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-full min-w-0">
                  {/* Image 1: Hand Photo */}
                  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] p-4 border border-[#3B132A]/12 flex flex-col justify-between space-y-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#3B132A]/65 break-words">
                        {tr.uploadBox1Badge}
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A] break-words">
                        {tr.attachedHandLabel}
                      </h4>
                    </div>
                    {res.handImage ? (
                      <>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-[#3B132A]/10 bg-[#FFFDFB]">
                          <img
                            src={res.handImage}
                            alt={tr.attachedHandLabel}
                            className="w-full h-full aspect-square object-cover overflow-hidden"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full max-w-full min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.handImage!,
                                title: `${tr.attachedHandLabel} — ${res.customerName}`,
                              })
                            }
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer break-words"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Zoom</span>
                          </button>
                          <a
                            href={res.handImage}
                            download={`hand-original-${res.trackingCode}.jpg`}
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors inline-flex items-center justify-center gap-1.5 break-words"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{tr.downloadImageBtn}</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50 p-4 text-center break-words">
                        {tr.adminNoImageUploaded}
                      </div>
                    )}
                  </div>

                  {/* Image 2: Final AI Try-On Output */}
                  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] p-4 border-2 border-[#D42663]/45 flex flex-col justify-between space-y-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-[#D42663] break-words">
                        {tr.afterLabel}
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A] break-words">
                        {tr.attachedAiFinalLabel}
                      </h4>
                    </div>
                    {res.aiFinalImage ? (
                      <>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-[#D42663]/30 bg-[#FFFDFB]">
                          <img
                            src={res.aiFinalImage}
                            alt={tr.attachedAiFinalLabel}
                            className="w-full h-full aspect-square object-cover overflow-hidden"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full max-w-full min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.aiFinalImage!,
                                title: `${tr.attachedAiFinalLabel} — ${res.customerName}`,
                              })
                            }
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer break-words"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Zoom</span>
                          </button>
                          <a
                            href={res.aiFinalImage}
                            download={`ai-final-reference-${res.trackingCode}.jpg`}
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#D42663] text-white text-xs font-semibold hover:bg-[#B81D53] transition-colors inline-flex items-center justify-center gap-1.5 break-words"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{tr.downloadImageBtn}</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50 p-4 text-center break-words">
                        {tr.adminNoImageUploaded}
                      </div>
                    )}
                  </div>

                  {/* Image 3: Custom Client Reference Photo (Box 2) */}
                  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] p-4 border border-[#7B2869]/30 flex flex-col justify-between space-y-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#7B2869] break-words">
                        {tr.uploadBox2Badge}
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A] break-words">
                        {tr.attachedCustomRefLabel}
                      </h4>
                    </div>
                    {res.customerReferenceImage ? (
                      <>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-[#7B2869]/20 bg-[#FFFDFB]">
                          <img
                            src={res.customerReferenceImage}
                            alt={tr.attachedCustomRefLabel}
                            className="w-full h-full aspect-square object-cover overflow-hidden"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full max-w-full min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.customerReferenceImage!,
                                title: `${tr.attachedCustomRefLabel} — ${res.customerName}`,
                              })
                            }
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer break-words"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Zoom</span>
                          </button>
                          <a
                            href={res.customerReferenceImage}
                            download={`customer-reference-${res.trackingCode}.jpg`}
                            className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#7B2869] text-white text-xs font-semibold hover:bg-[#5E1E50] transition-colors inline-flex items-center justify-center gap-1.5 break-words"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{tr.downloadImageBtn}</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50 p-4 text-center break-words">
                        {tr.adminNoImageUploaded}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 2: TRILINGUAL GALLERY MANAGER (Manage Site Designs in FA/TR/EN & Customer Showcase) */}
      {activeTab === 'galleries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-full min-w-0">
          {/* Site Designs Manager («تصاویر نمونه خود سایت» / Salon Tasarımları / Official Salon Designs) */}
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-6 space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-[#3B132A] pb-3 border-b border-[#3B132A]/10 break-words">
              {tr.siteGallerySectionTitle} ({siteDesigns.length})
            </h3>

            <form
              onSubmit={handleSaveSiteDesignSubmit}
              className="space-y-3 bg-[#FAF0E6] p-4 rounded-2xl w-full max-w-full min-w-0"
              data-testid="admin-trilingual-design-form"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                <p className="text-xs font-bold text-[#D42663] break-words min-w-0">
                  {editingDesignId ? tr.adminEditSiteDesignTitle : tr.adminAddSiteDesignTitle}
                </p>
                {editingDesignId && (
                  <button
                    type="button"
                    onClick={resetDesignForm}
                    className="text-xs font-semibold text-[#3B132A]/70 hover:text-[#D42663] cursor-pointer break-words"
                  >
                    {tr.adminCancelEditBtn}
                  </button>
                )}
              </div>

              {/* Trilingual Title Inputs: Persian (FA), Turkish (TR), English (EN) */}
              <div className="space-y-2.5 w-full max-w-full min-w-0">
                <div className="w-full max-w-full min-w-0">
                  <label className="block text-[11px] font-semibold text-[#3B132A] mb-1 break-words">
                    {tr.adminDesignTitleFaLabel}
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={newDesignTitleFa}
                    onChange={(e) => setNewDesignTitleFa(e.target.value)}
                    placeholder={tr.adminDesignTitleFaPlaceholder}
                    className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                  />
                </div>

                <div className="w-full max-w-full min-w-0">
                  <label className="block text-[11px] font-semibold text-[#3B132A] mb-1 break-words">
                    {tr.adminDesignTitleTrLabel}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newDesignTitleTr}
                    onChange={(e) => setNewDesignTitleTr(e.target.value)}
                    placeholder={tr.adminDesignTitleTrPlaceholder}
                    className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                  />
                </div>

                <div className="w-full max-w-full min-w-0">
                  <label className="block text-[11px] font-semibold text-[#3B132A] mb-1 break-words">
                    {tr.adminDesignTitleEnLabel}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newDesignTitleEn}
                    onChange={(e) => setNewDesignTitleEn(e.target.value)}
                    placeholder={tr.adminDesignTitleEnPlaceholder}
                    className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-full min-w-0">
                <input
                  type="text"
                  dir="ltr"
                  value={newDesignCode}
                  onChange={(e) => setNewDesignCode(e.target.value)}
                  placeholder="Code (TA-107)"
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs font-mono"
                />
                <select
                  value={newDesignCategory}
                  onChange={(e) =>
                    setNewDesignCategory(e.target.value as Exclude<NailCategory, 'all'>)
                  }
                  aria-label={tr.adminDesignCategoryLabel}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                >
                  {(['gelish', 'minimal', 'french', 'manicure', 'pedicure', 'ombre'] as const).map(
                    (c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c][lang]}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={newDesignShape}
                  onChange={(e) => setNewDesignShape(e.target.value as NailShape)}
                  aria-label={tr.adminDesignShapeLabel}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                >
                  {(['almond', 'coffin', 'square', 'round'] as NailShape[]).map((s) => (
                    <option key={s} value={s}>
                      {NAIL_SHAPE_LABELS[s][lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1 w-full max-w-full min-w-0">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <input
                    type="number"
                    dir="ltr"
                    value={newDesignPrice}
                    onChange={(e) => setNewDesignPrice(e.target.value)}
                    placeholder={tr.adminDesignPriceTomanLabel}
                    className="w-full sm:w-32 max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs font-mono"
                  />
                  <label className="text-xs text-[#3B132A] cursor-pointer underline break-words">
                    <span>{tr.adminUploadDesignPhotoBtn}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = await compressImageToDataUrl(f, 900, 0.85);
                          setNewDesignImage(url);
                        }
                      }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto max-w-full min-w-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#3B132A] text-white text-xs font-bold hover:bg-[#D42663] transition-colors cursor-pointer break-words"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="break-words">
                    {editingDesignId ? tr.adminUpdateDesignBtn : tr.adminSaveDesignBtn}
                  </span>
                </button>
              </div>
            </form>

            {/* Stacked Mobile Cards for Site Designs */}
            <div className="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden pe-1 w-full max-w-full min-w-0">
              {siteDesigns.map((d) => (
                <div
                  key={d.id}
                  className="w-full max-w-full min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF0E6]/70 border border-[#3B132A]/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={d.imageUrl}
                      alt={getDesignTitle(d, lang)}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-[#3B132A] break-words">
                        {d.code} — {getDesignTitle(d, lang)}
                      </p>
                      <p className="text-[10px] text-[#3B132A]/65 break-words">
                        FA: {d.titleFa} | TR: {d.titleTr} | EN: {d.titleEn}
                      </p>
                      <p className="text-[11px] text-[#D42663] font-semibold break-words">
                        {CATEGORY_LABELS[d.category][lang]} • {formatToman(d.priceToman, lang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditDesign(d)}
                      aria-label={`${tr.adminEditBtn} ${d.code}`}
                      className="p-2 rounded-xl text-[#3B132A] hover:bg-[#3B132A]/10 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSiteDesign(d.id)}
                      aria-label={`${tr.adminDeleteBtn} ${d.code}`}
                      className="p-2 rounded-xl text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Showcase Gallery Manager («نمونه تصاویر مشتریان» / Müşteri Galerisi / Customer Showcase) */}
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-6 space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-[#3B132A] pb-3 border-b border-[#3B132A]/10 break-words">
              {tr.adminCustomerGalleryManageTitle} ({customerGallery.length})
            </h3>

            <form
              onSubmit={handleAddCustomerItemSubmit}
              className="space-y-3 bg-[#FAF0E6] p-4 rounded-2xl w-full max-w-full min-w-0"
            >
              <p className="text-xs font-bold text-[#7B2869] break-words">
                {tr.publishToCustomerGalleryBtn}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-full min-w-0">
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={tr.fullNameLabel}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newCustServiceLabelFa}
                  onChange={(e) => setNewCustServiceLabelFa(e.target.value)}
                  placeholder="Service (FA): کاشت و فرنچ"
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={newCustServiceLabelTr}
                  onChange={(e) => setNewCustServiceLabelTr(e.target.value)}
                  placeholder="Service (TR): İnci French"
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={newCustServiceLabelEn}
                  onChange={(e) => setNewCustServiceLabelEn(e.target.value)}
                  placeholder="Service (EN): Pearl French"
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
                <label className="text-xs text-[#3B132A] cursor-pointer underline break-words">
                  <span>{tr.adminUploadDesignPhotoBtn}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await compressImageToDataUrl(f, 900, 0.85);
                        setNewCustImage(url);
                      }
                    }}
                  />
                </label>
                <button
                  type="submit"
                  className="w-full sm:w-auto max-w-full min-w-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#7B2869] text-white text-xs font-bold hover:bg-[#5E1E50] transition-colors cursor-pointer break-words"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="break-words">{tr.publishToCustomerGalleryBtn}</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden pe-1 w-full max-w-full min-w-0">
              {customerGallery.map((c) => (
                <div
                  key={c.id}
                  className="w-full max-w-full min-w-0 flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF0E6]/70 border border-[#3B132A]/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.imageUrl}
                      alt={c.customerFirstName}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3B132A] break-words">
                        {tr.customerCardPrefix} {c.customerFirstName} ({c.dateFa})
                      </p>
                      <p className="text-[11px] text-[#3B132A]/70 break-words">
                        {getCustomerServiceLabel(c, lang)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomerGalleryItem(c.id)}
                    aria-label={`${tr.adminDeleteBtn} ${c.customerFirstName}`}
                    className="p-2 rounded-xl text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE & TIME SLOT MANAGER */}
      {activeTab === 'schedule' && (
        <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3B132A]/10 min-w-0">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#3B132A] break-words">
                {tr.adminScheduleManageTitle}
              </h3>
              <p className="text-xs text-[#3B132A]/75 mt-1 break-words">
                {tr.adminSelectDateToManageLabel}
              </p>
            </div>

            <select
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              aria-label={tr.adminSelectDateToManageLabel}
              className="w-full sm:w-auto max-w-full min-w-0 rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-3.5 py-2.5 text-sm font-semibold text-[#3B132A]"
            >
              {UPCOMING_PERSIAN_DATES.map((d) => (
                <option key={d.value} value={d.value}>
                  {lang === 'fa' ? d.labelFa : lang === 'tr' ? d.labelTr : d.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 w-full max-w-full min-w-0">
            {timeSlots.map((slot) => {
              const isBlocked = blockedSlots.some(
                (b) => b.date === scheduleDate && b.time === slot.time
              );
              const isBooked = reservations.some(
                (r) => r.date === scheduleDate && r.timeSlot === slot.time
              );

              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => onToggleBlockedSlot(scheduleDate, slot.time)}
                  className={`w-full max-w-full min-w-0 p-3.5 sm:p-4 rounded-2xl border text-center transition-colors space-y-1.5 cursor-pointer ${
                    isBooked
                      ? 'bg-[#D42663]/15 border-[#D42663] text-[#D42663]'
                      : isBlocked
                      ? 'bg-[#3B132A]/10 border-[#3B132A]/25 text-[#3B132A]/50'
                      : 'bg-[#FAF0E6] border-[#3B132A]/15 text-[#3B132A] hover:border-[#3B132A]'
                  }`}
                >
                  <p className="font-mono text-base font-bold">{slot.time}</p>
                  <p className="text-xs font-semibold break-words">
                    {isBooked
                      ? tr.slotBookedLabel
                      : isBlocked
                      ? tr.adminSlotBlockedStatus
                      : tr.adminSlotOpenStatus}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RELEASE PACKAGES & STORE SUBMISSION CENTER (Cafe Bazaar, Google Play, cPanel) */}
      {activeTab === 'releases' && (
        <div
          data-testid="admin-releases-panel"
          className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-8 space-y-8"
        >
          <div className="border-b border-[#3B132A]/10 pb-5 min-w-0">
            <span className="text-xs font-bold text-[#D42663] break-words">
              Production Release Center • tirnakatolyesi.ir & ir.tirnakatolyesi.app
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#3B132A] mt-1 break-words">
              {lang === 'fa'
                ? 'مرکز دانلود فایل‌های ریلیس نهایی (کافه‌بازار، گوگل‌پلی و هاست cPanel)'
                : lang === 'tr'
                ? 'Nihai Sürüm & Mağaza Yükleme Paketleri (Cafe Bazaar, Google Play, cPanel)'
                : 'Production Release Packages (Cafe Bazaar APK, Google Play AAB & cPanel)'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-full min-w-0">
            {/* Package 1: cPanel public_html Release ZIP */}
            <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] border border-[#3B132A]/15 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2 min-w-0">
                <span className="text-xs font-mono font-bold text-[#D42663] break-words">
                  01. cPanel Web & PHP/MySQL Release
                </span>
                <h4 className="text-base font-bold text-[#3B132A] break-words">
                  cPanel (`public_html`) Full Deployment ZIP
                </h4>
                <p className="text-xs text-[#3B132A]/75 leading-relaxed break-words">
                  Includes compiled frontend (`dist/`), PHP 8.2 backend (`api.php`), MySQL schema (`schema.sql`), PWA manifest, and `.htaccess`.
                </p>
              </div>
              <a
                href="/releases/tirnakatolyesi-cpanel-public_html-release.zip"
                download="tirnakatolyesi-cpanel-public_html-release.zip"
                className="w-full max-w-full min-w-0 py-3 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-bold hover:bg-[#D42663] transition-colors flex items-center justify-center gap-2 break-words"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="break-words">cPanel Release (.zip)</span>
              </a>
            </div>

            {/* Package 2: Android Project & Capacitor Bundle (Cafe Bazaar & Google Play) */}
            <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] border-2 border-[#D42663]/40 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2 min-w-0">
                <span className="text-xs font-mono font-bold text-[#D42663] break-words">
                  02. Android Native & Capacitor Release
                </span>
                <h4 className="text-base font-bold text-[#3B132A] break-words">
                  Cafe Bazaar (`.apk`) & Google Play (`.aab`) Project
                </h4>
                <p className="text-xs text-[#3B132A]/75 leading-relaxed break-words">
                  Complete Android Studio & Capacitor project (`ir.tirnakatolyesi.app`) with official launcher icons, signing config, and GitHub Actions APK/AAB builder.
                </p>
              </div>
              <a
                href="/releases/tirnakatolyesi-android-studio-project.zip"
                download="tirnakatolyesi-android-studio-project.zip"
                className="w-full max-w-full min-w-0 py-3 px-4 rounded-xl bg-[#D42663] text-white text-xs font-bold hover:bg-[#B81D53] transition-colors flex items-center justify-center gap-2 break-words"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="break-words">Android Studio Project (.zip)</span>
              </a>
            </div>

            {/* Package 3: Store Listing Assets & Icon 512x512 */}
            <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-[#FAF0E6] border border-[#3B132A]/15 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2 min-w-0">
                <span className="text-xs font-mono font-bold text-[#7B2869] break-words">
                  03. Store Icons & Submission Copy
                </span>
                <h4 className="text-base font-bold text-[#3B132A] break-words">
                  512×512 Icon & Store Submission Guide
                </h4>
                <p className="text-xs text-[#3B132A]/75 leading-relaxed break-words">
                  High-resolution 512×512 brand launcher icon and ready-to-paste Cafe Bazaar & Google Play store descriptions.
                </p>
              </div>
              <div className="space-y-2 w-full max-w-full min-w-0">
                <a
                  href="/pwa-512x512.png"
                  download="tirnak-atolyesi-icon-512x512.png"
                  className="w-full max-w-full min-w-0 py-2.5 px-4 rounded-xl bg-[#7B2869] text-white text-xs font-bold hover:bg-[#5E1E50] transition-colors flex items-center justify-center gap-2 break-words"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="break-words">512×512 Store Icon (.png)</span>
                </a>
                <a
                  href="/releases/STORE_SUBMISSION_INFO.md"
                  download="STORE_SUBMISSION_INFO.md"
                  className="w-full max-w-full min-w-0 py-2 px-4 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/20 text-[#3B132A] text-xs font-semibold hover:border-[#D42663] transition-colors flex items-center justify-center gap-2 break-words"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="break-all">STORE_SUBMISSION_INFO.md</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constrained High-Res Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/80 backdrop-blur-xs p-4 overflow-x-hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[calc(100vw-2rem)] max-w-lg mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-[#FFFDFB] p-4 sm:p-5 space-y-4 shadow-2xl min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h4 className="text-sm font-bold text-[#3B132A] break-words min-w-0">
                {lightboxImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Close preview"
                className="p-2 rounded-xl bg-[#FAF0E6] text-[#3B132A] hover:bg-[#D42663] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-w-full max-h-[70vh] object-contain rounded-2xl bg-[#FAF0E6]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </section>
  );
};
