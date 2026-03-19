// backend/src/modules/tasks/dto/task.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { TaskStatus, Priority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  client?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  client?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hoursWorked?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}

export class TaskResponseDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  creatorId: string;
  creatorName: string;
  client?: string;
  rate?: number;
  budget?: number;
  hoursWorked: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  deadline?: string;
}

export class TaskFilterDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  @IsOptional()
  creatorId?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
