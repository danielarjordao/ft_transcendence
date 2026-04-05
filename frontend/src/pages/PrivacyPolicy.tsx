import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      color: '#CCCCCC',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, background: '#7B68EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>fz</span>
          </div>
          <span style={{ color: '#EEEEEE', fontSize: 18, fontWeight: 800 }}>fazelo</span>
        </div>

        <h1 style={{ color: '#EEEEEE', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 40 }}>Last updated: March 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: 'We collect information you provide directly, including your name, email address, username, and profile picture when you register. We also collect usage data such as tasks created, workspace activity, and login timestamps to improve the service.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your information is used to provide and improve the Fazelo platform, authenticate your identity, display your profile to workspace members, and send notifications relevant to your activity. We do not sell your personal data to third parties.',
          },
          {
            title: '3. Data Storage and Security',
            body: 'Your data is stored in a secured PostgreSQL database. Passwords are hashed using bcrypt and never stored in plain text. JWT tokens are used for session authentication and expire after a defined period. All communication between your browser and our servers is encrypted via HTTPS.',
          },
          {
            title: '4. Cookies and Local Storage',
            body: 'Fazelo uses browser localStorage to persist your authentication token across sessions. No third-party tracking cookies are used. You can clear this data at any time through your browser settings.',
          },
          {
            title: '5. File Uploads',
            body: 'Files and images you upload (including profile avatars and task attachments) are stored securely. You retain ownership of your uploaded content. We reserve the right to remove content that violates these terms.',
          },
          {
            title: '6. Data Deletion',
            body: 'You may request deletion of your account and associated data at any time by contacting a platform administrator. Upon deletion, your personal information, tasks, and uploaded files will be permanently removed within 30 days.',
          },
          {
            title: '7. Third-Party Authentication',
            body: 'Fazelo supports OAuth authentication via 42 School. When you choose this option, we receive your name and email from the provider. We do not receive or store your OAuth provider password.',
          },
          {
            title: '8. Changes to This Policy',
            body: 'We may update this Privacy Policy as the platform evolves. Continued use of Fazelo after changes are posted constitutes acceptance of the updated policy.',
          },
          {
            title: '9. Contact',
            body: 'This platform was built as a 42 School final project. For any privacy-related concerns, contact the development team through the project repository.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#EEEEEE', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#AAAAAA' }}>{body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 24, marginTop: 16, display: 'flex', gap: 24 }}>
          <Link to="/terms-of-service" style={{ color: '#7B68EE', fontSize: 13, textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/dashboard" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Back to App</Link>
        </div>

      </div>
    </div>
  );
}