# راهنمای استقرار روی هاست cPanel (`tirnakatolyesi.ir`) و خروجی اندروید (کافه بازار و گوگل پلی)

این مستند مراحل کامل راه‌اندازی پلتفرم **Tırnak Atölyesi** را روی هاست **cPanel** دامنه `https://tirnakatolyesi.ir` و همچنین دریافت خروجی‌های رسمی **`.apk`** (برای کافه بازار و مایکت) و **`.aab`** (برای Google Play) شرح می‌دهد.

---

## بخش اول: استقرار روی هاست cPanel دامنه `tirnakatolyesi.ir`

### ۱. ساخت دیتابیس MySQL در cPanel
1. وارد پنل **cPanel** هاست خود شوید و به بخش **MySQL® Database Wizard** بروید.
2. یک دیتابیس جدید (مثلاً `tirnakat_db`) و یک کاربر دیتابیس (مثلاً `tirnakat_user`) بسازید و دسترسی **ALL PRIVILEGES** را به آن بدهید.
3. وارد **phpMyAdmin** شوید، دیتابیس ساخته‌شده را انتخاب کنید و از تب **Import** فایل `/php-backend/schema.sql` را ایمپورت کنید.
   - این فایل جدول‌های `users`، `site_gallery`، `customer_gallery`، `reservations` و `slots` را به همراه حساب ادمین پیش‌فرض (`admin` / `Admin@1234`) ایجاد می‌کند.

### ۲. بیلد فرانت‌اند و آپلود در `public_html`
1. در سیستم خود دستور زیر را اجرا کنید تا خروجی نهایی ساخته شود:
   ```bash
   npm install
   npm run build
   ```
2. محتویات پوشه `dist/` (شامل `index.html`، `manifest.json`، `sw.js`، `assets/logo.png` و آیکون‌های PWA) را مستقیماً در پوشه `public_html` هاست cPanel آپلود کنید.
3. پوشه `php-backend/` را نیز در `public_html/php-backend/` قرار دهید و فایل `php-backend/.htaccess` را به ریشه `public_html/.htaccess` منتقل کنید.

### ۳. تنظیم امن کلید هوش مصنوعی `GEMINI_API_KEY` در سرور
برای اینکه کلید هوش مصنوعی هرگز در مرورگر لو نرود، در فایل `.htaccess` یا بخش تنظیمات PHP-FPM / Environment Variables در cPanel مقادیر زیر را قرار دهید:
```apache
SetEnv DB_HOST "localhost"
SetEnv DB_NAME "tirnakat_db"
SetEnv DB_USER "tirnakat_user"
SetEnv DB_PASS "YOUR_MYSQL_PASSWORD"
SetEnv GEMINI_API_KEY "YOUR_GOOGLE_GEMINI_API_KEY"
```

---

## بخش دوم: تولید خروجی اندروید (`.apk` برای کافه بازار و `.aab` برای Google Play)

تنظیمات کامل **Capacitor** با شناسه بسته رسمی `ir.tirnakatolyesi.app` و نام `Tırnak Atölyesi` در پوشه `/android-capacitor` و پایپ‌لاین خودکار در `.github/workflows/android-release.yml` قرار دارد.

### روش اول: بیلد خودکار با GitHub Actions (بدون نیاز به نصب Android Studio)
1. پروژه را در یک مخزن GitHub قرار دهید.
2. در تب **Actions** مخزن، ورک‌فلوی **Build Signed Android APK (Cafe Bazaar) & AAB (Google Play)** را انتخاب کرده و روی **Run workflow** کلیک کنید.
3. پس از اتمام بیلد، دو فایل زیر در بخش **Artifacts** آماده دانلود خواهند بود:
   - **`tirnak-atolyesi-cafebazaar-release-apk`**: فایل `.apk` امضاشده (Signed Release APK) آماده بارگذاری مستقیم در پنل توسعه‌دهندگان **کافه بازار (Cafe Bazaar)** و **مایکت (Myket)**.
   - **`tirnak-atolyesi-googleplay-release-aab`**: فایل `.aab` امضاشده (Signed Android App Bundle) آماده بارگذاری در **Google Play Console**.

### روش دوم: بیلد محلی با Android Studio / خط فرمان
```bash
npm run build
cd android-capacitor
npm install
npx cap add android
npm run generate-icons
npx cap sync android
cd android
./gradlew assembleRelease bundleRelease
```
- مسیر خروجی APK کافه بازار: `android-capacitor/android/app/build/outputs/apk/release/app-release.apk`
- مسیر خروجی AAB گوگل پلی: `android-capacitor/android/app/build/outputs/bundle/release/app-release.aab`
