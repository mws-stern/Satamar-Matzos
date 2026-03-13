import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type { Order } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { order } = req.body as { order: Order };

    if (!order) {
      return res.status(400).json({ error: "Order data is required" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderNumber}.pdf`
    );

    doc.pipe(res);

    // Add logo (MUCH BIGGER)
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 200 }); // Increased from 80 to 200
    }

    // Company info (moved down to accommodate larger logo)
    doc
      .fontSize(20)
      .fillColor("#f59e0b")
      .text("Satmar Montreal Matzos", 270, 60, { align: "right" })
      .fontSize(10)
      .fillColor("#000000")
      .text("123 Business St", 270, 90, { align: "right" })
      .text("Montreal, QC H1X 1X1", 270, 105, { align: "right" })
      .text("Phone: (514) 555-0123", 270, 120, { align: "right" })
      .text("sales@satmarmatzosmtl.ca", 270, 135, { align: "right" });

    // Invoice title (moved down)
    doc
      .fontSize(28)
      .fillColor("#f59e0b")
      .text("INVOICE", 50, 180)
      .fontSize(10)
      .fillColor("#000000");

    // Invoice details
    const yStart = 220;
    doc
      .text(`Invoice #: ${order.orderNumber}`, 50, yStart)
      .text(`Order Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 50, yStart + 15)
      .text(
        `Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}`,
        50,
        yStart + 30
      )
      .text(`Payment Status: ${order.paymentStatus}`, 50, yStart + 45);

    // Customer info
    doc
      .text("Bill To:", 320, yStart)
      .fontSize(12)
      .text(order.customerName || "N/A", 320, yStart + 15)
      .fontSize(10)
      .text(order.customerEmail || "", 320, yStart + 30);

    // Table
    const tableTop = yStart + 80;
    const tableHeaders = ["Item", "Qty", "Price/Lb", "Discount", "Total"];
    const colWidths = [200, 60, 80, 80, 75];
    let xPos = 50;

    // Table header
    doc
      .fontSize(10)
      .fillColor("#ffffff")
      .rect(50, tableTop, 495, 25)
      .fill("#f59e0b");

    doc.fillColor("#ffffff");
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 7, {
        width: colWidths[i],
        align: i === 0 ? "left" : "right",
      });
      xPos += colWidths[i];
    });

    // Table rows
    let yPos = tableTop + 30;
    doc.fillColor("#000000");

    order.items.forEach((item, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const itemTotal = item.finalPrice ?? (item.quantity * (item.pricePerLb || 0));

      xPos = 50;
      const rowData = [
        item.productName || "Item",
        item.quantity.toString(),
        `$${(item.pricePerLb || 0).toFixed(2)}`,
        item.discount ? `${item.discount}${item.discountType === 'fixed' ? '$' : '%'}` : "-",
        `$${itemTotal.toFixed(2)}`,
      ];

      if (index % 2 === 0) {
        doc.rect(50, yPos - 5, 495, 20).fill("#f9fafb");
        doc.fillColor("#000000");
      }

      rowData.forEach((data, i) => {
        doc.text(data, xPos, yPos, {
          width: colWidths[i],
          align: i === 0 ? "left" : "right",
        });
        xPos += colWidths[i];
      });

      yPos += 20;
    });

    // Use order totals directly from database instead of recalculating
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const total = order.total || 0;
    
    // Only calculate discount if there's a difference between subtotal and total before tax
    const calculatedDiscount = Math.max(0, subtotal - (total - tax));

    // Summary section
    yPos += 20;
    const summaryX = 370;

    doc
      .fontSize(10)
      .text("Subtotal:", summaryX, yPos, { width: 100, align: "right" })
      .text(`$${subtotal.toFixed(2)}`, summaryX + 100, yPos, {
        width: 75,
        align: "right",
      });

    if (calculatedDiscount > 0) {
      yPos += 20;
      doc
        .text("Discount:", summaryX, yPos, { width: 100, align: "right" })
        .fillColor("#ef4444")
        .text(`-$${calculatedDiscount.toFixed(2)}`, summaryX + 100, yPos, {
          width: 75,
          align: "right",
        })
        .fillColor("#000000");
    }

    if (tax > 0) {
      yPos += 20;
      doc
        .text("Tax:", summaryX, yPos, { width: 100, align: "right" })
        .text(`$${tax.toFixed(2)}`, summaryX + 100, yPos, {
          width: 75,
          align: "right",
        });
    }

    yPos += 20;
    doc
      .fontSize(12)
      .fillColor("#f59e0b")
      .text("Total:", summaryX, yPos, { width: 100, align: "right" })
      .text(`$${total.toFixed(2)}`, summaryX + 100, yPos, {
        width: 75,
        align: "right",
      })
      .fillColor("#000000")
      .fontSize(10);

    // Payment info
    if (order.amountPaid && order.amountPaid > 0) {
      yPos += 20;
      doc
        .text("Amount Paid:", summaryX, yPos, { width: 100, align: "right" })
        .fillColor("#10b981")
        .text(`$${order.amountPaid.toFixed(2)}`, summaryX + 100, yPos, {
          width: 75,
          align: "right",
        })
        .fillColor("#000000");

      const balance = total - order.amountPaid;
      yPos += 20;
      doc
        .fontSize(12)
        .text("Balance Due:", summaryX, yPos, { width: 100, align: "right" })
        .fillColor(balance > 0 ? "#ef4444" : "#10b981")
        .text(`$${balance.toFixed(2)}`, summaryX + 100, yPos, {
          width: 75,
          align: "right",
        })
        .fillColor("#000000")
        .fontSize(10);
    }

    // Notes
    if (order.notes) {
      yPos += 40;
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      doc
        .fontSize(10)
        .text("Notes:", 50, yPos)
        .fontSize(9)
        .fillColor("#666666")
        .text(order.notes, 50, yPos + 15, { width: 495 })
        .fillColor("#000000");
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "Thank you for your business!",
        50,
        doc.page.height - 50,
        { align: "center", width: 495 }
      );

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}