const ExcelJS = require("exceljs");

const generateExcelReport = async (
  startDate,
  endDate,
  salesData,
  ordersData,
  res
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Add the title row
  const title = `Sales Report from ${new Date(
    startDate
  ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  const titleRow = worksheet.addRow([title]);

  // Merge cells for the title across all relevant columns (assuming 6 columns based on your headers)
  worksheet.mergeCells("A1:F1");

  // Style the title row: center alignment, font size, bold
  titleRow.getCell(1).font = { size: 24, bold: true }; // Adjust the size and boldness here
  titleRow.getCell(1).alignment = { horizontal: "center" }; // Center the title text horizontally

  // Add an empty row
  worksheet.addRow([]);

  // Add column headers for orders
  const headerRow = worksheet.addRow([
    "Date",
    "Order ID",
    "No. of items",
    "Payment Method and Status",
    "Grand Total",
    "Order Status",
  ]);

  // Set font style (size 14 and bold) for each header cell
  headerRow.eachCell((cell) => {
    cell.font = { size: 14, bold: true };
  });

  // Add each order's data
  ordersData.forEach((order) => {
    worksheet.addRow([
      order.createdAt,
      order._id,
      order.items.length,
      order.paymentMethod + "-" + order.paymentStatus,
      order.grandTotal,
      order.orderStatus,
    ]);
  });

  // Add sales data summary rows
  worksheet.addRow(["Total Sales", salesData?.totalSalesAmount || 0]);
  worksheet.addRow(["Total Orders", salesData?.totalOrders || 0]);
  worksheet.addRow(["Total Discounts", salesData?.totalDiscounts || 0]);
  worksheet.addRow(["Total Shipping Charges", salesData?.totalShipping || 0]);

  // Set response headers for Excel file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Sales report.xlsx"'
  );

  // Write Excel file to response
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = generateExcelReport;
