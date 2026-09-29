import JSZip from 'jszip';
import { Course, EducationLevel, Group, InstitutionConfig, RegistrationRecord, Student } from '../types';
import { decodeThaiString, parseDbf, parseDelimitedText } from './dbfParser';

export interface DataZipImportResult {
  groups: Group[];
  students: Student[];
  courses: Course[];
  registrations: RegistrationRecord[];
  institution?: Partial<InstitutionConfig>;
  summary: {
    filesFound: string[];
    studentCount: number;
    groupCount: number;
    courseCount: number;
    registrationCount: number;
  };
}

/**
 * Normalizes student ID to format "6712-00014-0" if passed without hyphens
 */
export function formatStudentId(id: string): string {
  const clean = id.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return id.trim();
}

/**
 * Parses DATA.ZIP file (or loose DBF/TXT files)
 */
export async function parseDataZip(file: File | Blob): Promise<DataZipImportResult> {
  const zip = new JSZip();
  let loadedZip: JSZip;

  try {
    loadedZip = await zip.loadAsync(file);
  } catch (err) {
    throw new Error('ไม่สามารถเปิดไฟล์ ZIP ได้ กรุณาตรวจสอบว่าเป็นไฟล์ DATA.ZIP ที่สมบูรณ์ (' + (err as Error).message + ')');
  }

  const filesFound: string[] = [];
  const dbfFiles: { name: string; buffer: ArrayBuffer }[] = [];
  const textFiles: { name: string; text: string }[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    if (zipEntry.dir) continue;
    const baseName = relativePath.split('/').pop() || relativePath;
    const upperName = baseName.toUpperCase();
    filesFound.push(baseName);

    const buffer = await zipEntry.async('arraybuffer');
    if (upperName.endsWith('.DBF')) {
      dbfFiles.push({ name: upperName, buffer });
    } else if (upperName.endsWith('.TXT') || upperName.endsWith('.CSV') || upperName.endsWith('.DAT')) {
      const decodedText = decodeThaiString(new Uint8Array(buffer));
      textFiles.push({ name: upperName, text: decodedText });
    }
  }

  const result: DataZipImportResult = {
    groups: [],
    students: [],
    courses: [],
    registrations: [],
    summary: {
      filesFound,
      studentCount: 0,
      groupCount: 0,
      courseCount: 0,
      registrationCount: 0,
    },
  };

  const groupMap = new Map<string, Group>();
  const courseMap = new Map<string, Course>();
  const studentMap = new Map<string, Student>();
  const registrationList: RegistrationRecord[] = [];

  // Helper to find DBF file by keyword
  const findDbf = (keyword: string) => {
    return dbfFiles.find((f) => f.name.includes(keyword));
  };

  // 1. Process GROUP.DBF
  const groupFile = findDbf('GROUP') || findDbf('GRP');
  if (groupFile) {
    try {
      const dbf = parseDbf(groupFile.buffer);
      for (const rec of dbf.records) {
        const id = (rec['GRP_ID'] || rec['GRPID'] || rec['ID'] || '').trim();
        const name = (rec['GRP_NAME'] || rec['NAME'] || rec['GNAME'] || '').trim();
        const advisor = (rec['TEACHER'] || rec['TEA_NAME'] || rec['ADVISOR'] || rec['HEAD'] || '').trim();
        let lev = (rec['LEV_ID'] || rec['LEVEL'] || rec['LEV'] || '2').trim();
        if (lev !== '1' && lev !== '2' && lev !== '3') {
          lev = '2';
        }
        const location = (rec['LOCATION'] || rec['LOC'] || '').trim();

        if (id) {
          const grp: Group = {
            id,
            name: name || `กลุ่ม ${id}`,
            level: lev as EducationLevel,
            advisorName: advisor || 'ครูประจำกลุ่ม',
            location,
          };
          groupMap.set(id, grp);
        }
      }
    } catch (e) {
      console.warn('Error parsing GROUP.DBF:', e);
    }
  }

  // 2. Process SUBJECT.DBF / SUB_CURR.DBF
  const courseFile = findDbf('SUB_CURR') || findDbf('SUBJECT') || findDbf('SUB');
  if (courseFile) {
    try {
      const dbf = parseDbf(courseFile.buffer);
      for (const rec of dbf.records) {
        const id = (rec['SUB_ID'] || rec['SUBID'] || rec['ID'] || '').trim();
        const name = (rec['SUB_NAME'] || rec['NAME'] || rec['SNAME'] || '').trim();
        const credits = parseFloat(rec['CREDIT'] || rec['CRD'] || '2') || 2;
        const typeRaw = (rec['SUB_TYPE'] || rec['TYPE'] || '1').trim();
        const type: 'compulsory' | 'elective' = typeRaw === '2' || typeRaw === '3' ? 'elective' : 'compulsory';
        let lev = (rec['LEV_ID'] || rec['LEVEL'] || '2').trim();
        if (lev !== '1' && lev !== '2' && lev !== '3') lev = '2';

        if (id && name) {
          courseMap.set(id, {
            id,
            name,
            credits,
            type,
            level: lev as EducationLevel,
          });
        }
      }
    } catch (e) {
      console.warn('Error parsing SUB_CURR.DBF:', e);
    }
  }

  // 3. Process STUDENT.DBF
  const studentFile = findDbf('STUDENT') || findDbf('STU');
  if (studentFile) {
    try {
      const dbf = parseDbf(studentFile.buffer);
      for (const rec of dbf.records) {
        const rawId = (rec['ID'] || rec['STU_ID'] || rec['STUDENT_ID'] || '').trim();
        if (!rawId) continue;

        const formattedId = formatStudentId(rawId);
        const prefix = (rec['PRENAME'] || rec['PREFIX'] || rec['TITLE'] || '').trim();
        const firstName = (rec['NAME'] || rec['FNAME'] || rec['FIRSTNAME'] || '').trim();
        const lastName = (rec['SURNAME'] || rec['LNAME'] || rec['LASTNAME'] || '').trim();
        const citizenId = (rec['PID'] || rec['IDCARD'] || rec['CITIZEN_ID'] || '').trim();
        const groupId = (rec['GRP_ID'] || rec['GROUP_ID'] || rec['GRPID'] || '').trim();
        let lev = (rec['LEV_ID'] || rec['LEVEL'] || '2').trim();
        if (lev !== '1' && lev !== '2' && lev !== '3') lev = '2';
        const phone = (rec['TEL'] || rec['PHONE'] || '').trim();
        const address = (rec['ADDR'] || rec['ADDRESS'] || '').trim();

        const grp = groupMap.get(groupId);
        const groupName = grp?.name || `กลุ่ม ${groupId}`;
        const advisorName = grp?.advisorName || 'ครูประจำกลุ่ม';

        const student: Student = {
          id: formattedId,
          citizenId,
          prefix: prefix || 'นาย',
          firstName,
          lastName,
          level: (grp?.level || lev) as EducationLevel,
          groupId,
          groupName,
          advisorName,
          phone,
          address,
          status: 'กำลังศึกษา',
        };
        studentMap.set(formattedId, student);
      }
    } catch (e) {
      console.warn('Error parsing STUDENT.DBF:', e);
    }
  }

  // 4. Process STU_SUB.DBF (Course registrations)
  const regFile = findDbf('STU_SUB') || findDbf('REGISTER') || findDbf('ENROLL');
  if (regFile) {
    try {
      const dbf = parseDbf(regFile.buffer);
      // Group registrations by studentId + semester
      const mapKeyToReg = new Map<string, RegistrationRecord>();

      for (const rec of dbf.records) {
        const rawId = (rec['ID'] || rec['STU_ID'] || '').trim();
        if (!rawId) continue;
        const studentId = formatStudentId(rawId);
        const semester = (rec['SEMESTER'] || rec['SEME_ID'] || rec['TERM'] || '1/2569').trim();
        const subId = (rec['SUB_ID'] || rec['SUBID'] || '').trim();
        const regType = (rec['REG_TYPE'] || rec['TYPE'] || '1').trim(); // 1 = regular, 2 = transfer

        const key = `${studentId}__${semester}`;
        if (!mapKeyToReg.has(key)) {
          mapKeyToReg.set(key, {
            studentId,
            semester,
            subjects: [],
            kpcHours: 50,
            kpcRegistered: true,
            kpcCumulativeHours: 100,
          });
        }

        const regRecord = mapKeyToReg.get(key)!;
        const crs = courseMap.get(subId);

        if (subId) {
          regRecord.subjects.push({
            subjectId: subId,
            subjectName: crs?.name || `วิชา ${subId}`,
            credits: crs?.credits || 3,
            type: crs?.type || 'compulsory',
            registered: true,
            transferred: regType === '2' || regType === 'เทียบโอน',
          });
        }
      }

      registrationList.push(...Array.from(mapKeyToReg.values()));
    } catch (e) {
      console.warn('Error parsing STU_SUB.DBF:', e);
    }
  }

  // 5. Check if there are pipe-delimited text files (e.g. from prompt snippet)
  for (const textFile of textFiles) {
    const parsedLines = parseDelimitedText(textFile.text);
    for (const parts of parsedLines) {
      // Snippet check: "0512"|"ตรอกนอง"|"..."|"1"|...|2|...
      if (parts.length >= 4 && parts[0].length === 4 && /^\d{4}$/.test(parts[0])) {
        const gId = parts[0];
        const gName = parts[1];
        const advisor = parts[2] || 'ครูประจำกลุ่ม';
        const levelCode = parts[5] || parts[4] || '2';
        const lev: EducationLevel = levelCode === '1' ? '1' : levelCode === '3' ? '3' : '2';

        if (!groupMap.has(gId)) {
          groupMap.set(gId, {
            id: gId,
            name: gName,
            level: lev,
            advisorName: advisor,
            location: parts[4] || '',
          });
        }
      }
    }
  }

  result.groups = Array.from(groupMap.values());
  result.students = Array.from(studentMap.values());
  result.courses = Array.from(courseMap.values());
  result.registrations = registrationList;

  result.summary.groupCount = result.groups.length;
  result.summary.studentCount = result.students.length;
  result.summary.courseCount = result.courses.length;
  result.summary.registrationCount = result.registrations.length;

  return result;
}

/**
 * Creates and downloads an exported DATA.ZIP or JSON package
 */
export async function exportToZip(
  students: Student[],
  groups: Group[],
  courses: Course[],
  registrations: RegistrationRecord[],
  config: InstitutionConfig
): Promise<Blob> {
  const zip = new JSZip();

  // Export readable JSON files
  const metadata = {
    institution: config,
    exportDate: new Date().toISOString(),
    totalStudents: students.length,
    totalGroups: groups.length,
    totalCourses: courses.length,
    totalRegistrations: registrations.length,
  };

  zip.file('INFO.JSON', JSON.stringify(metadata, null, 2));
  zip.file('STUDENTS.JSON', JSON.stringify(students, null, 2));
  zip.file('GROUPS.JSON', JSON.stringify(groups, null, 2));
  zip.file('COURSES.JSON', JSON.stringify(courses, null, 2));
  zip.file('REGISTRATIONS.JSON', JSON.stringify(registrations, null, 2));

  // Also include CSV exports compatible with Excel and text tools
  const studentCsvHeader = 'รหัสนักศึกษา,คำนำหน้า,ชื่อ,นามสกุล,ระดับ,รหัสกลุ่ม,กลุ่ม,ครูประจำกลุ่ม,เลขบัตรประชาชน,เบอร์โทร,ที่อยู่,สถานะ\n';
  const studentCsvRows = students
    .map(
      (s) =>
        `"${s.id}","${s.prefix}","${s.firstName}","${s.lastName}","${s.level}","${s.groupId}","${s.groupName}","${s.advisorName}","${s.citizenId || ''}","${s.phone || ''}","${s.address || ''}","${s.status}"`
    )
    .join('\n');
  zip.file('STUDENT.CSV', '\uFEFF' + studentCsvHeader + studentCsvRows);

  const groupCsvHeader = 'รหัสกลุ่ม,ชื่อกลุ่ม,ระดับ,ครูประจำกลุ่ม,สถานที่\n';
  const groupCsvRows = groups.map((g) => `"${g.id}","${g.name}","${g.level}","${g.advisorName}","${g.location || ''}"`).join('\n');
  zip.file('GROUP.CSV', '\uFEFF' + groupCsvHeader + groupCsvRows);

  return await zip.generateAsync({ type: 'blob' });
}
