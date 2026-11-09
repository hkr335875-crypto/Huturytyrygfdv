import React, { useState } from 'react';
import { X, Plus, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { Assignment, ClassGroup } from '../types';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassGroup[];
  activeClassId: string;
  defaultTriggerPhrase: string;
  onCreateAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
}

export const NewAssignmentModal: React.FC<NewAssignmentModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClassId,
  defaultTriggerPhrase,
  onCreateAssignment,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('ادبیات فارسی ۱');
  const [classId, setClassId] = useState(activeClassId || classes[0]?.id || '');
  const [deadline, setDeadline] = useState('فردا ساعت ۲۲:۰۰');
  const [triggerPhrase, setTriggerPhrase] = useState(defaultTriggerPhrase || 'درود ارسال کردم');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateAssignment({
      title: title.trim(),
      subject,
      classId,
      deadline: deadline.trim(),
      isOpen: true,
      customTriggerPhrase: triggerPhrase.trim() || 'درود ارسال کردم',
      description: description.trim(),
    });

    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              تعریف تکلیف ادبیات جدید (/new)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Class and Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">کلاس هدف:</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">نام درس:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ادبیات فارسی ۱">ادبیات فارسی ۱ (دهم)</option>
                <option value="نگارش ۱">نگارش ۱ (دهم)</option>
                <option value="علوم و فنون ادبی ۱">علوم و فنون ادبی ۱</option>
                <option value="ادبیات فارسی ۲">ادبیات فارسی ۲ (یازدهم)</option>
                <option value="نگارش ۲">نگارش ۲ (یازدهم)</option>
                <option value="علوم و فنون ادبی ۲">علوم و فنون ادبی ۲</option>
                <option value="ادبیات فارسی ۳">ادبیات فارسی ۳ (دوازدهم)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              عنوان تکلیف / فصل درس:
            </label>
            <input
              type="text"
              required
              placeholder="مثلا: معنی و آرایه‌های درس اول (چشمه و سنگ)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              مهلت ارسال (تاریخ یا ساعت):
            </label>
            <input
              type="text"
              placeholder="مثلا: جمعه ساعت ۲۲:۰۰"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Trigger Phrase */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>عبارت الزامی ثبت تکلیف (Trigger):</span>
              <span className="text-[10px] text-emerald-700">پیش‌فرض: درود ارسال کردم</span>
            </label>
            <input
              type="text"
              required
              placeholder="درود ارسال کردم"
              value={triggerPhrase}
              onChange={(e) => setTriggerPhrase(e.target.value)}
              className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-emerald-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              فقط پیام‌هایی که شامل این عبارت دقیق باشند پذیرفته خواهند شد. کلمات تکی نادیده گرفته می‌شوند.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              توضیحات و راهنمای تکلیف برای دانش‌آموزان:
            </label>
            <textarea
              rows={2}
              placeholder="نوشتن در دفتر و ارسال تصویر به همراه عبارت مورد تأیید..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors font-semibold shadow-xs"
            >
              ایجاد و فعال‌سازی تکلیف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
