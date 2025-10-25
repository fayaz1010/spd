
/**
 * Reschedule Approved Email
 * Sent to customer when their reschedule request is approved
 */

interface RescheduleApprovedEmailProps {
  customerName: string;
  jobNumber: string;
  oldDate: string;
  newDate: string;
  newTime: string;
}

export default function RescheduleApprovedEmail({
  customerName,
  jobNumber,
  oldDate,
  newDate,
  newTime,
}: RescheduleApprovedEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#10b981', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Reschedule Approved</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {customerName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Good news! Your reschedule request has been approved.
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>Updated Schedule</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Job Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{jobNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280', textDecoration: 'line-through' }}>
                Previous Date:
              </td>
              <td style={{ padding: '8px 0', textDecoration: 'line-through' }}>{oldDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>New Date:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#10b981' }}>
                {newDate}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Time:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{newTime}</td>
            </tr>
          </table>
        </div>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
          We'll send you a reminder 48 hours before your new installation date.
        </p>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '30px' }}>
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
