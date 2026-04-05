import { Link } from 'react-router-dom';

export default function TermsOfService() {
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

        <h1 style={{ color: '#EEEEEE', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 40 }}>Last updated: March 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using Fazelo, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users, including registered members and workspace administrators.',
          },
          {
            title: '2. User Accounts',
            body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate registration information and to notify us immediately of any unauthorized use of your account. Each user may only hold one account.',
          },
          {
            title: '3. Acceptable Use',
            body: 'You agree not to use Fazelo to upload, share, or distribute unlawful, harmful, or offensive content. You may not attempt to gain unauthorized access to other accounts, reverse-engineer the platform, or use automated tools to scrape or stress-test the service.',
          },
          {
            title: '4. Workspace and Task Content',
            body: 'You retain ownership of content you create within Fazelo, including tasks, comments, and uploaded files. By using the platform, you grant Fazelo a limited license to store and display your content to authorized workspace members.',
          },
          {
            title: '5. Service Availability',
            body: 'Fazelo is provided as-is. As a student project, we do not guarantee uninterrupted availability or data preservation beyond the project evaluation period. We reserve the right to suspend or terminate accounts that violate these terms.',
          },
          {
            title: '6. Real-Time Features',
            body: 'Fazelo includes real-time collaboration features via WebSockets. These features depend on network connectivity and server availability. We are not liable for data loss resulting from connectivity interruptions during collaborative sessions.',
          },
          {
            title: '7. Intellectual Property',
            body: 'The Fazelo platform, including its design, codebase, and branding, is the work of the development team and was created as part of the 42 School Common Core curriculum. Unauthorized reproduction of the platform is not permitted.',
          },
          {
            title: '8. Termination',
            body: 'We reserve the right to suspend or delete accounts that violate these Terms of Service without prior notice. You may delete your own account at any time, subject to the data deletion policy described in our Privacy Policy.',
          },
          {
            title: '9. Governing Terms',
            body: 'These Terms of Service are governed by the policies of 42 School and general best practices for web application use. As this is an educational project, formal legal jurisdiction is not applicable.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#EEEEEE', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#AAAAAA' }}>{body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 24, marginTop: 16, display: 'flex', gap: 24 }}>
          <Link to="/privacy-policy" style={{ color: '#7B68EE', fontSize: 13, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/dashboard" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Back to App</Link>
        </div>

      </div>
    </div>
  );
}