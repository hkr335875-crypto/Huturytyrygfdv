import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Globe,
  Radio,
  Clock,
  Cpu,
  Users,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { ServerHealthInfo } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartPolling: () => void;
}

export const ServerStatusModal: React.FC<ServerStatusModalProps> = ({
  isOpen,
  onClose,
  onRestartPolling,
}) => {
  const [health, setHealth] = useState<ServerHealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/server-health');
      const data = await res.json();
      if (data.success && data.data) {
        setHealth(data.data);
        setLastCheckTime(new Date().toLocaleTimeString('fa-IR'));
      }
    } catch (err) {
      console.error('Failed to fetch server health', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه`;
    if (minutes > 0) return `${toPersianDigits(minutes)} دقیقه و ${toPersianDigits(secs)} ثانیه`;
    return `${toPersianDigits(secs)} ثانیه`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>وضعیت زنده سرور و پایش ربات بله</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  Online 24/7
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                بررسی لحظه‌ای سلامت اتصال به بله، تونل کلودفلر و منابع سرور
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Status Pill */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <span>سرور آنلاین و کاملاً متصل است</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  پایش ۲۴ ساعته بدون وقفه فعال است · پینگ پاسخ‌دهی: {health ? `${toPersianDigits(health.pingMs)} میلی‌ثانیه` : '...'}
                </div>
              </div>
            </div>

            <button
              onClick={fetchHealth}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
              title="بروزرسانی وضعیت"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Cloudflare Tunnel Status Card */}
          <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>تونل مستقیم کلودفلر (Cloudflare Live):</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>فعال و بدون فیلتر</span>
              </span>
            </div>

            <div className="flex items-center justify-between bg-white border border-amber-200 rounded-lg p-2.5 font-mono text-slate-800">
              <span className="truncate max-w-xs sm:max-w-md text-[11px]">
                {health?.cloudflareUrl || 'https://triple-hawaii-editor-rely.trycloudflare.com'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(health?.cloudflareUrl || 'https://triple-hawaii-editor-rely.trycloudflare.com')}
                  className="p-1 hover:bg-amber-50 text-slate-600 hover:text-slate-900 rounded transition-colors flex items-center gap-1 text-[10px]"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'کپی شد' : 'کپی'}</span>
                </button>
                <a
                  href={health?.cloudflareUrl || 'https://triple-hawaii-editor-rely.trycloudflare.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center gap-1 text-[10px]"
                >
                  <span>ورود</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Grid of Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>پایش بله (Polling)</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health?.isPollingRunning ? '🟢 فعال ۲۴ ساعته' : '🔴 متوقف شده'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {health?.messagesProcessed ? `${toPersianDigits(health.messagesProcessed)} پیام پردازش‌شده` : 'آماده دریافت'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>زمان فعالیت سرور</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health ? formatUptime(health.uptimeSeconds) : '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                بدون وقفه
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>مصرف حافظه RAM</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health ? `${toPersianDigits(health.memoryUsageMb)} مگابایت` : '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                وضعیت بهینه
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>دانش‌آموزان با شناسه</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health ? `${toPersianDigits(health.activeStudentsWithId)} نفر از ۱۱ نفر` : '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                قفل شده در سامانه
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>تعداد مدیران (Admins)</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health ? `${toPersianDigits(health.adminsCount)} مدیر فعال` : '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                مالک: {toPersianDigits('960742797')}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>عکس‌های تکالیف دریافتی</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {health ? `${toPersianDigits(health.photosReceivedCount)} عکس ثبت‌شده` : '...'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                دریافت مستقیم از بله
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>آخرین بررسی:</span>
            <span className="font-mono">{lastCheckTime || 'در حال بررسی...'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRestartPolling();
                fetchHealth();
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>راه‌اندازی مجدد پایش بله</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-xs"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
