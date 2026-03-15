import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto, TaskPriority } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// MOCK: Define the exact shape of the mock Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  workspaceId: string;
  fieldId: string;
  priority?: TaskPriority | string;
  createdAt: string;
}

@Injectable()
export class TasksService {
  // MOCK: Explicitly typing the array as Task[]
  private tasks: Task[] = [
    {
      id: 'task_1',
      title: 'Configurar backend NestJS',
      description: 'Criar estrutura base e DTOs',
      workspaceId: 'ws_1',
      fieldId: 'todo',
      priority: TaskPriority.HIGH,
      createdAt: new Date().toISOString(),
    },
  ];

  // create method now returns a Task object with the exact shape defined by the CreateTaskDto plus additional fields like id and createdAt
  create(createTaskDto: CreateTaskDto) {
    const newTask = {
      id: `task_${Date.now()}`,
      ...createTaskDto,
      createdAt: new Date().toISOString(),
    };
    // MOCK: In a real application, it would be saved to the database here.
    // For the mock, it is added to the in-memory array.
    this.tasks.push(newTask);
    return newTask;
  }

  // findAll method now accepts an optional workspaceId parameter to filter tasks by workspace, returning only tasks that belong to the specified workspace if provided.
  findAll(workspaceId?: string) {
    // MOCK: Replace array filtering with a database query (e.g., prisma.task.findMany)
    if (workspaceId) {
      return this.tasks.filter((task) => task.workspaceId === workspaceId);
    }
    return this.tasks;
  }

  // findOne method retrieves a single task by its ID. If the task is not found, it throws a NotFoundException with a clear error message.
  findOne(id: string) {
    // MOCK: Replace array search with a database query (e.g., prisma.task.findUnique)
    const task = this.tasks.find((task) => task.id === id);
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  // update method allows updating a task by its ID. It first checks if the task exists, and if not, it throws a NotFoundException.
  // If the task exists, it updates only the fields provided in the UpdateTaskDto (e.g., moving the task to a different column) while keeping the other fields unchanged.
  update(id: string, updateTaskDto: UpdateTaskDto) {
    // MOCK: Replace array search and update with a database query (e.g., prisma.task.update)
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1)
      throw new NotFoundException(`Task with ID ${id} not found`);

    // Update only the fields provided in the UpdateTaskDto, allowing for partial updates (e.g., moving the task to a different column without changing the title or description).
    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updateTaskDto };
    return this.tasks[taskIndex];
  }

  // remove method deletes a task by its ID. It checks if the task exists, and if not, it throws a NotFoundException. If the task exists, it removes it from the in-memory array and returns the deleted task.
  remove(id: string) {
    // MOCK: Replace array search and delete with a database query (e.g., prisma.task.delete)
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1)
      throw new NotFoundException(`Task with ID ${id} not found`);

    const deletedTask = this.tasks.splice(taskIndex, 1);
    return deletedTask[0];
  }
}
