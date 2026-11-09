import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  ZoomIn,
} from 'lucide-react';
import { Submission, SubmissionPhoto } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface StudentPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
}

export const StudentPhotosModal: React.FC<StudentPhotosModalProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen || !submission) return null;

  const photos: SubmissionPhoto[] = submission.photos || [];

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 text-center shadow-xl">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">عکسی برای این دانش‌آموز ثبت نشده است</h3>
          <p className="text-xs text-slate-500 mt-1">
            دانش‌آموز می‌تواند عکس تکلیف خود را مستقیماً در پیوی ربات بله ارسال کند.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs"
          >
            بستن
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[selectedIndex] || photos[0];
  const photoUrl = `/api/bale/file-proxy/${currentPhoto.fileId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>عکس‌های تکلیف ارسالی: {submission.studentName}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  {toPersianDigits(photos.length)} تصویر
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                شناسه بله: {toPersianDigits(submission.baleUserId)} · دریافت مستقیم از بات بله
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

        {/* Body Viewport */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden relative">
          <img
            src={photoUrl}
            alt={currentPhoto.caption || 'تکلیف دانش‌آموز'}
            className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
            onError={(e) => {
              // Fallback placeholder
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><text x="50%" y="50%" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">تصویر در سرور بله ثبت شد</text></svg>';
            }}
          />

          {/* Navigation controls if multiple photos */}
          {photos.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="pointer-events-auto p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="pointer-events-auto p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentPhoto.caption && (
            <div className="mt-2 text-center text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 max-w-md">
              📝 توضیحات دانش‌آموز: {currentPhoto.caption}
            </div>
          )}
        </div>

        {/* Thumbnails row if multiple */}
        {photos.length > 1 && (
          <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
            {photos.map((p, idx) => (
              <button
                key={p.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={`/api/bale/file-proxy/${p.fileId}`}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>زمان دریافت: {currentPhoto.jalaliTime || 'امروز'}</span>
            </span>
            <span className="font-mono text-slate-400">
              تصویر {toPersianDigits(selectedIndex + 1)} از {toPersianDigits(photos.length)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <span>مشاهده در اندازه اصلی</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

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
