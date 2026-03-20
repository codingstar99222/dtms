// frontend/src/pages/Tasks.tsx
import { useState } from 'react';
import { Container, Typography, Button, Box, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import { usersService } from '../services/users.service';
import type { CreateTaskDto, UnassignedCount, UpdateTaskDto } from '../services/tasks.service';
import TaskBoard from '../components/tasks/TaskBoard';
import AdminTaskList from '../components/tasks/AdminTaskList';
import TaskForm from '../components/tasks/TaskForm';
import TaskViewDialog from '../components/tasks/TaskViewDialog';
import AssignDialog from '../components/tasks/AssignDialog';
import DeleteTaskDialog from '../components/tasks/DeleteTaskDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Task } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';

interface ErrorResponse {
  message: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  client?: string;
  rate?: number;
  budget?: number;
  deadline?: Date;
  assigneeId?: string | null;
}

const Tasks = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const filterUnassigned = searchParams.get('filter') === 'unassigned';

  // Fetch unassigned count for admin
  const { data: unassignedData } = useQuery<UnassignedCount>({
    queryKey: ['tasks', 'unassigned', 'count'],
    queryFn: () => tasksService.getUnassignedCount(),
    enabled: isAdmin,
    initialData: { count: 0 },
  });

  // Fetch tasks with role-based filtering
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery<Task[]>({
    queryKey: ['tasks', filterUnassigned ? 'unassigned' : 'all', showArchived],
    queryFn: () =>
      tasksService.findAll({
        ...(filterUnassigned && { unassigned: true }),
        ...(showArchived && { showArchived: true }),
      }),
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'members'],
    queryFn: async () => {
      const allUsers = await usersService.findAll();
      return allUsers.filter((user) => user.role === 'MEMBER');
    },
    enabled: isAdmin,
  });

  // Create task mutation (admin only)
  const createMutation = useMutation<Task, AxiosError<ErrorResponse>, CreateTaskDto>({
    mutationFn: (data: CreateTaskDto) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setFormOpen(false);
      toast.success('Task created successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  // Update task mutation (admin only)
  const updateMutation = useMutation<
    Task,
    AxiosError<ErrorResponse>,
    { id: string; data: UpdateTaskDto }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setFormOpen(false);
      setSelectedTask(null);
      toast.success('Task updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  // Delete task mutation (admin only)
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTaskDialogOpen(false);
      setSelectedTask(null);
      toast.success('Task deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  // Archive task mutation
  const archiveMutation = useMutation<Task, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => tasksService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task archived successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to archive task');
    },
  });

  // Assign task mutation (admin only)
  const assignMutation = useMutation<
    Task,
    AxiosError<ErrorResponse>,
    { id: string; assigneeId: string }
  >({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      tasksService.assign(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setAssignDialogOpen(false);
      setSelectedTask(null);
      toast.success('Task assigned successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to assign task');
    },
  });

  // Status update mutation (for members - drag and drop)
  const statusUpdateMutation = useMutation<
    Task,
    AxiosError<ErrorResponse>,
    { id: string; status: string }
  >({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    },
  });

  // Start task mutation (members)
  const startMutation = useMutation<Task, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => tasksService.startTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task started');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to start task');
    },
  });

  // Complete task mutation (members)
  const completeMutation = useMutation<
    Task,
    AxiosError<ErrorResponse>,
    { id: string; hoursWorked?: number }
  >({
    mutationFn: ({ id, hoursWorked }: { id: string; hoursWorked?: number }) =>
      tasksService.completeTask(id, hoursWorked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task completed');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    },
  });

  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Only admins can create tasks');
      return;
    }
    setSelectedTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    if (!isAdmin) {
      toast.error('Only admins can edit tasks');
      return;
    }
    setSelectedTask(task);
    setFormOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleAssign = (task: Task) => {
    if (!isAdmin) {
      toast.error('Only admins can assign tasks');
      return;
    }
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Only admin can delete, or owner can delete non-completed non-archived tasks
    const canDelete =
      isAdmin ||
      (task.assigneeId === user?.id &&
        !task.isArchived &&
        !['COMPLETED', 'CANCELLED'].includes(task.status));

    if (!canDelete) {
      toast.error('You cannot delete this task');
      return;
    }

    setSelectedTask(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleArchive = (task: Task) => {
    archiveMutation.mutate(task.id);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    statusUpdateMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleStart = (task: Task) => {
    startMutation.mutate(task.id);
  };

  const handleComplete = (task: Task) => {
    const hours = prompt('Enter hours worked:', '0');
    if (hours !== null) {
      completeMutation.mutate({
        id: task.id,
        hoursWorked: parseFloat(hours) || undefined,
      });
    }
  };

  const handleFormSubmit = async (data: TaskFormData) => {
    const taskData: CreateTaskDto = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      client: data.client,
      rate: data.rate,
      budget: data.budget,
      deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : undefined,
      assigneeId: data.assigneeId && data.assigneeId.trim() !== '' ? data.assigneeId : undefined,
    };
    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const handleAssignConfirm = (assigneeId: string) => {
    if (selectedTask) {
      assignMutation.mutate({ id: selectedTask.id, assigneeId });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask.id);
    }
  };

  const handleCloseDialogs = () => {
    setFormOpen(false);
    setViewDialogOpen(false);
    setAssignDialogOpen(false);
    setDeleteTaskDialogOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Task Management
        </Typography>

        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Create Task
          </Button>
        )}
      </Box>

      {/* Unassigned tasks alert for admin */}
      {isAdmin && (unassignedData?.count ?? 0) > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleCreate}>
              Create Task
            </Button>
          }
        >
          You have {unassignedData?.count ?? 0} unassigned task
          {(unassignedData?.count ?? 0) > 1 ? 's' : ''} waiting for assignment.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load tasks
        </Alert>
      )}

      {/* Role-based view */}
      {isAdmin ? (
        <AdminTaskList
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssign={handleAssign}
          onView={handleView}
          onArchive={handleArchive}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          filterUnassigned={filterUnassigned}
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onStart={handleStart}
          onComplete={handleComplete}
          onView={handleView}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}

      {/* Dialogs */}
      {isAdmin && (
        <>
          <TaskForm
            open={formOpen}
            onClose={handleCloseDialogs}
            onSubmit={handleFormSubmit}
            task={selectedTask}
            users={users}
          />
          <AssignDialog
            open={assignDialogOpen}
            onClose={handleCloseDialogs}
            onConfirm={handleAssignConfirm}
            taskTitle={selectedTask?.title || ''}
            users={users}
          />
        </>
      )}

      <DeleteTaskDialog
        open={deleteTaskDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        taskTitle={selectedTask?.title || ''}
      />
      {/* View dialog - available to all */}
      <TaskViewDialog open={viewDialogOpen} onClose={handleCloseDialogs} task={selectedTask} />
    </Container>
  );
};

export default Tasks;
