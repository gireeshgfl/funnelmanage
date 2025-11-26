import { Server } from 'socket.io';
import eventBus from '@/utils/eventBus';

// Enable/disable detailed debugging
const DEBUG = true;

// Debug logging helper
const debug = (message, data = null) => {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[DEBUG] ${message}`);
    } ``
  }
};

// Track all emitted events to detect duplicates
const emittedEvents = {
  trackEvent: (eventName, userId, sessionId) => {
    const key = `${eventName}:${userId}:${sessionId}`;
    if (!emittedEvents[key]) {
      emittedEvents[key] = 0;
    }
    emittedEvents[key]++;

    if (emittedEvents[key] > 1) {
      console.warn(`⚠️ DUPLICATE EVENT: ${key} emitted ${emittedEvents[key]} times`);
    }

    return emittedEvents[key];
  },
  reset: () => {
    Object.keys(emittedEvents).forEach(key => {
      if (key !== 'trackEvent' && key !== 'reset') {
        delete emittedEvents[key];
      }
    });
  }
};

const participants = {};

export default async function handler(req, res) {
  try {
    if (!res.socket.server.io) {
      debug('Initializing Socket.IO server...');
      debug(`Socket Path: /funnel-management/socket.io`);

      const io = new Server(res.socket.server, {
        cors: {
          origin: process.env.ALLOWED_ORIGIN || '*',
          methods: ['GET', 'POST'],
        },
        path: '/funnel-management/socket.io',
      });
      res.socket.server.io = io;

      // Debug engine events
      io.engine.on("connection", (rawSocket) => {
        debug(`🔌 ENGINE CONNECTION: ${rawSocket.id} (transport: ${rawSocket.transport.name})`);

        rawSocket.on("close", (reason) => {
          debug(`🔌 ENGINE CLOSE: ${rawSocket.id} (reason: ${reason})`);
        });
      });

      io.engine.on("initial_headers", (headers, req) => {
        debug(`🔌 ENGINE HEADERS: ${req.url}`);
      });

      io.engine.on("connection_error", (err) => {
        debug(`🔌 ENGINE ERROR: ${err.code} - ${err.message}`);
      });

      // Debug all outgoing socket emissions
      const originalEmit = io.emit;
      io.emit = function (eventName, ...args) {
        debug(`🔴 SOCKET GLOBAL EMIT: ${eventName}`);
        return originalEmit.apply(this, [eventName, ...args]);
      };

      io.on('connection', (socket) => {
        try {
          // Patch socket.emit for debugging
          const originalSocketEmit = socket.emit;
          socket.emit = function (eventName, ...args) {
            debug(`🟠 SOCKET DIRECT EMIT (${socket.id}): ${eventName}`,
              args[0] ? args[0] : 'No data');
            return originalSocketEmit.apply(this, [eventName, ...args]);
          };

          // Patch socket.to/in for debugging
          const originalTo = socket.to;
          socket.to = function (room) {
            debug(`🟡 SOCKET TO ROOM (${socket.id}): ${room}`);
            return originalTo.apply(this, [room]);
          };

          // Initial handshake: user data only
          const { userId, role, username } = socket.handshake.query;
          debug(`User connecting... userId: ${userId}, role: ${role}, username: ${username}, socketId: ${socket.id}`);

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

          // Send initial participants list to new user only
          debug(`Sending initialParticipants to new user ${userId}`);
          socket.emit('initialParticipants', Object.values(participants));

          // Initialize session tracking for this user
          socket.hasJoinedSession = false;

          // Don't emit userJoined until they join a session
          // We'll do this only when they set a sessionId

          // Listen for custom event "setSessionId" from client
          socket.on('setSessionId', (data) => {
            const { sessionId } = data;
            debug(`Received setSessionId from socket ${socket.id}: ${sessionId}`);

            // Check if the user is already in the requested session
            if (socket.sessionId === sessionId) {
              debug(`User ${userId} is already in session ${sessionId}, ignoring.`);
              return;
            }

            // If user already in a session, leave it first
            if (socket.sessionId) {
              debug(`User ${userId} leaving previous session ${socket.sessionId}`);
              socket.leave(socket.sessionId);
            }

            socket.sessionId = sessionId;
            socket.join(sessionId);

            // Update participant's sessionId
            if (participants[socket.userId]) {
              participants[socket.userId].sessionId = sessionId;
            }
            debug(`Socket ${socket.id} joined room ${sessionId}`);

            if (!socket.hasJoinedSession) {
              debug(`First time session join for ${userId}, emitting userJoined via eventBus`);
              socket.hasJoinedSession = true;
              eventBus.emit('userJoined', {
                ...participants[socket.userId],
                socketId: socket.id,
                isFirstJoin: true
              });
            } else {
              debug(`User ${userId} changed session, emitting sessionChanged via eventBus`);
              eventBus.emit('sessionChanged', {
                userId: socket.userId,
                sessionId,
                socketId: socket.id
              });
            }
          });

          // Listen for emoji updates
          socket.on('updateEmojis', (data) => {
            const { emojis } = data;
            debug(`Received updateEmojis from ${userId}:`, emojis);

            if (participants[socket.userId]) {
              // Update local state with complete participant data
              participants[socket.userId] = {
                ...participants[socket.userId],
                emojis: Array.isArray(emojis) ? emojis : [emojis].filter(Boolean),
                sessionId: socket.sessionId // Ensure sessionId is included
              };

              // Broadcast via eventBus with complete participant data
              debug(`Broadcasting updateEmojis via eventBus for ${userId}`);
              eventBus.emit('updateEmojis', {
                ...participants[socket.userId], // Include all participant properties
                socketId: socket.id
              });
            }
          });

          // Listen for student points update
          socket.on('updateStudentPoints', (data) => {
            const { points } = data;
            debug(`Received updateStudentPoints from ${userId}: ${points}`);

            if (participants[socket.userId]) {
              // Update local state first
              participants[socket.userId].points = points;

              // Then broadcast via eventBus
              debug(`Broadcasting updateStudentPoints via eventBus for ${userId}`);
              eventBus.emit('updateStudentPoints', {
                studentId: socket.userId,
                points,
                sessionId: socket.sessionId,
                socketId: socket.id
              });
            }
          });

          // Listen for "clearAllEmojis" event
          socket.on('clearAllEmojis', () => {
            const room = socket.sessionId;
            debug(`Received clearAllEmojis from socket ${socket.id} for room: ${room}`);

            if (room) {
              // Clear emojis for every participant in the same room
              Object.keys(participants).forEach((uid) => {
                if (participants[uid].sessionId === room) {
                  participants[uid].emojis = [];
                }
              });

              // Emit via eventBus with originating socketId
              debug(`Broadcasting clearAllEmojis via eventBus for room ${room}`);
              eventBus.emit('clearAllEmojis', {
                sessionId: room,
                socketId: socket.id,
                participants: Object.values(participants)
                  .filter(p => p.sessionId === room)
                  .map(p => ({ userId: p.userId }))
              });
            }
          });

          // Handle disconnect
          socket.on('disconnect', (reason) => {
            debug(`User disconnected: ${userId}. Reason: ${reason}`);
            const sessionId = socket.sessionId || (participants[userId] && participants[userId].sessionId);

            debug(`Broadcasting userLeft via eventBus for ${userId}`);
            eventBus.emit('userLeft', {
              userId,
              sessionId,
              socketId: socket.id
            });

            delete participants[userId];
          });

          // Handle chat messages
          socket.on('chatmessage', (data) => {
            debug(`Received chat message from ${userId}:`, data);
            const room = data.sessionId || socket.sessionId;

            if (room) {
              debug(`Broadcasting chatmessage via eventBus for room ${room}`);
              eventBus.emit('chatmessage', {
                ...data,
                sessionId: room,
                socketId: socket.id
              });
            } else {
              console.warn('No sessionId provided for chat message.');
            }
          });

          socket.on('pushMCQs', (mcqArray) => {
            debug(`MCQs received from ${userId}`);
            eventBus.emit('pushMCQs', {
              mcqArray,
              sessionId: socket.sessionId,
              socketId: socket.id
            });
          });

          socket.on('pushQuestion', (questionData) => {
            debug(`Question received from ${userId}`);
            eventBus.emit('pushQuestion', {
              questionData,
              sessionId: socket.sessionId,
              socketId: socket.id
            });
          });

          socket.on('pushCoupons', (coupons) => {
            debug(`Coupons received from ${socket.userId}`);
            eventBus.emit('pushCoupons', {
              coupons,
              sessionId: socket.sessionId,
              socketId: socket.id
            });
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

      // Patch eventBus.emit for debugging
      const originalEventBusEmit = eventBus.emit;
      eventBus.emit = function (eventName, ...args) {
        debug(`🟢 EVENTBUS EMIT: ${eventName}`, args[0] ? args[0] : 'No data');
        return originalEventBusEmit.apply(this, [eventName, ...args]);
      };

      // EventBus listeners: broadcast events to a room, excluding the originating socket
      eventBus.on('userJoined', (userDetails) => {
        const { userId, sessionId, socketId, isFirstJoin } = userDetails;

        // Track this event to detect duplicates
        const count = emittedEvents.trackEvent('userJoined', userId, sessionId || 'global');

        debug(`EVENTBUS HANDLER: userJoined for ${userId} in ${sessionId || 'global'} (count: ${count})`);

        if (sessionId) {
          // Only broadcast to the specific room
          debug(`Broadcasting userJoined to room ${sessionId} excluding socket ${socketId}`);
          io.in(sessionId).except(socketId).emit('userJoined', userDetails);
        } else if (isFirstJoin) {
          // Global broadcast for first-time users without a session yet
          debug(`Broadcasting userJoined globally excluding socket ${socketId}`);
          io.except(socketId).emit('userJoined', userDetails);
        }
      });

      eventBus.on('sessionChanged', ({ userId, sessionId, socketId }) => {
        debug(`EVENTBUS HANDLER: sessionChanged for ${userId} to ${sessionId}`);

        // Notify others in the new session about this user
        io.in(sessionId).except(socketId).emit('userJoined', participants[userId]);
      });

      eventBus.on('userLeft', ({ userId, sessionId, socketId }) => {
        // Track this event to detect duplicates
        const count = emittedEvents.trackEvent('userLeft', userId, sessionId || 'global');

        debug(`EVENTBUS HANDLER: userLeft for ${userId} from ${sessionId || 'global'} (count: ${count})`);

        if (sessionId) {
          debug(`Broadcasting userLeft to room ${sessionId}`);
          io.in(sessionId).emit('userLeft', { userId, sessionId });
        } else {
          debug(`Broadcasting userLeft globally`);
          io.emit('userLeft', { userId });
        }
      });

      eventBus.on('updateEmojis', (participantData) => {
        const { userId, sessionId, socketId } = participantData;

        // Track this event to detect duplicates
        const count = emittedEvents.trackEvent('updateEmojis', userId, sessionId || 'global');

        debug(`EVENTBUS HANDLER: updateEmojis for ${userId} in ${sessionId || 'global'} (count: ${count})`);

        // Prepare complete participant data for broadcast
        const broadcastData = {
          userId,
          username: participantData.username,
          role: participantData.role,
          emojis: participantData.emojis,
          points: participantData.points || 0,
          sessionId: participantData.sessionId
        };

        if (sessionId) {
          debug(`Broadcasting updateEmojis to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('updateEmojis', broadcastData);
        } else {
          debug(`Broadcasting updateEmojis globally except ${socketId}`);
          io.except(socketId).emit('updateEmojis', broadcastData);
        }
      });

      eventBus.on('clearAllEmojis', ({ sessionId, socketId, participants }) => {
        debug(`EVENTBUS HANDLER: clearAllEmojis for room ${sessionId}`);

        if (sessionId) {
          debug(`Broadcasting clearAllEmojis to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('clearAllEmojis', {
            cleared: true,
            participants
          });

          // Also send to originator with different flag
          debug(`Confirming clearAllEmojis to originator ${socketId}`);
          io.to(socketId).emit('clearAllEmojis', {
            confirmed: true,
            participants
          });
        }
      });

      eventBus.on('updateStudentPoints', ({ studentId, points, sessionId, socketId }) => {
        // Track this event to detect duplicates
        const count = emittedEvents.trackEvent('updateStudentPoints', studentId, sessionId || 'global');

        debug(`EVENTBUS HANDLER: updateStudentPoints for ${studentId} in ${sessionId || 'global'} (count: ${count})`);

        if (sessionId) {
          debug(`Broadcasting updateStudentPoints to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('updateStudentPoints', { studentId, points, sessionId });
        } else {
          debug(`Broadcasting updateStudentPoints globally except ${socketId}`);
          io.except(socketId).emit('updateStudentPoints', { studentId, points, sessionId });
        }
      });

      eventBus.on('chatmessage', (data) => {
        const { userId, sessionId, socketId } = data;

        // Track this event to detect duplicates
        const count = userId ? emittedEvents.trackEvent('chatmessage', userId, sessionId || 'global') : 0;

        debug(`EVENTBUS HANDLER: chatmessage in ${sessionId || 'global'} ${userId ? `(count: ${count})` : ''}`);

        if (sessionId) {
          debug(`Broadcasting chatmessage to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('chatmessage', data);
        } else {
          debug(`Broadcasting chatmessage globally except ${socketId}`);
          io.except(socketId).emit('chatmessage', data);
        }
      });

      eventBus.on('pushMCQs', ({ mcqArray, sessionId, socketId }) => {
        debug(`EVENTBUS HANDLER: pushMCQs for room ${sessionId || 'global'}`);

        if (sessionId) {
          debug(`Broadcasting MCQs to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('broadcastMCQs', mcqArray);
        } else {
          debug(`Broadcasting MCQs globally except ${socketId}`);
          io.except(socketId).emit('broadcastMCQs', mcqArray);
        }
      });

      eventBus.on('pushQuestion', ({ questionData, sessionId, socketId }) => {
        debug(`EVENTBUS HANDLER: pushQuestion for room ${sessionId || 'global'}`);

        if (sessionId) {
          debug(`Broadcasting question to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('pushQuestion', questionData);
        } else {
          debug(`Broadcasting question globally except ${socketId}`);
          io.except(socketId).emit('pushQuestion', questionData);
        }
      });

      eventBus.on('pushCoupons', ({ coupons, sessionId, socketId }) => {
        debug(`EVENTBUS HANDLER: pushCoupons for room ${sessionId || 'global'}`);

        if (sessionId) {
          debug(`Broadcasting coupons to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('broadcastCoupons', coupons);
        } else {
          debug(`Broadcasting coupons globally except ${socketId}`);
          io.except(socketId).emit('broadcastCoupons', coupons);
        }
      });

      eventBus.on('sessionUpdated', (updatedData) => {
        const { sessionId, socketId } = updatedData;

        debug(`EVENTBUS HANDLER: sessionUpdated for room ${sessionId || 'global'}`);

        if (sessionId) {
          debug(`Broadcasting sessionUpdated to room ${sessionId} except ${socketId}`);
          io.in(sessionId).except(socketId).emit('sessionUpdated', updatedData);
        } else {
          debug(`Broadcasting sessionUpdated globally except ${socketId}`);
          io.except(socketId).emit('sessionUpdated', updatedData);
        }
      });

      // Reset event tracking every 10 minutes to prevent memory leaks
      setInterval(() => {
        debug('Resetting event tracking counters');
        emittedEvents.reset();
      }, 10 * 60 * 1000);

      debug('Socket.IO server initialized');
    } else {
      debug('Socket.IO server already running');
    }

    res.status(200).json({ message: 'Funnel Socket.IO server is running.' });
  } catch (error) {
    console.error('Failed to initialize Socket.IO server:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}