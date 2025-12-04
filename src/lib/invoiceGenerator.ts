import { jsPDF } from 'jspdf';

interface InvoiceItem {
  product: {
    title: string;
    price: number;
  };
  quantity: number;
}

interface InvoiceData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  created_at?: string;
}

export const generateInvoice = (orderData: InvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Background header stripe
  doc.setFillColor(228, 27, 23);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Brand name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ZoomZone.Cars', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Premium Die-Cast Collectibles', margin, 35);

  // Invoice badge on right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 70, 12, 55, 22, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(228, 27, 23);
  doc.text('INVOICE', pageWidth - 42.5, 26, { align: 'center' });

  // Invoice details section
  const infoY = 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  // Left side - Invoice info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Invoice Details', margin, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice No:`, margin, infoY + 10);
  doc.text(`Date:`, margin, infoY + 18);
  doc.text(`Time:`, margin, infoY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`#${orderData.id.slice(0, 8).toUpperCase()}`, margin + 25, infoY + 10);
  const invoiceDate = orderData.created_at ? new Date(orderData.created_at) : new Date();
  doc.text(invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 25, infoY + 18);
  doc.text(invoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), margin + 25, infoY + 26);

  // Right side - Customer info box
  const customerBoxX = pageWidth / 2 + 10;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(customerBoxX - 5, infoY - 5, contentWidth / 2 + 5, 45, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Billed To', customerBoxX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(orderData.customer_name, customerBoxX, infoY + 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(orderData.customer_phone, customerBoxX, infoY + 18);
  doc.text(orderData.customer_email, customerBoxX, infoY + 26);
  const addressLines = doc.splitTextToSize(orderData.customer_address, contentWidth / 2 - 5);
  doc.text(addressLines.slice(0, 2), customerBoxX, infoY + 34);

  // Items table
  const tableTop = 120;
  const colWidths = { sno: 15, item: 80, qty: 20, rate: 30, amount: 35 };
  const tableX = margin;

  // Table header
  doc.setFillColor(45, 45, 45);
  doc.rect(tableX, tableTop, contentWidth, 12, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let headerX = tableX + 5;
  doc.text('S.No', headerX, tableTop + 8);
  headerX += colWidths.sno + 5;
  doc.text('Item Description', headerX, tableTop + 8);
  headerX += colWidths.item + 5;
  doc.text('Qty', headerX, tableTop + 8);
  headerX += colWidths.qty + 5;
  doc.text('Rate (Rs.)', headerX, tableTop + 8);
  headerX += colWidths.rate + 5;
  doc.text('Amount (Rs.)', headerX, tableTop + 8);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  let y = tableTop + 20;
  const rowHeight = 12;

  orderData.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(tableX, y - 6, contentWidth, rowHeight, 'F');
    }

    let rowX = tableX + 5;
    doc.setFontSize(9);
    doc.text(`${index + 1}`, rowX + 3, y);
    rowX += colWidths.sno + 5;

    // Truncate long titles
    const title = item.product.title.length > 35
      ? item.product.title.substring(0, 32) + '...'
      : item.product.title;
    doc.text(title, rowX, y);
    rowX += colWidths.item + 5;

    doc.text(`${item.quantity}`, rowX + 5, y);
    rowX += colWidths.qty + 5;

    doc.text(`Rs. ${item.product.price.toLocaleString('en-IN')}`, rowX, y);
    rowX += colWidths.rate + 5;

    const lineTotal = item.product.price * item.quantity;
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${lineTotal.toLocaleString('en-IN')}`, rowX, y);
    doc.setFont('helvetica', 'normal');

    y += rowHeight;
  });

  // Table border
  const tableHeight = y - tableTop + 5;
  doc.setDrawColor(220, 220, 220);
  doc.rect(tableX, tableTop, contentWidth, tableHeight);

  // Totals section
  y += 15;
  const totalsX = pageWidth - 90;

  // Subtotal
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', totalsX, y);
  doc.setTextColor(50, 50, 50);
  doc.text(`Rs. ${orderData.subtotal.toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });

  // Discount
  if (orderData.discount > 0) {
    y += 10;
    doc.setTextColor(34, 139, 34);
    doc.text('Discount:', totalsX, y);
    doc.text(`- Rs. ${orderData.discount.toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });
  }

  // Grand Total box
  y += 15;
  doc.setFillColor(228, 27, 23);
  doc.roundedRect(totalsX - 10, y - 8, 85, 16, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Grand Total:', totalsX - 5, y + 2);
  doc.text(`Rs. ${orderData.total.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 2, { align: 'right' });

  // Payment status badge
  y += 25;
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(pageWidth / 2 - 35, y, 70, 14, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMENT RECEIVED', pageWidth / 2, y + 9, { align: 'center' });

  // Footer section
  const footerY = 265;

  // Divider line
  doc.setDrawColor(228, 27, 23);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(228, 27, 23);
  doc.text('Thank you for shopping with ZoomZone.Cars!', pageWidth / 2, footerY, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('For queries: contact@zoomzone.cars | +91 98765 43210', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY + 14, { align: 'center' });

  doc.save(`ZoomZone_Invoice_${orderData.id.slice(0, 8).toUpperCase()}.pdf`);
};
