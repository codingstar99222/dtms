// backend/src/modules/tasks/tasks.controller.ts
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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/task.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, TaskStatus } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AllowAll } from 'src/common/decorators/allow-all.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  // Only admins can create tasks
  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Request() req: RequestWithUser,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Query() filter?: TaskFilterDto,
  ) {
    return this.tasksService.findAll(req.user.id, req.user.role, filter);
  }

  @Get('unassigned/count')
  @Roles(Role.ADMIN)
  async getUnassignedCount() {
    const count = await this.prisma.task.count({
      where: {
        assigneeId: null,
        status: TaskStatus.CREATED,
      },
    });
    return { count };
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req: RequestWithUser) {
    return this.tasksService.getDashboardStats(req.user.id, req.user.role);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.id, req.user.role);
  }

  // Only admins can update task details
  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(
      id,
      req.user.id,
      req.user.role,
      updateTaskDto,
    );
  }

  // Members can update status (for drag-and-drop)
  @Patch(':id/status')
  updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.updateStatus(id, req.user.id, status);
  }

  // Only admins can assign tasks
  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  async assign(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.tasksService.assign(id, assigneeId, req.user.id, req.user.role);
  }

  // Members can start their assigned tasks
  @Patch(':id/start')
  async startTask(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.startTask(id, req.user.id);
  }

  // Members can complete their assigned tasks
  @Patch(':id/complete')
  async completeTask(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('hoursWorked') hoursWorked?: number,
  ) {
    return this.tasksService.completeTask(id, req.user.id, hoursWorked);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowAll()
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    try {
      await this.tasksService.remove(id, req.user.id, req.user.role);
    } catch (error) {
      console.log('🗑️ Delete error:');
      throw error;
    }
  }

  @Patch(':id/archive')
  async archive(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.archive(id, req.user.id, req.user.role);
  }
}
