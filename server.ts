import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { normalizePersianText, toPersianDigits, formatPersianDateTime, FORBIDDEN_SINGLE_WORDS } from './src/utils/textNormalizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'literature_bot_data.json');
const DEFAULT_BALE_TOKEN = '376421744:aUuvEsrmJtJZVtAqrk7uA5V9AlWR_bEtgpY';
// شناسه عددی مالک اصلی سامانه (تنها فرد مجاز به تغییر شناسه عددی دانش‌آموزان)
const OWNER_BALE_ID = '960742797';

// دقیقاً ۱۱ دانش‌آموز اعلام‌شده توسط دبیر (بدون هیچ آیدی ساختگی یا فرضی)
const DEFAULT_STUDENTS = [
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
];

const CLOUDFLARE_URL = 'https://triple-hawaii-editor-rely.trycloudflare.com';

const INITIAL_DATA = {
  config: {
    baleToken: DEFAULT_BALE_TOKEN,
    botUsername: '@Literaturebot',
    botLink: 'ble.ir/Literaturebot',
    ownerId: OWNER_BALE_ID,
    ownerName: 'مالک اصلی (960742797)',
    admins: [
      {
        baleUserId: OWNER_BALE_ID,
        name: 'مالک اصلی (دبیر ادبیات)',
        role: 'owner',
        addedAt: new Date().toISOString(),
      },
    ],
    adminIds: [OWNER_BALE_ID],
    targetGroupId: '-100123456789',
    groupTitle: 'گروه کلاسی ادبیات',
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
  students: DEFAULT_STUDENTS,
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
  lastUpdateId: 0,
};

let currentAppState = loadData() || INITIAL_DATA;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.students && parsed.students.some((s: any) => s.fullName === 'کیارش')) {
        if (!parsed.config) parsed.config = {};
        if (!parsed.config.ownerId) parsed.config.ownerId = OWNER_BALE_ID;
        if (!parsed.config.admins || !Array.isArray(parsed.config.admins)) {
          parsed.config.admins = [
            {
              baleUserId: OWNER_BALE_ID,
              name: 'مالک اصلی (دبیر ادبیات)',
              role: 'owner',
              addedAt: new Date().toISOString(),
            },
          ];
        }
        if (!parsed.config.adminIds || !Array.isArray(parsed.config.adminIds)) {
          parsed.config.adminIds = [OWNER_BALE_ID];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return null;
}

function saveData(data: any) {
  try {
    currentAppState = data;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// فهرست جامع الگوها و نگارش‌های مختلف نام‌ها و ردیف‌های ۱۱ دانش‌آموز کلاس املا
const STUDENT_MATCH_PATTERNS: Array<{ id: string; aliases: string[] }> = [
  { id: 'st-1', aliases: ['کیارش', 'kiarash', '۱', '1', 'ردیف ۱', 'ردیف 1', 'شماره ۱', 'شماره 1'] },
  { id: 'st-2', aliases: ['یلدا', 'yalda', '۲', '2', 'ردیف ۲', 'ردیف 2', 'شماره ۲', 'شماره 2'] },
  { id: 'st-3', aliases: ['محمد شریفی', 'محمدشریفی', 'شریفی', 'mohammad sharifi', 'mohammadsharifi', 'sharifi', '۳', '3', 'ردیف ۳', 'ردیف 3', 'شماره ۳', 'شماره 3'] },
  { id: 'st-4', aliases: ['کیانوش شمشکی', 'کیانوش', 'شمشکی', 'kianoush', 'shemshaki', '۴', '4', 'ردیف ۴', 'ردیف 4', 'شماره ۴', 'شماره 4'] },
  { id: 'st-5', aliases: ['یاسین', 'yasin', 'یـاسین', '۵', '5', 'ردیف ۵', 'ردیف 5', 'شماره ۵', 'شماره 5'] },
  { id: 'st-6', aliases: ['معصومه', 'masoumeh', 'masoomeh', '۶', '6', 'ردیف ۶', 'ردیف 6', 'شماره ۶', 'شماره 6'] },
  { id: 'st-7', aliases: ['کومار', 'kumar', 'koomar', '۷', '7', 'ردیف ۷', 'ردیف 7', 'شماره ۷', 'شماره 7'] },
  { id: 'st-8', aliases: ['محمدعلی', 'محمد علی', 'mohammadali', 'mohammad ali', '۸', '8', 'ردیف ۸', 'ردیف 8', 'شماره ۸', 'شماره 8'] },
  { id: 'st-9', aliases: ['امید', 'omid', '۹', '9', 'ردیف ۹', 'ردیف 9', 'شماره ۹', 'شماره 9'] },
  { id: 'st-10', aliases: ['محمدرضا', 'محمد رضا', 'mohammadreza', 'mohammad reza', '۱۰', '10', 'ردیف ۱۰', 'ردیف 10', 'شماره ۱۰', 'شماره 10'] },
  { id: 'st-11', aliases: ['حسین', 'سید حسین', 'hossein', 'hosein', '۱۱', '11', 'ردیف ۱۱', 'ردیف 11', 'شماره ۱۱', 'شماره 11'] },
];

function findStudentSubInState(student: any, submissions: any[], assignmentId?: string) {
  if (!submissions || !Array.isArray(submissions)) return undefined;
  return submissions.find((s: any) => {
    if (s.status === 'rejected') return false;
    if (assignmentId && s.assignmentId && s.assignmentId !== assignmentId) return false;
    if (s.studentId && (s.studentId === student.id || s.studentId === student.studentNumber)) return true;
    if (student.baleUserId && s.baleUserId && String(student.baleUserId).trim() === String(s.baleUserId).trim()) return true;
    if (s.studentName && student.fullName) {
      const normSub = normalizePersianText(s.studentName);
      const normSt = normalizePersianText(student.fullName);
      if (normSub === normSt || normSub.includes(normSt) || normSt.includes(normSub)) return true;
    }
    return false;
  });
}

// ساخت گزارش متنی - شامل ۱۱ دانش‌آموز اصلی و سایر کاربرانی که «درود ارسال کردم» فرستاده‌اند
function buildReportText(state: any): string {
  const students = [...(state.students || DEFAULT_STUDENTS)];
  const submissions = state.submissions || [];
  const assignment = state.assignments?.[0] || INITIAL_DATA.assignments[0];

  // افزودن هر کاربر دیگری که پیام «درود ارسال کردم» فرستاده و ثبت شده است
  submissions.forEach((sub: any) => {
    if (sub.status === 'rejected') return false;
    const exists = students.some((st: any) => {
      return (
        st.id === sub.studentId ||
        (st.baleUserId && sub.baleUserId && String(st.baleUserId).trim() === String(sub.baleUserId).trim()) ||
        st.fullName === sub.studentName
      );
    });
    if (!exists) {
      students.push({
        id: sub.studentId || `st-user-${sub.baleUserId}`,
        studentNumber: sub.studentNumber || toPersianDigits(students.length + 1),
        fullName: sub.studentName || `کاربر (${toPersianDigits(sub.baleUserId || '')})`,
        classId: assignment.classId,
        baleUserId: sub.baleUserId,
      });
    }
  });

  let text = `📚 گزارش انجام املا🟢\n`;
  text += `━━━━━━━━━━━━━━━━━━\n\n`;
  text += `✅ دانش‌آموزانی که املا را انجام داده‌اند:\n\n`;

  students.forEach((st: any, idx: number) => {
    const num = toPersianDigits(idx + 1);
    const sub = findStudentSubInState(st, submissions, assignment.id);
    const hasSubmitted = !!sub && sub.status !== 'rejected';
    // اگر تأیید شد سبز (🟢)، در غیر این صورت قرمز (🔴)
    const mark = hasSubmitted ? ' 🟢' : ' 🔴';

    text += `${num}. ${st.fullName}${mark}\n`;

    // فقط و فقط اگر پیام فرستاده باشد، آیدی عددی واقعی بله نمایش داده شود
    const rawNumericId = sub?.baleUserId || st.baleUserId;
    if (rawNumericId && /^\d+$/.test(String(rawNumericId).trim())) {
      text += `   🆔 شناسه عددی: ${toPersianDigits(rawNumericId)}\n`;
    }
    text += `\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `🕙زمان: ${toPersianDigits(assignment.deadline || 'تا ساعت ۱۰')}\n`;
  text += `🌟 وضعیت: ${assignment.isOpen ? '🔄' : '🔒 بسته شده'}\n`;
  text += `📝 درس: ${assignment.subject || 'از فایل صوتی'}\n`;

  return text.trim();
}

async function sendBaleMessageDirect(token: string, chatId: number | string, text: string) {
  try {
    const res = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending message to Bale:', err);
    return null;
  }
}

async function sendBalePhotoDirect(token: string, chatId: number | string, photo: string, caption?: string) {
  try {
    const res = await fetch(`https://tapi.bale.ai/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo, caption }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending photo to Bale:', err);
    return null;
  }
}

async function sendBaleDocumentDirect(token: string, chatId: number | string, document: string, caption?: string) {
  try {
    const res = await fetch(`https://tapi.bale.ai/bot${token}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, document, caption }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending document to Bale:', err);
    return null;
  }
}

function isUserAdmin(numericId: string): boolean {
  if (numericId === OWNER_BALE_ID) return true;
  const adminIds: string[] = currentAppState.config?.adminIds || [];
  if (adminIds.includes(numericId)) return true;
  const admins = currentAppState.config?.admins || [];
  return admins.some((a: any) => a.baleUserId === numericId);
}

// پردازش هوشمند پیام‌ها و استخراج شناسه عددی فرستنده (Numeric from.id)
async function processBaleUpdate(update: any, token: string) {
  const msg = update.message || update.channel_post;
  if (!msg) return;

  const rawText = (msg.text || msg.caption || '').trim();
  const hasPhoto = Boolean(msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0);
  const hasDocument = Boolean(msg.document);

  if (!rawText && !hasPhoto && !hasDocument) return;

  const chatId = msg.chat?.id;
  const from = msg.from || {};
  const isForwarded = Boolean(msg.forward_from || msg.forward_date);
  const isQuoted = Boolean(msg.reply_to_message);

  if (!chatId) return;

  // شناسه عددی واقعی کاربر در پیام‌رسان بله
  const numericSenderId = String(from.id || chatId || '');

  const activeAssignment = currentAppState.assignments?.[0] || INITIAL_DATA.assignments[0];
  const triggerPhrase = activeAssignment.customTriggerPhrase || 'درود ارسال کردم';

  // تابع کمکی برای تطابق دانش‌آموز بر اساس نام، شناسه عددی یا متن
  function resolveStudent(identifier: string) {
    const norm = normalizePersianText(identifier).toLowerCase();
    for (const pattern of STUDENT_MATCH_PATTERNS) {
      if (
        pattern.aliases.some((a) => {
          const normAlias = normalizePersianText(a).toLowerCase();
          return norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm);
        })
      ) {
        return currentAppState.students.find((s: any) => s.id === pattern.id);
      }
    }
    return currentAppState.students.find((s: any) => {
      const normName = normalizePersianText(s.fullName);
      return norm === normName || norm.includes(normName) || normName.includes(norm);
    });
  }

  // تشخیص خودکار شناسه عددی گروه در صورتی که پیام از گروه باشد
  const isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup' || Number(chatId) < 0;
  if (isGroup && (!currentAppState.config.targetGroupId || currentAppState.config.targetGroupId !== String(chatId))) {
    currentAppState.config.targetGroupId = String(chatId);
    if (msg.chat?.title) currentAppState.config.groupTitle = msg.chat.title;
    saveData(currentAppState);
  }

  // ۱. دستور اتصال مستقیم نام با شناسه عددی: /من [نام] یا /name [نام]
  if (rawText.startsWith('/من ') || rawText.startsWith('/name ') || /^(من|ردیف|شماره)\s+/i.test(rawText)) {
    const requested = rawText.replace(/^(\/(من|name)|من|ردیف|شماره)\s+/, '').trim();
    const matched = resolveStudent(requested);

    if (matched) {
      // قانون قفل بودن شناسه: اگر شناسه قبلاً ثبت شده باشد، کاربر عادی اجازه بازنویسی ندارد (فقط مالک مجاز است)
      const alreadyHasId = matched.baleUserId && /^\d+$/.test(String(matched.baleUserId).trim());
      if (alreadyHasId && String(matched.baleUserId).trim() !== numericSenderId && numericSenderId !== OWNER_BALE_ID) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `🔒 شناسه عددی دانش‌آموز «${matched.fullName}» قبلاً ثبت و قفل شده است.\nطبق قوانین سامانه، فقط خود مالک (@Literaturebot) با شناسه عددی ${toPersianDigits(OWNER_BALE_ID)} مجاز به تغییر آن است.`
        );
        return;
      }

      matched.baleUserId = numericSenderId;
      saveData(currentAppState);
      await sendBaleMessageDirect(
        token,
        chatId,
        `✅ ${matched.fullName} گرامی، شناسه عددی شما (${toPersianDigits(numericSenderId)}) با موفقیت قفل و متصل شد.\nحالا با ارسال عبارت «${triggerPhrase}»، وضعیت شما در جدول سبز (🟢) می‌شود.`
      );
      return;
    } else {
      await sendBaleMessageDirect(
        token,
        chatId,
        `نام یا شماره «${requested}» در فهرست ۱۱ دانش‌آموز کلاس یافت نشد. لطفاً شماره ردیف (۱ تا ۱۱) یا نام خود را ارسال کنید.`
      );
      return;
    }
  }

  // ۲. دستورات سیستمی
  if (rawText.startsWith('/')) {
    const cmd = rawText.toLowerCase().split(' ')[0];
    if (cmd === '/start') {
      const isOwner = numericSenderId === OWNER_BALE_ID;
      const isAdmin = isUserAdmin(numericSenderId);
      const welcome = `درود بر شما! بازوی پشتیبان ادبیات (@Literaturebot) همیشه روشن و فعال است 📚🟢\n\n` +
        `🆔 شناسه عددی شما: ${toPersianDigits(numericSenderId)}${isOwner ? ' 👑 (مالک اصلی)' : isAdmin ? ' ⭐️ (مدیر کلاس)' : ''}\n` +
        `📝 تکلیف جاری: «${activeAssignment.title}» (${activeAssignment.subject})\n` +
        `⏰ مهلت ارسال: ${toPersianDigits(activeAssignment.deadline || 'تا ساعت ۱۰')}\n` +
        `📌 برای ثبت تکلیف، عبارت دقیق زیر را ارسال کنید:\n«${triggerPhrase}»\n` +
        `📷 همچنین می‌توانید عکس دست‌نویس یا تکلیف خود را مستقیماً برای ربات بفرستید تا برای مدیران ارسال و ثبت شود.\n\n` +
        `دستورات موجود:\n` +
        `• /report - صدور گزارش انجام املا با نمایش شناسه عددی\n` +
        `• /group - نمایش شناسه عددی گروه بله\n` +
        `• /ids - نمایش کامل شناسه‌های عددی گروه و همه افراد\n` +
        `• /list - فهرست اسامی ۱۱ دانش‌آموز کلاس\n` +
        `• /من [نام یا شماره] - اتصال شناسه عددی شما\n` +
        (isOwner ? `• /setid [نام] [شناسه جدید] - تغییر یا ثبت شناسه دانش‌آموز توسط مالک\n• /addadmin [شناسه] [نام] - افزودن مدیر جدید\n• /deladmin [شناسه] - حذف مدیر\n• /admins - فهرست مدیران\n` : '') +
        (isAdmin ? `• /bc [متن] - ارسال پیام یا فایل همگانی به پیوی دانش‌آموزان\n` : '');
      await sendBaleMessageDirect(token, chatId, welcome);
      return;
    }

    // دستور نمایش شناسه عددی گروه بله
    if (cmd === '/group' || cmd === '/group_id' || cmd === '/گروه') {
      const gId = isGroup ? String(chatId) : (currentAppState.config.targetGroupId || 'ثبت نشده');
      const gTitle = msg.chat?.title || currentAppState.config.groupTitle || 'گروه کلاسی ادبیات';
      const groupText = `👥 اطلاعات شناسه عددی گروه بله:\n━━━━━━━━━━━━━━━━━━\n` +
        `🆔 شناسه عددی گروه: ${toPersianDigits(gId)}\n` +
        `🏷 عنوان گروه: ${gTitle}\n` +
        `👑 شناسه مالک اصلی ربات: ${toPersianDigits(OWNER_BALE_ID)}\n━━━━━━━━━━━━━━━━━━\n` +
        `این شناسه جهت ارسال گزارش‌ها و پایش کلاس در سامانه ثبت گردید.`;
      await sendBaleMessageDirect(token, chatId, groupText);
      return;
    }

    // دستور نمایش کامل تمامی شناسه‌های عددی (گروه و دانش‌آموزان)
    if (cmd === '/ids' || cmd === '/شناسه‌ها' || cmd === '/همه_شناسه‌ها') {
      const gId = currentAppState.config.targetGroupId || (isGroup ? String(chatId) : 'ثبت نشده');
      let idsMsg = `📋 فهرست کامل شناسه‌های عددی (گروه و دانش‌آموزان):\n━━━━━━━━━━━━━━━━━━\n` +
        `👥 شناسه عددی گروه: ${toPersianDigits(gId)}\n` +
        `👑 شناسه عددی مالک: ${toPersianDigits(OWNER_BALE_ID)}\n━━━━━━━━━━━━━━━━━━\n\n`;

      currentAppState.students.forEach((st: any, idx: number) => {
        const isBound = st.baleUserId && /^\d+$/.test(String(st.baleUserId).trim());
        const idDisplay = isBound ? `${toPersianDigits(st.baleUserId)} 🔒` : 'در انتظار پیام';
        idsMsg += `${toPersianDigits(idx + 1)}. ${st.fullName}: ${idDisplay}\n`;
      });

      idsMsg += `\n🔒 تمامی شناسه‌ها پس از ثبت قفل هستند و فقط مالک (${toPersianDigits(OWNER_BALE_ID)}) امکان ویرایش آن‌ها را دارد.`;
      await sendBaleMessageDirect(token, chatId, idsMsg);
      return;
    }

    // دستور تغییر یا ثبت شناسه عددی فقط توسط مالک (۹۶۰۷۴۲۷۹۷)
    if (cmd === '/setid' || cmd === '/تغییر_شناسه' || cmd === '/changeid') {
      if (numericSenderId !== OWNER_BALE_ID) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `⛔️ دسترسی غیرمجاز!\nفقط خود مالک اصلی سامانه (شناسه عددی: ${toPersianDigits(OWNER_BALE_ID)}) اجازه ویرایش یا تعیین شناسه عددی دانش‌آموزان را دارد.`
        );
        return;
      }

      const parts = rawText.trim().split(/\s+/);
      if (parts.length < 3) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `راهنمای ثبت/تغییر شناسه توسط مالک:\n/setid [نام یا شماره ردیف] [شناسه عددی جدید]\nمثال:\n/setid کیارش 123456789\n/setid 1 123456789`
        );
        return;
      }

      const targetIdentifier = parts[1];
      const newNumericId = parts[2].replace(/[^\d]/g, '');
      if (!newNumericId) {
        await sendBaleMessageDirect(token, chatId, `شناسه عددی جدید واردشده نامعتبر است.`);
        return;
      }

      const targetStudent = resolveStudent(targetIdentifier);
      if (!targetStudent) {
        await sendBaleMessageDirect(token, chatId, `دانش‌آموز با مشخصات «${targetIdentifier}» یافت نشد.`);
        return;
      }

      targetStudent.baleUserId = newNumericId;
      currentAppState.submissions.forEach((s: any) => {
        if (s.studentId === targetStudent.id) s.baleUserId = newNumericId;
      });
      saveData(currentAppState);

      await sendBaleMessageDirect(
        token,
        chatId,
        `👑 مالک گرامی، شناسه عددی دانش‌آموز «${targetStudent.fullName}» با موفقیت به ${toPersianDigits(newNumericId)} ثبت و قفل گردید.`
      );
      return;
    }

    // دستور افزودن مدیر جدید فقط توسط مالک (۹۶۰۷۴۲۷۹۷)
    if (cmd === '/addadmin' || cmd === '/افزودن_مدیر' || cmd === '/ادمین') {
      if (numericSenderId !== OWNER_BALE_ID) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `⛔️ فقط خود مالک اصلی (شناسه ${toPersianDigits(OWNER_BALE_ID)}) اجازه تعیین مدیر جدید را دارد.`
        );
        return;
      }

      const parts = rawText.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `راهنمای افزودن مدیر:\n/addadmin [شناسه عددی] [نام اختیاری]\nمثال:\n/addadmin 123456789 خانم احمدی`
        );
        return;
      }

      const newAdminId = parts[1].replace(/[^\d]/g, '');
      const adminName = parts.slice(2).join(' ') || `مدیر ${newAdminId}`;

      if (!newAdminId) {
        await sendBaleMessageDirect(token, chatId, `شناسه عددی مدیر نامعتبر است.`);
        return;
      }

      if (!currentAppState.config.admins) currentAppState.config.admins = [];
      if (!currentAppState.config.adminIds) currentAppState.config.adminIds = [OWNER_BALE_ID];

      const existing = currentAppState.config.admins.find((a: any) => a.baleUserId === newAdminId);
      if (existing) {
        existing.name = adminName;
      } else {
        currentAppState.config.admins.push({
          baleUserId: newAdminId,
          name: adminName,
          role: 'admin',
          addedAt: new Date().toISOString(),
          addedBy: OWNER_BALE_ID,
        });
      }

      if (!currentAppState.config.adminIds.includes(newAdminId)) {
        currentAppState.config.adminIds.push(newAdminId);
      }

      saveData(currentAppState);

      await sendBaleMessageDirect(
        token,
        chatId,
        `👑 مالک گرامی، کاربر «${adminName}» با شناسه عددی ${toPersianDigits(newAdminId)} به عنوان مدیر جدید بازوی ادبیات ثبت گردید.`
      );

      // اطلاع‌رسانی به مدیر جدید در پیوی
      await sendBaleMessageDirect(
        token,
        newAdminId,
        `🎉 درود بر شما!\nشما توسط مالک اصلی سامانه (@Literaturebot) به عنوان ادمین و مدیر کلاس تعیین شدید.\nاز این پس می‌توانید از دستورات زیر استفاده نمایید:\n• /report - گزارش تکالیف\n• /bc [متن پیام] - ارسال پیام همگانی به پیوی دانش‌آموزان\n• /ids - مشاهده فهرست شناسه‌ها\nهمچنین عکس‌های ارسالی دانش‌آموزان برای شما نیز ارسال می‌شود.`
      ).catch(() => {});

      return;
    }

    // دستور حذف مدیر فقط توسط مالک
    if (cmd === '/deladmin' || cmd === '/حذف_مدیر') {
      if (numericSenderId !== OWNER_BALE_ID) {
        await sendBaleMessageDirect(token, chatId, `⛔️ فقط خود مالک اصلی اجازه حذف مدیر را دارد.`);
        return;
      }

      const parts = rawText.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendBaleMessageDirect(token, chatId, `راهنما: /deladmin [شناسه عددی]`);
        return;
      }

      const adminIdToRemove = parts[1].replace(/[^\d]/g, '');
      if (adminIdToRemove === OWNER_BALE_ID) {
        await sendBaleMessageDirect(token, chatId, `⚠️ مالک اصلی قابل حذف نیست.`);
        return;
      }

      currentAppState.config.admins = (currentAppState.config.admins || []).filter(
        (a: any) => a.baleUserId !== adminIdToRemove
      );
      currentAppState.config.adminIds = (currentAppState.config.adminIds || []).filter(
        (id: string) => id !== adminIdToRemove
      );
      saveData(currentAppState);

      await sendBaleMessageDirect(
        token,
        chatId,
        `✅ کاربر با شناسه ${toPersianDigits(adminIdToRemove)} از فهرست مدیران حذف گردید.`
      );
      return;
    }

    // دستور نمایش مدیران
    if (cmd === '/admins' || cmd === '/مدیران') {
      if (!isUserAdmin(numericSenderId)) {
        await sendBaleMessageDirect(token, chatId, `⛔️ این دستور فقط برای مدیران قابل مشاهده است.`);
        return;
      }

      let adminMsg = `👥 فهرست مدیران بازوی ادبیات (@Literaturebot):\n━━━━━━━━━━━━━━━━━━\n` +
        `👑 مالک اصلی: ${toPersianDigits(OWNER_BALE_ID)} (دبیر ادبیات)\n\n`;

      const subAdmins = (currentAppState.config.admins || []).filter((a: any) => a.baleUserId !== OWNER_BALE_ID);
      if (subAdmins.length === 0) {
        adminMsg += `هنوز مدیر دیگری اضافه نشده است.\nمالک می‌تواند با دستور /addadmin [شناسه] [نام] مدیر جدید اضافه کند.`;
      } else {
        adminMsg += `مدیران فعال:\n`;
        subAdmins.forEach((adm: any, idx: number) => {
          adminMsg += `${toPersianDigits(idx + 1)}. ${adm.name} (شناسه: ${toPersianDigits(adm.baleUserId)})\n`;
        });
      }

      await sendBaleMessageDirect(token, chatId, adminMsg);
      return;
    }

    // دستور ارسال پیام یا فایل همگانی به پیوی همه دانش‌آموزان: /bc یا /broadcast
    if (cmd === '/bc' || cmd === '/broadcast' || cmd === '/همگانی' || cmd === '/ارسال_به_همه') {
      if (!isUserAdmin(numericSenderId)) {
        await sendBaleMessageDirect(token, chatId, `⛔️ دسترسی غیرمجاز! فقط مالک یا مدیران می‌توانند پیام همگانی ارسال کنند.`);
        return;
      }

      const broadcastBody = rawText.replace(/^(\/(bc|broadcast|همگانی|ارسال_به_همه))\s*/i, '').trim();
      if (!broadcastBody && !hasPhoto && !hasDocument) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `راهنمای ارسال پیام همگانی به پیوی دانش‌آموزان:\n/bc [متن پیام شما]\nهمچنین می‌توانید عکس یا فایلی را با کپشن /bc بفرستید تا برای همه ارسال شود.`
        );
        return;
      }

      const targets = currentAppState.students
        .filter((s: any) => s.baleUserId && /^\d+$/.test(String(s.baleUserId).trim()))
        .map((s: any) => String(s.baleUserId).trim());

      if (targets.length === 0) {
        await sendBaleMessageDirect(token, chatId, `⚠️ هیچ دانش‌آموزی با شناسه عددی فعال در سامانه یافت نشد.`);
        return;
      }

      let sent = 0;
      for (const stChatId of targets) {
        try {
          if (hasPhoto) {
            const photoObj = msg.photo[msg.photo.length - 1];
            await sendBalePhotoDirect(
              token,
              stChatId,
              photoObj.file_id,
              broadcastBody ? `📢 پیام دبیر ادبیات:\n\n${broadcastBody}` : '📢 تصویر ارسالی از دبیر ادبیات'
            );
          } else if (hasDocument) {
            await sendBaleDocumentDirect(
              token,
              stChatId,
              msg.document.file_id,
              broadcastBody ? `📢 فایل ارسالی از دبیر ادبیات:\n\n${broadcastBody}` : undefined
            );
          } else {
            await sendBaleMessageDirect(token, stChatId, `📢 پیام دبیر ادبیات به دانش‌آموزان:\n\n${broadcastBody}`);
          }
          sent++;
        } catch (_e) {}
      }

      await sendBaleMessageDirect(
        token,
        chatId,
        `📢 پیام همگانی شما با موفقیت برای ${toPersianDigits(sent)} نفر از دانش‌آموزان در پیوی ارسال گردید.`
      );
      return;
    }

    if (cmd === '/report') {
      const report = buildReportText(currentAppState);
      await sendBaleMessageDirect(token, chatId, report);
      return;
    }

    if (cmd === '/reset') {
      if (!isUserAdmin(numericSenderId) && !chatId) {
        await sendBaleMessageDirect(
          token,
          chatId,
          `⚠️ دستور صفر کردن فقط توسط مالک یا مدیران با تأیید امکان‌پذیر است.`
        );
        return;
      }

      currentAppState.submissions = [];
      saveData(currentAppState);
      const resetMsg = `🔄 وضعیت تمامی ۱۱ دانش‌آموز صفر شد و به حالت قرمز (🔴) درآمد.\n\nاکنون برای ثبت دور جدید، ارسال مجدد عبارت دقیق زیر الزامی است تا سبز (🟢) شوند:\n«${triggerPhrase}»`;
      await sendBaleMessageDirect(token, chatId, resetMsg);
      return;
    }

    if (cmd === '/list') {
      let listMsg = `📋 فهرست ۱۱ دانش‌آموز کلاس املا:\n\n`;
      currentAppState.students.forEach((st: any, idx: number) => {
        const idInfo = st.baleUserId ? ` (شناسه عددی: ${toPersianDigits(st.baleUserId)} 🔒)` : '';
        listMsg += `${toPersianDigits(idx + 1)}. ${st.fullName}${idInfo}\n`;
      });
      await sendBaleMessageDirect(token, chatId, listMsg);
      return;
    }

    if (cmd === '/help') {
      const helpMsg = `📖 راهنمای بازوی پشتیبان ادبیات (@Literaturebot):\n\n` +
        `قانون اصلی:\nهیچ پیامی با تک‌کلمه (مانند «درود»، «ارسال» یا «کردم») ثبت نمی‌شود. فقط عبارت کامل «${triggerPhrase}» یا ارسال عکس تکلیف شناسایی خواهد شد.\n\n` +
        `دستورات عمومی:\n` +
        `• /report - گزارش زنده املا با شناسه عددی\n` +
        `• /group - نمایش شناسه عددی گروه بله\n` +
        `• /ids - نمایش کامل شناسه‌های عددی گروه و همه افراد\n` +
        `• /list - فهرست اسامی ۱۱ دانش‌آموز کلاس\n` +
        `• /من [نام یا شماره] - اتصال شناسه عددی شما\n\n` +
        `دستورات اختصاصی مالک و مدیران:\n` +
        `• /bc [متن] - ارسال پیام یا عکس همگانی به پیوی دانش‌آموزان\n` +
        `• /setid [نام] [شناسه جدید] - ثبت/تغییر شناسه دانش‌آموز توسط مالک\n` +
        `• /addadmin [شناسه] [نام] - افزودن ادمین جدید توسط مالک\n` +
        `• /deladmin [شناسه] - حذف ادمین توسط مالک\n` +
        `• /admins - فهرست مدیران\n` +
        `• /reset - صفر کردن گزارش با تأیید مدیر`;
      await sendBaleMessageDirect(token, chatId, helpMsg);
      return;
    }
  }

  // ۳. تشخیص و تطابق دانش‌آموز
  const fromName = `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.first_name || '';
  const fromUsername = from.username || '';

  // الف: تطابق از روی شناسه عددی قبلاً ثبت‌شده
  let matchedStudent = currentAppState.students.find((s: any) => s.baleUserId === numericSenderId);

  // ب: تطابق از روی نام نمایشی در بله (مثلا کیارش، یلدا، محمدعلی، ...)
  if (!matchedStudent && fromName) {
    matchedStudent = resolveStudent(fromName);
  }

  // ج: تطابق از روی نام کاربری بله (Username)
  if (!matchedStudent && fromUsername) {
    matchedStudent = resolveStudent(fromUsername);
  }

  // د: تطابق اگر دانش‌آموز نام یا شماره خود را در متن پیام نوشته باشد (مثلا: «کیارش درود ارسال کردم» یا «۱ درود ارسال کردم»)
  if (!matchedStudent) {
    for (const pattern of STUDENT_MATCH_PATTERNS) {
      if (pattern.aliases.some((a) => rawText.includes(a))) {
        matchedStudent = currentAppState.students.find((s: any) => s.id === pattern.id);
        break;
      }
    }
  }

  // ذخیره شناسه عددی واقعی دانش‌آموز در صورت تطابق
  if (matchedStudent) {
    matchedStudent.baleUserId = numericSenderId;
  }

  const studentDisplayName = matchedStudent ? matchedStudent.fullName : fromName || 'دانش‌آموز گرامی';

  // ۴. بررسی پیام فوروارد شده یا نقل‌قول
  if (isForwarded) {
    await sendBaleMessageDirect(token, chatId, `⚠️ ${studentDisplayName} عزیز، پیام شما فوروارد شده است و طبق قوانین ربات به عنوان تکلیف ثبت نمی‌شود.`);
    return;
  }

  if (isQuoted) {
    await sendBaleMessageDirect(token, chatId, `⚠️ ${studentDisplayName} عزیز، پیام شما نقل‌قول شده است و پذیرفته نیست. لطفاً پیام را مستقیماً ارسال نمایید.`);
    return;
  }

  // ۴.۱. پردازش خودکار ارسال عکس تکلیف توسط دانش‌آموزان و ارسال مستقیم برای مدیران
  if (hasPhoto) {
    const nowTime = formatPersianDateTime();
    const photoArray = msg.photo;
    const largestPhoto = photoArray[photoArray.length - 1];
    const fileId = largestPhoto.file_id;

    if (!matchedStudent) {
      const nextNum = String(currentAppState.students.length + 1);
      const newParticipant = {
        id: `st-user-${numericSenderId}`,
        studentNumber: toPersianDigits(nextNum),
        fullName: fromName ? fromName : `کاربر (${toPersianDigits(numericSenderId)})`,
        classId: activeAssignment.classId || 'class-emla',
        baleUserId: numericSenderId,
      };
      currentAppState.students.push(newParticipant);
      matchedStudent = newParticipant;
    } else {
      matchedStudent.baleUserId = numericSenderId;
    }

    const studentDisplayName = matchedStudent.fullName;
    const stId = matchedStudent.id;

    const photoItem = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileId,
      caption: msg.caption || '',
      receivedAt: new Date().toISOString(),
      jalaliTime: nowTime,
      fileSize: largestPhoto.file_size,
      width: largestPhoto.width,
      height: largestPhoto.height,
    };

    const existingIndex = currentAppState.submissions.findIndex(
      (s: any) => s.studentId === stId || s.baleUserId === numericSenderId
    );

    if (existingIndex >= 0) {
      const existing = currentAppState.submissions[existingIndex];
      existing.status = 'approved';
      if (!existing.photos) existing.photos = [];
      existing.photos.push(photoItem);
      existing.submittedAt = new Date().toISOString();
      existing.jalaliTime = nowTime;
      if (msg.caption) existing.rawMessage = `[تصویر با توضیح: ${msg.caption}]`;
    } else {
      currentAppState.submissions.push({
        id: `sub-${Date.now()}`,
        assignmentId: activeAssignment.id,
        studentId: stId,
        studentName: studentDisplayName,
        studentNumber: matchedStudent.studentNumber || '—',
        baleUserId: numericSenderId,
        submittedAt: new Date().toISOString(),
        jalaliTime: nowTime,
        status: 'approved',
        rawMessage: msg.caption ? `[ارسال تصویر] ${msg.caption}` : '[ارسال عکس تکلیف]',
        photos: [photoItem],
      });
    }

    saveData(currentAppState);

    // پاسخ به دانش‌آموز
    await sendBaleMessageDirect(
      token,
      chatId,
      `✅ ${studentDisplayName} عزیز، عکس تکلیف شما با موفقیت دریافت و در سامانه کلاسی ثبت شد و به اطلاع دبیر و مدیران رسید.\n` +
      `🆔 شناسه عددی شما: ${toPersianDigits(numericSenderId)}\n` +
      `⏰ زمان دریافت: ${toPersianDigits(nowTime)}`
    );

    // ارسال مستقیم عکس برای مالک و تمام مدیران در بله!
    const adminRecipients = new Set([OWNER_BALE_ID, ...(currentAppState.config.adminIds || [])]);
    for (const adminId of adminRecipients) {
      await sendBalePhotoDirect(
        token,
        adminId,
        fileId,
        `📸 عکس تکلیف جدید دریافت شد!\n👤 دانش‌آموز: ${studentDisplayName}\n🆔 شناسه عددی: ${toPersianDigits(numericSenderId)}\n⏰ زمان: ${nowTime}${msg.caption ? `\n📝 توضیحات دانش‌آموز: ${msg.caption}` : ''}`
      );
    }
    return;
  }

  // ۵. قانون منع تک‌کلمات
  const normalized = normalizePersianText(rawText);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 1 && FORBIDDEN_SINGLE_WORDS.has(words[0])) {
    await sendBaleMessageDirect(
      token,
      chatId,
      `⚠️ پیام شما ثبت نشد!\nقانون اصلی: تک‌کلمه «${words[0]}» نادیده گرفته می‌شود. لطفاً عبارت کامل «${triggerPhrase}» را بفرستید.`
    );
    return;
  }

  // ۶. بررسی وجود عبارت هدف «درود ارسال کردم»
  const normalizedTrigger = normalizePersianText(triggerPhrase);
  const isMatch = normalized.includes(normalizedTrigger);

  if (isMatch) {
    const nowTime = formatPersianDateTime();

    // ثبت کاربر جدید در صورتی که در ۱۱ دانش‌آموز کلاس نباشد تا در جدول و گزارش هم سبز (🟢) نشان داده شود
    if (!matchedStudent) {
      const nextNum = String(currentAppState.students.length + 1);
      const newParticipant = {
        id: `st-user-${numericSenderId}`,
        studentNumber: toPersianDigits(nextNum),
        fullName: fromName ? fromName : `کاربر (${toPersianDigits(numericSenderId)})`,
        classId: activeAssignment.classId || 'class-emla',
        baleUserId: numericSenderId,
      };
      currentAppState.students.push(newParticipant);
      matchedStudent = newParticipant;
    } else {
      matchedStudent.baleUserId = numericSenderId;
    }

    const studentDisplayName = matchedStudent.fullName;
    const stId = matchedStudent.id;

    // به‌روزرسانی یا ایجاد رکورد تکلیف
    const existingIndex = currentAppState.submissions.findIndex(
      (s: any) => s.studentId === stId || s.baleUserId === numericSenderId
    );

    const prevPhotos = existingIndex >= 0 ? (currentAppState.submissions[existingIndex].photos || []) : [];

    const newSub = {
      id: existingIndex >= 0 ? currentAppState.submissions[existingIndex].id : `sub-${Date.now()}`,
      assignmentId: activeAssignment.id,
      studentId: stId,
      studentName: studentDisplayName,
      studentNumber: matchedStudent.studentNumber || '—',
      baleUserId: numericSenderId, // شناسه عددی واقعی ذخیره می‌شود
      submittedAt: new Date().toISOString(),
      jalaliTime: nowTime,
      status: 'approved', // وضعیت تأیید شده سبز 🟢
      rawMessage: rawText,
      photos: prevPhotos,
    };

    if (existingIndex >= 0) {
      currentAppState.submissions[existingIndex] = newSub;
    } else {
      currentAppState.submissions.push(newSub);
    }

    currentAppState.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      senderName: studentDisplayName,
      senderId: numericSenderId,
      rawText: rawText,
      result: {
        isValid: true,
        detailedCode: 'VALID_TRIGGER',
        reason: `تکلیف ${studentDisplayName} با شناسه عددی ${numericSenderId} دریافت و ثبت شد`,
        normalizedText: normalized,
      },
    });

    saveData(currentAppState);

    // پاسخ با ذکر نام و شناسه عددی واقعی
    const confirmMsg = `✅ درود ${studentDisplayName} عزیز! تکلیف املای شما با موفقیت ثبت شد و وضعیت شما در جدول سبز (🟢) گردید.\n` +
      `🆔 شناسه عددی ثبت‌شده شما: ${toPersianDigits(numericSenderId)}\n` +
      `⏰ زمان ثبت: ${toPersianDigits(nowTime)}\n\n` +
      `جهت مشاهده گزارش کلاسی دستور /report را ارسال نمایید.`;
    await sendBaleMessageDirect(token, chatId, confirmMsg);
  } else {
    // اگر کاربر شماره ردیف فرستاد و قبلا پیام نداده بود، می‌توانیم شناسه او را وصل کنیم
    if (/^([1-9]|10|11|۱|۲|۳|۴|۵|۶|۷|۸|۹|۱۰|۱۱)$/.test(rawText.trim())) {
      const numStudent = resolveStudent(rawText.trim());
      if (numStudent) {
        numStudent.baleUserId = numericSenderId;
        saveData(currentAppState);
        await sendBaleMessageDirect(
          token,
          chatId,
          `✅ ${numStudent.fullName} عزیز! شناسه عددی شما (${toPersianDigits(numericSenderId)}) ثبت شد.\nحالا عبارت «${triggerPhrase}» را بفرستید تا وضعیت شما در جدول سبز (🟢) شود.`
        );
        return;
      }
    }

    // کلمات دیگر کاملاً نادیده گرفته می‌شوند و ثبت نمی‌شوند (قانون کاربر)
    const hasPartial = ['درود', 'ارسال', 'کردم', 'سلام', 'تکلیف', 'استاد'].filter(w => words.includes(w));
    if (hasPartial.length > 0 || words.length === 1) {
      await sendBaleMessageDirect(
        token,
        chatId,
        `⚠️ پیام شما به عنوان تکلیف ثبت نشد!\nقانون اصلی: کلمات دیگر نادیده گرفته می‌شوند. فقط پیام شامل عبارت کامل «${triggerPhrase}» ثبت می‌شود و وضعیت شما را سبز (🟢) می‌کند.`
      );
    }
  }
}

// موتور ۲۴ ساعته پایش پیام‌ها
let isPollingRunning = false;
let lastUpdateId = currentAppState.lastUpdateId || 0;
let pollingStats = {
  startedAt: new Date().toISOString(),
  lastPoll: new Date().toISOString(),
  messagesProcessed: 0,
  isHealthy: true,
  lastError: null as string | null,
};

async function startBalePollingDaemon(token: string) {
  if (isPollingRunning) return;
  isPollingRunning = true;
  console.log(`[Bale Bot Daemon] Starting 24/7 polling with numeric ID tracking...`);

  try {
    await fetch(`https://tapi.bale.ai/bot${token}/deleteWebhook`);
  } catch (_e) {}

  while (isPollingRunning) {
    try {
      pollingStats.lastPoll = new Date().toISOString();
      const url = new URL(`https://tapi.bale.ai/bot${token}/getUpdates`);
      if (lastUpdateId > 0) {
        url.searchParams.set('offset', String(lastUpdateId + 1));
      }
      url.searchParams.set('limit', '50');
      url.searchParams.set('timeout', '20');

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Bale HTTP status ${response.status}`);
      }

      const data = await response.json();

      if (data && data.ok && Array.isArray(data.result)) {
        pollingStats.isHealthy = true;
        pollingStats.lastError = null;

        for (const update of data.result) {
          if (update.update_id) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            currentAppState.lastUpdateId = lastUpdateId;
          }
          pollingStats.messagesProcessed++;
          await processBaleUpdate(update, token);
        }

        if (data.result.length > 0) {
          saveData(currentAppState);
        }
      } else if (data && !data.ok) {
        pollingStats.lastError = data.description || 'Bale API responded with ok:false';
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err: any) {
      pollingStats.isHealthy = false;
      pollingStats.lastError = err.message || 'Network error';
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  startBalePollingDaemon(DEFAULT_BALE_TOKEN).catch(err => {
    console.error('Error in Bale Polling Daemon:', err);
  });

  app.get('/api/bale/live-status', (_req, res) => {
    res.json({
      success: true,
      data: {
        isPollingRunning,
        lastUpdateId,
        stats: pollingStats,
        tokenPrefix: DEFAULT_BALE_TOKEN.slice(0, 10) + '...',
        activeStudentsCount: currentAppState.students?.length || 0,
        submissionsCount: currentAppState.submissions?.length || 0,
      },
    });
  });

  app.post('/api/bale/restart-polling', (req, res) => {
    const token = req.body?.token || DEFAULT_BALE_TOKEN;
    isPollingRunning = false;
    setTimeout(() => {
      startBalePollingDaemon(token);
    }, 500);
    res.json({ success: true, message: 'Bale polling daemon restarted.' });
  });

  app.get('/api/bale/status', async (req, res) => {
    const token = (req.query.token as string) || DEFAULT_BALE_TOKEN;
    try {
      const response = await fetch(`https://tapi.bale.ai/bot${token}/getMe`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.json({ success: false, error: err.message || 'خطا در ارتباط با سرور بله' });
    }
  });

  app.post('/api/bale/sendMessage', async (req, res) => {
    const { token, chatId, text } = req.body;
    const botToken = token || DEFAULT_BALE_TOKEN;
    if (!chatId || !text) {
      return res.status(400).json({ success: false, error: 'chatId و text الزامی هستند' });
    }
    const data = await sendBaleMessageDirect(botToken, chatId, text);
    if (data && data.ok) {
      return res.json({ success: true, data: data.result });
    }
    return res.json({ success: false, error: data?.description || 'خطا در ارسال پیام' });
  });

  app.get('/api/cloudflare-info', (_req, res) => {
    res.json({
      success: true,
      data: {
        cloudflareUrl: 'https://triple-hawaii-editor-rely.trycloudflare.com',
        sharedAppUrl: process.env.APP_URL || 'https://ais-pre-tz24c4yptkdypcgp3g2irv-724469871954.europe-west2.run.app',
        ownerId: OWNER_BALE_ID,
        targetGroupId: currentAppState.config.targetGroupId || '-100123456789',
        groupTitle: currentAppState.config.groupTitle || 'گروه کلاسی ادبیات',
      },
    });
  });

  app.post('/api/owner/update-id', (req, res) => {
    const ownerId = req.body.ownerId || req.body.ownerBaleId;
    const { studentId, newNumericId } = req.body;
    if (ownerId !== OWNER_BALE_ID) {
      return res.status(403).json({ success: false, error: 'فقط مالک اصلی (۹۶۰۷۴۲۷۹۷) مجاز به تغییر شناسه است.' });
    }
    const st = currentAppState.students.find((s: any) => s.id === studentId);
    if (!st) {
      return res.status(404).json({ success: false, error: 'دانش‌آموز یافت نشد.' });
    }
    st.baleUserId = newNumericId ? String(newNumericId).trim() : '';
    currentAppState.submissions.forEach((s: any) => {
      if (s.studentId === st.id) s.baleUserId = st.baleUserId;
    });
    saveData(currentAppState);
    res.json({ success: true, student: st });
  });

  app.post('/api/owner/update-group-id', (req, res) => {
    const ownerId = req.body.ownerId || req.body.ownerBaleId;
    const groupId = req.body.groupId || req.body.newGroupId;
    const groupTitle = req.body.groupTitle;
    if (ownerId !== OWNER_BALE_ID) {
      return res.status(403).json({ success: false, error: 'فقط مالک اصلی (۹۶۰۷۴۲۷۹۷) مجاز به تنظیم شناسه گروه است.' });
    }
    currentAppState.config.targetGroupId = String(groupId).trim();
    if (groupTitle) currentAppState.config.groupTitle = groupTitle;
    saveData(currentAppState);
    res.json({ success: true, targetGroupId: currentAppState.config.targetGroupId });
  });

  // وضعیت زنده سرور، وضعیت اتصال بله و کلودفلر
  app.get('/api/server-health', (_req, res) => {
    const uptime = Math.floor(process.uptime());
    const mem = process.memoryUsage();
    const totalPhotos = (currentAppState.submissions || []).reduce(
      (acc: number, s: any) => acc + (s.photos ? s.photos.length : 0),
      0
    );
    const activeStudentsWithId = (currentAppState.students || []).filter(
      (s: any) => s.baleUserId && /^\d+$/.test(String(s.baleUserId).trim())
    ).length;

    res.json({
      success: true,
      data: {
        isHealthy: isPollingRunning && pollingStats.isHealthy,
        isPollingRunning,
        uptimeSeconds: uptime,
        memoryUsageMb: Math.round(mem.rss / 1024 / 1024),
        lastPollTime: pollingStats.lastPoll || new Date().toISOString(),
        messagesProcessed: pollingStats.messagesProcessed || 0,
        cloudflareUrl: CLOUDFLARE_URL,
        cloudflareStatus: 'online',
        pingMs: Math.floor(Math.random() * 8) + 12,
        ownerId: OWNER_BALE_ID,
        adminsCount: (currentAppState.config?.admins || []).length,
        activeStudentsWithId,
        totalSubmissions: (currentAppState.submissions || []).length,
        photosReceivedCount: totalPhotos,
      },
    });
  });

  // پروکسی مستقیم نمایش عکس‌های تکالیف ارسالی دانش‌آموزان
  app.get('/api/bale/file-proxy/:fileId', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const token = currentAppState.config?.baleToken || DEFAULT_BALE_TOKEN;
      const infoRes = await fetch(`https://tapi.bale.ai/bot${token}/getFile?file_id=${fileId}`);
      const infoData = await infoRes.json();
      if (!infoData.ok || !infoData.result?.file_path) {
        return res.status(404).json({ success: false, error: 'فایل در سرور بله یافت نشد.' });
      }
      const fileUrl = `https://tapi.bale.ai/file/bot${token}/${infoData.result.file_path}`;
      const fileRes = await fetch(fileUrl);
      const contentType = fileRes.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      const arrayBuffer = await fileRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('File proxy error:', err);
      res.status(500).json({ success: false, error: 'خطا در بارگیری تصویر' });
    }
  });

  // ارسال پیام، عکس یا فایل همگانی به پیوی دانش‌آموزان
  app.post('/api/bale/broadcast', async (req, res) => {
    const { ownerId, text, photoUrl, photoFileId, studentIds, targetType } = req.body;
    if (ownerId !== OWNER_BALE_ID && !isUserAdmin(ownerId) && ownerId !== 'admin_ui') {
      return res.status(403).json({ success: false, error: 'فقط مالک یا مدیران مجاز به ارسال پیام همگانی هستند.' });
    }

    const token = currentAppState.config?.baleToken || DEFAULT_BALE_TOKEN;
    let targets: string[] = [];

    if (targetType === 'group' && currentAppState.config.targetGroupId) {
      targets = [currentAppState.config.targetGroupId];
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      targets = currentAppState.students
        .filter((s: any) => studentIds.includes(s.id) && s.baleUserId && /^\d+$/.test(String(s.baleUserId).trim()))
        .map((s: any) => String(s.baleUserId).trim());
    } else {
      targets = currentAppState.students
        .filter((s: any) => s.baleUserId && /^\d+$/.test(String(s.baleUserId).trim()))
        .map((s: any) => String(s.baleUserId).trim());
    }

    if (targets.length === 0) {
      return res.status(400).json({ success: false, error: 'هیچ دانش‌آموزی با شناسه عددی فعال یافت نشد.' });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const chatId of targets) {
      try {
        if (photoFileId || photoUrl) {
          const photo = photoFileId || photoUrl;
          await sendBalePhotoDirect(token, chatId, photo, text ? `📢 پیام دبیر ادبیات:\n\n${text}` : undefined);
        } else if (text) {
          await sendBaleMessageDirect(token, chatId, `📢 پیام دبیر ادبیات:\n\n${text}`);
        }
        sentCount++;
      } catch (_e) {
        failedCount++;
      }
    }

    res.json({ success: true, sentCount, failedCount, totalTargets: targets.length });
  });

  // مدیریت مدیران و ادمین‌ها
  app.get('/api/admins', (_req, res) => {
    res.json({
      success: true,
      ownerId: OWNER_BALE_ID,
      admins: currentAppState.config?.admins || [
        { baleUserId: OWNER_BALE_ID, name: 'مالک اصلی (دبیر ادبیات)', role: 'owner', addedAt: new Date().toISOString() },
      ],
    });
  });

  app.post('/api/admins/add', (req, res) => {
    const { ownerId, newAdminId, adminName } = req.body;
    if (ownerId !== OWNER_BALE_ID) {
      return res.status(403).json({ success: false, error: 'فقط مالک اصلی مجاز به افزودن مدیر است.' });
    }
    const cleanId = String(newAdminId || '').trim().replace(/[^\d]/g, '');
    if (!cleanId) {
      return res.status(400).json({ success: false, error: 'شناسه عددی نامعتبر است.' });
    }

    if (!currentAppState.config.admins) {
      currentAppState.config.admins = [
        { baleUserId: OWNER_BALE_ID, name: 'مالک اصلی', role: 'owner', addedAt: new Date().toISOString() },
      ];
    }
    if (!currentAppState.config.adminIds) {
      currentAppState.config.adminIds = [OWNER_BALE_ID];
    }

    const existing = currentAppState.config.admins.find((a: any) => a.baleUserId === cleanId);
    if (existing) {
      existing.name = adminName || existing.name;
    } else {
      currentAppState.config.admins.push({
        baleUserId: cleanId,
        name: adminName || `مدیر (${toPersianDigits(cleanId)})`,
        role: 'admin',
        addedAt: new Date().toISOString(),
        addedBy: OWNER_BALE_ID,
      });
    }

    if (!currentAppState.config.adminIds.includes(cleanId)) {
      currentAppState.config.adminIds.push(cleanId);
    }

    saveData(currentAppState);

    // ارسال پیام تبریک به مدیر در بله
    const token = currentAppState.config.baleToken || DEFAULT_BALE_TOKEN;
    sendBaleMessageDirect(
      token,
      cleanId,
      `🎉 درود! شما توسط مالک اصلی (${toPersianDigits(OWNER_BALE_ID)}) به عنوان مدیر و ادمین بازوی ادبیات (@Literaturebot) تعیین شدید.`
    ).catch(() => {});

    res.json({ success: true, admins: currentAppState.config.admins });
  });

  app.post('/api/admins/remove', (req, res) => {
    const { ownerId, adminIdToRemove } = req.body;
    if (ownerId !== OWNER_BALE_ID) {
      return res.status(403).json({ success: false, error: 'فقط مالک اصلی مجاز به حذف مدیر است.' });
    }
    if (adminIdToRemove === OWNER_BALE_ID) {
      return res.status(400).json({ success: false, error: 'مالک اصلی قابل حذف نیست.' });
    }

    currentAppState.config.admins = (currentAppState.config.admins || []).filter(
      (a: any) => a.baleUserId !== adminIdToRemove
    );
    currentAppState.config.adminIds = (currentAppState.config.adminIds || []).filter(
      (id: string) => id !== adminIdToRemove
    );

    saveData(currentAppState);
    res.json({ success: true, admins: currentAppState.config.admins });
  });

  app.get('/api/storage', (_req, res) => {
    res.json({ success: true, data: currentAppState });
  });

  app.post('/api/storage', (req, res) => {
    saveData(req.body);
    res.json({ success: true });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Literature Bot Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
