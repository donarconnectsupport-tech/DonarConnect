// ═══════════════════════════════════════════════════════════════
//  DonarConnect – Google Apps Script Backend
//  File: Code.gs
//
//  SETUP: See SETUP_GUIDE.md for full instructions.
//  This script handles all POST requests from the React frontend.
// ═══════════════════════════════════════════════════════════════

// ── Config (edit these) ─────────────────────────────────────────
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← paste your Sheet ID
const SHEET_NAME     = 'Orders';
const NOTIFY_EMAIL   = 'your@email.com';            // ← your email for new order alerts
// ────────────────────────────────────────────────────────────────

// Column headers in your Sheet (order matters!)
const HEADERS = [
  'Order ID', 'Timestamp', 'Full Name', 'Phone', 'Email',
  'Address', 'Pincode', 'City', 'State',
  'Product', 'Quantity', 'Unit Price', 'Total Amount',
  'Payment Method', 'Payment Status', 'Razorpay ID', 'UPI Ref',
  'Order Status'
];

/**
 * Handle POST requests from the React frontend.
 * The frontend sends JSON with an "action" field.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'submitOrder') {
      return handleSubmitOrder(body.data);
    }

    if (body.action === 'verifyPayment') {
      return handleVerifyPayment(body.data);
    }

    return jsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ success: false, message: err.toString() });
  }
}

/**
 * Handle GET requests (health check / sheet init)
 */
function doGet(e) {
  if (e.parameter.action === 'init') {
    initSheet();
    return jsonResponse({ success: true, message: 'Sheet initialized' });
  }
  return jsonResponse({ success: true, message: 'DonarConnect API is running' });
}

// ── Order Submission ─────────────────────────────────────────────

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

  // Auto-format the new row
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('middle');

  // Color-code by payment status
  colorCodeRow(sheet, lastRow, data.paymentStatus);

  // Send email notification
  try {
    sendOrderNotification(data);
  } catch (mailErr) {
    console.warn('Email notification failed:', mailErr);
  }

  return jsonResponse({ success: true, orderId: data.orderId, message: 'Order saved' });
}

// ── Payment Verification ─────────────────────────────────────────

function handleVerifyPayment(data) {
  // Optional: add Razorpay signature verification here
  // For now, just update the row status in the sheet
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.orderId) {
      sheet.getRange(i + 1, 15).setValue('Paid');  // Payment Status column
      sheet.getRange(i + 1, 16).setValue(data.razorpayId || '');
      return jsonResponse({ success: true, message: 'Payment verified' });
    }
  }

  return jsonResponse({ success: false, message: 'Order not found' });
}

// ── Sheet Helpers ─────────────────────────────────────────────────

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

  // Set column widths
  const widths = [130, 180, 150, 120, 160, 250, 80, 100, 120, 150, 70, 80, 100, 120, 140, 160, 120, 100];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.setRowHeight(1, 36);
}

function initSheet() {
  getOrCreateSheet(); // creates with headers if needed
}

function colorCodeRow(sheet, rowNum, paymentStatus) {
  const range = sheet.getRange(rowNum, 1, 1, HEADERS.length);
  if (paymentStatus === 'Paid') {
    range.setBackground('#e6faf4'); // light green
  } else if (paymentStatus === 'Pending') {
    range.setBackground('#fff9db'); // light yellow
  } else {
    range.setBackground('#fff5f5'); // light red / UPI unverified
  }
}

// ── Email Notification ────────────────────────────────────────────

function sendOrderNotification(data) {
  const subject = `[DonarConnect] New Order #${data.orderId} – ${data.paymentMethod}`;
  const body = `
New order received!

Order ID:        ${data.orderId}
Name:            ${data.fullName}
Phone:           ${data.phone}
Address:         ${data.address}, ${data.city}, ${data.state} - ${data.pincode}
Product:         ${data.productName} × ${data.quantity}
Total:           ₹${data.totalAmount}
Payment Method:  ${data.paymentMethod}
Payment Status:  ${data.paymentStatus}
Razorpay ID:     ${data.razorpayId || 'N/A'}
UPI Ref:         ${data.upiRef || 'N/A'}
Date:            ${new Date().toLocaleString('en-IN')}

View in sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}
  `.trim();

  MailApp.sendEmail({
    to:      NOTIFY_EMAIL,
    subject: subject,
    body:    body,
  });
}

// ── Utility ───────────────────────────────────────────────────────

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
