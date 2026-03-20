// frontend/src/services/financial.service.ts
import api from './api';
import type { Transaction } from '../types';

export interface CreateTransactionDto {
  type: 'INCOME';
  amount: number;
  description: string;
  source?: string;
  paymentMethod?: string;
  userId?: string;
  timestamp?: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  description?: string;
  source?: string;
  paymentMethod?: string;
}

export interface DateRangeDto {
  startDate?: string;
  endDate?: string;
}

export interface FinancialSummary {
  totalIncome: number;
}

export const financialService = {
  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post<Transaction>('/financial/transactions', data);
    return response.data;
  },

  async getTransactions(dateRange?: DateRangeDto): Promise<Transaction[]> {
    console.log('📡 API call to /financial/transactions with:', dateRange);
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    }
    const response = await api.get<Transaction[]>(`/financial/transactions?${params.toString()}`);
    console.log('📡 API response:', response.data);
    return response.data;
  },

  async getTransaction(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/financial/transactions/${id}`);
    return response.data;
  },

  async updateTransaction(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await api.patch<Transaction>(`/financial/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/financial/transactions/${id}`);
  },

  async getMySummary(dateRange?: DateRangeDto): Promise<FinancialSummary> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    }
    const response = await api.get<FinancialSummary>(`/financial/summary/me?${params.toString()}`);
    return response.data;
  },
};
