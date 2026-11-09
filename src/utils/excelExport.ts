import { Assignment, ClassGroup, Student, Submission } from '../types';
import { findStudentSubmission } from './textNormalizer';

export function exportHomeworkToCSV(
  assignment: Assignment,
  classGroup: ClassGroup,
  students: Student[],
  submissions: Submission[]
) {
  const classStudents = students.filter((s) => s.classId === classGroup.id);

  const headers = [
    'ردیف',
    'نام و نام خانوادگی',
    'شماره دانش‌آموزی / کد ملی',
    'کلاس',
    'درس',
    'عنوان تکلیف',
    'وضعیت ارسال',
    'زمان ثبت (شمسی)',
    'نمره / ارزیابی',
    'یادداشت دبیر',
    'متن ارسالی در بله',
  ];

  const statusTranslations: Record<string, string> = {
    approved: 'تأیید شده (سبز)',
    pending: 'در انتظار بررسی',
    revision: 'نیاز به اصلاح',
    excused: 'معاف شده',
    rejected: 'رد شده',
    missing: 'ارسال نشده (قرمز)',
  };

  const rows = classStudents.map((st, index) => {
    const sub = findStudentSubmission(st, submissions, assignment.id);
    const statusKey = sub ? sub.status : 'missing';
    const statusLabel = statusTranslations[statusKey] || statusKey;

    return [
      String(index + 1),
      st.fullName,
      st.studentNumber,
      classGroup.name,
      assignment.subject,
      assignment.title,
      statusLabel,
      sub?.jalaliTime || '-',
      sub?.score || '-',
      sub?.teacherNote || '-',
      sub?.rawMessage ? sub.rawMessage.replace(/[\n\r]+/g, ' ') : '-',
    ];
  });

  // Escape CSV fields
  const escapeCell = (cell: string) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = assignment.title.replace(/\s+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `گزارش_${safeTitle}_${classGroup.name}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
