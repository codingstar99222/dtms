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
  MissingReportDto,
} from './dto/report.dto';
import { ReportStatus, Role, Prisma } from '@prisma/client';
import { TimeService } from '../../common/services/time.service';

interface ReportWithUser {
  id: string;
  userId: string;
  date: string; // Changed from Date to string
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
  constructor(
    private prisma: PrismaService,
    private timeService: TimeService,
  ) {}

  async create(userId: string, createReportDto: CreateReportDto) {
    const { date, content } = createReportDto;
    // Get today's date as string
    const todayStr = this.timeService.getTodayString();

    // Check if trying to submit a future date
    if (date > todayStr) {
      throw new BadRequestException('Cannot submit reports for future dates');
    }
    // Just use the string directly
    const existingReport = await this.prisma.report.findFirst({
      where: {
        userId,
        date: date, // Compare strings
      },
    });

    if (existingReport) {
      throw new BadRequestException('Report already exists for this date');
    }

    const report = await this.prisma.report.create({
      data: {
        userId,
        date, // Store the string
        content,
        status: ReportStatus.PENDING,
        version: 1,
        submittedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    });

    return this.toResponseDto(report, userId, Role.MEMBER);
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

    if (updateReportDto.date) {
      const todayStr = this.timeService.getTodayString();
      if (updateReportDto.date > todayStr) {
        throw new BadRequestException('Cannot update report to a future date');
      }
    }
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
        approvedAt: this.timeService.now(),
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
    startDate?: string, // Changed from Date to string
    endDate?: string, // Changed from Date to string
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

  async getMissingReports(userId: string): Promise<MissingReportDto[]> {
    // Get date strings for the last 7 days
    const last7Days = this.timeService.getDateRangeStrings(7);

    const reports = await this.prisma.report.findMany({
      where: {
        userId,
        date: {
          in: last7Days,
        },
      },
    });

    const existingDates = new Set(reports.map((r) => r.date));

    const missingDays: MissingReportDto[] = last7Days
      .filter((dateStr) => !existingDates.has(dateStr))
      .map((dateStr) => {
        const { year, month, day } = this.timeService.parseDateString(dateStr);
        // Create a date object just for day of week calculation
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        return {
          date: dateStr,
          dayOfWeek: date.toLocaleDateString('en-US', {
            weekday: 'long',
            timeZone: 'UTC',
          }),
          isMissing: true,
        };
      });
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
    void _currentUserRole;
    const isOwner = report.userId === currentUserId;

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
      date: report.date, // Already a string, no conversion needed
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
