/**
 * Custom DBF (dBase III / FoxPro) & Delimited Text Parser with Windows-874 (Thai) support
 */

// Decode Thai Windows-874 / TIS-620 byte buffer safely
export function decodeThaiString(buffer: Uint8Array): string {
  try {
    const decoder = new TextDecoder('windows-874');
    return decoder.decode(buffer);
  } catch {
    try {
      const decoder = new TextDecoder('tis-620');
      return decoder.decode(buffer);
    } catch {
      // Fallback manual mapping for Windows-874 / TIS-620
      let str = '';
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte < 0x80) {
          str += String.fromCharCode(byte);
        } else if (byte >= 0xa1 && byte <= 0xfb) {
          str += String.fromCharCode(0x0e00 + (byte - 0xa0));
        } else {
          str += ' ';
        }
      }
      return str;
    }
  }
}

export interface DbfField {
  name: string;
  type: string;
  length: number;
  decimal: number;
}

export interface DbfData {
  fields: DbfField[];
  records: Record<string, string>[];
}

/**
 * Parses raw ArrayBuffer of a .DBF file
 */
export function parseDbf(buffer: ArrayBuffer): DbfData {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.length < 32) {
    throw new Error('ไฟล์ DBF มีขนาดเล็กเกินไปหรือไม่ถูกต้อง');
  }

  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);

  const fields: DbfField[] = [];
  let offset = 32;

  while (offset < headerLength - 1 && bytes[offset] !== 0x0d) {
    if (offset + 32 > bytes.length) break;

    // Field name (up to 11 bytes, null-terminated)
    const nameBytes = bytes.slice(offset, offset + 11);
    let nullIdx = nameBytes.indexOf(0);
    if (nullIdx === -1) nullIdx = 11;
    const name = String.fromCharCode(...Array.from(nameBytes.slice(0, nullIdx))).trim();

    const type = String.fromCharCode(bytes[offset + 11]);
    const length = bytes[offset + 16];
    const decimal = bytes[offset + 17];

    if (name) {
      fields.push({ name, type, length, decimal });
    }
    offset += 32;
  }

  const records: Record<string, string>[] = [];
  let recordOffset = headerLength;

  for (let i = 0; i < recordCount; i++) {
    if (recordOffset + recordLength > bytes.length) break;

    const deleteFlag = bytes[recordOffset];
    // 0x2A (*) means deleted, 0x20 (space) means active
    if (deleteFlag === 0x20) {
      const record: Record<string, string> = {};
      let fieldOffset = recordOffset + 1;

      for (const field of fields) {
        const fieldBytes = bytes.slice(fieldOffset, fieldOffset + field.length);
        const val = decodeThaiString(fieldBytes).trim();
        record[field.name] = val;
        fieldOffset += field.length;
      }
      records.push(record);
    }
    recordOffset += recordLength;
  }

  return { fields, records };
}

/**
 * Parses text / csv / pipe-delimited data with Windows-874 / UTF-8
 */
export function parseDelimitedText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const results: string[][] = [];

  for (const line of lines) {
    let delimiter = ',';
    if (line.includes('|')) delimiter = '|';
    else if (line.includes('\t')) delimiter = '\t';

    const parts: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === delimiter && !inQuote) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());
    results.push(parts);
  }

  return results;
}
