
/**
 * Payment Received Email
 * Sent to customer after successful payment with scheduling link
 */

interface PaymentReceivedEmailProps {
  customerName: string;
  jobNumber: string;
  amount: number;
  systemSize: number;
  schedulingLink: string;
  schedulingDeadline: string;
}

export default function PaymentReceivedEmail({
  customerName,
  jobNumber,
  amount,
  systemSize,
  schedulingLink,
  schedulingDeadline,
}: PaymentReceivedEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#10b981', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Payment Received!</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {customerName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Thank you for your payment! We're excited to install your solar system.
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1f2937' }}>Payment Details</h2>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Job Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{jobNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Amount Paid:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>System Size:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{systemSize} kW</td>
            </tr>
          </table>
        </div>
        
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#92400e' }}>⏰ Action Required: Schedule Your Installation</h3>
          <p style={{ margin: 0, color: '#78350f' }}>
            Please schedule your installation by <strong>{schedulingDeadline}</strong>.
            If we don't hear from you, we'll automatically assign a convenient time for you.
          </p>
        </div>
        
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={schedulingLink}
            style={{
              display: 'inline-block',
              padding: '15px 40px',
              backgroundColor: '#f59e0b',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Schedule Installation Now
          </a>
        </div>
        
        <h3 style={{ color: '#1f2937' }}>What Happens Next?</h3>
        <ol style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li>Choose your preferred installation date using the link above</li>
          <li>We'll order your materials and equipment</li>
          <li>Our installation team will contact you 24 hours before the installation</li>
          <li>Installation day - your solar system will be up and running!</li>
        </ol>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b7280', marginTop: '30px' }}>
          If you have any questions, please don't hesitate to contact us.
        </p>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          Best regards,<br />
          <strong>Sun Direct Power Team</strong>
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
        <p>© 2025 Sun Direct Power. All rights reserved.</p>
      </div>
    </div>
  );
}
