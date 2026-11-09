import React from 'react';
import { BookOpen, Calendar, Lock, Unlock, ShieldAlert, Sparkles } from 'lucide-react';
import { Assignment, ClassGroup } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface AssignmentSelectorProps {
  classes: ClassGroup[];
  assignments: Assignment[];
  activeClassId: string;
  activeAssignmentId: string;
  onSelectClass: (classId: string) => void;
  onSelectAssignment: (assignmentId: string) => void;
  onToggleAssignmentOpen: (assignmentId: string) => void;
  onOpenResetConfirm: () => void;
}

export const AssignmentSelector: React.FC<AssignmentSelectorProps> = ({
  classes,
  assignments,
  activeClassId,
  activeAssignmentId,
  onSelectClass,
  onSelectAssignment,
  onToggleAssignmentOpen,
  onOpenResetConfirm,
}) => {
  const currentAssignment = assignments.find((a) => a.id === activeAssignmentId);
  const classAssignments = assignments.filter((a) => a.classId === activeClassId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Class & Assignment Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              انتخاب کلاس:
            </label>
            <select
              value={activeClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              انتخاب تکلیف:
            </label>
            <select
              value={activeAssignmentId}
              onChange={(e) => onSelectAssignment(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[220px]"
            >
              {classAssignments.map((as) => (
                <option key={as.id} value={as.id}>
                  {as.subject}: {as.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Details */}
          {currentAssignment && (
            <div className="flex items-center gap-2 mt-4 sm:mt-5 text-xs text-slate-600">
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>مهلت: {toPersianDigits(currentAssignment.deadline || 'ندارد')}</span>
              </span>

              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>عبارت الزامی: «{currentAssignment.customTriggerPhrase || 'درود ارسال کردم'}»</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Controls & Submission Acceptance Lock */}
        {currentAssignment && (
          <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={() => onToggleAssignmentOpen(currentAssignment.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                currentAssignment.isOpen
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {currentAssignment.isOpen ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ثبت تکلیف: فعال است</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-red-700" />
                  <span>ثبت تکلیف: بسته شده</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenResetConfirm}
              title="صفر کردن وضعیت همه (قرمز شدن تا زمان ارسال دوباره کلمه)"
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>صفر کردن همه (🔴 قرمز شدن)</span>
            </button>
          </div>
        )}
      </div>

      {currentAssignment?.description && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{currentAssignment.description}</span>
        </div>
      )}
    </div>
  );
};
