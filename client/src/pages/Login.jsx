import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '30%', right: '25%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }}></div>
      <div style={{
        position: 'absolute', bottom: '25%', left: '25%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }}></div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(26, 26, 46, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 25px 60px rgba(88, 28, 135, 0.4)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <img src="/magic-maths-logo.png" alt="logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Welcome Back</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>Log in to resume your magical calculations</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(236,72,153,0.1)',
            border: '1px solid rgba(236,72,153,0.4)',
            color: '#f9a8d4',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="wizard@example.com"
            style={{
              width: '100%',
              background: 'rgba(15,15,26,0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '14px 16px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: 'rgba(15,15,26,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '14px 48px 14px 16px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '14px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: '#6b7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Button */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 8px 25px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
            marginBottom: '24px',
          }}
        >
          {loading ? 'Signing in...' : '⚡ Sign In'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
          <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
          New to the arena?{' '}
          <Link to="/signup" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>
            Create an Account →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;