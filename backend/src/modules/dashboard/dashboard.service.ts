// backend/src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardFilterDto,
  DashboardSummaryDto,
  MemberPerformanceDto,
  TrendPoint,
  MonthlyTrendPoint,
  ActivityDto,
} from './dto/dashboard.dto';
import {
  Role,
  ReportStatus,
  TaskStatus,
  TransactionType,
} from '@prisma/client';
import { TimeService } from '../../common/services/time.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private timeService: TimeService,
  ) {}

  async getDashboardSummary(
    userId: string,
    userRole: Role,
    filter?: DashboardFilterDto,
  ): Promise<DashboardSummaryDto> {
    // Set default date range (last 30 days if not specified)
    const endDate = filter?.endDate
      ? new Date(filter.endDate)
      : this.timeService.now();

    const startDate = filter?.startDate
      ? new Date(filter.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get overview stats
    const overview = await this.getOverviewStats(
      userId,
      userRole,
      startDate,
      endDate,
    );

    // Get trends
    const trends = await this.getTrends(userId, userRole, startDate, endDate);

    // Get top performers (admin only)
    const topPerformers =
      userRole === Role.ADMIN
        ? await this.getTopPerformers(startDate, endDate)
        : [];

    // Get recent activities
    const recentActivities = await this.getRecentActivities(
      userId,
      userRole,
      startDate,
      endDate,
    );

    return {
      overview,
      trends,
      topPerformers,
      recentActivities,
    };
  }

  private async getOverviewStats(
    userId: string,
    userRole: Role,
    startDate: Date,
    endDate: Date,
  ) {
    // Base filters
    const userFilter = userRole === Role.ADMIN ? {} : { userId };

    // Convert dates to strings for string comparison
    const startDateStr = this.timeService.formatDate(startDate);
    const endDateStr = this.timeService.formatDate(endDate);

    // Parallel queries for performance
    const [
      totalMembers,
      activeMembers,
      pendingReports,
      activeTasks,
      financials,
      totalHours,
    ] = await Promise.all([
      // Total members (admin only)
      userRole === Role.ADMIN
        ? this.prisma.user.count({ where: { role: Role.MEMBER } })
        : Promise.resolve(0),

      // Active members (admin only)
      userRole === Role.ADMIN
        ? this.prisma.user.count({
            where: { role: Role.MEMBER, isActive: true },
          })
        : Promise.resolve(0),

      // Pending reports - using string comparison
      this.prisma.report.count({
        where: {
          ...userFilter,
          status: ReportStatus.PENDING,
          date: {
            gte: startDateStr, // Compare strings
            lte: endDateStr, // "2026-03-19" >= "2026-03-01" works!
          },
        },
      }),

      // Active tasks (in progress)
      this.prisma.task.count({
        where: {
          ...userFilter,
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] },
        },
      }),

      // Financial summary
      this.getFinancialSummary(userId, userRole, startDate, endDate),

      // Total hours logged
      this.prisma.timeEntry.aggregate({
        where: {
          ...userFilter,
          startTime: { gte: startDate, lte: endDate },
          endTime: { not: null },
        },
        _sum: { duration: true },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      pendingReports,
      activeTasks,
      totalEarnings: financials.income,
      totalExpenses: financials.expenses,
      netBalance: financials.net,
      totalHours: (totalHours._sum.duration || 0) / 60,
    };
  }

  private async getFinancialSummary(
    userId: string,
    userRole: Role,
    startDate: Date,
    endDate: Date,
  ) {
    const userFilter = userRole === Role.ADMIN ? {} : { userId };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...userFilter,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  }

  private async getTrends(
    userId: string,
    userRole: Role,
    startDate: Date,
    endDate: Date,
  ) {
    const userFilter = userRole === Role.ADMIN ? {} : { userId };

    // Get all data for the period
    const [reports, tasks, timeEntries, transactions] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          ...userFilter,
          submittedAt: { gte: startDate, lte: endDate },
        },
        select: { submittedAt: true },
      }),
      this.prisma.task.findMany({
        where: {
          ...userFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true, status: true },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          ...userFilter,
          startTime: { gte: startDate, lte: endDate },
          endTime: { not: null },
        },
        select: { startTime: true, duration: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          ...userFilter,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true, amount: true, type: true },
      }),
    ]);

    // Generate daily trends
    const dailyMap = new Map<string, TrendPoint>();
    const weeklyMap = new Map<string, TrendPoint>();
    const monthlyMap = new Map<string, MonthlyTrendPoint>();

    // Initialize date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = this.timeService.formatDate(currentDate);
      const weekStr = this.getWeekString(currentDate);
      const monthStr = currentDate.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      dailyMap.set(dateStr, {
        date: dateStr,
        reports: 0,
        tasks: 0,
        hours: 0,
        income: 0,
      });
      weeklyMap.set(weekStr, {
        date: weekStr,
        reports: 0,
        tasks: 0,
        hours: 0,
        income: 0,
      });

      if (!monthlyMap.has(monthStr)) {
        monthlyMap.set(monthStr, {
          month: monthStr,
          reports: 0,
          tasks: 0,
          hours: 0,
          income: 0,
          expenses: 0,
          net: 0,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate reports
    reports.forEach((r) => {
      const dateStr = this.timeService.formatDate(r.submittedAt);
      const weekStr = this.getWeekString(r.submittedAt);
      const monthStr = r.submittedAt.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      dailyMap.get(dateStr)!.reports++;
      weeklyMap.get(weekStr)!.reports++;
      monthlyMap.get(monthStr)!.reports++;
    });

    // Aggregate tasks
    tasks.forEach((t) => {
      const dateStr = this.timeService.formatDate(t.createdAt);
      const weekStr = this.getWeekString(t.createdAt);
      const monthStr = t.createdAt.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      dailyMap.get(dateStr)!.tasks++;
      weeklyMap.get(weekStr)!.tasks++;
      monthlyMap.get(monthStr)!.tasks++;
    });

    // Aggregate time entries
    timeEntries.forEach((te) => {
      const dateStr = this.timeService.formatDate(te.startTime);
      const weekStr = this.getWeekString(te.startTime);
      const monthStr = te.startTime.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      const hours = (te.duration || 0) / 60;

      dailyMap.get(dateStr)!.hours += hours;
      weeklyMap.get(weekStr)!.hours += hours;
      monthlyMap.get(monthStr)!.hours += hours;
    });

    // Aggregate transactions
    transactions.forEach((t) => {
      const dateStr = this.timeService.formatDate(t.timestamp);
      const weekStr = this.getWeekString(t.timestamp);
      const monthStr = t.timestamp.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      if (t.type === TransactionType.INCOME) {
        dailyMap.get(dateStr)!.income += t.amount;
        weeklyMap.get(weekStr)!.income += t.amount;
        monthlyMap.get(monthStr)!.income += t.amount;
        monthlyMap.get(monthStr)!.net += t.amount;
      } else {
        monthlyMap.get(monthStr)!.expenses += t.amount;
        monthlyMap.get(monthStr)!.net -= t.amount;
      }
    });

    return {
      daily: Array.from(dailyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      weekly: Array.from(weeklyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      monthly: Array.from(monthlyMap.values()),
    };
  }

  private async getTopPerformers(
    startDate: Date,
    endDate: Date,
  ): Promise<MemberPerformanceDto[]> {
    const members = await this.prisma.user.findMany({
      where: { role: Role.MEMBER, isActive: true },
      select: { id: true, name: true },
    });

    const performers: MemberPerformanceDto[] = [];

    for (const member of members) {
      // Get reports stats
      const reports = await this.prisma.report.findMany({
        where: {
          userId: member.id,
          submittedAt: { gte: startDate, lte: endDate },
        },
      });

      const reportsSubmitted = reports.length;
      const reportsApproved = reports.filter(
        (r) => r.status === ReportStatus.APPROVED,
      ).length;
      const reportsRejected = reports.filter(
        (r) => r.status === ReportStatus.REJECTED,
      ).length;
      const reportsPending = reports.filter(
        (r) => r.status === ReportStatus.PENDING,
      ).length;

      // Get tasks stats
      const tasks = await this.prisma.task.findMany({
        where: {
          OR: [{ assigneeId: member.id }, { creatorId: member.id }],
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const tasksAssigned = tasks.filter(
        (t) => t.assigneeId === member.id,
      ).length;
      const tasksCompleted = tasks.filter(
        (t) => t.status === TaskStatus.COMPLETED,
      ).length;
      const tasksInProgress = tasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS,
      ).length;

      // Get time stats
      const timeEntries = await this.prisma.timeEntry.aggregate({
        where: {
          userId: member.id,
          startTime: { gte: startDate, lte: endDate },
          endTime: { not: null },
        },
        _sum: { duration: true },
      });

      const totalHours = (timeEntries._sum.duration || 0) / 60;
      const daysInPeriod = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      const averageDaily = totalHours / daysInPeriod;

      // Get financial stats
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId: member.id,
          timestamp: { gte: startDate, lte: endDate },
        },
      });

      const earned = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      performers.push({
        userId: member.id,
        userName: member.name,
        reports: {
          submitted: reportsSubmitted,
          approved: reportsApproved,
          pending: reportsPending,
          rejected: reportsRejected,
          approvalRate: reportsSubmitted
            ? (reportsApproved / reportsSubmitted) * 100
            : 0,
        },
        tasks: {
          assigned: tasksAssigned,
          completed: tasksCompleted,
          inProgress: tasksInProgress,
          completionRate: tasksAssigned
            ? (tasksCompleted / tasksAssigned) * 100
            : 0,
        },
        time: {
          totalHours,
          averageDaily,
        },
        financial: {
          earned,
          expenses,
          net: earned - expenses,
        },
      });
    }

    // Sort by net earnings and return top 5
    return performers
      .sort((a, b) => b.financial.net - a.financial.net)
      .slice(0, 5);
  }

  private async getRecentActivities(
    userId: string,
    userRole: Role,
    startDate: Date,
    endDate: Date,
  ): Promise<ActivityDto[]> {
    const userFilter = userRole === Role.ADMIN ? {} : { userId };
    const activities: ActivityDto[] = [];

    // Get recent reports
    const reports = await this.prisma.report.findMany({
      where: {
        ...userFilter,
        submittedAt: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    reports.forEach((r) => {
      activities.push({
        id: `report-${r.id}`,
        type: 'report',
        action: r.status === ReportStatus.APPROVED ? 'approved' : 'submitted',
        userName: r.user.name,
        userId: r.userId,
        description: `Report for ${String(r.date)}`,
        timestamp: r.submittedAt,
        link: `/reports/${r.id}`,
      });
    });

    // Get recent tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        ...userFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    tasks.forEach((t) => {
      activities.push({
        id: `task-${t.id}`,
        type: 'task',
        action: 'created',
        userName: t.creator.name,
        userId: t.creatorId,
        description: `Task: ${t.title}`,
        timestamp: t.createdAt,
        link: `/tasks/${t.id}`,
      });
    });

    // Get recent blog posts
    const blogs = await this.prisma.blogPost.findMany({
      where: {
        ...userFilter,
        publishedAt: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    blogs.forEach((b) => {
      activities.push({
        id: `blog-${b.id}`,
        type: 'blog',
        action: 'published',
        userName: b.user.name,
        userId: b.userId,
        description: `Blog: ${b.title}`,
        timestamp: b.publishedAt,
        link: `/blog/${b.id}`,
      });
    });

    // Get recent time entries
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        ...userFilter,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { name: true } },
        task: { select: { title: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 5,
    });

    timeEntries.forEach((te) => {
      activities.push({
        id: `time-${te.id}`,
        type: 'time',
        action: 'logged',
        userName: te.user.name,
        userId: te.userId,
        description: te.task
          ? `${Math.round((te.duration || 0) / 60)}h on ${te.task.title}`
          : `${Math.round((te.duration || 0) / 60)}h worked`,
        timestamp: te.startTime,
      });
    });

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  private getWeekString(date: Date): string {
    const firstDay = new Date(date);
    firstDay.setDate(date.getDate() - date.getDay());
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    return `${this.timeService.formatDate(firstDay)} - ${this.timeService.formatDate(lastDay)}`;
  }
}
