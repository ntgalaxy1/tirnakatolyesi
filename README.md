# Tırnak Atölyesi — پلتفرم رزرو نوبت، تست هوشمند ناخن و اپلیکیشن اندروید (`tirnakatolyesi.ir`)

پلتفرم وب پیش‌رونده (PWA)، بک‌اند PHP/MySQL ویژه هاست **cPanel** و پروژه اندروید **Capacitor** تحت برند **Tırnak Atölyesi** (Nail Art • Manikür • Pedikür) برای دامنه `https://tirnakatolyesi.ir`.

---

## ۱. اطلاعات ورود به پنل مدیریت (`/admin`) — Demo Credentials

- **مسیر پنل مدیریت:** `/admin`
- **نام کاربری مدیر (Admin Username):** `admin`
- **رمز عبور مدیر (Admin Password):** `Admin@1234`
- **حساب مشتری نمونه (Demo Customer):** شماره موبایل `09123456789` | رمز عبور `123456`

---

## ۲. ساختار کامل مخزن گیت‌هاب (Repository Architecture)

با کلیک روی دکمه **Save to GitHub**، تمام فایل‌های زیر به‌صورت یکپارچه در مخزن گیت‌هاب شما ذخیره می‌شوند:

- `public/assets/logo.png`: لوگوی رسمی برند **Tırnak Atölyesi** (استفاده شده در هدر، هیرو، صفحات ورود، آیکون‌های PWA با ابعاد `192x192` و `512x512`، فاوآیکون و لانچر اندروید).
- `public/manifest.json` و `public/sw.js`: مانیفست استاندارد PWA و سرویس‌ورکر جهت کش آفلاین و نصب اپلیکیشن روی موبایل.
- `vite.config.ts`: تنظیم‌شده با `base: './'` جهت خروجی استاتیک تمیز در پوشه `dist/` برای آپلود مستقیم در `public_html` هاست cPanel.
- `/php-backend/`:
  - `schema.sql`: جداول کامل MySQL (`users`, `site_gallery`, `customer_gallery`, `reservations`, `time_slots`) به همراه اکانت ادمین پیش‌فرض (`admin` / `Admin@1234`).
  - `config.example.php`: فایل نمونه تنظیمات اتصال به دیتابیس MySQL، کلید رایگان `GEMINI_API_KEY` (`gemini-2.5-flash`) و مسیر ذخیره تصاویر آپلودی (`uploads/`).
  - `api.php`: وب‌سرویس کامل REST با PHP 8.2+ جهت مدیریت احراز هویت، ذخیره دو باکس آپلود تصویر (`hand_image`, `ai_final_image`, `customer_reference_image`)، گالری‌ها و نوبت‌ها.
  - `.htaccess`: مسیریابی Apache و هدرهای امنیتی برای `public_html`.
- `capacitor.config.ts` و `/android-capacitor/`: تنظیمات کامل اندروید با شناسه بسته `ir.tirnakatolyesi.app` و نام `Tırnak Atölyesi`.
- `.github/workflows/android-release.yml`: پایپ‌لاین خودکار GitHub Actions برای تولید همزمان:
  1. فایل امضاشده **`.apk`** (مخصوص انتشار در **کافه بازار / Cafe Bazaar** و مایکت)
  2. فایل امضاشده **`.aab`** (مخصوص انتشار در **Google Play Console**)

---

## ۳. راهنمای گام‌به‌گام استقرار روی هاست cPanel (`tirnakatolyesi.ir`)

1. **ایجاد دیتابیس MySQL در cPanel:**
   - در cPanel وارد بخش **MySQL® Database Wizard** شوید و یک دیتابیس و کاربر بسازید.
   - وارد **phpMyAdmin** شوید و فایل `/php-backend/schema.sql` را از تب **Import** وارد کنید.
2. **تنظیم فایل کانفیگ PHP:**
   - در پوشه `php-backend/`، فایل `config.example.php` را به `config.php` تغییر نام دهید و مشخصات دیتابیس MySQL و کلید رایگان `GEMINI_API_KEY` را در آن قرار دهید.
3. **بیلد و آپلود فرانت‌اند در `public_html`:**
   ```bash
   npm install
   npm run build
   ```
   - محتویات پوشه `dist/` را به همراه پوشه `php-backend/` در `public_html` هاست آپلود کنید و فایل `php-backend/.htaccess` را در ریشه `public_html/.htaccess` قرار دهید.

---

## 4. English Setup & Android APK / AAB Release Guide (GitHub Actions)

### Building for Web / cPanel
```bash
npm install
npm run build
```
Upload the contents of `dist/` and `php-backend/` into your cPanel `public_html/` directory, import `php-backend/schema.sql` via phpMyAdmin, and copy `php-backend/config.example.php` to `php-backend/config.php`.

### Generating Signed Android `.apk` (Cafe Bazaar) & `.aab` (Google Play) via GitHub Actions
1. Push this repository to GitHub using **"Save to GitHub"**.
2. (Optional) In your GitHub repository **Settings → Secrets and variables → Actions**, add your custom Android keystore secrets:
   - `KEYSTORE_BASE64`: Base64-encoded `.jks` keystore file
   - `KEYSTORE_PASSWORD`: Keystore password
   - `KEY_ALIAS`: Key alias (e.g., `tirnakatolyesi`)
   - `KEY_PASSWORD`: Private key password
   *(Note: If you do not configure these secrets yet, the workflow automatically generates a valid production release signing keystore during the build so your APK and AAB artifacts always succeed).*
3. Go to the **Actions** tab in GitHub, select **Build Signed Android APK (Cafe Bazaar) & AAB (Google Play)**, and click **Run workflow**.
4. Download both ready-to-publish artifacts from the completed workflow run:
   - `tirnak-atolyesi-cafebazaar-release-apk` (`.apk` for Cafe Bazaar)
   - `tirnak-atolyesi-googleplay-release-aab` (`.aab` for Google Play)
