import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
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
  ReservationItem,
  ReservationStatus,
  SiteDesignItem,
  TimeSlotConfig,
  UserAccount,
} from '../types';
import {
  CATEGORY_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  t,
} from '../i18n';
import {
  IMG_FRENCH_PEARL,
  UPCOMING_PERSIAN_DATES,
} from '../data';
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
  onDeleteSiteDesign,
  customerGallery,
  onAddCustomerGalleryItem,
  onDeleteCustomerGalleryItem,
  timeSlots,
  blockedSlots,
  onToggleBlockedSlot,
}) => {
  const tr = t(lang);
  const [activeTab, setActiveTab] = useState<'reservations' | 'galleries' | 'schedule'>(
    'reservations'
  );
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(
    null
  );

  // Admin Login Gate State (if not logged in as admin)
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // New Site Design Form State
  const [newDesignTitleFa, setNewDesignTitleFa] = useState('');
  const [newDesignCode, setNewDesignCode] = useState('');
  const [newDesignCategory, setNewDesignCategory] =
    useState<Exclude<NailCategory, 'all'>>('gelish');
  const [newDesignPrice, setNewDesignPrice] = useState('780000');
  const [newDesignImage, setNewDesignImage] = useState(IMG_FRENCH_PEARL);

  // New Customer Gallery Item Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustServiceLabel, setNewCustServiceLabel] = useState('');
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
        setLoginError(data.error || 'دسترسی محدود به مدیر سالن (admin / Admin@1234)');
        return;
      }
      onAdminAuthenticated(data.user);
    } catch {
      setLoginError('خطا در ارتباط با سرور');
    }
  };

  const handleAddSiteDesignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignTitleFa.trim()) return;
    const res = await fetch('/api/site-gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newDesignCode || `TA-${100 + siteDesigns.length + 1}`,
        titleFa: newDesignTitleFa,
        titleTr: newDesignTitleFa,
        category: newDesignCategory,
        priceToman: Number(newDesignPrice) || 750000,
        durationMin: 60,
        imageUrl: newDesignImage,
        primaryColorHex: '#D42663',
        defaultShape: 'almond',
      }),
    });
    const data = await res.json();
    if (res.ok && data.design) {
      onAddSiteDesign(data.design);
      setNewDesignTitleFa('');
      setNewDesignCode('');
    }
  };

  const handleAddCustomerItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const res = await fetch('/api/customer-gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerFirstName: newCustName,
        serviceLabelFa: newCustServiceLabel || 'طراحی و ژلیش ناخن VIP',
        dateFa: '۱۴۰۵/۰۹/۰۵',
        imageUrl: newCustImage,
      }),
    });
    const data = await res.json();
    if (res.ok && data.item) {
      onAddCustomerGalleryItem(data.item);
      setNewCustName('');
      setNewCustServiceLabel('');
    }
  };

  // If not logged in as admin, render clean role-based admin login card with pre-filled demo credentials
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <section className="py-16 px-4 max-w-md mx-auto">
        <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-7 shadow-lg space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#3B132A]/10">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi Logo"
              className="w-14 h-14 rounded-xl object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs font-bold text-[#D42663]">/admin • Role-Based Access</span>
              <h2 className="text-lg font-bold text-[#3B132A]">
                {lang === 'fa' ? 'ورود به پنل مدیریت آتلیه' : 'Salon Yönetim Paneli Girişi'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold text-[#3B132A] mb-1"
              >
                {lang === 'fa' ? 'نام کاربری مدیر' : 'Yönetici Kullanıcı Adı'}
              </label>
              <input
                id="admin-username"
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#3B132A] mb-1"
              >
                {lang === 'fa' ? 'رمز عبور' : 'Şifre'}
              </label>
              <input
                id="admin-password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A]"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2 text-xs text-[#D42663]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              data-testid="admin-login-submit-btn"
              className="w-full py-3 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-sm font-bold hover:bg-[#D42663] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{lang === 'fa' ? 'ورود به پنل مدیریت (/admin)' : 'Yönetim Paneline Gir'}</span>
            </button>
          </form>

          <div className="rounded-xl bg-[#FAF0E6] p-3 text-xs text-[#3B132A]/80 space-y-1">
            <p className="font-bold text-[#3B132A]">اطلاعات حساب دمو مدیریت (آماده ورود):</p>
            <p className="font-mono" dir="ltr">
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
      className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8"
      aria-labelledby="admin-dashboard-heading"
    >
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-[#3B132A] text-[#FFFDFB] p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-4">
          <img
            src="/assets/logo.png"
            alt="Tırnak Atölyesi Logo"
            className="w-14 h-14 rounded-2xl object-contain bg-[#FAF0E6] p-1.5 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#E5A93B] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>tirnakatolyesi.ir • Admin Management Console</span>
            </div>
            <h1 id="admin-dashboard-heading" className="text-xl sm:text-2xl font-bold mt-1">
              {tr.adminPanelTitle}
            </h1>
          </div>
        </div>

        {/* Navigation Tabs inside Admin */}
        <div className="flex flex-wrap items-center gap-2 bg-[#FFFDFB]/10 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-[#D42663] text-white'
                : 'text-[#FFFDFB]/80 hover:text-white'
            }`}
          >
            {tr.adminTabSchedule}
          </button>
        </div>
      </div>

      {/* TAB 1: RESERVATIONS QUEUE & ATTACHED IMAGES */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          {reservations.map((res) => {
            const statusInfo = STATUS_LABELS[res.status];
            return (
              <article
                key={res.id}
                data-testid={`admin-reservation-card-${res.trackingCode}`}
                className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-7 shadow-sm space-y-6"
              >
                {/* Top Row: Customer Info, Status Switcher, and 1-Click Publish to Customer Gallery */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#3B132A]/10">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#3B132A]/75">
                      <span className="font-mono font-bold text-[#D42663] text-sm">
                        {res.trackingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#3B132A] text-sm">{res.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono" dir="ltr">
                        {res.customerMobile}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#D42663]" />
                        {res.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#D42663]" />
                        {res.timeSlot}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#3B132A]">
                      {SERVICE_TYPE_LABELS[res.serviceType]?.[lang] || res.serviceType}{' '}
                      {res.selectedDesignCode && (
                        <span className="text-sm font-normal text-[#3B132A]/75">
                          ({res.selectedDesignCode} — {res.selectedDesignTitle} • فرم:{' '}
                          {res.nailShape})
                        </span>
                      )}
                    </h3>

                    {res.notes && (
                      <p className="text-xs text-[#3B132A]/80 bg-[#FAF0E6] px-3.5 py-2 rounded-xl">
                        <strong>یادداشت مشتری:</strong> {res.notes}
                      </p>
                    )}
                  </div>

                  {/* Status Switcher + 1-Click Publish Button */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <select
                      aria-label={`تغییر وضعیت رزرو ${res.trackingCode}`}
                      value={res.status}
                      onChange={(e) =>
                        onUpdateReservationStatus(res.id, e.target.value as ReservationStatus)
                      }
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer ${statusInfo.badgeClass}`}
                    >
                      <option value="pending">{STATUS_LABELS.pending[lang]}</option>
                      <option value="confirmed">{STATUS_LABELS.confirmed[lang]}</option>
                      <option value="completed">{STATUS_LABELS.completed[lang]}</option>
                    </select>

                    {res.publishedToCustomerGallery ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700/15 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{tr.publishedBadge}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPublishToCustomerGallery(res.id)}
                        data-testid={`publish-customer-gallery-btn-${res.trackingCode}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D42663] text-white text-xs font-bold hover:bg-[#B81D53] transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{tr.publishToCustomerGalleryBtn}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* High-Resolution Preview + Download Cards for All 3 Attached Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Image 1: عکس دست اولیه */}
                  <div className="rounded-2xl bg-[#FAF0E6] p-4 border border-[#3B132A]/12 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-[#3B132A]/65">
                        باکس آپلود ۱ (ورودی)
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A]">
                        عکس دست اولیه مشتری
                      </h4>
                    </div>
                    {res.handImage ? (
                      <>
                        <img
                          src={res.handImage}
                          alt="عکس دست اولیه"
                          className="w-full aspect-[4/3] object-cover rounded-xl border border-[#3B132A]/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.handImage!,
                                title: `عکس دست اولیه — ${res.customerName}`,
                              })
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>بزرگنمایی</span>
                          </button>
                          <a
                            href={res.handImage}
                            download={`hand-original-${res.trackingCode}.jpg`}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors inline-flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-[4/3] rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50">
                        تصویری ارسال نشده
                      </div>
                    )}
                  </div>

                  {/* Image 2: خروجی نهایی هوش مصنوعی (نمونه نهایی جهت اجرا) */}
                  <div className="rounded-2xl bg-[#FAF0E6] p-4 border-2 border-[#D42663]/45 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-[#D42663]">
                        نمونه نهایی جهت اجرا توسط ناخن‌کار
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A]">
                        خروجی نهایی هوش مصنوعی روی دست مشتری
                      </h4>
                    </div>
                    {res.aiFinalImage ? (
                      <>
                        <img
                          src={res.aiFinalImage}
                          alt="خروجی نهایی هوش مصنوعی"
                          className="w-full aspect-[4/3] object-cover rounded-xl border border-[#D42663]/30"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.aiFinalImage!,
                                title: `نمونه نهایی هوش مصنوعی جهت اجرا — ${res.customerName}`,
                              })
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>بزرگنمایی</span>
                          </button>
                          <a
                            href={res.aiFinalImage}
                            download={`ai-final-reference-${res.trackingCode}.jpg`}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#D42663] text-white text-xs font-semibold hover:bg-[#B81D53] transition-colors inline-flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{tr.downloadImageBtn}</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-[4/3] rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50">
                        تست هوش مصنوعی ثبت نشده
                      </div>
                    )}
                  </div>

                  {/* Image 3: عکس نمونه ارسالی مشتری (باکس ۲) */}
                  <div className="rounded-2xl bg-[#FAF0E6] p-4 border border-[#7B2869]/30 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-[#7B2869]">
                        باکس آپلود ۲ (طرح شخصی مستقل)
                      </span>
                      <h4 className="text-sm font-bold text-[#3B132A]">
                        عکس نمونه طرح دلخواه ارسالی مشتری
                      </h4>
                    </div>
                    {res.customerReferenceImage ? (
                      <>
                        <img
                          src={res.customerReferenceImage}
                          alt="عکس نمونه ارسالی مشتری"
                          className="w-full aspect-[4/3] object-cover rounded-xl border border-[#7B2869]/20"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: res.customerReferenceImage!,
                                title: `عکس نمونه شخصی ارسالی — ${res.customerName}`,
                              })
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>بزرگنمایی</span>
                          </button>
                          <a
                            href={res.customerReferenceImage}
                            download={`customer-reference-${res.trackingCode}.jpg`}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#7B2869] text-white text-xs font-semibold hover:bg-[#5E1E50] transition-colors inline-flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-[4/3] rounded-xl border border-dashed border-[#3B132A]/20 flex items-center justify-center text-xs text-[#3B132A]/50">
                        طرح شخصی جداگانه آپلود نشده
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 2: GALLERY MANAGER (Manage Site Designs & Customer Gallery) */}
      {activeTab === 'galleries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Site Designs Manager («تصاویر نمونه خود سایت») */}
          <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#3B132A] pb-3 border-b border-[#3B132A]/10">
              مدیریت «تصاویر نمونه خود سایت» ({siteDesigns.length})
            </h3>

            <form onSubmit={handleAddSiteDesignSubmit} className="space-y-3 bg-[#FAF0E6] p-4 rounded-2xl">
              <p className="text-xs font-bold text-[#D42663]">افزودن طرح جدید به گالری رسمی سایت</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newDesignTitleFa}
                  onChange={(e) => setNewDesignTitleFa(e.target.value)}
                  placeholder="عنوان طرح (مثلاً: ژلیش کروم صدفی)"
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newDesignCode}
                  onChange={(e) => setNewDesignCode(e.target.value)}
                  placeholder="کد طرح (مثلاً: TA-107)"
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newDesignCategory}
                  onChange={(e) =>
                    setNewDesignCategory(e.target.value as Exclude<NailCategory, 'all'>)
                  }
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                >
                  {(['gelish', 'minimal', 'french', 'manicure', 'pedicure', 'ombre'] as const).map(
                    (c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c][lang]}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="number"
                  value={newDesignPrice}
                  onChange={(e) => setNewDesignPrice(e.target.value)}
                  placeholder="قیمت به تومان"
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-[#3B132A] cursor-pointer underline">
                  <span>انتخاب فایل تصویر طرح</span>
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
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#3B132A] text-white text-xs font-bold hover:bg-[#D42663] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن به گالری سایت</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {siteDesigns.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF0E6]/70 border border-[#3B132A]/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={d.imageUrl}
                      alt={d.titleFa}
                      className="w-12 h-12 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#3B132A]">
                        {d.code} — {d.titleFa}
                      </p>
                      <p className="text-[11px] text-[#3B132A]/70">
                        {CATEGORY_LABELS[d.category][lang]} • {d.priceToman.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSiteDesign(d.id)}
                    aria-label={`حذف طرح ${d.code}`}
                    className="p-2 rounded-xl text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Showcase Gallery Manager («نمونه تصاویر مشتریان») */}
          <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#3B132A] pb-3 border-b border-[#3B132A]/10">
              مدیریت «نمونه تصاویر مشتریان» ({customerGallery.length})
            </h3>

            <form
              onSubmit={handleAddCustomerItemSubmit}
              className="space-y-3 bg-[#FAF0E6] p-4 rounded-2xl"
            >
              <p className="text-xs font-bold text-[#7B2869]">
                افزودن مستقیم تصویر به گالری مشتریان
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="نام کوچک مشتری (مثلاً: هانیه)"
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newCustServiceLabel}
                  onChange={(e) => setNewCustServiceLabel(e.target.value)}
                  placeholder="نوع خدمات (مثلاً: کاشت و فرنچ سرخابی)"
                  className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-[#3B132A] cursor-pointer underline">
                  <span>انتخاب عکس دست مشتری</span>
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
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#7B2869] text-white text-xs font-bold hover:bg-[#5E1E50] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>انتشار در گالری مشتریان</span>
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {customerGallery.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF0E6]/70 border border-[#3B132A]/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.imageUrl}
                      alt={c.customerFirstName}
                      className="w-12 h-12 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#3B132A]">
                        مشتری: {c.customerFirstName} ({c.dateFa})
                      </p>
                      <p className="text-[11px] text-[#3B132A]/70">{c.serviceLabelFa}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomerGalleryItem(c.id)}
                    aria-label={`حذف نمونه مشتری ${c.customerFirstName}`}
                    className="p-2 rounded-xl text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer"
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
        <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3B132A]/10">
            <div>
              <h3 className="text-lg font-bold text-[#3B132A]">
                مدیریت ساعات کاری و مسدودسازی نوبت‌ها
              </h3>
              <p className="text-xs text-[#3B132A]/75 mt-1">
                روی هر ساعت کلیک کنید تا برای تاریخ انتخابی باز یا مسدود (Block/Unblock) شود.
              </p>
            </div>

            <select
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              aria-label="انتخاب تاریخ مدیریت برنامه"
              className="rounded-xl bg-[#FAF0E6] border border-[#3B132A]/15 px-4 py-2.5 text-sm font-semibold text-[#3B132A]"
            >
              {UPCOMING_PERSIAN_DATES.map((d) => (
                <option key={d.value} value={d.value}>
                  {lang === 'fa' ? d.labelFa : d.labelTr}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
                  className={`p-4 rounded-2xl border text-center transition-colors space-y-1.5 cursor-pointer ${
                    isBooked
                      ? 'bg-[#D42663]/15 border-[#D42663] text-[#D42663]'
                      : isBlocked
                      ? 'bg-[#3B132A]/10 border-[#3B132A]/25 text-[#3B132A]/50'
                      : 'bg-[#FAF0E6] border-[#3B132A]/15 text-[#3B132A] hover:border-[#3B132A]'
                  }`}
                >
                  <p className="font-mono text-base font-bold">{slot.time}</p>
                  <p className="text-xs font-semibold">
                    {isBooked ? 'رزرو مشتری' : isBlocked ? 'مسدود شده' : 'باز / قابل رزرو'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* High-Resolution Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/85 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-3xl w-full rounded-3xl bg-[#FFFDFB] p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-bold text-[#3B132A]">
                {lightboxImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="بستن پیش‌نمایش تصویر"
                className="p-2 rounded-xl bg-[#FAF0E6] text-[#3B132A] hover:bg-[#D42663] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-[#FAF0E6]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </section>
  );
};
