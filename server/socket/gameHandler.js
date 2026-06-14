const GameRoom = require('../models/GameRoom');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Player joins a specific match room socket channel
    socket.on('join_room', async ({ roomId, userId }) => {
      try {
        const room = await GameRoom.findOne({ roomId: roomId.toUpperCase() });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room: ${roomId}`);

        // If two players are in the room, start the match automatically
        if (room.players.length === 2 && room.status === 'waiting') {
          room.status = 'playing';
          
          // Generate an initial random 6-digit game sequence
          room.sequence = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 9) + 1
          ).join('');
          
          await room.save();

          // Notify everyone in the room that the game has officially begun
          io.to(roomId).emit('game_started', room);
        } else {
          // Notify the room creator that they are still waiting for an opponent
          socket.emit('room_updated', room);
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Server context error during join' });
      }
    });

    // Handle when a player submits an answer
    socket.on('submit_answer', async ({ roomId, userId, scoreAdded }) => {
      try {
        let room = await GameRoom.findOne({ roomId });
        if (!room || room.status !== 'playing') return;

        // Find the player who submitted the solution
        const playerIndex = room.players.findIndex(p => p.userId.toString() === userId);
        if (playerIndex === -1) return;

        // Increment their round score
        room.players[playerIndex].score += scoreAdded;

        // Advance the match structure state
        if (room.round >= room.maxRounds) {
          room.status = 'finished';
          await room.save();

          // Permanently award points to the winner's global profile account
          const winner = room.players[0].score > room.players[1].score ? room.players[0] : room.players[1];
          await User.findByIdAndUpdate(winner.userId, { $inc: { score: 100, gamesPlayed: 1 } });
          
          // Log a game played for the runner up too
          const loser = room.players[0].score > room.players[1].score ? room.players[1] : room.players[0];
          await User.findByIdAndUpdate(loser.userId, { $inc: { gamesPlayed: 1 } });

          io.to(roomId).emit('game_finished', room);
        } else {
          // Advance to the next round and roll a fresh sequence number
          room.round += 1;
          room.sequence = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 9) + 1
          ).join('');
          
          await room.save();
          io.to(roomId).emit('next_round', room);
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Handle abrupt player disconnects
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // In production, you can scan active rooms to handle forfeits here
    });
  });
};