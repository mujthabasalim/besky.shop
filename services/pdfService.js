const PDFDocument = require("pdfkit");

const generatePDFReport = (startDate, endDate, salesData, ordersData, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  doc.registerFont("Poppins-Regular", "./public/fonts/POPPINS-REGULAR.TTF");
  doc.registerFont("Poppins-Bold", "./public/fonts/POPPINS-BOLD.TTF");
  doc.registerFont("Logo-Font", "./public/fonts/MontserratAlt1-Medium.woff2");

  // Set response headers for download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Sales report.pdf"'
  );

  // Stream document to response
  doc.pipe(res);

  doc
    .font("Logo-Font")
    .fontSize(25)
    .fillColor("black")
    .text("BE.SKY", { align: "left" })
    .font("Poppins-Regular")
    .fontSize(10)
    .text("Find your happiness", { align: "left" })
    .moveDown();

  // Sales Report Title
  doc
    .fontSize(24)
    .font("Poppins-Bold")
    .text("SALES REPORT", { align: "center" })
    .fontSize(8)
    .font("Poppins-Regular")
    .text(
      `From ${new Date(startDate).toLocaleDateString()} To ${new Date(
        endDate
      ).toLocaleDateString()}`,
      {
        align: "center",
      }
    )
    .moveDown(1);

  // Draw a line for separation
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(12).text("Summary").moveDown(0.5);

  // Rectangle for the summary box
  const summaryBoxTop = doc.y;
  doc.rect(50, summaryBoxTop, 500, 60).stroke();

  doc
    .fontSize(10)
    .text(
      `Revenue:  ₹${salesData.totalSalesAmount.toFixed(2)}`,
      60,
      summaryBoxTop + 10
    )
    .text(`Orders: ${salesData.totalOrders}`, 300, summaryBoxTop + 10)
    .text(
      `Discount:  ₹${salesData.totalDiscounts.toFixed(2)}`,
      60,
      summaryBoxTop + 40
    )
    .text(
      `Shipping Charge:  ₹${salesData.totalShipping.toFixed(2)}`,
      300,
      summaryBoxTop + 40
    );

  doc.moveDown(2);
  doc.fontSize(14).text("Order Details", 50).moveDown(0.5);

  const tableTop = doc.y;
  doc
    .fontSize(8)
    .font("Poppins-Bold")
    .fillColor("black")
    .rect(50, tableTop, 500, 50)
    .fillAndStroke("#D3E8FF", "black")
    .fillColor("black")
    .text("Date", 72, tableTop + 7)
    .text("Order ID", 175, tableTop + 7)
    .text("No of items", 280, tableTop + 7)
    .text("Payment method", 350, tableTop + 7)
    .text("Grand Total", 440, tableTop + 7)
    .text("Status", 505, tableTop + 7);

  const columnPositions = [125, 275, 345, 435, 500];
  columnPositions.forEach((x) => {
    doc
      .moveTo(x, tableTop)
      .lineTo(x, tableTop + 50)
      .stroke();
  });

  let rowY = doc.y;
  ordersData.forEach((order, i) => {
    // Draw row background
    doc.rect(50, rowY, 500, 25).fillAndStroke("#D3E8FF", "black");

    // Populate row with data
    doc
      .fillColor("black")
      .font("Poppins-Regular")
      .text(new Date(order.createdAt).toLocaleDateString(), 60, rowY + 7)
      .text(`#${order._id}`, 130, rowY + 7)
      .text(order.items.length || "0", 305, rowY + 7)
      .text(
        `${order.paymentMethod || "N/A"} - ${order.paymentStatus || "N/A"}`,
        360,
        rowY + 7
      )
      .text(`₹${parseFloat(order.grandTotal).toFixed(2)}`, 450, rowY + 7)
      .text(`${order.orderStatus}`, 503, rowY + 7);

    // Draw vertical lines for each row
    columnPositions.forEach((x) => {
      doc
        .moveTo(x, rowY)
        .lineTo(x, rowY + 25)
        .stroke();
    });

    rowY += 25;
  });

  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc.text(`Page ${i + 1}`, 500, 775, { align: "right" });
  }

  // Finalize and close the document
  doc.end();
};

// Function for capitalize first letter
function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const generateInvoice = (order, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  doc.registerFont("Poppins-Regular", "./public/fonts/POPPINS-REGULAR.TTF");
  doc.registerFont("Poppins-Bold", "./public/fonts/POPPINS-BOLD.TTF");
  doc.registerFont("Logo-Font", "./public/fonts/MontserratAlt1-Medium.woff2");

  // Set response headers for download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="Invoice.pdf"');

  // Stream document to response
  doc.pipe(res);

  doc
    .rect(0, 42, 170, 50) // (x, y, width, height)
    .fillColor("black")
    .fill();

  doc
    .font("Logo-Font")
    .fontSize(25)
    .fillColor("white")
    .text("BE.SKY", { align: "left" })
    .font("Poppins-Regular")
    .fontSize(10)
    .text("Find your happiness", { align: "left" });

  // Sales Report Title
  doc
    .fontSize(24)
    .fillColor("black")
    .font("Poppins-Bold")
    .text("INVOICE", 400, 45, { align: "right" })
    .fontSize(8)
    .font("Poppins-Regular")
    .text(`# ${order._id.toString().toUpperCase()}`, 400, doc.y - 1, {
      align: "right",
    });

  doc
    .rect(570, 42, 50, 50) // (x, y, width, height)
    .fillColor("black")
    .fill()
    .moveDown(1);

  // Draw a line for separation
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  let y = doc.y + 10;
  doc
    .fontSize(12)
    .font("Poppins-Bold")
    .text("ORDER DETAILS:", 50, y)
    .moveDown(0.5)
    .fontSize(10)
    .font("Poppins-Regular")
    .text(`Payment Method: ${capitalizeFirstLetter(order.paymentMethod)}`, { indent: 10 })
    .text(`Payment Status: ${capitalizeFirstLetter(order.paymentStatus)}`, { indent: 10 })
    .text(`Order Status: ${capitalizeFirstLetter(order.orderStatus)}`, { indent: 10 })
    .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { indent: 10 });

  // Billing/Shipping Information
  const address = order.shippingAddress;
  doc
    .fontSize(12)
    .font("Poppins-Bold")
    .text("BILLING TO:", 320, y)
    .moveDown(0.5)
    .fontSize(10)
    .font("Poppins-Regular")
    .text(`${address.fName} ${address.lName}`, { indent: 10 })
    .text(address.houseName + ", " + address.area, { indent: 10 })
    .text(address.city + ", " + address.state + " - " + address.postcode, {
      indent: 10,
    })
    .text("Contact: " + address.contactNo, { indent: 10 });

    const tableTop = doc.y + 14;
  doc
    .rect(50, doc.y + 10, 500, 20) // (x, y, width, height)
    .fillColor("black")
    .fill();
    
    doc
    .fontSize(10)
    .font('Poppins-Bold')
    .fillColor("white")
    .text('PRODUCT' , 55, tableTop)
    .text('SIZE' , 290, tableTop)
    .text('COLOR' , 330, tableTop)
    .text('Price' , 385, tableTop)
    .text('QTY' , 455, tableTop)
    .text('TOTAL' , 500, tableTop)
    .moveDown(1);

    let rowY = tableTop + 25;

  // Table Rows
  order.items.forEach((item) => {
    doc
      .font("Poppins-Regular")
      .fillColor('black')
      .text(item.name, 55, rowY)
      .text(item.size, 298, rowY)
      .text(item.color, 332, rowY)
      .text(`₹${item.discountedPrice.toFixed(2)}`, 380, rowY)
      .text(item.quantity, 465, rowY)
      .text(`₹${item.total.toFixed(2)}`, 495, rowY);
      // Draw a line for separation
  doc.moveTo(50, doc.y + 8).lineTo(550, doc.y + 8).stroke();
    rowY += 30;
  });

  doc
    .fontSize(10)
    .font("Poppins-Bold")
    .text("SUBTOTAL", 400, rowY + 20)
    .text(`₹${order.subtotal.toFixed(2)}`, 470, rowY + 20, { align: "right" })
    .text("COUPON DISCOUNT", 400, rowY + 40)
    .text(`₹${order.couponDiscount.toFixed(2)}`, 470, rowY + 40, { align: "right" })
    .text("DELIVERY CHARGE", 400, rowY + 60)
    .text(`₹${order.deliveryCharge.toFixed(2)}`, 470, rowY + 60, { align: "right" })
    .text("GRAND TOTAL", 400, rowY + 80)
    .text(`₹${order.grandTotal.toFixed(2)}`, 470, rowY + 80, { align: "right" });

    
  // doc
  //   .fontSize(10)
  //   .text(
  //     `Revenue:  ₹${salesData.totalSalesAmount.toFixed(2)}`,
  //     60,
  //     summaryBoxTop + 10
  //   )
  //   .text(`Orders: ${salesData.totalOrders}`, 300, summaryBoxTop + 10)
  //   .text(
  //     `Discount:  ₹${salesData.totalDiscounts.toFixed(2)}`,
  //     60,
  //     summaryBoxTop + 40
  //   )
  //   .text(
  //     `Shipping Charge:  ₹${salesData.totalShipping.toFixed(2)}`,
  //     300,
  //     summaryBoxTop + 40
  //   );

  // doc.moveDown(2);
  // doc.fontSize(14).text("Order Details", 50).moveDown(0.5);

  // const tableTop = doc.y;
  // doc
  //   .fontSize(8)
  //   .font("Poppins-Bold")
  //   .fillColor("black")
  //   .rect(50, tableTop, 500, 50)
  //   .fillAndStroke("#D3E8FF", "black")
  //   .fillColor("black")
  //   .text("Date", 72, tableTop + 7)
  //   .text("Order ID", 175, tableTop + 7)
  //   .text("No of items", 280, tableTop + 7)
  //   .text("Payment method", 350, tableTop + 7)
  //   .text("Grand Total", 440, tableTop + 7)
  //   .text("Status", 505, tableTop + 7);

  // const columnPositions = [125, 275, 345, 435, 500];
  // columnPositions.forEach((x) => {
  //   doc
  //     .moveTo(x, tableTop)
  //     .lineTo(x, tableTop + 50)
  //     .stroke();
  // });

  // let rowY = doc.y;
  // ordersData.forEach((order, i) => {
  //   // Draw row background
  //   doc.rect(50, rowY, 500, 25).fillAndStroke("#D3E8FF", "black");

  //   // Populate row with data
  //   doc
  //     .fillColor("black")
  //     .font("Poppins-Regular")
  //     .text(new Date(order.createdAt).toLocaleDateString(), 60, rowY + 7)
  //     .text(`#${order._id}`, 130, rowY + 7)
  //     .text(order.items.length || "0", 305, rowY + 7)
  //     .text(
  //       `${order.paymentMethod || "N/A"} - ${order.paymentStatus || "N/A"}`,
  //       360,
  //       rowY + 7
  //     )
  //     .text(`₹${parseFloat(order.grandTotal).toFixed(2)}`, 450, rowY + 7)
  //     .text(`${order.orderStatus}`, 503, rowY + 7);

  //   // Draw vertical lines for each row
  //   columnPositions.forEach((x) => {
  //     doc
  //       .moveTo(x, rowY)
  //       .lineTo(x, rowY + 25)
  //       .stroke();
  //   });

  //   rowY += 25;
  // });

  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc
    .font('Poppins-Regular')
    .fontSize(10)
    .text(`Page ${i + 1}`, 500, 775, { align: "right" });
  }

  // Finalize and close the document
  doc.end();
};

module.exports = {
  generatePDFReport,
  generateInvoice,
};
