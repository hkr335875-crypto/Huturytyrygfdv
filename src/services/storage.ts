import { Assignment, BotConfig, BotLog, ClassGroup, Student, Submission } from '../types';

export interface AppState {
  config: BotConfig;
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  logs: BotLog[];
}

// کلید نسخه v3 جهت پاکسازی هرگونه آیدی متنی ساختگی
const STORAGE_KEY = 'literature_bot_state_v3';

export const INITIAL_STATE: AppState = {
  config: {
    baleToken: '376421744:aUuvEsrmJtJZVtAqrk7uA5V9AlWR_bEtgpY',
    botUsername: '@Literaturebot',
    botLink: 'ble.ir/Literaturebot',
    targetGroupId: '-100123456789',
    defaultTriggerPhrase: 'درود ارسال کردم',
    adminPin: '1234',
    autoCloseOnDeadline: true,
    rejectForwards: true,
    rejectQuotes: true,
    activeClassId: 'class-emla',
    activeAssignmentId: 'assign-emla',
  },
  classes: [
    {
      id: 'class-emla',
      name: 'کلاس ادبیات و املا',
      grade: 'ادبیات فارسی',
      academicYear: '۱۴۰۳-۱۴۰۴',
    },
  ],
  // اسامی دقیق ۱۱ دانش‌آموز بدون هیچ آیدی متنی فرضی
  students: [
    { id: 'st-1', studentNumber: '۱', fullName: 'کیارش', classId: 'class-emla' },
    { id: 'st-2', studentNumber: '۲', fullName: 'یلدا', classId: 'class-emla' },
    { id: 'st-3', studentNumber: '۳', fullName: 'محمد شریفی', classId: 'class-emla' },
    { id: 'st-4', studentNumber: '۴', fullName: 'کیانوش شمشکی', classId: 'class-emla' },
    { id: 'st-5', studentNumber: '۵', fullName: 'یاسین', classId: 'class-emla' },
    { id: 'st-6', studentNumber: '۶', fullName: 'معصومه', classId: 'class-emla' },
    { id: 'st-7', studentNumber: '۷', fullName: 'کومار', classId: 'class-emla' },
    { id: 'st-8', studentNumber: '۸', fullName: 'محمدعلی', classId: 'class-emla' },
    { id: 'st-9', studentNumber: '۹', fullName: 'امید', classId: 'class-emla' },
    { id: 'st-10', studentNumber: '۱۰', fullName: 'محمدرضا', classId: 'class-emla' },
    { id: 'st-11', studentNumber: '۱۱', fullName: 'حسین', classId: 'class-emla' },
  ],
  assignments: [
    {
      id: 'assign-emla',
      title: 'گزارش انجام املا',
      subject: 'از فایل صوتی',
      classId: 'class-emla',
      createdAt: '2026-11-08T07:00:00Z',
      deadline: 'تا ساعت ۱۰',
      isOpen: true,
      customTriggerPhrase: 'درود ارسال کردم',
      description: 'املا از فایل صوتی - ارسال فقط با عبارت «درود ارسال کردم»',
    },
  ],
  submissions: [],
  logs: [],
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.students && parsed.students.some((s: Student) => s.fullName === 'کیارش')) {
        return {
          ...INITIAL_STATE,
          ...parsed,
          config: { ...INITIAL_STATE.config, ...(parsed.config || {}) },
        };
      }
    }
  } catch (err) {
    console.error('Failed to load local state:', err);
  }
  return INITIAL_STATE;
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}
