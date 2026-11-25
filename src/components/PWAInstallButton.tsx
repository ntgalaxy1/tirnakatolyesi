import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Language } from '../types';
import { t } from '../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'toolbar' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'toolbar',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const tr = t(lang);

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
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          variant === 'toolbar'
            ? 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3B132A] text-[#FFFDFB] text-xs font-medium hover:bg-[#521B3B] transition-colors cursor-pointer max-w-full min-w-0 break-words'
            : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D42663] text-white text-sm font-medium hover:bg-[#B81D53] transition-colors cursor-pointer max-w-full min-w-0 break-words'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span className="break-words">{tr.installAppBtn} (PWA / Android)</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/60 backdrop-blur-xs p-4 text-start overflow-x-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={tr.installAppBtn}
        >
          <div className="w-[calc(100vw-2rem)] max-w-lg mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-6 shadow-xl text-[#3B132A] min-w-0">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#3B132A]/10 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Tırnak Atölyesi Logo"
                  className="w-10 h-10 rounded-lg object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#3B132A] break-words">
                    {tr.installAppBtn} — Tırnak Atölyesi
                  </h3>
                  <p className="text-xs text-[#3B132A]/70 break-words">
                    tirnakatolyesi.ir • PWA & Android
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close"
                className="p-2 rounded-lg text-[#3B132A]/70 hover:bg-[#FAF0E6] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3B132A]/85 min-w-0">
              {lang === 'fa' ? (
                <>
                  <p className="font-medium text-[#3B132A] break-words">
                    اپلیکیشن وب پیش‌رونده (PWA) و نسخه اندروید آتلیه ناخن آماده نصب روی گوشی شماست:
                  </p>
                  <div className="rounded-xl bg-[#FAF0E6] p-3.5 space-y-2 text-xs break-words">
                    <p>
                      <strong>۱. در اندروید (Chrome):</strong> روی منوی سه‌نقطه مرورگر بزنید و گزینه{' '}
                      <span className="font-bold text-[#D42663]">Install App / افزودن به صفحه اصلی</span>{' '}
                      را انتخاب کنید.
                    </p>
                    <p>
                      <strong>۲. در آیفون (Safari):</strong> دکمه{' '}
                      <span className="font-bold text-[#D42663]">Share</span> در پایین صفحه را بزنید و گزینه{' '}
                      <span className="font-bold text-[#D42663]">Add to Home Screen</span> را انتخاب نمایید.
                    </p>
                    <p>
                      <strong>۳. کافه بازار و گوگل پلی:</strong> پکیج رسمی اندروید (
                      <code className="font-mono break-all">ir.tirnakatolyesi.app</code>) با آیکون رسمی برند آماده انتشار است.
                    </p>
                  </div>
                </>
              ) : lang === 'tr' ? (
                <>
                  <p className="font-medium text-[#3B132A] break-words">
                    Tırnak Atölyesi mobil uygulamasını ana ekranınıza hemen ekleyebilirsiniz:
                  </p>
                  <div className="rounded-xl bg-[#FAF0E6] p-3.5 space-y-2 text-xs break-words">
                    <p>
                      <strong>1. Android (Chrome):</strong> Tarayıcı menüsünden{' '}
                      <span className="font-bold text-[#D42663]">Uygulamayı Yükle / Ana Ekrana Ekle</span>{' '}
                      seçeneğine dokunun.
                    </p>
                    <p>
                      <strong>2. iOS (Safari):</strong> Alt barda bulunan{' '}
                      <span className="font-bold text-[#D42663]">Paylaş (Share)</span> butonuna ve ardından{' '}
                      <span className="font-bold text-[#D42663]">Ana Ekrana Ekle</span> seçeneğine dokunun.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-[#3B132A] break-words">
                    Install the Tırnak Atölyesi Progressive Web App or Android app on your device:
                  </p>
                  <div className="rounded-xl bg-[#FAF0E6] p-3.5 space-y-2 text-xs break-words">
                    <p>
                      <strong>1. Android (Chrome):</strong> Tap the browser menu and select{' '}
                      <span className="font-bold text-[#D42663]">Install App / Add to Home Screen</span>.
                    </p>
                    <p>
                      <strong>2. iOS (Safari):</strong> Tap the{' '}
                      <span className="font-bold text-[#D42663]">Share</span> button at the bottom and choose{' '}
                      <span className="font-bold text-[#D42663]">Add to Home Screen</span>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end w-full max-w-full min-w-0">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full max-w-full min-w-0 py-2.5 px-4 rounded-xl bg-[#3B132A] text-white text-sm font-medium hover:bg-[#521B3B] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'متوجه شدم' : lang === 'tr' ? 'Anladım' : 'Got It'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
