// 🌟 MISTAKE FIXED: This must be line 1 so all environmental keys are ready instantly!
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const aiRoutes = require('./routes/ai'); // Safe to load now!

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS allowances for our React Frontend
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, replace with your specific frontend domain
    methods: ["GET", "POST"]
  }
});

// Middleware Configuration
app.use(cors());
app.use(express.json()); // Allows Express to read incoming JSON request bodies

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mount REST API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/game', require('./routes/game'));
app.use('/api/ai', aiRoutes);

// Initialize Real-time Socket Handler
require('./socket/gameHandler')(io);

// Base Health Check Route
app.get('/', (req, res) => {
  res.send('Maths Wizard Backend Server is running smoothly.');
});

// Spin Up Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening intently on port ${PORT}`);
});