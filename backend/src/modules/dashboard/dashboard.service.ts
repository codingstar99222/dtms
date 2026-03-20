// backend/src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardFilterDto,
  DashboardSummaryDto,
  MemberPerformanceDto,
  ActivityDto,
} from './dto/dashboard.dto';
import { Role, ReportStatus, TaskStatus } from '@prisma/client';
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

    const startDateStr = this.timeService.formatDate(startDate);
    const endDateStr = this.timeService.formatDate(endDate);

    // Get overview stats
    const overview = await this.getOverviewStats(
      userId,
      userRole,
      startDateStr,
      endDateStr,
    );

    // Get member performance (income and task count)
    const memberPerformance = await this.getMemberPerformance(
      userRole,
      startDateStr,
      endDateStr,
    );

    // Get recent activities
    const recentActivities = await this.getRecentActivities(
      userId,
      userRole,
      startDate,
      endDate,
    );

    return {
      overview,
      memberPerformance,
      recentActivities,
    };
  }

  private async getOverviewStats(
    userId: string,
    userRole: Role,
    startDateStr: string,
    endDateStr: string,
  ) {
    const userFilter = userRole === Role.ADMIN ? {} : { userId };

    const [
      totalMembers,
      activeMembers,
      pendingReports,
      totalIncome,
      totalTasks,
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

      // Pending reports
      this.prisma.report.count({
        where: {
          ...userFilter,
          status: ReportStatus.PENDING,
          date: { gte: startDateStr, lte: endDateStr },
        },
      }),

      // Total income from transactions
      this.prisma.transaction.aggregate({
        where: {
          ...(userRole === Role.ADMIN ? {} : { userId }),
          type: 'INCOME',
          timestamp: { gte: startDateStr, lte: endDateStr },
        },
        _sum: { amount: true },
      }),

      // Total completed tasks
      this.prisma.task.count({
        where: {
          ...(userRole === Role.ADMIN
            ? {}
            : {
                OR: [{ assigneeId: userId }, { creatorId: userId }],
              }),
          status: TaskStatus.COMPLETED,
          createdAt: { gte: new Date(startDateStr), lte: new Date(endDateStr) },
        },
      }),
    ]);

    return {
      totalIncome: totalIncome._sum.amount || 0,
      totalTasks,
      totalMembers,
      activeMembers,
      pendingReports,
    };
  }

  private async getMemberPerformance(
    userRole: Role,
    startDateStr: string,
    endDateStr: string,
  ): Promise<MemberPerformanceDto[]> {
    // Only admins see member performance
    if (userRole !== Role.ADMIN) {
      return [];
    }

    const members = await this.prisma.user.findMany({
      where: { role: Role.MEMBER, isActive: true },
      select: { id: true, name: true },
    });

    const performance: MemberPerformanceDto[] = [];

    for (const member of members) {
      const [income, taskCount] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId: member.id,
            type: 'INCOME',
            timestamp: { gte: startDateStr, lte: endDateStr },
          },
          _sum: { amount: true },
        }),
        this.prisma.task.count({
          where: {
            OR: [{ assigneeId: member.id }, { creatorId: member.id }],
            status: TaskStatus.COMPLETED,
            createdAt: {
              gte: new Date(startDateStr),
              lte: new Date(endDateStr),
            },
          },
        }),
      ]);

      performance.push({
        userId: member.id,
        userName: member.name,
        income: income._sum.amount || 0,
        taskCount,
      });
    }

    // Sort by income descending
    return performance.sort((a, b) => b.income - a.income);
  }

  private async getRecentActivities(
    userId: string,
    userRole: Role,
    startDate: Date,
    endDate: Date,
  ): Promise<ActivityDto[]> {
    const userFilter = userRole === Role.ADMIN ? {} : { userId };
    const activities: ActivityDto[] = [];

    // Get recent reports (only from other users for admin)
    const reports = await this.prisma.report.findMany({
      where: {
        ...(userRole === Role.ADMIN ? { NOT: { userId } } : userFilter),
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

    const tasks = await this.prisma.task.findMany({
      where: {
        ...(userRole === Role.ADMIN
          ? { NOT: { creatorId: userId } }
          : { creatorId: userId }), // Members see their own tasks
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        creator: { select: { name: true } },
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

    // Get recent blog posts (only from other users for admin)
    const blogs = await this.prisma.blogPost.findMany({
      where: {
        ...(userRole === Role.ADMIN ? { NOT: { userId } } : userFilter),
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

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }
}
