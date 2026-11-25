import React, { useState } from 'react';
import { Calendar, Clock, Phone, Search, User } from 'lucide-react';
import { Language, ReservationItem, UserAccount } from '../types';
import { SERVICE_TYPE_LABELS, STATUS_LABELS, t } from '../i18n';
import { normalizeIranMobile } from '../utils/bookingLogic';

interface MyReservationsViewProps {
  lang: Language;
  currentUser: UserAccount | null;
  reservations: ReservationItem[];
  onOpenAuthModal: () => void;
}

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  lang,
  currentUser,
  reservations,
  onOpenAuthModal,
}) => {
  const tr = t(lang);
  const [lookupMobile, setLookupMobile] = useState(currentUser?.mobile || '09123456789');

  const activeMobile = normalizeIranMobile(currentUser?.mobile || lookupMobile);

  const userReservations = reservations.filter(
    (r) =>
      normalizeIranMobile(r.customerMobile) === activeMobile ||
      (currentUser && r.userId === currentUser.id)
  );

  return (
    <section
      id="my-reservations"
      className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      aria-labelledby="my-reservations-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs font-semibold text-[#D42663]">
            Tırnak Atölyesi • Customer Profile & Reservation Tracker
          </p>
          <h2
            id="my-reservations-heading"
            className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1"
          >
            {tr.myReservationsTitle}
          </h2>
        </div>

        {/* Mobile Number Lookup or Logged-in Profile Card */}
        {currentUser ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-[#D42663]/10 text-[#D42663] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-[#3B132A]">{currentUser.fullName}</p>
              <p className="font-mono text-[#3B132A]/70">{currentUser.mobile}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Phone className="w-4 h-4 text-[#3B132A]/50 absolute top-3 right-3 pointer-events-none" />
              <input
                type="tel"
                dir="ltr"
                value={lookupMobile}
                onChange={(e) => setLookupMobile(e.target.value)}
                placeholder="09123456789"
                aria-label="جستجوی رزرو با شماره موبایل"
                className="rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 py-2 pr-9 pl-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="py-2 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors cursor-pointer"
            >
              {tr.loginRegisterBtn}
            </button>
          </div>
        )}
      </div>

      {userReservations.length === 0 ? (
        <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 p-10 text-center space-y-3">
          <Search className="w-8 h-8 text-[#D42663] mx-auto opacity-80" />
          <p className="text-base font-bold text-[#3B132A]">{tr.noReservationsText}</p>
          <p className="text-xs text-[#3B132A]/70">
            {lang === 'fa'
              ? 'می‌توانید با شماره موبایل دمو 09123456789 سوابق رزرو نمونه را مشاهده کنید.'
              : 'Demo kayıtları görmek için 09123456789 numarasını girebilirsiniz.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {userReservations.map((res) => {
            const statusInfo = STATUS_LABELS[res.status];
            return (
              <article
                key={res.id}
                className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-7 shadow-sm space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3B132A]/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#3B132A]/70">
                      <span className="font-mono font-bold text-[#D42663] text-sm">
                        {res.trackingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{res.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{res.customerMobile}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#3B132A]">
                      {SERVICE_TYPE_LABELS[res.serviceType]?.[lang] || res.serviceType}
                    </h3>
                  </div>

                  {/* Status Tracker Indicator (در انتظار تایید / تایید شده / انجام شده) */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold ${statusInfo.badgeClass}`}
                    >
                      {statusInfo[lang]}
                    </span>
                  </div>
                </div>

                {/* Date, Time & Design Details */}
                <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#3B132A]/85">
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D42663]" />
                    <span>
                      <strong>{lang === 'fa' ? 'تاریخ مراجعه:' : 'Tarih:'}</strong> {res.date}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D42663]" />
                    <span>
                      <strong>{lang === 'fa' ? 'ساعت:' : 'Saat:'}</strong> {res.timeSlot}
                    </span>
                  </div>
                  {res.selectedDesignTitle && (
                    <div>
                      <strong>{lang === 'fa' ? 'طرح انتخابی سایت:' : 'Seçilen Tasarım:'}</strong>{' '}
                      {res.selectedDesignCode} — {res.selectedDesignTitle}
                    </div>
                  )}
                </div>

                {res.notes && (
                  <p className="text-xs text-[#3B132A]/75 bg-[#FAF0E6] rounded-xl p-3">
                    <strong>{lang === 'fa' ? 'یادداشت مشتری:' : 'Müşteri Notu:'}</strong> {res.notes}
                  </p>
                )}

                {/* Attached Images Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {res.handImage && (
                    <div className="rounded-2xl bg-[#FAF0E6] p-3 border border-[#3B132A]/10 space-y-2">
                      <p className="text-xs font-bold text-[#3B132A]">
                        {lang === 'fa' ? '۱. عکس دست اولیه' : '1. Orijinal El Fotoğrafı'}
                      </p>
                      <img
                        src={res.handImage}
                        alt="عکس دست اولیه"
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {res.aiFinalImage && (
                    <div className="rounded-2xl bg-[#FAF0E6] p-3 border-2 border-[#D42663]/40 space-y-2">
                      <p className="text-xs font-bold text-[#D42663]">
                        {lang === 'fa'
                          ? '۲. خروجی نهایی هوش مصنوعی (نمونه نهایی جهت اجرا)'
                          : '2. AI Nihai Tasarım'}
                      </p>
                      <img
                        src={res.aiFinalImage}
                        alt="خروجی نهایی هوش مصنوعی"
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {res.customerReferenceImage && (
                    <div className="rounded-2xl bg-[#FAF0E6] p-3 border border-[#7B2869]/30 space-y-2">
                      <p className="text-xs font-bold text-[#7B2869]">
                        {lang === 'fa'
                          ? '۳. عکس طرح دلخواه ارسالی مشتری'
                          : '3. Müşteri Özel Referans Görseli'}
                      </p>
                      <img
                        src={res.customerReferenceImage}
                        alt="عکس طرح دلخواه مشتری"
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
