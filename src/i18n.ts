import { Language, NailCategory, NailShape, ReservationStatus, ServiceType } from './types';

export const TRANSLATIONS = {
  fa: {
    brandSubtitle: 'طراحی تخصصی ناخن • مانیکور • پدیکور',
    navHome: 'صفحه اصلی',
    navSiteGallery: 'تصاویر نمونه سایت',
    navBookingStudio: 'تست هوش مصنوعی و رزرو',
    navCustomerGallery: 'نمونه تصاویر مشتریان',
    navMyReservations: 'سوابق رزرو من',
    navAdmin: 'پنل مدیریت',
    loginRegisterBtn: 'ورود / عضویت',
    logoutBtn: 'خروج',
    installAppBtn: 'نصب اپلیکیشن',

    heroBadge: 'اولین آتلیه تخصصی ناخن با هوش مصنوعی در ایران • tirnakatolyesi.ir',
    heroTitle: 'طراحی اختصاصی ناخن و تست هوشمند با هوش مصنوعی',
    heroDescription:
      'پیش از رزرو نوبت، عکس دست خود را آپلود کنید و طرح‌های ژلیش، فرنچ، آمبره و کاشت ناخن Tırnak Atölyesi را با هوش مصنوعی به‌صورت واقعی روی ناخن‌های خود ببینید.',
    heroPrimaryCta: 'رزرو نوبت و تست طرح روی دست',
    heroSecondaryCta: 'مشاهده گالری طرح‌های سایت',

    servicesTitle: 'خدمات تخصصی آتلیه ناخن',
    serviceHighlights: [
      { id: 'manicure', title: 'مانیکور روسی', desc: 'پاکسازی ظریف کوتیکول و فرم‌دهی اصولی صدف ناخن', price: '۴۵۰,۰۰۰ تومان' },
      { id: 'pedicure', title: 'پدیکور VIP اسپا', desc: 'کوکتل درمانی، اسکراب، کفسابی و ژلیش پا', price: '۸۵۰,۰۰۰ تومان' },
      { id: 'gelish', title: 'ژلیش و لمینت', desc: 'استحکام‌بخشی ناخن طبیعی با لاک‌ژل‌های اورجینال', price: '۶۲۰,۰۰۰ تومان' },
      { id: 'extension', title: 'کاشت پودر و پلی‌ژل', desc: 'کاشت تخصصی بدون هواگرفتگی با فرم دلخواه', price: '۹۸۰,۰۰۰ تومان' },
      { id: 'vip_design', title: 'طراحی ناخن VIP', desc: 'فرنچ، آمبره، ورق طلا، کروم و طراحی مینیمال دستی', price: '۷۸۰,۰۰۰ تومان' },
    ],

    siteGallerySectionTitle: 'تصاویر نمونه خود سایت',
    siteGallerySectionSubtitle:
      'کالکشن رسمی طرح‌های Tırnak Atölyesi — هر طرح را انتخاب کنید تا با هوش مصنوعی مستقیماً روی عکس دست شما تست شود.',
    tryOnWithAiBtn: 'تست روی دست من با هوش مصنوعی',
    durationUnit: 'دقیقه',

    customerGallerySectionTitle: 'نمونه تصاویر مشتریان',
    customerGallerySectionSubtitle:
      'تصاویر واقعی اجراشده برای مشتریان عزیز آتلیه و خروجی‌های تاییدشده تست هوش مصنوعی',
    customerCardPrefix: 'مشتری:',

    bookingStudioTitle: 'استودیو تست هوشمند ناخن و رزرو آنلاین نوبت',
    bookingStudioSubtitle:
      'نوبت خود را تنظیم کنید و از دو باکس مجزای آپلود برای تست طرح‌های سایت روی دست خود یا ارسال عکس طرح شخصی استفاده نمایید.',

    step1Title: '۱. مشخصات نوبت و انتخاب سرویس',
    fullNameLabel: 'نام و نام خانوادگی',
    fullNamePlaceholder: 'مثلاً: سارا محمدی',
    mobileLabel: 'شماره موبایل',
    mobilePlaceholder: '09123456789',
    serviceSelectLabel: 'انتخاب خدمت درخواستی',
    dateSelectLabel: 'انتخاب تاریخ مراجعه',
    timeSlotSelectLabel: 'انتخاب ساعت نوبت (جلوگیری خودکار از رزرو تکراری)',
    notesLabel: 'توضیحات تکمیلی برای ناخن‌کار (اختیاری)',
    notesPlaceholder: 'مثلاً: ناخن‌هایم کوتاه است یا حساسیت پوستی دارم...',
    slotBookedLabel: 'رزرو شده',
    slotBlockedLabel: 'بسته',
    slotAvailableLabel: 'آزاد',

    uploadBox1Title: 'آپلود عکس دست شما (تست هوشمند طرحهای سایت با هوش مصنوعی)',
    uploadBox1Subtitle:
      'عکس دست خود را آپلود کنید یا با دوربین بگیرید، طرح سایت و فرم ناخن را انتخاب کنید تا هوش مصنوعی Gemini طرح را روی ناخن‌های واقعی شما اعمال کند.',
    uploadHandBtn: 'انتخاب یا گرفتن عکس دست شما',
    useDemoHandBtn: 'استفاده از عکس دست نمونه جهت تست سریع',
    selectedSiteDesignLabel: 'طرح انتخابی از گالری سایت:',
    nailShapeLabel: 'فرم ناخن:',
    nailColorLabel: 'رنگ لاک / تم رنگی برند:',
    runAiTryOnBtn: 'اعمال طرح روی دست من با هوش مصنوعی',
    runningAiText: 'در حال پردازش هوشمند طرح روی ناخن‌های شما...',
    beforeLabel: 'عکس دست اصلی',
    afterLabel: 'خروجی هوش مصنوعی (نمونه نهایی جهت اجرا)',
    sliderHint: 'اسلایدر را به چپ و راست بکشید تا قبل و بعد از طراحی ناخن را مقایسه کنید',
    aiSuccessReadyBadge: 'آماده ارسال خودکار به پنل مدیریت به عنوان «نمونه نهایی جهت اجرا»',

    uploadBox2Title: 'آپلود عکس طرح دلخواه شما (نمونه شخصی مشتری)',
    uploadBox2Subtitle:
      'باکس مجزا و مستقل: اگر از قبل عکس طرح ناخن دلخواهی در گالری گوشی خود دارید، اینجا آپلود کنید تا مستقیماً ضمیمه پرونده رزرو شما برای ناخن‌کار شود.',
    uploadCustomRefBtn: 'آپلود عکس طرح شخصی از گالری گوشی',
    removeImageBtn: 'حذف تصویر',

    confirmBookingBtn: 'ثبت نهایی رزرو و ارسال تصاویر به آتلیه',
    bookingSuccessTitle: 'رزرو نوبت شما با موفقیت ثبت شد!',
    bookingSuccessDesc:
      'پرونده رزرو به همراه تصویر نهایی هوش مصنوعی («نمونه نهایی جهت اجرا») و طرح ارسالی به پنل مدیریت ارسال گردید.',
    trackingCodeLabel: 'کد پیگیری رزرو:',

    myReservationsTitle: 'سوابق رزرو من و پیگیری وضعیت نوبت',
    noReservationsText: 'هنوز نوبتی با این شماره موبایل ثبت نشده است.',

    adminPanelTitle: 'پنل مدیریت آتلیه ناخن (Tırnak Atölyesi Admin)',
    adminTabReservations: 'صف رزروها و تصاویر مشتریان',
    adminTabGalleries: 'مدیریت گالری‌های سایت و مشتریان',
    adminTabSchedule: 'مدیریت ساعات کاری و نوبت‌ها',
    publishToCustomerGalleryBtn: 'انتشار در نمونه تصاویر مشتریان',
    publishedBadge: 'منتشر شده در گالری مشتریان',
    downloadImageBtn: 'دانلود کیفیت اصلی',
  },
  tr: {
    brandSubtitle: 'NAIL ART • MANİKÜR • PEDİKÜR',
    navHome: 'Ana Sayfa',
    navSiteGallery: 'Salon Tasarımları',
    navBookingStudio: 'AI Deneme & Randevu',
    navCustomerGallery: 'Müşteri Galerisi',
    navMyReservations: 'Randevularım',
    navAdmin: 'Yönetim Paneli',
    loginRegisterBtn: 'Giriş / Kayıt',
    logoutBtn: 'Çıkış',
    installAppBtn: 'Uygulamayı Yükle',

    heroBadge: 'Yapay Zeka Destekli Butik Tırnak Atölyesi • tirnakatolyesi.ir',
    heroTitle: 'Özel Tırnak Tasarımı ve Yapay Zeka ile Sanal Deneme',
    heroDescription:
      'Randevunuzu oluşturmadan önce elinizin fotoğrafını yükleyin; Tırnak Atölyesi kalıcı oje, French, ombre ve protez tırnak tasarımlarını yapay zeka ile kendi elinizde gerçekçi olarak görün.',
    heroPrimaryCta: 'Randevu Al & Elinde Dene',
    heroSecondaryCta: 'Salon Koleksiyonunu İncele',

    servicesTitle: 'Atölye Özel Hizmetlerimiz',
    serviceHighlights: [
      { id: 'manicure', title: 'Rus Manikürü', desc: 'Hassas kütikül temizliği ve doğal tırnak şekillendirme', price: '450.000 Toman' },
      { id: 'pedicure', title: 'VIP Spa Pedikür', desc: 'Aromaterapi bakımı, peeling ve kalıcı oje', price: '850.000 Toman' },
      { id: 'gelish', title: 'Kalıcı Oje & Güçlendirme', desc: 'Orijinal jel ürünlerle doğal tırnak güçlendirme', price: '620.000 Toman' },
      { id: 'extension', title: 'Protez & Jel Tırnak', desc: 'İstediğiniz formda uzun ömürlü protez tırnak', price: '980.000 Toman' },
      { id: 'vip_design', title: 'VIP Nail Art Tasarım', desc: 'French, ombre, altın varak ve minimal el çizimleri', price: '780.000 Toman' },
    ],

    siteGallerySectionTitle: 'Salon Resmi Tırnak Tasarımları («تصاویر نمونه خود سایت»)',
    siteGallerySectionSubtitle:
      'Tırnak Atölyesi imza koleksiyonu — herhangi bir tasarımı seçerek yapay zeka ile kendi el fotoğrafınız üzerinde hemen deneyin.',
    tryOnWithAiBtn: 'Yapay Zeka ile Elimde Dene',
    durationUnit: 'dk',

    customerGallerySectionTitle: 'Müşteri Sonuç Galerisi («نمونه تصاویر مشتریان»)',
    customerGallerySectionSubtitle:
      'Gerçek müşteri uygulamalarımız ve onaylanmış yapay zeka deneme sonuçları',
    customerCardPrefix: 'Müşteri:',

    bookingStudioTitle: 'AI Sanal Tırnak Stüdyosu & Online Randevu',
    bookingStudioSubtitle:
      'Randevu saatinizi seçin ve iki ayrı yükleme modülü ile ister salon tasarımlarını elinizde deneyin ister kendi referans fotoğrafınızı yükleyin.',

    step1Title: '1. Randevu Bilgileri ve Hizmet Seçimi',
    fullNameLabel: 'Ad Soyad',
    fullNamePlaceholder: 'Örn: Selin Yılmaz',
    mobileLabel: 'Cep Telefonu',
    mobilePlaceholder: '09123456789',
    serviceSelectLabel: 'Hizmet Seçimi',
    dateSelectLabel: 'Randevu Tarihi',
    timeSlotSelectLabel: 'Randevu Saati (Çift Rezervasyon Korumalı)',
    notesLabel: 'Uzman İçin Notunuz (İsteğe Bağlı)',
    notesPlaceholder: 'Özel isteklerinizi buraya yazabilirsiniz...',
    slotBookedLabel: 'Dolu',
    slotBlockedLabel: 'Kapalı',
    slotAvailableLabel: 'Müsait',

    uploadBox1Title: 'El Fotoğrafınızı Yükleyin (AI ile Salon Tasarımlarını Deneyin)',
    uploadBox1Subtitle:
      'Elinizin fotoğrafını yükleyin, salon tasarımını ve tırnak şeklini seçin; Gemini AI tasarımı gerçek tırnaklarınıza uygulasın.',
    uploadHandBtn: 'El Fotoğrafı Seç veya Çek',
    useDemoHandBtn: 'Hızlı Test İçin Örnek El Fotoğrafı Kullan',
    selectedSiteDesignLabel: 'Seçilen Salon Tasarımı:',
    nailShapeLabel: 'Tırnak Şekli:',
    nailColorLabel: 'Marka Renk Paleti:',
    runAiTryOnBtn: 'Tasarımı Yapay Zeka ile Elime Uygula',
    runningAiText: 'Yapay zeka tasarımı tırnaklarınıza uyguluyor...',
    beforeLabel: 'Orijinal El Fotoğrafı',
    afterLabel: 'AI Sonucu (Uygulanacak Nihai Referans)',
    sliderHint: 'Önce ve sonra karşılaştırması için kaydırıcıyı hareket ettirin',
    aiSuccessReadyBadge: 'Yönetim Paneline «Uygulanacak Nihai Tasarım» olarak gönderilmeye hazır',

    uploadBox2Title: 'Kendi İstediğiniz Tasarım Fotoğrafını Yükleyin (Müşteri Referansı)',
    uploadBox2Subtitle:
      'Bağımsız 2. Yükleme Kutusu: Telefonunuzda beğendiğiniz özel bir tırnak modeli varsa doğrudan randevunuza eklemek için buraya yükleyin.',
    uploadCustomRefBtn: 'Galeriden Özel Tasarım Fotoğrafı Yükle',
    removeImageBtn: 'Görseli Kaldır',

    confirmBookingBtn: 'Randevuyu Onayla ve Görselleri Gönder',
    bookingSuccessTitle: 'Randevunuz Başarıyla Oluşturuldu!',
    bookingSuccessDesc:
      'Randevu kaydınız, AI nihai el görseliniz ve referans fotoğrafınız yönetim paneline iletildi.',
    trackingCodeLabel: 'Takip Kodu:',

    myReservationsTitle: 'Randevu Geçmişim ve Durum Takibi',
    noReservationsText: 'Henüz kayıtlı bir randevunuz bulunmuyor.',

    adminPanelTitle: 'Tırnak Atölyesi Yönetim Paneli (/admin)',
    adminTabReservations: 'Randevu Kuyruğu & Görseller',
    adminTabGalleries: 'Galeri Yönetimi',
    adminTabSchedule: 'Çalışma Saatleri & Slotlar',
    publishToCustomerGalleryBtn: 'Müşteri Galerisinde Yayınla',
    publishedBadge: 'Müşteri Galerisinde Yayında',
    downloadImageBtn: 'Yüksek Çözünürlüklü İndir',
  },
};

export const CATEGORY_LABELS: Record<NailCategory, { fa: string; tr: string }> = {
  all: { fa: 'همه طرح‌ها', tr: 'Tümü' },
  gelish: { fa: 'ژلیش', tr: 'Kalıcı Oje' },
  minimal: { fa: 'طراحی مینیمال', tr: 'Minimal Tasarım' },
  french: { fa: 'فرنچ', tr: 'French' },
  manicure: { fa: 'مانیکور', tr: 'Manikür' },
  pedicure: { fa: 'پدیکور', tr: 'Pedikür' },
  ombre: { fa: 'آمبره', tr: 'Ombre' },
};

export const NAIL_SHAPE_LABELS: Record<NailShape, { fa: string; tr: string }> = {
  almond: { fa: 'بادامی (Almond)', tr: 'Badem' },
  coffin: { fa: 'تابوتی (Coffin)', tr: 'Balerin / Coffin' },
  square: { fa: 'مربعی (Square)', tr: 'Kare' },
  round: { fa: 'گرد (Round)', tr: 'Yuvarlak' },
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, { fa: string; tr: string; priceToman: number }> = {
  manicure: { fa: 'مانیکور روسی تخصصی', tr: 'Rus Manikürü', priceToman: 450000 },
  pedicure: { fa: 'پدیکور VIP و اسپا', tr: 'VIP Spa Pedikür', priceToman: 850000 },
  gelish: { fa: 'ژلیش ناخن طبیعی', tr: 'Doğal Tırnak Kalıcı Oje', priceToman: 620000 },
  extension: { fa: 'کاشت ناخن (پودر / پلی‌ژل)', tr: 'Protez Tırnak Uygulaması', priceToman: 980000 },
  repair: { fa: 'ترمیم همکار و تغییر فرم', tr: 'Protez Bakım & Onarım', priceToman: 690000 },
  vip_design: { fa: 'طراحی ناخن VIP و فرنچ/آمبره', tr: 'VIP Nail Art Tasarım', priceToman: 780000 },
};

export const STATUS_LABELS: Record<
  ReservationStatus,
  { fa: string; tr: string; badgeClass: string }
> = {
  pending: {
    fa: 'در انتظار تایید',
    tr: 'Onay Bekliyor',
    badgeClass: 'bg-[#E5A93B]/15 text-[#8A5D0B] border-[#E5A93B]/40',
  },
  confirmed: {
    fa: 'تایید شده',
    tr: 'Onaylandı',
    badgeClass: 'bg-[#D42663]/15 text-[#D42663] border-[#D42663]/40',
  },
  completed: {
    fa: 'انجام شده',
    tr: 'Tamamlandı',
    badgeClass: 'bg-emerald-700/15 text-emerald-800 border-emerald-700/30',
  },
};

export function t(lang: Language) {
  return TRANSLATIONS[lang];
}
