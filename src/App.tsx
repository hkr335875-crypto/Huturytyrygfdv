/**
 * سامانه مدیریت هوشمند و بازوی پشتیبان ادبیات (@Literaturebot)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Send,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  ExternalLink,
  Radio,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StatSummary } from './components/StatSummary';
import { AssignmentSelector } from './components/AssignmentSelector';
import { SubmissionTable } from './components/SubmissionTable';
import { BotSimulator } from './components/BotSimulator';
import { ClassRosterManager } from './components/ClassRosterManager';
import { AssignmentsList } from './components/AssignmentsList';
import { ReportModal } from './components/ReportModal';
import { NewAssignmentModal } from './components/NewAssignmentModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { GroupAndIdsModal } from './components/GroupAndIdsModal';
import { ServerStatusModal } from './components/ServerStatusModal';
import { BroadcastModal } from './components/BroadcastModal';
import { StudentPhotosModal } from './components/StudentPhotosModal';
import {
  Assignment,
  BotConfig,
  BotLog,
  ClassGroup,
  Student,
  Submission,
  SubmissionStatus,
} from './types';
import { loadAppState, saveAppState, AppState } from './services/storage';
import { formatPersianDateTime, toPersianDigits } from './utils/textNormalizer';
import { fetchBaleBotInfo } from './services/baleApi';
import { generateLiteratureReport } from './utils/reportGenerator';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<
    'submissions' | 'simulator' | 'roster' | 'assignments'
  >('submissions');

  // Modal visibility states
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGroupAndIdsModal, setShowGroupAndIdsModal] = useState(false);
  const [showServerStatusModal, setShowServerStatusModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedPhotoSubmission, setSelectedPhotoSubmission] = useState<Submission | null>(null);

  // Group and Cloudflare URL states
  const [targetGroupId, setTargetGroupId] = useState('-100123456789');
  const [groupTitle, setGroupTitle] = useState('گروه کلاسی ادبیات');
  const [cloudflareUrl, setCloudflareUrl] = useState('https://triple-hawaii-editor-rely.trycloudflare.com');

  // Bale Bot server connection indicator
  const [botStatusOk, setBotStatusOk] = useState(true);
  const [liveStats, setLiveStats] = useState<{
    isPollingRunning: boolean;
    messagesProcessed: number;
    lastPoll: string;
  } | null>(null);

  // دریافت اطلاعات کلودفلر و شناسه گروه از سرور
  useEffect(() => {
    const fetchCloudflare = () => {
      fetch('/api/cloudflare-info')
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            if (res.data.cloudflareUrl) setCloudflareUrl(res.data.cloudflareUrl);
            if (res.data.targetGroupId) setTargetGroupId(res.data.targetGroupId);
            if (res.data.groupTitle) setGroupTitle(res.data.groupTitle);
          }
        })
        .catch(() => {});
    };
    fetchCloudflare();
    const interval = setInterval(fetchCloudflare, 10000);
    return () => clearInterval(interval);
  }, []);

  // دریافت داده‌های سرور در شروع برنامه
  useEffect(() => {
    fetch('/api/storage')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setAppState((prev) => ({
            ...prev,
            submissions: res.data.submissions || prev.submissions,
            students: res.data.students || prev.students,
            assignments: res.data.assignments || prev.assignments,
            config: { ...prev.config, ...(res.data.config || {}) },
            logs: res.data.logs || prev.logs,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ذخیره خودکار تغییرات در حافظه محلی
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // پایش زنده ربات و همگام‌سازی پیام‌های دریافتی از بله
  useEffect(() => {
    const checkDaemon = () => {
      fetch('/api/bale/live-status')
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            setBotStatusOk(res.data.isPollingRunning);
            setLiveStats({
              isPollingRunning: res.data.isPollingRunning,
              messagesProcessed: res.data.stats?.messagesProcessed || 0,
              lastPoll: res.data.stats?.lastPoll || '',
            });
          }
        })
        .catch(() => {});

      // دریافت آخرین ثبت‌های انجام‌شده از طریق ربات بله
      fetch('/api/storage')
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data && Array.isArray(res.data.submissions)) {
            setAppState((prev) => {
              const serverSubs = res.data.submissions;
              const serverStudents = res.data.students || prev.students;
              const serverLogs = res.data.logs || prev.logs;

              const isDiff =
                JSON.stringify(serverSubs) !== JSON.stringify(prev.submissions) ||
                JSON.stringify(serverStudents) !== JSON.stringify(prev.students);

              if (isDiff) {
                return {
                  ...prev,
                  submissions: serverSubs,
                  students: serverStudents,
                  logs: serverLogs,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    };

    checkDaemon();
    const interval = setInterval(checkDaemon, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeClass = useMemo(() => {
    return (
      appState.classes.find((c) => c.id === appState.config.activeClassId) ||
      appState.classes[0]
    );
  }, [appState.classes, appState.config.activeClassId]);

  const activeAssignment = useMemo(() => {
    return (
      appState.assignments.find((a) => a.id === appState.config.activeAssignmentId) ||
      appState.assignments[0]
    );
  }, [appState.assignments, appState.config.activeAssignmentId]);

  // Handlers for selection
  const handleSelectClass = (classId: string) => {
    const classAssign = appState.assignments.find((a) => a.classId === classId);
    setAppState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        activeClassId: classId,
        activeAssignmentId: classAssign ? classAssign.id : prev.config.activeAssignmentId,
      },
    }));
  };

  const handleSelectAssignment = (assignmentId: string) => {
    const assign = appState.assignments.find((a) => a.id === assignmentId);
    setAppState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        activeAssignmentId: assignmentId,
        activeClassId: assign ? assign.classId : prev.config.activeClassId,
      },
    }));
  };

  const handleToggleAssignmentOpen = (assignmentId: string) => {
    setAppState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((as) =>
        as.id === assignmentId ? { ...as, isOpen: !as.isOpen } : as
      ),
    }));
  };

  // Submissions management
  const handleUpdateSubmissionStatus = (submissionId: string, newStatus: SubmissionStatus) => {
    setAppState((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) =>
        s.id === submissionId ? { ...s, status: newStatus } : s
      ),
    }));
  };

  const handleUpdateSubmissionDetails = (
    submissionId: string,
    score?: string,
    teacherNote?: string
  ) => {
    setAppState((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              score: score !== undefined ? score : s.score,
              teacherNote: teacherNote !== undefined ? teacherNote : s.teacherNote,
            }
          : s
      ),
    }));
  };

  const handleManualAddSubmission = (student: Student) => {
    const timeStr = formatPersianDateTime();
    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId: activeAssignment.id,
      studentId: student.id,
      studentName: student.fullName,
      studentNumber: student.studentNumber,
      baleUserId: student.baleUserId || '',
      baleUsername: student.baleUsername,
      submittedAt: new Date().toISOString(),
      jalaliTime: timeStr,
      status: 'approved',
      rawMessage: 'ثبت دستی توسط دبیر در پیشخوان وب',
      teacherNote: 'تحویل حضوری / دستی',
    };

    setAppState((prev) => {
      const nextSubs = [
        ...prev.submissions.filter(
          (s) => !(s.assignmentId === activeAssignment.id && s.studentId === student.id)
        ),
        newSub,
      ];
      const nextState = { ...prev, submissions: nextSubs };
      saveAppState(nextState);
      return nextState;
    });

    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setAppState((prev) => {
      const nextSubs = prev.submissions.filter((s) => s.id !== submissionId);
      const nextState = { ...prev, submissions: nextSubs };
      saveAppState(nextState);
      return nextState;
    });
  };

  const handleLinkStudentBaleId = (studentId: string, numericId: string) => {
    setAppState((prev) => {
      const nextStudents = prev.students.map((st) =>
        st.id === studentId ? { ...st, baleUserId: numericId } : st
      );
      const nextState = { ...prev, students: nextStudents };
      saveAppState(nextState);
      return nextState;
    });
  };

  // تغییر شناسه عددی توسط مالک (960742797)
  const handleUpdateStudentNumericId = async (studentId: string, newId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/owner/update-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerBaleId: '960742797',
          studentId,
          newNumericId: newId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => {
          const nextStudents = prev.students.map((st) =>
            st.id === studentId ? { ...st, baleUserId: newId } : st
          );
          const nextState = { ...prev, students: nextStudents };
          saveAppState(nextState);
          return nextState;
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to update student numeric ID', e);
    }
    return false;
  };

  // تغییر شناسه عددی گروه توسط مالک (960742797)
  const handleUpdateGroupId = async (newGroupId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/owner/update-group-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerBaleId: '960742797',
          newGroupId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTargetGroupId(newGroupId);
        return true;
      }
    } catch (e) {
      console.error('Failed to update group numeric ID', e);
    }
    return false;
  };

  // Record submission from Bot Simulator
  const handleRecordFromBot = useCallback(
    (student: Student, rawMessage: string, logItem: BotLog) => {
      const timeStr = formatPersianDateTime();
      const existing = appState.submissions.find(
        (s) => s.assignmentId === activeAssignment.id && s.studentId === student.id
      );

      let updatedSubmissions: Submission[];
      if (existing) {
        updatedSubmissions = appState.submissions.map((s) =>
          s.id === existing.id
            ? {
                ...s,
                submittedAt: new Date().toISOString(),
                jalaliTime: timeStr,
                rawMessage,
                status: 'approved' as const,
              }
            : s
        );
      } else {
        const newSub: Submission = {
          id: `sub-${Date.now()}`,
          assignmentId: activeAssignment.id,
          studentId: student.id,
          studentName: student.fullName,
          studentNumber: student.studentNumber,
          baleUserId: student.baleUserId || '',
          baleUsername: student.baleUsername,
          submittedAt: new Date().toISOString(),
          jalaliTime: timeStr,
          status: 'approved',
          rawMessage,
        };
        updatedSubmissions = [...appState.submissions, newSub];
      }

      setAppState((prev) => {
        const nextState = {
          ...prev,
          submissions: updatedSubmissions,
          logs: [logItem, ...prev.logs.slice(0, 50)],
        };
        saveAppState(nextState);
        return nextState;
      });

      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    },
    [activeAssignment.id, appState.submissions]
  );

  // Create Assignment (/new)
  const handleCreateAssignment = (data: Omit<Assignment, 'id' | 'createdAt'>) => {
    const newId = `assign-${Date.now()}`;
    const newAssignment: Assignment = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      assignments: [newAssignment, ...prev.assignments],
      config: {
        ...prev.config,
        activeAssignmentId: newId,
        activeClassId: data.classId,
      },
    }));

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
  };

  // Reset Submissions (/reset) - صفر کردن همه و قرمز شدن برای دور جدید
  const handleConfirmReset = () => {
    const updatedSubmissions = appState.submissions.filter((s) => s.assignmentId !== activeAssignment.id);
    setAppState((prev) => ({
      ...prev,
      submissions: updatedSubmissions,
    }));

    // ارسال فوری به سرور جهت صفر شدن در سرور و بازوی بله
    fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...appState,
        submissions: updatedSubmissions,
      }),
    }).catch(() => {});
  };

  // Student Roster
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
      submissions: prev.submissions.filter((s) => s.studentId !== studentId),
    }));
  };

  // Update Config
  const handleUpdateConfig = (newConfig: Partial<BotConfig>) => {
    setAppState((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
  };

  // Admin Command Dispatcher (Handles /start, /report, /new, /list, /reset, /help)
  const handleExecuteCommand = useCallback(
    (commandText: string): string => {
      const cleanCmd = commandText.trim().toLowerCase().split(' ')[0];

      switch (cleanCmd) {
        case '/start':
          return (
            `📚 درود بر شما! بازوی پشتیبان ادبیات (@Literaturebot) همیشه آنلاین و فعال است.\n\n` +
            `📖 تکلیف جاری: «${activeAssignment.title}» (${activeAssignment.subject})\n` +
            `🏫 کلاس: ${activeClass.name}\n` +
            `⏳ وضعیت دریافت: ${activeAssignment.isOpen ? '🟢 فعال' : '🔴 بسته شده'}\n` +
            `🔑 عبارت دقیق جهت ثبت: «${activeAssignment.customTriggerPhrase || 'درود ارسال کردم'}»\n\n` +
            `جهت مشاهده فهرست دستورات، دستور /help را ارسال نمایید.`
          );

        case '/report':
          setShowReportModal(true);
          return generateLiteratureReport({
            assignment: activeAssignment,
            classGroup: activeClass,
            allStudents: appState.students,
            submissions: appState.submissions,
          });

        case '/new':
          setShowNewAssignmentModal(true);
          return `📝 پنجره ایجاد تکلیف جدید باز شد. لطفاً عنوان، مهلت و درس را مشخص کنید.`;

        case '/list':
          const currentStudents = appState.students.filter(
            (s) => s.classId === activeClass.id
          );
          let listStr = `📋 فهرست ۱۱ دانش‌آموز کلاس املا:\n\n`;
          currentStudents.forEach((st, idx) => {
            listStr += `${toPersianDigits(idx + 1)}. ${st.fullName} (شناسه: ${toPersianDigits(st.studentNumber)})\n`;
          });
          return listStr;

        case '/reset':
          setShowResetModal(true);
          return `🔄 دستور صفر کردن همه صادر شد. با تأیید مدیر، وضعیت تمام ۱۱ دانش‌آموز قرمز (🔴) می‌شود تا با ارسال دوباره عبارت «${activeAssignment.customTriggerPhrase || 'درود ارسال کردم'}» سبز (🟢) شوند.`;

        case '/help':
          return (
            `📖 راهنمای دستورات مدیریتی بازوی پشتیبان ادبیات:\n\n` +
            `• /start - معرفی ربات و بررسی وضعیت جاری\n` +
            `• /report - صدور گزارش کامل درصد پیشرفت و اسامی\n` +
            `• /new - تعریف تکلیف و فصل درسی جدید\n` +
            `• /list - مشاهده اسامی دانش‌آموزان کلاس\n` +
            `• /reset - پاک‌کردن گزارش تکلیف فعلی با تأیید مدیر\n` +
            `• /help - راهنمای دستورات\n\n` +
            `قانون اصلی ربات:\n` +
            `هیچ پیامی نباید صرفاً به دلیل داشتن یکی از کلمات «درود»، «ارسال» یا «کردم» ثبت شود. فقط عبارت کامل و معتبر «${activeAssignment.customTriggerPhrase || 'درود ارسال کردم'}» شناسایی خواهد شد.`
          );

        default:
          return `دستور «${cleanCmd}» شناخته نشد. برای مشاهده راهنما دستور /help را ارسال کنید.`;
      }
    },
    [activeAssignment, activeClass, appState.students, appState.submissions]
  );

  const existingSubmittedStudentIds = useMemo(() => {
    return new Set(
      appState.submissions
        .filter((s) => s.assignmentId === activeAssignment.id && s.status !== 'rejected')
        .map((s) => s.studentId)
    );
  }, [appState.submissions, activeAssignment.id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAssignment={() => setShowNewAssignmentModal(true)}
        onOpenReport={() => setShowReportModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenGroupAndIds={() => setShowGroupAndIdsModal(true)}
        onOpenServerStatus={() => setShowServerStatusModal(true)}
        onOpenBroadcast={() => setShowBroadcastModal(true)}
        botStatusOk={botStatusOk}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* 24/7 Always-On Bale Bot Live Notification Banner */}
        <div className="bg-emerald-900 text-white rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  پایش ۲۴ ساعته بازوی بله (@Literaturebot) همیشه روشن و فعال است!
                </span>
                <span className="bg-emerald-700/80 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono">
                  Online 24/7
                </span>
                <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded font-mono">
                  Cloudflare Live
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                دانش‌آموزان در هر ساعت می‌توانند عبارت دقیق «درود ارسال کردم» را به ربات بفرستند. پیام‌ها فوراً پردازش، ثبت و پاسخ داده می‌شوند.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={cloudflareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="باز کردن پیشخوان روی کلودفلر"
            >
              <span>لینک کلودفلر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://ble.ir/Literaturebot"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-white text-emerald-950 font-semibold text-xs rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>ورود به ربات در بله</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                fetch('/api/bale/restart-polling', { method: 'POST' });
                setShowSettingsModal(true);
              }}
              title="بررسی اتصال و وضعیت سرور"
              className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assignment and Class Context Bar */}
        {activeTab !== 'assignments' && (
          <>
            <AssignmentSelector
              classes={appState.classes}
              assignments={appState.assignments}
              activeClassId={appState.config.activeClassId}
              activeAssignmentId={appState.config.activeAssignmentId}
              onSelectClass={handleSelectClass}
              onSelectAssignment={handleSelectAssignment}
              onToggleAssignmentOpen={handleToggleAssignmentOpen}
              onOpenResetConfirm={() => setShowResetModal(true)}
            />

            <StatSummary
              assignment={activeAssignment}
              classGroup={activeClass}
              students={appState.students}
              submissions={appState.submissions}
            />
          </>
        )}

        {/* View Switching */}
        {activeTab === 'submissions' && (
          <SubmissionTable
            assignment={activeAssignment}
            classGroup={activeClass}
            students={appState.students}
            submissions={appState.submissions}
            onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
            onUpdateSubmissionDetails={handleUpdateSubmissionDetails}
            onManualAddSubmission={handleManualAddSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onLinkStudentBaleId={handleLinkStudentBaleId}
            onViewPhotos={(sub) => setSelectedPhotoSubmission(sub)}
          />
        )}

        {activeTab === 'simulator' && (
          <BotSimulator
            assignment={activeAssignment}
            classGroup={activeClass}
            students={appState.students}
            onRecordSubmission={handleRecordFromBot}
            existingSubmittedStudentIds={existingSubmittedStudentIds}
            onExecuteCommand={handleExecuteCommand}
          />
        )}

        {activeTab === 'roster' && (
          <ClassRosterManager
            classes={appState.classes}
            activeClassId={appState.config.activeClassId}
            onSelectClass={handleSelectClass}
            students={appState.students}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsList
            assignments={appState.assignments}
            classes={appState.classes}
            submissions={appState.submissions}
            activeAssignmentId={appState.config.activeAssignmentId}
            onSelectAssignment={(id) => {
              handleSelectAssignment(id);
              setActiveTab('submissions');
            }}
            onToggleOpen={handleToggleAssignmentOpen}
            onOpenNewAssignment={() => setShowNewAssignmentModal(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        assignment={activeAssignment}
        classGroup={activeClass}
        students={appState.students}
        submissions={appState.submissions}
        config={appState.config}
        onUpdateConfig={handleUpdateConfig}
      />

      <NewAssignmentModal
        isOpen={showNewAssignmentModal}
        onClose={() => setShowNewAssignmentModal(false)}
        classes={appState.classes}
        activeClassId={appState.config.activeClassId}
        defaultTriggerPhrase={appState.config.defaultTriggerPhrase}
        onCreateAssignment={handleCreateAssignment}
      />

      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        assignment={activeAssignment}
        adminPin={appState.config.adminPin}
        onConfirmReset={handleConfirmReset}
      />

      <AdminSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        config={appState.config}
        onSaveConfig={(cfg) => handleUpdateConfig(cfg)}
      />

      <GroupAndIdsModal
        isOpen={showGroupAndIdsModal}
        onClose={() => setShowGroupAndIdsModal(false)}
        targetGroupId={targetGroupId}
        groupTitle={groupTitle}
        students={appState.students}
        onUpdateStudentNumericId={handleUpdateStudentNumericId}
        onUpdateGroupId={handleUpdateGroupId}
        cloudflareUrl={cloudflareUrl}
      />

      <ServerStatusModal
        isOpen={showServerStatusModal}
        onClose={() => setShowServerStatusModal(false)}
        onRestartPolling={() => fetch('/api/bale/restart-polling', { method: 'POST' })}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        students={appState.students}
        targetGroupId={targetGroupId}
      />

      <StudentPhotosModal
        isOpen={Boolean(selectedPhotoSubmission)}
        onClose={() => setSelectedPhotoSubmission(null)}
        submission={selectedPhotoSubmission}
      />
    </div>
  );
}
