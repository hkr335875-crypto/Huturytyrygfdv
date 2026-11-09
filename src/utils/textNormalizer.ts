/**
 * موتور پردازش و نرمال‌سازی متون فارسی و تشخیص هوشمند پیام‌ها
 */

// تبدیل ارقام انگلیسی به ارقام فارسی
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

// پاکسازی و استانداردسازی حروف فارسی، فواصل و نیم‌فاصله‌ها
export function normalizePersianText(input: string): string {
  if (!input) return '';

  let text = input.trim();

  // تبدیل حروف عربی به فارسی
  text = text
    .replace(/ي/g, 'ی')
    .replace(/ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ۀ/g, 'ه')
    .replace(/ة/g, 'ه')
    .replace(/[أإ]/g, 'ا')
    .replace(/ؤ/g, 'و');

  // حذف اعراب و نشانه‌های تنوین و تشدید (Diacritics)
  text = text.replace(/[\u064B-\u065F\u0670]/g, '');

  // حذف کشیدگی حروف (تطویل)
  text = text.replace(/ـ+/g, '');

  // یکسان‌سازی نیم‌فاصله (\u200c) با فاصله معمولی برای مقایسه دقیق عبارات پیوسته
  // مثال: «ارسال‌کردم» -> «ارسال کردم»
  text = text.replace(/[\u200c\u200b\u00a0]/g, ' ');

  // حذف علائم نگارشی رایج (نقطه، کاما، علامت تعجب، ویرگول و ...)
  text = text.replace(/[.,،؛;!?؟!()[\]{}"'«»\-—_/\\]/g, ' ');

  // تبدیل چند فاصله متوالی به یک فاصله واحد
  text = text.replace(/\s+/g, ' ');

  return text.trim();
}

// فهرست کلمات تکی ممنوعه که هرگز نباید به تنهایی ثبت شوند
export const FORBIDDEN_SINGLE_WORDS = new Set([
  'درود',
  'سلام',
  'ارسال',
  'کردم',
  'فرستادم',
  'تکلیف',
  'استاد',
  'معلم',
  'خسته نباشید',
  'من',
  'حاضر',
  'بله',
  'خیر',
  'باشه',
  'مرسی',
  'ممنون',
  'تشکر',
  'اقا',
  'خانم',
]);

export interface ValidationParams {
  rawText: string;
  isForwarded?: boolean;
  isQuoted?: boolean;
  isOpen: boolean;
  triggerPhrase: string;
  isDuplicateStudent?: boolean;
}

export interface SmartCheckResult {
  isValid: boolean;
  detailedCode:
    | 'VALID_TRIGGER'
    | 'SINGLE_WORD_IGNORE'
    | 'FORWARD_REJECT'
    | 'QUOTE_REJECT'
    | 'GREETING_IGNORE'
    | 'PHRASE_MISMATCH'
    | 'ASSIGNMENT_CLOSED'
    | 'DUPLICATE_SUBMISSION';
  reason: string;
  normalizedInput: string;
  normalizedTrigger: string;
}

/**
 * قانون اصلی ربات:
 * هیچ پیامی نباید صرفاً به دلیل داشتن یکی از کلمات «درود»، «ارسال» یا «کردم» ثبت شود.
 * فقط عبارت کامل و معتبر مورد تأیید مدیر (مثلا «درود ارسال کردم») باید شناسایی شود.
 */
export function validateHomeworkMessage(params: ValidationParams): SmartCheckResult {
  const {
    rawText,
    isForwarded = false,
    isQuoted = false,
    isOpen,
    triggerPhrase,
    isDuplicateStudent = false,
  } = params;

  const normalizedInput = normalizePersianText(rawText);
  const normalizedTrigger = normalizePersianText(triggerPhrase || 'درود ارسال کردم');

  // ۱. بررسی وضعیت فعال بودن تکلیف
  if (!isOpen) {
    return {
      isValid: false,
      detailedCode: 'ASSIGNMENT_CLOSED',
      reason: 'مهلت ارسال این تکلیف پایان یافته یا توسط دبیر بسته شده است.',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۲. عدم پذیرش پیام‌های فوروارد شده
  if (isForwarded) {
    return {
      isValid: false,
      detailedCode: 'FORWARD_REJECT',
      reason: 'پیام فوروارد شده (هدایت شده) است و طبق قوانین ربات به عنوان تکلیف ثبت نمی‌شود.',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۳. عدم پذیرش پیام‌های نقل‌قول شده (Quote / Reply)
  if (isQuoted) {
    return {
      isValid: false,
      detailedCode: 'QUOTE_REJECT',
      reason: 'پیام نقل‌قول شده (Quote / Reply) است و امکان ثبت آن وجود ندارد.',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۴. بررسی پیام خالی
  if (!normalizedInput) {
    return {
      isValid: false,
      detailedCode: 'PHRASE_MISMATCH',
      reason: 'متن پیام خالی است.',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۵. قانون منع ثبت بر اساس تک‌کلمه (مانند «درود»، «سلام»، «ارسال»، «کردم»)
  const words = normalizedInput.split(/\s+/).filter(Boolean);
  if (words.length === 1 && FORBIDDEN_SINGLE_WORDS.has(words[0])) {
    return {
      isValid: false,
      detailedCode: 'SINGLE_WORD_IGNORE',
      reason: `ارسال کلمه تکی «${words[0]}» نادیده گرفته شد. فقط عبارت کامل «${triggerPhrase}» معتبر است.`,
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۶. بررسی تطابق دقیق عبارت هدف (Trigger Phrase)
  // عبارت هدف باید به صورت یکپارچه در متن وجود داشته باشد
  const hasTrigger = normalizedInput.includes(normalizedTrigger);

  if (!hasTrigger) {
    // آیا پیام فقط یک چت عادی یا احوالپرسی است؟
    const hasSingleWords = ['درود', 'ارسال', 'کردم', 'سلام'].filter((w) =>
      words.includes(w)
    );

    if (hasSingleWords.length > 0) {
      return {
        isValid: false,
        detailedCode: 'PHRASE_MISMATCH',
        reason: `قانون اصلی: کلمات مجزای «${hasSingleWords.join('، ')}» به تنهایی کافی نیستند. باید عبارت کامل «${triggerPhrase}» ارسال شود.`,
        normalizedInput,
        normalizedTrigger,
      };
    }

    return {
      isValid: false,
      detailedCode: 'GREETING_IGNORE',
      reason: 'پیام عادی یا گفتگوی کلاسی شناسایی شد و به عنوان تکلیف ثبت نشد.',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۷. بررسی ارسال تکراری توسط همان دانش‌آموز
  if (isDuplicateStudent) {
    return {
      isValid: true,
      detailedCode: 'DUPLICATE_SUBMISSION',
      reason: 'تکلیف این دانش‌آموز پیش‌تر ثبت شده بود و رکورد آن به‌روزرسانی شد (بدون ثبت تکراری).',
      normalizedInput,
      normalizedTrigger,
    };
  }

  // ۸. پیام کاملاً معتبر است!
  return {
    isValid: true,
    detailedCode: 'VALID_TRIGGER',
    reason: `عبارت معتبر «${triggerPhrase}» با موفقیت شناسایی و ثبت شد.`,
    normalizedInput,
    normalizedTrigger,
  };
}

// فرمت‌کننده تاریخ و ساعت شمسی دقیق
export function formatPersianDateTime(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date).replace(',', ' -');
  } catch (_e) {
    // بازگشت اضطراری در صورت عدم پشتیبانی مرورگر
    return date.toLocaleTimeString('fa-IR');
  }
}

/**
 * تابع سراسری برای یافتن وضعیت ارسال تکلیف دانش‌آموز بر اساس چندین کلید (ID، شناسه عددی، یا نام)
 * این تابع تضمین می‌کند که به محض ثبت پیام، وضعیت دانش‌آموز بلافاصله سبز (🟢) نمایش داده شود.
 */
export function findStudentSubmission<T extends { studentId?: string; studentName?: string; studentNumber?: string; baleUserId?: string; status?: string; assignmentId?: string }>(
  student: { id: string; studentNumber?: string; fullName: string; baleUserId?: string },
  submissions: T[],
  assignmentId?: string
): T | undefined {
  if (!submissions || !Array.isArray(submissions)) return undefined;

  return submissions.find((s) => {
    if (s.status === 'rejected') return false;
    if (assignmentId && s.assignmentId && s.assignmentId !== assignmentId) return false;

    // ۱. تطابق مستقیم با کد یکتای دانش‌آموز (مانند st-1) یا شماره دانش‌آموز
    if (s.studentId && (s.studentId === student.id || s.studentId === student.studentNumber)) {
      return true;
    }

    // ۲. تطابق مستقیم با شناسه عددی بله
    if (
      student.baleUserId &&
      s.baleUserId &&
      String(student.baleUserId).trim() !== '' &&
      String(student.baleUserId).trim() === String(s.baleUserId).trim()
    ) {
      return true;
    }

    // ۳. تطابق هوشمند با نام و نام خانوادگی (نرمال‌سازی شده)
    if (s.studentName && student.fullName) {
      const normSubName = normalizePersianText(s.studentName);
      const normStName = normalizePersianText(student.fullName);
      if (
        normSubName === normStName ||
        (normSubName.length >= 3 && normStName.includes(normSubName)) ||
        (normStName.length >= 3 && normSubName.includes(normStName))
      ) {
        return true;
      }
    }

    return false;
  });
}
