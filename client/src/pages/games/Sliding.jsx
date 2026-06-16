import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    if (type === 'move') {
      osc.frequency.value = 440; osc.type = 'sine';
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(); const gn = ctx.createGain();
        o.connect(gn); gn.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        gn.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gn.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    }
  } catch (e) {}
};

const isSolvable = (tiles, size) => {
  const flat = tiles.filter(x => x !== 0);
  let inv = 0;
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;
  if (size % 2 === 1) return inv % 2 === 0;
  const blankRow = Math.floor(tiles.indexOf(0) / size);
  return (inv + blankRow) % 2 === 1;
};

const generateBoard = (size) => {
  let tiles;
  do {
    tiles = [...Array(size * size).keys()].sort(() => Math.random() - 0.5);
  } while (!isSolvable(tiles, size) || tiles.every((t, i) => t === i));
  return tiles;
};

const isSolved = (tiles) => tiles.every((t, i) => t === (i + 1) % tiles.length);

const Confetti = () => {
  const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${0.8 + Math.random() * 0.8}s`,
    size: `${6 + Math.random() * 8}px`,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-20px', left: p.left,
          width: p.size, height: p.size, background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
};

export default function Sliding() {
  const navigate = useNavigate();
  const [size, setSize] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [won, setWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (timerActive && !won) {
      intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [timerActive, won]);

  const startGame = (s) => {
    clearInterval(intervalRef.current);
    setSize(s);
    setTiles(generateBoard(s));
    setMoves(0);
    setTime(0);
    setTimerActive(false);
    setWon(false);
    setShowConfetti(false);
  };

  const handleTileClick = useCallback((idx) => {
    if (won) return;
    setTiles(prev => {
      const blankIdx = prev.indexOf(0);
      const s = size;
      const row = Math.floor(idx / s);
      const col = idx % s;
      const blankRow = Math.floor(blankIdx / s);
      const blankCol = blankIdx % s;
      const isAdjacent =
        (row === blankRow && Math.abs(col - blankCol) === 1) ||
        (col === blankCol && Math.abs(row - blankRow) === 1);
      if (!isAdjacent) return prev;
      playSound('move');
      const newTiles = [...prev];
      [newTiles[idx], newTiles[blankIdx]] = [newTiles[blankIdx], newTiles[idx]];
      setMoves(m => m + 1);
      setTimerActive(true);
      if (isSolved(newTiles)) {
        setWon(true);
        playSound('win');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return newTiles;
    });
  }, [won, size]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const tileSize = size === 3 ? 90 : size === 4 ? 72 : 58;

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes winGlow {
          0% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 60px rgba(16,185,129,0.6); }
          100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
        }
      `}</style>

      {showConfetti && <Confetti />}

      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => size ? setSize(null) : navigate('/computer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#9ca3af', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem' }}>
          ← {size ? 'Change Size' : 'Back'}
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔢 Sliding Puzzle</h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Size selector */}
      {!size && (
        <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔢</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px' }}>Choose Difficulty</h2>
          <p style={{ color: '#6b7280', margin: '0 0 36px', fontSize: '0.9rem' }}>Slide tiles to arrange numbers in order</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {[
              { size: 3, label: '3×3', sub: 'Easy', color: '#10b981', shadow: 'rgba(16,185,129,0.4)' },
              { size: 4, label: '4×4', sub: 'Medium', color: '#06b6d4', shadow: 'rgba(6,182,212,0.4)' },
              { size: 5, label: '5×5', sub: 'Hard', color: '#ec4899', shadow: 'rgba(236,72,153,0.4)' },
            ].map(opt => (
              <button key={opt.size} onClick={() => startGame(opt.size)} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${opt.color}40`,
                borderRadius: '16px', padding: '24px 16px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${opt.shadow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 900, color: opt.color, marginBottom: '6px' }}>{opt.label}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{opt.sub}</div>
                <div style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>{opt.size * opt.size - 1} tiles</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game */}
      {size && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Moves', value: moves, color: '#a78bfa' },
              { label: 'Time', value: formatTime(time), color: '#06b6d4' },
              { label: 'Size', value: `${size}×${size}`, color: '#ec4899' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ color: stat.color, fontWeight: 800, fontSize: '1.2rem' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Board */}
          <div style={{ background: 'rgba(26,26,46,0.95)', border: won ? '2px solid rgba(16,185,129,0.5)' : '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '20px', display: 'flex', justifyContent: 'center', marginBottom: '20px', animation: won ? 'winGlow 2s ease infinite' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${tileSize}px)`, gap: '8px' }}>
              {tiles.map((tile, idx) => (
                <div key={idx} onClick={() => handleTileClick(idx)} style={{
                  width: `${tileSize}px`, height: `${tileSize}px`,
                  background: tile === 0 ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, rgba(124,58,237,${0.2 + (tile / (size * size)) * 0.3}), rgba(236,72,153,${0.2 + (tile / (size * size)) * 0.3}))`,
                  border: tile === 0 ? '1px dashed rgba(255,255,255,0.05)' : '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: size === 3 ? '1.8rem' : size === 4 ? '1.4rem' : '1.1rem',
                  fontWeight: 900, color: tile === 0 ? 'transparent' : 'white',
                  cursor: tile === 0 ? 'default' : 'pointer',
                  transition: 'all 0.12s ease', userSelect: 'none',
                }}
                  onMouseEnter={e => { if (tile !== 0) e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {tile !== 0 && tile}
                </div>
              ))}
            </div>
          </div>

          {!won && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => startGame(size)} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', borderRadius: '12px', padding: '12px 24px', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }}>🔄 Shuffle</button>
              <button onClick={() => setSize(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 24px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>Change Size</button>
            </div>
          )}

          {won && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '20px', padding: '32px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏆</div>
              <h3 style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 8px' }}>Puzzle Solved!</h3>
              <p style={{ color: '#9ca3af', margin: '0 0 20px', fontSize: '0.9rem' }}>{moves} moves · {formatTime(time)}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => startGame(size)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', padding: '12px 28px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Play Again 🚀</button>
                <button onClick={() => setSize(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>Change Size</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}