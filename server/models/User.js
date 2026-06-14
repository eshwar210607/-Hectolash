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
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt fields
});

module.exports = mongoose.model('User', UserSchema);