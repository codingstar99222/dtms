// backend/src/modules/time-tracking/time-tracking.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StartTimeEntryDto,
  StopTimeEntryDto,
  CreateManualTimeEntryDto,
  UpdateTimeEntryDto,
  TimeEntryResponseDto,
  TimeSummaryDto,
  DateRangeDto,
  ActiveTimerDto,
} from './dto/time-tracking.dto';
import { Role, Prisma } from '@prisma/client';

interface TimeEntryWithDetails {
  id: string;
  userId: string;
  taskId: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
  };
  task: {
    title: string;
  } | null;
}

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  // Start a timer (automatic tracking)
  async startTimer(
    userId: string,
    startDto: StartTimeEntryDto,
  ): Promise<TimeEntryResponseDto> {
    // Check if user already has an active timer
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (activeTimer) {
      throw new BadRequestException(
        'You already have an active timer. Stop it first.',
      );
    }

    // Verify task exists if provided
    if (startDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: startDto.taskId },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: startDto.taskId,
        description: startDto.description,
        startTime: new Date(),
      },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    return this.toResponseDto(entry as TimeEntryWithDetails);
  }

  // Stop the active timer
  async stopTimer(
    userId: string,
    stopDto: StopTimeEntryDto,
  ): Promise<TimeEntryResponseDto> {
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (!activeEntry) {
      throw new BadRequestException('No active timer found');
    }

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - activeEntry.startTime.getTime()) / 60000,
    ); // minutes

    const updatedEntry = await this.prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        endTime,
        duration,
        description: stopDto.description || activeEntry.description,
      },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    // Update task hours if linked to a task
    if (activeEntry.taskId) {
      await this.prisma.task.update({
        where: { id: activeEntry.taskId },
        data: {
          hoursWorked: {
            increment: duration / 60, // Convert to hours
          },
        },
      });
    }

    return this.toResponseDto(updatedEntry as TimeEntryWithDetails);
  }

  // Get active timer status
  async getActiveTimer(userId: string): Promise<ActiveTimerDto> {
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    if (!activeEntry) {
      return { isActive: false };
    }

    const elapsedMinutes = Math.round(
      (new Date().getTime() - activeEntry.startTime.getTime()) / 60000,
    );

    return {
      isActive: true,
      entry: this.toResponseDto(activeEntry as TimeEntryWithDetails),
      elapsedMinutes,
    };
  }

  // Create manual time entry
  async createManualEntry(
    userId: string,
    createDto: CreateManualTimeEntryDto,
  ): Promise<TimeEntryResponseDto> {
    const { startTime, endTime, taskId, description } = createDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    // Verify task exists if provided
    if (taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        taskId,
        description,
        startTime: start,
        endTime: end,
        duration,
      },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    // Update task hours if linked to a task
    if (taskId) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          hoursWorked: {
            increment: duration / 60,
          },
        },
      });
    }

    return this.toResponseDto(entry as TimeEntryWithDetails);
  }

  // Get all time entries for a user
  async findAll(
    userId: string,
    userRole: Role,
    dateRange?: DateRangeDto,
    targetUserId?: string,
  ): Promise<TimeEntryResponseDto[]> {
    const where: Prisma.TimeEntryWhereInput = {};

    // Filter by user
    if (targetUserId && userRole === Role.ADMIN) {
      where.userId = targetUserId;
    } else {
      where.userId = userId;
    }

    // Filter by date range
    if (dateRange) {
      where.startTime = {};
      if (dateRange.startDate) {
        where.startTime.gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.startTime.lte = new Date(dateRange.endDate);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return (entries as TimeEntryWithDetails[]).map((e) =>
      this.toResponseDto(e),
    );
  }

  // Get single time entry
  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TimeEntryResponseDto> {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    // Check access
    if (userRole !== Role.ADMIN && entry.userId !== userId) {
      throw new ForbiddenException('You can only view your own time entries');
    }

    return this.toResponseDto(entry as TimeEntryWithDetails);
  }

  // Update time entry
  async update(
    id: string,
    userId: string,
    userRole: Role,
    updateDto: UpdateTimeEntryDto,
  ): Promise<TimeEntryResponseDto> {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    // Only admin or owner can update
    if (userRole !== Role.ADMIN && entry.userId !== userId) {
      throw new ForbiddenException('You can only update your own time entries');
    }

    // Can't update active timer
    if (!entry.endTime) {
      throw new BadRequestException(
        'Cannot update an active timer. Stop it first.',
      );
    }

    const updateData: Prisma.TimeEntryUpdateInput = {};

    if (updateDto.startTime)
      updateData.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime) updateData.endTime = new Date(updateDto.endTime);
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;

    if (updateDto.taskId !== undefined) {
      if (updateDto.taskId) {
        // Verify task exists
        const task = await this.prisma.task.findUnique({
          where: { id: updateDto.taskId },
        });
        if (!task) {
          throw new NotFoundException('Task not found');
        }
        updateData.task = { connect: { id: updateDto.taskId } };
      } else {
        updateData.task = { disconnect: true };
      }
    }

    // Recalculate duration if times changed
    if (updateDto.startTime || updateDto.endTime) {
      const start = updateDto.startTime
        ? new Date(updateDto.startTime)
        : entry.startTime;
      const end = updateDto.endTime
        ? new Date(updateDto.endTime)
        : entry.endTime;

      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }

      updateData.duration = Math.round(
        (end.getTime() - start.getTime()) / 60000,
      );
    }

    const updatedEntry = await this.prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    return this.toResponseDto(updatedEntry as TimeEntryWithDetails);
  }

  // Delete time entry
  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    // Only admin or owner can delete
    if (userRole !== Role.ADMIN && entry.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time entries');
    }

    await this.prisma.timeEntry.delete({
      where: { id },
    });
  }

  // Get time summary for a user
  async getSummary(
    userId: string,
    userRole: Role,
    dateRange?: DateRangeDto,
    targetUserId?: string,
  ): Promise<TimeSummaryDto> {
    const where: Prisma.TimeEntryWhereInput = { endTime: { not: null } }; // Only completed entries

    // Filter by user
    if (targetUserId && userRole === Role.ADMIN) {
      where.userId = targetUserId;
    } else {
      where.userId = userId;
    }

    // Filter by date range
    if (dateRange) {
      where.startTime = {};
      if (dateRange.startDate) {
        where.startTime.gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.startTime.lte = new Date(dateRange.endDate);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    // Group by task
    const taskMap = new Map<
      string,
      { taskId: string; taskTitle: string; minutes: number }
    >();
    entries.forEach((e) => {
      if (e.taskId && e.task) {
        const current = taskMap.get(e.taskId) || {
          taskId: e.taskId,
          taskTitle: e.task.title,
          minutes: 0,
        };
        current.minutes += e.duration || 0;
        taskMap.set(e.taskId, current);
      }
    });

    const byTask = Array.from(taskMap.values()).map((t) => ({
      ...t,
      hours: t.minutes / 60,
    }));

    return {
      totalMinutes,
      totalHours: totalMinutes / 60,
      entries: (entries as TimeEntryWithDetails[]).map((e) =>
        this.toResponseDto(e),
      ),
      byTask: byTask.length > 0 ? byTask : undefined,
    };
  }

  private toResponseDto(e: TimeEntryWithDetails): TimeEntryResponseDto {
    return {
      id: e.id,
      userId: e.userId,
      userName: e.user.name,
      taskId: e.taskId || undefined,
      taskTitle: e.task?.title,
      startTime: e.startTime,
      endTime: e.endTime || undefined,
      duration: e.duration || undefined,
      description: e.description || undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
