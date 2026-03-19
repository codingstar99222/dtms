// backend/src/modules/reports/dto/report.dto.ts
import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class CreateReportDto {
  @IsDateString()
  date: string;

  @IsString()
  content: string;
}

export class UpdateReportDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class ApproveReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReportResponseDto {
  id: string;
  userId: string;
  userName: string;
  date: string; // Changed from Date to string
  content: string;
  status: ReportStatus;
  reason?: string;
  submittedAt: Date;
  approvedAt?: Date;
  updatedAt: Date;
  version: number;
  canEdit: boolean;
  canDelete: boolean;
}

export class MissingReportDto {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  isMissing: boolean;
}
