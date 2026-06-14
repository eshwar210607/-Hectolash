import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/user/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const gameModes = [
    {
      title: 'VS Computer',
      description: 'Challenge our AI in solo math duels',
      emoji: '🤖',
      gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      shadow: 'rgba(124,58,237,0.4)',
      path: '/computer',
    },
    {
      title: 'Local Multiplayer',
      description: 'Battle a friend on the same device',
      emoji: '👥',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      shadow: 'rgba(236,72,153,0.4)',
      path: '/multiplayer',
    },
    {
      title: 'Online Duel',
      description: 'Challenge players around the world',
      emoji: '🌍',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      shadow: 'rgba(6,182,212,0.4)',
      path: '/online-duel',
    },
  ];

  const rankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      padding: '48px 32px',
      maxWidth: '1100px',
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* Background glows */}
      <div style={{
        position: 'fixed', top: '20%', right: '10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }}></div>
      <div style={{
        position: 'fixed', bottom: '20%', left: '5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }}></div>

      {/* Welcome Header */}
      <div style={{ marginBottom: '48px', position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'white',
          margin: '0 0 8px',
        }}>
          Welcome back,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {user?.name} ⚡
          </span>
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
          Ready to cast some mathematical spells? Choose your battle mode.
        </p>
      </div>

      {/* Game Mode Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '56px',
        position: 'relative',
        zIndex: 1,
      }}>
        {gameModes.map((mode) => (
          <div
            key={mode.title}
            onClick={() => navigate(mode.path)}
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
              e.currentTarget.style.boxShadow = `0 20px 40px ${mode.shadow}`;
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
            }}
          >
            {/* Gradient top bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '3px',
              background: mode.gradient,
            }}></div>

            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{mode.emoji}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
              {mode.title}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>
              {mode.description}
            </p>
            <div style={{
              display: 'inline-block',
              background: mode.gradient,
              borderRadius: '999px',
              padding: '8px 20px',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: `0 4px 15px ${mode.shadow}`,
            }}>
              Play Now →
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'white',
          margin: '0 0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          🏆 Hall of Fame
        </h2>

        <div style={{
          background: 'rgba(26,26,46,0.9)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px 120px',
            padding: '16px 24px',
            background: 'rgba(124,58,237,0.1)',
            borderBottom: '1px solid rgba(139,92,246,0.15)',
          }}>
            {['Rank', 'Player', 'Score', 'Games'].map(h => (
              <span key={h} style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loadingLeaderboard ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              No players yet. Be the first to play! 🎮
            </div>
          ) : (
            leaderboard.map((player, index) => (
              <div
                key={player._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 120px',
                  padding: '16px 24px',
                  borderBottom: index < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: player.name === user?.name ? 'rgba(124,58,237,0.08)' : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = player.name === user?.name ? 'rgba(124,58,237,0.08)' : 'transparent'}
              >
                <span style={{ fontSize: index < 3 ? '1.3rem' : '0.95rem', color: index < 3 ? 'white' : '#6b7280', fontWeight: 700 }}>
                  {rankEmoji(index)}
                </span>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {player.name}
                  {player.name === user?.name && (
                    <span style={{
                      background: 'rgba(124,58,237,0.3)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      color: '#a78bfa',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 600,
                    }}>You</span>
                  )}
                </span>
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.95rem' }}>
                  {player.score} XP
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {player.gamesPlayed} games
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;