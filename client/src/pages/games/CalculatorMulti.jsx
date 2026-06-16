import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'correct') {
      [523, 784].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } else if (type === 'wrong') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    }
  } catch (e) {}
};

const generateQuestion = (level) => {
  const ops = ['+', '-', '*'];
  let a, b, op, answer;
  if (level <= 3) { op = ops[Math.floor(Math.random() * 2)]; a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; }
  else if (level <= 6) { op = ops[Math.floor(Math.random() * 3)]; a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 20) + 1; }
  else { op = ops[Math.floor(Math.random() * 3)]; a = Math.floor(Math.random() * 100) + 20; b = Math.floor(Math.random() * 30) + 5; }
  if (op === '+') answer = a + b;
  else if (op === '-') { if (a < b) [a, b] = [b, a]; answer = a - b; }
  else answer = a * b;
  return { question: `${a} ${op} ${b}`, answer };
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

const WINNING_SCORE = 10;

export default function CalculatorMulti() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('setup');
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [p1Question, setP1Question] = useState(null);
  const [p2Question, setP2Question] = useState(null);
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Correct, setP1Correct] = useState(0);
  const [p2Correct, setP2Correct] = useState(0);
  const [p1Msg, setP1Msg] = useState('');
  const [p2Msg, setP2Msg] = useState('');
  const [p1MsgType, setP1MsgType] = useState('');
  const [p2MsgType, setP2MsgType] = useState('');
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake1, setShake1] = useState(false);
  const [shake2, setShake2] = useState(false);
  const [round, setRound] = useState(1);

  const getLevel = (r) => Math.min(Math.ceil(r / 2), 10);

  const startGame = () => {
    setP1Score(0); setP2Score(0);
    setP1Correct(0); setP2Correct(0);
    setRound(1); setWinner(null);
    setShowConfetti(false);
    const q1 = generateQuestion(1);
    const q2 = generateQuestion(1);
    setP1Question(q1); setP2Question(q2);
    setP1Input(''); setP2Input('');
    setP1Msg(''); setP2Msg('');
    setGameState('playing');
  };

  const handleSubmit = (player) => {
    const input = player === 1 ? p1Input : p2Input;
    const question = player === 1 ? p1Question : p2Question;
    const score = player === 1 ? p1Score : p2Score;
    const correct = player === 1 ? p1Correct : p2Correct;
    const setInput = player === 1 ? setP1Input : setP2Input;
    const setMsg = player === 1 ? setP1Msg : setP2Msg;
    const setMsgType = player === 1 ? setP1MsgType : setP2MsgType;
    const setScore = player === 1 ? setP1Score : setP2Score;
    const setCorrect = player === 1 ? setP1Correct : setP2Correct;
    const setShake = player === 1 ? setShake1 : setShake2;
    const setQuestion = player === 1 ? setP1Question : setP2Question;

    const val = parseInt(input);
    if (isNaN(val)) {
      setShake(true); setTimeout(() => setShake(false), 500);
      playSound('wrong');
      return;
    }

    if (val === question.answer) {
      playSound('correct');
      const newCorrect = correct + 1;
      setCorrect(newCorrect);
      const newScore = score + 1;
      setScore(newScore);
      setMsg(`✅ Correct! +1`);
      setMsgType('success');
      setInput('');
      // Give new question
      setTimeout(() => {
        setMsg('');
        setQuestion(generateQuestion(getLevel(round + 1)));
        setRound(r => r + 1);
      }, 800);

      if (newScore >= WINNING_SCORE) {
        setWinner(player === 1 ? p1Name : p2Name);
        setGameState('gameover');
        playSound('win');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } else {
      playSound('wrong');
      setShake(true); setTimeout(() => setShake(false), 500);
      setMsg(`❌ Wrong! Answer: ${question.answer}`);
      setMsgType('error');
      setInput('');
      setTimeout(() => {
        setMsg('');
        setQuestion(generateQuestion(getLevel(round)));
      }, 1000);
    }
  };

  const msgColors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
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

      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#9ca3af', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ Calculator Battle</h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Setup */}
      {gameState === 'setup' && (
        <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'popIn 0.4s ease forwards' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.8rem', margin: '0 0 8px' }}>Calculator Battle</h2>
          <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.9rem' }}>Both players get different questions simultaneously</p>
          <p style={{ color: '#4b5563', margin: '0 0 32px', fontSize: '0.85rem' }}>First to answer {WINNING_SCORE} correctly wins!</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {[{ num: 1, val: p1Name, set: setP1Name, color: '#a78bfa' },
              { num: 2, val: p2Name, set: setP2Name, color: '#ec4899' }].map(p => (
              <div key={p.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ color: p.color, fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>Player {p.num}</div>
                <input value={p.val} onChange={e => p.set(e.target.value)} style={{ width: '100%', background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            ))}
          </div>

          <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', border: 'none', borderRadius: '14px', padding: '16px 48px', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(236,72,153,0.4)' }}>
            Start Battle ⚡
          </button>
        </div>
      )}

      {/* Playing */}
      {gameState === 'playing' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Scoreboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
            <div style={{ background: p1Score > p2Score ? 'rgba(167,139,250,0.15)' : 'rgba(26,26,46,0.95)', border: `1px solid ${p1Score > p2Score ? 'rgba(167,139,250,0.4)' : 'rgba(139,92,246,0.2)'}`, borderRadius: '16px', padding: '16px', textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{p1Name}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{p1Score}</div>
              <div style={{ color: '#4b5563', fontSize: '0.75rem' }}>{WINNING_SCORE - p1Score} to win</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4b5563', fontWeight: 900, fontSize: '1.2rem' }}>VS</div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>Lvl {getLevel(round)}</div>
            </div>
            <div style={{ background: p2Score > p1Score ? 'rgba(236,72,153,0.15)' : 'rgba(26,26,46,0.95)', border: `1px solid ${p2Score > p1Score ? 'rgba(236,72,153,0.4)' : 'rgba(139,92,246,0.2)'}`, borderRadius: '16px', padding: '16px', textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{p2Name}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{p2Score}</div>
              <div style={{ color: '#4b5563', fontSize: '0.75rem' }}>{WINNING_SCORE - p2Score} to win</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '8px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '8px', borderRadius: '999px', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', width: `${(p1Score / WINNING_SCORE) * 100}%`, transition: 'width 0.4s ease' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, height: '8px', borderRadius: '999px', background: 'linear-gradient(90deg, #f43f5e, #ec4899)', width: `${(p2Score / WINNING_SCORE) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Player panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { num: 1, name: p1Name, question: p1Question, input: p1Input, setInput: setP1Input, msg: p1Msg, msgType: p1MsgType, shake: shake1, color: '#a78bfa', grad: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
              { num: 2, name: p2Name, question: p2Question, input: p2Input, setInput: setP2Input, msg: p2Msg, msgType: p2MsgType, shake: shake2, color: '#ec4899', grad: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
            ].map(p => {
              const mc = msgColors[p.msgType] || {};
              return (
                <div key={p.num} style={{ background: 'rgba(26,26,46,0.95)', border: `1px solid ${p.color}30`, borderRadius: '20px', padding: '24px', animation: p.shake ? 'shake 0.5s ease' : 'none' }}>
                  {/* Player name */}
                  <div style={{ color: p.color, fontWeight: 800, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧑</span> {p.name}
                  </div>

                  {/* Question */}
                  {p.question && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solve this</div>
                      <div style={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}>{p.question.question} = ?</div>
                    </div>
                  )}

                  {/* Input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="number"
                      value={p.input}
                      onChange={e => p.setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit(p.num)}
                      placeholder="Answer..."
                      style={{ flex: 1, background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '1.1rem', fontWeight: 700, outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = p.color}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button onClick={() => handleSubmit(p.num)} style={{ background: p.grad, border: 'none', borderRadius: '10px', padding: '12px 20px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                  </div>

                  {p.msg && (
                    <div style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', animation: 'popIn 0.3s ease' }}>
                      {p.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game over */}
      {gameState === 'gameover' && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '24px', padding: '48px', textAlign: 'center', animation: 'winGlow 2s ease infinite, popIn 0.4s ease forwards', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '2rem', margin: '0 0 8px' }}>{winner} Wins!</h2>
          <p style={{ color: '#9ca3af', margin: '0 0 24px' }}>Final: {p1Name} {p1Score} — {p2Score} {p2Name}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', padding: '14px 32px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Play Again 🚀</button>
            <button onClick={() => navigate('/multiplayer')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 24px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>← Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}