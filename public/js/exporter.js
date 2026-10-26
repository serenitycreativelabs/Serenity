// Ekspor Excel (SheetJS) & PDF (jsPDF + AutoTable). Library dimuat saat dibutuhkan saja.
import { APP } from './config.js';
import { loadScript, fmtDate } from './ui.js';

const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const AUTOTABLE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';

export async function getXLSX() { await loadScript(XLSX_URL); return window.XLSX; }
async function getJsPDF() { await loadScript(JSPDF_URL); await loadScript(AUTOTABLE_URL); return window.jspdf.jsPDF; }

const safeSheet = (s, used) => {
  let n = String(s || 'Sheet').replace(/[[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Sheet';
  let base = n, i = 2;
  while (used.has(n)) n = `${base.slice(0, 28)} ${i++}`;
  used.add(n); return n;
};
export const safeFile = (s) => String(s || 'export').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'export';

// sheets: [{ name, title?, head:[...], body:[[...]] }]
export async function exportExcel(filename, sheets, meta = {}) {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();
  const used = new Set();
  for (const sh of sheets) {
    const aoa = [];
    if (sh.title) {
      aoa.push([sh.title]);
      if (meta.instansi) aoa.push([meta.instansi]);
      aoa.push([`Dicetak: ${fmtDate(new Date(), true)} — ${APP.name} v${APP.version} ${APP.copyright}`]);
      aoa.push([]);
    }
    const headerRow = aoa.length;
    aoa.push(sh.head);
    sh.body.forEach((r) => aoa.push(r));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = sh.head.map((h, i) => {
      let w = String(h).length;
      for (const r of sh.body.slice(0, 300)) w = Math.max(w, String(r[i] ?? '').length);
      return { wch: Math.min(Math.max(w + 2, 6), 50) };
    });
    if (sh.body.length) ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: headerRow + sh.body.length, c: sh.head.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, safeSheet(sh.name, used));
  }
  XLSX.writeFile(wb, `${safeFile(filename)}.xlsx`, { compression: true });
}

// sections: [{ heading?, sub?, head:[...], body:[[...]] }]
export async function exportPdf({ filename, title, subtitle = '', sections, orientation = 'landscape', meta = {} }) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation, unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 32;
  const teal = [15, 118, 110];

  const header = () => {
    doc.setFillColor(...teal); doc.rect(0, 0, W, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20);
    doc.text(title, M, 30);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90);
    const line2 = [meta.instansi, subtitle].filter(Boolean).join('  •  ');
    if (line2) doc.text(line2, M, 44, { maxWidth: W - 2 * M });
    doc.setDrawColor(220); doc.line(M, 52, W - M, 52);
  };

  let y = 62;
  header();
  sections.forEach((sec, idx) => {
    if (sec.heading) {
      if (y > H - 90) { doc.addPage(); header(); y = 62; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...teal);
      doc.text(sec.heading, M, y + 10);
      y += 14;
      if (sec.sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80); doc.text(sec.sub, M, y + 8); y += 12; }
    }
    const cols = sec.head.length;
    doc.autoTable({
      startY: y + 4,
      head: [sec.head],
      body: sec.body.length ? sec.body : [[{ content: 'Tidak ada data', colSpan: cols, styles: { halign: 'center', textColor: 140 } }]],
      margin: { left: M, right: M, top: 62, bottom: 36 },
      styles: { font: 'helvetica', fontSize: cols > 14 ? 6 : cols > 9 ? 7 : 8.5, cellPadding: cols > 14 ? 2 : 3.5, overflow: 'linebreak', lineColor: [225, 230, 230], lineWidth: 0.4 },
      headStyles: { fillColor: teal, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [244, 249, 248] },
      didDrawPage: (d) => { if (d.pageNumber > 1 || idx > 0) header(); },
    });
    y = doc.lastAutoTable.finalY + 18;
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(130);
    doc.text(`Dicetak ${fmtDate(new Date(), true)} • ${APP.name} v${APP.version} • ${APP.copyright}`, M, H - 16);
    doc.text(`Halaman ${i} dari ${n}`, W - M, H - 16, { align: 'right' });
  }
  doc.save(`${safeFile(filename)}.pdf`);
}
