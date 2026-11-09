import { Assignment, ClassGroup, Student, Submission } from '../types';
import { toPersianDigits, findStudentSubmission } from './textNormalizer';

export interface ReportOptions {
  assignment: Assignment;
  classGroup: ClassGroup;
  allStudents: Student[];
  submissions: Submission[];
}

/**
 * گزارش رسمی املا
 * قاعده کاربر:
 * ۱. در صورت صفر کردن یا عدم ارسال، نشانگر قرمز (🔴) باشد.
 * ۲. اگر پیام فرستاده و تأیید شد، نشانگر سبز (🟢) شده و شناسه عددی زیر آن بیاید.
 */
export function generateLiteratureReport(options: ReportOptions): string {
  const { assignment, classGroup, allStudents, submissions } = options;

  const classStudents = [...allStudents.filter((s) => s.classId === classGroup.id)];
  // افزودن سایر کاربرانی که عبارت «درود ارسال کردم» را فرستاده و ثبت شده‌اند
  submissions.forEach((sub) => {
    if (sub.status === 'rejected') return;
    const exists = classStudents.some((st) => {
      return (
        st.id === sub.studentId ||
        (st.baleUserId && sub.baleUserId && String(st.baleUserId).trim() === String(sub.baleUserId).trim()) ||
        st.fullName === sub.studentName
      );
    });
    if (!exists) {
      classStudents.push({
        id: sub.studentId || `st-user-${sub.baleUserId}`,
        studentNumber: sub.studentNumber || toPersianDigits(classStudents.length + 1),
        fullName: sub.studentName || `کاربر (${toPersianDigits(sub.baleUserId || '')})`,
        classId: classGroup.id,
        baleUserId: sub.baleUserId,
      });
    }
  });

  let text = `📚 گزارش انجام املا🟢\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;
  text += `✅ وضعیت دانش‌آموزان (🟢 تأیید شده / 🔴 در انتظار ارسال):\n\n`;

  classStudents.forEach((st, index) => {
    const num = toPersianDigits(index + 1);
    const sub = findStudentSubmission(st, submissions, assignment.id);
    const hasSubmitted = !!sub && sub.status !== 'rejected';

    // اگر تأیید شد سبز (🟢)، وگرنه قرمز (🔴)
    const mark = hasSubmitted ? ' 🟢' : ' 🔴';

    text += `${num}. ${st.fullName}${mark}\n`;

    // فقط وقتی پیام فرستادند و شناسه عددی واقعی ثبت شد، نمایش داده شود
    const rawId = sub?.baleUserId || st.baleUserId;
    const isRealNumeric = rawId && /^\d+$/.test(String(rawId).trim());

    if (isRealNumeric) {
      text += `   🆔 شناسه عددی: ${toPersianDigits(rawId)}\n`;
    }
    text += `\n`;
  });

  const deadlineStr = assignment.deadline || 'تا ساعت ۱۰';
  const lessonStr = assignment.subject || 'از فایل صوتی';
  const statusIcon = assignment.isOpen ? '🔄' : '🔒 بسته شده';

  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `🕙زمان: ${toPersianDigits(deadlineStr)}\n`;
  text += `🌟 وضعیت: ${statusIcon}\n`;
  text += `📝 درس: ${lessonStr}\n`;

  return text.trim();
}
