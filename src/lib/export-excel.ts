import * as XLSX from "xlsx";

export interface ExportColumn {
  header: string;
  key: string;
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  fileName: string,
) {
  // Build header row
  const headers = columns.map((col) => col.header);

  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      return value;
    }),
  );

  // Create worksheet with header + data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns
  const colWidths = columns.map((col, i) => {
    const maxDataLen = rows.reduce((max, row) => {
      const cellLen = String(row[i] ?? "").length;
      return cellLen > max ? cellLen : max;
    }, 0);
    return { wch: Math.max(col.header.length, maxDataLen) + 2 };
  });
  worksheet["!cols"] = colWidths;

  // Create workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Generate date suffix
  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}_${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, fullFileName);
}
