// backend/src/modules/time-tracking/time-tracking.controller.ts
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import {
  StartTimeEntryDto,
  StopTimeEntryDto,
  CreateManualTimeEntryDto,
  UpdateTimeEntryDto,
  DateRangeDto,
} from './dto/time-tracking.dto';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('time-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // Timer endpoints
  @Post('timer/start')
  async startTimer(
    @Request() req: RequestWithUser,
    @Body() startDto: StartTimeEntryDto,
  ) {
    return this.timeTrackingService.startTimer(req.user.id, startDto);
  }

  @Post('timer/stop')
  async stopTimer(
    @Request() req: RequestWithUser,
    @Body() stopDto: StopTimeEntryDto,
  ) {
    return this.timeTrackingService.stopTimer(req.user.id, stopDto);
  }

  @Get('timer/active')
  async getActiveTimer(@Request() req: RequestWithUser) {
    return this.timeTrackingService.getActiveTimer(req.user.id);
  }

  // Manual entry endpoints
  @Post('entries/manual')
  async createManualEntry(
    @Request() req: RequestWithUser,
    @Body() createDto: CreateManualTimeEntryDto,
  ) {
    return this.timeTrackingService.createManualEntry(req.user.id, createDto);
  }

  @Get('entries')
  async getEntries(
    @Request() req: RequestWithUser,
    @Query() dateRange?: DateRangeDto,
    @Query('userId') targetUserId?: string,
  ) {
    return this.timeTrackingService.findAll(
      req.user.id,
      req.user.role,
      dateRange,
      targetUserId,
    );
  }

  @Get('entries/summary')
  async getSummary(
    @Request() req: RequestWithUser,
    @Query() dateRange?: DateRangeDto,
    @Query('userId') targetUserId?: string,
  ) {
    return this.timeTrackingService.getSummary(
      req.user.id,
      req.user.role,
      dateRange,
      targetUserId,
    );
  }

  @Get('entries/:id')
  async getEntry(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.timeTrackingService.findOne(id, req.user.id, req.user.role);
  }

  @Patch('entries/:id')
  async updateEntry(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto,
  ) {
    return this.timeTrackingService.update(
      id,
      req.user.id,
      req.user.role,
      updateDto,
    );
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEntry(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.timeTrackingService.remove(id, req.user.id, req.user.role);
  }
}
