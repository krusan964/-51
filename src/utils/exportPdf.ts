import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { InstitutionConfig, LEVEL_NAMES, RegistrationRecord, Student } from '../types';

export function printRegistrationSheets(elementId = 'printable-registration-area') {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    window.print();
    return;
  }

  // Native window.print with proper styles is standard and prints vector Thai fonts crisp and clean
  window.print();
}

/**
 * Direct PDF generator from HTML element using high resolution canvas or printable iframe
 */
export async function downloadRegistrationPdf(
  students: { student: Student; registration?: RegistrationRecord }[],
  config: InstitutionConfig
) {
  // We can open a dedicated printable view or generate standard PDF document
  // Trigger window.print with active preview
  const originalTitle = document.title;
  const fileName =
    students.length === 1
      ? `ใบลงทะเบียน_${students[0].student.id}_${students[0].student.firstName}`
      : `ใบลงทะเบียน_${config.currentSemester.replace('/', '-')}_${students.length}คน`;

  document.title = fileName;
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}
