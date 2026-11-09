import React from 'react';
import { BookOpen, PlusCircle, FileSpreadsheet, Send, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'submissions' | 'simulator' | 'roster' | 'assignments';
  setActiveTab: (tab: 'submissions' | 'simulator' | 'roster' | 'assignments') => void;
  onOpenNewAssignment: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
  botStatusOk: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAssignment,
  onOpenReport,
  onOpenSettings,
  botStatusOk,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark with 24/7 live indicator */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                ربات پشتیبان ادبیات
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>پایش ۲۴ ساعته بله</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              @Literaturebot · ble.ir/Literaturebot
            </div>
          </div>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'submissions'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            پیشخوان تکالیف
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>آزمون‌گر هوشمند بله</span>
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'roster'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            اسامی ۱۱ دانش‌آموز
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'assignments'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-slate-900'
            }`}
          >
            فهرست تکالیف و دروس
          </button>
        </nav>

        {/* Zone 3: 1 primary action and utility controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSettings}
            title="تنظیمات ربات و توکن بله"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="hidden lg:inline">
              {botStatusOk ? 'متصل به بله' : 'تنظیمات بازو'}
            </span>
          </button>

          <button
            onClick={onOpenReport}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <span>گزارش کلاسی (/report)</span>
          </button>

          <button
            onClick={onOpenNewAssignment}
            className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تکلیف جدید (/new)</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-2 text-xs bg-slate-50">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-1 px-2 rounded font-medium ${
            activeTab === 'submissions' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
          }`}
        >
          پیشخوان
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`py-1 px-2 rounded font-medium ${
            activeTab === 'simulator' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
          }`}
        >
          آزمون پیام بله
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-1 px-2 rounded font-medium ${
            activeTab === 'roster' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
          }`}
        >
          دانش‌آموزان
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-1 px-2 rounded font-medium ${
            activeTab === 'assignments' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
          }`}
        >
          تکالیف
        </button>
      </div>
    </header>
  );
};
