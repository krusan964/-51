import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { DataZipModal } from './components/DataZipModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { RegistrationModal } from './components/RegistrationModal';
import { StudentModal } from './components/StudentModal';
import { SemesterManagerModal } from './components/SemesterManagerModal';
import { StudentLevelCharts } from './components/StudentLevelCharts';
import {
  initialConfig,
  initialCourses,
  initialGroups,
  initialRegistrations,
  initialStudents,
} from './data/initialData';
import { Course, EducationLevel, Group, InstitutionConfig, LEVEL_NAMES, RegistrationRecord, Student } from './types';
import { exportToZip, DataZipImportResult } from './utils/dataZipHandler';
import { exportRegistrationToDocx } from './utils/exportDocx';
import { downloadRegistrationPdf } from './utils/exportPdf';
import { saveAs } from 'file-saver';

const STORAGE_KEY = 'NFE_STUDENT_SYSTEM_DATA_V1';

export default function App() {
  // App State with persistence
  const [config, setConfig] = useState<InstitutionConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_CONFIG`);
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_STUDENTS`);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_GROUPS`);
    return saved ? JSON.parse(saved) : initialGroups;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_COURSES`);
    return saved ? JSON.parse(saved) : initialCourses;
  });

  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_REGISTRATIONS`);
    return saved ? JSON.parse(saved) : initialRegistrations;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CONFIG`, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_STUDENTS`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_GROUPS`, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_COURSES`, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_REGISTRATIONS`, JSON.stringify(registrations));
  }, [registrations]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | EducationLevel>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Multi-selection for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isDataZipModalOpen, setIsDataZipModalOpen] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registeringStudent, setRegisteringStudent] = useState<Student | null>(null);

  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<
    { student: Student; registration?: RegistrationRecord }[]
  >([]);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((stu) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${stu.prefix}${stu.firstName} ${stu.lastName}`.toLowerCase();
        const matchName = fullName.includes(query);
        const matchId = stu.id.toLowerCase().includes(query);
        const matchCitizen = stu.citizenId?.includes(query);
        const matchGroup = stu.groupName.toLowerCase().includes(query) || stu.groupId.includes(query);
        if (!matchName && !matchId && !matchCitizen && !matchGroup) {
          return false;
        }
      }

      // Level
      if (selectedLevel !== 'all' && stu.level !== selectedLevel) {
        return false;
      }

      // Group
      if (selectedGroupId !== 'all' && stu.groupId !== selectedGroupId) {
        return false;
      }

      // Registration Status
      if (selectedStatus !== 'all') {
        const hasReg = registrations.some(
          (r) => r.studentId === stu.id && r.semester === config.currentSemester && r.subjects.length > 0
        );
        if (selectedStatus === 'registered' && !hasReg) return false;
        if (selectedStatus === 'unregistered' && hasReg) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedLevel, selectedGroupId, selectedStatus, registrations, config.currentSemester]);

  // Statistics
  const registeredCountInCurrentSem = useMemo(() => {
    return students.filter((stu) =>
      registrations.some(
        (r) => r.studentId === stu.id && r.semester === config.currentSemester && r.subjects.length > 0
      )
    ).length;
  }, [students, registrations, config.currentSemester]);

  // Handlers for Students
  const handleSaveStudent = (studentData: Student) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === studentData.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = studentData;
        showToast(`บันทึกการแก้ไขข้อมูล ${studentData.prefix}${studentData.firstName} เรียบร้อย`);
        return next;
      } else {
        showToast(`เพิ่มนักศึกษาใหม่ ${studentData.prefix}${studentData.firstName} ${studentData.lastName} เรียบร้อย`);
        return [studentData, ...prev];
      }
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (confirm(`คุณต้องการลบข้อมูลนักศึกษา ${stu?.prefix}${stu?.firstName} ${stu?.lastName} (${studentId}) ใช่หรือไม่?`)) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setRegistrations((prev) => prev.filter((r) => r.studentId !== studentId));
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      showToast(`ลบข้อมูลนักศึกษาเรียบร้อยแล้ว`);
    }
  };

  // Handlers for Registrations
  const handleSaveRegistration = (record: RegistrationRecord) => {
    setRegistrations((prev) => {
      const idx = prev.findIndex((r) => r.studentId === record.studentId && r.semester === record.semester);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      } else {
        return [...prev, record];
      }
    });
    showToast(`บันทึกการลงทะเบียนภาคเรียนที่ ${record.semester} เรียบร้อยแล้ว`);
  };

  const getStudentRegistration = (studentId: string, semester: string) => {
    return registrations.find((r) => r.studentId === studentId && r.semester === semester);
  };

  // Preview & Export handlers
  const handleOpenPrintPreview = (student: Student) => {
    const reg = getStudentRegistration(student.id, config.currentSemester);
    setPreviewStudents([{ student, registration: reg }]);
    setIsPrintPreviewOpen(true);
  };

  const handleBatchPrint = () => {
    if (selectedStudentIds.size === 0) return;
    const selectedList = students
      .filter((s) => selectedStudentIds.has(s.id))
      .map((student) => ({
        student,
        registration: getStudentRegistration(student.id, config.currentSemester),
      }));

    setPreviewStudents(selectedList);
    setIsPrintPreviewOpen(true);
  };

  const handleExportSingleWord = async (student: Student) => {
    const reg = getStudentRegistration(student.id, config.currentSemester);
    await exportRegistrationToDocx([{ student, registration: reg }], config);
    showToast(`ดาวน์โหลดไฟล์ Word ของ ${student.firstName} เรียบร้อย`);
  };

  const handleExportSinglePdf = async (student: Student) => {
    const reg = getStudentRegistration(student.id, config.currentSemester);
    await downloadRegistrationPdf([{ student, registration: reg }], config);
  };

  const handleBatchExportWord = async () => {
    const toExport = students
      .filter((s) => selectedStudentIds.has(s.id))
      .map((student) => ({
        student,
        registration: getStudentRegistration(student.id, config.currentSemester),
      }));
    if (toExport.length === 0) return;
    await exportRegistrationToDocx(toExport, config);
    showToast(`ส่งออกใบลงทะเบียน Word รวม ${toExport.length} คน เรียบร้อย`);
  };

  // DATA.ZIP Import handler
  const handleDataZipSuccess = (result: DataZipImportResult, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      if (result.students.length > 0) setStudents(result.students);
      if (result.groups.length > 0) setGroups(result.groups);
      if (result.courses.length > 0) setCourses(result.courses);
      if (result.registrations.length > 0) setRegistrations(result.registrations);
      showToast(`แทนที่ข้อมูลด้วย DATA.ZIP เรียบร้อย (นักศึกษา ${result.students.length} คน)`);
    } else {
      // Merge
      setStudents((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        result.students.forEach((s) => map.set(s.id, s));
        return Array.from(map.values());
      });

      setGroups((prev) => {
        const map = new Map(prev.map((g) => [g.id, g]));
        result.groups.forEach((g) => map.set(g.id, g));
        return Array.from(map.values());
      });

      if (result.courses.length > 0) {
        setCourses((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          result.courses.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }

      if (result.registrations.length > 0) {
        setRegistrations((prev) => {
          const keyOf = (r: RegistrationRecord) => `${r.studentId}__${r.semester}`;
          const map = new Map(prev.map((r) => [keyOf(r), r]));
          result.registrations.forEach((r) => map.set(keyOf(r), r));
          return Array.from(map.values());
        });
      }

      showToast(`นำเข้าข้อมูลจาก DATA.ZIP สำเร็จ (เพิ่ม/อัปเดตนักศึกษา ${result.students.length} คน)`);
    }
  };

  // Export current database to ZIP
  const handleExportCurrentZip = async () => {
    const blob = await exportToZip(students, groups, courses, registrations, config);
    saveAs(blob, `DATA_EXPORT_${config.institutionName}_${new Date().toISOString().slice(0, 10)}.zip`);
    showToast('สำรองข้อมูลเป็นไฟล์ ZIP เรียบร้อย');
  };

  // Reset to default sample
  const handleResetData = () => {
    setStudents(initialStudents);
    setGroups(initialGroups);
    setCourses(initialCourses);
    setRegistrations(initialRegistrations);
    setConfig(initialConfig);
    setSelectedStudentIds(new Set());
    showToast('รีเซ็ตข้อมูลเป็นชุดเริ่มต้นเรียบร้อย');
  };

  // Selection toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navbar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & School Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {config.institutionName}
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md">
                    สกร. / กศน.
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{config.curriculumName}</p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* Semester Selector Pill */}
              <button
                type="button"
                onClick={() => setIsSemesterModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 rounded-xl text-xs font-semibold border border-indigo-200 transition-all shadow-2xs"
                title="คลิกเพื่อเลือกหรือเพิ่มภาคเรียน"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>ภาคเรียน {config.currentSemester}</span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
              </button>

              {/* Import DATA.ZIP */}
              <button
                type="button"
                onClick={() => setIsDataZipModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                title="นำเข้าไฟล์ ZIP ฐานข้อมูลงานทะเบียน"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">นำเข้า</span> DATA.ZIP
              </button>

              {/* Add Student */}
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">เพิ่มนักศึกษา</span>
              </button>

              {/* Backup & Settings Menu */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={handleExportCurrentZip}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="สำรองข้อมูลเป็นไฟล์ ZIP"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="ตั้งค่าระบบและสถานศึกษา"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">นักศึกษาทั้งหมด</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{students.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ในระบบทุกระดับ</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">ลงทะเบียนใน {config.currentSemester}</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{registeredCountInCurrentSem}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">
                คิดเป็น {students.length ? Math.round((registeredCountInCurrentSem / students.length) * 100) : 0}%
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">กลุ่มการเรียน</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{groups.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">กศน.ตำบล / ศกร.</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">รายวิชาในหลักสูตร</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{courses.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">วิชาบังคับและเลือก</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Visual Charts: Student Level Distribution */}
        <StudentLevelCharts
          students={students}
          registrations={registrations}
          currentSemester={config.currentSemester}
          selectedLevel={selectedLevel}
          onSelectLevel={(lvl) => setSelectedLevel(lvl)}
        />

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, นามสกุล, รหัสนักศึกษา (เช่น 6712-00014-0), หรือบัตรประชาชน..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* Quick Level Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
              <button
                type="button"
                onClick={() => setSelectedLevel('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === 'all' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกระดับ
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevel('1')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '1' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ประถมศึกษา
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevel('2')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '2' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ม.ต้น
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevel('3')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedLevel === '3' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ม.ปลาย
              </button>
            </div>
          </div>

          {/* Secondary Filters (Group & Status) */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>กรองข้อมูล:</span>
            </div>

            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">-- ทุกกลุ่มการเรียน ({groups.length} กลุ่ม) --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.id}] {g.name} ({g.level === '1' ? 'ประถม' : g.level === '2' ? 'ม.ต้น' : 'ม.ปลาย'})
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">-- สถานะการลงทะเบียนทั้งหมด --</option>
              <option value="registered">ลงทะเบียนแล้วในเทอมนี้</option>
              <option value="unregistered">ยังไม่ได้ลงทะเบียนในเทอมนี้</option>
            </select>

            {(searchQuery || selectedLevel !== 'all' || selectedGroupId !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('all');
                  setSelectedGroupId('all');
                  setSelectedStatus('all');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Batch Action Toolbar when items selected */}
        {selectedStudentIds.size > 0 && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-3.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                เลือกแล้ว {selectedStudentIds.size} คน
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">ดำเนินการพร้อมกัน:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchPrint}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>สั่งพิมพ์ ({selectedStudentIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handleBatchExportWord}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ส่งออก Word รวม</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentIds(new Set())}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
              >
                ยกเลิกการเลือก
              </button>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">รหัสประจำตัวนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ – นามสกุล</th>
                  <th className="py-3 px-3">ระดับ</th>
                  <th className="py-3 px-3">กลุ่มการเรียน</th>
                  <th className="py-3 px-3">ครูประจำกลุ่ม</th>
                  <th className="py-3 px-3 text-center">ลงทะเบียน {config.currentSemester}</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 stroke-1" />
                        <p className="text-sm font-medium">ไม่พบข้อมูลนักศึกษาที่ตรงกับเงื่อนไข</p>
                        <p className="text-xs text-slate-500">
                          ลองเปลี่ยนคำค้นหา หรือคลิก "นำเข้า DATA.ZIP" หรือ "เพิ่มนักศึกษา" ด้านบน
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => {
                    const isSelected = selectedStudentIds.has(stu.id);
                    const reg = getStudentRegistration(stu.id, config.currentSemester);
                    const hasReg = reg && reg.subjects.length > 0;
                    const totalCredits = reg?.subjects.reduce(
                      (sum, s) => sum + (s.registered || s.transferred ? s.credits : 0),
                      0
                    ) || 0;

                    return (
                      <tr
                        key={stu.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(stu.id)}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                        </td>

                        {/* Student ID */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-800 text-[11px]">
                            {stu.id}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {stu.prefix}
                            {stu.firstName} {stu.lastName}
                          </div>
                          {stu.citizenId && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              ปชช: {stu.citizenId}
                            </div>
                          )}
                        </td>

                        {/* Level */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              stu.level === '1'
                                ? 'bg-amber-100 text-amber-800'
                                : stu.level === '2'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {LEVEL_NAMES[stu.level]}
                          </span>
                        </td>

                        {/* Group */}
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800">{stu.groupName}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">[{stu.groupId}]</span>
                        </td>

                        {/* Advisor */}
                        <td className="py-3 px-3 text-slate-600">{stu.advisorName}</td>

                        {/* Registration Status */}
                        <td className="py-3 px-3 text-center">
                          {hasReg ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRegisteringStudent(stu);
                                setIsRegistrationModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-semibold transition-colors border border-emerald-200"
                              title="คลิกเพื่อแก้ไขวิชาที่ลงทะเบียน"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{totalCredits} นก. ({reg.subjects.length} วิชา)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRegisteringStudent(stu);
                                setIsRegistrationModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-full text-[11px] font-medium transition-colors"
                            >
                              + ยังไม่ลงทะเบียน
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview & Print Sheet */}
                            <button
                              type="button"
                              onClick={() => handleOpenPrintPreview(stu)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs"
                              title="ดูตัวอย่าง / สั่งพิมพ์ใบลงทะเบียน"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>ใบลงทะเบียน</span>
                            </button>

                            {/* Export Word */}
                            <button
                              type="button"
                              onClick={() => handleExportSingleWord(stu)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ส่งออกไฟล์ Word (.docx)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Export PDF */}
                            <button
                              type="button"
                              onClick={() => handleExportSinglePdf(stu)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ส่งออก PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>

                            {/* Edit Student */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(stu);
                                setIsStudentModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="แก้ไขข้อมูลนักศึกษา"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Student */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(stu.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบนักศึกษา"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              แสดง {filteredStudents.length} จากทั้งหมด {students.length} รายการ
            </span>
            <span className="font-mono text-[11px]">
              ฐานข้อมูล สกร. อำเภอขลุง | ภาคเรียนปัจจุบัน: {config.currentSemester}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            ระบบบริหารข้อมูลนักศึกษาและพิมพ์ใบลงทะเบียนเรียน สกร. (รองรับ DATA.ZIP / Word / PDF / Print)
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              ตั้งค่าระบบ
            </button>
            <span>•</span>
            <button
              onClick={handleExportCurrentZip}
              className="hover:text-slate-800 transition-colors"
            >
              สำรองข้อมูล ZIP
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DataZipModal
        isOpen={isDataZipModalOpen}
        onClose={() => setIsDataZipModalOpen(false)}
        onImportSuccess={handleDataZipSuccess}
      />

      <SemesterManagerModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        semesters={config.semesters}
        currentSemester={config.currentSemester}
        onSelectSemester={(sem) => {
          setConfig((prev) => ({ ...prev, currentSemester: sem }));
          showToast(`เปลี่ยนภาคเรียนปัจจุบันเป็น ${sem}`);
        }}
        onAddSemester={(newSem) => {
          setConfig((prev) => ({
            ...prev,
            semesters: [newSem, ...prev.semesters],
            currentSemester: newSem,
          }));
          showToast(`เพิ่มภาคเรียน ${newSem} และตั้งเป็นภาคเรียนปัจจุบันแล้ว`);
        }}
        onDeleteSemester={(sem) => {
          if (confirm(`คุณต้องการลบภาคเรียน ${sem} ใช่หรือไม่?`)) {
            setConfig((prev) => {
              const nextSemesters = prev.semesters.filter((s) => s !== sem);
              const nextCurrent = prev.currentSemester === sem ? nextSemesters[0] || '1/2569' : prev.currentSemester;
              return {
                ...prev,
                semesters: nextSemesters,
                currentSemester: nextCurrent,
              };
            });
            showToast(`ลบภาคเรียน ${sem} เรียบร้อย`);
          }
        }}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSaveStudent={handleSaveStudent}
        existingStudent={editingStudent}
        groups={groups}
      />

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        student={registeringStudent}
        semester={config.currentSemester}
        existingRegistration={
          registeringStudent ? getStudentRegistration(registeringStudent.id, config.currentSemester) : undefined
        }
        availableCourses={courses}
        onSaveRegistration={handleSaveRegistration}
      />

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        students={previewStudents}
        config={config}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        }}
        onResetData={handleResetData}
      />
    </div>
  );
}
