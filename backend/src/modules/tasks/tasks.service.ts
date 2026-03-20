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
import { TimeService } from '../../common/services/time.service';

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
  deadline: string | null;
  isArchived: boolean;
  assignee: { name: string } | null;
  creator: { name: string };
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private timeService: TimeService,
  ) {}

  async create(
    creatorId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true },
    });

    if (user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create tasks');
    }

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

    // Set initial status based on assignee
    const initialStatus = assigneeId ? TaskStatus.ASSIGNED : TaskStatus.CREATED;

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        priority: priority || Priority.MEDIUM,
        creatorId,
        assigneeId: assigneeId || null,
        client,
        rate,
        budget,
        deadline: deadline || null,
        status: initialStatus,
        createdAt: this.timeService.now(),
        isArchived: false,
      },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
    });

    return this.toResponseDto(task as TaskWithUsers);
  }

  async findAll(
    userId: string,
    userRole: Role,
    filter?: TaskFilterDto,
  ): Promise<TaskResponseDto[]> {
    const where: Prisma.TaskWhereInput = {
      // By default, hide archived tasks unless requested
      isArchived: filter?.showArchived ? undefined : false,
    };

    // Role-based filtering
    if (userRole === Role.ADMIN) {
      // Admin sees all tasks
      if (filter?.assigneeId) where.assigneeId = filter.assigneeId;
      if (filter?.creatorId) where.creatorId = filter.creatorId;
      if (filter?.unassigned) where.assigneeId = null;
    } else {
      // Members only see tasks assigned to them
      where.assigneeId = userId;
    }

    // Apply status filter
    if (filter?.status) where.status = filter.status;
    if (filter?.priority) where.priority = filter.priority;
    if (filter?.fromDate || filter?.toDate) {
      where.createdAt = {};
      if (filter?.fromDate) where.createdAt.gte = new Date(filter.fromDate);
      if (filter?.toDate) where.createdAt.lte = new Date(filter.toDate);
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return tasks.map((task) => this.toResponseDto(task as TaskWithUsers));
  }

  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

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

    if (userRole !== Role.ADMIN && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only admin or task creator can update tasks',
      );
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (updateTaskDto.title !== undefined)
      updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined)
      updateData.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined)
      updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.assigneeId !== undefined) {
      if (updateTaskDto.assigneeId === null) {
        updateData.assignee = { disconnect: true };
      } else {
        updateData.assignee = { connect: { id: updateTaskDto.assigneeId } };
      }
    }
    if (updateTaskDto.client !== undefined)
      updateData.client = updateTaskDto.client;
    if (updateTaskDto.rate !== undefined) updateData.rate = updateTaskDto.rate;
    if (updateTaskDto.budget !== undefined)
      updateData.budget = updateTaskDto.budget;
    if (updateTaskDto.hoursWorked !== undefined)
      updateData.hoursWorked = updateTaskDto.hoursWorked;

    if (updateTaskDto.deadline !== undefined) {
      updateData.deadline = updateTaskDto.deadline || null;
    }

    // Handle status transitions
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      this.validateStatusTransition(task.status, updateTaskDto.status);

      if (updateTaskDto.status === TaskStatus.IN_PROGRESS && !task.startedAt) {
        updateData.startedAt = this.timeService.now();
      } else if (updateTaskDto.status === TaskStatus.COMPLETED) {
        updateData.completedAt = this.timeService.now();
      } else if (updateTaskDto.status === TaskStatus.CANCELLED) {
        updateData.cancelledAt = this.timeService.now();
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
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

    if (userRole !== Role.ADMIN && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only admin or task creator can assign tasks',
      );
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    const newStatus =
      task.status === TaskStatus.CREATED ? TaskStatus.ASSIGNED : task.status;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status: newStatus,
      },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
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

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('Only the assignee can start this task');
    }

    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException(
        `Cannot start task with status ${task.status}`,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: this.timeService.now(),
      },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: TaskStatus,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('Only the assignee can update task status');
    }

    this.validateStatusTransition(task.status, status);

    const updateData: Prisma.TaskUpdateInput = { status };

    if (status === TaskStatus.IN_PROGRESS && !task.startedAt) {
      updateData.startedAt = this.timeService.now();
    } else if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = this.timeService.now();
    } else if (status === TaskStatus.CANCELLED) {
      updateData.cancelledAt = this.timeService.now();
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
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

    if (task.assigneeId !== userId && task.creatorId !== userId) {
      throw new ForbiddenException(
        'Only assignee or creator can complete this task',
      );
    }

    if (task.status !== TaskStatus.REVIEW) {
      throw new BadRequestException('Only tasks in review can be completed');
    }

    const updateData: Prisma.TaskUpdateInput = {
      status: TaskStatus.COMPLETED,
      completedAt: this.timeService.now(),
    };

    if (hoursWorked !== undefined) {
      updateData.hoursWorked = (task.hoursWorked || 0) + hoursWorked;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
  }

  async getDashboardStats(userId: string, userRole: Role) {
    const baseWhere: Prisma.TaskWhereInput = {};

    if (userRole !== Role.ADMIN) {
      baseWhere.OR = [{ creatorId: userId }, { assigneeId: userId }];
    }

    const todayStr = this.timeService.getTodayString();

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      unassignedTasks,
    ] = await Promise.all([
      this.prisma.task.count({ where: baseWhere }),
      this.prisma.task.count({
        where: { ...baseWhere, status: TaskStatus.CREATED },
      }),
      this.prisma.task.count({
        where: { ...baseWhere, status: TaskStatus.IN_PROGRESS },
      }),
      this.prisma.task.count({
        where: { ...baseWhere, status: TaskStatus.COMPLETED },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          deadline: { lt: todayStr },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          assigneeId: null,
          status: TaskStatus.CREATED,
        },
      }),
    ]);

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      unassignedTasks,
    };
  }

  async getUnassignedCount(): Promise<{ count: number }> {
    const count = await this.prisma.task.count({
      where: {
        assigneeId: null,
        status: TaskStatus.CREATED,
      },
    });
    return { count };
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
      [TaskStatus.ASSIGNED]: [
        TaskStatus.IN_PROGRESS,
        TaskStatus.REVIEW,
        TaskStatus.CANCELLED,
      ],
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

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Admin can delete any task
    if (userRole === Role.ADMIN) {
      await this.prisma.task.delete({ where: { id } });
      return;
    }

    // Task owner can delete their own tasks that are not completed/cancelled and not archived
    if (
      task.assigneeId === userId &&
      !task.isArchived &&
      !['COMPLETED', 'CANCELLED'].includes(task.status)
    ) {
      await this.prisma.task.delete({ where: { id } });
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to delete this task',
    );
  }

  async archive(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only owner (assignee) or admin can archive
    if (userRole !== Role.ADMIN && task.assigneeId !== userId) {
      throw new ForbiddenException(
        'Only the assignee or admin can archive tasks',
      );
    }

    // Only completed or cancelled tasks can be archived
    if (!['COMPLETED', 'CANCELLED'].includes(task.status)) {
      throw new BadRequestException(
        'Only completed or cancelled tasks can be archived',
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { isArchived: true },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
    });

    return this.toResponseDto(updatedTask as TaskWithUsers);
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
      isArchived: task.isArchived,
    };
  }
}
