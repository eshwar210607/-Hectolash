const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/user/profile
// @desc    Get current user's profile details
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user.id is brought in by our auth middleware via the JWT
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/user/leaderboard
// @desc    Get top users sorted by high score
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    // Fetch top 10 users sorted by score in descending order
    const leaders = await User.find()
      .select('name score gamesPlayed')
      .sort({ score: -1 })
      .limit(10);
      
    res.json(leaders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// =========================================================================
// ⚔️ REAL-TIME LOBBY USER FETCH EXTENSION ROUTE
// =========================================================================

// @route   GET /api/user/lobby-players
// @desc    Get all active online users excluding the current player
// @access  Private
router.get('/lobby-players', auth, async (req, res) => {
  try {
    // Find all users who are currently marked online
    // Exclude the current request user id, and strip the password hash for safety
    const onlinePlayers = await User.find({
      _id: { $ne: req.user.id },
      isOnline: true
    }).select('name score lobbyStatus');

    res.json(onlinePlayers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error fetching online lobby pool');
  }
});

module.exports = router;