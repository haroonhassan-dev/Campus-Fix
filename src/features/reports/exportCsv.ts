import type { Complaint } from '../../types/frontend';

/**
 * Ordered list of permitted, non-personal CSV headers.
 * Personal identifiable information (submitter names, student IDs, contact emails)
 * must NEVER be included in this export list.
 */
export const CSV_HEADERS: readonly string[] = [
  'Complaint ID',
  'Title',
  'Category',
  'Priority',
  'Status',
  'Location',
  'Description',
  'Created Date',
  'Updated Date',
  'Upvote Count',
] as const;

/**
 * Sanitizes a string value against spreadsheet formula injection (CSV/DDE injection).
 * If a value starts with '=', '+', '-', '@', tab, or carriage return (even after leading whitespace),
 * prepends a single quotation mark (') to force spreadsheet engines (Excel, Google Sheets, Calc)
 * to interpret the content strictly as literal text rather than executable formula syntax.
 *
 * @param value - The raw string value to sanitize
 * @returns Formula-safe sanitized string
 */
export function sanitizeForFormulaInjection(value: string): string {
  if (!value) return '';
  // Check for formula trigger characters even after leading whitespace
  if (/^\s*[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/**
 * Escapes an individual cell value following RFC 4180 specifications.
 * Encloses the cell in double quotes if it contains commas, double quotes,
 * newlines, or begins with a formula guard. Internal double quotes are escaped as `""`.
 *
 * @param rawValue - Primitive value to format
 * @returns Escaped CSV cell string
 */
export function escapeCsvCell(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) {
    return '""';
  }

  const str = String(rawValue);
  const sanitized = sanitizeForFormulaInjection(str);
  const escaped = sanitized.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Converts an array of complaints into a secure, browser-ready CSV string.
 * Strips all personal identifying information (PII) including submitter names,
 * student IDs, and contact emails.
 *
 * @param complaints - Array of complaints to serialize
 * @returns Formatted CSV content with UTF-8 BOM
 */
export function generateComplaintsCsv(complaints: Complaint[]): string {
  const headerRow = CSV_HEADERS.map(escapeCsvCell).join(',');

  const dataRows = complaints.map((complaint) => {
    const cells = [
      escapeCsvCell(complaint.id),
      escapeCsvCell(complaint.title),
      escapeCsvCell(complaint.category),
      escapeCsvCell(complaint.priority),
      escapeCsvCell(complaint.status),
      escapeCsvCell(complaint.location),
      escapeCsvCell(complaint.description),
      escapeCsvCell(complaint.createdAt),
      escapeCsvCell(complaint.updatedAt ?? ''),
      escapeCsvCell(complaint.upvotes ?? 0),
    ];
    return cells.join(',');
  });

  // UTF-8 Byte Order Mark (\uFEFF) ensures Excel and external tools decode UTF-8 correctly
  const bom = '\uFEFF';
  return bom + [headerRow, ...dataRows].join('\r\n');
}

/**
 * Generates a default timestamped filename for exported reports.
 *
 * @returns Filename string like "campusfix-complaints-report-2026-10-14.csv"
 */
export function getDefaultExportFilename(): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `campusfix-complaints-report-${dateStr}.csv`;
}

/**
 * Triggers a secure client-side browser download of the complaint dataset in CSV format.
 * Returns true if download was successfully triggered, or false if running in a non-browser environment.
 *
 * @param complaints - Array of complaints to export
 * @param filename - Optional custom filename for the downloaded file
 * @returns Boolean indicating whether browser download was triggered
 */
export function exportComplaintsToCsv(
  complaints: Complaint[],
  filename: string = getDefaultExportFilename()
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const csvContent = generateComplaintsCsv(complaints);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');

    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', filename);
    downloadAnchor.style.display = 'none';

    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    // Clean up allocated object URL
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to trigger CSV export:', error);
    return false;
  }
}

export default exportComplaintsToCsv;
