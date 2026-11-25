import React, { useState } from 'react';
import { Lock, LogIn, Phone, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { Language, UserAccount } from '../types';

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
        setError(data.error || 'خطا در احراز هویت');
        setLoading(false);
        return;
      }

      onSuccess(data.user);
      onClose();
    } catch {
      setError('خطا در برقراری ارتباط با سرور');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B132A]/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'fa' ? 'ورود و عضویت در آتلیه ناخن' : 'Giriş ve Kayıt'}
    >
      <div className="w-full max-w-md rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/15 p-6 sm:p-7 shadow-2xl text-[#3B132A]">
        {/* Header with official brand logo */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#3B132A]/10">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Tırnak Atölyesi Official Logo"
              className="w-14 h-14 rounded-xl object-contain bg-[#FAF0E6] p-1 border border-[#3B132A]/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="font-brand-serif text-xl font-bold text-[#3B132A]">
                Tırnak Atölyesi
              </h2>
              <p className="text-xs text-[#3B132A]/75 mt-0.5">
                {lang === 'fa'
                  ? 'حساب کاربری مشتریان و مدیریت سالن'
                  : 'Müşteri & Salon Yönetim Hesabı'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره ورود"
            className="p-2 rounded-xl text-[#3B132A]/60 hover:bg-[#FAF0E6] hover:text-[#3B132A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mt-5 rounded-xl bg-[#FAF0E6]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#3B132A] text-[#FFFDFB] shadow-sm'
                : 'text-[#3B132A]/75 hover:text-[#3B132A]'
            }`}
          >
            {lang === 'fa' ? 'ورود به حساب' : 'Giriş Yap'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#3B132A] text-[#FFFDFB] shadow-sm'
                : 'text-[#3B132A]/75 hover:text-[#3B132A]'
            }`}
          >
            {lang === 'fa' ? 'عضویت مشتری جدید' : 'Yeni Üyelik'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-semibold text-[#3B132A] mb-1.5"
              >
                {lang === 'fa' ? 'نام و نام خانوادگی' : 'Ad Soyad'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 right-3.5 pointer-events-none" />
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'fa' ? 'مثلاً: سارا محمدی' : 'Selin Yılmaz'}
                  className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pr-10 pl-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-identifier"
              className="block text-xs font-semibold text-[#3B132A] mb-1.5"
            >
              {mode === 'login'
                ? lang === 'fa'
                  ? 'شماره موبایل یا نام کاربری ادمین'
                  : 'Cep Telefonu veya Kullanıcı Adı'
                : lang === 'fa'
                ? 'شماره موبایل'
                : 'Cep Telefonu'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                id="auth-identifier"
                type="text"
                required
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'login' ? '09123456789 / admin' : '09123456789'}
                className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pr-10 pl-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-[#3B132A] mb-1.5"
            >
              {lang === 'fa' ? 'رمز عبور' : 'Şifre'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#3B132A]/50 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                id="auth-password"
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#FAF0E6]/70 border border-[#3B132A]/15 py-2.5 pr-10 pl-3.5 text-sm text-[#3B132A] focus:outline-none focus:border-[#D42663]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-[#D42663]/10 border border-[#D42663]/30 px-3.5 py-2.5 text-xs font-medium text-[#D42663]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#D42663] text-white text-sm font-semibold hover:bg-[#B81D53] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{lang === 'fa' ? 'ورود به حساب کاربری' : 'Giriş Yap'}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'fa' ? 'ثبت‌نام و ایجاد حساب' : 'Hesap Oluştur'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Seeded Accounts Helper */}
        <div className="mt-5 pt-4 border-t border-[#3B132A]/10 space-y-2">
          <p className="text-[11px] text-[#3B132A]/70 font-medium">
            {lang === 'fa'
              ? 'دسترسی سریع جهت تست (حساب‌های پیش‌فرض):'
              : 'Hızlı Test İçin Hazır Hesaplar:'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillDemoCustomer}
              className="py-2 px-3 rounded-xl bg-[#FAF0E6] hover:bg-[#F7AD93]/30 text-xs font-medium text-[#3B132A] transition-colors text-center cursor-pointer"
            >
              {lang === 'fa' ? 'مشتری دمو (سارا رضایی)' : 'Demo Müşteri'}
            </button>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="py-2 px-3 rounded-xl bg-[#3B132A]/10 hover:bg-[#3B132A]/20 text-xs font-medium text-[#3B132A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D42663]" />
              <span>{lang === 'fa' ? 'مدیر سالن (admin)' : 'Admin (admin)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
