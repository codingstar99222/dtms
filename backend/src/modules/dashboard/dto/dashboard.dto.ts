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
  income: number;
  taskCount: number;
}

export class DashboardSummaryDto {
  overview: {
    totalIncome: number;
    totalTasks: number;
    totalMembers: number;
    activeMembers: number;
    pendingReports: number;
  };
  memberPerformance: MemberPerformanceDto[];
  recentActivities: ActivityDto[];
}

export class ActivityDto {
  id: string;
  type: 'report' | 'task' | 'blog';
  action: string;
  userName: string;
  userId: string;
  description: string;
  timestamp: Date;
  link?: string;
}
