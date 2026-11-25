import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  Move,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  ZoomIn,
} from 'lucide-react';
import {
  BlockedSlotRecord,
  Language,
  NailShape,
  ReservationItem,
  ServiceType,
  SiteDesignItem,
  TimeSlotConfig,
  UserAccount,
} from '../types';
import {
  getDesignTitle,
  NAIL_SHAPE_LABELS,
  SERVICE_TYPE_LABELS,
  t,
} from '../i18n';
import {
  BRAND_SWATCHES,
  IMG_DEMO_BARE_HAND,
  UPCOMING_PERSIAN_DATES,
} from '../data';
import {
  formatToman,
  getSlotAvailability,
} from '../utils/bookingLogic';
import {
  compressImageToDataUrl,
  renderRealisticNailTryOnCanvas,
  validateImageFile,
} from '../utils/imageUtils';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface BookingAndAiStudioProps {
  lang: Language;
  currentUser: UserAccount | null;
  siteDesigns: SiteDesignItem[];
  selectedDesign: SiteDesignItem;
  onSelectDesign: (design: SiteDesignItem) => void;
  reservations: ReservationItem[];
  timeSlots: TimeSlotConfig[];
  blockedSlots: BlockedSlotRecord[];
  onReservationCreated: (newReservation: ReservationItem) => void;
  onOpenAuthModal: () => void;
}

export const BookingAndAiStudio: React.FC<BookingAndAiStudioProps> = ({
  lang,
  currentUser,
  siteDesigns,
  selectedDesign,
  onSelectDesign,
  reservations,
  timeSlots,
  blockedSlots,
  onReservationCreated,
}) => {
  const tr = t(lang);

  // 3-Step Booking Wizard Active Step Indicator (1, 2, or 3)
  const [activeWizardStep, setActiveWizardStep] = useState<1 | 2 | 3>(1);

  // Booking Form State
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerMobile, setCustomerMobile] = useState(currentUser?.mobile || '');
  const [serviceType, setServiceType] = useState<ServiceType>('vip_design');
  const [selectedDate, setSelectedDate] = useState(UPCOMING_PERSIAN_DATES[0].value);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00');
  const [notes, setNotes] = useState('');

  // Upload Box 1 State: Hand Photo & Interactive HTML5 Canvas Nail Try-On Studio
  const [handImage, setHandImage] = useState<string>(IMG_DEMO_BARE_HAND);
  const [nailShape, setNailShape] = useState<NailShape>(selectedDesign.defaultShape || 'almond');
  const [nailColorHex, setNailColorHex] = useState<string>(
    selectedDesign.primaryColorHex || '#D42663'
  );
  // Interactive HTML5 Canvas Adjustment Sliders (Drag/Offset, Resize/Scale, Rotate)
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [nailScale, setNailScale] = useState<number>(1.0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  // Free-tier Gemini 2.5 Flash Hand Analysis & Recommendation State (Trilingual)
  const [aiAdvisorNotes, setAiAdvisorNotes] = useState<{
    fa: string;
    tr: string;
    en: string;
  } | null>(null);
  const [isAnalyzingHand, setIsAnalyzingHand] = useState<boolean>(false);

  const [aiFinalImage, setAiFinalImage] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [box1Error, setBox1Error] = useState<string | null>(null);

  // Upload Box 2 State: Independent Customer Reference Design Photo
  const [customerReferenceImage, setCustomerReferenceImage] = useState<string | null>(null);
  const [box2Error, setBox2Error] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationItem | null>(null);

  const handInputRef = useRef<HTMLInputElement>(null);
  const customRefInputRef = useRef<HTMLInputElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  const goToStep = (step: 1 | 2 | 3) => {
    setActiveWizardStep(step);
    const target =
      step === 1 ? step1Ref.current : step === 2 ? step2Ref.current : step3Ref.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Sync user name/mobile when currentUser logs in
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.fullName);
      if (!customerMobile) setCustomerMobile(currentUser.mobile);
    }
  }, [currentUser, customerName, customerMobile]);

  // Sync nail shape & color when user clicks "تست روی دست من" / "Elimde Dene" / "Try on My Hand" on a gallery card
  useEffect(() => {
    setNailShape(selectedDesign.defaultShape);
    setNailColorHex(selectedDesign.primaryColorHex);
  }, [selectedDesign]);

  // Draw the responsive HTML5 Canvas preview inside the constrained container whenever handImage or try-on composite changes
  useEffect(() => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const srcToDraw = aiFinalImage || handImage;
    if (!srcToDraw) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Constrain internal canvas buffer to max 960px width while preserving aspect ratio
      const maxBufferW = 960;
      const ratio = Math.min(1, maxBufferW / Math.max(img.width || 960, 1));
      const w = Math.round((img.width || 960) * ratio);
      const h = Math.round((img.height || 720) * ratio);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      }
    };
    img.src = srcToDraw;
  }, [handImage, aiFinalImage]);

  // Re-render HTML5 Canvas Composite automatically whenever user adjusts Drag/Resize/Rotate sliders while AI preview is active
  useEffect(() => {
    if (!aiFinalImage || !handImage) return;
    let cancelled = false;
    renderRealisticNailTryOnCanvas({
      handImageSrc: handImage,
      primaryColorHex: nailColorHex,
      secondaryColorHex: selectedDesign.secondaryColorHex,
      nailShape,
      designCode: selectedDesign.code,
      designTitle: getDesignTitle(selectedDesign, lang),
      designImageUrl: selectedDesign.imageUrl,
      offsetX,
      offsetY,
      scale: nailScale,
      rotationDeg,
    })
      .then((composite) => {
        if (!cancelled) setAiFinalImage(composite);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    offsetX,
    offsetY,
    nailScale,
    rotationDeg,
    nailShape,
    nailColorHex,
    selectedDesign,
    handImage,
    lang,
  ]);

  const slotStatuses = getSlotAvailability(
    selectedDate,
    timeSlots,
    reservations,
    blockedSlots
  );

  const getLocalizedError = (validation: {
    errorFa?: string;
    errorTr?: string;
    errorEn?: string;
  }) => {
    if (lang === 'tr') return validation.errorTr || 'Görsel hatası';
    if (lang === 'en') return validation.errorEn || 'Invalid image file';
    return validation.errorFa || 'خطا در فایل تصویر';
  };

  // Handle Upload Box 1 File Selection (Customer Hand Photo)
  const handleHandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBox1Error(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBox1Error(getLocalizedError(validation));
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file, 1080, 0.86);
      setHandImage(compressed);
      setAiFinalImage(null);
      setActiveWizardStep(2);
    } catch {
      setBox1Error(tr.validationErrorGeneric);
    }
  };

  // Free-Tier Gemini 2.5 Flash Hand Photo Analyzer & Shape/Color Recommender
  const handleAnalyzeHandWithGemini = async () => {
    if (!handImage) return;
    setIsAnalyzingHand(true);
    try {
      const res = await fetch('/api/ai/analyze-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handImageBase64: handImage,
          designTitle: getDesignTitle(selectedDesign, lang),
        }),
      });
      const data = await res.json();
      if (data.recommendedShape) {
        setNailShape(data.recommendedShape as NailShape);
      }
      if (data.recommendedColorHex) {
        setNailColorHex(data.recommendedColorHex);
      }
      setAiAdvisorNotes({
        fa:
          data.analysisFa ||
          'بر اساس فرم انگشتان و تناژ پوست، فرم بادامی (Almond) با تم سرخابی (#D42663) پیشنهاد می‌شود.',
        tr:
          data.analysisTr ||
          'El yapınıza göre Badem (Almond) formu ve Ahududu Macenta (#D42663) önerilir.',
        en:
          data.analysisEn ||
          'Based on your hand proportions, the Almond shape with Raspberry Magenta (#D42663) is recommended.',
      });
    } catch {
      setAiAdvisorNotes({
        fa: 'بر اساس فرم انگشتان و تناژ پوست، فرم بادامی (Almond) با تم سرخابی (#D42663) پیشنهاد می‌شود.',
        tr: 'El yapınıza göre Badem (Almond) formu ve Ahududu Macenta (#D42663) önerilir.',
        en: 'Based on your hand proportions, the Almond shape with Raspberry Magenta (#D42663) is recommended.',
      });
    } finally {
      setIsAnalyzingHand(false);
    }
  };

  // Run Virtual Nail Try-On (100% Free-Tier Compatible HTML5 Canvas Studio + Gemini Advisor)
  const handleRunAiTryOn = async () => {
    if (!handImage) {
      setBox1Error(tr.validationErrorGeneric);
      return;
    }

    setBox1Error(null);
    setIsAiProcessing(true);
    setActiveWizardStep(2);

    try {
      const compositeUrl = await renderRealisticNailTryOnCanvas({
        handImageSrc: handImage,
        primaryColorHex: nailColorHex,
        secondaryColorHex: selectedDesign.secondaryColorHex,
        nailShape,
        designCode: selectedDesign.code,
        designTitle: getDesignTitle(selectedDesign, lang),
        designImageUrl: selectedDesign.imageUrl,
        offsetX,
        offsetY,
        scale: nailScale,
        rotationDeg,
      });
      setAiFinalImage(compositeUrl);

      if (!aiAdvisorNotes) {
        handleAnalyzeHandWithGemini();
      }
    } catch {
      setBox1Error(tr.validationErrorGeneric);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handle Upload Box 2 File Selection (Customer Personal Reference Design Photo)
  const handleCustomRefFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBox2Error(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBox2Error(getLocalizedError(validation));
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file, 1080, 0.86);
      setCustomerReferenceImage(compressed);
      setActiveWizardStep(2);
    } catch {
      setBox2Error(tr.validationErrorGeneric);
    }
  };

  // Handle Final Booking Confirmation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setConfirmedReservation(null);
    setActiveWizardStep(3);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError(tr.validationErrorName);
      return;
    }

    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      setSubmitError(tr.validationErrorMobile);
      return;
    }

    setSubmitting(true);

    try {
      let finalAiOutput = aiFinalImage;
      if (!finalAiOutput && handImage) {
        finalAiOutput = await renderRealisticNailTryOnCanvas({
          handImageSrc: handImage,
          primaryColorHex: nailColorHex,
          secondaryColorHex: selectedDesign.secondaryColorHex,
          nailShape,
          designCode: selectedDesign.code,
          designTitle: getDesignTitle(selectedDesign, lang),
          designImageUrl: selectedDesign.imageUrl,
          offsetX,
          offsetY,
          scale: nailScale,
          rotationDeg,
        });
        setAiFinalImage(finalAiOutput);
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest',
          customerName,
          customerMobile,
          serviceType,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          notes,
          selectedDesignId: selectedDesign.id,
          selectedDesignCode: selectedDesign.code,
          selectedDesignTitle: getDesignTitle(selectedDesign, lang),
          nailShape,
          nailColorHex,
          handImage,
          aiFinalImage: finalAiOutput,
          customerReferenceImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errorKey === 'slot_already_booked') {
          setSubmitError(tr.validationErrorSlotBooked);
        } else if (data.errorKey === 'slot_blocked') {
          setSubmitError(tr.validationErrorSlotBlocked);
        } else {
          setSubmitError(data.error || tr.validationErrorGeneric);
        }
        setSubmitting(false);
        return;
      }

      setConfirmedReservation(data.reservation);
      onReservationCreated(data.reservation);
    } catch {
      setSubmitError(tr.validationErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const getSwatchName = (swatch: (typeof BRAND_SWATCHES)[number]) => {
    if (lang === 'tr') return swatch.nameTr;
    if (lang === 'en') return swatch.nameEn;
    return swatch.nameFa;
  };

  const getDateLabel = (d: (typeof UPCOMING_PERSIAN_DATES)[number]) => {
    if (lang === 'tr') return d.labelTr;
    if (lang === 'en') return d.labelEn;
    return d.labelFa;
  };

  return (
    <section
      id="booking-studio"
      className="py-12 sm:py-14 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden text-start min-w-0"
      aria-labelledby="booking-studio-heading"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-8 min-w-0">
        <p className="text-xs font-semibold text-[#D42663] tracking-wide break-words">
          {tr.bookingStudioBadge}
        </p>
        <h2
          id="booking-studio-heading"
          className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5 break-words"
        >
          {tr.bookingStudioTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed break-words">
          {tr.bookingStudioSubtitle}
        </p>
      </div>

      {/* 3-Step Booking Wizard Progress Indicator Bar */}
      <div
        className="mb-8 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/12 p-3 sm:p-4 shadow-xs w-full max-w-full min-w-0 overflow-hidden"
        data-testid="booking-wizard-steps"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-full min-w-0">
          {[
            { step: 1 as const, label: tr.wizardStep1Label },
            { step: 2 as const, label: tr.wizardStep2Label },
            { step: 3 as const, label: tr.wizardStep3Label },
          ].map((item) => {
            const isActive = activeWizardStep === item.step;
            const isCompleted = activeWizardStep > item.step || Boolean(confirmedReservation);
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => goToStep(item.step)}
                className={`w-full max-w-full min-w-0 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-start ${
                  isActive
                    ? 'bg-[#3B132A] text-[#FFFDFB] shadow-xs'
                    : isCompleted
                    ? 'bg-[#D42663]/12 text-[#D42663] border border-[#D42663]/30'
                    : 'bg-[#FAF0E6]/70 text-[#3B132A]/75 hover:text-[#3B132A]'
                }`}
              >
                <span className="break-words min-w-0">{item.label}</span>
                <span className="font-mono text-[11px] shrink-0">0{item.step}/03</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmed Reservation Receipt Banner */}
      {confirmedReservation && (
        <div
          data-testid="booking-confirmation-card"
          className="mb-10 w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border-2 border-[#D42663] p-5 sm:p-8 shadow-lg text-start"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-0">
            <div className="space-y-2 min-w-0">
              <div className="inline-flex items-center gap-2 text-[#D42663] font-bold text-base min-w-0">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="break-words">{tr.bookingSuccessTitle}</span>
              </div>
              <p className="text-sm text-[#3B132A]/80 leading-relaxed break-words">
                {tr.bookingSuccessDesc}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#3B132A] min-w-0">
                <span className="break-words">
                  <strong>{tr.trackingCodeLabel}</strong>{' '}
                  <code className="font-mono font-bold text-[#D42663] text-sm">
                    {confirmedReservation.trackingCode}
                  </code>
                </span>
                <span aria-hidden="true">·</span>
                <span className="break-words">
                  <strong>{tr.fullNameLabel}:</strong> {confirmedReservation.customerName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="break-words">
                  <strong>{tr.summaryDateTimeLabel}</strong> {confirmedReservation.date} —{' '}
                  {confirmedReservation.timeSlot}
                </span>
              </div>
            </div>

            {confirmedReservation.aiFinalImage && (
              <div className="flex items-center gap-3 bg-[#FAF0E6] p-3 rounded-2xl border border-[#3B132A]/10 max-w-full min-w-0">
                <img
                  src={confirmedReservation.aiFinalImage}
                  alt={tr.afterLabel}
                  className="w-16 h-16 sm:w-20 sm:h-16 rounded-xl object-cover border border-[#3B132A]/15 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs min-w-0">
                  <p className="font-bold text-[#3B132A] break-words">{tr.afterLabel}</p>
                  <p className="text-[#3B132A]/70 mt-0.5 break-words">
                    {confirmedReservation.selectedDesignCode} •{' '}
                    {NAIL_SHAPE_LABELS[confirmedReservation.nailShape]?.[lang] ||
                      confirmedReservation.nailShape}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleConfirmBooking} className="space-y-10 w-full max-w-full min-w-0">
        {/* Dual Upload Modules Grid: Box 1 (Hand AI Try-On) & Box 2 (Independent Personal Reference Photo) + Appointment Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-full min-w-0">
          {/* UPLOAD BOX 1: AI Virtual Nail Try-On Studio (7 columns on desktop) */}
          <div
            ref={step2Ref}
            data-testid="upload-box-1-ai-hand"
            className="lg:col-span-7 w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#3B132A]/10 min-w-0">
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#D42663] break-words">
                  {tr.uploadBox1Badge}
                </span>
                <h3 className="text-base sm:text-xl font-bold text-[#3B132A] mt-1 break-words">
                  {tr.uploadBox1Title}
                </h3>
                <p className="text-xs sm:text-sm text-[#3B132A]/75 mt-1 leading-relaxed break-words">
                  {tr.uploadBox1Subtitle}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D42663]/10 text-[#D42663] flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
            </div>

            {/* Hand Photo Upload, Demo Hand & Free-Tier Gemini 2.5 Flash Advisor Button */}
            <div className="flex flex-wrap items-center gap-2.5 w-full max-w-full min-w-0">
              <input
                ref={handInputRef}
                id="hand-image-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleHandFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => handInputRef.current?.click()}
                className="w-full sm:w-auto max-w-full min-w-0 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors cursor-pointer break-words"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span className="break-words">{tr.uploadHandBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHandImage(IMG_DEMO_BARE_HAND);
                  setAiFinalImage(null);
                  setBox1Error(null);
                  setOffsetX(0);
                  setOffsetY(0);
                  setNailScale(1.0);
                  setRotationDeg(0);
                }}
                className="w-full sm:w-auto max-w-full min-w-0 inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#FAF0E6] text-[#3B132A] text-xs font-medium hover:bg-[#F7AD93]/35 transition-colors cursor-pointer break-words"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span className="break-words">{tr.useDemoHandBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleAnalyzeHandWithGemini}
                disabled={isAnalyzingHand}
                className="w-full sm:w-auto max-w-full min-w-0 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#7B2869]/10 text-[#7B2869] border border-[#7B2869]/25 text-xs font-semibold hover:bg-[#7B2869] hover:text-white transition-colors cursor-pointer break-words"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="break-words">{tr.aiStylistTipTitle}</span>
              </button>
            </div>

            {aiAdvisorNotes && (
              <div className="w-full max-w-full min-w-0 rounded-2xl bg-[#FAF0E6] border border-[#E5A93B]/45 p-3.5 text-xs text-[#3B132A] leading-relaxed break-words">
                <strong className="text-[#D42663]">{tr.aiStylistTipTitle} </strong>
                <span>{aiAdvisorNotes[lang]}</span>
              </div>
            )}

            {box1Error && (
              <div className="w-full max-w-full min-w-0 rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-4 py-2.5 text-xs font-medium text-[#D42663] break-words">
                {box1Error}
              </div>
            )}

            {/* Selected Site Design Selector Strip */}
            <div className="space-y-2.5 w-full max-w-full min-w-0">
              <label className="block text-xs font-bold text-[#3B132A] break-words">
                {tr.selectedSiteDesignLabel}{' '}
                <span className="text-[#D42663]">
                  ({selectedDesign.code} — {getDesignTitle(selectedDesign, lang)})
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 w-full max-w-full min-w-0">
                {siteDesigns.map((d) => {
                  const isSelected = d.id === selectedDesign.id;
                  const dTitle = getDesignTitle(d, lang);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectDesign(d)}
                      aria-label={`${d.code} - ${dTitle}`}
                      className={`group relative w-full max-w-full min-w-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#D42663] ring-2 ring-[#D42663]/30'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="w-full aspect-square overflow-hidden bg-[#FAF0E6]">
                        <img
                          src={d.imageUrl}
                          alt={dTitle}
                          className="w-full h-full aspect-square object-cover overflow-hidden"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="bg-[#3B132A]/85 text-[#FFFDFB] text-[10px] font-mono text-center py-0.5 truncate px-1">
                        {d.code}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nail Shape & Brand Color Customizers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 w-full max-w-full min-w-0">
              {/* Nail Shape Selector: بادامی/Badem/Almond, تابوتی/Balerin/Coffin, مربعی/Kare/Square, گرد/Oval/Round */}
              <div className="w-full max-w-full min-w-0">
                <label className="block text-xs font-bold text-[#3B132A] mb-2 break-words">
                  {tr.nailShapeLabel}
                </label>
                <div className="grid grid-cols-2 gap-2 w-full max-w-full min-w-0">
                  {(['almond', 'coffin', 'square', 'round'] as NailShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setNailShape(shape)}
                      className={`w-full max-w-full min-w-0 py-2 px-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer break-words ${
                        nailShape === shape
                          ? 'bg-[#3B132A] text-[#FFFDFB] border-[#3B132A]'
                          : 'bg-[#FAF0E6]/70 text-[#3B132A] border-[#3B132A]/15 hover:border-[#3B132A]/40'
                      }`}
                    >
                      {NAIL_SHAPE_LABELS[shape][lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Color Swatch Selector */}
              <div className="w-full max-w-full min-w-0">
                <label className="block text-xs font-bold text-[#3B132A] mb-2 break-words">
                  {tr.nailColorLabel}
                </label>
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  {BRAND_SWATCHES.map((swatch) => {
                    const active = nailColorHex.toLowerCase() === swatch.hex.toLowerCase();
                    const swatchLabel = getSwatchName(swatch);
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => setNailColorHex(swatch.hex)}
                        title={swatchLabel}
                        aria-label={swatchLabel}
                        className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                          active
                            ? 'border-[#3B132A] scale-110 ring-2 ring-[#D42663]/40'
                            : 'border-white shadow-xs hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive HTML5 Canvas Fine-Tuning Controls: Drag / Move, Resize / Scale, Rotate */}
            <div className="w-full max-w-full min-w-0 rounded-2xl bg-[#FAF0E6]/80 border border-[#3B132A]/12 p-4 space-y-3 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold text-[#3B132A] break-words min-w-0">
                  {tr.canvasAdjustTitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                    setNailScale(1.0);
                    setRotationDeg(0);
                  }}
                  className="text-[11px] font-semibold text-[#D42663] hover:underline cursor-pointer shrink-0"
                >
                  {tr.canvasResetBtn}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs w-full max-w-full min-w-0">
                <div className="w-full max-w-full min-w-0">
                  <label
                    htmlFor="canvas-offset-x"
                    className="flex items-center justify-between gap-1 text-[#3B132A]/80 mb-1 min-w-0"
                  >
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <Move className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                      <span className="break-words">{tr.canvasOffsetXLabel}</span>
                    </span>
                    <span className="font-mono shrink-0">{offsetX}%</span>
                  </label>
                  <input
                    id="canvas-offset-x"
                    type="range"
                    min={-40}
                    max={40}
                    value={offsetX}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOffsetX(val);
                      setOffsetY(Math.round(val * 0.5));
                    }}
                    className="w-full max-w-full min-w-0 accent-[#D42663] cursor-pointer"
                  />
                </div>

                <div className="w-full max-w-full min-w-0">
                  <label
                    htmlFor="canvas-scale"
                    className="flex items-center justify-between gap-1 text-[#3B132A]/80 mb-1 min-w-0"
                  >
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <ZoomIn className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                      <span className="break-words">{tr.canvasScaleLabel}</span>
                    </span>
                    <span className="font-mono shrink-0">{Math.round(nailScale * 100)}%</span>
                  </label>
                  <input
                    id="canvas-scale"
                    type="range"
                    min={75}
                    max={135}
                    value={Math.round(nailScale * 100)}
                    onChange={(e) => setNailScale(Number(e.target.value) / 100)}
                    className="w-full max-w-full min-w-0 accent-[#D42663] cursor-pointer"
                  />
                </div>

                <div className="w-full max-w-full min-w-0">
                  <label
                    htmlFor="canvas-rotate"
                    className="flex items-center justify-between gap-1 text-[#3B132A]/80 mb-1 min-w-0"
                  >
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <RotateCw className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                      <span className="break-words">{tr.canvasRotationLabel}</span>
                    </span>
                    <span className="font-mono shrink-0">{rotationDeg}°</span>
                  </label>
                  <input
                    id="canvas-rotate"
                    type="range"
                    min={-25}
                    max={25}
                    value={rotationDeg}
                    onChange={(e) => setRotationDeg(Number(e.target.value))}
                    className="w-full max-w-full min-w-0 accent-[#D42663] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Button: Apply Nail Art on My Hand */}
            <button
              type="button"
              onClick={handleRunAiTryOn}
              disabled={isAiProcessing}
              data-testid="run-ai-tryon-btn"
              className="w-full max-w-full min-w-0 py-3.5 px-4 sm:px-5 rounded-2xl bg-[#D42663] text-white text-sm font-bold hover:bg-[#B81D53] transition-colors flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-60 break-words"
            >
              <Wand2 className={`w-5 h-5 shrink-0 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span className="break-words">
                {isAiProcessing ? tr.runningAiText : tr.runAiTryOnBtn}
              </span>
            </button>

            {/* Constrained HTML5 Canvas Container & Interactive Before / After Comparison Slider */}
            <div className="pt-2 w-full max-w-full min-w-0 space-y-3">
              {/* Constrained Responsive HTML5 Canvas Wrapper (never renders at raw pixel dimensions) */}
              <div
                data-testid="nail-tryon-canvas-wrapper"
                className={`w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-[#3B132A]/15 bg-[#FAF0E6] relative ${
                  aiFinalImage ? 'hidden' : 'block'
                }`}
              >
                <canvas
                  ref={liveCanvasRef}
                  data-testid="nail-tryon-live-canvas"
                  className="w-full max-w-full h-auto block aspect-[4/3] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3B132A]/85 via-[#3B132A]/45 to-transparent p-3.5 sm:p-4 text-[#FFFDFB] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium break-words">{tr.beforeLabel}</span>
                  <span className="text-xs text-[#F7AD93] break-words">{tr.runAiTryOnBtn}</span>
                </div>
              </div>

              {aiFinalImage && (
                <div className="w-full max-w-full min-w-0 space-y-3 overflow-hidden">
                  <BeforeAfterSlider
                    beforeImage={handImage}
                    afterImage={aiFinalImage}
                    beforeLabel={tr.beforeLabel}
                    afterLabel={tr.afterLabel}
                    hintText={tr.sliderHint}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FAF0E6] px-3.5 py-2.5 text-xs text-[#3B132A] min-w-0">
                    <span className="font-semibold text-[#D42663] break-words min-w-0">
                      ✓ {tr.aiSuccessReadyBadge}
                    </span>
                    <span className="font-mono text-[11px] text-[#3B132A]/70 shrink-0">
                      {selectedDesign.code}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: UPLOAD BOX 2 + STEP 1 & STEP 3 BOOKING WIZARD MODULES (5 columns on desktop) */}
          <div className="lg:col-span-5 w-full max-w-full min-w-0 space-y-8">
            {/* UPLOAD BOX 2: Independent Customer Personal Reference Photo */}
            <div
              data-testid="upload-box-2-custom-ref"
              className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-xs space-y-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#3B132A]/10 min-w-0">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#7B2869] break-words">
                    {tr.uploadBox2Badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#3B132A] mt-1 break-words">
                    {tr.uploadBox2Title}
                  </h3>
                  <p className="text-xs text-[#3B132A]/75 mt-1 leading-relaxed break-words">
                    {tr.uploadBox2Subtitle}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#7B2869]/10 text-[#7B2869] flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
              </div>

              <input
                ref={customRefInputRef}
                id="customer-reference-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCustomRefFileChange}
                className="hidden"
              />

              {customerReferenceImage ? (
                <div className="space-y-3 w-full max-w-full min-w-0">
                  <div className="relative w-full max-w-full aspect-square rounded-2xl overflow-hidden border border-[#7B2869]/30 bg-[#FAF0E6]">
                    <img
                      src={customerReferenceImage}
                      alt={tr.uploadBox2Title}
                      className="w-full h-full aspect-square object-cover overflow-hidden"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 w-full max-w-full min-w-0">
                    <button
                      type="button"
                      onClick={() => customRefInputRef.current?.click()}
                      className="py-2 px-3.5 rounded-xl bg-[#FAF0E6] text-[#3B132A] text-xs font-semibold hover:bg-[#F7AD93]/30 transition-colors cursor-pointer break-words"
                    >
                      {tr.replaceImageBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerReferenceImage(null)}
                      className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer break-words"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{tr.removeImageBtn}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => customRefInputRef.current?.click()}
                  className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border-2 border-dashed border-[#7B2869]/35 bg-[#FAF0E6]/60 hover:bg-[#FAF0E6] p-5 sm:p-6 text-center transition-colors flex flex-col items-center justify-center gap-2.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-[#7B2869]/10 text-[#7B2869] flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#3B132A] break-words">
                    {tr.uploadCustomRefBtn}
                  </span>
                  <span className="text-[11px] text-[#3B132A]/65 break-words">
                    {tr.uploadCustomRefHelper}
                  </span>
                </button>
              )}

              {box2Error && (
                <div className="w-full max-w-full min-w-0 rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2 text-xs font-medium text-[#D42663] break-words">
                  {box2Error}
                </div>
              )}
            </div>

            {/* STEP 1 & STEP 3 APPOINTMENT DETAILS & FINAL CONFIRMATION MODULE */}
            <div
              ref={step1Ref}
              className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#3B132A]/10 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#3B132A] break-words min-w-0">
                  {tr.step1Title}
                </h3>
                <span className="text-xs font-mono font-bold text-[#D42663] shrink-0">
                  0{activeWizardStep}/03
                </span>
              </div>

              {/* Service Selector */}
              <div className="w-full max-w-full min-w-0">
                <label
                  htmlFor="booking-service"
                  className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
                >
                  {tr.serviceSelectLabel}
                </label>
                <select
                  id="booking-service"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                >
                  {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((key) => {
                    const item = SERVICE_TYPE_LABELS[key];
                    return (
                      <option key={key} value={key}>
                        {item[lang]} — {formatToman(item.priceToman, lang)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date Selector */}
              <div className="w-full max-w-full min-w-0">
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                    <span className="break-words">{tr.dateSelectLabel}</span>
                  </span>
                </label>
                <select
                  id="booking-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                >
                  {UPCOMING_PERSIAN_DATES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {getDateLabel(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selector with Double-Booking Prevention */}
              <div className="w-full max-w-full min-w-0">
                <label className="block text-xs font-semibold text-[#3B132A] mb-2 break-words">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
                    <span className="break-words">{tr.timeSlotSelectLabel}</span>
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-full min-w-0">
                  {slotStatuses.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.time && slot.available;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`w-full max-w-full min-w-0 py-2 px-2 rounded-xl text-xs font-mono font-semibold border transition-colors flex flex-col items-center justify-center ${
                          !slot.available
                            ? 'bg-[#FAF0E6]/40 text-[#3B132A]/35 border-[#3B132A]/10 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#3B132A] text-[#FFFDFB] border-[#3B132A] shadow-xs cursor-pointer'
                            : 'bg-[#FAF0E6]/80 text-[#3B132A] border-[#3B132A]/15 hover:border-[#D42663] cursor-pointer'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span className="text-[10px] font-sans font-normal opacity-80 break-words">
                          {slot.reason === 'booked'
                            ? tr.slotBookedLabel
                            : slot.reason === 'blocked'
                            ? tr.slotBlockedLabel
                            : tr.slotAvailableLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3 Customer Details Section */}
              <div ref={step3Ref} className="pt-3 border-t border-[#3B132A]/10 space-y-3.5 w-full max-w-full min-w-0">
                <h4 className="text-sm font-bold text-[#3B132A] break-words">{tr.step3Title}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-full min-w-0">
                  <div className="w-full max-w-full min-w-0">
                    <label
                      htmlFor="booking-fullname"
                      className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
                    >
                      {tr.fullNameLabel}
                    </label>
                    <input
                      id="booking-fullname"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={tr.fullNamePlaceholder}
                      className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                    />
                  </div>

                  <div className="w-full max-w-full min-w-0">
                    <label
                      htmlFor="booking-mobile"
                      className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
                    >
                      {tr.mobileLabel}
                    </label>
                    <input
                      id="booking-mobile"
                      type="tel"
                      required
                      dir="ltr"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder={tr.mobilePlaceholder}
                      className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="w-full max-w-full min-w-0">
                  <label
                    htmlFor="booking-notes"
                    className="block text-xs font-semibold text-[#3B132A] mb-1 break-words"
                  >
                    {tr.notesLabel}
                  </label>
                  <textarea
                    id="booking-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={tr.notesPlaceholder}
                    className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                  />
                </div>
              </div>

              {/* Wizard Step Navigation Buttons with logical RTL directional arrow flipping (rtl:rotate-180) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 w-full max-w-full min-w-0">
                <button
                  type="button"
                  disabled={activeWizardStep === 1}
                  onClick={() => goToStep(activeWizardStep === 3 ? 2 : 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF0E6] text-xs font-semibold text-[#3B132A] hover:bg-[#F7AD93]/30 disabled:opacity-40 cursor-pointer break-words min-w-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
                  <span className="break-words">{tr.wizardPrevStepBtn}</span>
                </button>

                <button
                  type="button"
                  disabled={activeWizardStep === 3}
                  onClick={() => goToStep(activeWizardStep === 1 ? 2 : 3)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF0E6] text-xs font-semibold text-[#D42663] hover:bg-[#F7AD93]/30 disabled:opacity-40 cursor-pointer break-words min-w-0"
                >
                  <span className="break-words">{tr.wizardNextStepBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
                </button>
              </div>

              {submitError && (
                <div className="w-full max-w-full min-w-0 rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2.5 text-xs font-medium text-[#D42663] break-words">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                data-testid="confirm-reservation-btn"
                className="w-full max-w-full min-w-0 py-3.5 px-4 sm:px-5 rounded-2xl bg-[#3B132A] text-[#FFFDFB] text-sm font-bold hover:bg-[#521B3B] transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 break-words"
              >
                <CheckCircle2 className="w-5 h-5 text-[#E5A93B] shrink-0" />
                <span className="break-words">{tr.confirmBookingBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
