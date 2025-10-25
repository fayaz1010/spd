import { wrapEmailTemplate } from './email-service';

export function quoteConfirmationEmail(data: {
  customerName: string;
  quoteReference: string;
  systemSize: number;
  totalCost: number;
  annualSavings: number;
  quoteUrl: string;
}): string {
  const content = `
    <h2>Thank You for Your Solar Quote Request!</h2>
    <p>Hi ${data.customerName},</p>
    <p>Thank you for choosing Sun Direct Power for your solar energy needs. We're excited to help you save money and reduce your carbon footprint!</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Your Quote Summary</h3>
      <p><strong>Quote Reference:</strong> ${data.quoteReference}</p>
      <p><strong>System Size:</strong> ${data.systemSize}kW Solar System</p>
      <p><strong>Investment:</strong> $${data.totalCost.toLocaleString()}</p>
      <p><strong>Annual Savings:</strong> $${data.annualSavings.toLocaleString()}/year</p>
    </div>

    <p>Your personalized solar quote is ready! Click the button below to view your complete proposal:</p>
    
    <a href="${data.quoteUrl}" class="button">View Your Quote</a>

    <h3>What Happens Next?</h3>
    <ol>
      <li><strong>Expert Consultation (24 hours)</strong> - Our solar specialist will call to discuss your system</li>
      <li><strong>Site Inspection</strong> - We'll visit your property to finalize the design</li>
      <li><strong>Professional Installation</strong> - Most systems installed in just 1 day</li>
      <li><strong>Start Saving!</strong> - Begin reducing your electricity bills immediately</li>
    </ol>

    <p>Have questions? We're here to help!</p>
    <p>Call us at <strong>1300 XXX XXX</strong> or reply to this email.</p>

    <p>Best regards,<br>
    The Sun Direct Power Team</p>
  `;

  return wrapEmailTemplate(content);
}

export function installationScheduledEmail(data: {
  customerName: string;
  installationDate: string;
  installationTime: string;
  systemSize: number;
  address: string;
}): string {
  const content = `
    <h2>Your Solar Installation is Scheduled!</h2>
    <p>Hi ${data.customerName},</p>
    <p>Great news! Your solar installation has been scheduled.</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Installation Details</h3>
      <p><strong>Date:</strong> ${data.installationDate}</p>
      <p><strong>Time:</strong> ${data.installationTime}</p>
      <p><strong>Location:</strong> ${data.address}</p>
      <p><strong>System:</strong> ${data.systemSize}kW Solar System</p>
    </div>

    <h3>Before Installation Day:</h3>
    <ul>
      <li>Ensure clear access to your roof and electrical panel</li>
      <li>Remove any vehicles from the driveway</li>
      <li>Secure any pets</li>
      <li>Someone 18+ must be home during installation</li>
    </ul>

    <h3>What to Expect:</h3>
    <ul>
      <li>Our CEC-accredited team will arrive on time</li>
      <li>Installation typically takes 4-8 hours</li>
      <li>We'll clean up completely after installation</li>
      <li>You'll receive a full system walkthrough</li>
    </ul>

    <p>We'll send you a reminder 24 hours before your installation.</p>

    <p>Questions? Call us at <strong>1300 XXX XXX</strong></p>

    <p>Best regards,<br>
    The Sun Direct Power Team</p>
  `;

  return wrapEmailTemplate(content);
}

export function installationReminderEmail(data: {
  customerName: string;
  installationDate: string;
  installationTime: string;
}): string {
  const content = `
    <h2>Reminder: Solar Installation Tomorrow!</h2>
    <p>Hi ${data.customerName},</p>
    <p>This is a friendly reminder that your solar installation is scheduled for tomorrow.</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Tomorrow's Installation</h3>
      <p><strong>Date:</strong> ${data.installationDate}</p>
      <p><strong>Time:</strong> ${data.installationTime}</p>
    </div>

    <h3>Quick Checklist:</h3>
    <ul>
      <li>✓ Clear access to roof and electrical panel</li>
      <li>✓ Vehicles moved from driveway</li>
      <li>✓ Pets secured</li>
      <li>✓ Someone 18+ will be home</li>
    </ul>

    <p>Our team is looking forward to installing your solar system!</p>

    <p>Need to reschedule? Call us ASAP at <strong>1300 XXX XXX</strong></p>

    <p>See you tomorrow!<br>
    The Sun Direct Power Team</p>
  `;

  return wrapEmailTemplate(content);
}

export function installationCompleteEmail(data: {
  customerName: string;
  systemSize: number;
  panelCount: number;
  estimatedAnnualProduction: number;
}): string {
  const content = `
    <h2>🎉 Congratulations! Your Solar System is Live!</h2>
    <p>Hi ${data.customerName},</p>
    <p>Your solar installation is complete and your system is now generating clean, renewable energy!</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Your New Solar System</h3>
      <p><strong>System Size:</strong> ${data.systemSize}kW</p>
      <p><strong>Solar Panels:</strong> ${data.panelCount} panels</p>
      <p><strong>Estimated Annual Production:</strong> ${data.estimatedAnnualProduction.toLocaleString()} kWh</p>
    </div>

    <h3>What's Next:</h3>
    <ol>
      <li><strong>Monitor Your System</strong> - Check your inverter display or app daily</li>
      <li><strong>Grid Connection</strong> - We'll handle the paperwork with your energy retailer</li>
      <li><strong>Rebate Processing</strong> - Your rebates will be processed within 2-4 weeks</li>
      <li><strong>Start Saving!</strong> - Watch your electricity bills drop</li>
    </ol>

    <h3>Your Warranty & Support:</h3>
    <ul>
      <li>25-year panel performance warranty</li>
      <li>10-year inverter warranty</li>
      <li>5-year workmanship warranty</li>
      <li>Lifetime support from our team</li>
    </ul>

    <p>We'll follow up in a few weeks to ensure everything is working perfectly.</p>

    <p>Questions? We're always here to help at <strong>1300 XXX XXX</strong></p>

    <p>Welcome to the solar family!<br>
    The Sun Direct Power Team</p>
  `;

  return wrapEmailTemplate(content);
}

export function quoteSignedEmail(data: {
  customerName: string;
  quoteReference: string;
  systemSize: number;
  signedDate: string;
}): string {
  const content = `
    <h2>✓ Quote Accepted - Thank You!</h2>
    <p>Hi ${data.customerName},</p>
    <p>Thank you for accepting your solar quote! We're thrilled to be your solar energy partner.</p>
    
    <div class="highlight">
      <h3 style="margin-top: 0;">Quote Details</h3>
      <p><strong>Quote Reference:</strong> ${data.quoteReference}</p>
      <p><strong>System Size:</strong> ${data.systemSize}kW</p>
      <p><strong>Accepted On:</strong> ${data.signedDate}</p>
    </div>

    <h3>Next Steps:</h3>
    <ol>
      <li><strong>Site Inspection</strong> - We'll schedule a visit to your property</li>
      <li><strong>Final Design</strong> - We'll confirm the optimal panel placement</li>
      <li><strong>Permits & Approvals</strong> - We'll handle all the paperwork</li>
      <li><strong>Installation</strong> - We'll schedule your installation date</li>
    </ol>

    <p>Our team will contact you within 24 hours to schedule your site inspection.</p>

    <p>Questions? Call us at <strong>1300 XXX XXX</strong></p>

    <p>Best regards,<br>
    The Sun Direct Power Team</p>
  `;

  return wrapEmailTemplate(content);
}
