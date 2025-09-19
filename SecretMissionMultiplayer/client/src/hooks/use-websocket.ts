import { useState, useEffect, useRef } from 'react';

export function useWebSocket(path: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}${path}`;
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
        };

        newSocket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000));
          }
        };

        newSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        setSocket(newSocket);

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [path]);

  return { socket, isConnected };
}
