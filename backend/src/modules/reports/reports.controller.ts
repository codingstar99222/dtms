// backend/src/modules/reports/reports.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ApproveReportDto,
} from './dto/report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, ReportStatus } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.create(req.user.id, createReportDto);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.reportsService.findAll(req.user.id, req.user.role);
  }

  @Get('pending-count')
  @Roles(Role.ADMIN)
  async getPendingCount() {
    const count = await this.reportsService.getPendingCount();
    return { count };
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  async getUserReports(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getUserReports(userId, start, end);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.reportsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, req.user.id, updateReportDto);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() approveReportDto: ApproveReportDto,
  ) {
    return this.reportsService.approve(id, approveReportDto);
  }

  @Delete(':id')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    const report = await this.reportsService.findOne(
      id,
      req.user.id,
      req.user.role,
    );

    if (report.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    if (
      report.status !== ReportStatus.PENDING &&
      req.user.role !== Role.ADMIN
    ) {
      throw new BadRequestException('Only pending reports can be deleted');
    }

    await this.prisma.report.delete({ where: { id } });
    return { message: 'Report deleted successfully' };
  }
}
