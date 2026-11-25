import React, { useRef, useState } from 'react';
import {
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

  // Free-tier Gemini 2.5 Flash Hand Analysis & Recommendation State
  const [aiAdvisorNote, setAiAdvisorNote] = useState<string | null>(null);
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

  // Sync user name/mobile when currentUser logs in
  React.useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.fullName);
      if (!customerMobile) setCustomerMobile(currentUser.mobile);
    }
  }, [currentUser, customerName, customerMobile]);

  // Sync nail shape & color when user clicks "تست روی دست من" on a gallery card
  React.useEffect(() => {
    setNailShape(selectedDesign.defaultShape);
    setNailColorHex(selectedDesign.primaryColorHex);
  }, [selectedDesign]);

  // Re-render HTML5 Canvas Composite automatically whenever user adjusts Drag/Resize/Rotate sliders while AI preview is active
  React.useEffect(() => {
    if (!aiFinalImage || !handImage) return;
    let cancelled = false;
    renderRealisticNailTryOnCanvas({
      handImageSrc: handImage,
      primaryColorHex: nailColorHex,
      secondaryColorHex: selectedDesign.secondaryColorHex,
      nailShape,
      designCode: selectedDesign.code,
      designTitle: lang === 'fa' ? selectedDesign.titleFa : selectedDesign.titleTr,
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

  // Handle Upload Box 1 File Selection (Customer Hand Photo)
  const handleHandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBox1Error(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBox1Error(lang === 'fa' ? validation.errorFa! : validation.errorTr!);
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file, 1080, 0.86);
      setHandImage(compressed);
      setAiFinalImage(null);
    } catch {
      setBox1Error(lang === 'fa' ? 'خطا در فشرده‌سازی تصویر دست' : 'Görsel işleme hatası');
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
          designTitle: selectedDesign.titleFa,
        }),
      });
      const data = await res.json();
      if (data.recommendedShape) {
        setNailShape(data.recommendedShape as NailShape);
      }
      if (data.recommendedColorHex) {
        setNailColorHex(data.recommendedColorHex);
      }
      setAiAdvisorNote(lang === 'fa' ? data.analysisFa : data.analysisTr);
    } catch {
      setAiAdvisorNote(
        lang === 'fa'
          ? 'بر اساس فرم انگشتان و تناژ پوست، فرم بادامی (Almond) با تم سرخابی (#D42663) پیشنهاد می‌شود.'
          : 'El yapınıza göre Badem (Almond) formu ve Ahududu Macenta (#D42663) önerilir.'
      );
    } finally {
      setIsAnalyzingHand(false);
    }
  };

  // Run Virtual Nail Try-On (100% Free-Tier Compatible HTML5 Canvas Studio + Gemini Advisor)
  const handleRunAiTryOn = async () => {
    if (!handImage) {
      setBox1Error(
        lang === 'fa'
          ? 'لطفاً ابتدا عکس دست خود را انتخاب کنید.'
          : 'Lütfen önce el fotoğrafınızı seçin.'
      );
      return;
    }

    setBox1Error(null);
    setIsAiProcessing(true);

    try {
      const compositeUrl = await renderRealisticNailTryOnCanvas({
        handImageSrc: handImage,
        primaryColorHex: nailColorHex,
        secondaryColorHex: selectedDesign.secondaryColorHex,
        nailShape,
        designCode: selectedDesign.code,
        designTitle: lang === 'fa' ? selectedDesign.titleFa : selectedDesign.titleTr,
        designImageUrl: selectedDesign.imageUrl,
        offsetX,
        offsetY,
        scale: nailScale,
        rotationDeg,
      });
      setAiFinalImage(compositeUrl);

      if (!aiAdvisorNote) {
        handleAnalyzeHandWithGemini();
      }
    } catch {
      setBox1Error(lang === 'fa' ? 'خطا در اجرای تست طرح روی دست' : 'Tasarım uygulama hatası');
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
      setBox2Error(lang === 'fa' ? validation.errorFa! : validation.errorTr!);
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file, 1080, 0.86);
      setCustomerReferenceImage(compressed);
    } catch {
      setBox2Error(lang === 'fa' ? 'خطا در بارگذاری تصویر طرح دلخواه' : 'Görsel yükleme hatası');
    }
  };

  // Handle Final Booking Confirmation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setConfirmedReservation(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError(
        lang === 'fa'
          ? 'لطفاً نام و نام خانوادگی خود را کامل وارد کنید.'
          : 'Lütfen adınızı ve soyadınızı girin.'
      );
      return;
    }

    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      setSubmitError(
        lang === 'fa'
          ? 'لطفاً شماره موبایل معتبر وارد نمایید (مثلاً 09123456789).'
          : 'Lütfen geçerli bir cep telefonu numarası girin.'
      );
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
          designTitle: lang === 'fa' ? selectedDesign.titleFa : selectedDesign.titleTr,
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
          selectedDesignTitle:
            lang === 'fa' ? selectedDesign.titleFa : selectedDesign.titleTr,
          nailShape,
          nailColorHex,
          handImage,
          aiFinalImage: finalAiOutput,
          customerReferenceImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'خطا در ثبت رزرو');
        setSubmitting(false);
        return;
      }

      setConfirmedReservation(data.reservation);
      onReservationCreated(data.reservation);
    } catch {
      setSubmitError(
        lang === 'fa'
          ? 'خطا در ارتباط با سرور هنگام ثبت رزرو'
          : 'Sunucu bağlantı hatası'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="booking-studio"
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-labelledby="booking-studio-heading"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-10">
        <p className="text-xs font-semibold text-[#D42663] tracking-wide">
          Tırnak Atölyesi • Interactive HTML5 Canvas & Gemini 2.5 Flash Nail Studio
        </p>
        <h2
          id="booking-studio-heading"
          className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5"
        >
          {tr.bookingStudioTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed">
          {tr.bookingStudioSubtitle}
        </p>
      </div>

      {/* Confirmed Reservation Receipt Banner */}
      {confirmedReservation && (
        <div
          data-testid="booking-confirmation-card"
          className="mb-10 rounded-3xl bg-[#FFFDFB] border-2 border-[#D42663] p-6 sm:p-8 shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[#D42663] font-bold text-base">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>{tr.bookingSuccessTitle}</span>
              </div>
              <p className="text-sm text-[#3B132A]/80 leading-relaxed">
                {tr.bookingSuccessDesc}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#3B132A]">
                <span>
                  <strong>{tr.trackingCodeLabel}</strong>{' '}
                  <code className="font-mono font-bold text-[#D42663] text-sm">
                    {confirmedReservation.trackingCode}
                  </code>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong>{lang === 'fa' ? 'نام مشتری:' : 'Müşteri:'}</strong>{' '}
                  {confirmedReservation.customerName}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong>{lang === 'fa' ? 'زمان نوبت:' : 'Tarih & Saat:'}</strong>{' '}
                  {confirmedReservation.date} — {confirmedReservation.timeSlot}
                </span>
              </div>
            </div>

            {confirmedReservation.aiFinalImage && (
              <div className="flex items-center gap-3 shrink-0 bg-[#FAF0E6] p-3 rounded-2xl border border-[#3B132A]/10">
                <img
                  src={confirmedReservation.aiFinalImage}
                  alt="نمونه نهایی جهت اجرا"
                  className="w-20 h-16 rounded-xl object-cover border border-[#3B132A]/15"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#3B132A]">
                    {lang === 'fa' ? 'نمونه نهایی جهت اجرا' : 'Nihai AI Referansı'}
                  </p>
                  <p className="text-[#3B132A]/70 mt-0.5">
                    {confirmedReservation.selectedDesignCode} • {confirmedReservation.nailShape}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleConfirmBooking} className="space-y-10">
        {/* Dual Upload Modules Grid: Box 1 (Hand AI Try-On) & Box 2 (Independent Personal Reference Photo) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* UPLOAD BOX 1: AI Virtual Nail Try-On Studio (7 columns on desktop) */}
          <div
            data-testid="upload-box-1-ai-hand"
            className="lg:col-span-7 rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#3B132A]/10">
              <div>
                <span className="text-xs font-bold text-[#D42663]">
                  {lang === 'fa'
                    ? 'باکس آپلود ۱ • استودیو تست طرح روی دست (HTML5 Canvas + Gemini 2.5 Flash)'
                    : 'Yükleme Kutusu 1 • HTML5 Canvas & Gemini 2.5 Flash Deneme Stüdyosu'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#3B132A] mt-1">
                  {lang === 'fa'
                    ? 'آپلود عکس دست شما (تست طرحهای سایت)'
                    : tr.uploadBox1Title}
                </h3>
                <p className="text-xs sm:text-sm text-[#3B132A]/75 mt-1 leading-relaxed">
                  {tr.uploadBox1Subtitle}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#D42663]/10 text-[#D42663] flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
            </div>

            {/* Hand Photo Upload, Demo Hand & Free-Tier Gemini 2.5 Flash Advisor Button */}
            <div className="flex flex-wrap items-center gap-2.5">
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
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-semibold hover:bg-[#521B3B] transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>{tr.uploadHandBtn}</span>
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
                className="inline-flex items-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#FAF0E6] text-[#3B132A] text-xs font-medium hover:bg-[#F7AD93]/35 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>{tr.useDemoHandBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleAnalyzeHandWithGemini}
                disabled={isAnalyzingHand}
                className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#7B2869]/10 text-[#7B2869] border border-[#7B2869]/25 text-xs font-semibold hover:bg-[#7B2869] hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isAnalyzingHand
                    ? lang === 'fa'
                      ? 'در حال آنالیز دست...'
                      : 'Analiz Ediliyor...'
                    : lang === 'fa'
                    ? 'مشاوره هوشمند فرم و رنگ (Gemini 2.5 Flash)'
                    : 'AI Form & Renk Önerisi (Gemini 2.5)'}
                </span>
              </button>
            </div>

            {aiAdvisorNote && (
              <div className="rounded-2xl bg-[#FAF0E6] border border-[#E5A93B]/45 p-3.5 text-xs text-[#3B132A] leading-relaxed">
                <strong className="text-[#D42663]">
                  {lang === 'fa' ? 'پیشنهاد هوش مصنوعی Gemini 2.5 Flash: ' : 'Gemini 2.5 Flash Önerisi: '}
                </strong>
                <span>{aiAdvisorNote}</span>
              </div>
            )}

            {box1Error && (
              <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-4 py-2.5 text-xs font-medium text-[#D42663]">
                {box1Error}
              </div>
            )}

            {/* Selected Site Design Selector Strip */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#3B132A]">
                {tr.selectedSiteDesignLabel}{' '}
                <span className="text-[#D42663]">
                  ({selectedDesign.code} — {lang === 'fa' ? selectedDesign.titleFa : selectedDesign.titleTr})
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {siteDesigns.map((d) => {
                  const isSelected = d.id === selectedDesign.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectDesign(d)}
                      aria-label={`انتخاب طرح ${d.code}`}
                      className={`group relative rounded-xl overflow-hidden border-2 transition-all text-right cursor-pointer ${
                        isSelected
                          ? 'border-[#D42663] ring-2 ring-[#D42663]/30'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={d.imageUrl}
                        alt={d.titleFa}
                        className="w-full aspect-square object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="bg-[#3B132A]/85 text-[#FFFDFB] text-[10px] font-mono text-center py-0.5">
                        {d.code}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nail Shape & Brand Color Customizers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Nail Shape Selector */}
              <div>
                <label className="block text-xs font-bold text-[#3B132A] mb-2">
                  {tr.nailShapeLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['almond', 'coffin', 'square', 'round'] as NailShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setNailShape(shape)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
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
              <div>
                <label className="block text-xs font-bold text-[#3B132A] mb-2">
                  {tr.nailColorLabel}
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {BRAND_SWATCHES.map((swatch) => {
                    const active = nailColorHex.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => setNailColorHex(swatch.hex)}
                        title={lang === 'fa' ? swatch.nameFa : swatch.nameTr}
                        aria-label={lang === 'fa' ? swatch.nameFa : swatch.nameTr}
                        className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer ${
                          active
                            ? 'border-[#3B132A] scale-110 ring-2 ring-[#D42663]/40'
                            : 'border-white shadow-sm hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive HTML5 Canvas Fine-Tuning Controls: Drag / Move, Resize / Scale, Rotate */}
            <div className="rounded-2xl bg-[#FAF0E6]/80 border border-[#3B132A]/12 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3B132A]">
                  {lang === 'fa'
                    ? 'تنظیم دقیق جایگاه ناخن روی عکس دست (جابجایی، تغییر سایز و چرخش):'
                    : 'Tırnak Konumu, Boyut ve Döndürme Ayarları:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                    setNailScale(1.0);
                    setRotationDeg(0);
                  }}
                  className="text-[11px] font-semibold text-[#D42663] hover:underline cursor-pointer"
                >
                  {lang === 'fa' ? 'بازنشانی تنظیمات' : 'Sıfırla'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label
                    htmlFor="canvas-offset-x"
                    className="flex items-center justify-between text-[#3B132A]/80 mb-1"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-[#D42663]" />
                      <span>{lang === 'fa' ? 'جابجایی افقی/عمودی' : 'Konum (Drag)'}</span>
                    </span>
                    <span className="font-mono">{offsetX}%</span>
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
                    className="w-full accent-[#D42663] cursor-pointer"
                  />
                </div>

                <div>
                  <label
                    htmlFor="canvas-scale"
                    className="flex items-center justify-between text-[#3B132A]/80 mb-1"
                  >
                    <span className="inline-flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-[#D42663]" />
                      <span>{lang === 'fa' ? 'اندازه ناخن (Resize)' : 'Boyut (Scale)'}</span>
                    </span>
                    <span className="font-mono">{Math.round(nailScale * 100)}%</span>
                  </label>
                  <input
                    id="canvas-scale"
                    type="range"
                    min={75}
                    max={135}
                    value={Math.round(nailScale * 100)}
                    onChange={(e) => setNailScale(Number(e.target.value) / 100)}
                    className="w-full accent-[#D42663] cursor-pointer"
                  />
                </div>

                <div>
                  <label
                    htmlFor="canvas-rotate"
                    className="flex items-center justify-between text-[#3B132A]/80 mb-1"
                  >
                    <span className="inline-flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-[#D42663]" />
                      <span>{lang === 'fa' ? 'زاویه چرخش (Rotate)' : 'Döndürme'}</span>
                    </span>
                    <span className="font-mono">{rotationDeg}°</span>
                  </label>
                  <input
                    id="canvas-rotate"
                    type="range"
                    min={-25}
                    max={25}
                    value={rotationDeg}
                    onChange={(e) => setRotationDeg(Number(e.target.value))}
                    className="w-full accent-[#D42663] cursor-pointer"
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
              className="w-full py-3.5 px-5 rounded-2xl bg-[#D42663] text-white text-sm font-bold hover:bg-[#B81D53] transition-colors flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-60"
            >
              <Wand2 className={`w-5 h-5 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? tr.runningAiText : tr.runAiTryOnBtn}</span>
            </button>

            {/* Interactive Before / After Comparison Slider OR Initial Hand Preview */}
            <div className="pt-2">
              {aiFinalImage ? (
                <div className="space-y-3">
                  <BeforeAfterSlider
                    beforeImage={handImage}
                    afterImage={aiFinalImage}
                    beforeLabel={tr.beforeLabel}
                    afterLabel={tr.afterLabel}
                    hintText={tr.sliderHint}
                  />
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF0E6] px-4 py-2.5 text-xs text-[#3B132A]">
                    <span className="font-semibold text-[#D42663]">
                      ✓ {tr.aiSuccessReadyBadge}
                    </span>
                    <span className="font-mono text-[11px] text-[#3B132A]/70">
                      {selectedDesign.code}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#3B132A]/15 bg-[#FAF0E6]">
                  <img
                    src={handImage}
                    alt={tr.beforeLabel}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3B132A]/85 via-[#3B132A]/45 to-transparent p-4 text-[#FFFDFB] flex items-center justify-between">
                    <span className="text-xs font-medium">{tr.beforeLabel}</span>
                    <span className="text-xs text-[#F7AD93]">
                      {lang === 'fa'
                        ? 'دکمه «اعمال طرح روی دست من با هوش مصنوعی» را بزنید'
                        : 'AI deneme butonuna tıklayın'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* UPLOAD BOX 2 & STEP-BY-STEP APPOINTMENT DETAILS (5 columns on desktop) */}
          <div className="lg:col-span-5 space-y-8">
            {/* UPLOAD BOX 2: Independent Customer Personal Reference Photo */}
            <div
              data-testid="upload-box-2-custom-ref"
              className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-7 shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-[#3B132A]/10">
                <div>
                  <span className="text-xs font-bold text-[#7B2869]">
                    {lang === 'fa'
                      ? 'باکس آپلود ۲ • مستقل از تست هوش مصنوعی'
                      : 'Yükleme Kutusu 2 • Bağımsız Müşteri Referansı'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#3B132A] mt-1">
                    {tr.uploadBox2Title}
                  </h3>
                  <p className="text-xs text-[#3B132A]/75 mt-1 leading-relaxed">
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
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#7B2869]/30 bg-[#FAF0E6]">
                    <img
                      src={customerReferenceImage}
                      alt="عکس طرح دلخواه مشتری"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => customRefInputRef.current?.click()}
                      className="py-2 px-3.5 rounded-xl bg-[#FAF0E6] text-[#3B132A] text-xs font-semibold hover:bg-[#F7AD93]/30 transition-colors cursor-pointer"
                    >
                      {lang === 'fa' ? 'تغییر تصویر طرح شخصی' : 'Görseli Değiştir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerReferenceImage(null)}
                      className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-[#D42663] hover:bg-[#D42663]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{tr.removeImageBtn}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => customRefInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-[#7B2869]/35 bg-[#FAF0E6]/60 hover:bg-[#FAF0E6] p-6 text-center transition-colors flex flex-col items-center justify-center gap-2.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-[#7B2869]/10 text-[#7B2869] flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#3B132A]">
                    {tr.uploadCustomRefBtn}
                  </span>
                  <span className="text-[11px] text-[#3B132A]/65">
                    JPG, PNG, WebP (فشرده‌سازی خودکار)
                  </span>
                </button>
              )}

              {box2Error && (
                <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2 text-xs font-medium text-[#D42663]">
                  {box2Error}
                </div>
              )}
            </div>

            {/* APPOINTMENT DETAILS MODULE */}
            <div className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-7 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-[#3B132A] pb-3 border-b border-[#3B132A]/10">
                {tr.step1Title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="booking-fullname"
                    className="block text-xs font-semibold text-[#3B132A] mb-1"
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
                    className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-mobile"
                    className="block text-xs font-semibold text-[#3B132A] mb-1"
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
                    className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                  />
                </div>
              </div>

              {/* Service Selector */}
              <div>
                <label
                  htmlFor="booking-service"
                  className="block text-xs font-semibold text-[#3B132A] mb-1"
                >
                  {tr.serviceSelectLabel}
                </label>
                <select
                  id="booking-service"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
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
              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-semibold text-[#3B132A] mb-1"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D42663]" />
                    <span>{tr.dateSelectLabel}</span>
                  </span>
                </label>
                <select
                  id="booking-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                >
                  {UPCOMING_PERSIAN_DATES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {lang === 'fa' ? d.labelFa : d.labelTr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selector with Double-Booking Prevention */}
              <div>
                <label className="block text-xs font-semibold text-[#3B132A] mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D42663]" />
                    <span>{tr.timeSlotSelectLabel}</span>
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slotStatuses.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.time && slot.available;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-mono font-semibold border transition-colors flex flex-col items-center justify-center ${
                          !slot.available
                            ? 'bg-[#FAF0E6]/40 text-[#3B132A]/35 border-[#3B132A]/10 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#3B132A] text-[#FFFDFB] border-[#3B132A] shadow-sm cursor-pointer'
                            : 'bg-[#FAF0E6]/80 text-[#3B132A] border-[#3B132A]/15 hover:border-[#D42663] cursor-pointer'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span className="text-[10px] font-persian font-normal opacity-80">
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

              {/* Optional Notes */}
              <div>
                <label
                  htmlFor="booking-notes"
                  className="block text-xs font-semibold text-[#3B132A] mb-1"
                >
                  {tr.notesLabel}
                </label>
                <textarea
                  id="booking-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr.notesPlaceholder}
                  className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 px-3.5 py-2 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                />
              </div>

              {submitError && (
                <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2.5 text-xs font-medium text-[#D42663]">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                data-testid="confirm-reservation-btn"
                className="w-full py-3.5 px-5 rounded-2xl bg-[#3B132A] text-[#FFFDFB] text-sm font-bold hover:bg-[#521B3B] transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-[#E5A93B]" />
                <span>
                  {submitting
                    ? lang === 'fa'
                      ? 'در حال ثبت نهایی رزرو...'
                      : 'Kaydediliyor...'
                    : tr.confirmBookingBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
