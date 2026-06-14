import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      width: '100%',
      background: 'rgba(15, 15, 26, 0.95)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
      padding: '14px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxSizing: 'border-box',
    }}>
      {/* Logo and Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <img src="/magic-maths-logo.png" alt="logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
        <span style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.1em',
        }}>
          MATHS WIZARD
        </span>
      </Link>

      {/* User Actions */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Welcome,</span>
            <span style={{
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              padding: '4px 14px',
              borderRadius: '999px',
            }}>
              {user.name}
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
              border: 'none',
              borderRadius: '999px',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '8px 20px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
              transition: 'all 0.2s',
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;