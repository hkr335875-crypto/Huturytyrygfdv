import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
} from 'lucide-react';
import { Assignment, ClassGroup, Student, Submission, SubmissionStatus } from '../types';
import { toPersianDigits, normalizePersianText, findStudentSubmission } from '../utils/textNormalizer';

interface SubmissionTableProps {
  assignment: Assignment;
  classGroup: ClassGroup;
  students: Student[];
  submissions: Submission[];
  onUpdateSubmissionStatus: (submissionId: string, newStatus: SubmissionStatus) => void;
  onUpdateSubmissionDetails: (submissionId: string, score?: string, teacherNote?: string) => void;
  onManualAddSubmission: (student: Student) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onLinkStudentBaleId?: (studentId: string, numericId: string) => void;
  onViewPhotos?: (sub: Submission) => void;
}

export const SubmissionTable: React.FC<SubmissionTableProps> = ({
  assignment,
  classGroup,
  students,
  submissions,
  onUpdateSubmissionStatus,
  onUpdateSubmissionDetails,
  onManualAddSubmission,
  onDeleteSubmission,
  onLinkStudentBaleId,
  onViewPhotos,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'submitted' | 'missing' | 'revision'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState('');
  const [editNote, setEditNote] = useState('');

  // فهرست دانش‌آموزان کلاس به علاوه سایر کاربرانی که عبارت «درود ارسال کردم» را فرستاده و ثبت شده‌اند
  const classStudents = useMemo(() => {
    const list = [...students.filter((s) => s.classId === classGroup.id || !s.classId)];
    submissions.forEach((sub) => {
      if (sub.status === 'rejected') return;
      const alreadyInList = list.some((st) => {
        return (
          st.id === sub.studentId ||
          (st.baleUserId && sub.baleUserId && String(st.baleUserId).trim() === String(sub.baleUserId).trim()) ||
          st.fullName === sub.studentName
        );
      });
      if (!alreadyInList) {
        list.push({
          id: sub.studentId || `st-user-${sub.baleUserId || Date.now()}`,
          studentNumber: sub.studentNumber || toPersianDigits(list.length + 1),
          fullName: sub.studentName || `کاربر (${toPersianDigits(sub.baleUserId || '')})`,
          classId: classGroup.id,
          baleUserId: sub.baleUserId,
        });
      }
    });
    return list;
  }, [students, classGroup.id, submissions]);

  // تطابق هوشمند و تضمین شده هر دانش‌آموز با ارسال‌های ثبت‌شده
  const combinedData = useMemo(() => {
    return classStudents.map((st) => {
      const sub = findStudentSubmission(st, submissions, assignment.id);
      return {
        student: st,
        submission: sub,
        isSubmitted: Boolean(sub && sub.status !== 'rejected'),
      };
    });
  }, [classStudents, submissions, assignment.id]);

  // اعمال فیلتر جستجو و تب وضعیت
  const filteredData = useMemo(() => {
    return combinedData.filter((item) => {
      const matchSearch =
        item.student.fullName.includes(searchTerm) ||
        item.student.studentNumber.includes(searchTerm);

      if (!matchSearch) return false;

      if (filterType === 'submitted') return item.isSubmitted;
      if (filterType === 'missing') return !item.isSubmitted;
      if (filterType === 'revision') return item.submission?.status === 'revision';

      return true;
    });
  }, [combinedData, searchTerm, filterType]);

  // پیام‌های ثبت‌شده‌ای که هنوز به یکی از ۱۱ دانش‌آموز متصل نشده‌اند
  const unassignedSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (sub.status === 'rejected') return false;
      return !classStudents.some((st) => Boolean(findStudentSubmission(st, [sub], assignment.id)));
    });
  }, [submissions, classStudents, assignment.id]);

  const handleStartEdit = (sub: Submission) => {
    setEditingId(sub.id);
    setEditScore(sub.score || '');
    setEditNote(sub.teacherNote || '');
  };

  const handleSaveEdit = (subId: string) => {
    onUpdateSubmissionDetails(subId, editScore, editNote);
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی نام دانش‌آموز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto text-xs font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            همه ({toPersianDigits(combinedData.length)})
          </button>
          <button
            onClick={() => setFilterType('submitted')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'submitted'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تأیید شده 🟢 ({toPersianDigits(combinedData.filter((i) => i.isSubmitted).length)})
          </button>
          <button
            onClick={() => setFilterType('missing')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'missing'
                ? 'bg-white text-rose-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            انجام نشده 🔴 ({toPersianDigits(combinedData.filter((i) => !i.isSubmitted).length)})
          </button>
        </div>
      </div>

      {/* Unassigned Submissions Banner (if any message came from an unlinked Bale ID) */}
      {unassignedSubmissions.length > 0 && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="font-bold">📩 پیام جدید از شناسه عددی بله:</span>
            {unassignedSubmissions.map((unSub) => (
              <span key={unSub.id} className="bg-white border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-amber-800">
                {toPersianDigits(unSub.baleUserId || unSub.studentId)}
              </span>
            ))}
            <span className="text-amber-800 text-[11px]">(متن: «درود ارسال کردم»)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[11px]">اتصال سریع به دانش‌آموز:</span>
            <select
              className="bg-white border border-amber-300 text-xs px-2.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value && onLinkStudentBaleId && unassignedSubmissions[0]) {
                  const targetNumericId = unassignedSubmissions[0].baleUserId || unassignedSubmissions[0].studentId;
                  onLinkStudentBaleId(e.target.value, targetNumericId);
                }
              }}
            >
              <option value="" disabled>انتخاب دانش‌آموز جهت سبز شدن 🟢</option>
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} (ردیف {toPersianDigits(st.studentNumber)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-12 text-center">ردیف</th>
              <th className="py-3 px-4">نام دانش‌آموز</th>
              <th className="py-3 px-4">شناسه عددی بله (Numeric ID)</th>
              <th className="py-3 px-4">وضعیت تکلیف</th>
              <th className="py-3 px-4">زمان ثبت پیام</th>
              <th className="py-3 px-4">نمره / ارزیابی</th>
              <th className="py-3 px-4">یادداشت دبیر</th>
              <th className="py-3 px-4 text-center">عملیات مدیریت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  موردی با این مشخصات یافت نشد.
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => {
                const sub = item.submission;
                const isEditing = sub && editingId === sub.id;
                const numericId = sub?.baleUserId || item.student.baleUserId;
                const hasRealNumeric = numericId && /^\d+$/.test(String(numericId).trim());

                return (
                  <tr
                    key={item.student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isSubmitted ? 'bg-emerald-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                      {toPersianDigits(index + 1)}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{item.student.fullName}</span>
                      </div>
                      {hasRealNumeric && (
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                          🆔 شناسه عددی: {toPersianDigits(numericId)}
                        </div>
                      )}
                    </td>

                    {/* Numeric ID from Bale */}
                    <td className="py-3 px-4">
                      {hasRealNumeric ? (
                        <span className="font-mono tabular-nums text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {toPersianDigits(numericId)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          در انتظار پیام
                        </span>
                      )}
                    </td>

                    {/* Status: Green 🟢 if submitted and approved, Red 🔴 if not */}
                    <td className="py-3 px-4">
                      {item.isSubmitted ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span>تأیید شد 🟢</span>
                          </span>
                          {sub?.photos && sub.photos.length > 0 && (
                            <button
                              onClick={() => onViewPhotos && onViewPhotos(sub)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-medium transition-colors"
                              title="مشاهده عکس‌های ارسالی دانش‌آموز"
                            >
                              <ImageIcon className="w-3 h-3 text-blue-600" />
                              <span>{toPersianDigits(sub.photos.length)} عکس ارسالی</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          <span>انجام نشده 🔴</span>
                        </span>
                      )}
                    </td>

                    {/* Submission Timestamp */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {sub?.jalaliTime ? toPersianDigits(sub.jalaliTime) : '-'}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4">
                      {sub ? (
                        isEditing ? (
                          <input
                            type="text"
                            value={editScore}
                            onChange={(e) => setEditScore(e.target.value)}
                            placeholder="مثلا ۲۰ یا عالی"
                            className="w-20 px-2 py-1 text-xs border border-emerald-400 rounded focus:outline-none"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {sub.score ? toPersianDigits(sub.score) : '—'}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Teacher Note */}
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-600">
                      {sub ? (
                        isEditing ? (
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="یادداشت معلم..."
                            className="w-full px-2 py-1 text-xs border border-emerald-400 rounded focus:outline-none"
                          />
                        ) : (
                          <span title={sub.teacherNote || ''}>{sub.teacherNote || '—'}</span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {sub ? (
                        isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(sub.id)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px] font-medium hover:bg-emerald-800"
                          >
                            ذخیره
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(sub)}
                              title="ویرایش نمره و یادداشت"
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSubmission(sub.id)}
                              title="حذف این ارسال"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => onManualAddSubmission(item.student)}
                          className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>تأیید دستی 🟢</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
