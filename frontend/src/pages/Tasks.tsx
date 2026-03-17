// frontend/src/pages/Tasks.tsx
import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from '@mui/material';
import { Add as AddIcon, ViewModule as BoardIcon, ViewList as ListIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import { usersService } from '../services/users.service';
import type { CreateTaskDto, UpdateTaskDto } from '../services/tasks.service';
import TaskBoard from '../components/tasks/TaskBoard';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import TaskViewDialog from '../components/tasks/TaskViewDialog';
import AssignDialog from '../components/tasks/AssignDialog';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Task } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

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
  assigneeId?: string;
}

type ViewMode = 'board' | 'list';

const Tasks = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksService.findAll(),
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.findAll,
    enabled: user?.role === 'ADMIN',
  });

  // Create task mutation
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

  // Update task mutation
  const updateMutation = useMutation<Task, AxiosError<ErrorResponse>, { id: string; data: UpdateTaskDto }>({
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

  // Delete task mutation
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      toast.success('Task deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  // Assign task mutation
  const assignMutation = useMutation<Task, AxiosError<ErrorResponse>, { id: string; assigneeId: string }>({
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

  // Start task mutation
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

  // Complete task mutation
  const completeMutation = useMutation<Task, AxiosError<ErrorResponse>, { id: string; hoursWorked?: number }>({
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
    setSelectedTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleAssign = (task: Task) => {
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDeleteDialogOpen(true);
    }
  };

  const handleStart = (task: Task) => {
    startMutation.mutate(task.id);
  };

  const handleComplete = (task: Task) => {
    // Prompt for hours worked
    const hours = prompt('Enter hours worked:', '0');
    if (hours !== null) {
      completeMutation.mutate({ 
        id: task.id, 
        hoursWorked: parseFloat(hours) || undefined 
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
      deadline: data.deadline?.toISOString().split('T')[0],
      assigneeId: data.assigneeId,
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
    setDeleteDialogOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Task Management
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="board">
              <BoardIcon sx={{ mr: 1 }} />
              Board
            </ToggleButton>
            <ToggleButton value="list">
              <ListIcon sx={{ mr: 1 }} />
              List
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Task
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load tasks
        </Alert>
      )}

      {viewMode === 'board' ? (
        <TaskBoard
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssign={handleAssign}
          onStart={handleStart}
          onComplete={handleComplete}
          onView={handleView}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssign={handleAssign}
          onStart={handleStart}
          onComplete={handleComplete}
          onView={handleView}
        />
      )}

      <TaskForm
        open={formOpen}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        task={selectedTask}
        users={users}
      />

      <TaskViewDialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        task={selectedTask}
      />

      <AssignDialog
        open={assignDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleAssignConfirm}
        taskTitle={selectedTask?.title || ''}
        users={users}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName={`task "${selectedTask?.title}"`}
      />
    </Container>
  );
};

export default Tasks;