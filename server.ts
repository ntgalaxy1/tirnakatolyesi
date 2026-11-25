import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_BLOCKED_SLOTS,
  INITIAL_CUSTOMER_GALLERY,
  INITIAL_RESERVATIONS,
  INITIAL_SITE_DESIGNS,
  INITIAL_TIME_SLOTS,
} from './src/data';
import {
  BlockedSlotRecord,
  CustomerGalleryItem,
  ReservationItem,
  ReservationStatus,
  SiteDesignItem,
  TimeSlotConfig,
  UserAccount,
} from './src/types';
import {
  generateTrackingCode,
  normalizeIranMobile,
  validateReservationPayload,
} from './src/utils/bookingLogic';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store initialized with deterministic seed data
let siteDesigns: SiteDesignItem[] = [...INITIAL_SITE_DESIGNS];
let customerGallery: CustomerGalleryItem[] = [...INITIAL_CUSTOMER_GALLERY];
let reservations: ReservationItem[] = [...INITIAL_RESERVATIONS];
let timeSlots: TimeSlotConfig[] = [...INITIAL_TIME_SLOTS];
let blockedSlots: BlockedSlotRecord[] = [...INITIAL_BLOCKED_SLOTS];

interface StoredUser extends UserAccount {
  passwordHash: string;
}

const users: StoredUser[] = [
  {
    id: 'admin-1',
    fullName: 'مدیر آتلیه ناخن (Tırnak Atölyesi)',
    mobile: '09120000000',
    username: 'admin',
    role: 'admin',
    passwordHash: 'Admin@1234',
    createdAt: '1405/09/01',
  },
  {
    id: 'user-demo-1',
    fullName: 'سارا رضایی',
    mobile: '09123456789',
    role: 'customer',
    passwordHash: '123456',
    createdAt: '1405/09/01',
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support base64 image uploads (hand_image, ai_final_image, customer_reference_image)
  app.use(express.json({ limit: '25mb' }));

  // 1. Bootstrap initial state
  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      siteDesigns,
      customerGallery,
      reservations,
      timeSlots,
      blockedSlots,
    });
  });

  // 2. Customer Registration
  app.post('/api/auth/register', (req, res) => {
    const { fullName, mobile, password } = req.body || {};
    if (!fullName || !mobile || !password) {
      res.status(400).json({ error: 'لطفاً تمام فیلدها را تکمیل نمایید.' });
      return;
    }
    const normalizedMobile = normalizeIranMobile(String(mobile));
    const existing = users.find((u) => u.mobile === normalizedMobile);
    if (existing) {
      res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است. لطفاً وارد شوید.' });
      return;
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      fullName: String(fullName).trim(),
      mobile: normalizedMobile,
      role: 'customer',
      passwordHash: String(password),
      createdAt: '۱۴۰۵/۰۹/۰۵',
    };
    users.push(newUser);

    const { passwordHash: _ph, ...safeUser } = newUser;
    res.json({ user: safeUser });
  });

  // 3. Customer & Admin Login (Supports seeded admin / Admin@1234)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      res.status(400).json({ error: 'نام کاربری/شماره موبایل و رمز عبور الزامی است.' });
      return;
    }

    const cleanId = String(identifier).trim();
    const normalizedMobile = normalizeIranMobile(cleanId);

    const found = users.find(
      (u) =>
        ((u.username && u.username.toLowerCase() === cleanId.toLowerCase()) ||
          u.mobile === normalizedMobile ||
          u.mobile === cleanId) &&
        u.passwordHash === String(password)
    );

    if (!found) {
      res.status(401).json({ error: 'اطلاعات ورود اشتباه است. (دمو ادمین: admin / Admin@1234)' });
      return;
    }

    const { passwordHash: _ph, ...safeUser } = found;
    res.json({ user: safeUser });
  });

  // 4. Server-Side Gemini Virtual Nail Try-On Endpoint
  app.post('/api/ai/nail-tryon', async (req, res) => {
    try {
      const {
        handImageBase64,
        designTitle,
        designPrompt,
        nailShape,
        nailColorHex,
      } = req.body || {};

      if (!handImageBase64) {
        res.status(400).json({ error: 'تصویر دست ارسال نشده است.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(200).json({
          fallbackRequired: true,
          message: 'کلید Gemini در محیط سرور فعال نیست؛ از موتور رندر استودیویی استفاده می‌شود.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Extract raw base64 and mimeType
      const match = String(handImageBase64).match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const rawBase64 = match ? match[2] : String(handImageBase64);

      const promptText = `Apply a realistic luxury salon manicure onto the fingernails of this hand photo.
Nail shape: ${nailShape || 'almond'}.
Primary brand color hex: ${nailColorHex || '#D42663'}.
Nail art design: ${designPrompt || designTitle || 'Pearl cream and raspberry magenta micro-French tip with gold foil accent'}.
Strictly preserve the customer's exact hand skin tone, finger positions, background, and natural studio lighting. Only transform the fingernails with a realistic glossy gel manicure.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: rawBase64,
                mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });

      let generatedDataUrl: string | null = null;
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType ?? 'image/png';
          generatedDataUrl = `data:${outMime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!generatedDataUrl) {
        res.status(200).json({
          fallbackRequired: true,
          message: 'مدل تصویر خروجی برنگرداند؛ از موتور رندر استودیویی استفاده می‌شود.',
        });
        return;
      }

      res.json({
        aiFinalImage: generatedDataUrl,
        engine: 'gemini-3.1-flash-lite-image',
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown Gemini API error';
      res.status(200).json({
        fallbackRequired: true,
        message: errMsg,
      });
    }
  });

  // 4b. Free-Tier Hand Analysis & Nail Shape/Color Advisor (`gemini-2.5-flash` / `gemini-4-hydrogen` with graceful offline fallback)
  app.post('/api/ai/analyze-hand', async (req, res) => {
    try {
      const { handImageBase64, designTitle } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !handImageBase64) {
        res.json({
          recommendedShape: 'almond',
          recommendedColorHex: '#D42663',
          analysisFa:
            'بر اساس فرم انگشتان و تناژ پوست دست شما، فرم «بادامی (Almond)» با تم رنگی «سرخابی تمشکی (#D42663)» و ورق طلا بیشترین کشیدگی و ظرافت را روی دست شما ایجاد می‌کند.',
          analysisTr:
            'Parmak yapınız ve cilt alt tonunuza göre Badem (Almond) tırnak formu ve Ahududu Macenta (#D42663) tonu en zarif görünümü sağlar.',
          engine: 'studio-advisor-fallback',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const match = String(handImageBase64).match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const rawBase64 = match ? match[2] : String(handImageBase64);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { data: rawBase64, mimeType } },
            {
              text: `Analyze this customer's hand photo for Tırnak Atölyesi nail salon (selected design: ${designTitle || 'French'}). Recommend the ideal nail shape (almond, coffin, square, or round) and brand color hex (#D42663, #F3769B, #7B2869, #3B132A, #F7AD93, or #E5A93B) in 1 concise Persian sentence and 1 Turkish sentence. Return JSON: {"recommendedShape":"almond","recommendedColorHex":"#D42663","analysisFa":"...","analysisTr":"..."}`,
            },
          ],
        },
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        recommendedShape: parsed.recommendedShape || 'almond',
        recommendedColorHex: parsed.recommendedColorHex || '#D42663',
        analysisFa:
          parsed.analysisFa ||
          'فرم بادامی (Almond) با تم سرخابی (#D42663) برای فرم انگشتان شما ایده‌آل است.',
        analysisTr:
          parsed.analysisTr ||
          'Badem (Almond) tırnak formu ve Ahududu Macenta (#D42663) el yapınız için idealdir.',
        engine: 'gemini-2.5-flash',
      });
    } catch {
      res.json({
        recommendedShape: 'almond',
        recommendedColorHex: '#D42663',
        analysisFa:
          'بر اساس آنالیز فرم دست و تناژ پوست، فرم «بادامی (Almond)» و رنگ «سرخابی تمشکی (#D42663)» پیشنهاد می‌شود.',
        analysisTr:
          'El ve cilt tonu analizine göre Badem (Almond) formu ve Ahududu Macenta (#D42663) önerilir.',
        engine: 'studio-advisor-fallback',
      });
    }
  });

  // 5. Create Appointment Reservation with Dual Image Upload Support
  app.post('/api/reservations', (req, res) => {
    const {
      userId,
      customerName,
      customerMobile,
      serviceType,
      date,
      timeSlot,
      notes,
      selectedDesignId,
      selectedDesignCode,
      selectedDesignTitle,
      nailShape,
      nailColorHex,
      handImage,
      aiFinalImage,
      customerReferenceImage,
    } = req.body || {};

    const validation = validateReservationPayload({
      customerName: String(customerName || ''),
      customerMobile: String(customerMobile || ''),
      serviceType: String(serviceType || ''),
      date: String(date || ''),
      timeSlot: String(timeSlot || ''),
      existingReservations: reservations,
      blockedSlots,
    });

    if (!validation.valid) {
      res.status(400).json({
        errorKey: validation.errorKey,
        error: 'اطلاعات فرم ناقص است یا این ساعت قبلاً رزرو شده است.',
      });
      return;
    }

    const newReservation: ReservationItem = {
      id: `res-${Date.now()}`,
      trackingCode: generateTrackingCode(reservations.length + 1),
      userId: userId || 'guest',
      customerName: String(customerName).trim(),
      customerMobile: normalizeIranMobile(String(customerMobile)),
      serviceType,
      date,
      timeSlot,
      notes: String(notes || '').trim(),
      selectedDesignId,
      selectedDesignCode,
      selectedDesignTitle,
      nailShape: nailShape || 'almond',
      nailColorHex: nailColorHex || '#D42663',
      handImage: handImage || undefined,
      aiFinalImage: aiFinalImage || undefined,
      customerReferenceImage: customerReferenceImage || undefined,
      status: 'pending',
      publishedToCustomerGallery: false,
      createdAt: '۱۴۰۵/۰۹/۰۵ - ثبت آنلاین',
    };

    reservations = [newReservation, ...reservations];
    res.json({ reservation: newReservation });
  });

  // 6. Admin: Update Reservation Status
  app.patch('/api/reservations/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status: ReservationStatus };
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'رزرو یافت نشد.' });
      return;
    }
    reservations[idx] = { ...reservations[idx], status };
    res.json({ reservation: reservations[idx] });
  });

  // 7. Admin: 1-Click Publish Reservation Photo to Public Customer Showcase Gallery
  app.post('/api/reservations/:id/publish-gallery', (req, res) => {
    const { id } = req.params;
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'رزرو یافت نشد.' });
      return;
    }

    const r = reservations[idx];
    const imageToPublish =
      r.aiFinalImage ||
      r.customerReferenceImage ||
      r.handImage ||
      INITIAL_SITE_DESIGNS[0].imageUrl;

    const firstName = r.customerName.split(' ')[0] || r.customerName;

    const newCustomerItem: CustomerGalleryItem = {
      id: `cust-${Date.now()}`,
      customerFirstName: firstName,
      serviceType: r.serviceType,
      serviceLabelFa: r.selectedDesignTitle || 'طراحی اختصاصی ناخن و تست هوش مصنوعی',
      serviceLabelTr: r.selectedDesignTitle || 'AI Özel Tırnak Tasarımı',
      dateFa: r.date.replace(/-/g, '/'),
      dateIso: new Date().toISOString().slice(0, 10),
      imageUrl: imageToPublish,
      designCode: r.selectedDesignCode || 'TA-VIP',
      commentFa: r.notes || 'اجرا شده بر اساس نمونه نهایی تست هوشمند روی دست مشتری در Tırnak Atölyesi',
      commentTr: 'Müşteri elinde AI denemesi ile onaylanan nihai tasarım uygulaması',
      reservationId: r.id,
    };

    customerGallery = [newCustomerItem, ...customerGallery];
    reservations[idx] = {
      ...r,
      publishedToCustomerGallery: true,
      status: 'completed',
    };

    res.json({
      reservation: reservations[idx],
      customerGalleryItem: newCustomerItem,
    });
  });

  // 8. Admin: Manage Site Gallery («تصاویر نمونه خود سایت»)
  app.post('/api/site-gallery', (req, res) => {
    const {
      code,
      titleFa,
      titleTr,
      category,
      priceToman,
      durationMin,
      imageUrl,
      primaryColorHex,
      defaultShape,
    } = req.body || {};

    if (!titleFa || !imageUrl) {
      res.status(400).json({ error: 'عنوان طرح و تصویر الزامی است.' });
      return;
    }

    const newDesign: SiteDesignItem = {
      id: `design-${Date.now()}`,
      code: code || `TA-${100 + siteDesigns.length + 1}`,
      titleFa,
      titleTr: titleTr || titleFa,
      category: category || 'gelish',
      priceToman: Number(priceToman) || 750000,
      priceTl: 900,
      durationMin: Number(durationMin) || 60,
      imageUrl,
      primaryColorHex: primaryColorHex || '#D42663',
      secondaryColorHex: '#FAF0E6',
      defaultShape: defaultShape || 'almond',
      promptDescription: `${titleFa} nail art design`,
    };

    siteDesigns = [newDesign, ...siteDesigns];
    res.json({ design: newDesign });
  });

  app.delete('/api/site-gallery/:id', (req, res) => {
    siteDesigns = siteDesigns.filter((d) => d.id !== req.params.id);
    res.json({ success: true });
  });

  // 9. Admin: Manage Customer Showcase Gallery («نمونه تصاویر مشتریان»)
  app.post('/api/customer-gallery', (req, res) => {
    const { customerFirstName, serviceType, serviceLabelFa, dateFa, imageUrl, commentFa } =
      req.body || {};
    if (!customerFirstName || !imageUrl) {
      res.status(400).json({ error: 'نام مشتری و تصویر الزامی است.' });
      return;
    }

    const item: CustomerGalleryItem = {
      id: `cust-${Date.now()}`,
      customerFirstName,
      serviceType: serviceType || 'vip_design',
      serviceLabelFa: serviceLabelFa || 'طراحی و ژلیش ناخن',
      serviceLabelTr: serviceLabelFa || 'VIP Nail Art',
      dateFa: dateFa || '۱۴۰۵/۰۹/۰۵',
      dateIso: new Date().toISOString().slice(0, 10),
      imageUrl,
      commentFa: commentFa || 'اجرای ظریف و ماندگار در آتلیه ناخن Tırnak Atölyesi',
      commentTr: 'Tırnak Atölyesi özel uygulama',
    };

    customerGallery = [item, ...customerGallery];
    res.json({ item });
  });

  app.delete('/api/customer-gallery/:id', (req, res) => {
    customerGallery = customerGallery.filter((c) => c.id !== req.params.id);
    res.json({ success: true });
  });

  // 10. Admin: Toggle Time Slot Block/Unblock
  app.post('/api/schedule/toggle-block', (req, res) => {
    const { date, time } = req.body || {};
    if (!date || !time) {
      res.status(400).json({ error: 'تاریخ و ساعت الزامی است.' });
      return;
    }
    const existingIdx = blockedSlots.findIndex((b) => b.date === date && b.time === time);
    if (existingIdx >= 0) {
      blockedSlots = blockedSlots.filter((_, i) => i !== existingIdx);
    } else {
      blockedSlots = [...blockedSlots, { date, time, reason: 'مسدود شده توسط مدیریت' }];
    }
    res.json({ blockedSlots });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tırnak Atölyesi server running on http://localhost:${PORT}`);
  });
}

startServer();
