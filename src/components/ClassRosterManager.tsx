import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2, ShieldAlert, Check } from 'lucide-react';
import { ClassGroup, Student } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface ClassRosterManagerProps {
  classes: ClassGroup[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const ClassRosterManager: React.FC<ClassRosterManagerProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  students,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [baleUsername, setBaleUsername] = useState('');

  const currentClass = classes.find((c) => c.id === activeClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === activeClassId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentNumber.trim()) return;

    onAddStudent({
      fullName: fullName.trim(),
      studentNumber: studentNumber.trim(),
      baleUsername: baleUsername.trim().replace(/^@/, '') || undefined,
      baleUserId: `bale_${Date.now()}`,
      classId: activeClassId,
    });

    setFullName('');
    setStudentNumber('');
    setBaleUsername('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              دفتر اسامی دانش‌آموزان و تفکیک نام‌ها
            </h2>
            <p className="text-xs text-slate-500">
              جلوگیری از ثبت اشتباه افراد با نام و نام خانوادگی مشابه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Class Selector */}
          <select
            value={activeClassId}
            onChange={(e) => onSelectClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>افزودن دانش‌آموز</span>
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-emerald-50/50 border-b border-emerald-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-100"
        >
          <div>
            <label className="block text-slate-700 font-medium mb-1">نام و نام خانوادگی:</label>
            <input
              type="text"
              required
              placeholder="مثلا: علی محمدی راد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              شماره دانش‌آموزی / کد ملی:
            </label>
            <input
              type="text"
              required
              placeholder="مثلا: ۴۰۳۰۱۱۵"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              نام کاربری بله (اختیاری):
            </label>
            <input
              type="text"
              placeholder="ali_rad"
              value={baleUsername}
              onChange={(e) => setBaleUsername(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
            >
              ثبت در دفتر
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center">ردیف</th>
              <th className="py-3 px-4">نام و نام خانوادگی</th>
              <th className="py-3 px-4">کد دانش‌آموزی (شناسه یکتا)</th>
              <th className="py-3 px-4">حساب کاربری پیام‌رسان بله</th>
              <th className="py-3 px-4">کلاس</th>
              <th className="py-3 px-4 text-center">مدیریت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classStudents.map((st, index) => (
              <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                  {toPersianDigits(index + 1)}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {st.fullName}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono tabular-nums bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                    {toPersianDigits(st.studentNumber)}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  {st.baleUserId && /^\d+$/.test(st.baleUserId) ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                      🆔 {toPersianDigits(st.baleUserId)}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      ثبت خودکار پس از دریافت پیام
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {currentClass?.name}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onDeleteStudent(st.id)}
                    title="حذف دانش‌آموز"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
