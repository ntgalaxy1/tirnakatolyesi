import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Language } from '../types';
import { t } from '../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  lang: Language;
  variant?: 'header' | 'banner';
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  lang,
  variant = 'header',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const copy = t(lang);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return;
    }
    setShowGuideModal(true);
  };

  if (variant === 'banner') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 rounded-xl border border-[#3B132A]/20 bg-[#FFFDFB] px-4 py-2.5 text-xs font-semibold text-[#3B132A] hover:border-[#D42663] hover:text-[#D42663] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-[#D42663]" />
          <span>{copy.installAppBtn} (PWA / Android)</span>
        </button>
        {showGuideModal && (
          <InstallModal lang={lang} onClose={() => setShowGuideModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label={copy.installAppBtn}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3B132A]/15 bg-[#FAF0E6]/80 px-3 py-2 text-xs font-semibold text-[#3B132A] hover:bg-[#3B132A] hover:text-[#FFFDFB] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-[#D42663]" />
        <span className="hidden sm:inline">{copy.installAppBtn}</span>
      </button>

      {showGuideModal && (
        <InstallModal lang={lang} onClose={() => setShowGuideModal(false)} />
      )}
    </>
  );
};

const InstallModal: React.FC<{ lang: Language; onClose: () => void }> = ({ lang, onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 shadow-2xl text-[#3B132A]">
        <div className="flex items-center justify-between border-b border-[#3B132A]/10 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10"
            />
            <div>
              <h3 className="text-base font-bold">
                {lang === 'fa'
                  ? 'نصب وب‌اپلیکیشن و نسخه اندروید Tırnak Atölyesi'
                  : 'Tırnak Atölyesi PWA & Android Kurulumu'}
              </h3>
              <p className="text-xs text-[#3B132A]/70">tirnakatolyesi.ir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install dialog"
            className="p-1.5 rounded-lg hover:bg-[#FAF0E6] text-[#3B132A]/70 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3B132A]/90">
          {lang === 'fa' ? (
            <>
              <p>
                <strong>۱. نصب در اندروید (Chrome) و دسکتاپ:</strong> از منوی مرورگر گزینه{' '}
                <span className="font-bold text-[#D42663]">Install App / Add to Home Screen</span> را
                انتخاب کنید تا اپلیکیشن با آیکون رسمی روی گوشی شما نصب شود.
              </p>
              <p>
                <strong>۲. نصب در آیفون (iOS Safari):</strong> دکمه{' '}
                <span className="font-bold">Share</span> در پایین مرورگر را لمس کرده و گزینه{' '}
                <span className="font-bold text-[#D42663]">Add to Home Screen</span> را بزنید.
              </p>
              <p className="text-xs text-[#3B132A]/70 pt-1">
                همچنین نسخه APK مخصوص کافه‌بازار و نسخه AAB مخصوص گوگل‌پلی در پوشه{' '}
                <code className="font-mono">/android-capacitor</code> پروژه پیکربندی شده است.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Android (Chrome) & Masaüstü:</strong> Tarayıcı menüsünden{' '}
                <span className="font-bold text-[#D42663]">Uygulamayı Yükle / Ana Ekrana Ekle</span>{' '}
                seçeneğine dokunun.
              </p>
              <p>
                <strong>2. iPhone (iOS Safari):</strong> Alt menüdeki{' '}
                <span className="font-bold">Paylaş (Share)</span> butonuna ve ardından{' '}
                <span className="font-bold text-[#D42663]">Ana Ekrana Ekle</span> seçeneğine dokunun.
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#3B132A] py-2.5 text-sm font-semibold text-[#FFFDFB] hover:bg-[#D42663] transition-colors cursor-pointer"
        >
          {lang === 'fa' ? 'متوجه شدم' : 'Tamam'}
        </button>
      </div>
    </div>
  );
};
