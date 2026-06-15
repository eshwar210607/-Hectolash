import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSequence, findExpression, checkAnswer } from '../../utils/mathEngine';

const HectocSolo = () => {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [solution, setSolution] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error, info, warning
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [score, setScore] = useState(0);

  // AI state
  const [aiInput, setAiInput] = useState('');
  const [aiStatus, setAiStatus] = useState('thinking'); // thinking, solving, done
  const [aiProgress, setAiProgress] = useState(0);
  const aiTimerRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize game
  useEffect(() => {
    startNewGame();
    return () => {
      clearInterval(aiTimerRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerEnabled && timerActive && timeLeft > 0 && gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameStatus('lost');
            setMessage("⏰ Time's up! The AI wins this round.");
            setMessageType('error');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerEnabled, timerActive, gameStatus]);

  const startNewGame = () => {
    clearInterval(aiTimerRef.current);
    clearInterval(timerRef.current);
    const seq = generateSequence();
    const sol = findExpression(seq);
    setSequence(seq);
    setSolution(sol);
    setUserInput('');
    setGameStatus('playing');
    setMessage('');
    setHintsUsed(0);
    setHintText('');
    setShowSolution(false);
    setTimeLeft(180);
    setTimerActive(false);
    setAiInput('');
    setAiStatus('thinking');
    setAiProgress(0);
    startAI(sol);
  };

  const startAI = (sol) => {
    if (!sol) return;
    const operators = sol.match(/[+\-*/]/g) || [];
    const digits = sol.replace(/[+\-*/]/g, '').split('');
    let step = 0;
    let built = digits[0];

    // AI thinks for 3-8 seconds before starting
    const thinkDelay = 3000 + Math.random() * 5000;

    setTimeout(() => {
      setAiStatus('solving');
      // AI reveals one operator at a time every 2-5 seconds
      aiTimerRef.current = setInterval(() => {
        if (step < operators.length) {
          built += operators[step] + digits[step + 1];
          const currentBuilt = built;
          setAiInput(currentBuilt);
          setAiProgress(Math.round(((step + 1) / operators.length) * 100));
          step++;
        } else {
          clearInterval(aiTimerRef.current);
          setAiStatus('done');
          setAiProgress(100);
          setGameStatus(prev => {
            if (prev === 'playing') {
              setMessage('🤖 The AI solved it before you! Better luck next time.');
              setMessageType('error');
              return 'lost';
            }
            return prev;
          });
        }
      }, 2000 + Math.random() * 3000);
    }, thinkDelay);
  };

  const getHint = () => {
    if (gameStatus !== 'playing' || !solution) return;

    const digits = sequence.split('');
    const solOps = solution.match(/[+\-*/]/g) || [];

    // Parse user's current input to see how far they've gotten correctly
    const userOps = userInput.match(/[+\-*/]/g) || [];
    const userDigits = userInput.replace(/[+\-*/]/g, '').split('').filter(Boolean);

    // Check if user digits match sequence
    for (let i = 0; i < userDigits.length; i++) {
      if (userDigits[i] !== digits[i]) {
        setHintText(`❌ Mistake at digit position ${i + 1}. You used "${userDigits[i]}" but it should be "${digits[i]}". Go back and fix this!`);
        setHintsUsed(h => h + 1);
        return;
      }
    }

    // Check if user operators match solution so far
    for (let i = 0; i < userOps.length; i++) {
      if (userOps[i] !== solOps[i]) {
        setHintText(`💡 Operator ${i + 1} is wrong. You used "${userOps[i]}" but try a different operator here. Go back to position ${i + 1}!`);
        setHintsUsed(h => h + 1);
        return;
      }
    }

    // User is correct so far — reveal next operator
    const nextOpIndex = userOps.length;
    if (nextOpIndex < solOps.length) {
      setHintText(`✨ You're on track! Next operator should be "${solOps[nextOpIndex]}" (position ${nextOpIndex + 1})`);
      setHintsUsed(h => h + 1);
    } else {
      setHintText('🎯 You have all operators correct! Just submit your answer.');
    }
  };

  const handleSubmit = () => {
    if (!userInput.trim() || gameStatus !== 'playing') return;

    // Check digits match sequence
    const userDigits = userInput.replace(/[+\-*/]/g, '').split('').filter(Boolean);
    const seqDigits = sequence.split('');

    if (userDigits.length !== seqDigits.length) {
      setMessage(`⚠️ You must use all 6 digits in order: ${sequence.split('').join(', ')}`);
      setMessageType('warning');
      return;
    }

    for (let i = 0; i < seqDigits.length; i++) {
      if (userDigits[i] !== seqDigits[i]) {
        setMessage(`❌ Wrong digit at position ${i + 1}. Digits must be in order: ${sequence.split('').join(' → ')}`);
        setMessageType('error');
        return;
      }
    }

    if (checkAnswer(userInput, sequence)) {
      clearInterval(aiTimerRef.current);
      clearInterval(timerRef.current);
      setGameStatus('won');
      const earnedScore = Math.max(100 - hintsUsed * 10, 10);
      setScore(earnedScore);
      setMessage(`🎉 Brilliant! You solved it! +${earnedScore} XP earned`);
      setMessageType('success');
    } else {
      setMessage('❌ That expression does not equal 100. Try again!');
      setMessageType('error');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Only allow digits from sequence, operators, and nothing else
    const filtered = val.replace(/[^0-9+\-*/]/g, '');
    setUserInput(filtered);
    setMessage('');
    // Start timer on first input if timer enabled
    if (timerEnabled && !timerActive && filtered.length > 0) {
      setTimerActive(true);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const messageColors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', color: '#fcd34d' },
    info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  };

  const mc = messageColors[messageType] || messageColors.info;

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      padding: '40px 24px',
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', right: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }}></div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/computer')} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', color: '#9ca3af', padding: '8px 16px',
          cursor: 'pointer', fontSize: '0.875rem',
        }}>← Back</button>

        <h1 style={{
          fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0,
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>🧮 Hectoc Challenge</h1>

        {/* Timer toggle */}
        <button
          onClick={() => setTimerEnabled(t => !t)}
          style={{
            background: timerEnabled ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${timerEnabled ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '999px', color: timerEnabled ? '#a78bfa' : '#6b7280',
            padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
          }}
        >
          ⏱ Timer {timerEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Timer display */}
      {timerEnabled && (
        <div style={{
          textAlign: 'center', marginBottom: '20px',
          fontSize: '2rem', fontWeight: 900,
          color: timeLeft < 30 ? '#ef4444' : '#a78bfa',
          position: 'relative', zIndex: 1,
        }}>
          {formatTime(timeLeft)}
        </div>
      )}

      {/* Sequence display */}
      <div style={{
        background: 'rgba(26,26,46,0.95)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '20px', padding: '32px',
        textAlign: 'center', marginBottom: '24px',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Your 6-digit sequence
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {sequence.split('').map((d, i) => (
            <div key={i} style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
              border: '2px solid rgba(139,92,246,0.4)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 900, color: 'white',
            }}>{d}</div>
          ))}
        </div>
        <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '16px 0 0' }}>
          Use these digits in order with +, -, *, / to make 100
        </p>
      </div>

      {/* Player vs AI */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
        marginBottom: '24px', position: 'relative', zIndex: 1,
      }}>
        {/* Player */}
        <div style={{
          background: 'rgba(26,26,46,0.95)',
          border: `1px solid ${gameStatus === 'won' ? 'rgba(16,185,129,0.5)' : 'rgba(139,92,246,0.2)'}`,
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧑</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>You</span>
            {gameStatus === 'won' && <span style={{ color: '#6ee7b7', fontSize: '0.8rem', marginLeft: 'auto' }}>✅ Solved!</span>}
          </div>
          <div style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '12px',
            color: userInput ? 'white' : '#4b5563',
            fontSize: '1rem', fontFamily: 'monospace',
            minHeight: '44px', wordBreak: 'break-all',
          }}>
            {userInput || 'Your expression...'}
          </div>
        </div>

        {/* AI */}
        <div style={{
          background: 'rgba(26,26,46,0.95)',
          border: `1px solid ${aiStatus === 'done' ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.2)'}`,
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>AI</span>
            <span style={{
              marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
              color: aiStatus === 'thinking' ? '#f59e0b' : aiStatus === 'solving' ? '#06b6d4' : '#ef4444',
            }}>
              {aiStatus === 'thinking' ? '🤔 Thinking...' : aiStatus === 'solving' ? `⚡ ${aiProgress}%` : '✅ Done!'}
            </span>
          </div>
          {/* AI progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '4px', marginBottom: '12px' }}>
            <div style={{
              height: '4px', borderRadius: '999px',
              background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
              width: `${aiProgress}%`, transition: 'width 0.5s ease',
            }}></div>
          </div>
          <div style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '12px',
            color: aiInput ? '#f9a8d4' : '#4b5563',
            fontSize: '1rem', fontFamily: 'monospace',
            minHeight: '44px', wordBreak: 'break-all',
          }}>
            {aiInput || 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Input area */}
      {gameStatus === 'playing' && (
        <div style={{
          background: 'rgba(26,26,46,0.95)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '20px', padding: '24px',
          marginBottom: '20px', position: 'relative', zIndex: 1,
        }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
            Your Expression
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={`e.g. ${sequence[0]}+${sequence[1]}-${sequence[2]}*${sequence[3]}/${sequence[4]}+${sequence[5]}`}
              style={{
                flex: 1,
                background: 'rgba(15,15,26,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '14px 16px',
                color: 'white', fontSize: '1rem',
                fontFamily: 'monospace', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            <button onClick={handleSubmit} style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none', borderRadius: '12px',
              padding: '14px 24px', color: 'white',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
            }}>Submit</button>
          </div>

          {/* Operator quick buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {['+', '-', '*', '/'].map(op => (
              <button key={op} onClick={() => setUserInput(u => u + op)} style={{
                background: 'rgba(124,58,237,0.2)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '8px', padding: '8px 16px',
                color: '#a78bfa', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer',
              }}>{op}</button>
            ))}
            <button onClick={() => setUserInput(u => u.slice(0, -1))} style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '8px 16px',
              color: '#fca5a5', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', marginLeft: 'auto',
            }}>⌫ Delete</button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          background: mc.bg, border: `1px solid ${mc.border}`,
          color: mc.color, padding: '14px 18px',
          borderRadius: '12px', marginBottom: '20px',
          fontSize: '0.9rem', fontWeight: 500,
          position: 'relative', zIndex: 1,
        }}>
          {message}
        </div>
      )}

      {/* Hint display */}
      {hintText && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#fcd34d', padding: '14px 18px',
          borderRadius: '12px', marginBottom: '20px',
          fontSize: '0.9rem', position: 'relative', zIndex: 1,
        }}>
          {hintText}
        </div>
      )}

      {/* Solution display */}
      {showSolution && (
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc', padding: '14px 18px',
          borderRadius: '12px', marginBottom: '20px',
          fontSize: '1rem', fontFamily: 'monospace',
          position: 'relative', zIndex: 1,
        }}>
          💡 Solution: <strong style={{ color: 'white' }}>{solution}</strong> = 100
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        position: 'relative', zIndex: 1,
      }}>
        {gameStatus === 'playing' && (
          <>
            <button onClick={getHint} style={{
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px', padding: '12px 20px',
              color: '#fcd34d', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer',
            }}>
              💡 Hint ({hintsUsed} used)
            </button>
            <button onClick={() => setShowSolution(true)} style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px', padding: '12px 20px',
              color: '#a5b4fc', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer',
            }}>
              👁 Show Solution
            </button>
          </>
        )}
        <button onClick={startNewGame} style={{
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          border: 'none', borderRadius: '12px',
          padding: '12px 20px', color: 'white',
          fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
          marginLeft: 'auto',
        }}>
          🔄 New Game
        </button>
      </div>

      {/* Score display on win */}
      {gameStatus === 'won' && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '16px', padding: '24px',
          textAlign: 'center', position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
          <h3 style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '1.3rem', margin: '0 0 4px' }}>
            You beat the AI!
          </h3>
          <p style={{ color: '#9ca3af', margin: '0 0 16px', fontSize: '0.875rem' }}>
            Hints used: {hintsUsed} | Score: +{score} XP
          </p>
          <button onClick={startNewGame} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', borderRadius: '12px',
            padding: '12px 32px', color: 'white',
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
          }}>Play Again 🚀</button>
        </div>
      )}
    </div>
  );
};

export default HectocSolo;