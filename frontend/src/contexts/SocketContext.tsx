import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket.service';
import { useAuthStore } from '../store/auth.store';

interface SocketContextValue {
  isConnected: boolean;
  joinRoom: (workspaceId: string) => void;
  leaveRoom: (workspaceId: string) => void;
  socket: typeof socketService;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !accessToken) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    console.log('🔌 Socket: Connecting with token...');
    socketService.connect(accessToken);

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
      socketService.disconnect();
    };
  }, [accessToken, user]);

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
