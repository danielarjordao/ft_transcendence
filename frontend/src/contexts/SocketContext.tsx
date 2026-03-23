import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket.service';

interface SocketContextValue {
  isConnected: boolean;
  joinRoom: (workspaceId: string) => void;
  leaveRoom: (workspaceId: string) => void;
  socket: typeof socketService;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Pegar token do localStorage (chave: 'accessToken')
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.warn('⚠️ Socket: Token not found in localStorage');
      return;
    }

    console.log('🔌 Socket: Connecting with token...');
    socketService.connect(token);

    // Listeners para atualizar estado de conexão
    const handleConnect = () => {
      console.log('✅ Socket: Connected!');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket: Disconnected');
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('🔴 Socket: Connection error:', error);
    };

    // Registrar listeners
    socketService.on('connect' as any, handleConnect);
    socketService.on('disconnect' as any, handleDisconnect);
    socketService.on('connect_error' as any, handleConnectError);

    // Cleanup ao desmontar
    return () => {
      socketService.off('connect' as any, handleConnect);
      socketService.off('disconnect' as any, handleDisconnect);
      socketService.off('connect_error' as any, handleConnectError);
    };
  }, [user]);

  const joinRoom = useCallback((workspaceId: string) => {
    socketService.joinRoom(workspaceId);
  }, []);

  const leaveRoom = useCallback((workspaceId: string) => {
    socketService.leaveRoom(workspaceId);
  }, []);

  const value: SocketContextValue = {
    isConnected,
    joinRoom,
    leaveRoom,
    socket: socketService,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}