import { useNavigate } from 'react-router-dom';

const games = [
  {
    title: 'Hectoc Battle',
    description: 'Two players, one device, race to make 100',
    emoji: '🧮',
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    shadow: 'rgba(124,58,237,0.4)',
    path: '/game/hectoc-multi',
  },
  {
    title: 'Calculator Battle',
    description: 'Head-to-head math speed challenge',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    shadow: 'rgba(236,72,153,0.4)',
    path: '/game/calculator-multi',
  },
  {
    title: 'Sliding Race',
    description: 'Who solves the sliding puzzle first?',
    emoji: '🔢',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    shadow: 'rgba(6,182,212,0.4)',
    path: '/game/sliding-multi',
  },
  {
    title: 'Online Duel',
    description: 'Challenge players around the world',
    emoji: '🌍',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    shadow: 'rgba(16,185,129,0.4)',
    path: '/online-duel',
  },
];

const MultiplayerMenu = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      padding: '48px 32px',
      maxWidth: '1100px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', bottom: '20%', left: '5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }}></div>

      {/* Header */}
      <div style={{ marginBottom: '48px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px',
            color: '#9ca3af',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Home
        </button>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'white',
          margin: '0 0 8px',
        }}>
          👥 Local{' '}
          <span style={{
            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Multiplayer
          </span>
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
          Challenge a friend on the same device
        </p>
      </div>

      {/* Game Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        position: 'relative',
        zIndex: 1,
      }}>
        {games.map((game) => (
          <div
            key={game.title}
            onClick={() => navigate(game.path)}
            style={{
              background: 'rgba(26,26,46,0.9)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '20px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 20px 40px ${game.shadow}`;
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '3px', background: game.gradient,
            }}></div>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{game.emoji}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
              {game.title}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>
              {game.description}
            </p>
            <div style={{
              display: 'inline-block',
              background: game.gradient,
              borderRadius: '999px',
              padding: '8px 20px',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: `0 4px 15px ${game.shadow}`,
            }}>
              Play Now →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiplayerMenu;