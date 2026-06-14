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

module.exports = router;