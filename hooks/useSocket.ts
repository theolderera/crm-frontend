import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Use environment variable or default to localhost:4000
    const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
    
    const socketInstance = io(url, {
      auth: {
        token: `Bearer ${token}`
      }
    });

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, connected };
}
