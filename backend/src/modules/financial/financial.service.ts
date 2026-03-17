// backend/src/modules/financial/financial.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  DateRangeDto,
  FinancialSummaryDto,
  UserFinancialSummaryDto,
  MonthlyTrendDto,
} from './dto/financial.dto';
import { TransactionType, Role, Prisma } from '@prisma/client';

interface TransactionWithDetails {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  taskId: string | null;
  timestamp: Date;
  user: {
    name: string;
  };
  task: {
    title: string;
  } | null;
}

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    userRole: Role,
    createDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const {
      type,
      amount,
      description,
      taskId,
      timestamp,
      userId: targetUserId,
    } = createDto;

    // Determine which user this transaction belongs to
    let transactionUserId = userId;

    // Only admins can create transactions for other users
    if (targetUserId && targetUserId !== userId) {
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admins can create transactions for other users',
        );
      }
      transactionUserId = targetUserId;
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: transactionUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify task exists if provided
    if (taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: transactionUserId,
        type,
        amount,
        description,
        taskId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
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
    const where: Prisma.TransactionWhereInput = {};

    // Filter by user
    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    // Filter by date range
    if (dateRange) {
      where.timestamp = {};
      if (dateRange.startDate) {
        where.timestamp.gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.timestamp.lte = new Date(dateRange.endDate);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
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
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check access
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
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Only admins can update transactions
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update transactions');
    }

    // Verify task exists if updating taskId
    if (updateDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: updateDto.taskId },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    const updateData: Prisma.TransactionUpdateInput = {};
    if (updateDto.type !== undefined) updateData.type = updateDto.type;
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.taskId !== undefined)
      updateData.task = { connect: { id: updateDto.taskId } };

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
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

    await this.prisma.transaction.delete({
      where: { id },
    });
  }

  async getUserSummary(
    userId: string,
    dateRange?: DateRangeDto,
  ): Promise<FinancialSummaryDto> {
    const where: Prisma.TransactionWhereInput = { userId };

    if (dateRange) {
      where.timestamp = {};
      if (dateRange.startDate)
        where.timestamp.gte = new Date(dateRange.startDate);
      if (dateRange.endDate) where.timestamp.lte = new Date(dateRange.endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
    });

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  async getAllUsersSummary(
    userRole: Role,
    dateRange?: DateRangeDto,
  ): Promise<UserFinancialSummaryDto[]> {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can view all users summary');
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const summaries: UserFinancialSummaryDto[] = [];

    for (const user of users) {
      const where: Prisma.TransactionWhereInput = { userId: user.id };

      if (dateRange) {
        where.timestamp = {};
        if (dateRange.startDate)
          where.timestamp.gte = new Date(dateRange.startDate);
        if (dateRange.endDate)
          where.timestamp.lte = new Date(dateRange.endDate);
      }

      const transactions = await this.prisma.transaction.findMany({
        where,
      });

      const income = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      summaries.push({
        userId: user.id,
        userName: user.name,
        income,
        expense,
        net: income - expense,
      });
    }

    return summaries;
  }

  async getMonthlyTrends(
    userId: string,
    userRole: Role,
    year: number,
  ): Promise<MonthlyTrendDto[]> {
    const where: Prisma.TransactionWhereInput = {};

    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    // Set date range for the entire year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    where.timestamp = {
      gte: startDate,
      lte: endDate,
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
    });

    // Initialize monthly data
    const monthlyData: MonthlyTrendDto[] = [];
    for (let i = 0; i < 12; i++) {
      monthlyData.push({
        month: new Date(year, i, 1).toLocaleString('default', {
          month: 'short',
        }),
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    // Aggregate by month
    transactions.forEach((t) => {
      const month = new Date(t.timestamp).getMonth();
      if (t.type === TransactionType.INCOME) {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expense += t.amount;
      }
      monthlyData[month].net =
        monthlyData[month].income - monthlyData[month].expense;
    });

    return monthlyData;
  }

  private toResponseDto(t: TransactionWithDetails): TransactionResponseDto {
    return {
      id: t.id,
      userId: t.userId,
      userName: t.user.name,
      type: t.type,
      amount: t.amount,
      description: t.description,
      taskId: t.taskId || undefined,
      taskTitle: t.task?.title,
      timestamp: t.timestamp,
    };
  }
}
