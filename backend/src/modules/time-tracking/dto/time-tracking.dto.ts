// backend/src/modules/time-tracking/dto/time-tracking.dto.ts
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class StartTimeEntryDto {
  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class StopTimeEntryDto {
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateManualTimeEntryDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTimeEntryDto {
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TimeEntryResponseDto {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TimeSummaryDto {
  totalMinutes: number;
  totalHours: number;
  entries: TimeEntryResponseDto[];
  byTask?: {
    taskId: string;
    taskTitle: string;
    minutes: number;
    hours: number;
  }[];
}

export class DateRangeDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class ActiveTimerDto {
  isActive: boolean;
  entry?: TimeEntryResponseDto;
  elapsedMinutes?: number;
}
