import React, { useState } from 'react';
import { Calendar, Check, Plus, Trash2, X } from 'lucide-react';

interface SemesterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: string[];
  currentSemester: string;
  onSelectSemester: (semester: string) => void;
  onAddSemester: (semester: string) => void;
  onDeleteSemester: (semester: string) => void;
}

export const SemesterManagerModal: React.FC<SemesterManagerModalProps> = ({
  isOpen,
  onClose,
  semesters,
  currentSemester,
  onSelectSemester,
  onAddSemester,
  onDeleteSemester,
}) => {
  const [term, setTerm] = useState('1');
  const [year, setYear] = useState('2569');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newSem = `${term}/${year}`.trim();
    if (!term || !year) {
      setError('กรุณาระบุภาคเรียนและปีการศึกษา');
      return;
    }
    if (semesters.includes(newSem)) {
      setError(`ภาคเรียน ${newSem} มีอยู่ในระบบแล้ว`);
      return;
    }
    setError('');
    onAddSemester(newSem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">เลือกและเพิ่มภาคเรียน</h2>
              <p className="text-xs text-blue-100">จัดการภาคเรียนสำหรับการลงทะเบียนเรียน</p>
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
        <div className="p-6 space-y-6">
          {/* Add Semester Form */}
          <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> เพิ่มภาคเรียนใหม่
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ภาคเรียนที่</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="3">ภาคเรียนฤดูร้อน</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ปีการศึกษา (พ.ศ.)</label>
                <input
                  type="text"
                  placeholder="เช่น 2569"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> บันทึกเพิ่มภาคเรียน {term}/{year}
            </button>
          </form>

          {/* Semesters List */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">รายการภาคเรียนทั้งหมด ({semesters.length})</h3>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {semesters.map((sem) => {
                const isSelected = sem === currentSemester;
                return (
                  <div
                    key={sem}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      isSelected ? 'bg-blue-50/80 font-semibold text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isSelected ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
                        }`}
                      />
                      <span>ภาคเรียนที่ {sem}</span>
                      {isSelected && (
                        <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-normal">
                          ภาคเรียนปัจจุบัน
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSemester(sem);
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-600 hover:text-white rounded-md transition-colors"
                        >
                          เลือกใช้
                        </button>
                      )}
                      {semesters.length > 1 && (
                        <button
                          type="button"
                          title="ลบภาคเรียน"
                          onClick={() => onDeleteSemester(sem)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
