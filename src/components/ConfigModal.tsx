import React, { useState } from 'react';
import { Building2, Check, RotateCcw, Settings, X } from 'lucide-react';
import { InstitutionConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionConfig;
  onSaveConfig: (config: InstitutionConfig) => void;
  onResetData: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetData,
}) => {
  const [institutionName, setInstitutionName] = useState(config.institutionName);
  const [curriculumName, setCurriculumName] = useState(config.curriculumName);
  const [defaultRegistrarName, setDefaultRegistrarName] = useState(config.defaultRegistrarName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      institutionName: institutionName.trim(),
      curriculumName: curriculumName.trim(),
      defaultRegistrarName: defaultRegistrarName.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ตั้งค่าข้อมูลสถานศึกษา</h2>
              <p className="text-xs text-slate-300">ปรับแต่งชื่อสถานศึกษาและข้อความบนใบลงทะเบียน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อสถานศึกษา / ศูนย์ส่งเสริมการเรียนรู้ (สกร.)
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="เช่น ศูนย์ส่งเสริมการเรียนรู้อำเภอขลุง"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อหลักสูตร</label>
            <input
              type="text"
              required
              value={curriculumName}
              onChange={(e) => setCurriculumName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="เช่น หลักสูตรการศึกษานอกระบบระดับการศึกษาขั้นพื้นฐาน พุทธศักราช 2551"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อเจ้าหน้าที่ทะเบียนเริ่มต้น (สำหรับใบลงทะเบียน)
            </label>
            <input
              type="text"
              value={defaultRegistrarName}
              onChange={(e) => setDefaultRegistrarName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="เช่น นางสาวพรรณพิไล เกษมสุข"
            />
          </div>

          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้น (อำเภอขลุง / ตรอกนอง) ใช่หรือไม่?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              รีเซ็ตข้อมูลเริ่มต้นทั้งหมดตามตัวอย่าง
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" /> บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
