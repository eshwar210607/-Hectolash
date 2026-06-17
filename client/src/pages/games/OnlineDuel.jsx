import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { checkAnswer } from '../../utils/mathEngine'; // Adjust path if needed

const socket = io('http://localhost:5000');

const OnlineDuel = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const sequence = location.state?.sequence || '123456';
  const [userInput, setUserInput] = useState('');
  const [liveEvaluation, setLiveEvaluation] = useState('Awaiting formulation casts...');
  const [opponentProgress, setOpponentProgress] = useState('Waiting for opponent actions...');
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost, finished
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finalScorecard, setFinalScorecard] = useState(null);

  // Timer Metrics
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Join the dedicated game socket room channel
    socket.emit('join_room', { roomId, userId: 'dummy_or_real_id' }); // Handled on backend wrapper

    // Start clock tick tracker
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Listen to real-time keystroke progress of your opponent
    socket.on('opponent_progress_stream', ({ username, progressMessage }) => {
      setOpponentProgress(`${username}: ${progressMessage}`);
    });

    // Listen for final game over sync states
    socket.on('game_finished', (roomData) => {
      setGameStatus('finished');
      setFinalScorecard(roomData.players);
      clearInterval(timerRef.current);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off('opponent_progress_stream');
      socket.off('game_finished');
    };
  }, [roomId]);

  // Handle keystroke progress analysis without AI intervention
  const handleInputChange = async (e) => {
    const val = e.target.value.replace(/[^0-9+\-*/()]/g, '');
    setUserInput(val);

    if (!val) {
      setLiveEvaluation('Awaiting formulation casts...');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/game/evaluate-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ expression: val })
      });
      const data = await res.json();
      setLiveEvaluation(data.message);

      // Stream your evaluation state straight onto your rival's screen layout!
      socket.emit('submit_live_progress', {
        roomId,
        username: 'You', // Backend can replace or map this safely
        progressMessage: data.message
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitExpression = async () => {
    // Validate Hectoc digit presence constraints
    const userDigits = userInput.replace(/[+\-*/()]/g, '').split('').filter(Boolean).join('');
    if (userDigits !== sequence) {
      alert(`❌ Constraint Error! You must use all digits in exact order: ${sequence}`);
      return;
    }

    // Evaluate accuracy rules
    if (checkAnswer(userInput, sequence) || liveEvaluation.includes('perfect')) {
      clearInterval(timerRef.current);
      setGameStatus('waiting_for_opponent');
      setLiveEvaluation('🎯 Target reached! Transmitting score computation protocols...');

      try {
        const token = localStorage.getItem('token');
        await fetch('/api/game/submit-duel-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            roomId,
            hintsUsed,
            timeTaken: timeElapsed,
            finalExpression: userInput
          })
        });
        
        // Notify room of final completion status array check
        socket.emit('submit_answer', { roomId, scoreAdded: 0 }); // Triangulates finished loops on backend
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('❌ That expression does not equate to 100! Keep calibrating.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
      
      {/* Top Banner Status Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ margin: 0, color: 'white', fontWeight: 900 }}>⚔️ Active Duel</h2>
        <div style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '999px', padding: '6px 18px', color: '#a78bfa', fontWeight: 700 }}>
          ⏱️ Time: {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Sequence Display Card */}
      <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 12px', textTransform: 'uppercase' }}>Target Sequence Vector</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {sequence.split('').map((digit, i) => (
            <div key={i} style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))', border: '2px solid rgba(139,92,246,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>
              {digit}
            </div>
          ))}
        </div>
      </div>

      {/* Main Board Interaction Console */}
      {gameStatus === 'playing' && (
        <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder={`Type formula e.g. ${sequence[0]}+${sequence[1]}...`}
            style={{ width: '100%', background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '14px', color: 'white', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
          />
          <button onClick={handleSubmitExpression} style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', borderRadius: '12px', padding: '14px', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            Submit Matrix Solution
          </button>
        </div>
      )}

      {gameStatus === 'waiting_for_opponent' && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px', color: '#6ee7b7' }}>
          ⏳ Solution Submitted! Holding synchronization lines until opponent concludes operations...
        </div>
      )}

      {/* Live Monitoring Dashboard (Real-time Sync Metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
          <h5 style={{ margin: '0 0 6px', color: '#a78bfa' }}>Your Trajectory</h5>
          <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: '#d1d5db' }}>{liveEvaluation}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
          <h5 style={{ margin: '0 0 6px', color: '#fca5a5' }}>Rival Diagnostic</h5>
          <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: '#d1d5db' }}>{opponentProgress}</p>
        </div>
      </div>

      <button onClick={() => setHintsUsed(h => h + 1)} disabled={gameStatus !== 'playing'} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '10px 20px', color: '#fcd34d', fontSize: '0.85rem', cursor: 'pointer', display: 'block', margin: '0 auto 24px' }}>
        💡 Use Static Hint Link (Used: {hintsUsed})
      </button>

      {/* Score Settlement Screen Modal Card */}
      {gameStatus === 'finished' && finalScorecard && (
        <div style={{ background: 'rgba(124,58,237,0.1)', border: '2px solid rgba(139,92,246,0.4)', borderRadius: '24px', padding: '32px', textAlign: 'center' }}>
          <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 16px' }}>🏆 Match Settled! 🏆</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {finalScorecard.map((player, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <span style={{ color: 'white', fontWeight: 700 }}>{player.username || player.name}</span>
                <span style={{ color: '#6ee7b7', fontWeight: 800 }}>{player.score.toFixed(0)} XP Points</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', borderRadius: '12px', padding: '12px 32px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            Return to Main Command Core
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineDuel;