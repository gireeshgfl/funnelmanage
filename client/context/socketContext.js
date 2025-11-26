'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

let socketInstance = null;

const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const role = user?.role;
  const username = user?.username;

  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (userId && role && username) {
      if (!socketInstance) {
        console.log('Initializing socket with user ID:', userId, 'role:', role, 'username:', username);

        // Optional: if backend requires this for routing/warm-up
        fetch('/funnel-management/api/fv1/socket')
          .then((response) => {
            console.log('WebSocket endpoint response:', response.status);

            socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
              path: '/socket.io',
              transports: ['websocket'],
              query: { userId, role, username },
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              autoConnect: true,
            });

            // Event Listeners
            socketInstance.on('connect', () => {
              console.log('Socket connected successfully:', socketInstance.id);
              setConnectionStatus('connected');
            });

            socketInstance.on('disconnect', (reason) => {
              console.log('Socket disconnected:', reason);
              setConnectionStatus('disconnected');
            });

            socketInstance.on('connect_error', (error) => {
              console.error('Socket connection error:', error);
              setConnectionStatus('error');
            });

            socketInstance.onAny((eventName, ...args) => {
              console.log('Socket received event:', eventName, {
                args,
                dataStructure: JSON.stringify(args[0], null, 2),
              });
            });

            setSocket(socketInstance);
          })
          .catch((error) => {
            console.error('Error fetching WebSocket endpoint:', error);
            setConnectionStatus('error');
          });
      }
    } else {
      if (socketInstance) {
        console.log('Disconnecting socket due to missing user details');
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnectionStatus('disconnected');
      }
    }

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket instance');
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnectionStatus('disconnected');
      }
    };
  }, [userId, role, username]);

  const contextValue = {
    socket: socketInstance,
    connectionStatus,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
