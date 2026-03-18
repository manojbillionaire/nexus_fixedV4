import { useState, useEffect } from 'react';
import api from './api.js';
import AuthPortal from './portals/AuthPortal.jsx';
import AdvocatePortal from './portals/AdvocatePortal.jsx';
import AffiliatePortal from './portals/AffiliatePortal.jsx';
import PWAManager from './PWAManager.jsx';
import SubscriptionGuard from './components/SubscriptionGuard.jsx';

// ── Role resolution — Agency HQ deliberately excluded from this app ───────────
function resolveScreen(user) {
  if (!user) return 'auth';
  switch (user.role) {
    case 'affiliate': return 'affiliate';
    case 'advocate':  return 'advocate';
    case 'agency':    return 'agency-blocked'; // agency must use admin portal
    default:          return 'advocate';
  }
}

function AgencyBlocked({ onLogout }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 'calc(var(--vh,1vh)*100)', background: '#020617',
      fontFamily: "'Inter',system-ui,sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#e2e8f0', fontWeight: 900, fontSize: 22, margin: '0 0 12px' }}>
          Agency HQ — Wrong Portal
        </h2>
        <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
          Agency HQ accounts cannot access this portal.
        </p>
        <p style={{ color: '#334155', fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
          Please use the dedicated Agency HQ admin portal URL provided by your system administrator.
        </p>
        <button
          onClick={onLogout}
          style={{
            padding: '12px 28px', background: '#6366f1',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 13, fontWeight: 900, cursor: 'pointer',
          }}
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nj_token');
    const userData = localStorage.getItem('nj_user');
    if (token && userData) {
      try { setCurrentUser(JSON.parse(userData)); } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('nj_token', token);
    localStorage.setItem('nj_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('nj_token');
    localStorage.removeItem('nj_user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(var(--vh,1vh)*100)', background:'#020617' }}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'#f59e0b', borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 8px 32px rgba(245,158,11,.35)' }}>
            <span style={{ fontSize:28, fontWeight:900, color:'#000', fontStyle:'italic' }}>N</span>
          </div>
          <div style={{ fontSize:12, color:'#475569', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase' }}>
            Loading Nexus Justice…
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <><PWAManager /><AuthPortal onLogin={handleLogin} /></>;

  const screen = resolveScreen(currentUser);

  // Agency accounts blocked — must use admin portal
  if (screen === 'agency-blocked') return <AgencyBlocked onLogout={handleLogout} />;

  if (screen === 'affiliate') return (
    <><PWAManager /><AffiliatePortal user={currentUser} onLogout={handleLogout} /></>
  );

  if (screen === 'advocate') return (
    <>
      <PWAManager />
      <SubscriptionGuard user={currentUser}>
        <AdvocatePortal user={currentUser} onLogout={handleLogout} />
      </SubscriptionGuard>
    </>
  );

  return <AgencyBlocked onLogout={handleLogout} />;
}
