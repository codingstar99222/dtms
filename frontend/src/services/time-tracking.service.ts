// frontend/src/services/time-tracking.service.ts
import api from "./api";
import type { TimeEntry } from "../types";

export interface StartTimeEntryDto {
  taskId?: string;
  description?: string;
}

export interface StopTimeEntryDto {
  description?: string;
}

export interface CreateManualTimeEntryDto {
  startTime: string;
  endTime: string;
  taskId?: string;
  description?: string;
}

export interface UpdateTimeEntryDto {
  startTime?: string;
  endTime?: string;
  taskId?: string;
  description?: string;
}

export interface DateRangeDto {
  startDate?: string;
  endDate?: string;
}

export interface TimeSummary {
  totalMinutes: number;
  totalHours: number;
  entries: TimeEntry[];
  byTask?: {
    taskId: string;
    taskTitle: string;
    minutes: number;
    hours: number;
  }[];
}

export interface ActiveTimer {
  isActive: boolean;
  entry?: TimeEntry;
  elapsedMinutes?: number;
}

export const timeTrackingService = {
  // Timer endpoints
  async startTimer(data: StartTimeEntryDto): Promise<TimeEntry> {
    const response = await api.post<TimeEntry>(
      "/time-tracking/timer/start",
      data,
    );
    return response.data;
  },

  async stopTimer(data: StopTimeEntryDto): Promise<TimeEntry> {
    const response = await api.post<TimeEntry>(
      "/time-tracking/timer/stop",
      data,
    );
    return response.data;
  },

  async getActiveTimer(): Promise<ActiveTimer> {
    const response = await api.get<ActiveTimer>("/time-tracking/timer/active");
    return response.data;
  },

  // Manual entry endpoints
  async createManualEntry(data: CreateManualTimeEntryDto): Promise<TimeEntry> {
    const response = await api.post<TimeEntry>(
      "/time-tracking/entries/manual",
      data,
    );
    return response.data;
  },

  async getEntries(
    dateRange?: DateRangeDto,
    userId?: string,
  ): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }
    if (userId) params.append("userId", userId);

    const response = await api.get<TimeEntry[]>(
      `/time-tracking/entries?${params.toString()}`,
    );
    return response.data;
  },

  async getEntry(id: string): Promise<TimeEntry> {
    const response = await api.get<TimeEntry>(`/time-tracking/entries/${id}`);
    return response.data;
  },

  async updateEntry(id: string, data: UpdateTimeEntryDto): Promise<TimeEntry> {
    const response = await api.patch<TimeEntry>(
      `/time-tracking/entries/${id}`,
      data,
    );
    return response.data;
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/time-tracking/entries/${id}`);
  },

  async getSummary(
    dateRange?: DateRangeDto,
    userId?: string,
  ): Promise<TimeSummary> {
    const params = new URLSearchParams();
    if (dateRange) {
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
    }
    if (userId) params.append("userId", userId);

    const response = await api.get<TimeSummary>(
      `/time-tracking/entries/summary?${params.toString()}`,
    );
    return response.data;
  },
};
