
interface POEmailProps {
  supplierName: string;
  poNumber: string;
  total: number;
  expectedDelivery?: string;
  notes?: string;
}

export function generatePOEmailHTML(props: POEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Order ${props.poNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .info-row {
      margin-bottom: 15px;
    }
    .label {
      font-weight: bold;
      color: #667eea;
    }
    .value {
      margin-top: 5px;
    }
    .total {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .total .amount {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .notes {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Purchase Order</h1>
    <p>Sun Direct Power</p>
  </div>

  <div class="content">
    <p>Dear ${props.supplierName},</p>
    
    <p>Please find the details of our purchase order below:</p>

    <div class="info-row">
      <div class="label">Purchase Order Number:</div>
      <div class="value">${props.poNumber}</div>
    </div>

    ${props.expectedDelivery ? `
    <div class="info-row">
      <div class="label">Expected Delivery Date:</div>
      <div class="value">${props.expectedDelivery}</div>
    </div>
    ` : ''}

    <div class="total">
      <div style="color: #666; margin-bottom: 10px;">Total Order Value</div>
      <div class="amount">$${props.total.toFixed(2)}</div>
    </div>

    ${props.notes ? `
    <div class="notes">
      <div class="label">Special Instructions:</div>
      <div style="margin-top: 10px;">${props.notes}</div>
    </div>
    ` : ''}

    <p>Please review the attached purchase order and confirm receipt of this order.</p>
    
    <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
  </div>

  <div class="footer">
    <p><strong>Sun Direct Power</strong></p>
    <p>For any queries, please reply to this email</p>
    <p style="margin-top: 15px; font-size: 12px;">
      This is an automated email. Please do not reply directly to this message.
    </p>
  </div>
</body>
</html>
  `;
}

export function generatePOEmailText(props: POEmailProps) {
  return `
Purchase Order - ${props.poNumber}
Sun Direct Power

Dear ${props.supplierName},

Please find the details of our purchase order below:

Purchase Order Number: ${props.poNumber}
${props.expectedDelivery ? `Expected Delivery Date: ${props.expectedDelivery}\n` : ''}
Total Order Value: $${props.total.toFixed(2)}

${props.notes ? `Special Instructions:\n${props.notes}\n\n` : ''}
Please review the purchase order and confirm receipt of this order.

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
Sun Direct Power
  `.trim();
}
