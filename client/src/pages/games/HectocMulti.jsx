import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSequence, findExpression, checkAnswer } from '../../utils/mathEngine';

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    } else if (type === 'wrong') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
};

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

export default function HectocMulti() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('setup'); // setup, playing, won
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [sequence, setSequence] = useState('');
  const [solution, setSolution] = useState('');
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Msg, setP1Msg] = useState('');
  const [p2Msg, setP2Msg] = useState('');
  const [p1MsgType, setP1MsgType] = useState('');
  const [p2MsgType, setP2MsgType] = useState('');
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [roundsToWin] = useState(3);
  const [shake1, setShake1] = useState(false);
  const [shake2, setShake2] = useState(false);

  const startRound = useCallback(() => {
    const seq = generateSequence();
    const sol = findExpression(seq);
    setSequence(seq);
    setSolution(sol);
    setP1Input('');
    setP2Input('');
    setP1Msg('');
    setP2Msg('');
    setP1MsgType('');
    setP2MsgType('');
    setGameState('playing');
  }, []);

  const handleSubmit = (player) => {
    const input = player === 1 ? p1Input : p2Input;
    const setMsg = player === 1 ? setP1Msg : setP2Msg;
    const setMsgType = player === 1 ? setP1MsgType : setP2MsgType;
    const setShake = player === 1 ? setShake1 : setShake2;

    const userDigits = input.replace(/[+\-*/]/g, '').split('').filter(Boolean);
    const seqDigits = sequence.split('');

    if (userDigits.length !== seqDigits.length) {
      setMsg(`⚠️ Use all 6 digits: ${sequence.split('').join(' → ')}`);
      setMsgType('warning');
      setShake(true); setTimeout(() => setShake(false), 500);
      playSound('wrong');
      return;
    }

    for (let i = 0; i < seqDigits.length; i++) {
      if (userDigits[i] !== seqDigits[i]) {
        setMsg(`❌ Wrong digit at position ${i + 1}`);
        setMsgType('error');
        setShake(true); setTimeout(() => setShake(false), 500);
        playSound('wrong');
        return;
      }
    }

    if (checkAnswer(input, sequence)) {
      playSound('win');
      const newScore = (player === 1 ? p1Score : p2Score) + 1;
      if (player === 1) setP1Score(newScore);
      else setP2Score(newScore);

      if (newScore >= roundsToWin) {
        setWinner(player === 1 ? player1Name : player2Name);
        setGameState('won');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setMsg(`🎉 Correct! +1 point`);
        setMsgType('success');
        setTimeout(() => startRound(), 1500);
      }
    } else {
      playSound('wrong');
      setShake(true); setTimeout(() => setShake(false), 500);
      setMsg('❌ Does not equal 100. Try again!');
      setMsgType('error');
    }
  };

  const msgColors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', color: '#fcd34d' },
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
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

      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#9ca3af', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🧮 Hectoc Battle</h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Setup */}
      {gameState === 'setup' && (
        <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚔️</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.8rem', margin: '0 0 8px' }}>Hectoc Battle</h2>
          <p style={{ color: '#6b7280', margin: '0 0 36px', fontSize: '0.9rem' }}>First to {roundsToWin} correct answers wins!</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {[{ num: 1, val: player1Name, set: setPlayer1Name, color: '#a78bfa', emoji: '🧑' },
              { num: 2, val: player2Name, set: setPlayer2Name, color: '#ec4899', emoji: '🧑' }].map(p => (
              <div key={p.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{p.emoji}</div>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '0.8rem', marginBottom: '8px' }}>Player {p.num} Name</label>
                <input value={p.val} onChange={e => p.set(e.target.value)} style={{ width: '100%', background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            ))}
          </div>

          <button onClick={startRound} style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', borderRadius: '14px', padding: '16px 48px', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}>
            Start Battle ⚔️
          </button>
        </div>
      )}

      {/* Playing */}
      {gameState === 'playing' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
            {[{ name: player1Name, score: p1Score, color: '#a78bfa' }, null, { name: player2Name, score: p2Score, color: '#ec4899' }].map((p, i) => {
              if (i === 1) return <div key="vs" style={{ textAlign: 'center', color: '#4b5563', fontWeight: 900, fontSize: '1.2rem' }}>VS</div>;
              return (
                <div key={i} style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: p.color }}>{p.score}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
                    {Array.from({ length: roundsToWin }).map((_, j) => (
                      <div key={j} style={{ width: '10px', height: '10px', borderRadius: '50%', background: j < p.score ? p.color : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sequence */}
          <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sequence</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {sequence.split('').map((d, i) => (
                <div key={i} style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))', border: '2px solid rgba(139,92,246,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>{d}</div>
              ))}
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.75rem', margin: '12px 0 0' }}>Make 100 using these digits in order</p>
          </div>

          {/* Player inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { num: 1, name: player1Name, input: p1Input, setInput: setP1Input, msg: p1Msg, msgType: p1MsgType, shake: shake1, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' },
              { num: 2, name: player2Name, input: p2Input, setInput: setP2Input, msg: p2Msg, msgType: p2MsgType, shake: shake2, color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)' },
            ].map(p => {
              const mc = msgColors[p.msgType] || {};
              return (
                <div key={p.num} style={{ background: 'rgba(26,26,46,0.95)', border: `1px solid ${p.borderColor}`, borderRadius: '16px', padding: '20px', animation: p.shake ? 'shake 0.5s ease' : 'none' }}>
                  <div style={{ color: p.color, fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>{p.name}</div>
                  <input
                    type="text"
                    value={p.input}
                    onChange={e => p.setInput(e.target.value.replace(/[^0-9+\-*/]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit(p.num)}
                    placeholder="Expression..."
                    style={{ width: '100%', background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {['+', '-', '*', '/'].map(op => (
                      <button key={op} onClick={() => p.setInput(u => u + op)} style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', padding: '6px 12px', color: '#a78bfa', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>{op}</button>
                    ))}
                    <button onClick={() => p.setInput(u => u.slice(0, -1))} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '6px 10px', color: '#fca5a5', cursor: 'pointer', marginLeft: 'auto' }}>⌫</button>
                  </div>
                  <button onClick={() => handleSubmit(p.num)} style={{ width: '100%', background: `linear-gradient(135deg, ${p.color}, ${p.num === 1 ? '#7c3aed' : '#f43f5e'})`, border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    Submit ✓
                  </button>
                  {p.msg && (
                    <div style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, padding: '8px 12px', borderRadius: '8px', marginTop: '10px', fontSize: '0.8rem' }}>
                      {p.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Won */}
      {gameState === 'won' && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'winGlow 2s ease infinite, popIn 0.4s ease forwards', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '2rem', margin: '0 0 8px' }}>{winner} Wins!</h2>
          <p style={{ color: '#9ca3af', margin: '0 0 24px' }}>Final: {player1Name} {p1Score} — {p2Score} {player2Name}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => { setP1Score(0); setP2Score(0); setWinner(null); startRound(); }} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', padding: '14px 32px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Play Again 🚀</button>
            <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 24px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>← Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}