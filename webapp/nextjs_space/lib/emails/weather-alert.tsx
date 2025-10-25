
/**
 * Weather Alert Email
 * Sent to admin when high rain probability detected for scheduled jobs
 */

interface WeatherAlertEmailProps {
  jobNumber: string;
  customerName: string;
  scheduledDate: string;
  address: string;
  rainProbability: number;
  condition: string;
  temperature: number;
  windSpeed: number;
  jobDetailsLink: string;
}

export default function WeatherAlertEmail({
  jobNumber,
  customerName,
  scheduledDate,
  address,
  rainProbability,
  condition,
  temperature,
  windSpeed,
  jobDetailsLink,
}: WeatherAlertEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#ef4444', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>⚠️ Weather Alert</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <div style={{
          backgroundColor: '#fee2e2',
          border: '2px solid #ef4444',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#991b1b' }}>High Rain Probability Detected</h2>
          <p style={{ margin: 0, fontSize: '16px', color: '#7f1d1d' }}>
            A scheduled installation may be affected by weather conditions.
            Please review and consider rescheduling.
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>Job Information</h3>
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
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Scheduled Date:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{scheduledDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280' }}>Location:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{address}</td>
            </tr>
          </table>
        </div>
        
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#1e40af' }}>Weather Forecast</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tr>
              <td style={{ padding: '8px 0', color: '#1e3a8a' }}>Rain Probability:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#ef4444' }}>
                {rainProbability}%
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#1e3a8a' }}>Condition:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{condition}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#1e3a8a' }}>Temperature:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{temperature.toFixed(1)}°C</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#1e3a8a' }}>Wind Speed:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{windSpeed.toFixed(1)} km/h</td>
            </tr>
          </table>
        </div>
        
        <h3 style={{ color: '#1f2937' }}>Recommended Actions:</h3>
        <ul style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li>Review the forecast closer to the installation date</li>
          <li>Contact the customer to discuss potential rescheduling</li>
          <li>Have a backup date ready if conditions worsen</li>
          <li>Notify the installation team about weather risks</li>
        </ul>
        
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={jobDetailsLink}
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
            View Job Details
          </a>
        </div>
        
        <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#6b7280', textAlign: 'center' }}>
          This is an automated weather alert. Forecasts are checked daily for upcoming installations.
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
        <p>© 2025 Sun Direct Power. All rights reserved.</p>
      </div>
    </div>
  );
}
