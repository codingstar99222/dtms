// backend/src/modules/dashboard/dashboard.controller.ts
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard.dto';
import { Roles } from '../../common/decorators/roles.decorator';
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

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(
    @Request() req: RequestWithUser,
    @Query() filter?: DashboardFilterDto,
  ) {
    return this.dashboardService.getDashboardSummary(
      req.user.id,
      req.user.role,
      filter,
    );
  }

  @Get('member/:userId')
  @Roles(Role.ADMIN)
  async getMemberDashboard(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Query() filter?: DashboardFilterDto,
  ) {
    return this.dashboardService.getDashboardSummary(
      userId,
      req.user.role,
      filter,
    );
  }
}
