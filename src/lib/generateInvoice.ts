import jsPDF from "jspdf";

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issuedDate: string;
  dueDate?: string;
  status: string;
  // Client
  clientName: string;
  clientEmail?: string | null;
  clientCompany?: string | null;
  // Business
  businessName?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessPhone?: string;
  // Items
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  // Extra
  notes?: string;
  paymentTerms?: string;
  projectName?: string | null;
  template?: "modern" | "classic" | "minimal";
  currency?: string;
}

type RGB = [number, number, number];

interface TemplateColors {
  primary: RGB;
  headerBg: RGB;
  headerText: RGB;
  dark: RGB;
  muted: RGB;
  light: RGB;
  accent: RGB;
}

const TEMPLATES: Record<string, TemplateColors> = {
  modern: {
    primary: [26, 115, 102],
    headerBg: [26, 115, 102],
    headerText: [255, 255, 255],
    dark: [30, 35, 50],
    muted: [120, 130, 145],
    light: [245, 247, 250],
    accent: [26, 115, 102],
  },
  classic: {
    primary: [44, 62, 80],
    headerBg: [44, 62, 80],
    headerText: [255, 255, 255],
    dark: [33, 37, 41],
    muted: [108, 117, 125],
    light: [248, 249, 250],
    accent: [52, 73, 94],
  },
  minimal: {
    primary: [0, 0, 0],
    headerBg: [255, 255, 255],
    headerText: [0, 0, 0],
    dark: [0, 0, 0],
    muted: [150, 150, 150],
    light: [245, 245, 245],
    accent: [0, 0, 0],
  },
};

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const t = TEMPLATES[data.template || "modern"] || TEMPLATES.modern;
  const currency = data.currency === "EUR" ? "€" : data.currency === "GBP" ? "£" : "$";

  // ---- HEADER ----
  if (data.template === "minimal") {
    // Minimal: no colored header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...t.dark);
    doc.text("INVOICE", margin, y + 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...t.muted);
    doc.text(`#${data.invoiceNumber}`, pageWidth - margin, y + 8, { align: "right" });
    doc.text(`Issued: ${data.issuedDate}`, pageWidth - margin, y + 15, { align: "right" });
    if (data.dueDate) doc.text(`Due: ${data.dueDate}`, pageWidth - margin, y + 22, { align: "right" });

    doc.setDrawColor(...t.dark);
    doc.setLineWidth(1);
    doc.line(margin, y + 28, pageWidth - margin, y + 28);
    y = y + 40;
  } else {
    doc.setFillColor(...t.headerBg);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...t.headerText);
    doc.text("INVOICE", margin, 32);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`#${data.invoiceNumber}`, pageWidth - margin, 22, { align: "right" });
    doc.text(`Issued: ${data.issuedDate}`, pageWidth - margin, 30, { align: "right" });
    if (data.dueDate) doc.text(`Due: ${data.dueDate}`, pageWidth - margin, 38, { align: "right" });

    y = 68;
  }

  // ---- STATUS BADGE ----
  const statusColor: RGB =
    data.status === "paid" ? [34, 139, 34] :
    data.status === "overdue" ? [200, 50, 50] :
    data.status === "sent" ? [59, 130, 246] :
    [200, 150, 30];
  doc.setFontSize(9);
  doc.setFillColor(...statusColor);
  const statusText = data.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 12;
  doc.roundedRect(margin, y - 7, statusWidth, 13, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, margin + 6, y + 1);
  y += 18;

  // ---- FROM / BILL TO ----
  const colLeft = margin;
  const colRight = pageWidth / 2 + 10;
  let yLeft = y;
  let yRight = y;

  // FROM
  if (data.businessName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...t.muted);
    doc.text("FROM", colLeft, yLeft);
    yLeft += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...t.dark);
    doc.text(data.businessName, colLeft, yLeft);
    yLeft += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...t.muted);
    if (data.businessAddress) {
      const addrLines = doc.splitTextToSize(data.businessAddress, contentWidth / 2 - 15);
      addrLines.forEach((line: string) => { doc.text(line, colLeft, yLeft); yLeft += 5; });
    }
    if (data.businessEmail) { doc.text(data.businessEmail, colLeft, yLeft); yLeft += 5; }
    if (data.businessPhone) { doc.text(data.businessPhone, colLeft, yLeft); yLeft += 5; }
  }

  // BILL TO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...t.muted);
  doc.text("BILL TO", colRight, yRight);
  yRight += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...t.dark);
  doc.text(data.clientName, colRight, yRight);
  yRight += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...t.muted);
  if (data.clientCompany) { doc.text(data.clientCompany, colRight, yRight); yRight += 5; }
  if (data.clientEmail) { doc.text(data.clientEmail, colRight, yRight); yRight += 5; }

  y = Math.max(yLeft, yRight) + 15;

  // ---- LINE ITEMS TABLE ----
  // Header
  doc.setFillColor(...t.light);
  doc.rect(margin, y - 5, contentWidth, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...t.muted);
  doc.text("DESCRIPTION", margin + 5, y + 3);
  doc.text("QTY", pageWidth - margin - 65, y + 3, { align: "right" });
  doc.text("RATE", pageWidth - margin - 35, y + 3, { align: "right" });
  doc.text("AMOUNT", pageWidth - margin - 5, y + 3, { align: "right" });
  y += 16;

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...t.dark);

  const items = data.lineItems.length > 0 ? data.lineItems : [
    { description: data.projectName ? `Project: ${data.projectName}` : "Professional services", quantity: 1, rate: data.subtotal, amount: data.subtotal }
  ];

  items.forEach((item, i) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const descLines = doc.splitTextToSize(item.description, contentWidth / 2);
    descLines.forEach((line: string, li: number) => {
      doc.text(line, margin + 5, y + li * 5);
    });
    doc.text(String(item.quantity), pageWidth - margin - 65, y, { align: "right" });
    doc.text(`${currency}${item.rate.toFixed(2)}`, pageWidth - margin - 35, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`${currency}${item.amount.toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += Math.max(descLines.length * 5, 5) + 4;

    // Row separator
    if (i < items.length - 1) {
      doc.setDrawColor(230, 232, 236);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    }
  });

  // Divider before totals
  doc.setDrawColor(200, 205, 210);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2, y, pageWidth - margin, y);
  y += 8;

  // ---- TOTALS SECTION ----
  const totalsX = pageWidth / 2 + 10;
  const totalsValX = pageWidth - margin - 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...t.muted);

  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(...t.dark);
  doc.text(`${currency}${data.subtotal.toFixed(2)}`, totalsValX, y, { align: "right" });
  y += 7;

  if (data.discountPercent > 0) {
    doc.setTextColor(...t.muted);
    doc.text(`Discount (${data.discountPercent}%)`, totalsX, y);
    doc.setTextColor(200, 50, 50);
    doc.text(`-${currency}${data.discountAmount.toFixed(2)}`, totalsValX, y, { align: "right" });
    y += 7;
  }

  if (data.taxRate > 0) {
    doc.setTextColor(...t.muted);
    doc.text(`Tax (${data.taxRate}%)`, totalsX, y);
    doc.setTextColor(...t.dark);
    doc.text(`${currency}${data.taxAmount.toFixed(2)}`, totalsValX, y, { align: "right" });
    y += 7;
  }

  y += 3;
  doc.setFillColor(...t.light);
  doc.rect(totalsX - 5, y - 6, pageWidth - margin - totalsX + 10, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...t.muted);
  doc.text("TOTAL", totalsX, y + 4);
  doc.setFontSize(14);
  doc.setTextColor(...t.accent);
  doc.text(`${currency}${data.total.toFixed(2)}`, totalsValX, y + 5, { align: "right" });

  y += 28;

  // ---- NOTES / PAYMENT TERMS ----
  if (data.paymentTerms || data.notes) {
    if (y > 240) { doc.addPage(); y = margin; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...t.muted);

    if (data.paymentTerms) {
      doc.text("PAYMENT TERMS", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...t.dark);
      doc.text(data.paymentTerms, margin, y);
      y += 10;
    }

    if (data.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...t.muted);
      doc.text("NOTES", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...t.dark);
      const noteLines = doc.splitTextToSize(data.notes, contentWidth);
      noteLines.forEach((line: string) => { doc.text(line, margin, y); y += 5; });
    }
  }

  // ---- FOOTER ----
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...t.muted);
  doc.text(data.businessName || "Generated by LifeHub", margin, footerY);
  doc.text("Thank you for your business!", pageWidth - margin, footerY, { align: "right" });

  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
