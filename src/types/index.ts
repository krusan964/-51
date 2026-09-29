export type EducationLevel = '1' | '2' | '3'; // 1 = ประถม, 2 = ม.ต้น, 3 = ม.ปลาย

export interface Group {
  id: string; // e.g. "0512"
  name: string; // e.g. "ตรอกนอง"
  level: EducationLevel;
  advisorName: string; // e.g. "นายสัญญา บุญคม"
  location?: string; // e.g. "อบต.ตรอกนอง"
}

export interface Course {
  id: string; // e.g. "ทช21001"
  name: string; // e.g. "ทักษะการเรียนรู้"
  credits: number; // e.g. 5
  type: 'compulsory' | 'elective'; // วิชาบังคับ | วิชาเลือก
  level: EducationLevel;
}

export interface RegisteredSubject {
  subjectId: string;
  subjectName: string;
  credits: number;
  type: 'compulsory' | 'elective';
  registered: boolean;
  transferred: boolean; // เทียบโอน
  note?: string;
}

export interface RegistrationRecord {
  studentId: string;
  semester: string; // e.g. "1/2569"
  subjects: RegisteredSubject[];
  kpcHours: number; // จำนวนชั่วโมงกิจกรรม กพช. ในเทอมนี้
  kpcRegistered: boolean;
  kpcCumulativeHours: number; // สะสม
  kpcNote?: string;
  registrationDate?: string;
  registrarName?: string;
}

export interface Student {
  id: string; // รหัสประจำตัวนักศึกษา e.g. "6712-00014-0"
  citizenId?: string; // รหัสประจำตัวประชาชน 13 หลัก
  prefix: string; // นาย / นางสาว / นาง / เด็กชาย / เด็กหญิง
  firstName: string;
  lastName: string;
  level: EducationLevel;
  groupId: string;
  groupName: string;
  advisorName: string;
  phone?: string;
  address?: string;
  status: 'กำลังศึกษา' | 'จบการศึกษา' | 'ลาออก' | 'พักการเรียน';
  entryYear?: string;
}

export interface InstitutionConfig {
  institutionName: string; // e.g. "ศูนย์ส่งเสริมการเรียนรู้อำเภอขลุง"
  curriculumName: string; // e.g. "หลักสูตรการศึกษานอกระบบระดับการศึกษาขั้นพื้นฐาน พุทธศักราช 2551"
  currentSemester: string; // e.g. "1/2569"
  semesters: string[];
  defaultRegistrarName: string;
}

export const LEVEL_NAMES: Record<EducationLevel, string> = {
  '1': 'ประถมศึกษา',
  '2': 'ม.ต้น',
  '3': 'ม.ปลาย',
};

export const LEVEL_FULL_NAMES: Record<EducationLevel, string> = {
  '1': 'ระดับประถมศึกษา',
  '2': 'ระดับมัธยมศึกษาตอนต้น (ม.ต้น)',
  '3': 'ระดับมัธยมศึกษาตอนปลาย (ม.ปลาย)',
};
