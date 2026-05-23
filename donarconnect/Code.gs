// ═══════════════════════════════════════════════════════════════
//  DonarConnect – Google Apps Script Backend
// ═══════════════════════════════════════════════════════════════

const SPREADSHEET_ID = '1KEzolo8AvqEodOMYIJFFBHfFTMeLW3ibhUwTrs_oRp8';
const SHEET_NAME     = 'Orders';
const NOTIFY_EMAIL   = 'dheenabau033@gmail.com';
const SUPPORT_PHONE  = '+91 9344002422';
const SUPPORT_EMAIL  = 'donar.connect.support@gmail.com';

const HEADERS = [
  'Order ID', 'Timestamp', 'Full Name', 'Phone', 'Email', 'DOB',
  'Address', 'Pincode', 'City', 'State',
  'Product', 'Quantity', 'Unit Price', 'Total Amount',
  'Payment Method', 'Payment Status', 'Razorpay ID', 'UPI Ref',
  'Order Status'
];

function doPost(e) {
  try {
    // Log raw incoming POST for debugging (may be helpful if client sends unexpected content-type)
    try {
      Logger.log('doPost raw body: %s', e.postData && e.postData.contents ? e.postData.contents : JSON.stringify(e));
    } catch (logErr) { /* ignore logging errors */ }

    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else {
      // Fallback: read parameters object
      body = { action: e.parameter && e.parameter.action, data: e.parameter };
    }
    // Save a short request log for troubleshooting
    try { logRequest(body); } catch (ignored) {}
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
    formatTimestampToIST(data.timestamp),
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
  const widths = [130, 180, 150, 120, 160, 110, 250, 80, 100, 120, 150, 70, 80, 100, 120, 140, 160, 120, 100];
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

// ── Admin Notification (plain text is fine for internal) ──────────

function sendOrderNotification(data) {
  const subject = '[DonarConnect] New Order #' + data.orderId + ' - ' + data.paymentMethod;
  const body = `
New order received!

Order ID        : ${data.orderId}
Name            : ${data.fullName}
DOB             : ${data.dob || 'N/A'}
Phone           : ${data.phone}
Email           : ${data.email || 'N/A'}
Address         : ${data.address}, ${data.city}, ${data.state} - ${data.pincode}
Product         : ${data.productName} x ${data.quantity}
Total           : Rs.${data.totalAmount}
Payment Method  : ${data.paymentMethod}
Payment Status  : ${data.paymentStatus}
Razorpay ID     : ${data.razorpayId || 'N/A'}
UPI Ref         : ${data.upiRef || 'N/A'}
  Date            : ${formatTimestampToIST(data.timestamp)}

View in sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}
  `.trim();
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body });
}

// ── Customer Confirmation (styled HTML email) ─────────────────────

function sendCustomerConfirmation(data) {
  const email = (data.email || '').toString().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.warn('sendCustomerConfirmation: invalid or missing email, skipping customer mail:', email);
    return;
  }

  const subject = 'Order Confirmed! #' + data.orderId + ' - DonarConnect';

  const codBanner = data.paymentMethod === 'COD' ? `
    <tr>
      <td style="padding:16px 32px;">
        <div style="background:#fff8e1;border-left:4px solid #f9a825;border-radius:6px;padding:14px 18px;font-size:14px;color:#5d4037;">
          <strong>💵 Cash on Delivery Reminder:</strong> Please keep <strong>Rs.${data.totalAmount}</strong> ready when the kit arrives at your doorstep.
        </div>
      </td>
    </tr>` : '';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a6b 0%,#2451a0 100%);padding:36px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">DonarConnect</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Earn Money. Help Build Families.</p>
          </td>
        </tr>

        <!-- Success badge -->
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="display:inline-block;background:#e6faf4;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">✅</div>
            <h2 style="margin:0;color:#1a3a6b;font-size:22px;font-weight:800;">Order Confirmed!</h2>
            <p style="margin:8px 0 0;color:#718096;font-size:15px;">Hi <strong>${data.fullName}</strong>, your order has been received and is being processed.</p>
          </td>
        </tr>

        <!-- COD banner if applicable -->
        ${codBanner}

        <!-- Order details -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
              <tr>
                <td colspan="2" style="background:#1a3a6b;padding:12px 20px;">
                  <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Order Details</span>
                </td>
              </tr>
              ${row('Order ID', '<strong style="color:#1a3a6b;">' + data.orderId + '</strong>')}
              ${row('Product', data.productName + ' &times; ' + data.quantity)}
              ${row('Total Amount', '<strong style="color:#1a3a6b;font-size:16px;">Rs.' + data.totalAmount + '</strong>')}
              ${row('Payment Method', data.paymentMethod)}
              ${row('Payment Status', statusBadge(data.paymentStatus))}
              ${row('Order Date', formatTimestampToIST(data.timestamp))}
            </table>
          </td>
        </tr>

        <!-- What's next -->
        <tr>
          <td style="padding:24px 32px 0;">
            <h3 style="margin:0 0 16px;color:#1a3a6b;font-size:16px;font-weight:700;">📦 What Happens Next?</h3>
            ${step('1', '#00c896', 'Kit Dispatched', 'Your Sample Collection Kit will be dispatched within 1–2 business days.')}
            ${step('2', '#2451a0', 'SMS Notification', 'You will receive an SMS on your registered mobile number once your order is shipped, along with tracking details.')}
            ${step('3', '#f6ad55', 'Collect Sample', 'Follow the easy instructions inside the kit to collect your sample.')}
            ${step('4', '#e53e3e', 'Start Earning', 'Once your sample is screened and approved, you will start earning Rs.35,000 per month!')}
          </td>
        </tr>

<!-- Support -->
<tr>
  <td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fc;border-radius:12px;border:1px solid #c5deff;padding:20px;">
      <tr>
        <td style="padding:20px;">
          <h3 style="margin:0 0 12px;color:#1a3a6b;font-size:15px;font-weight:700;">🙋 Need Help?</h3>

          <!-- WhatsApp -->
          <p style="margin:0 0 8px;font-size:14px;color:#4a5568;">
            💬 &nbsp;
            <a href="https://wa.me/919344002422"
               style="color:#1a3a6b;text-decoration:none;font-weight:600;">
              ${SUPPORT_PHONE}
            </a>
          </p>

          <!-- Email -->
          <p style="margin:0 0 8px;font-size:14px;color:#4a5568;">
            📧 &nbsp;
            <a href="mailto:${SUPPORT_EMAIL}"
               style="color:#1a3a6b;text-decoration:none;font-weight:600;">
              ${SUPPORT_EMAIL}
            </a>
          </p>

          <p style="margin:0;font-size:13px;color:#718096;">
            ⏰ &nbsp;Monday – Saturday, 9 AM – 6 PM IST
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a3a6b;padding:24px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:600;">Thank you for choosing DonarConnect</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Together, we are helping build families and changing lives.</p>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.5);font-size:11px;">
              &copy; ${new Date().getFullYear()} DonarConnect &nbsp;|&nbsp;
              <a href="mailto:${SUPPORT_EMAIL}" style="color:rgba(255,255,255,0.6);text-decoration:none;">${SUPPORT_EMAIL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

  MailApp.sendEmail({
    to:       data.email,
    subject:  subject,
    htmlBody: htmlBody,
    replyTo:  SUPPORT_EMAIL,
  });
}

// ── Email helper functions ────────────────────────────────────────

function row(label, value) {
  return `
    <tr>
      <td style="padding:10px 20px;font-size:13px;color:#718096;border-bottom:1px solid #e2e8f0;width:40%;">${label}</td>
      <td style="padding:10px 20px;font-size:14px;color:#1a202c;border-bottom:1px solid #e2e8f0;">${value}</td>
    </tr>`;
}

function statusBadge(status) {
  const isPaid = status === 'Paid' || status.startsWith('Paid');
  const bg    = isPaid ? '#e6faf4' : '#fff9db';
  const color = isPaid ? '#00a97e' : '#c05911';
  return '<span style="background:' + bg + ';color:' + color + ';padding:3px 10px;border-radius:100px;font-size:12px;font-weight:700;">' + status + '</span>';
}

function step(num, color, title, desc) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="width:36px;vertical-align:top;padding-top:2px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">${num}</div>
        </td>
        <td style="padding-left:12px;">
          <div style="font-size:14px;font-weight:700;color:#1a202c;">${title}</div>
          <div style="font-size:13px;color:#718096;margin-top:2px;">${desc}</div>
        </td>
      </tr>
    </table>`;
}

// ── Utility ───────────────────────────────────────────────────────

// Format a timestamp to India Standard Time for consistent storage and display
function formatTimestampToIST(value) {
  try {
    const d = value ? new Date(value) : new Date();
    if (isNaN(d.getTime())) return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    return Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
  } catch (err) {
    return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Append incoming request details to a small Logs sheet for debugging
function logRequest(body) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('RequestsLog');
    if (!sheet) {
      sheet = ss.insertSheet('RequestsLog');
      sheet.getRange(1,1,1,3).setValues([['Timestamp','Action','Payload']]);
      sheet.setFrozenRows(1);
    }
    const ts = formatTimestampToIST();
    const action = (body && body.action) || 'unknown';
    const payload = JSON.stringify(body && body.data ? body.data : body);
    sheet.appendRow([ts, action, payload]);
  } catch (err) {
    console.warn('logRequest failed:', err);
  }
}