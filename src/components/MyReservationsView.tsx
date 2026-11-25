import React, { useState } from 'react';
import { Calendar, Clock, Phone, Search, User } from 'lucide-react';
import { Language, ReservationItem, UserAccount } from '../types';
import { NAIL_SHAPE_LABELS, SERVICE_TYPE_LABELS, STATUS_LABELS, t } from '../i18n';
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
      className="py-12 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden text-start min-w-0"
      aria-labelledby="my-reservations-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 w-full max-w-full min-w-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#D42663] break-words">
            {tr.myReservationsBadge}
          </p>
          <h2
            id="my-reservations-heading"
            className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1 break-words"
          >
            {tr.myReservationsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#3B132A]/75 mt-1 break-words">
            {tr.myReservationsSubtitle}
          </p>
        </div>

        {/* Mobile Number Lookup or Logged-in Profile Card */}
        {currentUser ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 px-4 py-3 max-w-full min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D42663]/10 text-[#D42663] flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-[#3B132A] break-words">{currentUser.fullName}</p>
              <p className="font-mono text-[#3B132A]/70 break-words">{currentUser.mobile}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto max-w-full min-w-0">
            <div className="relative flex-1 sm:flex-initial min-w-0">
              <Phone className="w-4 h-4 text-[#3B132A]/50 absolute top-3 end-3 pointer-events-none" />
              <input
                type="tel"
                dir="ltr"
                value={lookupMobile}
                onChange={(e) => setLookupMobile(e.target.value)}
                placeholder="09123456789"
                aria-label={tr.searchByMobileLabel}
                className="w-full max-w-full min-w-0 rounded-xl bg-[#FFFDFB] border border-[#3B132A]/15 py-2 pe-9 ps-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="py-2 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors cursor-pointer break-words"
            >
              {tr.loginRegisterBtn}
            </button>
          </div>
        )}
      </div>

      {userReservations.length === 0 ? (
        <div className="w-full max-w-full min-w-0 rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 p-8 sm:p-10 text-center space-y-3">
          <Search className="w-8 h-8 text-[#D42663] mx-auto opacity-80" />
          <p className="text-base font-bold text-[#3B132A] break-words">{tr.noReservationsText}</p>
          <p className="text-xs text-[#3B132A]/70 font-mono">09123456789</p>
        </div>
      ) : (
        <div className="space-y-6 w-full max-w-full min-w-0">
          {userReservations.map((res) => {
            const statusInfo = STATUS_LABELS[res.status];
            return (
              <article
                key={res.id}
                className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-xs space-y-5 text-start"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3B132A]/10 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#3B132A]/70 min-w-0">
                      <span className="font-mono font-bold text-[#D42663] text-sm break-words">
                        {res.trackingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="break-words">{res.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono break-words">{res.customerMobile}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#3B132A] break-words">
                      {SERVICE_TYPE_LABELS[res.serviceType]?.[lang] || res.serviceType}
                    </h3>
                  </div>

                  {/* Status Tracker Indicator */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold break-words ${statusInfo.badgeClass}`}
                    >
                      {statusInfo[lang]}
                    </span>
                  </div>
                </div>

                {/* Date, Time & Design Details */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#3B132A]/85 min-w-0">
                  <div className="inline-flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-[#D42663] shrink-0" />
                    <span className="break-words">
                      <strong>{tr.dateSelectLabel}:</strong> {res.date}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-[#D42663] shrink-0" />
                    <span className="break-words">
                      <strong>{tr.summaryDateTimeLabel}</strong> {res.timeSlot}
                    </span>
                  </div>
                  {res.selectedDesignTitle && (
                    <div className="break-words min-w-0">
                      <strong>{tr.selectedSiteDesignLabel}</strong>{' '}
                      {res.selectedDesignCode} — {res.selectedDesignTitle} (
                      {NAIL_SHAPE_LABELS[res.nailShape]?.[lang] || res.nailShape})
                    </div>
                  )}
                </div>

                {res.notes && (
                  <p className="text-xs text-[#3B132A]/75 bg-[#FAF0E6] rounded-xl p-3 break-words">
                    <strong>{tr.notesLabel}:</strong> {res.notes}
                  </p>
                )}

                {/* Attached Images Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 w-full max-w-full min-w-0">
                  {res.handImage && (
                    <div className="w-full max-w-full min-w-0 rounded-2xl bg-[#FAF0E6] p-3 border border-[#3B132A]/10 space-y-2 overflow-hidden">
                      <p className="text-xs font-bold text-[#3B132A] break-words">
                        1. {tr.attachedHandLabel}
                      </p>
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFFDFB]">
                        <img
                          src={res.handImage}
                          alt={tr.attachedHandLabel}
                          className="w-full h-full aspect-square object-cover overflow-hidden"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {res.aiFinalImage && (
                    <div className="w-full max-w-full min-w-0 rounded-2xl bg-[#FAF0E6] p-3 border-2 border-[#D42663]/40 space-y-2 overflow-hidden">
                      <p className="text-xs font-bold text-[#D42663] break-words">
                        2. {tr.attachedAiFinalLabel}
                      </p>
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFFDFB]">
                        <img
                          src={res.aiFinalImage}
                          alt={tr.attachedAiFinalLabel}
                          className="w-full h-full aspect-square object-cover overflow-hidden"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {res.customerReferenceImage && (
                    <div className="w-full max-w-full min-w-0 rounded-2xl bg-[#FAF0E6] p-3 border border-[#7B2869]/30 space-y-2 overflow-hidden">
                      <p className="text-xs font-bold text-[#7B2869] break-words">
                        3. {tr.attachedCustomRefLabel}
                      </p>
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FFFDFB]">
                        <img
                          src={res.customerReferenceImage}
                          alt={tr.attachedCustomRefLabel}
                          className="w-full h-full aspect-square object-cover overflow-hidden"
                          referrerPolicy="no-referrer"
                        />
                      </div>
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
