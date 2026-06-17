const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const GameRoom = require('../models/GameRoom');
const User = require('../models/User');

// @route   POST /api/game/create
// @desc    Create a new game room
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a unique short 6-character code for the room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newRoom = new GameRoom({
      roomId,
      players: [{
        userId: user._id,
        name: user.name,
        score: 0
      }],
      status: 'waiting'
    });

    const room = await newRoom.save();
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/game/join
// @desc    Join an existing room using a code
// @access  Private
router.post('/join', auth, async (req, res) => {
  const { roomId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the room by its custom code
    let room = await GameRoom.findOne({ roomId: roomId.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Game room not found' });

    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Game has already started or finished' });
    }

    // Check if the user is already in the room
    const isPlayerAlreadyIn = room.players.some(p => p.userId.toString() === user._id.toString());
    
    if (!isPlayerAlreadyIn) {
      if (room.players.length >= 2) {
        return res.status(400).json({ message: 'Room is full' });
      }
      
      room.players.push({
        userId: user._id,
        name: user.name,
        score: 0
      });
      
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// =========================================================================
// ⚔️ MULTIPLAYER DUEL EXTENSION ROUTES (SAFE SIDE-BY-SIDE ADDITIONS)
// =========================================================================

// @route   POST /api/game/evaluate-progress
// @desc    Calculate proximity to 100 on keystroke without AI intervention
// @access  Private
router.post('/evaluate-progress', auth, async (req, res) => {
  const { expression } = req.body;
  
  try {
    // Standard safe string filter to allow only numbers and basic operators
    const sanitized = expression.replace(/[^0-9+\-*/()]/g, '');
    if (!sanitized) return res.json({ message: "Awaiting formulation casts..." });
    
    // Evaluate expression value strictly using native JavaScript parameters
    const result = Function(`"use strict"; return (${sanitized})`)();
    
    if (result === 100) {
      return res.json({ status: 'perfect', message: "🎯 Expression evaluates perfectly to 100!" });
    }
    
    const absoluteDelta = Math.abs(100 - result);
    if (absoluteDelta <= 10) {
      return res.json({ status: 'hot', message: `🔥 Scalding hot! Yields value: ${result} (Only ${absoluteDelta} away!)` });
    }
    if (absoluteDelta <= 25) {
      return res.json({ status: 'warm', message: `☀️ Getting warm! Yields value: ${result}` });
    }
    return res.json({ status: 'cold', message: `❄️ Chilly trajectory... Current evaluation yields: ${result}` });
  } catch (err) {
    return res.json({ status: 'parsing', message: "🛠️ Structuring mathematical terms..." });
  }
});

// @route   POST /api/game/submit-duel-result
// @desc    Calculate composite multi-player scores and settle match updates
// @access  Private
router.post('/submit-duel-result', auth, async (req, res) => {
  const { roomId, hintsUsed, timeTaken, finalExpression } = req.body;
  const userId = req.user.id;

  try {
    let room = await GameRoom.findOne({ roomId: roomId.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Active arena session room not found' });

    const playerIndex = room.players.findIndex(p => p.userId.toString() === userId);
    if (playerIndex === -1) return res.status(403).json({ message: 'Player profile mismatch for this room session' });

    // Composite scoring calculation logic
    const baseWinPoints = 500;
    const computedScore = Math.max(0, baseWinPoints - (hintsUsed * 30) - (timeTaken * 2));

    // Save details to the specific user's sub-document in your GameRoom collection model
    room.players[playerIndex].score = computedScore;
    
    // Check if your sub-document model supports temporary assignment keys, otherwise push safely
    room.markModified('players');

    // If both users finished calculations, wrap up status tiers and finalize winner metrics
    const playersSubmitted = room.players.filter(p => p.score > 0);
    
    if (room.players.length === 2 && playersSubmitted.length === 2) {
      room.status = 'finished';
      await room.save();

      const p1 = room.players[0];
      const p2 = room.players[1];

      // Declare winner identity from scores rather than clock ticks alone
      const winnerId = p1.score > p2.score ? p1.userId : p2.userId;
      const loserId = p1.score > p2.score ? p2.userId : p1.userId;

      await User.findByIdAndUpdate(winnerId, { $inc: { score: 100, gamesPlayed: 1 } });
      await User.findByIdAndUpdate(loserId, { $inc: { gamesPlayed: 1 } });
      
      // Update statuses to make them available for matchmaking lists again
      await User.updateMany({ _id: { $in: [p1.userId, p2.userId] } }, { lobbyStatus: 'idle' });
    } else {
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error processing match score matrix');
  }
});

module.exports = router;