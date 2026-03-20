// backend/src/modules/dashboard/dto/dashboard.dto.ts
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Role } from '@prisma/client';

export class DashboardFilterDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(Role)
  @IsOptional()
  userRole?: Role;

  @IsOptional()
  userId?: string;
}

export class MemberPerformanceDto {
  userId: string;
  userName: string;
  reports: {
    submitted: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
  };
  tasks: {
    assigned: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  time: {
    totalHours: number;
    averageDaily: number;
  };
  financial: {
    earned: number;
    expenses: number;
    net: number;
  };
}

export class DashboardSummaryDto {
  overview: {
    totalMembers: number;
    activeMembers: number;
    pendingReports: number;
    activeTasks: number;
    totalEarnings: number;
    totalExpenses: number;
    netBalance: number;
    totalHours: number;
  };
  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: MonthlyTrendPoint[];
  };
  topPerformers: MemberPerformanceDto[];
  recentActivities: ActivityDto[];
}

export class TrendPoint {
  date: string;
  reports: number;
  tasks: number;
  income: number;
}

export class MonthlyTrendPoint {
  month: string;
  reports: number;
  tasks: number;
  income: number;
  net: number;
}

export class ActivityDto {
  id: string;
  type: 'report' | 'task' | 'blog' | 'time' | 'financial';
  action: string;
  userName: string;
  userId: string;
  description: string;
  timestamp: Date;
  link?: string;
}
