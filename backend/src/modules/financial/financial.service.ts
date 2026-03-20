// backend/src/modules/financial/financial.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  DateRangeDto,
  FinancialSummaryDto,
} from './dto/financial.dto';
import { TransactionType, Role, Prisma } from '@prisma/client';

interface TransactionWithDetails {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  source: string | null;
  paymentMethod: string | null;
  timestamp: string;
  user: {
    name: string;
  };
}

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    userRole: Role,
    createDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create financial entries');
    }

    const {
      type,
      amount,
      description,
      source,
      paymentMethod,
      userId: targetUserId,
      timestamp,
    } = createDto;

    if (type !== 'INCOME') {
      throw new BadRequestException('Only income transactions are supported');
    }

    const transactionUserId = targetUserId || userId;

    const user = await this.prisma.user.findUnique({
      where: { id: transactionUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store timestamp as YYYY-MM-DD string
    const dateStr = timestamp || new Date().toISOString().split('T')[0];

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: transactionUserId,
        type: 'INCOME',
        amount,
        description,
        source,
        paymentMethod,
        timestamp: dateStr,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(transaction as TransactionWithDetails);
  }

  async findAll(
    userId: string,
    userRole: Role,
    dateRange?: DateRangeDto,
  ): Promise<TransactionResponseDto[]> {
    const where: Prisma.TransactionWhereInput = { type: 'INCOME' };

    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    if (dateRange) {
      where.timestamp = {};
      if (dateRange.startDate) {
        where.timestamp.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.timestamp.lte = dateRange.endDate;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return (transactions as TransactionWithDetails[]).map((t) =>
      this.toResponseDto(t),
    );
  }
  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (userRole !== Role.ADMIN && transaction.userId !== userId) {
      throw new ForbiddenException('You can only view your own transactions');
    }

    return this.toResponseDto(transaction as TransactionWithDetails);
  }

  async update(
    id: string,
    userId: string,
    userRole: Role,
    updateDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update transactions');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updateData: Prisma.TransactionUpdateInput = {};
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.source !== undefined) updateData.source = updateDto.source;
    if (updateDto.paymentMethod !== undefined)
      updateData.paymentMethod = updateDto.paymentMethod;

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true } },
      },
    });

    return this.toResponseDto(updatedTransaction as TransactionWithDetails);
  }

  async remove(id: string, userRole: Role): Promise<void> {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete transactions');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.delete({ where: { id } });
  }

  async getUserSummary(
    userId: string,
    dateRange?: DateRangeDto,
  ): Promise<FinancialSummaryDto> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      type: 'INCOME',
    };

    if (dateRange) {
      where.timestamp = {};
      if (dateRange.startDate) where.timestamp.gte = dateRange.startDate;
      if (dateRange.endDate) where.timestamp.lte = dateRange.endDate;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
    });

    const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome };
  }

  private toResponseDto(t: TransactionWithDetails): TransactionResponseDto {
    return {
      id: t.id,
      userId: t.userId,
      userName: t.user.name,
      type: t.type,
      amount: t.amount,
      description: t.description,
      source: t.source || undefined,
      paymentMethod: t.paymentMethod || undefined,
      timestamp: t.timestamp, // Already a string
    };
  }
}
