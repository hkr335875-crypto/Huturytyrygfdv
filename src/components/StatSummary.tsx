import React from 'react';
import { Users, CheckCircle2, Clock, Percent, AlertCircle } from 'lucide-react';
import { Assignment, ClassGroup, Student, Submission } from '../types';
import { toPersianDigits, findStudentSubmission } from '../utils/textNormalizer';

interface StatSummaryProps {
  assignment: Assignment;
  classGroup: ClassGroup;
  students: Student[];
  submissions: Submission[];
}

export const StatSummary: React.FC<StatSummaryProps> = ({
  assignment,
  classGroup,
  students,
  submissions,
}) => {
  const classStudents = students.filter((s) => s.classId === classGroup.id);
  const totalStudents = classStudents.length;

  // شمارش دقیق دانش‌آموزان تأیید شده (سبز) در این تکلیف
  const submittedCount = classStudents.filter(
    (st) => !!findStudentSubmission(st, submissions, assignment.id)
  ).length;
  const missingCount = Math.max(0, totalStudents - submittedCount);
  const progressPercent =
    totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {/* Stat 1: Total Students */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">کل دانش‌آموزان کلاس</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {toPersianDigits(totalStudents)}
          </span>
          <span className="text-xs text-slate-500">نفر</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 truncate">
          {classGroup.name}
        </div>
      </div>

      {/* Stat 2: Submitted */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">تکالیف ثبت شده</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {toPersianDigits(submittedCount)}
          </span>
          <span className="text-xs text-slate-500">نفر</span>
        </div>
        <div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
          <span>عبارت معتبر:</span>
          <span className="font-medium truncate">«{assignment.customTriggerPhrase || 'درود ارسال کردم'}»</span>
        </div>
      </div>

      {/* Stat 3: Missing */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">افراد انجام‌نداده</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {toPersianDigits(missingCount)}
          </span>
          <span className="text-xs text-slate-500">نفر در انتظار</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">مهلت: {toPersianDigits(assignment.deadline || 'تعیین نشده')}</span>
        </div>
      </div>

      {/* Stat 4: Progress Percentage */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">درصد مشارکت کلاس</span>
          <Percent className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {toPersianDigits(progressPercent)}٪
          </span>
          <span className="text-xs text-slate-500">تکمیل شده</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
