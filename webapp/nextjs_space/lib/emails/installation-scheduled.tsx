
/**
 * Installation Scheduled Email
 * Sent to customer when their installation date is confirmed
 */

interface InstallationScheduledEmailProps {
  customerName: string;
  jobNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  systemSize: number;
  teamName?: string;
  estimatedDuration: number;
  rescheduleLink?: string;
}

export default function InstallationScheduledEmail({
  customerName,
  jobNumber,
  scheduledDate,
  scheduledTime,
  address,
  systemSize,
  teamName,
  estimatedDuration,
  rescheduleLink,
}: InstallationScheduledEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#f59e0b', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Installation Scheduled!</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {customerName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Great news! Your solar installation has been scheduled.
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1f2937' }}>Installation Details</h2>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Job Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{jobNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Date:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{scheduledDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Time:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{scheduledTime}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Duration:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Approximately {estimatedDuration} hours</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Location:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{address}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>System Size:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{systemSize} kW</td>
            </tr>
            {teamName && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Installation Team:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{teamName}</td>
              </tr>
            )}
          </table>
        </div>
        
        <h3 style={{ color: '#1f2937' }}>What to Expect</h3>
        <ul style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li>Our installation team will arrive at the scheduled time</li>
          <li>Please ensure someone 18+ is home during the installation</li>
          <li>The installation typically takes {estimatedDuration} hours</li>
          <li>We'll conduct a final inspection and system walkthrough</li>
        </ul>
        
        <h3 style={{ color: '#1f2937' }}>Need to Reschedule?</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
          If you need to change your installation date, please click the button below:
        </p>
        
        {rescheduleLink && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a
              href={rescheduleLink}
              style={{
                display: 'inline-block',
                padding: '12px 30px',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              Request Reschedule
            </a>
          </div>
        )}
        
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
