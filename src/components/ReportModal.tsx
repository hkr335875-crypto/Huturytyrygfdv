import React, { useState } from 'react';
import { X, Copy, Check, Download, Send, AlertCircle, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Assignment, ClassGroup, Student, Submission, BotConfig } from '../types';
import { generateLiteratureReport } from '../utils/reportGenerator';
import { exportHomeworkToCSV } from '../utils/excelExport';
import { sendBaleMessage } from '../services/baleApi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  classGroup: ClassGroup;
  students: Student[];
  submissions: Submission[];
  config: BotConfig;
  onUpdateConfig: (cfg: Partial<BotConfig>) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  assignment,
  classGroup,
  students,
  submissions,
  config,
  onUpdateConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [targetChatId, setTargetChatId] = useState(config.targetGroupId || '');
  const [isSendingToBale, setIsSendingToBale] = useState(false);
  const [baleSendResult, setBaleSendResult] = useState<{ success: boolean; msg: string } | null>(
    null
  );

  if (!isOpen) return null;

  const reportText = generateLiteratureReport({
    assignment,
    classGroup,
    allStudents: students,
    submissions,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    exportHomeworkToCSV(assignment, classGroup, students, submissions);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  const handleSendToBale = async () => {
    if (!targetChatId.trim()) {
      setBaleSendResult({ success: false, msg: 'لطفاً شناسه گروه یا کاربر در بله را وارد کنید.' });
      return;
    }

    setIsSendingToBale(true);
    setBaleSendResult(null);

    const res = await sendBaleMessage(config.baleToken, targetChatId.trim(), reportText);
    setIsSendingToBale(false);

    if (res.success) {
      setBaleSendResult({
        success: true,
        msg: 'گزارش با موفقیت از طریق @Literaturebot به گروه بله ارسال شد!',
      });
      onUpdateConfig({ targetGroupId: targetChatId });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setBaleSendResult({
        success: false,
        msg: `خطا در ارسال: ${res.error}. مطمئن شوید بازو عضو گروه است و دسترسی ارسال پیام دارد.`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                گزارش رسمی تکالیف ادبیات (/report)
              </h2>
              <p className="text-xs text-slate-500">
                {classGroup.name} · {assignment.subject}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Preview */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <pre className="font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
              {reportText}
            </pre>
          </div>

          {/* Send to Bale Group Box */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-700" />
                <span>ارسال مستقیم گزارش به گروه بله</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">@Literaturebot</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="شناسه گروه یا کانال بله (مثلا 12345678 یا نام کاربری)"
                value={targetChatId}
                onChange={(e) => setTargetChatId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSendToBale}
                disabled={isSendingToBale}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingToBale ? 'در حال ارسال...' : 'ارسال به بله'}</span>
              </button>
            </div>

            {baleSendResult && (
              <div
                className={`text-xs p-2 rounded-lg flex items-start gap-1.5 ${
                  baleSendResult.success
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{baleSendResult.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            امکان خروجی اکسل یا اشتراک‌گذاری در پیام‌رسان‌ها
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>خروجی اکسل (Excel)</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>متن کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی متن گزارش</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
