// ═══════════════════════════════════════════════════════════════
//  DonarConnect – Google Apps Script Backend
// ═══════════════════════════════════════════════════════════════

const SPREADSHEET_ID = '1KEzolo8AvqEodOMYIJFFBHfFTMeLW3ibhUwTrs_oRp8';
const SHEET_NAME     = 'Orders';
const NOTIFY_EMAIL   = 'dheenabau033@gmail.com';
const SUPPORT_PHONE  = '+91 9597481612';
const SUPPORT_EMAIL  = 'donar.connect.support@gmail.com';

const HEADERS = [
  'Order ID', 'Timestamp', 'Full Name', 'Phone', 'Email',
  'Address', 'Pincode', 'City', 'State',
  'Product', 'Quantity', 'Unit Price', 'Total Amount',
  'Payment Method', 'Payment Status', 'Razorpay ID', 'UPI Ref',
  'Order Status'
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'submitOrder')   return handleSubmitOrder(body.data);
    if (body.action === 'verifyPayment') return handleVerifyPayment(body.data);
    return jsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function doGet(e) {
  if (e.parameter.action === 'init') {
    initSheet();
    return jsonResponse({ success: true, message: 'Sheet initialized' });
  }
  return jsonResponse({ success: true, message: 'DonarConnect API is running' });
}

function handleSubmitOrder(data) {
  const sheet = getOrCreateSheet();
  const row = [
    data.orderId,
    data.timestamp || new Date().toISOString(),
    data.fullName,
    data.phone,
    data.email || '',
    data.address,
    data.pincode,
    data.city,
    data.state,
    data.productName || 'Sample Collection Kit',
    data.quantity,
    data.unitPrice,
    data.totalAmount,
    data.paymentMethod,
    data.paymentStatus,
    data.razorpayId || '',
    data.upiRef || '',
    data.orderStatus || 'New',
  ];
  sheet.appendRow(row);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('middle');
  colorCodeRow(sheet, lastRow, data.paymentStatus);
  try {
    sendOrderNotification(data);
    sendCustomerConfirmation(data);
  } catch (mailErr) {
    console.warn('Email notification failed:', mailErr);
  }
  return jsonResponse({ success: true, orderId: data.orderId, message: 'Order saved' });
}

function handleVerifyPayment(data) {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.orderId) {
      sheet.getRange(i + 1, 15).setValue('Paid');
      sheet.getRange(i + 1, 16).setValue(data.razorpayId || '');
      return jsonResponse({ success: true, message: 'Payment verified' });
    }
  }
  return jsonResponse({ success: false, message: 'Order not found' });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    initHeaders(sheet);
  }
  return sheet;
}

function initHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setBackground('#1a3a6b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(12);
  sheet.setFrozenRows(1);
  const widths = [130, 180, 150, 120, 160, 250, 80, 100, 120, 150, 70, 80, 100, 120, 140, 160, 120, 100];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.setRowHeight(1, 36);
}

function initSheet() { getOrCreateSheet(); }

function colorCodeRow(sheet, rowNum, paymentStatus) {
  const range = sheet.getRange(rowNum, 1, 1, HEADERS.length);
  if (paymentStatus === 'Paid')         range.setBackground('#e6faf4');
  else if (paymentStatus === 'Pending') range.setBackground('#fff9db');
  else                                  range.setBackground('#fff5f5');
}

function sendOrderNotification(data) {
  const subject = `[DonarConnect] New Order #${data.orderId} - ${data.paymentMethod}`;
  const body = `
New order received!

Order ID:        ${data.orderId}
Name:            ${data.fullName}
Phone:           ${data.phone}
Address:         ${data.address}, ${data.city}, ${data.state} - ${data.pincode}
Product:         ${data.productName} x ${data.quantity}
Total:           Rs.${data.totalAmount}
Payment Method:  ${data.paymentMethod}
Payment Status:  ${data.paymentStatus}
Razorpay ID:     ${data.razorpayId || 'N/A'}
UPI Ref:         ${data.upiRef || 'N/A'}
Date:            ${new Date().toLocaleString('en-IN')}

View in sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}
  `.trim();
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body });
}

function sendCustomerConfirmation(data) {
  if (!data.email) return;

  const subject = `Order Confirmed! #${data.orderId} - DonarConnect`;
  const codNote = data.paymentMethod === 'COD'
    ? `\nCASH ON DELIVERY: Please keep Rs.${data.totalAmount} ready when the kit arrives.\n`
    : '';

  const body = `
Dear ${data.fullName},

Thank you for your order! Your request has been confirmed and is being processed.

-----------------------------------------
ORDER DETAILS
-----------------------------------------
Order ID       : ${data.orderId}
Product        : ${data.productName} x ${data.quantity}
Total Amount   : Rs.${data.totalAmount}
Payment Method : ${data.paymentMethod}
Payment Status : ${data.paymentStatus}
Date           : ${new Date().toLocaleString('en-IN')}
-----------------------------------------
${codNote}
WHAT HAPPENS NEXT?

1. Your Sample Collection Kit will be dispatched within 1-2 business days.
2. You will receive an SMS on your registered mobile number once the product is shipped, along with tracking details.
3. Follow the instructions inside the kit to collect your sample.
4. Once your sample is screened and approved, you will start earning Rs.35,000 per month!

-----------------------------------------
NEED HELP?
-----------------------------------------
Phone : ${SUPPORT_PHONE}
Email : ${SUPPORT_EMAIL}
Hours : Monday - Saturday, 9 AM - 6 PM IST

We are happy to assist you with any questions or concerns.
-----------------------------------------

Thank you for choosing DonarConnect.
Together, we are helping build families and changing lives.

Warm regards,
Team DonarConnect
Email : ${SUPPORT_EMAIL}
Phone : ${SUPPORT_PHONE}
  `.trim();

  MailApp.sendEmail({
    to:      data.email,
    subject: subject,
    body:    body,
    replyTo: SUPPORT_EMAIL,
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}