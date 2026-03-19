// frontend/src/services/reports.service.ts
import api from './api';
import type { Report } from '../types';

export interface CreateReportDto {
  date: string;
  content: string;
}

export interface UpdateReportDto {
  date?: string;
  content?: string;
}

export interface ApproveReportDto {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface MissingReport {
  date: string;
  dayOfWeek: string;
  isMissing: boolean;
}

export const reportsService = {
  async create(data: CreateReportDto): Promise<Report> {
    const response = await api.post('/reports', data);
    return response.data;
  },

  async findAll(): Promise<Report[]> {
    const response = await api.get('/reports');
    return response.data;
  },

  async findOne(id: string): Promise<Report> {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateReportDto): Promise<Report> {
    const response = await api.patch(`/reports/${id}`, data);
    return response.data;
  },

  async approve(id: string, data: ApproveReportDto): Promise<Report> {
    const response = await api.patch(`/reports/${id}/approve`, data);
    return response.data;
  },

  async getPendingCount(): Promise<{ count: number }> {
    const response = await api.get('/reports/pending-count');
    return response.data;
  },

  async getUserReports(userId: string, startDate?: string, endDate?: string): Promise<Report[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/reports/user/${userId}?${params.toString()}`);
    return response.data;
  },

  async getMissingReports(): Promise<MissingReport[]> {
    const response = await api.get('/reports/missing');
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },
};
