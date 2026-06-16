import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
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

export default function SlidingMulti() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('setup');
  const [size, setSize] = useState(3);
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [p1Tiles, setP1Tiles] = useState([]);
  const [p2Tiles, setP2Tiles] = useState([]);
  const [p1Moves, setP1Moves] = useState(0);
  const [p2Moves, setP2Moves] = useState(0);
  const [p1Won, setP1Won] = useState(false);
  const [p2Won, setP2Won] = useState(false);
  const [winner, setWinner] = useState(null);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  useEffect(() => {
    if (timerActive && !winner) {
      intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [timerActive, winner]);

  const startGame = () => {
    clearInterval(intervalRef.current);
    setP1Tiles(generateBoard(size));
    setP2Tiles(generateBoard(size));
    setP1Moves(0); setP2Moves(0);
    setP1Won(false); setP2Won(false);
    setWinner(null); setTime(0);
    setTimerActive(false);
    setShowConfetti(false);
    setGameState('playing');
  };

  const handleTileClick = useCallback((player, idx) => {
    if (winner) return;
    const tiles = player === 1 ? p1Tiles : p2Tiles;
    const setTiles = player === 1 ? setP1Tiles : setP2Tiles;
    const setMoves = player === 1 ? setP1Moves : setP2Moves;
    const playerWon = player === 1 ? p1Won : p2Won;
    if (playerWon) return;

    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(idx / size);
    const col = idx % size;
    const blankRow = Math.floor(blankIdx / size);
    const blankCol = blankIdx % size;
    const isAdjacent =
      (row === blankRow && Math.abs(col - blankCol) === 1) ||
      (col === blankCol && Math.abs(row - blankRow) === 1);
    if (!isAdjacent) return;

    playSound('move');
    const newTiles = [...tiles];
    [newTiles[idx], newTiles[blankIdx]] = [newTiles[blankIdx], newTiles[idx]];
    setTiles(newTiles);
    setMoves(m => m + 1);
    if (!timerActive) setTimerActive(true);

    if (isSolved(newTiles)) {
      if (player === 1) setP1Won(true);
      else setP2Won(true);
      const winnerName = player === 1 ? p1Name : p2Name;
      setWinner(winnerName);
      setTimerActive(false);
      playSound('win');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [p1Tiles, p2Tiles, size, winner, p1Won, p2Won, timerActive, p1Name, p2Name]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const tileSize = size === 3 ? 80 : size === 4 ? 64 : 52;

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
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
        @keyframes solvedPulse {
          0% { border-color: rgba(16,185,129,0.4); }
          50% { border-color: rgba(16,185,129,0.9); }
          100% { border-color: rgba(16,185,129,0.4); }
        }
      `}</style>

      {showConfetti && <Confetti />}

      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#9ca3af', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔢 Sliding Race</h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Setup */}
      {gameState === 'setup' && (
        <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🏁</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.8rem', margin: '0 0 8px' }}>Sliding Race</h2>
          <p style={{ color: '#6b7280', margin: '0 0 32px', fontSize: '0.9rem' }}>Each player gets a different board — first to solve wins!</p>

          {/* Player names */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            {[{ num: 1, val: p1Name, set: setP1Name, color: '#a78bfa' },
              { num: 2, val: p2Name, set: setP2Name, color: '#ec4899' }].map(p => (
              <div key={p.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ color: p.color, fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>Player {p.num}</div>
                <input value={p.val} onChange={e => p.set(e.target.value)} style={{ width: '100%', background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            ))}
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '12px' }}>Choose board size:</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {[{ s: 3, label: '3×3', sub: 'Easy' }, { s: 4, label: '4×4', sub: 'Medium' }, { s: 5, label: '5×5', sub: 'Hard' }].map(opt => (
                <button key={opt.s} onClick={() => setSize(opt.s)} style={{
                  background: size === opt.s ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${size === opt.s ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '12px 20px', cursor: 'pointer', color: 'white',
                  fontWeight: 700, transition: 'all 0.2s',
                }}>
                  <div>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: size === opt.s ? 'rgba(255,255,255,0.8)' : '#4b5563' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', borderRadius: '14px', padding: '16px 48px', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(6,182,212,0.4)' }}>
            Start Race 🏁
          </button>
        </div>
      )}

      {/* Playing */}
      {gameState === 'playing' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
            <div style={{ background: p1Won ? 'rgba(16,185,129,0.15)' : 'rgba(26,26,46,0.95)', border: `1px solid ${p1Won ? 'rgba(16,185,129,0.4)' : 'rgba(167,139,250,0.2)'}`, borderRadius: '12px', padding: '12px 16px', transition: 'all 0.3s' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.85rem' }}>{p1Name}</div>
              <div style={{ color: 'white', fontSize: '0.8rem' }}>Moves: {p1Moves}</div>
              {p1Won && <div style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 700 }}>✅ Solved!</div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#06b6d4', fontWeight: 900, fontSize: '1.1rem' }}>{formatTime(time)}</div>
              <div style={{ color: '#4b5563', fontSize: '0.75rem' }}>elapsed</div>
            </div>
            <div style={{ background: p2Won ? 'rgba(16,185,129,0.15)' : 'rgba(26,26,46,0.95)', border: `1px solid ${p2Won ? 'rgba(16,185,129,0.4)' : 'rgba(236,72,153,0.2)'}`, borderRadius: '12px', padding: '12px 16px', textAlign: 'right', transition: 'all 0.3s' }}>
              <div style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.85rem' }}>{p2Name}</div>
              <div style={{ color: 'white', fontSize: '0.8rem' }}>Moves: {p2Moves}</div>
              {p2Won && <div style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 700 }}>✅ Solved!</div>}
            </div>
          </div>

          {/* Boards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { player: 1, name: p1Name, tiles: p1Tiles, moves: p1Moves, won: p1Won, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' },
              { player: 2, name: p2Name, tiles: p2Tiles, moves: p2Moves, won: p2Won, color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)' },
            ].map(p => (
              <div key={p.player}>
                <div style={{ color: p.color, fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px', textAlign: 'center' }}>
                  {p.name}'s Board {p.won ? '🏆' : ''}
                </div>
                <div style={{
                  background: 'rgba(26,26,46,0.95)',
                  border: p.won ? '2px solid rgba(16,185,129,0.6)' : `1px solid ${p.borderColor}`,
                  borderRadius: '16px', padding: '16px',
                  display: 'flex', justifyContent: 'center',
                  animation: p.won ? 'winGlow 2s ease infinite' : 'none',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${tileSize}px)`, gap: '6px' }}>
                    {p.tiles.map((tile, idx) => (
                      <div key={idx} onClick={() => handleTileClick(p.player, idx)} style={{
                        width: `${tileSize}px`, height: `${tileSize}px`,
                        background: tile === 0 ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, ${p.player === 1 ? 'rgba(124,58,237,' : 'rgba(236,72,153,'}${0.2 + (tile / (size * size)) * 0.3}), ${p.player === 1 ? 'rgba(167,139,250,' : 'rgba(244,63,94,'}${0.2 + (tile / (size * size)) * 0.3}))`,
                        border: tile === 0 ? '1px dashed rgba(255,255,255,0.05)' : `1px solid ${p.player === 1 ? 'rgba(167,139,250,0.3)' : 'rgba(236,72,153,0.3)'}`,
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: size === 3 ? '1.4rem' : '1.1rem', fontWeight: 900,
                        color: tile === 0 ? 'transparent' : 'white',
                        cursor: tile === 0 || p.won ? 'default' : 'pointer',
                        transition: 'all 0.12s', userSelect: 'none',
                        opacity: p.won && !p.won ? 0.6 : 1,
                      }}
                        onMouseEnter={e => { if (tile !== 0 && !p.won) e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {tile !== 0 && tile}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reset button */}
          {!winner && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={startGame} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 24px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>🔄 New Boards</button>
            </div>
          )}

          {/* Winner banner */}
          {winner && (
            <div style={{ marginTop: '24px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '20px', padding: '32px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏆</div>
              <h3 style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px' }}>{winner} Wins!</h3>
              <p style={{ color: '#9ca3af', margin: '0 0 20px', fontSize: '0.9rem' }}>
                {p1Name}: {p1Moves} moves · {p2Name}: {p2Moves} moves · Time: {formatTime(time)}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', padding: '12px 28px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Play Again 🚀</button>
                <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>← Menu</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}