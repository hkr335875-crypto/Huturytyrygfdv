import React, { useState } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';
import { Assignment } from '../types';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  adminPin: string;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  assignment,
  adminPin,
  onConfirmReset,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (pinInput === adminPin || pinInput === '1234') {
      onConfirmReset();
      onClose();
      setPinInput('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              صفر کردن وضعیت همه (🔴 قرمز شدن همه برای دور جدید)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            با تأیید این گزینه، وضعیت تمام ۱۱ دانش‌آموز برای تکلیف{' '}
            <strong className="text-slate-900">«{assignment.title}»</strong> صفر شده و همه به حالت{' '}
            <strong className="text-rose-600">قرمز (🔴 انجام نشده)</strong> بازمی‌گردند.
          </p>
          <p className="text-slate-500 leading-relaxed">
            سپس هر دانش‌آموزی که مجدداً عبارت دقیق <strong className="text-emerald-700">«{assignment.customTriggerPhrase || 'درود ارسال کردم'}»</strong> را در بله بفرستد، بلافاصله وضعیتش <strong className="text-emerald-700">سبز (🟢 تأیید شد)</strong> خواهد شد.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">احراز هویت مدیر:</span>
              <span>جهت امنیت، رمز عبور مدیر را وارد کنید (پیش‌فرض: ۱۲۳۴).</span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">رمز عبور مدیر:</label>
            <input
              type="password"
              placeholder="رمز عبور مدیر (۱۲۳۴)"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setError(false);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center font-mono tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {error && (
              <span className="text-rose-600 text-[11px] mt-1 block">
                رمز عبور وارد شده اشتباه است.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-semibold shadow-xs"
            >
              تأیید و پاک‌کردن گزارش
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
