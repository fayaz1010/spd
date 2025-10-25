
/**
 * Installation Completed Email
 * Sent to customer after installation is complete with feedback request
 */

interface InstallationCompletedEmailProps {
  customerName: string;
  jobNumber: string;
  completedDate: string;
  systemSize: number;
  feedbackLink?: string;
}

export default function InstallationCompletedEmail({
  customerName,
  jobNumber,
  completedDate,
  systemSize,
  feedbackLink,
}: InstallationCompletedEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#10b981', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>🎉 Installation Complete!</h1>
      </div>
      
      <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Hi {customerName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Congratulations! Your solar system installation is now complete.
          Welcome to clean, renewable energy!
        </p>
        
        <div style={{
          backgroundColor: '#d1fae5',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#065f46' }}>Your {systemSize} kW Solar System is Live!</h2>
          <p style={{ margin: '10px 0 0 0', color: '#047857', fontSize: '14px' }}>
            Job #{jobNumber} • Completed on {completedDate}
          </p>
        </div>
        
        <h3 style={{ color: '#1f2937' }}>What's Next?</h3>
        <ol style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li><strong>Start Generating Power:</strong> Your system is already producing clean energy!</li>
          <li><strong>Monitor Your System:</strong> Check your inverter display or mobile app to track production</li>
          <li><strong>Grid Connection:</strong> Your system will be connected to the grid within 5-10 business days</li>
          <li><strong>Rebate Processing:</strong> We'll handle all rebate paperwork for you</li>
        </ol>
        
        <h3 style={{ color: '#1f2937' }}>System Care Tips</h3>
        <ul style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <li>Monitor your system daily for the first week</li>
          <li>Clean panels annually or after major storms</li>
          <li>Report any issues immediately</li>
          <li>Schedule annual maintenance checks</li>
        </ul>
        
        {feedbackLink && (
          <>
            <h3 style={{ color: '#1f2937' }}>How Did We Do?</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
              Your feedback helps us improve our service. Please take a moment to share your experience:
            </p>
            
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <a
                href={feedbackLink}
                style={{
                  display: 'inline-block',
                  padding: '12px 30px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold'
                }}
              >
                Leave Feedback
              </a>
            </div>
          </>
        )}
        
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '15px',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
            <strong>Need Support?</strong> We're here to help! Contact us anytime 
            if you have questions about your new solar system.
          </p>
        </div>
        
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b7280', marginTop: '30px' }}>
          Thank you for choosing solar energy!
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
