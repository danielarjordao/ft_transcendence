import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { Task } from '../components/kanban/TaskCard';
 
interface UseBoardOptions {
  workspaceId: string | null;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskMoved: (data: { taskId: string; fromStatus: string; toStatus: string }) => void;
}
 
/**
 * Hook para gerenciar listeners de real-time do board
 * 
 * Escuta eventos WebSocket:
 * - task:created
 * - task:updated
 * - task:deleted
 * - task:moved
 * 
 * Exemplo de uso:
 * ```tsx
 * useBoard({
 *   workspaceId: 'ws123',
 *   onTaskCreated: (task) => setTasks(prev => [...prev, task]),
 *   onTaskUpdated: (task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)),
 *   onTaskDeleted: (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId)),
 *   onTaskMoved: (data) => { ... }
 * });
 * ```
 */
export function useBoard({
  workspaceId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
}: UseBoardOptions) {
  const { socket, isConnected } = useSocket();
 
  useEffect(() => {
    if (!isConnected || !workspaceId) {
      console.log('⚠️ useBoard: Socket not connected or no workspace selected');
      return;
    }
 
    console.log(`🟢 useBoard: Joining workspace room: ${workspaceId}`);
 
    // ✅ ENTRAR NA ROOM DO WORKSPACE
    socket.emit('room:join', workspaceId);
 
    // ✅ LISTENER: task:created
    const handleTaskCreated = (task: Task) => {
      console.log('📝 Task created (real-time):', task.id);
      onTaskCreated(task);
    };
 
    // ✅ LISTENER: task:updated
    const handleTaskUpdated = (task: Task) => {
      console.log('✏️ Task updated (real-time):', task.id);
      onTaskUpdated(task);
    };
 
    // ✅ LISTENER: task:deleted
    const handleTaskDeleted = (taskId: string) => {
      console.log('🗑️ Task deleted (real-time):', taskId);
      onTaskDeleted(taskId);
    };
 
    // ✅ LISTENER: task:moved
    const handleTaskMoved = (data: { taskId: string; fromStatus: string; toStatus: string }) => {
      console.log('🔄 Task moved (real-time):', data);
      onTaskMoved(data);
    };
 
    // ✅ REGISTRAR LISTENERS
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:moved', handleTaskMoved);
 
    // ✅ CLEANUP
    return () => {
      console.log(`🔴 useBoard: Leaving workspace room: ${workspaceId}`);
      
      // Remover listeners
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:moved', handleTaskMoved);
      
      // Sair da room
      socket.emit('room:leave', workspaceId);
    };
  }, [
    isConnected,
    socket,
    workspaceId,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskMoved,
  ]);
}
 