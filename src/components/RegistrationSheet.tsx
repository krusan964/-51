import React from 'react';
import { InstitutionConfig, LEVEL_NAMES, RegistrationRecord, Student } from '../types';

interface RegistrationSheetProps {
  student: Student;
  registration?: RegistrationRecord;
  config: InstitutionConfig;
}

export const RegistrationSheet: React.FC<RegistrationSheetProps> = ({ student, registration, config }) => {
  const semester = registration?.semester || config.currentSemester;
  const levelText = LEVEL_NAMES[student.level] || 'ม.ต้น';
  const subjects = registration?.subjects || [];

  const compulsorySubs = subjects.filter((s) => s.type === 'compulsory');
  const electiveSubs = subjects.filter((s) => s.type === 'elective');

  const totalCredits = subjects.reduce((sum, s) => sum + (s.registered || s.transferred ? s.credits : 0), 0);

  // Guarantee minimum visible rows to match authentic official paper template
  const compulsoryRowsCount = Math.max(6, compulsorySubs.length);
  const electiveRowsCount = Math.max(6, electiveSubs.length);

  const studentFullName = `${student.prefix}${student.firstName} ${student.lastName}`;

  return (
    <div className="print-sheet bg-white text-black font-sarabun text-[14px] leading-relaxed mx-auto p-8 max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 page-break">
      {/* Top Title */}
      <div className="text-center mb-2">
        <h1 className="text-[20px] font-bold tracking-wide">ใบลงทะเบียน</h1>
        <h2 className="text-[16px] font-semibold">{config.curriculumName}</h2>
      </div>

      {/* Institution and Student Meta Lines */}
      <div className="space-y-1 mt-3 mb-4 text-[14px]">
        <div className="flex justify-between items-baseline">
          <div className="flex items-baseline">
            <span>{config.institutionName}</span>
          </div>
          <div className="flex items-baseline">
            <span>ระดับ</span>
            <span className="inline-block border-b border-dotted border-black px-4 font-semibold min-w-[100px] text-center">
              {levelText}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-baseline">
          <div className="flex items-baseline">
            <span>ภาคเรียน</span>
            <span className="inline-block border-b border-dotted border-black px-3 font-semibold min-w-[70px] text-center">
              {semester}
            </span>
          </div>
          <div className="flex items-baseline">
            <span>กลุ่ม</span>
            <span className="inline-block border-b border-dotted border-black px-4 font-semibold min-w-[100px] text-center">
              {student.groupName}
            </span>
          </div>
          <div className="flex items-baseline">
            <span>รหัสกลุ่ม</span>
            <span className="inline-block border-b border-dotted border-black px-4 font-semibold min-w-[80px] text-center">
              {student.groupId}
            </span>
          </div>
        </div>

        <div className="flex items-baseline">
          <span>ชื่อ – นามสกุล</span>
          <span className="inline-block border-b border-dotted border-black px-4 font-semibold flex-1 ml-2">
            {studentFullName}
          </span>
        </div>

        <div className="flex items-baseline">
          <span>รหัสประจำตัวนักศึกษา</span>
          <span className="inline-block border-b border-dotted border-black px-4 font-semibold flex-1 ml-2">
            {student.id}
          </span>
        </div>
      </div>

      {/* Main Subjects Table */}
      <table className="w-full border-collapse border border-black text-center text-[13px] my-2">
        <thead>
          <tr className="bg-slate-50 font-bold border-b border-black">
            <th className="border border-black py-1.5 px-2 text-center w-[40%]">รายวิชา</th>
            <th className="border border-black py-1.5 px-2 text-center w-[16%]">รหัสวิชา</th>
            <th className="border border-black py-1.5 px-2 text-center w-[14%]">จำนวนหน่วยกิต</th>
            <th className="border border-black py-1.5 px-2 text-center w-[10%]">ลงทะเบียน</th>
            <th className="border border-black py-1.5 px-2 text-center w-[10%]">เทียบโอน</th>
            <th className="border border-black py-1.5 px-2 text-center w-[10%]">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {/* Section: วิชาบังคับ */}
          <tr className="bg-slate-50/50">
            <td colSpan={6} className="border border-black py-1 px-3 text-left font-bold">
              วิชาบังคับ
            </td>
          </tr>
          {Array.from({ length: compulsoryRowsCount }).map((_, idx) => {
            const sub = compulsorySubs[idx];
            return (
              <tr key={`comp-${idx}`} className="h-[22px]">
                <td className="border border-black py-1 px-2 text-left">{sub?.subjectName || ''}</td>
                <td className="border border-black py-1 px-1">{sub?.subjectId || ''}</td>
                <td className="border border-black py-1 px-1">{sub ? sub.credits : ''}</td>
                <td className="border border-black py-1 px-1 font-bold text-[14px]">
                  {sub?.registered && !sub.transferred ? '✓' : ''}
                </td>
                <td className="border border-black py-1 px-1 font-bold text-[14px]">
                  {sub?.transferred ? '✓' : ''}
                </td>
                <td className="border border-black py-1 px-1 text-[11px]">{sub?.note || ''}</td>
              </tr>
            );
          })}

          {/* Section: วิชาเลือก */}
          <tr className="bg-slate-50/50">
            <td colSpan={6} className="border border-black py-1 px-3 text-left font-bold">
              วิชาเลือก
            </td>
          </tr>
          {Array.from({ length: electiveRowsCount }).map((_, idx) => {
            const sub = electiveSubs[idx];
            return (
              <tr key={`elec-${idx}`} className="h-[22px]">
                <td className="border border-black py-1 px-2 text-left">{sub?.subjectName || ''}</td>
                <td className="border border-black py-1 px-1">{sub?.subjectId || ''}</td>
                <td className="border border-black py-1 px-1">{sub ? sub.credits : ''}</td>
                <td className="border border-black py-1 px-1 font-bold text-[14px]">
                  {sub?.registered && !sub.transferred ? '✓' : ''}
                </td>
                <td className="border border-black py-1 px-1 font-bold text-[14px]">
                  {sub?.transferred ? '✓' : ''}
                </td>
                <td className="border border-black py-1 px-1 text-[11px]">{sub?.note || ''}</td>
              </tr>
            );
          })}

          {/* Row: รวม */}
          <tr className="font-bold bg-slate-50/30">
            <td className="border border-black py-1 px-2 text-right">รวม</td>
            <td className="border border-black py-1 px-1"></td>
            <td className="border border-black py-1 px-1">{totalCredits > 0 ? totalCredits : ''}</td>
            <td className="border border-black py-1 px-1"></td>
            <td className="border border-black py-1 px-1"></td>
            <td className="border border-black py-1 px-1"></td>
          </tr>

          {/* Activity Header Row: กิจกรรม กพช. */}
          <tr className="bg-slate-50/50 font-bold">
            <td colSpan={2} className="border border-black py-1 px-3 text-left">
              กิจกรรม กพช.
            </td>
            <td className="border border-black py-1 px-1">จำนวนชั่วโมง</td>
            <td className="border border-black py-1 px-1">ลงทะเบียน</td>
            <td className="border border-black py-1 px-1">จำนวนสะสม</td>
            <td className="border border-black py-1 px-1">หมายเหตุ</td>
          </tr>

          {/* Activity Data Row */}
          <tr className="h-[26px]">
            <td colSpan={2} className="border border-black py-1 px-3 text-left">
              {registration?.kpcNote || ''}
            </td>
            <td className="border border-black py-1 px-1">
              {registration?.kpcHours ? `${registration.kpcHours}` : ''}
            </td>
            <td className="border border-black py-1 px-1 font-bold text-[14px]">
              {registration?.kpcRegistered ? '✓' : ''}
            </td>
            <td className="border border-black py-1 px-1">
              {registration?.kpcCumulativeHours ? `${registration.kpcCumulativeHours}` : ''}
            </td>
            <td className="border border-black py-1 px-1 text-[11px]"></td>
          </tr>
        </tbody>
      </table>

      {/* Signatures Block - EXACT layout matching PDF attached */}
      <div className="mt-8 space-y-7 text-[13px]">
        {/* Row 1: นักศึกษา & เจ้าหน้าที่ทะเบียน */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-baseline">
              <span>ลงชื่อ</span>
              <span className="border-b border-dotted border-black flex-1 mx-1 min-h-[16px]"></span>
              <span>นักศึกษา</span>
            </div>
            <div className="text-center mt-1">
              <span>({studentFullName})</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline">
              <span>ลงชื่อ</span>
              <span className="border-b border-dotted border-black flex-1 mx-1 min-h-[16px]"></span>
              <span>เจ้าหน้าที่ทะเบียน</span>
            </div>
            <div className="text-center mt-1">
              <span>({registration?.registrarName || config.defaultRegistrarName || '...................................................'})</span>
            </div>
          </div>
        </div>

        {/* Row 2: ครูประจำกลุ่ม & วันที่บันทึกข้อมูล */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-baseline">
              <span>ลงชื่อ</span>
              <span className="border-b border-dotted border-black flex-1 mx-1 min-h-[16px]"></span>
              <span>ครูประจำกลุ่ม</span>
            </div>
            <div className="text-center mt-1">
              <span>({student.advisorName || '...................................................'})</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span>วันที่</span>
            <span className="border-b border-dotted border-black w-8 text-center"></span>
            <span>เดือน</span>
            <span className="border-b border-dotted border-black flex-1 text-center mx-1"></span>
            <span>พ.ศ.</span>
            <span className="border-b border-dotted border-black w-14 text-center"></span>
            <span className="ml-1">บันทึกข้อมูล</span>
          </div>
        </div>
      </div>
    </div>
  );
};
