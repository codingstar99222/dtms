// frontend/src/components/time-tracking/TimeEntryViewDialog.tsx
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
} from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';
import type { TimeEntry } from '../../types';
import { formatDateTime, formatDate } from '../../utils/formatters';

interface TimeEntryViewDialogProps {
  open: boolean;
  onClose: () => void;
  entry: TimeEntry | null;
}

const formatDuration = (minutes?: number): string => {
  if (!minutes) return 'In progress';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const TimeEntryViewDialog = ({ open, onClose, entry }: TimeEntryViewDialogProps) => {
  if (!entry) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Time Entry Details
          <Chip
            icon={<TimerIcon />}
            label={entry.duration ? 'Completed' : 'In Progress'}
            color={entry.duration ? 'success' : 'warning'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h5" gutterBottom align="center">
              {formatDuration(entry.duration)}
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">User</Typography>
              <Typography variant="body2">{entry.userName}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Date</Typography>
              <Typography variant="body2">{formatDate(entry.startTime)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Start Time</Typography>
              <Typography variant="body2">{formatDateTime(entry.startTime)}</Typography>
            </Grid>
            {entry.endTime && (
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">End Time</Typography>
                <Typography variant="body2">{formatDateTime(entry.endTime)}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">Task</Typography>
              <Typography variant="body2">{entry.taskTitle || 'No task'}</Typography>
            </Grid>
            {entry.description && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{entry.description}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeEntryViewDialog;