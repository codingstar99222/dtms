// frontend/src/components/time-tracking/TimeSummary.tsx
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import type { TimeSummary as TimeSummaryType } from '../../services/time-tracking.service';

interface TimeSummaryProps {
  summary: TimeSummaryType;
}

const formatHours = (hours: number): string => {
  return hours.toFixed(1) + 'h';
};

const TimeSummary = ({ summary }: TimeSummaryProps) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimeIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Total Hours
                </Typography>
                <Typography variant="h4">
                  {formatHours(summary.totalHours)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.totalMinutes} minutes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Entries ({summary.entries.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average: {formatHours(summary.totalHours / (summary.entries.length || 1))} per entry
          </Typography>
        </Paper>
      </Grid>

      {/* Check if byTask exists and has items */}
      {summary.byTask && summary.byTask.length > 0 && (
        <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Time by Task
            </Typography>
            <List>
                {summary.byTask.map((task, index) => {
                const percentage = summary.totalMinutes > 0 
                    ? (task.minutes / summary.totalMinutes) * 100 
                    : 0;
                
                return (
                    <Box key={task.taskId}>
                    <ListItem>
                        <ListItemText
                        primary={task.taskTitle}
                        secondary={
                            <Box sx={{ mt: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {formatHours(task.hours)} ({percentage.toFixed(1)}%)
                            </Typography>
                            </Box>
                        }
                        />
                    </ListItem>
                    {/* Safe divider - only renders if byTask exists and index is valid */}
                    {summary.byTask && index < summary.byTask.length - 1 && <Divider />}
                    </Box>
                );
                })}
            </List>
            </Paper>
        </Grid>
        )}

      {/* Optional: Show message when no task data */}
      {(!summary.byTask || summary.byTask.length === 0) && summary.entries.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No task breakdown available
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default TimeSummary;