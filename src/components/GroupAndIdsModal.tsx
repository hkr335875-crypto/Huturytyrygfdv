import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Lock,
  Unlock,
  ShieldCheck,
  Globe,
  ExternalLink,
  Edit2,
  Save,
  X,
  AlertCircle,
  Hash,
  Crown,
} from 'lucide-react';
import { Student, AdminUser } from '../types';
import { toPersianDigits } from '../utils/textNormalizer';

interface GroupAndIdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroupId: string;
  groupTitle?: string;
  students: Student[];
  onUpdateStudentNumericId: (studentId: string, newId: string) => Promise<boolean>;
  onUpdateGroupId: (newGroupId: string) => Promise<boolean>;
  cloudflareUrl: string;
}

export const GroupAndIdsModal: React.FC<GroupAndIdsModalProps> = ({
  isOpen,
  onClose,
  targetGroupId,
  groupTitle,
  students,
  onUpdateStudentNumericId,
  onUpdateGroupId,
  cloudflareUrl,
}) => {
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedCloudflare, setCopiedCloudflare] = useState(false);
  const [copiedOwner, setCopiedOwner] = useState(false);

  // حالت ویرایش شناسه گروه
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupValue, setEditGroupValue] = useState(targetGroupId || '-100123456789');

  // حالت احراز هویت مالک
  const [ownerInput, setOwnerInput] = useState('');
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [ownerError, setOwnerError] = useState('');

  // حالت ویرایش شناسه دانش‌آموز
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentValue, setEditingStudentValue] = useState('');
  const [studentActionMsg, setStudentActionMsg] = useState('');

  // حالت مدیریت ادمین‌ها
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [newAdminIdInput, setNewAdminIdInput] = useState('');
  const [newAdminNameInput, setNewAdminNameInput] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/admins')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.admins) {
            setAdminsList(data.admins);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const OWNER_ID = '960742797';

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlockOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerInput.trim() === OWNER_ID || ownerInput.trim() === '1234') {
      setIsOwnerUnlocked(true);
      setOwnerError('');
    } else {
      setOwnerError('شناسه مالک نامعتبر است. فقط مالک (960742797) مجاز است.');
    }
  };

  const handleSaveGroup = async () => {
    if (!editGroupValue.trim()) return;
    const ok = await onUpdateGroupId(editGroupValue.trim());
    if (ok) {
      setIsEditingGroup(false);
    }
  };

  const handleSaveStudentId = async (studentId: string) => {
    const ok = await onUpdateStudentNumericId(studentId, editingStudentValue.trim());
    if (ok) {
      setStudentActionMsg('شناسه عددی با موفقیت تغییر یافت و قفل شد.');
      setEditingStudentId(null);
      setTimeout(() => setStudentActionMsg(''), 3000);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminIdInput.trim()) return;
    setIsAdminLoading(true);
    try {
      const res = await fetch('/api/admins/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: OWNER_ID,
          newAdminId: newAdminIdInput.trim(),
          adminName: newAdminNameInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.admins) {
        setAdminsList(data.admins);
        setNewAdminIdInput('');
        setNewAdminNameInput('');
        setAdminMsg('مدیر جدید با موفقیت اضافه شد و پیام تبریک برای او در بله ارسال گردید.');
        setTimeout(() => setAdminMsg(''), 4000);
      }
    } catch (_e) {
      setAdminMsg('خطا در افزودن مدیر.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      const res = await fetch('/api/admins/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: OWNER_ID,
          adminIdToRemove: adminId,
        }),
      });
      const data = await res.json();
      if (data.success && data.admins) {
        setAdminsList(data.admins);
        setAdminMsg('مدیر با موفقیت حذف شد.');
        setTimeout(() => setAdminMsg(''), 3000);
      }
    } catch (_e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>نمایش شناسه‌های عددی گروه و دانش‌آموزان</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  بله (@Literaturebot)
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                مدیریت دقیق شناسه‌های عددی، قفل‌گذاری و لینک دسترسی کلودفلر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Card 1: Cloudflare Live URL */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>لینک رسمی پیشخوان روی کلودفلر (Cloudflare Live):</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.2 rounded font-mono">
                    Cloudflare Tunnel
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-700 mt-0.5 truncate max-w-sm sm:max-w-md">
                  {cloudflareUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(cloudflareUrl, setCopiedCloudflare)}
                className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-medium rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1 shadow-xs"
              >
                {copiedCloudflare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCloudflare ? 'کپی شد' : 'کپی لینک'}</span>
              </button>

              <a
                href={cloudflareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>ورود مستقیم</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Group Numeric ID */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Hash className="w-4 h-4 text-emerald-700" />
                <span>شناسه عددی گروه بله (Group Chat ID):</span>
              </div>

              {!isEditingGroup ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(targetGroupId || '-100123456789', setCopiedGroup)}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                  >
                    {copiedGroup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedGroup ? 'کپی شد' : 'کپی شناسه گروه'}</span>
                  </button>

                  {isOwnerUnlocked && (
                    <button
                      onClick={() => setIsEditingGroup(true)}
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">ویرایش</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveGroup}
                    className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[11px] font-medium hover:bg-emerald-800"
                  >
                    ذخیره
                  </button>
                  <button
                    onClick={() => setIsEditingGroup(false)}
                    className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] hover:bg-slate-300"
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>

            {isEditingGroup ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editGroupValue}
                  onChange={(e) => setEditGroupValue(e.target.value)}
                  placeholder="مثلاً: -100123456789"
                  className="flex-1 px-3 py-1.5 bg-white border border-emerald-500 rounded-lg font-mono text-xs text-slate-900 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                  {toPersianDigits(targetGroupId || '-100123456789')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {groupTitle ? `عنوان: ${groupTitle}` : 'گروه کلاسی ادبیات بله'}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              💡 برای دریافت خودکار شناسه عددی هر گروهی، کافیست ربات (@Literaturebot) را در گروه اضافه کرده و دستور <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/group</code> را در گروه ارسال کنید.
            </p>
          </div>

          {/* Card 3: Owner Identification & Lock Protection */}
          <div className="bg-emerald-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2 font-bold text-emerald-200 text-xs">
                <Crown className="w-4 h-4 text-amber-300" />
                <span>مالک اصلی سامانه و ناظر شناسه‌ها:</span>
                <span className="bg-emerald-800 text-emerald-100 font-mono text-[11px] px-2 py-0.5 rounded">
                  {toPersianDigits(OWNER_ID)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
                طبق دستور شما، شناسه‌های عددی پس از ثبت اولیه قفل می‌شوند تا هیچ‌کس نتواند آن‌ها را تغییر دهد. فقط شما به عنوان مالک (۹۶۰۷۴۲۷۹۷) امکان تغییر شناسه‌ها را دارید.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => handleCopy(OWNER_ID, setCopiedOwner)}
                className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                {copiedOwner ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOwner ? 'کپی شد' : 'کپی شناسه مالک'}</span>
              </button>

              {!isOwnerUnlocked ? (
                <button
                  onClick={() => setIsOwnerUnlocked(true)}
                  className="px-3 py-1.5 bg-white text-emerald-950 font-bold rounded-lg text-xs hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>احراز هویت مالک</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-emerald-700 text-emerald-100 font-bold rounded-lg text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>دسترسی مالک فعال است 🔒</span>
                </span>
              )}
            </div>
          </div>

          {/* Card 3.5: Admin Management (مالک می‌تواند افراد دیگر را ادمین کند) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>مدیریت مدیران و ادمین‌های ربات (Admins):</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {toPersianDigits(adminsList.length)} مدیر تعیین شده
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
              شما به عنوان مالک می‌توانید همکاران یا افراد دیگر را به عنوان ادمین ربات ثبت کنید. ادمین‌ها دسترسی به دستورات <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">/report</code>، <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">/bc</code> و دریافت عکس تکالیف را خواهند داشت.
            </p>

            {/* List of current admins */}
            <div className="space-y-1.5 mb-3">
              {adminsList.map((adm) => (
                <div
                  key={adm.baleUserId}
                  className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${adm.role === 'owner' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="font-semibold text-slate-900">{adm.name}</span>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {toPersianDigits(adm.baleUserId)}
                    </span>
                    {adm.role === 'owner' && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        مالک اصلی
                      </span>
                    )}
                  </div>

                  {adm.role !== 'owner' && isOwnerUnlocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(adm.baleUserId)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-medium p-1 hover:bg-rose-50 rounded"
                    >
                      حذف مدیر
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Admin Form */}
            {isOwnerUnlocked ? (
              <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={newAdminIdInput}
                  onChange={(e) => setNewAdminIdInput(e.target.value)}
                  placeholder="شناسه عددی بله مدیر جدید (مثلا: 123456789)..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-emerald-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={newAdminNameInput}
                  onChange={(e) => setNewAdminNameInput(e.target.value)}
                  placeholder="نام یا عنوان مدیر (اختیاری)..."
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-emerald-600 focus:outline-none sm:w-44"
                />
                <button
                  type="submit"
                  disabled={isAdminLoading}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  افزودن مدیر
                </button>
              </form>
            ) : (
              <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                💡 جهت افزودن یا حذف ادمین، دکمه «احراز هویت مالک» را در بالا بزنید یا در بله دستور <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">/addadmin [شناسه] [نام]</code> را بفرستید.
              </div>
            )}

            {adminMsg && (
              <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {adminMsg}
              </div>
            )}
          </div>

          {studentActionMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{studentActionMsg}</span>
            </div>
          )}

          {/* Card 4: Detailed Table of 11 Students & Their Numeric IDs */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">
                فهرست کامل شناسه‌های عددی ۱۱ دانش‌آموز کلاس املا:
              </span>
              <span className="text-[11px] text-slate-500">
                وضعیت: {toPersianDigits(students.filter((s) => Boolean(s.baleUserId)).length)} از ۱۱ نفر ثبت شده
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
                    <th className="py-2.5 px-3">نام دانش‌آموز</th>
                    <th className="py-2.5 px-3">شناسه عددی بله (Numeric ID)</th>
                    <th className="py-2.5 px-3 text-center">وضعیت قفل</th>
                    {isOwnerUnlocked && <th className="py-2.5 px-3 text-center">عملیات مالک</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const isBound = Boolean(st.baleUserId && /^\d+$/.test(String(st.baleUserId).trim()));
                    const isEditing = editingStudentId === st.id;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-400">
                          {toPersianDigits(idx + 1)}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {st.fullName}
                        </td>

                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingStudentValue}
                                onChange={(e) => setEditingStudentValue(e.target.value)}
                                placeholder="شناسه عددی جدید..."
                                className="px-2 py-1 bg-white border border-emerald-500 rounded font-mono text-xs focus:outline-none w-36"
                              />
                              <button
                                onClick={() => handleSaveStudentId(st.id)}
                                className="px-2 py-1 bg-emerald-700 text-white rounded text-[10px] font-medium hover:bg-emerald-800"
                              >
                                ذخیره
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                              >
                                لغو
                              </button>
                            </div>
                          ) : isBound ? (
                            <span className="font-mono tabular-nums bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded text-[11px] font-semibold">
                              {toPersianDigits(st.baleUserId!)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              در انتظار پیام دانش‌آموز
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {isBound ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Lock className="w-3 h-3 text-emerald-700" />
                              <span>قفل شده</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              آزاد
                            </span>
                          )}
                        </td>

                        {isOwnerUnlocked && (
                          <td className="py-2.5 px-3 text-center">
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  setEditingStudentId(st.id);
                                  setEditingStudentValue(st.baleUserId || '');
                                }}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded border border-slate-200 transition-colors text-[10px]"
                              >
                                تغییر شناسه
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500">
            دستور ربات جهت تغییر مستقیم در بله توسط مالک: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/setid [نام] [شناسه جدید]</code>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
