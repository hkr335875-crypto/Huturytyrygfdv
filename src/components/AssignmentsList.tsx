import React from 'react';
import { BookOpen, Calendar, Lock, Unlock, CheckCircle, PlusCircle, Sparkles } from 'lucide-react';
import { Assignment, ClassGroup, Submission } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface AssignmentsListProps {
  assignments: Assignment[];
  classes: ClassGroup[];
  submissions: Submission[];
  activeAssignmentId: string;
  onSelectAssignment: (id: string) => void;
  onToggleOpen: (id: string) => void;
  onOpenNewAssignment: () => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({
  assignments,
  classes,
  submissions,
  activeAssignmentId,
  onSelectAssignment,
  onToggleOpen,
  onOpenNewAssignment,
}) => {
  const classMap = new Map<string, string>();
  classes.forEach((c) => classMap.set(c.id, c.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            فهرست تکالیف ادبیات در تمام کلاس‌ها
          </h2>
          <p className="text-xs text-slate-500">
            پشتیبانی از چند کلاس، چند درس و زمان‌بندی مهلت ارسال
          </p>
        </div>

        <button
          onClick={onOpenNewAssignment}
          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>تکلیف جدید (/new)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((as) => {
          const isActive = as.id === activeAssignmentId;
          const subCount = submissions.filter(
            (s) => s.assignmentId === as.id && s.status !== 'rejected'
          ).length;
          const className = classMap.get(as.classId) || 'کلاس عمومی';

          return (
            <div
              key={as.id}
              className={`bg-white border rounded-xl p-4 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header tag */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    {as.subject}
                  </span>
                  <span className="text-slate-500 text-[11px]">{className}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mb-2 leading-snug">
                  {as.title}
                </h3>

                {as.description && (
                  <p className="text-slate-500 text-[11px] mb-3 line-clamp-2 leading-relaxed">
                    {as.description}
                  </p>
                )}

                <div className="space-y-1.5 text-[11px] text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>مهلت ارسال:</span>
                    </span>
                    <span className="font-medium text-slate-800">
                      {toPersianDigits(as.deadline || 'نامحدود')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>عبارت معتبر:</span>
                    </span>
                    <span className="font-medium text-emerald-700">
                      «{as.customTriggerPhrase || 'درود ارسال کردم'}»
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">تکالیف ثبت شده:</span>
                    <span className="font-bold font-mono tabular-nums text-slate-900">
                      {toPersianDigits(subCount)} نفر
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => onToggleOpen(as.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors ${
                    as.isOpen
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {as.isOpen ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>ثبت فعال است</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>ثبت بسته شده</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSelectAssignment(as.id)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isActive ? 'انتخاب شده' : 'مشاهده پیشخوان'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
