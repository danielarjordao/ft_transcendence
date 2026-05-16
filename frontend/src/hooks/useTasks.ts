import { useState, useCallback } from 'react';
import { tasksService } from '../services/tasks.service';
import type { Task } from '../components/kanban/TaskCard';
import type { CreateTaskDto, UpdateTaskDto, TaskFilters } from '../services/tasks.service';
 
interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (workspaceId: string, filters?: TaskFilters) => Promise<void>;
  createTask: (workspaceId: string, data: CreateTaskDto) => Promise<Task>;
  updateTask: (taskId: string, data: UpdateTaskDto) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: string) => Promise<Task>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}
 
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // ✅ FETCH TASKS
  const fetchTasks = useCallback(async (workspaceId: string, filters?: TaskFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await tasksService.getAll(workspaceId, filters);
      setTasks(response.items);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load tasks';
      setError(message);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
 
  // ✅ CREATE TASK
  const createTask = useCallback(async (workspaceId: string, data: CreateTaskDto): Promise<Task> => {
    setError(null);
    
    try {
      const newTask = await tasksService.create(workspaceId, data);
      
      // ✅ Optimistic update - adicionar imediatamente
      setTasks(prev => [...prev, newTask]);
      
      return newTask;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create task';
      setError(message);
      console.error('Error creating task:', err);
      throw err;
    }
  }, []);
 
  // ✅ UPDATE TASK
  const updateTask = useCallback(async (taskId: string, data: UpdateTaskDto): Promise<Task> => {
    setError(null);
    
    // Guardar estado anterior para rollback
    const oldTasks = [...tasks];
    
    // ✅ Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...data } : t
    ));
    
    try {
      const updated = await tasksService.update(taskId, data);
      
      // Atualizar com dados reais do backend
      setTasks(prev => prev.map(t => 
        t.id === taskId ? updated : t
      ));
      
      return updated;
    } catch (err: any) {
      // ✅ ROLLBACK em caso de erro
      setTasks(oldTasks);
      
      const message = err.response?.data?.message || 'Failed to update task';
      setError(message);
      console.error('Error updating task:', err);
      throw err;
    }
  }, [tasks]);
 
  // ✅ DELETE TASK
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    setError(null);
    
    // Guardar estado anterior para rollback
    const oldTasks = [...tasks];
    
    // ✅ Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    try {
      await tasksService.delete(taskId);
    } catch (err: any) {
      // ✅ ROLLBACK em caso de erro
      setTasks(oldTasks);
      
      const message = err.response?.data?.message || 'Failed to delete task';
      setError(message);
      console.error('Error deleting task:', err);
      throw err;
    }
  }, [tasks]);
 
  // ✅ MOVE TASK (caso especial de update, só muda status)
  const moveTask = useCallback(async (taskId: string, newStatus: string): Promise<Task> => {
    return updateTask(taskId, { status: newStatus });
  }, [updateTask]);
 
  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    setTasks, // Expor para real-time updates
  };
}