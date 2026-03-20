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
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ApproveReportDto,
} from './dto/report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
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
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Pass all required arguments: userId, userRole, startDate, endDate
    return this.reportsService.getUserReports(
      userId,
      req.user.role,
      startDate,
      endDate,
    );
  }

  @Get('missing')
  async getMissingReports(@Request() req: RequestWithUser) {
    // Only members can see their missing reports
    if (req.user.role === Role.ADMIN) {
      return []; // Admins don't have missing reports
    }
    return this.reportsService.getMissingReports(req.user.id);
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
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() approveReportDto: ApproveReportDto,
  ) {
    // Pass all 4 required arguments: id, dto, userId, userRole
    return this.reportsService.approve(
      id,
      approveReportDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    // Use the service method that already contains all the logic
    await this.reportsService.remove(id, req.user.id, req.user.role);

    return { message: 'Report deleted successfully' };
  }
}
