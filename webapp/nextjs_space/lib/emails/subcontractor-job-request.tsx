
/**
 * Subcontractor Job Request Email
 * Sent to subcontractor with job details and confirmation link
 */

interface SubcontractorJobRequestEmailProps {
  subcontractorName: string;
  jobNumber: string;
  proposedDate: string;
  proposedTime: string;
  customerName: string;
  address: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity?: number;
  inverterModel: string;
  estimatedDuration: number;
  specialInstructions?: string;
  confirmLink: string;
}

export default function SubcontractorJobRequestEmail({
  subcontractorName,
  jobNumber,
  proposedDate,
  proposedTime,
  customerName,
  address,
  systemSize,
  panelCount,
  batteryCapacity,
  inverterModel,
  estimatedDuration,
  specialInstructions,
  confirmLink,
}: SubcontractorJobRequestEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#6366f1', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>New Installation Job</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {subcontractorName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          We have a new solar installation job that matches your service area.
          Please review the details below and confirm your availability.
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1f2937' }}>Job Details</h2>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Job Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{jobNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Customer:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{customerName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Location:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{address}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Proposed Date:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{proposedDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Proposed Time:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{proposedTime}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Duration:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{estimatedDuration} hours</td>
            </tr>
          </table>
        </div>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>System Specifications</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>System Size:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{systemSize} kW</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Panel Count:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{panelCount} panels</td>
            </tr>
            {batteryCapacity && (
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Battery:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{batteryCapacity} kWh</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Inverter:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{inverterModel}</td>
            </tr>
          </table>
        </div>
        
        {specialInstructions && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h4 style={{ marginTop: 0, color: '#92400e' }}>Special Instructions</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
              {specialInstructions}
            </p>
          </div>
        )}
        
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={confirmLink}
            style={{
              display: 'inline-block',
              padding: '15px 40px',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            Confirm Job
          </a>
          <a
            href={confirmLink}
            style={{
              display: 'inline-block',
              padding: '15px 40px',
              backgroundColor: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Request Changes
          </a>
        </div>
        
        <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#6b7280', textAlign: 'center' }}>
          Please respond within 24 hours to confirm your availability
        </p>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '30px' }}>
          Best regards,<br />
          <strong>Sun Direct Power Operations Team</strong>
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
        <p>© 2025 Sun Direct Power. All rights reserved.</p>
      </div>
    </div>
  );
}
