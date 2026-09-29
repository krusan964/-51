import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { InstitutionConfig, LEVEL_NAMES, RegistrationRecord, Student } from '../types';

export interface ExportRegistrationParams {
  student: Student;
  registration?: RegistrationRecord;
  config: InstitutionConfig;
}

const FONT_FAMILY = 'TH SarabunPSK';

// Helper for Thai text run
function createThaiRun(text: string, options: { bold?: boolean; size?: number; underline?: boolean } = {}) {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: options.size || 28, // 28 half-points = 14pt (standard for SarabunPSK)
    bold: options.bold || false,
    underline: options.underline ? {} : undefined,
  });
}

function createParagraph(
  runs: TextRun[],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  spacing: { before?: number; after?: number } = { before: 40, after: 40 }
) {
  return new Paragraph({
    children: runs,
    alignment,
    spacing,
  });
}

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function createCell(
  text: string,
  widthPercent: number,
  options: {
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    colSpan?: number;
    size?: number;
  } = {}
) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    columnSpan: options.colSpan || 1,
    borders: cellBorders,
    children: [
      new Paragraph({
        children: [createThaiRun(text, { bold: options.bold, size: options.size || 26 })],
        alignment: options.align || AlignmentType.CENTER,
        spacing: { before: 20, after: 20 },
      }),
    ],
  });
}

/**
 * Generates Word document content for a single student registration form
 */
export function generateStudentRegistrationElements(
  student: Student,
  registration: RegistrationRecord | undefined,
  config: InstitutionConfig
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  const semester = registration?.semester || config.currentSemester;
  const levelText = LEVEL_NAMES[student.level] || 'ม.ต้น';
  const subjects = registration?.subjects || [];
  const compulsorySubs = subjects.filter((s) => s.type === 'compulsory');
  const electiveSubs = subjects.filter((s) => s.type === 'elective');

  const totalCredits = subjects.reduce((sum, s) => sum + (s.registered || s.transferred ? s.credits : 0), 0);

  // Title: "ใบลงทะเบียน"
  elements.push(
    createParagraph([createThaiRun('ใบลงทะเบียน', { bold: true, size: 36 })], AlignmentType.CENTER, { before: 0, after: 40 })
  );

  // Subtitle: "หลักสูตรการศึกษานอกระบบระดับการศึกษาขั้นพื้นฐาน พุทธศักราช 2551"
  elements.push(
    createParagraph(
      [createThaiRun(config.curriculumName, { bold: true, size: 30 })],
      AlignmentType.CENTER,
      { before: 0, after: 120 }
    )
  );

  // Line 1: ศูนย์ส่งเสริมการเรียนรู้... ระดับ...
  elements.push(
    createParagraph(
      [
        createThaiRun(`${config.institutionName}         `),
        createThaiRun('ระดับ'),
        createThaiRun(`.........${levelText}.........`, { bold: true }),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 40 }
    )
  );

  // Line 2: ภาคเรียน... กลุ่ม... รหัสกลุ่ม...
  elements.push(
    createParagraph(
      [
        createThaiRun('ภาคเรียน.......'),
        createThaiRun(`${semester}`, { bold: true }),
        createThaiRun('........กลุ่ม......'),
        createThaiRun(`${student.groupName}`, { bold: true }),
        createThaiRun('.....รหัสกลุ่ม........'),
        createThaiRun(`${student.groupId}`, { bold: true }),
        createThaiRun('........'),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 40 }
    )
  );

  // Line 3: ชื่อ - นามสกุล...
  const studentFullName = `${student.prefix}${student.firstName}  ${student.lastName}`;
  elements.push(
    createParagraph(
      [
        createThaiRun('ชื่อ – นามสกุล..........'),
        createThaiRun(`${studentFullName}`, { bold: true }),
        createThaiRun('...........................................................................................................'),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 40 }
    )
  );

  // Line 4: รหัสประจำตัวนักศึกษา...
  elements.push(
    createParagraph(
      [
        createThaiRun('รหัสประจำตัวนักศึกษา..............'),
        createThaiRun(`${student.id}`, { bold: true }),
        createThaiRun('...........................................................................................................'),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 120 }
    )
  );

  // Table setup: Columns:
  // รายวิชา (40%) | รหัสวิชา (16%) | จำนวนหน่วยกิต (14%) | ลงทะเบียน (10%) | เทียบโอน (10%) | หมายเหตุ (10%)
  const tableRows: TableRow[] = [];

  // Header row
  tableRows.push(
    new TableRow({
      children: [
        createCell('รายวิชา', 40, { bold: true }),
        createCell('รหัสวิชา', 16, { bold: true }),
        createCell('จำนวนหน่วยกิต', 14, { bold: true }),
        createCell('ลงทะเบียน', 10, { bold: true }),
        createCell('เทียบโอน', 10, { bold: true }),
        createCell('หมายเหตุ', 10, { bold: true }),
      ],
    })
  );

  // Section: วิชาบังคับ
  tableRows.push(
    new TableRow({
      children: [createCell('วิชาบังคับ', 100, { bold: true, align: AlignmentType.LEFT, colSpan: 6 })],
    })
  );

  // Compulsory rows (at least 5 rows to match original layout)
  const minCompulsoryRows = Math.max(5, compulsorySubs.length);
  for (let i = 0; i < minCompulsoryRows; i++) {
    const sub = compulsorySubs[i];
    tableRows.push(
      new TableRow({
        children: [
          createCell(sub?.subjectName || ' ', 40, { align: AlignmentType.LEFT }),
          createCell(sub?.subjectId || ' ', 16),
          createCell(sub ? String(sub.credits) : ' ', 14),
          createCell(sub?.registered && !sub.transferred ? '✓' : ' ', 10),
          createCell(sub?.transferred ? '✓' : ' ', 10),
          createCell(sub?.note || ' ', 10),
        ],
      })
    );
  }

  // Section: วิชาเลือก
  tableRows.push(
    new TableRow({
      children: [createCell('วิชาเลือก', 100, { bold: true, align: AlignmentType.LEFT, colSpan: 6 })],
    })
  );

  // Elective rows (at least 5 rows)
  const minElectiveRows = Math.max(5, electiveSubs.length);
  for (let i = 0; i < minElectiveRows; i++) {
    const sub = electiveSubs[i];
    tableRows.push(
      new TableRow({
        children: [
          createCell(sub?.subjectName || ' ', 40, { align: AlignmentType.LEFT }),
          createCell(sub?.subjectId || ' ', 16),
          createCell(sub ? String(sub.credits) : ' ', 14),
          createCell(sub?.registered && !sub.transferred ? '✓' : ' ', 10),
          createCell(sub?.transferred ? '✓' : ' ', 10),
          createCell(sub?.note || ' ', 10),
        ],
      })
    );
  }

  // Row: รวม
  tableRows.push(
    new TableRow({
      children: [
        createCell('รวม', 40, { bold: true, align: AlignmentType.RIGHT }),
        createCell(' ', 16),
        createCell(String(totalCredits), 14, { bold: true }),
        createCell(' ', 10),
        createCell(' ', 10),
        createCell(' ', 10),
      ],
    })
  );

  // Section: กิจกรรม กพช.
  const kpc = registration;
  tableRows.push(
    new TableRow({
      children: [
        createCell('กิจกรรม กพช.', 56, { bold: true, align: AlignmentType.LEFT, colSpan: 2 }),
        createCell('จำนวนชั่วโมง', 14, { bold: true }),
        createCell('ลงทะเบียน', 10, { bold: true }),
        createCell('จำนวนสะสม', 10, { bold: true }),
        createCell('หมายเหตุ', 10, { bold: true }),
      ],
    })
  );

  tableRows.push(
    new TableRow({
      children: [
        createCell(' ', 56, { colSpan: 2 }),
        createCell(kpc?.kpcHours ? `${kpc.kpcHours} ชม.` : ' ', 14),
        createCell(kpc?.kpcRegistered ? '✓' : ' ', 10),
        createCell(kpc?.kpcCumulativeHours ? `${kpc.kpcCumulativeHours} ชม.` : ' ', 10),
        createCell(kpc?.kpcNote || ' ', 10),
      ],
    })
  );

  elements.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  // Signatures section exactly formatted as attached PDF:
  // ลงชื่อ.......................................................นักศึกษา       ลงชื่อ.......................................................เจ้าหน้าที่ทะเบียน
  //        (ชื่อ - นามสกุล)
  // ลงชื่อ.......................................................ครูประจำกลุ่ม       วันที่.................เดือน............................พ.ศ...............บันทึกข้อมูล
  //        (ชื่อ ครู)
  elements.push(createParagraph([createThaiRun(' ')], AlignmentType.LEFT, { before: 120, after: 40 }));

  elements.push(
    createParagraph(
      [
        createThaiRun('ลงชื่อ.......................................................นักศึกษา       ลงชื่อ.......................................................เจ้าหน้าที่ทะเบียน'),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 20 }
    )
  );

  elements.push(
    createParagraph(
      [createThaiRun(`         (${studentFullName})`)],
      AlignmentType.LEFT,
      { before: 10, after: 60 }
    )
  );

  elements.push(
    createParagraph(
      [
        createThaiRun('ลงชื่อ.......................................................ครูประจำกลุ่ม       วันที่.................เดือน............................พ.ศ...............บันทึกข้อมูล'),
      ],
      AlignmentType.LEFT,
      { before: 40, after: 20 }
    )
  );

  elements.push(
    createParagraph(
      [createThaiRun(`         (${student.advisorName || 'นายสัญญา บุญคม'})`)],
      AlignmentType.LEFT,
      { before: 10, after: 40 }
    )
  );

  return elements;
}

/**
 * Exports Word (.docx) file for one or multiple students
 */
export async function exportRegistrationToDocx(
  items: { student: Student; registration?: RegistrationRecord }[],
  config: InstitutionConfig,
  fileName?: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pageElements = generateStudentRegistrationElements(item.student, item.registration, config);
    children.push(...pageElements);

    // If not the last student, insert page break
    if (i < items.length - 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', break: 1 })],
          pageBreakBefore: true,
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2 cm
              bottom: 1134, // 2 cm
              left: 1417, // 2.5 cm
              right: 1134, // 2 cm
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const resolvedFileName =
    fileName ||
    (items.length === 1
      ? `ใบลงทะเบียน_${items[0].student.id}_${items[0].student.firstName}.docx`
      : `ใบลงทะเบียน_${config.currentSemester.replace('/', '-')}_จำนวน${items.length}คน.docx`);

  saveAs(blob, resolvedFileName);
}
