// frontend/src/services/tasks.service.ts
import api from './api';
import type { Task } from '../types';

export type TaskStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateTaskDto {
  title: string;
  description: string;
  priority?: Priority;
  assigneeId?: string;
  client?: string;
  rate?: number;
  budget?: number;
  deadline?: string; // YYYY-MM-DD string
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  client?: string;
  rate?: number;
  budget?: number;
  hoursWorked?: number;
  deadline?: string; // YYYY-MM-DD string
}

export interface TaskFilterDto {
  status?: TaskStatus;
  assigneeId?: string;
  creatorId?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export const tasksService = {
  async create(data: CreateTaskDto): Promise<Task> {
    const response = await api.post<Task>('/tasks', data);
    return response.data;
  },

  async findAll(filter?: TaskFilterDto): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.status) params.append('status', filter.status);
      if (filter.assigneeId) params.append('assigneeId', filter.assigneeId);
      if (filter.creatorId) params.append('creatorId', filter.creatorId);
      if (filter.fromDate) params.append('fromDate', filter.fromDate);
      if (filter.toDate) params.append('toDate', filter.toDate);
    }

    const response = await api.get<Task[]>(`/tasks?${params.toString()}`);
    return response.data;
  },

  async findOne(id: string): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async assign(id: string, assigneeId: string): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}/assign`, {
      assigneeId,
    });
    return response.data;
  },

  async startTask(id: string): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}/start`);
    return response.data;
  },

  async completeTask(id: string, hoursWorked?: number): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}/complete`, {
      hoursWorked,
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/tasks/dashboard/stats');
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
