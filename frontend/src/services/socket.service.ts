import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types/chat';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Conectar com autenticação JWT
  public connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    this.socket = io(BACKEND_URL, {
      auth: {
        token, // JWT do usuário autenticado
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  // Event handlers de conexão
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinRoom(workspaceId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot join room.');
      return;
    }
    this.socket.emit('room:join', workspaceId);
    console.log(`📥 Joined room: ${workspaceId}`);
  }

  public leaveRoom(workspaceId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('room:leave', workspaceId);
    console.log(`📤 Left room: ${workspaceId}`);
  }

  public emit<K extends keyof SocketEvents>(
    event: K,
    data?: Parameters<SocketEvents[K]>[0]
  ): void {
    if (!this.socket?.connected) {
      console.warn(`Socket not connected. Cannot emit ${String(event)}`);
      return;
    }
    this.socket.emit(event, data);
  }

  public on<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ): void {
    if (!this.socket) {
      console.warn(`Socket not initialized. Cannot listen to ${String(event)}`);
      return;
    }
    this.socket.on(event, callback as any);
  }

  public off<K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ): void {
    if (!this.socket) return;
    this.socket.off(event, callback as any);
  }

  public get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocketService.getInstance();