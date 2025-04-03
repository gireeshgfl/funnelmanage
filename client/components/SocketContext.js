import io from 'socket.io-client';
import { useEffect } from 'react';

useEffect(() => {
  const socket = io('http://localhost:3000');

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });

  socket.on('message', (data) => {
    console.log('Received message:', data);
  });

  return () => {
    socket.disconnect();
  };
}, []);
