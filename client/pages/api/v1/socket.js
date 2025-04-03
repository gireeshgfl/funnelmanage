import { Server } from 'socket.io';
import eventBus from '@/utils/eventBus';

const participants = {};

export default async function handler(req, res) {
  try {
    if (!res.socket.server.io) {
      console.log('Initializing Socket.IO server...');

      const io = new Server(res.socket.server, {
        cors: {
          origin: process.env.ALLOWED_ORIGIN || '*',
          methods: ['GET', 'POST'],
        },
        path: '/socket.io',
      });
      res.socket.server.io = io;

      io.on('connection', (socket) => {
        try {
          // Initial handshake: user data only
          const { userId, role, username } = socket.handshake.query;
          console.log(`User connecting... userId: ${userId}, role: ${role}, username: ${username}`);

          if (!userId || !role || !username) {
            console.warn(`Unauthorized connection attempt: ${socket.id}`);
            socket.emit('error', { message: 'Authentication required: userId, role, or username missing.' });
            socket.disconnect(true);
            return;
          }

          // Save basic user details in participants
          const userDetails = { userId, username, role, points: 0, emojis: [] };
          participants[userId] = userDetails;
          socket.userId = userId;

          // Send initial participants list (global)
          socket.emit('initialParticipants', Object.values(participants));
          console.log('Emitting userJoined with:', userDetails);
          eventBus.emit('userJoined', userDetails);

          // Listen for custom event "setSessionId" from client.
          // Update participant details and join the room.
          socket.on('setSessionId', (data) => {
            const { sessionId } = data;
            console.log(`Received setSessionId from socket ${socket.id}: ${sessionId}`);
            socket.sessionId = sessionId;
            socket.join(sessionId);
            // Update the participant's details with sessionId
            if (participants[socket.userId]) {
              participants[socket.userId].sessionId = sessionId;
            }
            console.log(`Socket ${socket.id} joined room ${sessionId}`);
            // Re-emit userJoined to that room so that only participants in the room get it.
            io.to(sessionId).emit('userJoined', participants[socket.userId]);
          });

          // NEW: Listen for emoji updates.
          socket.on('updateEmojis', (data) => {
            const { emojis } = data;
            if (participants[socket.userId]) {
              participants[socket.userId].emojis = emojis;
              // Emit the update along with the sessionId for proper room filtering.
              eventBus.emit('updateEmojis', { userId: socket.userId, emojis, sessionId: socket.sessionId });
            }
          });

          // NEW: Listen for student points update.
          socket.on('updateStudentPoints', (data) => {
            const { points } = data;
            if (participants[socket.userId]) {
              participants[socket.userId].points = points;
              eventBus.emit('updateStudentPoints', { studentId: socket.userId, points, sessionId: socket.sessionId });
            }
          });

          // NEW: Listen for "clearAllEmojis" event.
          socket.on('clearAllEmojis', () => {
            const room = socket.sessionId;
            console.log(`Received clearAllEmojis from socket ${socket.id} for room: ${room}`);
            if (room) {
              // Clear emojis for every participant in the same room.
              Object.keys(participants).forEach((uid) => {
                if (participants[uid].sessionId === room) {
                  participants[uid].emojis = [];
                  // Emit update for each participant in this room.
                  eventBus.emit('updateEmojis', { userId: uid, emojis: [], sessionId: room });
                }
              });
              // Optionally, broadcast a "clearAllEmojis" event to the room.
              io.to(room).emit('clearAllEmojis');
            }
          });

          // Handle disconnect.
          socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${userId}. Reason: ${reason}`);
            delete participants[userId];
            eventBus.emit('userLeft', { userId, sessionId: socket.sessionId });
          });

          // Handle chat messages and other events.
          socket.on('chatmessage', (data) => {
            console.log(`Received chat message from ${userId}:`, data);
            const room = data.sessionId || socket.sessionId;
            if (room) {
              eventBus.emit('chatmessage', { ...data, sessionId: room });
            } else {
              console.warn('No sessionId provided for chat message.');
            }
          });

          socket.on('pushMCQs', (mcqArray) => {
            console.log(`MCQs received from ${userId}`);
            eventBus.emit('pushMCQs', { mcqArray, sessionId: socket.sessionId });
          });

          socket.on('pushQuestion', (questionData) => {
            console.log(`Question received from ${userId}`);
            eventBus.emit('pushQuestion', { questionData, sessionId: socket.sessionId });
          });

          socket.on('pushCoupons', (coupons) => {
            console.log(`Coupons received from ${socket.userId}`);
            eventBus.emit('pushCoupons', { coupons, sessionId: socket.sessionId });
          });

          socket.on('error', (error) => {
            console.error(`Socket error from user ${userId}:`, error);
          });
        } catch (err) {
          console.error('Error during socket connection handling:', err);
          socket.emit('error', { message: 'Internal server error during connection.' });
          socket.disconnect(true);
        }
      });

      // EventBus listeners: broadcast events to a room if sessionId is provided.
      eventBus.on('userJoined', (userDetails) => {
        if (userDetails.sessionId) {
          io.to(userDetails.sessionId).emit('userJoined', userDetails);
        } else {
          io.emit('userJoined', userDetails);
        }
      });

      eventBus.on('userLeft', ({ userId, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('userLeft', { userId });
        } else {
          io.emit('userLeft', { userId });
        }
      });

      eventBus.on('updateEmojis', ({ userId, emojis, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('updateEmojis', { userId, emojis, sessionId });
        } else {
          io.emit('updateEmojis', { userId, emojis });
        }
      });

      eventBus.on('updateStudentPoints', ({ studentId, points, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('updateStudentPoints', { studentId, points, sessionId });
        } else {
          io.emit('updateStudentPoints', { studentId, points });
        }
      });

      eventBus.on('chatmessage', (data) => {
        if (data.sessionId) {
          console.log('Broadcasting chat message to room:', data.sessionId);
          io.to(data.sessionId).emit('recievemessage', data);
        } else {
          io.emit('recievemessage', data);
        }
      });

      eventBus.on('pushMCQs', ({ mcqArray, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('broadcastMCQs', mcqArray);
        } else {
          io.emit('broadcastMCQs', mcqArray);
        }
      });

      eventBus.on('pushQuestion', ({ questionData, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('pushQuestion', questionData);
        } else {
          io.emit('pushQuestion', questionData);
        }
      });

      eventBus.on('pushCoupons', ({ coupons, sessionId }) => {
        if (sessionId) {
          io.to(sessionId).emit('broadcastCoupons', coupons);
        } else {
          io.emit('broadcastCoupons', coupons);
        }
      });

      eventBus.on('sessionUpdated', (updatedData) => {
        if (updatedData.sessionId) {
          io.to(updatedData.sessionId).emit('sessionUpdated', updatedData);
        } else {
          io.emit('sessionUpdated', updatedData);
        }
      });

      console.log('Socket.IO server initialized');
    } else {
      console.log('Socket.IO server already running');
    }

    res.status(200).json({ message: 'Socket.IO server is running.' });
  } catch (error) {
    console.error('Failed to initialize Socket.IO server:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
