
/**
 * Installation Reminder Email
 * Sent 48 hours before scheduled installation
 */

interface InstallationReminderEmailProps {
  customerName: string;
  jobNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  teamName?: string;
  teamPhone?: string;
}

export default function InstallationReminderEmail({
  customerName,
  jobNumber,
  scheduledDate,
  scheduledTime,
  address,
  teamName,
  teamPhone,
}: InstallationReminderEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#3b82f6', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Installation Reminder</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {customerName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          This is a friendly reminder that your solar installation is scheduled for:
        </p>
        
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#1e40af', fontSize: '24px' }}>{scheduledDate}</h2>
          <p style={{ margin: '10px 0 0 0', color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold' }}>
            at {scheduledTime}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>Installation Details</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Job Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{jobNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Location:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{address}</td>
            </tr>
            {teamName && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Team:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{teamName}</td>
              </tr>
            )}
            {teamPhone && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Contact:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{teamPhone}</td>
              </tr>
            )}
          </table>
        </div>
        
        <h3 style={{ color: '#1f2937' }}>Before We Arrive:</h3>
        <ul style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li>Ensure someone 18+ will be home during installation</li>
          <li>Clear any obstacles around the installation area</li>
          <li>Ensure our team has access to your roof and electrical panel</li>
          <li>Secure any pets that may be in the installation area</li>
        </ul>
        
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '15px',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
            <strong>Note:</strong> Our team will call you on the morning of the installation 
            to confirm our arrival time.
          </p>
        </div>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b7280', marginTop: '30px' }}>
          Looking forward to installing your solar system!
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
