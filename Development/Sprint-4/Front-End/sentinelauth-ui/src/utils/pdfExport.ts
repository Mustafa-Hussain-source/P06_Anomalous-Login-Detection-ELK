import { jsPDF } from 'jspdf'

type SummaryItem = {
  label: string
  value: string
}

type ExportConfig = {
  title: string
  subtitle: string
  generatedAt: string
  summary: SummaryItem[]
  columns: string[]
  rows: string[][]
  fileName: string
}

const PAGE_MARGIN = 16
const LINE_HEIGHT = 7

function fitTextToWidth(doc: jsPDF, value: string, maxWidth: number) {
  const source = String(value ?? '-')
  if (doc.getTextWidth(source) <= maxWidth) {
    return source
  }

  const ellipsis = '...'
  let low = 0
  let high = source.length
  let best = ''

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const candidate = `${source.slice(0, mid)}${ellipsis}`
    if (doc.getTextWidth(candidate) <= maxWidth) {
      best = candidate
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return best || ellipsis
}

function timestampSuffix() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`
}

function drawHeader(doc: jsPDF, config: ExportConfig) {
  doc.setFillColor(5, 19, 40)
  doc.rect(0, 0, 210, 32, 'F')

  doc.setTextColor(87, 241, 219)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SentinelAuth', PAGE_MARGIN, 14)

  doc.setTextColor(214, 227, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Tactical Command Center', PAGE_MARGIN, 21)

  doc.setTextColor(8, 26, 48)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(config.title, PAGE_MARGIN, 41)

  doc.setTextColor(26, 44, 66)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(config.subtitle, PAGE_MARGIN, 47)
  doc.text(`Generated: ${config.generatedAt}`, PAGE_MARGIN, 53)
}

function drawSummary(doc: jsPDF, summary: SummaryItem[], startY: number) {
  doc.setTextColor(8, 26, 48)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Summary', PAGE_MARGIN, startY)

  let y = startY + 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(26, 44, 66)

  summary.forEach((item) => {
    doc.text(`${item.label}: ${item.value}`, PAGE_MARGIN, y)
    y += LINE_HEIGHT
  })

  return y + 2
}

function drawTableHeader(doc: jsPDF, columns: string[], y: number) {
  doc.setFillColor(14, 28, 49)
  doc.rect(PAGE_MARGIN, y - 5, 178, 8, 'F')

  doc.setTextColor(214, 227, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)

  const columnWidth = 178 / Math.max(columns.length, 1)
  columns.forEach((column, index) => {
    const x = PAGE_MARGIN + index * columnWidth + 1
    doc.text(column, x, y)
  })

  return y + LINE_HEIGHT
}

function drawTableRows(doc: jsPDF, columns: string[], rows: string[][], startY: number) {
  let y = startY
  const columnWidth = 178 / Math.max(columns.length, 1)
  const cellPadding = 1
  const maxCellTextWidth = Math.max(4, columnWidth - cellPadding * 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(22, 38, 58)

  rows.forEach((row) => {
    if (y > 280) {
      doc.addPage()
      y = 20
      y = drawTableHeader(doc, columns, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(22, 38, 58)
    }

    row.forEach((cell, index) => {
      const x = PAGE_MARGIN + index * columnWidth + cellPadding
      const raw = String(cell ?? '-')
      const text = fitTextToWidth(doc, raw, maxCellTextWidth)
      doc.text(text, x, y)
    })

    y += LINE_HEIGHT
  })
}

export function exportLogsPdf(config: ExportConfig) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, config)
  const afterSummaryY = drawSummary(doc, config.summary, 61)
  const tableStartY = drawTableHeader(doc, config.columns, afterSummaryY)

  drawTableRows(doc, config.columns, config.rows, tableStartY)

  const base = config.fileName.toLowerCase().endsWith('.pdf')
    ? config.fileName.slice(0, -4)
    : config.fileName
  doc.save(`${base}_${timestampSuffix()}.pdf`)
}
