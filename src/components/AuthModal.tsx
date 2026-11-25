import React, { useState } from 'react';
import { Lock, LogIn, Phone, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { Language, UserAccount } from '../types';
import { t } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tr = t(lang);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { identifier, password }
          : { fullName, mobile: identifier, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tr.authErrorRequiredFields);
        setLoading(false);
        return;
      }

      onSuccess(data.user);
      onClose();
    } catch {
      setError(tr.validationErrorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setMode('login');
    setIdentifier('admin');
    setPassword('Admin@1234');
    setError(null);
  };

  const handleFillDemoCustomer = () => {
    setMode('login');
    setIdentifier('09123456789');
    setPassword('123456');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/65 backdrop-blur-xs p-4 text-start overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? tr.authModalLoginTitle : tr.authModalRegisterTitle}
    >
      <div className="w-[calc(100vw-2rem)] max-w-lg mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-5 sm:p-7 shadow-2xl text-[#3B132A] min-w-0">
        {/* Header with official brand logo */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#3B132A]/10 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi Official Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h2 className="font-brand-serif text-lg sm:text-xl font-bold text-[#3B132A] break-words">
                Tırnak Atölyesi
              </h2>
              <p className="text-xs text-[#3B132A]/75 mt-0.5 break-words">
                {mode === 'login' ? tr.authModalLoginTitle : tr.authModalRegisterTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-[#3B132A]/60 hover:bg-[#FAF0E6] hover:text-[#3B132A] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mt-5 rounded-xl bg-[#FAF0E6] w-full max-w-full min-w-0">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer break-words min-w-0 ${
              mode === 'login'
                ? 'bg-[#3B132A] text-[#FFFDFB] shadow-xs'
                : 'text-[#3B132A]/75 hover:text-[#3B132A]'
            }`}
          >
            {tr.authTabLogin}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer break-words min-w-0 ${
              mode === 'register'
                ? 'bg-[#3B132A] text-[#FFFDFB] shadow-xs'
                : 'text-[#3B132A]/75 hover:text-[#3B132A]'
            }`}
          >
            {tr.authTabRegister}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 w-full max-w-full min-w-0">
          {mode === 'register' && (
            <div className="w-full max-w-full min-w-0">
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-semibold text-[#3B132A] mb-1.5 break-words"
              >
                {tr.fullNameLabel}
              </label>
              <div className="relative w-full max-w-full min-w-0">
                <User className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 end-3.5 pointer-events-none" />
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tr.fullNamePlaceholder}
                  className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pe-10 ps-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                />
              </div>
            </div>
          )}

          <div className="w-full max-w-full min-w-0">
            <label
              htmlFor="auth-identifier"
              className="block text-xs font-semibold text-[#3B132A] mb-1.5 break-words"
            >
              {mode === 'login'
                ? `${tr.mobileLabel} / ${tr.authAdminUsernameLabel}`
                : tr.mobileLabel}
            </label>
            <div className="relative w-full max-w-full min-w-0">
              <Phone className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 end-3.5 pointer-events-none" />
              <input
                id="auth-identifier"
                type="text"
                required
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'login' ? '09123456789 / admin' : '09123456789'}
                className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pe-10 ps-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
          </div>

          <div className="w-full max-w-full min-w-0">
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-[#3B132A] mb-1.5 break-words"
            >
              {tr.authPasswordLabel}
            </label>
            <div className="relative w-full max-w-full min-w-0">
              <Lock className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 end-3.5 pointer-events-none" />
              <input
                id="auth-password"
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full max-w-full min-w-0 rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pe-10 ps-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2.5 text-xs font-medium text-[#D42663] break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-full min-w-0 py-3 px-4 rounded-xl bg-[#D42663] text-white text-sm font-semibold hover:bg-[#B81D53] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 break-words"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="break-words">{tr.authSubmitLoginBtn}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="break-words">{tr.authSubmitRegisterBtn}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Seeded Accounts Helper */}
        <div className="mt-5 pt-4 border-t border-[#3B132A]/10 space-y-2 w-full max-w-full min-w-0">
          <p className="text-[11px] text-[#3B132A]/70 font-medium break-words">
            {tr.authDemoAdminHint}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-full min-w-0">
            <button
              type="button"
              onClick={handleFillDemoCustomer}
              className="w-full max-w-full min-w-0 py-2 px-3 rounded-xl bg-[#FAF0E6] hover:bg-[#F7AD93]/30 text-xs font-medium text-[#3B132A] transition-colors text-center cursor-pointer break-words"
            >
              {lang === 'fa'
                ? 'مشتری دمو (09123456789)'
                : lang === 'tr'
                ? 'Demo Müşteri'
                : 'Demo Customer'}
            </button>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="w-full max-w-full min-w-0 py-2 px-3 rounded-xl bg-[#3B132A]/10 hover:bg-[#3B132A]/20 text-xs font-medium text-[#3B132A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer break-words"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D42663] shrink-0" />
              <span className="break-words">Admin (admin)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
