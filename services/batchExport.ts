import { DocumentFile, Column, ExtractionResult } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  documents: DocumentFile[];
  columns: Column[];
  results: ExtractionResult;
  projectName: string;
  format: 'csv' | 'xlsx' | 'pdf';
}

function buildRows(documents: DocumentFile[], columns: Column[], results: ExtractionResult): string[][] {
  const header = ['Document Name', ...columns.map(c => c.name)];
  const rows = documents.map(doc => {
    const row = [doc.name];
    columns.forEach(col => {
      const cell = results[doc.id]?.[col.id];
      row.push(cell ? cell.value : '');
    });
    return row;
  });
  return [header, ...rows];
}

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function exportCSV(options: ExportOptions): void {
  const rows = buildRows(options.documents, options.columns, options.results);
  const csvContent = rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
  downloadBlob(
    new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
    `${sanitizeFilename(options.projectName)}_export.csv`
  );
}

function exportXLSX(options: ExportOptions): void {
  // Build a minimal XLSX using XML spreadsheet format (Excel-compatible)
  const rows = buildRows(options.documents, options.columns, options.results);
  
  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  let xml = '<?xml version="1.0"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles><Style ss:ID="header"><Font ss:Bold="1"/></Style></Styles>\n';
  xml += '<Worksheet ss:Name="Export"><Table>\n';
  
  rows.forEach((row, rowIdx) => {
    xml += '<Row>';
    row.forEach(cell => {
      const style = rowIdx === 0 ? ' ss:StyleID="header"' : '';
      xml += `<Cell${style}><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });
  
  xml += '</Table></Worksheet></Workbook>';
  
  downloadBlob(
    new Blob([xml], { type: 'application/vnd.ms-excel' }),
    `${sanitizeFilename(options.projectName)}_export.xls`
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportPDF(options: ExportOptions): void {
  const rows = buildRows(options.documents, options.columns, options.results);
  const header = rows[0];
  const body = rows.slice(1);

  const doc = new jsPDF({ orientation: header.length > 5 ? 'landscape' : 'portrait' });

  // Title
  doc.setFontSize(16);
  doc.text(options.projectName, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleDateString()} — ${body.length} document${body.length !== 1 ? 's' : ''}, ${header.length - 1} column${header.length > 2 ? 's' : ''}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [header],
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${sanitizeFilename(options.projectName)}_export.pdf`);
}

export function batchExport(options: ExportOptions): void {
  if (options.format === 'pdf') {
    exportPDF(options);
  } else if (options.format === 'xlsx') {
    exportXLSX(options);
  } else {
    exportCSV(options);
  }
}
