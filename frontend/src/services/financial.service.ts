// frontend/src/services/financial.service.ts
import api from "./api";
import type { Transaction } from "../types";

export type TransactionType = "INCOME" | "EXPENSE";

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  description: string;
  taskId?: string;
  userId?: string;
  timestamp?: string;
}

export interface UpdateTransactionDto {
  type?: TransactionType;
  amount?: number;
  description?: string;
  taskId?: string;
}

export interface DateRangeDto {
  startDate?: string;
  endDate?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface UserFinancialSummary {
  userId: string;
  userName: string;
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export const financialService = {
  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post<Transaction>(
      "/financial/transactions",
      data,
    );
    return response.data;
  },

  async getTransactions(dateRange?: DateRangeDto): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }

    const response = await api.get<Transaction[]>(
      `/financial/transactions?${params.toString()}`,
    );
    return response.data;
  },

  async getTransaction(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(
      `/financial/transactions/${id}`,
    );
    return response.data;
  },

  async updateTransaction(
    id: string,
    data: UpdateTransactionDto,
  ): Promise<Transaction> {
    const response = await api.patch<Transaction>(
      `/financial/transactions/${id}`,
      data,
    );
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/financial/transactions/${id}`);
  },

  async getMySummary(dateRange?: DateRangeDto): Promise<FinancialSummary> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }

    const response = await api.get<FinancialSummary>(
      `/financial/summary/me?${params.toString()}`,
    );
    return response.data;
  },

  async getAllUsersSummary(
    dateRange?: DateRangeDto,
  ): Promise<UserFinancialSummary[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }

    const response = await api.get<UserFinancialSummary[]>(
      `/financial/summary/users?${params.toString()}`,
    );
    return response.data;
  },

  async getUserSummary(
    userId: string,
    dateRange?: DateRangeDto,
  ): Promise<FinancialSummary> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }

    const response = await api.get<FinancialSummary>(
      `/financial/summary/user/${userId}?${params.toString()}`,
    );
    return response.data;
  },

  async getMonthlyTrends(year: number): Promise<MonthlyTrend[]> {
    const response = await api.get<MonthlyTrend[]>(
      `/financial/trends/monthly?year=${year}`,
    );
    return response.data;
  },
};
