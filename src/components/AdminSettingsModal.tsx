import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Key, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { BotConfig } from '../types';
import { fetchBaleBotInfo, BaleBotInfo } from '../services/baleApi';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onSaveConfig: (newConfig: BotConfig) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<BotConfig>(config);
  const [checkingBot, setCheckingBot] = useState(false);
  const [botInfo, setBotInfo] = useState<BaleBotInfo | null>(null);
  const [botError, setBotError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(config);
    if (isOpen) {
      checkBotConnection(config.baleToken);
    }
  }, [config, isOpen]);

  const checkBotConnection = async (token: string) => {
    setCheckingBot(true);
    setBotError(null);
    const res = await fetchBaleBotInfo(token);
    setCheckingBot(false);
    if (res.success && res.data) {
      setBotInfo(res.data);
    } else {
      setBotInfo(null);
      setBotError(res.error || 'ارتباط با سرور بله برقرار نشد');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                تنظیمات پیشرفته و اتصال پیام‌رسان بله
              </h2>
              <span className="text-[11px] text-slate-500">
                مدیریت توکن @Literaturebot و قواعد پایش
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {/* Bale Bot Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>وضعیت بازوی بله:</span>
                <a
                  href={`https://${formData.botLink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>{formData.botUsername}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>

              <button
                type="button"
                onClick={() => checkBotConnection(formData.baleToken)}
                disabled={checkingBot}
                className="px-2.5 py-1 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${checkingBot ? 'animate-spin' : ''}`} />
                <span>بررسی اتصال</span>
              </button>
            </div>

            {botInfo ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-950 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold">اتصال با سرور بله برقرار است!</div>
                  <div className="text-[11px] text-emerald-800 font-mono">
                    نام: {botInfo.first_name || 'Literaturebot'} | شناسه: @{botInfo.username || 'Literaturebot'}
                  </div>
                </div>
              </div>
            ) : botError ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  وضعیت وب‌هوک / سرور: {botError} (سیستم از حالت شبیه‌ساز ابری و پایش مستقیم بهره می‌برد).
                </div>
              </div>
            ) : null}

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                توکن اختصاصی بازوی بله (Bale Bot Token):
              </label>
              <input
                type="text"
                required
                value={formData.baleToken}
                onChange={(e) => setFormData({ ...formData, baleToken: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Trigger Phrase & Smart Detection Rules */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="font-bold text-slate-800 block">
              قواعد تشخیص و پالایش پیام‌ها:
            </span>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                عبارت پیش‌فرض ثبت تکلیف:
              </label>
              <input
                type="text"
                value={formData.defaultTriggerPhrase}
                onChange={(e) => setFormData({ ...formData, defaultTriggerPhrase: e.target.value })}
                placeholder="درود ارسال کردم"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                پیام‌هایی با تک‌کلمه مثل «درود»، «ارسال» یا «کردم» نادیده گرفته خواهند شد.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div>
                <span className="font-medium text-slate-800 block">رد پیام‌های فوروارد شده:</span>
                <span className="text-[10px] text-slate-500">
                  جلوگیری از ارسال تکالیف فوروارد شده از افراد دیگر
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.rejectForwards}
                onChange={(e) => setFormData({ ...formData, rejectForwards: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div>
                <span className="font-medium text-slate-800 block">رد پیام‌های نقل‌قول شده (Quote):</span>
                <span className="text-[10px] text-slate-500">
                  عدم پذیرش پاسخ‌های ریپلای شده به چت‌های متفرقه
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.rejectQuotes}
                onChange={(e) => setFormData({ ...formData, rejectQuotes: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Admin Security PIN */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>رمز عبور مدیریت (Admin PIN):</span>
            </span>

            <div>
              <input
                type="text"
                value={formData.adminPin}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                placeholder="۱۲۳۴"
                className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mr-2">
                برای تأیید دستورات حساس مانند بازنشانی (/reset)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors font-semibold shadow-xs"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
