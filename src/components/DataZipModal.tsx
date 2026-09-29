import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { Course, Group, RegistrationRecord, Student } from '../types';
import { DataZipImportResult, parseDataZip } from '../utils/dataZipHandler';

interface DataZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: DataZipImportResult, mode: 'merge' | 'replace') => void;
}

export const DataZipModal: React.FC<DataZipModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<DataZipImportResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      const result = await parseDataZip(file);
      if (
        result.summary.studentCount === 0 &&
        result.summary.groupCount === 0 &&
        result.summary.courseCount === 0
      ) {
        setError(
          `ไม่พบข้อมูลนักศึกษาหรือกลุ่มในไฟล์ ZIP ที่เลือก (พบไฟล์: ${result.summary.filesFound.join(', ') || 'ไม่มี'}) กรุณาตรวจสอบว่าเป็นไฟล์ DATA.ZIP จากโปรแกรมงานทะเบียน สกร./กศน. หรือมีไฟล์ STUDENT.DBF, GROUP.DBF`
        );
      } else {
        setPreviewResult(result);
      }
    } catch (err) {
      setError((err as Error).message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ DATA.ZIP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!previewResult) return;
    onImportSuccess(previewResult, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl shadow-xs">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">นำเข้าข้อมูลจาก DATA.ZIP</h2>
              <p className="text-xs text-emerald-100">
                รองรับไฟล์ฐานข้อมูลระบบงานทะเบียน สกร. / กศน. (STUDENT.DBF, GROUP.DBF, STU_SUB.DBF)
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Upload Dropzone */}
          {!previewResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.dbf,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-inner">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {isLoading ? 'กำลังวิเคราะห์ไฟล์...' : 'ลากไฟล์ DATA.ZIP มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ ZIP ฐานข้อมูลงานทะเบียน กศน./สกร. (ถอดรหัส Windows-874 ภาษาไทยอัตโนมัติ)
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                    DATA.ZIP
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                    STUDENT.DBF
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                    GROUP.DBF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ไม่สามารถอ่านข้อมูลได้</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Results */}
          {previewResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ตรวจพบข้อมูลใน DATA.ZIP เรียบร้อยแล้ว</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  เลือกไฟล์ใหม่
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">นักศึกษา</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">
                    {previewResult.summary.studentCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">รายการ</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">กลุ่มการเรียน</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">
                    {previewResult.summary.groupCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">กลุ่ม</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">รายวิชา</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">
                    {previewResult.summary.courseCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">วิชา</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">การลงทะเบียน</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">
                    {previewResult.summary.registrationCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">รายการ</span>
                </div>
              </div>

              {/* Files Inside List */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  ไฟล์ที่พบในแพ็กเกจ ({previewResult.summary.filesFound.length} ไฟล์):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {previewResult.summary.filesFound.map((file, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-mono"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Students Preview */}
              {previewResult.students.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    ตัวอย่างข้อมูลนักศึกษาที่ตรวจพบ:
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto text-xs">
                    {previewResult.students.slice(0, 5).map((stu, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {stu.prefix}
                            {stu.firstName} {stu.lastName}
                          </span>
                          <span className="text-slate-500 ml-2 font-mono">{stu.id}</span>
                        </div>
                        <div className="text-slate-500">
                          กลุ่ม {stu.groupName || stu.groupId} (
                          {stu.level === '1' ? 'ประถม' : stu.level === '2' ? 'ม.ต้น' : 'ม.ปลาย'})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">รูปแบบการนำเข้าข้อมูล:</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'merge'
                        ? 'border-emerald-600 bg-white font-semibold text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <p>นำเข้าร่วมกับข้อมูลเดิม (Merge)</p>
                      <p className="text-[11px] font-normal text-slate-500">เพิ่มหรืออัปเดตนักศึกษาโดยไม่ลบข้อมูลที่มีอยู่</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'replace'
                        ? 'border-emerald-600 bg-white font-semibold text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <p>เขียนทับข้อมูลทั้งหมด (Replace)</p>
                      <p className="text-[11px] font-normal text-slate-500">ล้างข้อมูลปัจจุบันและแทนที่ด้วยไฟล์นี้</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            ยกเลิก
          </button>

          {previewResult && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" /> ยืนยันการนำเข้าข้อมูล
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
