const GameRoom = require('../models/GameRoom');
const User = require('../models/User');
const { generateSequence, findExpression } = require('../utils/mathEngine');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // =========================================================================
    // ⚡ CURRENT SYSTEM LISTENERS (Lightning Math / Classic Rooms)
    // =========================================================================
    
    socket.on('join_room', async ({ roomId, userId }) => {
      try {
        const room = await GameRoom.findOne({ roomId: roomId.toUpperCase() });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room: ${roomId}`);

        if (room.players.length === 2 && room.status === 'waiting') {
          room.status = 'playing';
          room.sequence = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 9) + 1
          ).join('');
          
          await room.save();
          io.to(roomId).emit('game_started', room);
        } else {
          socket.emit('room_updated', room);
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Server context error during join' });
      }
    });

    socket.on('submit_answer', async ({ roomId, userId, scoreAdded }) => {
      try {
        let room = await GameRoom.findOne({ roomId });
        if (!room || room.status !== 'playing') return;

        const playerIndex = room.players.findIndex(p => p.userId.toString() === userId);
        if (playerIndex === -1) return;

        room.players[playerIndex].score += scoreAdded;

        if (room.round >= room.maxRounds) {
          room.status = 'finished';
          await room.save();

          const winner = room.players[0].score > room.players[1].score ? room.players[0] : room.players[1];
          await User.findByIdAndUpdate(winner.userId, { $inc: { score: 100, gamesPlayed: 1 } });
          
          const loser = room.players[0].score > room.players[1].score ? room.players[1] : room.players[0];
          await User.findByIdAndUpdate(loser.userId, { $inc: { gamesPlayed: 1 } });

          io.to(roomId).emit('game_finished', room);
        } else {
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


    // =========================================================================
    // ⚔️ NEW EXTENSION LISTENERS (Online Hectoc Matchmaking & Duels)
    // =========================================================================

    // 1. Sync socket ID and update lobby list when a player goes online
    socket.on('user_entering_lobby', async ({ userId }) => {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lobbyStatus: 'idle', socketId: socket.id });
        io.emit('lobby_updated'); // Alert everyone in the lobby to refresh their lists
      } catch (err) {
        console.error("Lobby registration error:", err);
      }
    });

    // 2. Direct Challenge: Route an invite directly to a specific target player's socket connection
    socket.on('send_duel_request', async ({ fromUser, toUserId }) => {
      try {
        const targetPlayer = await User.findById(toUserId);
        if (targetPlayer && targetPlayer.isOnline && targetPlayer.lobbyStatus === 'idle') {
          io.to(targetPlayer.socketId).emit('incoming_duel_challenge', {
            challengerId: fromUser.id,
            challengerName: fromUser.username,
            roomName: `duel_${socket.id}`
          });
        }
      } catch (err) {
        console.error("Challenge delivery error:", err);
      }
    });

    // 3. Direct Challenge Acceptance: Build a custom dynamic Room allocation matching GameRoom architecture
    socket.on('accept_duel_challenge', async ({ challengerId, targetId, roomName }) => {
      try {
        const p1 = await User.findById(challengerId);
        const p2 = await User.findById(targetId);

        const gameSequence = generateSequence(); // Your standard DFS generator script utility

        // Utilize your existing GameRoom model, customizing properties for Hectoc Duels
        const duelRoom = new GameRoom({
          roomId: roomName.toUpperCase(),
          players: [
            { userId: p1._id, name: p1.name, score: 0 },
            { userId: p2._id, name: p2.name, score: 0 }
          ],
          sequence: gameSequence,
          status: 'playing',
          round: 1,
          maxRounds: 1 // Match resolves over a single intensive 6-digit evaluation cycle
        });
        await duelRoom.save();

        // Prevent cross-match queue conflicts by changing states to playing
        await User.updateMany({ _id: { $in: [challengerId, targetId] } }, { lobbyStatus: 'playing' });

        socket.join(roomName);
        
        // Grab the challenger's connection instance and pull them into the room canal
        const p1Socket = io.sockets.sockets.get(p1.socketId);
        if (p1Socket) p1Socket.join(roomName);

        io.to(roomName).emit('match_started', { roomId: roomName, sequence: gameSequence });
        io.emit('lobby_updated');
      } catch (err) {
        console.error("Duel initialization error:", err);
      }
    });

    // 4. Random Matchmaking Queue handler
    socket.on('join_random_queue', async ({ userId }) => {
      try {
        await User.findByIdAndUpdate(userId, { lobbyStatus: 'searching' });
        io.emit('lobby_updated');

        // Check if there's any other player currently searching
        const opponent = await User.findOne({ _id: { $ne: userId }, isOnline: true, lobbyStatus: 'searching' });

        if (opponent) {
          const p1 = await User.findById(userId);
          const roomName = `random_${userId}_${opponent._id}`;
          const gameSequence = generateSequence();

          const randomRoom = new GameRoom({
            roomId: roomName.toUpperCase(),
            players: [
              { userId: p1._id, name: p1.name, score: 0 },
              { userId: opponent._id, name: opponent.name, score: 0 }
            ],
            sequence: gameSequence,
            status: 'playing',
            round: 1,
            maxRounds: 1
          });
          await randomRoom.save();

          await User.updateMany({ _id: { $in: [userId, opponent._id] } }, { lobbyStatus: 'playing' });

          socket.join(roomName);
          const oppSocket = io.sockets.sockets.get(opponent.socketId);
          if (oppSocket) oppSocket.join(roomName);

          io.to(roomName).emit('match_started', { roomId: roomName, sequence: gameSequence });
          io.emit('lobby_updated');
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
      }
    });

    // 5. LIVE KEYSYNC PROJECTION MESSAGE PIPE: Broadcasts local DFS calculation status updates down to opponent
    socket.on('submit_live_progress', ({ roomId, username, progressMessage }) => {
      socket.to(roomId).emit('opponent_progress_stream', { username, progressMessage });
    });


    // =========================================================================
    // 🧹 DISCONNECT CLEANUP SAFETY LAYER
    // =========================================================================
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      try {
        // Automatically reset user properties if they drop connections
        const offlineUser = await User.findOneAndUpdate(
          { socketId: socket.id },
          { isOnline: false, lobbyStatus: 'idle', socketId: null }
        );
        if (offlineUser) {
          io.emit('lobby_updated');
        }
      } catch (err) {
        console.error("Disconnect cleanup failed:", err);
      }
    });
  });
};