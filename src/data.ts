import {
  BlockedSlotRecord,
  CustomerGalleryItem,
  ReservationItem,
  SiteDesignItem,
  TimeSlotConfig,
} from './types';
import { DEFAULT_TIME_SLOTS } from './utils/bookingLogic';

export const IMG_FRENCH_PEARL = '/src/assets/images/nail_french_pearl_01_1795639689804.jpg';
export const IMG_MINIMAL_BLUSH = '/src/assets/images/nail_minimal_blush_02_1795639690356.jpg';
export const IMG_OMBRE_MULBERRY = '/src/assets/images/nail_ombre_mulberry_03_1795639691340.jpg';
export const IMG_GELISH_MARIGOLD = '/src/assets/images/nail_gelish_marigold_04_1795639692495.jpg';
export const IMG_PEDICURE_SPA = '/src/assets/images/nail_pedicure_spa_05_1795639693214.jpg';
export const IMG_DEMO_BARE_HAND = '/src/assets/images/demo_hand_natural_before_1795639694085.jpg';

export const BRAND_SWATCHES = [
  { id: 'magenta', hex: '#D42663', nameFa: 'سرخابی تمشکی (برند)', nameTr: 'Ahududu Macenta' },
  { id: 'blush', hex: '#F3769B', nameFa: 'صورتی رز ملایم', nameTr: 'Allık Pembe' },
  { id: 'mulberry', hex: '#7B2869', nameFa: 'ارغوانی شاه‌توتی', nameTr: 'Mürdüm Moru' },
  { id: 'aubergine', hex: '#3B132A', nameFa: 'بادمجانی تیره لوکس', nameTr: 'Koyu Patlıcan' },
  { id: 'peach', hex: '#F7AD93', nameFa: 'هلویی گرم ابریشمی', nameTr: 'Sıcak Şeftali' },
  { id: 'gold', hex: '#E5A93B', nameFa: 'طلایی گل همیشه بهار', nameTr: 'Kadife Altın' },
];

export const INITIAL_SITE_DESIGNS: SiteDesignItem[] = [
  {
    id: 'design-101',
    code: 'TA-101',
    titleFa: 'فرنچ مرواریدی با خط سرخابی و ورق طلا',
    titleTr: 'İnci Sedef & Ahududu Mikro French',
    category: 'french',
    priceToman: 780000,
    priceTl: 920,
    durationMin: 60,
    imageUrl: IMG_FRENCH_PEARL,
    primaryColorHex: '#D42663',
    secondaryColorHex: '#FAF0E6',
    defaultShape: 'almond',
    promptDescription:
      'Almond-shaped manicured nails with pearl cream base, vibrant raspberry magenta micro-French tip (#D42663), and delicate gold foil accent on the ring finger',
  },
  {
    id: 'design-102',
    code: 'TA-102',
    titleFa: 'طراحی مینیمال هندسی رزگلد و بادمجانی',
    titleTr: 'Minimalist Geometrik Allık & Altın Çizgi',
    category: 'minimal',
    priceToman: 690000,
    priceTl: 840,
    durationMin: 55,
    imageUrl: IMG_MINIMAL_BLUSH,
    primaryColorHex: '#F3769B',
    secondaryColorHex: '#3B132A',
    defaultShape: 'square',
    promptDescription:
      'Sheer blush pink gel polish (#F3769B) with ultra-fine minimalist geometric gold (#E5A93B) and deep aubergine (#3B132A) line art',
  },
  {
    id: 'design-103',
    code: 'TA-103',
    titleFa: 'آمبره مخملی ارغوانی و هلویی گرم',
    titleTr: 'Mürdüm & Sıcak Şeftali İpek Ombre',
    category: 'ombre',
    priceToman: 890000,
    priceTl: 1100,
    durationMin: 75,
    imageUrl: IMG_OMBRE_MULBERRY,
    primaryColorHex: '#7B2869',
    secondaryColorHex: '#F7AD93',
    defaultShape: 'coffin',
    promptDescription:
      'Coffin-shaped nails with seamless glossy gradient ombre blending warm peach (#F7AD93) at the cuticle into deep mulberry purple (#7B2869) and raspberry magenta (#D42663) at the tips',
  },
  {
    id: 'design-104',
    code: 'TA-104',
    titleFa: 'ژلیش طلایی بوتانیکال و موج هلویی',
    titleTr: 'Kadife Altın & Botanik Kalıcı Oje',
    category: 'gelish',
    priceToman: 740000,
    priceTl: 890,
    durationMin: 60,
    imageUrl: IMG_GELISH_MARIGOLD,
    primaryColorHex: '#E5A93B',
    secondaryColorHex: '#F7AD93',
    defaultShape: 'round',
    promptDescription:
      'Oval manicured nails with glossy marigold gold (#E5A93B) and warm peach (#F7AD93) abstract botanical leaf swirl nail art',
  },
  {
    id: 'design-105',
    code: 'TA-105',
    titleFa: 'پدیکور VIP اسپا با ژلیش بادمجانی تیره',
    titleTr: 'VIP Spa Pedikür & Koyu Patlıcan Jel',
    category: 'pedicure',
    priceToman: 850000,
    priceTl: 1050,
    durationMin: 70,
    imageUrl: IMG_PEDICURE_SPA,
    primaryColorHex: '#3B132A',
    secondaryColorHex: '#D42663',
    defaultShape: 'square',
    promptDescription:
      'Luxury spa manicure/pedicure with ultra-glossy deep aubergine dark plum (#3B132A) gel polish',
  },
  {
    id: 'design-106',
    code: 'TA-106',
    titleFa: 'مانیکور روسی و لمینت صورتی بلورین',
    titleTr: 'Rus Manikürü & Kristal Allık Jel',
    category: 'manicure',
    priceToman: 620000,
    priceTl: 760,
    durationMin: 50,
    imageUrl: IMG_FRENCH_PEARL,
    primaryColorHex: '#F3769B',
    secondaryColorHex: '#FAF0E6',
    defaultShape: 'almond',
    promptDescription:
      'Russian manicure with clean cuticles and sheer crystalline blush pink gel overlay (#F3769B)',
  },
];

export const INITIAL_CUSTOMER_GALLERY: CustomerGalleryItem[] = [
  {
    id: 'cust-201',
    customerFirstName: 'نیلوفر',
    serviceType: 'vip_design',
    serviceLabelFa: 'کاشت و فرنچ مرواریدی سرخابی',
    serviceLabelTr: 'İnci Ahududu French Tasarım',
    dateFa: '۱۴۰۵/۰۹/۰۲',
    dateIso: '2026-11-23',
    imageUrl: IMG_FRENCH_PEARL,
    designCode: 'TA-101',
    commentFa: 'دقیقاً مشابه خروجی هوش مصنوعی که قبل از نوبت روی دستم تست کرده بودم اجرا شد!',
    commentTr: 'Randevudan önce yapay zeka ile elimde denediğim tasarımın birebir aynısı yapıldı!',
  },
  {
    id: 'cust-202',
    customerFirstName: 'مهسا',
    serviceType: 'gelish',
    serviceLabelFa: 'ژلیش و طراحی آمبره ارغوانی',
    serviceLabelTr: 'Mürdüm & Şeftali Ombre Jel',
    dateFa: '۱۴۰۵/۰۸/۲۸',
    dateIso: '2026-11-19',
    imageUrl: IMG_OMBRE_MULBERRY,
    designCode: 'TA-103',
    commentFa: 'ماندگاری ژلیش و ظرافت آمبره فوق‌العاده است. محیط سالن بسیار آرامش‌بخش بود.',
    commentTr: 'Ombre geçişleri ve kalıcılığı harika, salon atmosferi çok huzurlu.',
  },
  {
    id: 'cust-203',
    customerFirstName: 'الناز',
    serviceType: 'manicure',
    serviceLabelFa: 'مانیکور روسی و طراحی مینیمال طلایی',
    serviceLabelTr: 'Rus Manikürü & Minimal Altın',
    dateFa: '۱۴۰۵/۰۸/۲۴',
    dateIso: '2026-11-15',
    imageUrl: IMG_MINIMAL_BLUSH,
    designCode: 'TA-102',
    commentFa: 'طرح مینیمال هندسی روی ناخن‌های کوتاهم خیلی شیک و طبیعی نشست.',
    commentTr: 'Kısa tırnaklarımda geometrik minimal tasarım çok zarif durdu.',
  },
  {
    id: 'cust-204',
    customerFirstName: 'شیرین',
    serviceType: 'pedicure',
    serviceLabelFa: 'پدیکور VIP و ژلیش طلایی بوتانیکال',
    serviceLabelTr: 'VIP Bakım & Botanik Altın Jel',
    dateFa: '۱۴۰۵/۰۸/۲۰',
    dateIso: '2026-11-11',
    imageUrl: IMG_GELISH_MARIGOLD,
    designCode: 'TA-104',
    commentFa: 'رنگ طلایی و هلویی دقیقاً با پوست دستم هماهنگ شد.',
    commentTr: 'Altın ve şeftali tonları ten rengimle mükemmel uyum sağladı.',
  },
];

export const INITIAL_RESERVATIONS: ReservationItem[] = [
  {
    id: 'res-1001',
    trackingCode: 'TA-1041',
    userId: 'user-demo-1',
    customerName: 'سارا رضایی',
    customerMobile: '09123456789',
    serviceType: 'vip_design',
    date: '1405-09-05',
    timeSlot: '11:30',
    notes: 'لطفاً فرم ناخن بادامی ملایم باشد و روی انگشت حلقه ورق طلا کار شود.',
    selectedDesignId: 'design-101',
    selectedDesignCode: 'TA-101',
    selectedDesignTitle: 'فرنچ مرواریدی با خط سرخابی و ورق طلا',
    nailShape: 'almond',
    nailColorHex: '#D42663',
    handImage: IMG_DEMO_BARE_HAND,
    aiFinalImage: IMG_FRENCH_PEARL,
    customerReferenceImage: IMG_MINIMAL_BLUSH,
    status: 'confirmed',
    publishedToCustomerGallery: false,
    createdAt: '۱۴۰۵/۰۹/۰۴ - ۱۰:۱۵',
  },
  {
    id: 'res-1002',
    trackingCode: 'TA-1042',
    userId: 'user-demo-2',
    customerName: 'پریسا احمدی',
    customerMobile: '09351112233',
    serviceType: 'gelish',
    date: '1405-09-05',
    timeSlot: '16:30',
    notes: 'طرح آمبره ارغوانی کد TA-103 که با هوش مصنوعی روی دستم تست کردم.',
    selectedDesignId: 'design-103',
    selectedDesignCode: 'TA-103',
    selectedDesignTitle: 'آمبره مخملی ارغوانی و هلویی گرم',
    nailShape: 'coffin',
    nailColorHex: '#7B2869',
    handImage: IMG_DEMO_BARE_HAND,
    aiFinalImage: IMG_OMBRE_MULBERRY,
    status: 'pending',
    publishedToCustomerGallery: false,
    createdAt: '۱۴۰۵/۰۹/۰۴ - ۱۲:۳۰',
  },
];

export const INITIAL_TIME_SLOTS: TimeSlotConfig[] = DEFAULT_TIME_SLOTS;

export const INITIAL_BLOCKED_SLOTS: BlockedSlotRecord[] = [
  {
    date: '1405-09-05',
    time: '15:00',
    reason: 'استراحت تکنسین',
  },
];

export const UPCOMING_PERSIAN_DATES = [
  { value: '1405-09-05', labelFa: 'پنج‌شنبه ۵ آذر ۱۴۰۵', labelTr: '26 Kasım 2026 Perşembe' },
  { value: '1405-09-06', labelFa: 'جمعه ۶ آذر ۱۴۰۵', labelTr: '27 Kasım 2026 Cuma' },
  { value: '1405-09-07', labelFa: 'شنبه ۷ آذر ۱۴۰۵', labelTr: '28 Kasım 2026 Cumartesi' },
  { value: '1405-09-08', labelFa: 'یکشنبه ۸ آذر ۱۴۰۵', labelTr: '29 Kasım 2026 Pazar' },
  { value: '1405-09-09', labelFa: 'دوشنبه ۹ آذر ۱۴۰۵', labelTr: '30 Kasım 2026 Pazartesi' },
  { value: '1405-09-10', labelFa: 'سه‌شنبه ۱۰ آذر ۱۴۰۵', labelTr: '1 Aralık 2026 Salı' },
];
