import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'correct') {
      const notes = [523, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    } else if (type === 'timeout') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
};

const generateQuestion = (level) => {
  const ops = ['+', '-', '*'];
  let a, b, op, answer;

  if (level <= 3) {
    op = ops[Math.floor(Math.random() * 2)]; // only + -
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
  } else if (level <= 6) {
    op = ops[Math.floor(Math.random() * 3)];
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * 20) + 1;
  } else if (level <= 8) {
    op = ops[Math.floor(Math.random() * 3)];
    a = Math.floor(Math.random() * 100) + 20;
    b = Math.floor(Math.random() * 30) + 5;
  } else {
    op = ops[Math.floor(Math.random() * 3)];
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * 50) + 10;
  }

  if (op === '+') answer = a + b;
  else if (op === '-') { if (a < b) [a, b] = [b, a]; answer = a - b; }
  else answer = a * b;

  return { question: `${a} ${op} ${b}`, answer };
};

const Confetti = () => {
  const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
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
const QUESTION_TIME = 5;

export default function Calculator() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('idle'); // idle, playing, gameover
  const [question, setQuestion] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong'|'timeout'|'computer', text }
  const [shakeInput, setShakeInput] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winner, setWinner] = useState(null);
  const [questionLock, setQuestionLock] = useState(false);
  const [computerDelay, setComputerDelay] = useState(null);

  const timerRef = useRef(null);
  const computerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(computerRef.current);
    };
  }, []);

  const getLevel = (r) => Math.min(Math.ceil(r / 2), 10);

  const nextQuestion = useCallback((pScore, cScore, r) => {
    clearInterval(timerRef.current);
    clearTimeout(computerRef.current);

    if (pScore >= WINNING_SCORE || cScore >= WINNING_SCORE) {
      const w = pScore >= WINNING_SCORE ? 'player' : 'computer';
      setWinner(w);
      setGameState('gameover');
      if (w === 'player') {
        playSound('win');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return;
    }

    const q = generateQuestion(getLevel(r));
    setQuestion(q);
    setUserInput('');
    setTimeLeft(QUESTION_TIME);
    setQuestionLock(false);
    setFeedback(null);
    setRound(r);

    // Computer delay: faster as rounds increase
    const minDelay = Math.max(1000, 4000 - r * 200);
    const maxDelay = Math.max(2000, 6000 - r * 200);
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    setComputerDelay(Math.round(delay / 1000 * 10) / 10);

    // Computer answers after delay
    computerRef.current = setTimeout(() => {
      setQuestionLock(prev => {
        if (!prev) {
          // Computer gets the point
          const newCScore = cScore + 1;
          setComputerScore(newCScore);
          playSound('timeout');
          setFeedback({ type: 'computer', text: `🤖 Computer answered first! The answer was ${q.answer}` });
          setQuestionLock(true);
          setTimeout(() => nextQuestion(pScore, newCScore, r + 1), 1800);
        }
        return true;
      });
    }, delay);

    // Question timer
    let t = QUESTION_TIME;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const startGame = () => {
    setPlayerScore(0);
    setComputerScore(0);
    setRound(1);
    setWinner(null);
    setFeedback(null);
    setShowConfetti(false);
    setGameState('playing');
    nextQuestion(0, 0, 1);
  };

  const handleSubmit = () => {
    if (questionLock || !question || gameState !== 'playing') return;
    const val = parseInt(userInput);
    if (isNaN(val)) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      return;
    }

    clearInterval(timerRef.current);
    clearTimeout(computerRef.current);
    setQuestionLock(true);

    if (val === question.answer) {
      playSound('correct');
      const newPScore = playerScore + 1;
      setPlayerScore(newPScore);
      setFeedback({ type: 'correct', text: `✅ Correct! +1 point` });
      setTimeout(() => nextQuestion(newPScore, computerScore, round + 1), 1200);
    } else {
      playSound('wrong');
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      const newCScore = computerScore + 1;
      setComputerScore(newCScore);
      setFeedback({ type: 'wrong', text: `❌ Wrong! Answer was ${question.answer}. Computer gets the point.` });
      setTimeout(() => nextQuestion(playerScore, newCScore, round + 1), 1800);
    }
  };

  const feedbackColors = {
    correct: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7' },
    wrong: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
    timeout: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fcd34d' },
    computer: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '680px', margin: '0 auto', position: 'relative' }}>
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
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes winGlow {
          0% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 60px rgba(16,185,129,0.6); }
          100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
        }
      `}</style>

      {showConfetti && <Confetti />}

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/computer')} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', color: '#9ca3af', padding: '8px 16px',
          cursor: 'pointer', fontSize: '0.875rem',
        }}>← Back</button>
        <h1 style={{
          fontSize: '1.5rem', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>⚡ Lightning Math</h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* IDLE screen */}
      {gameState === 'idle' && (
        <div style={{
          background: 'rgba(26,26,46,0.95)',
          border: '1px solid rgba(236,72,153,0.3)',
          borderRadius: '24px', padding: '48px',
          textAlign: 'center', position: 'relative', zIndex: 1,
          animation: 'popIn 0.4s ease forwards',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚡</div>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.8rem', margin: '0 0 12px' }}>
            Lightning Math
          </h2>
          <p style={{ color: '#9ca3af', margin: '0 0 8px', fontSize: '0.95rem' }}>
            Answer math questions before the computer does!
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px', margin: '32px 0',
          }}>
            {[
              { icon: '⏱', label: '5 seconds', sub: 'per question' },
              { icon: '🎯', label: 'First to 10', sub: 'wins the duel' },
              { icon: '📈', label: 'Gets harder', sub: 'every 2 rounds' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(236,72,153,0.08)',
                border: '1px solid rgba(236,72,153,0.2)',
                borderRadius: '14px', padding: '16px',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <button onClick={startGame} style={{
            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            border: 'none', borderRadius: '14px',
            padding: '16px 48px', color: 'white',
            fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(236,72,153,0.4)',
          }}>Start Duel ⚡</button>
        </div>
      )}

      {/* PLAYING screen */}
      {gameState === 'playing' && question && (
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Score board */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            gap: '12px', marginBottom: '24px', alignItems: 'center',
          }}>
            {/* Player score */}
            <div style={{
              background: playerScore > computerScore ? 'rgba(16,185,129,0.15)' : 'rgba(26,26,46,0.95)',
              border: `1px solid ${playerScore > computerScore ? 'rgba(16,185,129,0.4)' : 'rgba(139,92,246,0.2)'}`,
              borderRadius: '16px', padding: '16px', textAlign: 'center',
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🧑</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>You</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900,
                color: playerScore > computerScore ? '#6ee7b7' : 'white',
              }}>{playerScore}</div>
            </div>

            {/* VS + Round */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>Round</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '1.3rem' }}>{round}</div>
              <div style={{
                color: '#4b5563', fontSize: '0.8rem',
                marginTop: '4px', fontWeight: 700,
              }}>VS</div>
            </div>

            {/* Computer score */}
            <div style={{
              background: computerScore > playerScore ? 'rgba(239,68,68,0.15)' : 'rgba(26,26,46,0.95)',
              border: `1px solid ${computerScore > playerScore ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.2)'}`,
              borderRadius: '16px', padding: '16px', textAlign: 'center',
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🤖</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>Computer</div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900,
                color: computerScore > playerScore ? '#fca5a5' : 'white',
              }}>{computerScore}</div>
            </div>
          </div>

          {/* Progress to win */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>First to {WINNING_SCORE} wins</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Level {getLevel(round)}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '6px', borderRadius: '999px',
                background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                width: `${(Math.max(playerScore, computerScore) / WINNING_SCORE) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Question card */}
          <div style={{
            background: 'rgba(26,26,46,0.95)',
            border: '1px solid rgba(236,72,153,0.3)',
            borderRadius: '20px', padding: '32px',
            textAlign: 'center', marginBottom: '20px',
          }}>
            {/* Timer */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: timeLeft <= 2 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${timeLeft <= 2 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '999px', padding: '6px 16px',
                animation: timeLeft <= 2 ? 'pulse 0.5s ease infinite' : 'none',
                transition: 'all 0.3s',
              }}>
                <span style={{ color: timeLeft <= 2 ? '#ef4444' : '#9ca3af', fontSize: '0.8rem' }}>⏱</span>
                <span style={{
                  fontWeight: 900, fontSize: '1.2rem',
                  color: timeLeft <= 2 ? '#ef4444' : 'white',
                }}>{timeLeft}s</span>
              </div>
            </div>

            {/* Question */}
            <div style={{
              fontSize: '3rem', fontWeight: 900, color: 'white',
              marginBottom: '8px', letterSpacing: '-0.02em',
            }}>
              {question.question} = ?
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '0' }}>
              🤖 Computer answers in ~{computerDelay}s
            </p>
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '16px',
            animation: shakeInput ? 'shake 0.5s ease' : 'none',
          }}>
            <input
              ref={inputRef}
              type="number"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Your answer..."
              disabled={questionLock}
              style={{
                flex: 1,
                background: questionLock ? 'rgba(255,255,255,0.02)' : 'rgba(15,15,26,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '16px 20px',
                color: 'white', fontSize: '1.3rem',
                fontWeight: 700, outline: 'none',
                textAlign: 'center', boxSizing: 'border-box',
                opacity: questionLock ? 0.5 : 1,
              }}
              onFocus={e => e.target.style.borderColor = '#ec4899'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            <button
              onClick={handleSubmit}
              disabled={questionLock}
              style={{
                background: questionLock ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ec4899, #f43f5e)',
                border: 'none', borderRadius: '12px',
                padding: '16px 28px', color: 'white',
                fontWeight: 800, fontSize: '1rem', cursor: questionLock ? 'not-allowed' : 'pointer',
                boxShadow: questionLock ? 'none' : '0 4px 15px rgba(236,72,153,0.4)',
                opacity: questionLock ? 0.5 : 1,
              }}
            >Submit</button>
          </div>

          {/* Feedback */}
          {feedback && (() => {
            const fc = feedbackColors[feedback.type] || feedbackColors.wrong;
            return (
              <div style={{
                background: fc.bg, border: `1px solid ${fc.border}`,
                color: fc.color, padding: '14px 18px',
                borderRadius: '12px', fontSize: '0.9rem',
                fontWeight: 500, animation: 'popIn 0.3s ease forwards',
              }}>{feedback.text}</div>
            );
          })()}
        </div>
      )}

      {/* GAME OVER screen */}
      {gameState === 'gameover' && (
        <div style={{
          background: winner === 'player' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `2px solid ${winner === 'player' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: '24px', padding: '48px',
          textAlign: 'center', position: 'relative', zIndex: 1,
          animation: winner === 'player' ? 'winGlow 2s ease infinite, popIn 0.4s ease forwards' : 'popIn 0.4s ease forwards',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
            {winner === 'player' ? '🏆' : '🤖'}
          </div>
          <h2 style={{
            fontWeight: 900, fontSize: '2rem', margin: '0 0 8px',
            color: winner === 'player' ? '#6ee7b7' : '#fca5a5',
          }}>
            {winner === 'player' ? 'You Win!' : 'Computer Wins!'}
          </h2>
          <p style={{ color: '#9ca3af', margin: '0 0 24px', fontSize: '0.95rem' }}>
            Final Score: <strong style={{ color: 'white' }}>{playerScore}</strong> — {computerScore}
          </p>

          {/* Score breakdown */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '16px', marginBottom: '32px',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '14px', padding: '16px',
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '4px' }}>Your Score</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}>{playerScore}</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '14px', padding: '16px',
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '4px' }}>Computer</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}>{computerScore}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={startGame} style={{
              background: winner === 'player'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ec4899, #f43f5e)',
              border: 'none', borderRadius: '14px',
              padding: '16px 36px', color: 'white',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(236,72,153,0.3)',
            }}>Play Again ⚡</button>
            <button onClick={() => navigate('/computer')} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', padding: '16px 24px',
              color: '#9ca3af', fontWeight: 600,
              fontSize: '1rem', cursor: 'pointer',
            }}>← Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}