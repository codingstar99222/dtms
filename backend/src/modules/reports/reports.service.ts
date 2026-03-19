// backend/src/modules/reports/reports.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ApproveReportDto,
  ReportResponseDto,
} from './dto/report.dto';
import { ReportStatus, Role, Prisma } from '@prisma/client';

interface ReportWithUser {
  id: string;
  userId: string;
  date: Date;
  content: string;
  status: ReportStatus;
  reason: string | null;
  submittedAt: Date;
  approvedAt: Date | null;
  updatedAt: Date;
  version: number;
  user: {
    name: string;
  } | null;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    const { date, content } = createReportDto;
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    // Check if report already exists for this date
    const existingReport = await this.prisma.report.findFirst({
      where: {
        userId,
        date: reportDate,
      },
    });

    if (existingReport) {
      throw new BadRequestException('Report already exists for this date');
    }

    const report = await this.prisma.report.create({
      data: {
        userId,
        date: reportDate,
        content,
        status: ReportStatus.PENDING,
        version: 1, // Initial version
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toResponseDto(report as ReportWithUser, userId, Role.MEMBER);
  }

  async findAll(userId: string, userRole: Role): Promise<ReportResponseDto[]> {
    const where: Prisma.ReportWhereInput = {};

    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    const reports = await this.prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { submittedAt: 'desc' }],
    });

    return (reports as ReportWithUser[]).map((report) =>
      this.toResponseDto(report, userId, userRole),
    );
  }

  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (userRole !== Role.ADMIN && report.userId !== userId) {
      throw new ForbiddenException('You can only view your own reports');
    }

    return this.toResponseDto(report as ReportWithUser, userId, userRole);
  }

  async update(
    id: string,
    userId: string,
    updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.userId !== userId) {
      throw new ForbiddenException('You can only update your own reports');
    }

    // Allow editing if status is PENDING or REJECTED
    if (
      report.status !== ReportStatus.PENDING &&
      report.status !== ReportStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only pending or rejected reports can be updated',
      );
    }

    const updateData: Prisma.ReportUpdateInput = {};

    if (updateReportDto.content !== undefined) {
      updateData.content = updateReportDto.content;
    }

    // If it was rejected, set back to pending for re-review
    if (report.status === ReportStatus.REJECTED) {
      updateData.status = ReportStatus.PENDING;
      updateData.reason = null; // Clear rejection reason
    }

    updateData.version = { increment: 1 };

    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(
      updatedReport as ReportWithUser,
      userId,
      Role.MEMBER,
    );
  }

  async approve(
    id: string,
    approveReportDto: ApproveReportDto,
    userId: string,
    userRole: Role,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Report is already processed');
    }

    const { status, reason } = approveReportDto;

    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: {
        status,
        reason: status === ReportStatus.REJECTED ? reason : null,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toResponseDto(
      updatedReport as ReportWithUser,
      userId,
      userRole,
    );
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.report.count({
      where: { status: ReportStatus.PENDING },
    });
  }

  async getUserReports(
    userId: string,
    userRole: Role,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ReportResponseDto[]> {
    const where: Prisma.ReportWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const reports = await this.prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return (reports as ReportWithUser[]).map((report) =>
      this.toResponseDto(report, userId, userRole),
    );
  }

  async getMissingReports(
    userId: string,
  ): Promise<{ date: Date; dayOfWeek: string; isMissing: boolean }[]> {
    console.log('🔍 getMissingReports called for userId:', userId);

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    console.log('Date range:', { lastWeek, today });
    const reports = await this.prisma.report.findMany({
      where: {
        userId,
        date: {
          gte: lastWeek,
          lte: today,
        },
      },
    });
    console.log('Found reports in date range:', reports.length);
    console.log(
      'Report dates:',
      reports.map((r) => r.date.toISOString().split('T')[0]),
    );

    const missingDays: { date: Date; dayOfWeek: string; isMissing: boolean }[] =
      [];
    const reportDates = new Set(
      reports.map((r) => r.date.toISOString().split('T')[0]),
    );

    for (let d = new Date(lastWeek); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      console.log(
        'Checking date:',
        dateStr,
        'Exists?',
        reportDates.has(dateStr),
      );
      if (!reportDates.has(dateStr)) {
        missingDays.push({
          date: new Date(d),
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
          isMissing: true,
        });
      }
    }

    return missingDays;
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Admin can delete anything
    if (userRole === Role.ADMIN) {
      await this.prisma.report.delete({ where: { id } });
      return;
    }

    // Members can only delete their own pending reports that were never processed
    if (report.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Only pending reports can be deleted');
    }

    if (report.approvedAt !== null) {
      throw new BadRequestException(
        'Cannot delete a report that has been reviewed',
      );
    }

    await this.prisma.report.delete({ where: { id } });
  }

  private toResponseDto(
    report: ReportWithUser,
    currentUserId: string,
    _currentUserRole: Role,
  ): ReportResponseDto {
    void _currentUserRole; // remove unused argument
    const isOwner = report.userId === currentUserId;

    // Rules:
    // - Edit: Can edit if:
    //   - Owner AND (status is PENDING OR status is REJECTED)
    // - Delete: Only if pending and owner and never processed
    const canEdit =
      isOwner &&
      (report.status === ReportStatus.PENDING ||
        report.status === ReportStatus.REJECTED);

    const canDelete =
      isOwner &&
      report.status === ReportStatus.PENDING &&
      report.approvedAt === null;

    return {
      id: report.id,
      userId: report.userId,
      userName: report.user?.name || 'Unknown',
      date: report.date,
      content: report.content,
      status: report.status,
      reason: report.reason || undefined,
      submittedAt: report.submittedAt,
      approvedAt: report.approvedAt || undefined,
      updatedAt: report.updatedAt,
      version: report.version,
      canEdit,
      canDelete,
    };
  }
}
