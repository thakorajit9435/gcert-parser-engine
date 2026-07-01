/**
 * csvParser.ts
 * Pure JavaScript CSV parser — no native library required.
 * Handles: quoted fields, comma-in-quotes, BOM stripping, CRLF + LF, empty rows.
 */

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  parseErrors: string[];
}

/**
 * Parse a raw CSV string into headers + row objects.
 */
export function parseCSV(raw: string): ParsedCSV {
  // Strip UTF-8 BOM if present
  const content = raw.startsWith('\uFEFF') ? raw.slice(1) : raw;

  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const parseErrors: string[] = [];

  if (lines.length === 0) {
    return { headers: [], rows: [], parseErrors: ['File is empty.'] };
  }

  // Parse header row
  const headers = splitCSVLine(lines[0]!).map(h => h.trim().toLowerCase());

  if (headers.length === 0 || headers.every(h => h === '')) {
    return { headers: [], rows: [], parseErrors: ['Header row is empty or invalid.'] };
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue; // skip blank lines

    const cells = splitCSVLine(line);

    if (cells.length !== headers.length) {
      parseErrors.push(
        `Row ${i + 1}: expected ${headers.length} columns but found ${cells.length}. Row skipped.`,
      );
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = (cells[idx] ?? '').trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows, parseErrors };
}

/**
 * Split a single CSV line into fields, respecting double-quote enclosure.
 */
function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped double quote
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Generate a CSV string from headers and data rows.
 * Used for template download.
 */
export function generateCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row =>
    row.map(cell => {
      const str = String(cell ?? '');
      // Wrap in quotes if contains comma, newline, or quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}
