// backend/src/modules/financial/dto/financial.dto.ts
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // For admin creating transactions for others

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

export class UpdateTransactionDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;
}

export class TransactionResponseDto {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  description: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: Date;
}

export class DateRangeDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class FinancialSummaryDto {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  byUser?: UserFinancialSummaryDto[];
}

export class UserFinancialSummaryDto {
  userId: string;
  userName: string;
  income: number;
  expense: number;
  net: number;
}

export class MonthlyTrendDto {
  month: string;
  income: number;
  expense: number;
  net: number;
}
