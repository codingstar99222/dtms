// frontend/src/services/users.service.ts
import api from './api';
import type { User } from '../types';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: 'ADMIN' | 'MEMBER';
  isActive?: boolean;
}
export interface UpdateProfileDto {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export const usersService = {
  async findAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async findOne(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto | UpdateProfileDto): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
