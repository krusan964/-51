import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { InstitutionConfig, RegistrationRecord, Student } from '../types';
import { exportRegistrationToDocx } from '../utils/exportDocx';
import { downloadRegistrationPdf, printRegistrationSheets } from '../utils/exportPdf';
import { RegistrationSheet } from './RegistrationSheet';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: { student: Student; registration?: RegistrationRecord }[];
  config: InstitutionConfig;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  students,
  config,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isExportingWord, setIsExportingWord] = useState(false);

  if (!isOpen || students.length === 0) return null;

  const currentItem = students[currentIndex] || students[0];

  const handlePrint = () => {
    printRegistrationSheets('printable-preview-area');
  };

  const handleExportDocx = async (all = false) => {
    try {
      setIsExportingWord(true);
      const toExport = all ? students : [currentItem];
      await exportRegistrationToDocx(toExport, config);
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Word: ' + (e as Error).message);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportPdf = async () => {
    await downloadRegistrationPdf([currentItem], config);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Action Bar (no-print) */}
      <div className="no-print bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">ตัวอย่างใบลงทะเบียนเรียน</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
              {currentIndex + 1} จาก {students.length} คน
            </span>
          </div>

          {/* Navigation if multiple students */}
          {students.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="คนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-2 text-slate-300 font-mono">
                {currentIndex + 1}/{students.length}
              </span>
              <button
                type="button"
                disabled={currentIndex === students.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(students.length - 1, prev + 1))}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="คนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Zoom */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 10))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="ย่อ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-300 w-10 text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="ขยาย"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Export Word */}
          <button
            type="button"
            disabled={isExportingWord}
            onClick={() => handleExportDocx(false)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="ดาวน์โหลดเป็นไฟล์ Microsoft Word (.docx)"
          >
            <FileText className="w-4 h-4" />
            <span>ส่งออก Word (.docx)</span>
          </button>

          {students.length > 1 && (
            <button
              type="button"
              disabled={isExportingWord}
              onClick={() => handleExportDocx(true)}
              className="px-3 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="ส่งออก Word ทั้งหมด"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word ทั้งหมด ({students.length})</span>
            </button>
          )}

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="ดาวน์โหลดหรือบันทึกเป็น PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>ส่งออก PDF</span>
          </button>

          {/* Direct Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (Print)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sheet Display Area (with scroll) */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-900/60">
        <div
          id="printable-preview-area"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100"
        >
          <RegistrationSheet
            student={currentItem.student}
            registration={currentItem.registration}
            config={config}
          />
        </div>
      </div>

      {/* Hidden container for Batch Printing all selected sheets when window.print() is called for the whole batch */}
      <div id="printable-all-area" className="hidden print:block">
        {students.map((item, idx) => (
          <div key={idx} className="page-break">
            <RegistrationSheet student={item.student} registration={item.registration} config={config} />
          </div>
        ))}
      </div>
    </div>
  );
};
