import React, { useState, useMemo } from 'react';
import {
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  CornerDownLeft,
  Share2,
  Quote,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { Assignment, ClassGroup, Student, BotLog } from '../types';
import {
  validateHomeworkMessage,
  formatPersianDateTime,
  toPersianDigits,
} from '../utils/textNormalizer';

interface BotSimulatorProps {
  assignment: Assignment;
  classGroup: ClassGroup;
  students: Student[];
  onRecordSubmission: (student: Student, rawMessage: string, logItem: BotLog) => void;
  existingSubmittedStudentIds: Set<string>;
  onExecuteCommand: (command: string) => string;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'accepted' | 'rejected' | 'command';
  reason?: string;
  isForwarded?: boolean;
  isQuoted?: boolean;
}

export const BotSimulator: React.FC<BotSimulatorProps> = ({
  assignment,
  classGroup,
  students,
  onRecordSubmission,
  existingSubmittedStudentIds,
  onExecuteCommand,
}) => {
  const classStudents = students.filter((s) => s.classId === classGroup.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    classStudents[0]?.id || ''
  );
  const [inputText, setInputText] = useState('');
  const [isForwarded, setIsForwarded] = useState(false);
  const [isQuoted, setIsQuoted] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      senderName: 'ربات پشتیبان ادبیات (@Literaturebot)',
      text: `درود! ربات پشتیبان ادبیات آماده دریافت تکالیف درس «${assignment.subject}» است.\n📌 برای ثبت تکلیف، عبارت دقیق «${assignment.customTriggerPhrase || 'درود ارسال کردم'}» را ارسال نمایید.`,
      timestamp: formatPersianDateTime(),
      status: 'command',
    },
  ]);

  const [lastDiagnostic, setLastDiagnostic] = useState<{
    raw: string;
    normalized: string;
    isValid: boolean;
    reason: string;
    code: string;
  } | null>(null);

  const selectedStudent = useMemo(() => {
    if (selectedStudentId === 'other-user') {
      return {
        id: 'st-user-554433',
        fullName: 'کاربر دیگر (شناسه ۵۵۴۴۳۳)',
        studentNumber: toPersianDigits(students.length + 1),
        classId: classGroup.id,
        baleUserId: '554433',
      };
    }
    return classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];
  }, [selectedStudentId, classStudents, students.length, classGroup.id]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    const timeStr = formatPersianDateTime();
    const student = selectedStudent;
    if (!student) return;

    // ۱. بررسی دستورات مدیریتی
    if (text.startsWith('/')) {
      const commandResponse = onExecuteCommand(text);

      const studentMsg: ChatMessage = {
        id: `chat-${Date.now()}-user`,
        sender: 'student',
        senderName: `${student.fullName} (مدیر/کاربر)`,
        text,
        timestamp: timeStr,
        status: 'command',
      };

      const botReplyMsg: ChatMessage = {
        id: `chat-${Date.now()}-bot`,
        sender: 'bot',
        senderName: 'ربات پشتیبان ادبیات (@Literaturebot)',
        text: commandResponse,
        timestamp: timeStr,
        status: 'command',
      };

      setChatHistory((prev) => [...prev, studentMsg, botReplyMsg]);
      setInputText('');
      setLastDiagnostic({
        raw: text,
        normalized: text,
        isValid: true,
        reason: 'دستور سیستمی اجرا شد.',
        code: 'COMMAND_EXECUTION',
      });
      return;
    }

    // ۲. بررسی هوشمند تکلیف طبق قوانین تعریف شده
    const isDuplicate = existingSubmittedStudentIds.has(student.id);
    const triggerPhrase = assignment.customTriggerPhrase || 'درود ارسال کردم';

    const check = validateHomeworkMessage({
      rawText: text,
      isForwarded,
      isQuoted,
      isOpen: assignment.isOpen,
      triggerPhrase,
      isDuplicateStudent: isDuplicate,
    });

    setLastDiagnostic({
      raw: text,
      normalized: check.normalizedInput,
      isValid: check.isValid,
      reason: check.reason,
      code: check.detailedCode,
    });

    const studentMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      sender: 'student',
      senderName: student.fullName,
      text,
      timestamp: timeStr,
      status: check.isValid ? 'accepted' : 'rejected',
      reason: check.reason,
      isForwarded,
      isQuoted,
    };

    // پاسخ خودکار ربات در چت
    let botReplyText = '';
    if (check.isValid) {
      if (check.detailedCode === 'DUPLICATE_SUBMISSION') {
        botReplyText = `✅ ${student.fullName} گرامی، تکلیف شما پیش‌تر ثبت شده بود و زمان ارسال با موفقیت بازبینی و به‌روزرسانی شد.`;
      } else {
        botReplyText = `✅ درود ${student.fullName} عزیز! تکلیف شما برای موضوع «${assignment.title}» با موفقیت ثبت شد.\n⏰ ساعت ثبت: ${toPersianDigits(timeStr)}`;
      }

      // لاگ و ثبت رسمی
      const logItem: BotLog = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        senderName: student.fullName,
        senderId: student.baleUserId || student.id,
        rawText: text,
        isForwarded,
        isQuoted,
        result: {
          isValid: true,
          detailedCode: check.detailedCode,
          reason: check.reason,
          normalizedText: check.normalizedInput,
          studentFound: student,
        },
      };

      onRecordSubmission(student, text, logItem);
    } else {
      // دلیل رد شدن پیام بر اساس قانون اصلی
      botReplyText = `⚠️ پیام شما به عنوان تکلیف ثبت نشد!\n🔍 علت: ${check.reason}\n\n📌 یادآوری قانون ربات: پیام فقط با ارسال عبارت کامل «${triggerPhrase}» تأیید خواهد شد.`;
    }

    const botReplyMsg: ChatMessage = {
      id: `chat-${Date.now()}-bot`,
      sender: 'bot',
      senderName: 'ربات پشتیبان ادبیات (@Literaturebot)',
      text: botReplyText,
      timestamp: timeStr,
      status: check.isValid ? 'accepted' : 'rejected',
      reason: check.reason,
    };

    setChatHistory((prev) => [...prev, studentMsg, botReplyMsg]);
    setInputText('');
  };

  const runQuickTest = (presetText: string, forward = false, quote = false) => {
    setIsForwarded(forward);
    setIsQuoted(quote);
    setInputText(presetText);
    setTimeout(() => {
      handleSendMessage(presetText);
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Right Column: Interactive Chat Interface (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-xs">
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
              📚
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>ربات پشتیبان ادبیات</span>
                <span className="text-[11px] font-mono text-emerald-300">@Literaturebot</span>
              </div>
              <div className="text-[11px] text-slate-300">
                پیام‌رسان بله (ble.ir/Literaturebot) · پایش هوشمند تکالیف
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setChatHistory([]);
              setLastDiagnostic(null);
            }}
            title="پاک کردن سابقه گفتگو"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Sender Configuration Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">فرستنده پیام:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} (کد: {toPersianDigits(st.studentNumber)})
                </option>
              ))}
              <option value="other-user">➕ کاربر متفرقه / دانش‌آموز دیگر (شناسه: ۵۵۴۴۳۳)</option>
            </select>
          </div>

          {/* Forward and Quote Simulation Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsForwarded(!isForwarded)}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                isForwarded
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Share2 className="w-3 h-3" />
              <span>{isForwarded ? 'فوروارد شده (فعال)' : 'فوروارد معمولی'}</span>
            </button>

            <button
              onClick={() => setIsQuoted(!isQuoted)}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                isQuoted
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Quote className="w-3 h-3" />
              <span>{isQuoted ? 'نقل‌قول / Reply (فعال)' : 'پیام مستقل'}</span>
            </button>
          </div>
        </div>

        {/* Chat Transcript Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {chatHistory.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[10px] text-slate-400 mb-1 px-1">
                  {msg.senderName} · {toPersianDigits(msg.timestamp)}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    isBot
                      ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                      : msg.status === 'accepted'
                      ? 'bg-emerald-700 text-white rounded-br-xs'
                      : msg.status === 'rejected'
                      ? 'bg-amber-100 border border-amber-300 text-amber-950 rounded-br-xs'
                      : 'bg-slate-800 text-white rounded-br-xs'
                  }`}
                >
                  {/* Badges for forwarded / quoted */}
                  {msg.isForwarded && (
                    <div className="text-[10px] mb-1 opacity-80 flex items-center gap-1">
                      <Share2 className="w-2.5 h-2.5" />
                      <span>پیام فوروارد شده از فرد دیگر</span>
                    </div>
                  )}
                  {msg.isQuoted && (
                    <div className="text-[10px] mb-1 opacity-80 flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5" />
                      <span>پاسخ به پیام نقل‌قول شده</span>
                    </div>
                  )}

                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="پیام دانش‌آموز یا دستور مدیریتی (مانند /report یا درود ارسال کردم)..."
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>ارسال</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Left Column: Quick Test Scenarios & Diagnostics (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Diagnostic Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span>موتور تحلیل و تشخیص هوشمند</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Strict Regex & NLP</span>
          </div>

          {lastDiagnostic ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">نتیجه بررسی:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    lastDiagnostic.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {lastDiagnostic.isValid ? '✅ مورد تأیید' : '❌ رد پیام'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">متن خام دریافتی:</span>
                <code className="text-slate-800 bg-slate-100 px-2 py-1 rounded block text-[11px] font-mono mt-0.5 truncate">
                  {lastDiagnostic.raw}
                </code>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">متن نرمال‌شده (حذف فاصله و اعراب):</span>
                <code className="text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded block text-[11px] font-mono mt-0.5 truncate">
                  {lastDiagnostic.normalized || '(خالی)'}
                </code>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block text-[11px]">توضیح سیستم:</span>
                <p className="text-slate-700 mt-1 leading-relaxed text-[11px]">
                  {lastDiagnostic.reason}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              یک پیام ارسال کنید یا روی یکی از دکمه‌های آزمون سریع زیر کلیک کنید تا فرآیند تحلیل نمایش داده شود.
            </div>
          )}
        </div>

        {/* Quick Test Scenarios according to requirements */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-800 mb-2.5">
            آزمون سناریوهای تعریف‌شده (تست قوانین):
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Valid phrase */}
            <button
              onClick={() => runQuickTest('درود ارسال کردم')}
              className="w-full text-right p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-between"
            >
              <span>✅ عبارت دقیق «درود ارسال کردم»</span>
              <span className="text-[10px] font-medium text-emerald-700">ثبت موفق</span>
            </button>

            {/* Valid phrase with extra spaces and ZWNJ */}
            <button
              onClick={() => runQuickTest('درود    ارسال‌کردم')}
              className="w-full text-right p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-between"
            >
              <span>✅ فاصله اضافی + نیم‌فاصله («درود    ارسال‌کردم»)</span>
              <span className="text-[10px] font-medium text-emerald-700">ثبت هوشمند</span>
            </button>

            {/* Banned single word 1 */}
            <button
              onClick={() => runQuickTest('درود')}
              className="w-full text-right p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-900 flex items-center justify-between transition-colors"
            >
              <span>❌ تک‌کلمه «درود»</span>
              <span className="text-[10px] font-medium text-rose-700">رد صریح</span>
            </button>

            {/* Banned single word 2 */}
            <button
              onClick={() => runQuickTest('ارسال')}
              className="w-full text-right p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-900 flex items-center justify-between transition-colors"
            >
              <span>❌ تک‌کلمه «ارسال»</span>
              <span className="text-[10px] font-medium text-rose-700">رد صریح</span>
            </button>

            {/* Banned single word 3 */}
            <button
              onClick={() => runQuickTest('کردم')}
              className="w-full text-right p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-900 flex items-center justify-between transition-colors"
            >
              <span>❌ تک‌کلمه «کردم»</span>
              <span className="text-[10px] font-medium text-rose-700">رد صریح</span>
            </button>

            {/* Chitchat */}
            <button
              onClick={() => runQuickTest('سلام استاد خسته نباشید')}
              className="w-full text-right p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-700 flex items-center justify-between"
            >
              <span>❌ چت عادی: «سلام استاد خسته نباشید»</span>
              <span className="text-[10px] font-medium text-amber-700">نادیده</span>
            </button>

            {/* Forwarded test */}
            <button
              onClick={() => runQuickTest('درود ارسال کردم', true, false)}
              className="w-full text-right p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 flex items-center justify-between"
            >
              <span>❌ پیام فوروارد شده (حتی با متن درست)</span>
              <span className="text-[10px] font-medium text-rose-700">ممنوع</span>
            </button>

            {/* Quoted / Reply test */}
            <button
              onClick={() => runQuickTest('درود ارسال کردم', false, true)}
              className="w-full text-right p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 flex items-center justify-between"
            >
              <span>❌ پاسخ نقل‌قولی به پیام دیگر</span>
              <span className="text-[10px] font-medium text-rose-700">ممنوع</span>
            </button>
          </div>
        </div>

        {/* Quick Admin Commands */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-800 mb-2">دستورات سریع مدیریتی:</div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {['/start', '/report', '/list', '/help', '/new', '/reset'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => runQuickTest(cmd)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono font-medium text-center text-xs transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
