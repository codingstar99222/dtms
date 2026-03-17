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

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
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

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req: RequestWithUser) {
    return this.tasksService.getDashboardStats(req.user.id, req.user.role);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
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

  @Patch(':id/assign')
  async assign(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.tasksService.assign(id, assigneeId, req.user.id, req.user.role);
  }

  @Patch(':id/start')
  async startTask(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.startTask(id, req.user.id);
  }

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
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.prisma.task.delete({ where: { id } });
  }
}
