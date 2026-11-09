export type SubmissionStatus = 'approved' | 'pending' | 'revision' | 'excused' | 'rejected';

export interface Student {
  id: string;
  studentNumber: string; // شماره دانش‌آموزی یا کد ملی جهت جلوگیری از اشتباه نام‌های مشابه
  fullName: string;
  baleUserId?: string;
  baleUsername?: string;
  classId: string;
  notes?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  classId: string;
  createdAt: string;
  deadline: string;
  isOpen: boolean; // امکان فعال و غیرفعال کردن ثبت تکلیف
  customTriggerPhrase?: string; // امکان تعیین عبارت اختصاصی برای هر تکلیف
  description?: string;
}

export interface SubmissionPhoto {
  id: string;
  fileId: string;
  caption?: string;
  receivedAt: string;
  jalaliTime: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface AdminUser {
  baleUserId: string;
  name: string;
  role: 'owner' | 'admin';
  addedAt: string;
  addedBy?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  baleUserId: string;
  baleUsername?: string;
  submittedAt: string;
  jalaliTime: string;
  status: SubmissionStatus;
  rawMessage: string;
  score?: string;
  teacherNote?: string;
  photos?: SubmissionPhoto[];
}

export interface BotConfig {
  baleToken: string;
  botUsername: string;
  botLink: string;
  targetGroupId: string;
  defaultTriggerPhrase: string;
  adminPin: string;
  autoCloseOnDeadline: boolean;
  rejectForwards: boolean;
  rejectQuotes: boolean;
  activeClassId: string;
  activeAssignmentId: string;
  admins?: AdminUser[];
  adminIds?: string[];
  ownerId?: string;
}

export interface ServerHealthInfo {
  isHealthy: boolean;
  isPollingRunning: boolean;
  uptimeSeconds: number;
  memoryUsageMb: number;
  lastPollTime: string;
  messagesProcessed: number;
  cloudflareUrl: string;
  cloudflareStatus: 'online' | 'offline' | 'checking';
  pingMs: number;
  ownerId: string;
  adminsCount: number;
  activeStudentsWithId: number;
  totalSubmissions: number;
  photosReceivedCount: number;
}

export interface MessageValidationResult {
  isValid: boolean;
  reason: string;
  detailedCode:
    | 'VALID_TRIGGER'
    | 'SINGLE_WORD_IGNORE'
    | 'FORWARD_REJECT'
    | 'QUOTE_REJECT'
    | 'GREETING_IGNORE'
    | 'PHRASE_MISMATCH'
    | 'ASSIGNMENT_CLOSED'
    | 'DUPLICATE_SUBMISSION'
    | 'STUDENT_NOT_FOUND';
  normalizedText: string;
  studentFound?: Student;
  isDuplicate?: boolean;
}

export interface BotLog {
  id: string;
  timestamp: string;
  senderName: string;
  senderId: string;
  rawText: string;
  isForwarded?: boolean;
  isQuoted?: boolean;
  result: MessageValidationResult;
}
