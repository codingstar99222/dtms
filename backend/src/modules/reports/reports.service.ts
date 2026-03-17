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
import { ReportStatus, Role } from '@prisma/client';

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
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toResponseDto(report as ReportWithUser);
  }

  async findAll(userId: string, userRole: Role): Promise<ReportResponseDto[]> {
    let reports;

    if (userRole === Role.ADMIN) {
      // Admins see all reports
      reports = await this.prisma.report.findMany({
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { submittedAt: 'desc' }],
      });
    } else {
      // Members see only their own reports
      reports = await this.prisma.report.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { submittedAt: 'desc' }],
      });
    }

    return (reports as ReportWithUser[]).map((report) =>
      this.toResponseDto(report),
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
          select: {
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check if user has access to this report
    if (userRole !== Role.ADMIN && report.userId !== userId) {
      throw new ForbiddenException('You can only view your own reports');
    }

    return this.toResponseDto(report as ReportWithUser);
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

    // Only the owner can update, and only if report is pending
    if (report.userId !== userId) {
      throw new ForbiddenException('You can only update your own reports');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Only pending reports can be updated');
    }

    const updateData: {
      date?: Date;
      content?: string;
    } = {};

    if (updateReportDto.date) {
      const newDate = new Date(updateReportDto.date);
      newDate.setHours(0, 0, 0, 0);
      updateData.date = newDate;
    }

    if (updateReportDto.content !== undefined) {
      updateData.content = updateReportDto.content;
    }

    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toResponseDto(updatedReport as ReportWithUser);
  }

  async approve(
    id: string,
    approveReportDto: ApproveReportDto,
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

    return this.toResponseDto(updatedReport as ReportWithUser);
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.report.count({
      where: { status: ReportStatus.PENDING },
    });
  }

  async getUserReports(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ReportResponseDto[]> {
    const where: {
      userId: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

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
      this.toResponseDto(report),
    );
  }

  private toResponseDto(report: ReportWithUser): ReportResponseDto {
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
    };
  }
}
