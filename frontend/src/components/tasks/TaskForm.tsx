// frontend/src/components/tasks/TaskForm.tsx
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task } from '../../types';

// Define the schema without default to match the form data exactly
const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  client: z.string().optional(),
  rate: z.number().optional(),
  budget: z.number().optional(),
  deadline: z.date().optional(),
  assigneeId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  users?: { id: string; name: string }[];
}

const TaskForm = ({ open, onClose, onSubmit, task, users = [] }: TaskFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      client: '',
      rate: undefined,
      budget: undefined,
      deadline: undefined,
      assigneeId: '',
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        client: task.client || '',
        rate: task.rate,
        budget: task.budget,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        assigneeId: task.assigneeId || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        priority: 'MEDIUM',
        client: '',
        rate: undefined,
        budget: undefined,
        deadline: undefined,
        assigneeId: '',
      });
    }
  }, [task, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Task Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  required
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  required
                />
              )}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select {...field} label="Priority">
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="URGENT">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Assign To</InputLabel>
                      <Select {...field} label="Assign To">
                        <MenuItem value="">Unassigned</MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="client"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Client"
                      fullWidth
                      error={!!errors.client}
                      helperText={errors.client?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Deadline"
                        value={field.value || null}
                        onChange={(date) => {
                          if (date) {
                            // Convert back to YYYY-MM-DD string for backend
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            field.onChange(`${year}-${month}-${day}`);
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="rate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Hourly Rate ($)"
                      type="number"
                      fullWidth
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      error={!!errors.rate}
                      helperText={errors.rate?.message}
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Controller
                  name="budget"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Total Budget ($)"
                      type="number"
                      fullWidth
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      error={!!errors.budget}
                      helperText={errors.budget?.message}
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : task ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;
