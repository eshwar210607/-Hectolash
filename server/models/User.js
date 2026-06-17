const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0, // Used for the global leaderboard ranking
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  // =========================================================================
  // ⚔️ NEW REAL-TIME LOBBY EXTENSION FIELDS (Safe for existing profiles)
  // =========================================================================
  isOnline: {
    type: Boolean,
    default: false, // Tracks if user is actively logged into the app instance
  },
  lobbyStatus: {
    type: String,
    enum: ['idle', 'searching', 'playing'],
    default: 'idle', // Idle = visible in list, Searching = in random queue, Playing = in-game
  },
  socketId: {
    type: String,
    default: null, // Holds active websocket session identifier for routing challenges
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt fields
});

module.exports = mongoose.model('User', UserSchema);