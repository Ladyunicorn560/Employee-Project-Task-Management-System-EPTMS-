const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify');
const reportRepository = require('../repositories/reportRepository');
const ForbiddenError = require('../errors/ForbiddenError');

const REPORT_METADATA = {
  project:      { title: 'Project Summary Report',         filename: 'project_summary' },
  employee:     { title: 'Employee Workload Report',        filename: 'employee_workload' },
  task:         { title: 'Task Status Report',             filename: 'task_status' },
  milestone:    { title: 'Milestone Progress Report',      filename: 'milestone_progress' },
  review:       { title: 'Review History Report',          filename: 'review_history' },
  notification: { title: 'Notification Summary Report',   filename: 'notification_summary' }
};

// ─── RBAC Helpers ─────────────────────────────────────────────────────────────
const ROLE_ACCESS = {
  project:      ['Administrator', 'Project Manager'],
  employee:     ['Administrator', 'Project Manager', 'Employee'],
  task:         ['Administrator', 'Project Manager', 'Employee', 'Reviewer'],
  milestone:    ['Administrator', 'Project Manager', 'Employee'],
  review:       ['Administrator', 'Project Manager', 'Employee', 'Reviewer'],
  notification: ['Administrator', 'Project Manager', 'Employee', 'Reviewer']
};

function checkAccess(reportType, roleName) {
  return (ROLE_ACCESS[reportType] || []).includes(roleName);
}

// ─── Export Helpers ────────────────────────────────────────────────────────────
function formatDateVal(v) {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
}

function flattenRecord(record) {
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (v instanceof Date) { out[k] = formatDateVal(v); }
    else if (v === null || v === undefined) { out[k] = ''; }
    else { out[k] = v; }
  }
  return out;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
async function generateCsv(data) {
  return new Promise((resolve, reject) => {
    if (!data.length) return resolve('No data available.\n');
    const flat = data.map(flattenRecord);
    stringify(flat, { header: true }, (err, out) => {
      if (err) return reject(err);
      resolve(out);
    });
  });
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────
async function generateXlsx(data, title) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EPTMS';
  wb.created = new Date();

  const ws = wb.addWorksheet(title.substring(0, 31));

  if (!data.length) {
    ws.addRow(['No data available.']);
    return wb.xlsx.writeBuffer();
  }

  const flat = data.map(flattenRecord);
  const headers = Object.keys(flat[0]);

  // Header row with styling
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center', wrapText: true };
  });
  headerRow.height = 20;

  // Data rows with alternating colors
  flat.forEach((row, idx) => {
    const dataRow = ws.addRow(headers.map(h => row[h]));
    if (idx % 2 === 1) {
      dataRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
      });
    }
  });

  // Auto-fit columns
  headers.forEach((h, i) => {
    const col = ws.getColumn(i + 1);
    const maxLen = Math.max(h.length, ...flat.map(r => String(r[h] || '').length));
    col.width = Math.min(Math.max(maxLen + 4, 12), 50);
  });

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  return wb.xlsx.writeBuffer();
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
function generatePdf(data, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1E40AF').text(title, { align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#64748B')
      .text(`Generated: ${new Date().toUTCString()} | EPTMS`, { align: 'center' });
    doc.moveDown(0.8);

    if (!data.length) {
      doc.font('Helvetica').fontSize(11).fillColor('#374151').text('No data available for the selected filters.', { align: 'center' });
      return doc.end();
    }

    const flat = data.map(flattenRecord);
    const headers = Object.keys(flat[0]);
    const pageWidth = doc.page.width - 72;
    const colWidth = Math.min(Math.floor(pageWidth / headers.length), 120);

    // Draw table header
    const drawTableHeader = (y) => {
      doc.rect(36, y, pageWidth, 18).fill('#1E40AF');
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF')
          .text(h, 36 + i * colWidth + 2, y + 5, { width: colWidth - 4, ellipsis: true });
      });
      return y + 18;
    };

    let y = doc.y;
    y = drawTableHeader(y);

    // Draw rows
    flat.forEach((row, rowIdx) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 36;
        y = drawTableHeader(y);
      }
      const bgColor = rowIdx % 2 === 0 ? '#FFFFFF' : '#F0F4FF';
      doc.rect(36, y, pageWidth, 16).fill(bgColor);
      headers.forEach((h, i) => {
        doc.font('Helvetica').fontSize(7).fillColor('#111827')
          .text(String(row[h] || ''), 36 + i * colWidth + 2, y + 4, { width: colWidth - 4, ellipsis: true });
      });
      y += 16;
    });

    // Footer
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7).fillColor('#9CA3AF')
        .text(`Page ${i + 1} of ${totalPages}`, 36, doc.page.height - 30, { align: 'center' });
    }

    doc.end();
  });
}

// ─── Shared export dispatch ────────────────────────────────────────────────────
async function sendReport(res, format, data, reportType) {
  const meta = REPORT_METADATA[reportType];
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${meta.filename}_${ts}`;

  if (format === 'csv') {
    const csv = await generateCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csv);
  }

  if (format === 'xlsx') {
    const buffer = await generateXlsx(data, meta.title);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buffer);
  }

  // Default: pdf
  const pdfBuf = await generatePdf(data, meta.title);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  return res.send(pdfBuf);
}

// ─── Report Service Methods ───────────────────────────────────────────────────
async function generateProjectReport(roleName, userId, query) {
  if (!checkAccess('project', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for project reports.');
  return reportRepository.getProjectReport({ roleName, userId, ...query });
}

async function generateEmployeeReport(roleName, userId, query) {
  if (!checkAccess('employee', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for employee reports.');
  return reportRepository.getEmployeeReport({ roleName, userId, ...query });
}

async function generateTaskReport(roleName, userId, query) {
  if (!checkAccess('task', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for task reports.');
  return reportRepository.getTaskReport({ roleName, userId, ...query });
}

async function generateMilestoneReport(roleName, userId, query) {
  if (!checkAccess('milestone', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for milestone reports.');
  return reportRepository.getMilestoneReport({ roleName, userId, ...query });
}

async function generateReviewReport(roleName, userId, query) {
  if (!checkAccess('review', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for review reports.');
  return reportRepository.getReviewReport({ roleName, userId, ...query });
}

async function generateNotificationReport(roleName, userId, query) {
  if (!checkAccess('notification', roleName)) throw new ForbiddenError('Access denied: insufficient permissions for notification reports.');
  return reportRepository.getNotificationReport({ roleName, userId, ...query });
}

module.exports = {
  generateProjectReport,
  generateEmployeeReport,
  generateTaskReport,
  generateMilestoneReport,
  generateReviewReport,
  generateNotificationReport,
  sendReport
};
