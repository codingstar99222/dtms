// frontend/src/components/time-tracking/Timer.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingService } from '../../services/time-tracking.service';
import { tasksService } from '../../services/tasks.service';
import type { ActiveTimer } from '../../services/time-tracking.service';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface TimerProps {
  onTimerStart?: () => void;
  onTimerStop?: () => void;
}

const Timer = ({ onTimerStart, onTimerStop }: TimerProps) => {
  const queryClient = useQueryClient();
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null); // <-- Fix 1: Allow null

  // Fetch active timer
  const { data: activeTimer, isLoading } = useQuery<ActiveTimer>({
    queryKey: ['time-tracking', 'active'],
    queryFn: timeTrackingService.getActiveTimer,
    refetchInterval: 10000,
  });

  // Fetch tasks for selection
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.findAll(),
  });

  // Start timer mutation
  const startMutation = useMutation({
    mutationFn: (data: { taskId?: string; description?: string }) =>
      timeTrackingService.startTimer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] });
      setTaskId('');
      setDescription('');
      toast.success('Timer started');
      onTimerStart?.();
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to start timer');
    },
  });

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: (data: { description?: string }) =>
      timeTrackingService.stopTimer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] });
      setElapsedTime(0);
      toast.success('Timer stopped');
      onTimerStop?.();
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to stop timer');
    },
  });

  // Single effect to handle timer updates
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // --- Fix 2: Do NOT set state here. Derive the initial value. ---
    // If the timer is not active, we ensure the interval isn't running.
    // The `elapsedTime` state will be set by the interval or left at 0.
    if (!activeTimer?.isActive || !activeTimer.entry) {
      return; // No timer to run, cleanup already happened.
    }

    // Start new timer
    const startTime = new Date(activeTimer.entry.startTime).getTime();

    timerRef.current = window.setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeTimer]); // <-- Fix 3: Only activeTimer is the dependency.

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const handleStart = () => {
    startMutation.mutate({ taskId: taskId || undefined, description });
  };

  const handleStop = () => {
    stopMutation.mutate({ description });
  };

  const isTimerActive = activeTimer?.isActive || false;
  const activeEntry = activeTimer?.entry;

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Time Tracker
      </Typography>

      {isTimerActive && activeEntry && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon />
            <Typography variant="body1">
              Active: {activeEntry.taskTitle || 'No task'} - {formatTime(elapsedTime)}
            </Typography>
          </Box>
        </Alert>
      )}

      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Task</InputLabel>
          <Select
            value={taskId}
            label="Task"
            onChange={(e) => setTaskId(e.target.value)}
            disabled={isTimerActive}
          >
            <MenuItem value="">No Task (General)</MenuItem>
            {tasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.title} ({task.status})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Description"
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isTimerActive}
          placeholder="What are you working on?"
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isTimerActive ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<StartIcon />}
              onClick={handleStart}
              disabled={startMutation.isPending}
              fullWidth
            >
              {startMutation.isPending ? 'Starting...' : 'Start Timer'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStop}
              disabled={stopMutation.isPending}
              fullWidth
            >
              {stopMutation.isPending ? 'Stopping...' : 'Stop Timer'}
            </Button>
          )}
        </Box>

        {isTimerActive && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h3" sx={{ fontFamily: 'monospace' }}>
              {formatTime(elapsedTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Started at: {activeEntry ? new Date(activeEntry.startTime).toLocaleTimeString() : ''}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default Timer;