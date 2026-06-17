import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Initialize socket client outside render context to prevent duplicate bindings
const socket = io('http://localhost:5000');

const OnlineLobby = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [queueStatus, setQueueStatus] = useState('idle'); // idle, searching
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  useEffect(() => {
    // 1. Fetch current authentic profile information via your backend profile endpoint
    const fetchProfileAndRegister = async () => {
      try {
        const token = localStorage.getItem('token'); // Grab your app auth token
        const res = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userProfile = await res.json();
        setCurrentUser(userProfile);

        // Notify socket system that user profile is logged in and active
        socket.emit('user_entering_lobby', { userId: userProfile._id });
        fetchLobbyPlayers();
      } catch (err) {
        console.error("Lobby profile registration failed:", err);
      }
    };

    fetchProfileAndRegister();

    // 2. Setup real-time web socket incoming events
    socket.on('lobby_updated', () => {
      fetchLobbyPlayers();
    });

    socket.on('incoming_duel_challenge', ({ challengerId, challengerName, roomName }) => {
      setIncomingChallenge({ challengerId, challengerName, roomName });
    });

    socket.on('match_started', ({ roomId, sequence }) => {
      // Direct user into a dedicated multiplayer screen room
      navigate(`/game/online-duel/${roomId}`, { state: { sequence } });
    });

    return () => {
      socket.off('lobby_updated');
      socket.off('incoming_duel_challenge');
      socket.off('match_started');
    };
  }, [navigate]);

  const fetchLobbyPlayers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/lobby-players', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOnlinePlayers(data);
    } catch (err) {
      console.error("Error updating player listing updates:", err);
    }
  };

  const handleChallengePlayer = (targetId) => {
    if (!currentUser) return;
    socket.emit('send_duel_request', {
      fromUser: { id: currentUser._id, username: currentUser.name },
      toUserId: targetId
    });
    alert("Challenge vector transmitted! Awaiting rival response...");
  };

  const handleAcceptChallenge = () => {
    if (!incomingChallenge || !currentUser) return;
    socket.emit('accept_duel_challenge', {
      challengerId: incomingChallenge.challengerId,
      targetId: currentUser._id,
      roomName: incomingChallenge.roomName
    });
    setIncomingChallenge(null);
  };

  const handleJoinQueue = () => {
    if (!currentUser) return;
    setQueueStatus('searching');
    socket.emit('join_random_queue', { userId: currentUser._id });
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#9ca3af', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '24px' }}>← Back to Menu</button>
      
      <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '24px', padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '2rem', color: 'white', fontWeight: 900 }}>⚡ Online Duel Arena ⚡</h1>
        <p style={{ color: '#9ca3af', margin: '0 0 24px' }}>Test your operational scaling velocities live against alternative engineering wizards</p>
        
        <button onClick={handleJoinQueue} disabled={queueStatus === 'searching'} style={{ background: queueStatus === 'searching' ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', borderRadius: '14px', padding: '16px 40px', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: queueStatus === 'searching' ? 'not-allowed' : 'pointer', boxShadow: queueStatus === 'searching' ? 'none' : '0 8px 25px rgba(124,58,237,0.4)' }}>
          {queueStatus === 'searching' ? '🔍 Searching for Rival Matrix...' : '🎮 Match Random Opponent'}
        </button>
      </div>

      {incomingChallenge && (
        <div style={{ background: 'rgba(236,72,153,0.15)', border: '2px solid rgba(236,72,153,0.5)', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'white', margin: '0 0 4px', fontSize: '1.1rem' }}>⚔️ Incoming Challenge!</h4>
            <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.9rem' }}><strong style={{ color: 'white' }}>{incomingChallenge.challengerName}</strong> wants to run a Hectoc Duel!</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIncomingChallenge(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', color: '#9ca3af', cursor: 'pointer' }}>Decline</button>
            <button onClick={handleAcceptChallenge} style={{ background: '#ec4899', border: 'none', borderRadius: '8px', padding: '8px 20px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Accept ⚡</button>
          </div>
        </div>
      )}

      <h3 style={{ color: 'white', fontWeight: 800, margin: '0 0 16px' }}>🟢 Players Currently Online</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {onlinePlayers.length === 0 ? (
          <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Lobby empty. Open another window to spin up simulated rivals!</p>
        ) : (
          onlinePlayers.map(player => (
            <div key={player._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>{player.name}</span>
                <span style={{ marginLeft: '12px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '999px', background: player.lobbyStatus === 'playing' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: player.lobbyStatus === 'playing' ? '#fca5a5' : '#6ee7b7' }}>
                  {player.lobbyStatus === 'playing' ? 'In Match' : 'Available'}
                </span>
              </div>
              <button onClick={() => handleChallengePlayer(player._id)} disabled={player.lobbyStatus === 'playing'} style={{ background: player.lobbyStatus === 'playing' ? 'transparent' : 'rgba(124,58,237,0.15)', border: `1px solid ${player.lobbyStatus === 'playing' ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.3)'}`, borderRadius: '10px', padding: '8px 16px', color: player.lobbyStatus === 'playing' ? '#4b5563' : '#a78bfa', fontWeight: 600, cursor: player.lobbyStatus === 'playing' ? 'not-allowed' : 'pointer' }}>Challenge ⚔️</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineLobby;