// frontend/src/components/tasks/TaskViewDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Avatar,
} from '@mui/material';
import type { Task } from '../../types';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';

interface TaskViewDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}

type StatusColor = 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default';

const getStatusColor = (status: string): StatusColor => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    case 'IN_PROGRESS': return 'warning';
    case 'REVIEW': return 'secondary';
    case 'ASSIGNED': return 'info';
    default: return 'default';
  }
};

const getPriorityColor = (priority: string): StatusColor => {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    default: return 'default';
  }
};

const TaskViewDialog = ({ open, onClose, task }: TaskViewDialogProps) => {
  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Task Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={task.status.replace('_', ' ')}
              color={getStatusColor(task.status)}
              size="small"
            />
            <Chip
              label={task.priority}
              color={getPriorityColor(task.priority)}
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>{task.title}</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Assignment
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Created By</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        {task.creatorName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{task.creatorName}</Typography>
                    </Box>
                  </Box>
                  {task.assigneeName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                          {task.assigneeName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{task.assigneeName}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="body2">{formatDateTime(task.createdAt)}</Typography>
                  </Box>
                  {task.startedAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Started</Typography>
                      <Typography variant="body2">{formatDateTime(task.startedAt)}</Typography>
                    </Box>
                  )}
                  {task.completedAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Completed</Typography>
                      <Typography variant="body2">{formatDateTime(task.completedAt)}</Typography>
                    </Box>
                  )}
                  {task.deadline && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Deadline</Typography>
                      <Typography variant="body2">{formatDate(task.deadline)}</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {(task.client || task.rate || task.budget || task.hoursWorked > 0) && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Financial & Progress
              </Typography>
              <Grid container spacing={2}>
                {task.client && (
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption" color="text.secondary">Client</Typography>
                    <Typography variant="body2">{task.client}</Typography>
                  </Grid>
                )}
                {task.rate && (
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption" color="text.secondary">Hourly Rate</Typography>
                    <Typography variant="body2">{formatCurrency(task.rate)}</Typography>
                  </Grid>
                )}
                {task.budget && (
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption" color="text.secondary">Budget</Typography>
                    <Typography variant="body2">{formatCurrency(task.budget)}</Typography>
                  </Grid>
                )}
                {task.hoursWorked > 0 && (
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption" color="text.secondary">Hours Worked</Typography>
                    <Typography variant="body2">{task.hoursWorked.toFixed(1)}h</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskViewDialog;