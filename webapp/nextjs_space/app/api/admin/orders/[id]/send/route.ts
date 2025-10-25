import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

// Decrypt function (same as in api-settings route)
function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { supplierEmail, deliveryDetails } = body;

    // Get order with full details
    const order = await prisma.materialOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        job: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get SMTP settings from database
    const apiSettings = await prisma.apiSettings.findFirst();
    
    if (!apiSettings || !apiSettings.smtpEnabled) {
      return NextResponse.json(
        { error: 'SMTP not configured. Please configure in API Settings.' },
        { status: 400 }
      );
    }

    // Decrypt SMTP password
    const smtpPassword = apiSettings.smtpPassword ? decryptKey(apiSettings.smtpPassword) : '';
    
    // Create email transporter using database settings
    const transporter = nodemailer.createTransport({
      host: apiSettings.smtpHost || 'smtp.office365.com',
      port: apiSettings.smtpPort || 587,
      secure: false, // Use TLS
      auth: {
        user: apiSettings.smtpUser || '',
        pass: smtpPassword,
      },
    } as any);

    // Parse items
    const items = Array.isArray(order.items) ? order.items : [];

    // Generate email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; }
          .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .total-row { font-weight: bold; font-size: 1.1em; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Purchase Order: ${order.poNumber}</h1>
            <p>Sun Direct Power Pty Ltd</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Order Details</h2>
              <p><strong>PO Number:</strong> ${order.poNumber}</p>
              <p><strong>Job Number:</strong> ${order.job.jobNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${order.job.lead.name}</p>
            </div>

            <div class="section">
              <h2>Delivery Information</h2>
              <p><strong>Delivery Address:</strong><br>${deliveryDetails.deliveryAddress || order.job.lead.address}</p>
              <p><strong>Contact Person:</strong> ${deliveryDetails.deliveryContactName || order.job.lead.name}</p>
              <p><strong>Contact Phone:</strong> ${deliveryDetails.deliveryContactPhone || order.job.lead.phone}</p>
              <p><strong>Preferred Time:</strong> ${deliveryDetails.deliveryTimeSlot || 'AM'}</p>
              ${deliveryDetails.expectedDelivery ? `<p><strong>Expected Delivery:</strong> ${new Date(deliveryDetails.expectedDelivery).toLocaleDateString()}</p>` : ''}
              ${deliveryDetails.deliveryInstructions ? `<div class="highlight"><strong>Special Instructions:</strong><br>${deliveryDetails.deliveryInstructions}</div>` : ''}
            </div>

            <div class="section">
              <h2>Order Items</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item: any) => `
                    <tr>
                      <td>
                        ${item.name || item.description}
                        ${item.sku ? `<br><small style="color: #6b7280;">SKU: ${item.sku}</small>` : ''}
                      </td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">$${(item.unitPrice || item.price || 0).toFixed(2)}</td>
                      <td style="text-align: right;">$${((item.quantity || 0) * (item.unitPrice || item.price || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                    <td style="text-align: right;"><strong>$${order.subtotal.toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colspan="3" style="text-align: right;">GST (10%):</td>
                    <td style="text-align: right;">$${order.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">TOTAL:</td>
                    <td style="text-align: right; color: #2563eb;">$${order.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            ${order.notes ? `
              <div class="section">
                <h2>Additional Notes</h2>
                <p>${order.notes}</p>
              </div>
            ` : ''}

            <div class="section">
              <h2>Next Steps</h2>
              <ol>
                <li>Please confirm receipt of this order</li>
                <li>Provide expected delivery date and tracking number</li>
                <li>Contact us if you have any questions</li>
              </ol>
            </div>
          </div>

          <div class="footer">
            <p>Sun Direct Power Pty Ltd</p>
            <p>Email: orders@sundirectpower.com.au | Phone: (08) 1234 5678</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `${apiSettings.smtpFromName || 'Sun Direct Power'} <${apiSettings.smtpFrom || apiSettings.smtpUser}>`,
      to: supplierEmail,
      subject: `Purchase Order ${order.poNumber} - Sun Direct Power`,
      html: emailHTML,
    });

    // CRITICAL: Save delivery details to database
    await prisma.materialOrder.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentTo: supplierEmail,
        deliveryAddress: deliveryDetails.deliveryAddress || order.job.lead.address,
        deliveryContactName: deliveryDetails.deliveryContactName || order.job.lead.name,
        deliveryContactPhone: deliveryDetails.deliveryContactPhone || order.job.lead.phone,
        deliveryTimeSlot: deliveryDetails.deliveryTimeSlot || 'AM',
        deliveryInstructions: deliveryDetails.deliveryInstructions || null,
        expectedDelivery: deliveryDetails.expectedDelivery ? new Date(deliveryDetails.expectedDelivery) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully and delivery details saved',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
