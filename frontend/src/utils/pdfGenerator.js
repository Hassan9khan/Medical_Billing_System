// src/utils/pdfGenerator.js
import { jsPDF } from "jspdf";

export const generateInvoice = (bill, patient, doctor) => {
  // 1. Initialize the PDF document
  const doc = new jsPDF();

  // 2. Add Company Header
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Tailwind blue-900 equivalent
  doc.text("MedBill+ Clinic", 20, 20);

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Official Medical Invoice", 20, 28);

  // 3. Add Invoice Metadata
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice ID: ${bill.id}`, 20, 45);
  doc.text(`Date Issued: ${new Date(bill.date_issued).toLocaleDateString()}`, 20, 52);
  doc.text(`Payment Status: ${bill.payment_status.toUpperCase()}`, 20, 59);

  // 4. Add Patient & Doctor Details
  doc.text(`Patient Name: ${patient.first_name} ${patient.last_name}`, 20, 75);
  doc.text(`Patient Phone: ${patient.phone}`, 20, 82);
  doc.text(`Attending Doctor: Dr. ${doctor.name} (${doctor.specialization})`, 20, 89);

  // 5. Add Services Rendered Header
  doc.setFont(undefined, 'bold');
  doc.text("Services Rendered:", 20, 105);
  doc.setFont(undefined, 'normal');

  // 6. Loop through dynamic services
  let yOffset = 115;
  bill.services.forEach((service) => {
    doc.text(`- ${service.name}`, 25, yOffset);
    doc.text(`$${service.cost.toFixed(2)}`, 170, yOffset, { align: "right" });
    yOffset += 10;
  });

  // 7. Add Financial Totals
  yOffset += 10;
  doc.line(20, yOffset, 190, yOffset); // Draw a line separator
  yOffset += 10;

  doc.text(`Consultation Fee:`, 130, yOffset);
  doc.text(`$${bill.consultation_fee.toFixed(2)}`, 170, yOffset, { align: "right" });

  yOffset += 8;
  doc.text(`Tax (10%):`, 130, yOffset);
  doc.text(`$${bill.tax.toFixed(2)}`, 170, yOffset, { align: "right" });

  yOffset += 8;
  doc.text(`Discount:`, 130, yOffset);
  doc.text(`-$${bill.discount.toFixed(2)}`, 170, yOffset, { align: "right" });

  yOffset += 12;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount:`, 130, yOffset);
  doc.setTextColor(22, 163, 74); // Green total
  doc.text(`$${bill.total_amount.toFixed(2)}`, 170, yOffset, { align: "right" });

  // 8. Save/Download the file
  doc.save(`MedBill_Invoice_${bill.id}.pdf`);
};