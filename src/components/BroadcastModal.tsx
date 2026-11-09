import React, { useState } from 'react';
import {
  Send,
  X,
  Users,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Student } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  targetGroupId?: string;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  students,
  targetGroupId,
}) => {
  const [targetType, setTargetType] = useState<'all_pv' | 'selected_pv' | 'group'>('all_pv');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const validStudentsWithId = students.filter(
    (s) => s.baleUserId && /^\d+$/.test(String(s.baleUserId).trim())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !photoUrl.trim()) {
      setResultMsg({ type: 'error', text: 'لطفاً متن پیام یا لینک عکس را وارد کنید.' });
      return;
    }

    setIsSending(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/bale/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: '960742797', // Owner authentication
          text: messageText.trim(),
          photoUrl: photoUrl.trim() || undefined,
          targetType,
          studentIds: targetType === 'selected_pv' ? selectedStudentIds : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultMsg({
          type: 'success',
          text: `✅ پیام همگانی با موفقیت برای ${toPersianDigits(data.sentCount)} دانش‌آموز ارسال شد.`,
        });
        setMessageText('');
        setPhotoUrl('');
      } else {
        setResultMsg({
          type: 'error',
          text: data.error || 'خطا در ارسال پیام همگانی.',
        });
      }
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>ارسال پیام، عکس یا فایل به پیوی دانش‌آموزان</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  Broadcast PV
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ارسال مستقیم به پیام شخصی تمام دانش‌آموزان دارای شناسه عددی بله
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

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              ۱. انتخاب گیرندگان پیام:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all_pv')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'all_pv'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <div className="text-[11px]">همه در پیوی</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ({toPersianDigits(validStudentsWithId.length)} دانش‌آموز)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('selected_pv')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'selected_pv'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <div className="text-[11px]">انتخاب دستی</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ({toPersianDigits(selectedStudentIds.length)} نفر انتخاب‌شده)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('group')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'group'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <div className="text-[11px]">گروه درسی بله</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {targetGroupId ? toPersianDigits(targetGroupId) : 'گروه اصلی'}
                </div>
              </button>
            </div>
          </div>

          {/* If selected_pv, list of checkboxes */}
          {targetType === 'selected_pv' && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-40 overflow-y-auto space-y-1.5">
              <span className="font-semibold text-slate-700 text-[11px] block mb-1">
                دانش‌آموزان مورد نظر را انتخاب کنید:
              </span>
              {validStudentsWithId.length === 0 ? (
                <div className="text-slate-400 text-[11px]">هنوز هیچ دانش‌آموزی شناسه عددی فعال ندارد.</div>
              ) : (
                validStudentsWithId.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2 text-xs bg-white p-1.5 rounded-lg border border-slate-100 hover:border-emerald-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(st.id)}
                      onChange={() => toggleSelectStudent(st.id)}
                      className="rounded text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-900">{st.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({toPersianDigits(st.baleUserId || '')})</span>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Message Text */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              ۲. متن پیام ارسالی:
            </label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="مثال: دانش‌آموزان گرامی، لطفاً تکالیف املای درس ۴ را تا ساعت ۱۰ برای ربات بفرستید..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Photo URL or Attachment */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>۳. الصاق عکس یا فایل (اختیاری):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">لینک عکس یا فایل</span>
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/homework-photo.jpg یا شناسه فایل بله..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              💡 برای ارسال مستقیم در بله بدون نیاز به سایت، کافیست عکس یا فایلی را با کپشن <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/bc</code> برای ربات بفرستید.
            </p>
          </div>

          {resultMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium'
                  : 'bg-rose-50 border border-rose-200 text-rose-950'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              ارسال امن از طرف مالک (<span className="font-mono">{toPersianDigits('960742797')}</span>)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-xs disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                <span>{isSending ? 'در حال ارسال به پیوی...' : 'ارسال همگانی'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
