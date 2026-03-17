// backend/src/modules/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskFilterDto,
} from './dto/task.dto';
import { TaskStatus, Priority, Role, Prisma } from '@prisma/client';

interface TaskWithUsers {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  creatorId: string;
  client: string | null;
  rate: number | null;
  budget: number | null;
  hoursWorked: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  deadline: Date | null;
  assignee: { name: string } | null;
  creator: { name: string };
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(
    creatorId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const {
      title,
      description,
      priority,
      assigneeId,
      client,
      rate,
      budget,
      deadline,
    } = createTaskDto;

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        priority: priority || Priority.MEDIUM,
        creatorId,
        assigneeId,
        client,
        rate,
        budget,
        deadline: deadline ? new Date(deadline) : null,
        status: TaskStatus.CREATED,
      },
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(task as TaskWithUsers);
  }

  async findAll(
    userId: string,
    userRole: Role,
    filter?: TaskFilterDto,
  ): Promise<TaskResponseDto[]> {
    interface TaskWhereInput {
      status?: TaskStatus;
      assigneeId?: string;
      creatorId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      OR?: Array<{
        creatorId?: string;
        assigneeId?: string;
      }>;
    }

    const where: TaskWhereInput = {};

    // Apply filters
    if (filter) {
      if (filter.status) where.status = filter.status;
      if (filter.assigneeId) where.assigneeId = filter.assigneeId;
      if (filter.creatorId) where.creatorId = filter.creatorId;

      if (filter.fromDate || filter.toDate) {
        where.createdAt = {};
        if (filter.fromDate) where.createdAt.gte = new Date(filter.fromDate);
        if (filter.toDate) where.createdAt.lte = new Date(filter.toDate);
      }
    }

    // Non-admins can only see tasks they created or are assigned to
    if (userRole !== Role.ADMIN) {
      where.OR = [{ creatorId: userId }, { assigneeId: userId }];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return (tasks as TaskWithUsers[]).map((task) => this.toResponseDto(task));
  }

  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    if (
      userRole !== Role.ADMIN &&
      task.creatorId !== userId &&
      task.assigneeId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return this.toResponseDto(task as TaskWithUsers);
  }

  async update(
    id: string,
    userId: string,
    userRole: Role,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permission: only admin or creator can update
    if (userRole !== Role.ADMIN && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only admin or task creator can update tasks',
      );
    }

    // Prepare update data
    const updateData: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: Priority;
      assigneeId: string | null;
      client: string | null;
      rate: number | null;
      budget: number | null;
      hoursWorked: number;
      startedAt: Date;
      completedAt: Date;
      cancelledAt: Date;
      deadline: Date | null;
    }> = {};

    if (updateTaskDto.title !== undefined)
      updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined)
      updateData.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined)
      updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.assigneeId !== undefined)
      updateData.assigneeId = updateTaskDto.assigneeId;
    if (updateTaskDto.client !== undefined)
      updateData.client = updateTaskDto.client;
    if (updateTaskDto.rate !== undefined) updateData.rate = updateTaskDto.rate;
    if (updateTaskDto.budget !== undefined)
      updateData.budget = updateTaskDto.budget;
    if (updateTaskDto.hoursWorked !== undefined)
      updateData.hoursWorked = updateTaskDto.hoursWorked;

    if (updateTaskDto.deadline) {
      updateData.deadline = new Date(updateTaskDto.deadline);
    }

    // Handle status transitions
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      this.validateStatusTransition(task.status, updateTaskDto.status);

      // Set timestamps based on status
      if (updateTaskDto.status === TaskStatus.IN_PROGRESS && !task.startedAt) {
        updateData.startedAt = new Date();
      } else if (updateTaskDto.status === TaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (updateTaskDto.status === TaskStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async assign(
    id: string,
    assigneeId: string,
    userId: string,
    userRole: Role,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permission: only admin or creator can assign
    if (userRole !== Role.ADMIN && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only admin or task creator can assign tasks',
      );
    }

    // Verify assignee exists
    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status:
          task.status === TaskStatus.CREATED
            ? TaskStatus.ASSIGNED
            : task.status,
      },
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async startTask(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only assignee can start the task
    if (task.assigneeId !== userId) {
      throw new ForbiddenException('Only the assignee can start this task');
    }

    if (
      task.status !== TaskStatus.ASSIGNED &&
      task.status !== TaskStatus.CREATED
    ) {
      throw new BadRequestException(
        `Cannot start task with status ${task.status}`,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async completeTask(
    id: string,
    userId: string,
    hoursWorked?: number,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only assignee or admin can complete
    if (task.assigneeId !== userId && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only assignee or creator can complete this task',
      );
    }

    if (
      task.status !== TaskStatus.IN_PROGRESS &&
      task.status !== TaskStatus.REVIEW
    ) {
      throw new BadRequestException(
        'Only in-progress or review tasks can be completed',
      );
    }

    const updateData: {
      status: TaskStatus;
      completedAt: Date;
      hoursWorked?: number;
    } = {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    };

    if (hoursWorked !== undefined) {
      updateData.hoursWorked = (task.hoursWorked || 0) + hoursWorked;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async getDashboardStats(userId: string, userRole: Role) {
    // Build base where clause with proper Prisma type
    const baseWhere: Prisma.TaskWhereInput = {};

    if (userRole !== Role.ADMIN) {
      baseWhere.OR = [{ creatorId: userId }, { assigneeId: userId }];
    }

    // Create typed where clauses
    const totalWhere: Prisma.TaskWhereInput = { ...baseWhere };

    const pendingWhere: Prisma.TaskWhereInput = {
      ...baseWhere,
      status: TaskStatus.CREATED,
    };

    const inProgressWhere: Prisma.TaskWhereInput = {
      ...baseWhere,
      status: TaskStatus.IN_PROGRESS,
    };

    const completedWhere: Prisma.TaskWhereInput = {
      ...baseWhere,
      status: TaskStatus.COMPLETED,
    };

    const overdueWhere: Prisma.TaskWhereInput = {
      ...baseWhere,
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      deadline: { lt: new Date() },
    };

    // Execute all queries in parallel with proper typing
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
    ] = await Promise.all([
      this.prisma.task.count({ where: totalWhere }),
      this.prisma.task.count({ where: pendingWhere }),
      this.prisma.task.count({ where: inProgressWhere }),
      this.prisma.task.count({ where: completedWhere }),
      this.prisma.task.count({ where: overdueWhere }),
    ]);

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
    };
  }

  private validateStatusTransition(
    current: TaskStatus,
    next: TaskStatus,
  ): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.CREATED]: [
        TaskStatus.ASSIGNED,
        TaskStatus.IN_PROGRESS,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [
        TaskStatus.REVIEW,
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.REVIEW]: [
        TaskStatus.COMPLETED,
        TaskStatus.IN_PROGRESS,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  private toResponseDto(task: TaskWithUsers): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || undefined,
      assigneeName: task.assignee?.name,
      creatorId: task.creatorId,
      creatorName: task.creator.name,
      client: task.client || undefined,
      rate: task.rate || undefined,
      budget: task.budget || undefined,
      hoursWorked: task.hoursWorked,
      createdAt: task.createdAt,
      startedAt: task.startedAt || undefined,
      completedAt: task.completedAt || undefined,
      cancelledAt: task.cancelledAt || undefined,
      deadline: task.deadline || undefined,
    };
  }
}
