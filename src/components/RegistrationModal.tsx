import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Clock, Plus, Trash2, X } from 'lucide-react';
import { Course, RegisteredSubject, RegistrationRecord, Student } from '../types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  semester: string;
  existingRegistration?: RegistrationRecord;
  availableCourses: Course[];
  onSaveRegistration: (record: RegistrationRecord) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  student,
  semester,
  existingRegistration,
  availableCourses,
  onSaveRegistration,
}) => {
  const [subjects, setSubjects] = useState<RegisteredSubject[]>([]);
  const [kpcHours, setKpcHours] = useState<number>(50);
  const [kpcRegistered, setKpcRegistered] = useState<boolean>(true);
  const [kpcCumulativeHours, setKpcCumulativeHours] = useState<number>(100);
  const [kpcNote, setKpcNote] = useState<string>('กิจกรรมพัฒนาคุณภาพชีวิต');
  const [registrarName, setRegistrarName] = useState<string>('นางสาวพรรณพิไล เกษมสุข');
  const [registrationDate, setRegistrationDate] = useState<string>('15 พ.ค. 2569');

  // Custom course add state
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCredits, setCustomCredits] = useState('3');
  const [customType, setCustomType] = useState<'compulsory' | 'elective'>('compulsory');

  useEffect(() => {
    if (existingRegistration) {
      setSubjects(existingRegistration.subjects || []);
      setKpcHours(existingRegistration.kpcHours ?? 50);
      setKpcRegistered(existingRegistration.kpcRegistered ?? true);
      setKpcCumulativeHours(existingRegistration.kpcCumulativeHours ?? 100);
      setKpcNote(existingRegistration.kpcNote || 'กิจกรรมพัฒนาคุณภาพชีวิต');
      setRegistrarName(existingRegistration.registrarName || 'นางสาวพรรณพิไล เกษมสุข');
      setRegistrationDate(existingRegistration.registrationDate || '15 พ.ค. 2569');
    } else if (student) {
      // Pre-fill default courses for student level if none registered yet
      const levelCourses = availableCourses.filter((c) => c.level === student.level);
      const defaultCompulsory = levelCourses
        .filter((c) => c.type === 'compulsory')
        .slice(0, 4)
        .map((c) => ({
          subjectId: c.id,
          subjectName: c.name,
          credits: c.credits,
          type: 'compulsory' as const,
          registered: true,
          transferred: false,
        }));
      const defaultElective = levelCourses
        .filter((c) => c.type === 'elective')
        .slice(0, 1)
        .map((c) => ({
          subjectId: c.id,
          subjectName: c.name,
          credits: c.credits,
          type: 'elective' as const,
          registered: true,
          transferred: false,
        }));
      setSubjects([...defaultCompulsory, ...defaultElective]);
      setKpcHours(50);
      setKpcRegistered(true);
      setKpcCumulativeHours(100);
      setKpcNote('กิจกรรมพัฒนาคุณภาพชีวิต');
      setRegistrarName('นางสาวพรรณพิไล เกษมสุข');
      setRegistrationDate('15 พ.ค. 2569');
    }
  }, [existingRegistration, student, availableCourses, isOpen]);

  if (!isOpen || !student) return null;

  const totalCredits = subjects.reduce((sum, s) => sum + (s.registered || s.transferred ? s.credits : 0), 0);

  const handleToggleRegistered = (index: number) => {
    setSubjects((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, registered: !sub.registered, transferred: false } : sub))
    );
  };

  const handleToggleTransferred = (index: number) => {
    setSubjects((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, transferred: !sub.transferred, registered: false } : sub))
    );
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSelectedCourse = () => {
    if (!selectedCourseId) return;
    const course = availableCourses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    if (subjects.some((s) => s.subjectId === course.id)) {
      alert('วิชานี้ถูกเพิ่มในรายการแล้ว');
      return;
    }

    setSubjects((prev) => [
      ...prev,
      {
        subjectId: course.id,
        subjectName: course.name,
        credits: course.credits,
        type: course.type,
        registered: true,
        transferred: false,
      },
    ]);
    setSelectedCourseId('');
  };

  const handleAddCustomCourse = () => {
    if (!customCode.trim() || !customName.trim()) {
      alert('กรุณากรอกรหัสวิชาและชื่อวิชา');
      return;
    }

    setSubjects((prev) => [
      ...prev,
      {
        subjectId: customCode.trim(),
        subjectName: customName.trim(),
        credits: parseFloat(customCredits) || 3,
        type: customType,
        registered: true,
        transferred: false,
      },
    ]);

    setCustomCode('');
    setCustomName('');
    setShowAddCourse(false);
  };

  const handleSave = () => {
    const record: RegistrationRecord = {
      studentId: student.id,
      semester,
      subjects,
      kpcHours,
      kpcRegistered,
      kpcCumulativeHours,
      kpcNote,
      registrarName,
      registrationDate,
    };

    onSaveRegistration(record);
    onClose();
  };

  const matchingLevelCourses = availableCourses.filter((c) => c.level === student.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                ลงทะเบียนเรียน: {student.prefix}
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-xs text-blue-100">
                รหัส {student.id} | กลุ่ม {student.groupName} ({student.groupId}) | ภาคเรียนที่ {semester}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Add Course Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">เลือกรายวิชาลงทะเบียน:</span>
              <button
                type="button"
                onClick={() => setShowAddCourse(!showAddCourse)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddCourse ? 'ปิดฟอร์มกรอกเอง' : 'กรอกวิชาใหม่เอง'}
              </button>
            </div>

            {!showAddCourse ? (
              <div className="flex gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">-- เลือกวิชาจากหลักสูตร ({matchingLevelCourses.length} รายวิชา) --</option>
                  <optgroup label="วิชาบังคับ">
                    {matchingLevelCourses
                      .filter((c) => c.type === 'compulsory')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} {c.name} ({c.credits} หน่วยกิต)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="วิชาเลือก">
                    {matchingLevelCourses
                      .filter((c) => c.type === 'elective')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} {c.name} ({c.credits} หน่วยกิต)
                        </option>
                      ))}
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={handleAddSelectedCourse}
                  disabled={!selectedCourseId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> เพิ่มวิชา
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">รหัสวิชา</label>
                  <input
                    type="text"
                    placeholder="เช่น ทช21005"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">ชื่อวิชา</label>
                  <input
                    type="text"
                    placeholder="เช่น พืชสมุนไพร"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">หมวดวิชา</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as 'compulsory' | 'elective')}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="compulsory">วิชาบังคับ</option>
                    <option value="elective">วิชาเลือก</option>
                  </select>
                </div>
                <div className="flex items-end gap-1.5">
                  <div className="w-20">
                    <label className="block text-[11px] text-slate-500 mb-0.5">หน่วยกิต</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={customCredits}
                      onChange={(e) => setCustomCredits(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomCourse}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current Enrolled Subjects Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200 font-semibold text-xs text-slate-700">
              <span>รายวิชาที่ลงทะเบียน ({subjects.length} วิชา)</span>
              <span className="text-blue-700 font-bold">รวม {totalCredits} หน่วยกิต</span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">ยังไม่มีรายวิชาที่เลือก กรุณาเลือกวิชาด้านบน</div>
            ) : (
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="py-2 px-3">หมวด</th>
                    <th className="py-2 px-3">รหัสวิชา</th>
                    <th className="py-2 px-3">ชื่อรายวิชา</th>
                    <th className="py-2 px-2 text-center">หน่วยกิต</th>
                    <th className="py-2 px-2 text-center">ลงทะเบียน</th>
                    <th className="py-2 px-2 text-center">เทียบโอน</th>
                    <th className="py-2 px-2 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {subjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                            sub.type === 'compulsory'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {sub.type === 'compulsory' ? 'วิชาบังคับ' : 'วิชาเลือก'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-medium">{sub.subjectId}</td>
                      <td className="py-2 px-3">{sub.subjectName}</td>
                      <td className="py-2 px-2 text-center font-bold">{sub.credits}</td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={sub.registered}
                          onChange={() => handleToggleRegistered(idx)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={sub.transferred}
                          onChange={() => handleToggleTransferred(idx)}
                          className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* KPC Activities & Signatures Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> ข้อมูลกิจกรรม กพช. และการลงชื่อ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">ชั่วโมง กพช. เทอมนี้</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={kpcHours}
                    onChange={(e) => setKpcHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                  <label className="flex items-center gap-1 text-[11px] whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kpcRegistered}
                      onChange={(e) => setKpcRegistered(e.target.checked)}
                      className="rounded"
                    />
                    ลงทะเบียน
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ชั่วโมง กพช. สะสม</label>
                <input
                  type="number"
                  value={kpcCumulativeHours}
                  onChange={(e) => setKpcCumulativeHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ชื่อเจ้าหน้าที่ทะเบียน</label>
                <input
                  type="text"
                  value={registrarName}
                  onChange={(e) => setRegistrarName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> บันทึกการลงทะเบียน
          </button>
        </div>
      </div>
    </div>
  );
};
