// ═══════════════════════════════════════════════════════════════
//  DonarConnect – Google Apps Script Backend
// ═══════════════════════════════════════════════════════════════

const SPREADSHEET_ID = '1KEzolo8AvqEodOMYIJFFBHfFTMeLW3ibhUwTrs_oRp8';
const SHEET_NAME     = 'Orders';
const NOTIFY_EMAIL   = 'dheenabau033@gmail.com';
const SUPPORT_PHONE  = '+91 9597481612';
const SUPPORT_EMAIL  = 'donar.connect.support@gmail.com';

const HEADERS = [
  'Order ID', 'Timestamp', 'Full Name', 'Phone', 'Email','DOB',
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
    data.dob || '',
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
DOB:             ${data.dob || 'N/A'}   
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
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { background: white; padding: 30px; }
    .order-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .order-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .order-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .section-title { font-size: 16px; font-weight: bold; color: #667eea; margin-top: 25px; margin-bottom: 15px; }
    .next-steps { background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .next-steps ol { margin: 10px 0; padding-left: 20px; }
    .next-steps li { margin: 8px 0; }
    .support-box { background: #fff3e0; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .support-box strong { color: #e65100; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px; }
    .footer p { margin: 5px 0; }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .highlight { color: #667eea; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Order Confirmed</h1>
      <p>Your order #${data.orderId} has been received</p>
    </div>
    
    <div class="content">
      <p>Dear <span class="highlight">${data.fullName}</span>,</p>
      <p>Thank you for choosing <strong>DonarConnect</strong>! Your order has been confirmed and is being processed. We're excited to help you become a life-saving donor.</p>
      
      <div class="section-title">📦 ORDER DETAILS</div>
      <div class="order-box">
        <div class="order-row">
          <span class="label">Order ID</span>
          <span class="value">${data.orderId}</span>
        </div>
        <div class="order-row">
          <span class="label">Product</span>
          <span class="value">${data.productName} × ${data.quantity}</span>
        </div>
        <div class="order-row">
          <span class="label">Total Amount</span>
          <span class="value" style="font-size: 18px; font-weight: bold; color: #667eea;">₹${data.totalAmount}</span>
        </div>
        <div class="order-row">
          <span class="label">Payment Method</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
        <div class="order-row">
          <span class="label">Payment Status</span>
          <span class="value" style="color: #4caf50; font-weight: bold;">✓ ${data.paymentStatus}</span>
        </div>
        <div class="order-row">
          <span class="label">Order Date</span>
          <span class="value">${new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div class="section-title">🚀 WHAT HAPPENS NEXT?</div>
      <div class="next-steps">
        <ol>
          <li><strong>Kit Dispatch:</strong> Your Sample Collection Kit will be dispatched within <strong>1-2 business days</strong></li>
          <li><strong>Tracking Update:</strong> You'll receive an SMS with tracking details</li>
          <li><strong>Sample Collection:</strong> Follow the simple instructions in the kit to collect your sample</li>
          <li><strong>Screening & Earning:</strong> Once approved, start earning <strong>₹35,000/month</strong>!</li>
        </ol>
      </div>

      <div class="section-title">💬 NEED HELP?</div>
      <div class="support-box">
        <p><strong>Customer Support</strong></p>
        <p>📞 Phone: ${SUPPORT_PHONE}</p>
        <p>📧 Email: ${SUPPORT_EMAIL}</p>
        <p>⏰ Hours: Monday - Saturday, 9 AM - 6 PM IST</p>
        <p style="margin-top: 10px; font-size: 12px;">We're here to help with any questions or concerns!</p>
      </div>

      <p style="margin-top: 30px; text-align: center; color: #999; font-size: 13px;">
        View your order in our dashboard: <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}" style="color: #667eea; text-decoration: none;">Click here</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>DonarConnect</strong></p>
      <p>Together, we are helping build families and changing lives.</p>
      <p style="margin-top: 15px; color: #ccc;">© 2026 DonarConnect. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  MailApp.sendEmail({
    to:       data.email,
    subject:  subject,
    htmlBody: htmlBody,
    replyTo:  SUPPORT_EMAIL,
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}