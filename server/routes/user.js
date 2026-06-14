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

module.exports = router;