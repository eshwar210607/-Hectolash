import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSequence, findExpression, checkAnswer } from '../../utils/mathEngine';

// Sound effects using Web Audio API
const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (type === 'win') {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
    return;
  }

  if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
    return;
  }

  if (type === 'hint') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
    return;
  }

  if (type === 'timeout') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }
};

// Confetti component
const Confetti = () => {
  const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${0.8 + Math.random() * 0.8}s`,
    size: `${6 + Math.random() * 8}px`,
    rotation: `${Math.random() * 360}deg`,
  }));

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes hintPulse {
          0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
          50% { box-shadow: 0 0 0 12px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
        }
        @keyframes winGlow {
          0% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 50px rgba(16,185,129,0.7), 0 0 80px rgba(16,185,129,0.3); }
          100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes hintGlow {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.7); }
          50% { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .shake-anim { animation: shake 0.5s ease; }
        .hint-anim { animation: hintPulse 0.6s ease; }
        .win-glow { animation: winGlow 2s ease infinite; }
        .pop-in { animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
        {pieces.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation})`,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }} />
        ))}
      </div>
    </>
  );
};

const HectocSolo = () => {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [solution, setSolution] = useState('');
  const [gameStatus, setGameStatus] = useState('playing');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeInput, setShakeInput] = useState(false);
  const [hintAnim, setHintAnim] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Timer
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerLimit, setTimerLimit] = useState(180);
  const [customMinutes, setCustomMinutes] = useState(3);
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startNewGame();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timerEnabled && timerActive && timeLeft > 0 && gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameStatus('lost');
            setMessage("⏰ Time's up!");
            setMessageType('error');
            playSound('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerEnabled, timerActive, gameStatus]);

  const startNewGame = () => {
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
    setShowConfetti(false);
    setTimeLeft(timerLimit);
    setTimerActive(false);
  };

  const handleTimerToggle = () => {
    if (timerEnabled) {
      setTimerEnabled(false);
      setTimerActive(false);
      clearInterval(timerRef.current);
    } else {
      setTimerEnabled(true);
      setShowTimerSettings(true);
    }
  };

  const applyTimerSettings = () => {
    const seconds = customMinutes * 60;
    setTimerLimit(seconds);
    setTimeLeft(seconds);
    setShowTimerSettings(false);
  };

  const triggerShake = () => {
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 500);
  };

  const triggerHintAnim = () => {
    setHintAnim(true);
    setTimeout(() => setHintAnim(false), 600);
  };

  const getHint = async () => {
    if (gameStatus !== 'playing' || !solution) return;
    playSound('hint');
    triggerHintAnim();
    setLoadingAi(true);

    const digits = sequence.split('');
    const solOps = solution.match(/[+\-*/]/g) || [];
    const userOps = userInput.match(/[+\-*/]/g) || [];

    let diagnosticMessage = '';

    // Check 1: Live double-digit clumping layout error validation (e.g., '52' instead of separate values)
    const multiDigitMatch = userInput.match(/[0-9]{2,}/);
    if (multiDigitMatch) {
      diagnosticMessage = `There is a typing mistake, please correct it to go forward! You typed multiple digits together as "${multiDigitMatch[0]}" without an operator separating them. Hectoc rules strictly require single standalone digits. Tell them to backspace and correct this cluster typo layout before proceeding.`;
    }

    // Check 2: Missing or out of order digit index tracker sequence
    if (!diagnosticMessage) {
      const userDigits = userInput.replace(/[+\-*/]/g, '').split('').filter(Boolean);
      for (let i = 0; i < userDigits.length; i++) {
        if (userDigits[i] !== digits[i]) {
          diagnosticMessage = `Digit mistake at step ${i + 1}. The player typed "${userDigits[i]}" but it must be "${digits[i]}". Advise them to delete the error and go back.`;
          break;
        }
      }
    }

    // Check 3: Operator path tracking divergence engine
    if (!diagnosticMessage) {
      for (let i = 0; i < userOps.length; i++) {
        if (userOps[i] !== solOps[i]) {
          diagnosticMessage = `Operator mistake at operator position ${i + 1}. They applied "${userOps[i]}", but that path deviates from our solution. Tell them exactly where the wrong operator is and instruct them to backspace from that spot.`;
          break;
        }
      }
    }

    // Check 4: Balanced execution pathway -> Provide the next required calculation element
    if (!diagnosticMessage) {
      const nextOpIndex = userOps.length;
      if (nextOpIndex < solOps.length) {
        diagnosticMessage = `The user is completely on the right path! Tell them the next operator they need to apply is "${solOps[nextOpIndex]}" at operator position ${nextOpIndex + 1}. Provide this tip with high wizard energy.`;
      } else {
        diagnosticMessage = `All of the operations match our target footprint perfectly. Tell them to press the submit button to clear the arena.`;
      }
    }

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          userInput,
          targetSolution: solution,
          diagnostic: diagnosticMessage
        })
      });
      const data = await response.json();
      setHintText(data.hint || 'Focus your mind, wizard. The patterns are revealing themselves.');
      setHintsUsed(h => h + 1);
    } catch (error) {
      setHintText('Connection to the arcane tower was interrupted, but keep pushing forward!');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = () => {
    if (!userInput.trim() || gameStatus !== 'playing') return;

    const userDigits = userInput.replace(/[+\-*/]/g, '').split('').filter(Boolean);
    const seqDigits = sequence.split('');

    if (userDigits.length !== seqDigits.length) {
      playSound('wrong');
      triggerShake();
      setMessage(`⚠️ Use all 6 digits in order: ${sequence.split('').join(' → ')}`);
      setMessageType('warning');
      return;
    }

    for (let i = 0; i < seqDigits.length; i++) {
      if (userDigits[i] !== seqDigits[i]) {
        playSound('wrong');
        triggerShake();
        setMessage(`❌ Wrong digit at position ${i + 1}. Must follow: ${sequence.split('').join(' → ')}`);
        setMessageType('error');
        return;
      }
    }

    if (checkAnswer(userInput, sequence)) {
      clearInterval(timerRef.current);
      setGameStatus('won');
      setMessage(`🎉 Correct! Solved with ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''}.`);
      setMessageType('success');
      playSound('win');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      playSound('wrong');
      triggerShake();
      setMessage('❌ Expression does not equal 100. Keep trying!');
      setMessageType('error');
    }
  };

  const handleInputChange = (e) => {
    const filtered = e.target.value.replace(/[^0-9+\-*/]/g, '');
    setUserInput(filtered);
    setMessage('');
    setHintText('');
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
      maxWidth: '700px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {showConfetti && <Confetti />}

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', right: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }}></div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '32px',
        position: 'relative', zIndex: 1,
      }}>
        <button onClick={() => navigate('/computer')} style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', color: '#9ca3af',
          padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem',
        }}>← Back</button>

        <h1 style={{
          fontSize: '1.5rem', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>🧮 Hectoc Challenge</h1>

        <button onClick={handleTimerToggle} style={{
          background: timerEnabled ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${timerEnabled ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '999px',
          color: timerEnabled ? '#a78bfa' : '#6b7280',
          padding: '8px 16px', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 600,
        }}>⏱ Timer {timerEnabled ? 'ON' : 'OFF'}</button>
      </div>

      {/* Timer settings modal */}
      {showTimerSettings && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '24px', padding: '40px',
            width: '360px', textAlign: 'center',
            animation: 'popIn 0.3s ease forwards',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏱</div>
            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', margin: '0 0 8px' }}>Set Timer</h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 24px' }}>How long do you want to play?</p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 5, 10].map(min => (
                <button key={min} onClick={() => setCustomMinutes(min)} style={{
                  background: customMinutes === min ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${customMinutes === min ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px', padding: '10px 16px',
                  color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.9rem',
                  transform: customMinutes === min ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}>{min}m</button>
              ))}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
                Custom (minutes):
              </label>
              <input
                type="number" min="1" max="60"
                value={customMinutes}
                onChange={e => setCustomMinutes(Number(e.target.value))}
                style={{
                  width: '100%', background: 'rgba(15,15,26,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px', padding: '12px',
                  color: 'white', fontSize: '1.1rem',
                  textAlign: 'center', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setTimerEnabled(false); setShowTimerSettings(false); }} style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '12px',
                color: '#9ca3af', cursor: 'pointer', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={applyTimerSettings} style={{
                flex: 1,
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                border: 'none', borderRadius: '12px', padding: '12px',
                color: 'white', cursor: 'pointer', fontWeight: 700,
              }}>Start ⚡</button>
            </div>
          </div>
        </div>
      )}

      {/* Timer display */}
      {timerEnabled && (
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: timeLeft < 30 ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
            border: `2px solid ${timeLeft < 30 ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.4)'}`,
            borderRadius: '999px', padding: '10px 28px',
            transition: 'all 0.3s',
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900,
              color: timeLeft < 30 ? '#ef4444' : '#a78bfa',
            }}>{formatTime(timeLeft)}</span>
          </div>
          {!timerActive && gameStatus === 'playing' && (
            <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '6px' }}>
              Timer starts when you type
            </p>
          )}
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
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Your 6-digit sequence
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {sequence.split('').map((d, i) => (
            <div key={i} style={{
              width: '60px', height: '60px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
              border: '2px solid rgba(139,92,246,0.4)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: 'white',
              transition: 'transform 0.2s',
            }}>{d}</div>
          ))}
        </div>
        <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '16px 0 0' }}>
          Use these digits in this exact order with + − × ÷ to make 100
        </p>
      </div>

      {/* Input area */}
      {gameStatus === 'playing' && (
        <div style={{
          background: 'rgba(26,26,46,0.95)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '20px', padding: '24px',
          marginBottom: '20px', position: 'relative', zIndex: 1,
          animation: shakeInput ? 'shake 0.5s ease' : 'none',
        }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
            Your Expression
          </label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={sequence ? `e.g. ${sequence[0]}+${sequence[1]}-${sequence[2]}*${sequence[3]}/${sequence[4]}+${sequence[5]}` : ''}
              style={{
                flex: 1,
                background: 'rgba(15,15,26,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '14px 16px',
                color: 'white', fontSize: '1rem',
                fontFamily: 'monospace', outline: 'none',
                boxSizing: 'border-box',
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#4b5563', fontSize: '0.75rem', marginRight: '4px' }}>Quick:</span>
            {['+', '-', '*', '/'].map(op => (
              <button key={op} onClick={() => setUserInput(u => u + op)} style={{
                background: 'rgba(124,58,237,0.2)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '8px', padding: '8px 16px',
                color: '#a78bfa', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer',
              }}>{op}</button>
            ))}
            <button onClick={() => { setUserInput(u => u.slice(0, -1)); setMessage(''); }} style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '8px 16px',
              color: '#fca5a5', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto',
            }}>⌫</button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && gameStatus === 'playing' && (
        <div style={{
          background: mc.bg, border: `1px solid ${mc.border}`,
          color: mc.color, padding: '14px 18px',
          borderRadius: '12px', marginBottom: '16px',
          fontSize: '0.9rem', fontWeight: 500,
          position: 'relative', zIndex: 1,
        }}>{message}</div>
      )}

      {/* Hint display with Glassmorphic ARIA Layout */}
      {hintText && (
        <div style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '12px', padding: '12px 16px',
          marginTop: '12px', marginBottom: '16px', fontSize: '0.875rem',
          color: '#c4b5fd', fontStyle: 'italic',
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: hintAnim ? 'hintGlow 0.6s ease' : 'none',
        }}>
          <span style={{ fontStyle: 'normal', fontWeight: 'bold', color: '#a78bfa' }}>🤖 ARIA:</span>
          {loadingAi ? 'Analyzing sequence parameters...' : hintText}
        </div>
      )}

      {/* Solution display */}
      {showSolution && (
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc', padding: '14px 18px',
          borderRadius: '12px', marginBottom: '16px',
          fontSize: '1rem', fontFamily: 'monospace',
          position: 'relative', zIndex: 1,
        }}>
          💡 One solution: <strong style={{ color: 'white' }}>{solution}</strong> = 100
        </div>
      )}

      {/* Action buttons */}
      {gameStatus === 'playing' && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button 
            onClick={getHint} 
            disabled={loadingAi}
            style={{
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px', padding: '12px 20px',
              color: '#fcd34d', fontWeight: 600,
              fontSize: '0.875rem', cursor: loadingAi ? 'wait' : 'pointer',
            }}
          >
            💡 Ask ARIA {hintsUsed > 0 ? `(${hintsUsed})` : ''}
          </button>
          <button onClick={() => setShowSolution(s => !s)} style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px', padding: '12px 20px',
            color: '#a5b4fc', fontWeight: 600,
            fontSize: '0.875rem', cursor: 'pointer',
          }}>
            {showSolution ? '🙈 Hide' : '👁 Solution'}
          </button>
          <button onClick={startNewGame} style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none', borderRadius: '12px',
            padding: '12px 20px', color: 'white',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
            marginLeft: 'auto',
          }}>🔄 New Game</button>
        </div>
      )}

      {/* Win card */}
      {gameStatus === 'won' && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(16,185,129,0.1)',
          border: '2px solid rgba(16,185,129,0.4)',
          borderRadius: '24px', padding: '40px',
          textAlign: 'center', position: 'relative', zIndex: 1,
          animation: 'winGlow 2s ease infinite, popIn 0.4s ease forwards',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'popIn 0.5s ease forwards' }}>🏆</div>
          <h3 style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px' }}>
            You solved it!
          </h3>
          <p style={{ color: '#9ca3af', margin: '0 0 24px', fontSize: '0.9rem' }}>
            Hints used: <strong style={{ color: 'white' }}>{hintsUsed}</strong>
            {timerEnabled && <> &nbsp;|&nbsp; Time left: <strong style={{ color: '#a78bfa' }}>{formatTime(timeLeft)}</strong></>}
          </p>
          <button onClick={startNewGame} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', borderRadius: '14px',
            padding: '16px 48px', color: 'white',
            fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(16,185,129,0.4)',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >Play Again 🚀</button>
        </div>
      )}

      {/* Lost card */}
      {gameStatus === 'lost' && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(239,68,68,0.1)',
          border: '2px solid rgba(239,68,68,0.3)',
          borderRadius: '24px', padding: '40px',
          textAlign: 'center', position: 'relative', zIndex: 1,
          animation: 'popIn 0.4s ease forwards',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⏰</div>
          <h3 style={{ color: '#fca5a5', fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px' }}>
            Time's Up!
          </h3>
          <p style={{ color: '#9ca3af', margin: '0 0 8px', fontSize: '0.9rem' }}>
            The solution was:{' '}
            <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 700 }}>{solution}</span>
          </p>
          <button onClick={startNewGame} style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', borderRadius: '14px',
            padding: '16px 48px', color: 'white',
            fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(239,68,68,0.3)',
            marginTop: '16px',
          }}>Try Again 🔄</button>
        </div>
      )}
    </div>
  );
};

export default HectocSolo;