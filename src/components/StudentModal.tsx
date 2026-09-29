import React, { useEffect, useState } from 'react';
import { Check, Plus, User, UserPlus, X } from 'lucide-react';
import { EducationLevel, Group, Student } from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: Student) => void;
  existingStudent?: Student | null;
  groups: Group[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSaveStudent,
  existingStudent,
  groups,
}) => {
  const [id, setId] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [prefix, setPrefix] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [level, setLevel] = useState<EducationLevel>('2');
  const [groupId, setGroupId] = useState('0512');
  const [groupName, setGroupName] = useState('ตรอกนอง');
  const [advisorName, setAdvisorName] = useState('นายสัญญา บุญคม');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Student['status']>('กำลังศึกษา');
  const [entryYear, setEntryYear] = useState('2569');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingStudent) {
      setId(existingStudent.id);
      setCitizenId(existingStudent.citizenId || '');
      setPrefix(existingStudent.prefix || 'นาย');
      setFirstName(existingStudent.firstName || '');
      setLastName(existingStudent.lastName || '');
      setLevel(existingStudent.level || '2');
      setGroupId(existingStudent.groupId || '');
      setGroupName(existingStudent.groupName || '');
      setAdvisorName(existingStudent.advisorName || '');
      setPhone(existingStudent.phone || '');
      setAddress(existingStudent.address || '');
      setStatus(existingStudent.status || 'กำลังศึกษา');
      setEntryYear(existingStudent.entryYear || '2569');
    } else {
      // Default empty form
      setId('');
      setCitizenId('');
      setPrefix('นาย');
      setFirstName('');
      setLastName('');
      setLevel('2');
      const defaultGrp = groups.find((g) => g.id === '0512') || groups[0];
      if (defaultGrp) {
        setGroupId(defaultGrp.id);
        setGroupName(defaultGrp.name);
        setAdvisorName(defaultGrp.advisorName);
        setLevel(defaultGrp.level);
      }
      setPhone('');
      setAddress('');
      setStatus('กำลังศึกษา');
      setEntryYear('2569');
    }
    setError('');
  }, [existingStudent, isOpen, groups]);

  if (!isOpen) return null;

  const handleGroupChange = (newGroupId: string) => {
    setGroupId(newGroupId);
    const grp = groups.find((g) => g.id === newGroupId);
    if (grp) {
      setGroupName(grp.name);
      setAdvisorName(grp.advisorName);
      setLevel(grp.level);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) {
      setError('กรุณาระบุรหัสประจำตัวนักศึกษา');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('กรุณาระบุชื่อและนามสกุลนักศึกษา');
      return;
    }

    const studentData: Student = {
      id: id.trim(),
      citizenId: citizenId.trim() || undefined,
      prefix: prefix.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      level,
      groupId: groupId.trim(),
      groupName: groupName.trim(),
      advisorName: advisorName.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      status,
      entryYear: entryYear.trim() || undefined,
    };

    onSaveStudent(studentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {existingStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'กรอกข้อมูลนักศึกษาใหม่'}
              </h2>
              <p className="text-xs text-blue-100">บันทึกข้อมูลประวัติและข้อมูลสังกัดกลุ่ม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Student ID & Citizen ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสประจำตัวนักศึกษา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น 6712-00014-0"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลขประจำตัวประชาชน 13 หลัก</label>
              <input
                type="text"
                maxLength={13}
                placeholder="เช่น 1220200145231"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Name prefix, First name, Last name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">คำนำหน้า</label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
                <option value="นาง">นาง</option>
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
              </select>
            </div>
            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น หัตถกรณ์"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ชูละเอียด"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Level & Group selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับการศึกษา</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="1">ระดับประถมศึกษา</option>
                <option value="2">ระดับมัธยมศึกษาตอนต้น (ม.ต้น)</option>
                <option value="3">ระดับมัธยมศึกษาตอนปลาย (ม.ปลาย)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">กลุ่มการเรียน (กศน.ตำบล / ศกร.)</label>
              <select
                value={groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    [{grp.id}] {grp.name} ({grp.level === '1' ? 'ประถม' : grp.level === '2' ? 'ม.ต้น' : 'ม.ปลาย'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group details (Name, Advisor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อกลุ่ม</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ครูประจำกลุ่ม</label>
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                placeholder="เช่น 089-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะนักศึกษา</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Student['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="กำลังศึกษา">กำลังศึกษา</option>
                <option value="จบการศึกษา">จบการศึกษา</option>
                <option value="พักการเรียน">พักการเรียน</option>
                <option value="ลาออก">ลาออก</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่</label>
            <input
              type="text"
              placeholder="เช่น หมู่ที่ 3 ตำบลตรอกนอง อำเภอขลุง จังหวัดจันทบุรี"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
