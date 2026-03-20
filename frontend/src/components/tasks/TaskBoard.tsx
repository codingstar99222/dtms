// frontend/src/components/tasks/TaskBoard.tsx
import { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  RateReview as ReviewIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onStart: (task: Task) => void;
  onComplete: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

type TaskStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';

// Filter out ASSIGNED from the board - it's for tracking only
const statusColumns: { status: TaskStatus[]; title: string; color: string }[] = [
  { status: ['CREATED', 'ASSIGNED'], title: 'To Do', color: '#9e9e9e' },
  { status: ['IN_PROGRESS'], title: 'In Progress', color: '#ff9800' },
  { status: ['REVIEW'], title: 'Review', color: '#9c27b0' },
  { status: ['COMPLETED'], title: 'Completed', color: '#4caf50' },
  { status: ['CANCELLED'], title: 'Cancelled', color: '#f44336' },
];

const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (priority) {
    case 'URGENT':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    default:
      return 'default';
  }
};

const TaskBoard = ({
  tasks,
  onStatusChange,
  onStart,
  onComplete,
  onView,
  onDelete,
}: TaskBoardProps) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter out ASSIGNED tasks from the board - they're hidden

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'assign' | 'delete') => {
    if (!selectedTask) return;

    switch (action) {
      case 'view':
        onView(selectedTask);
        break;
      case 'delete':
        onDelete(selectedTask.id);
        break;
    }
    handleMenuClose();
  };

  const canStart = (task: Task) => {
    return (
      task.assigneeId === user?.id && (task.status === 'CREATED' || task.status === 'ASSIGNED')
    );
  };

  const canReview = (task: Task) => {
    return task.assigneeId === user?.id && task.status === 'IN_PROGRESS';
  };

  const canComplete = (task: Task) => {
    return task.assigneeId === user?.id && task.status === 'REVIEW';
  };

  const canCancel = (task: Task) => {
    return task.assigneeId === user?.id && !['COMPLETED', 'CANCELLED'].includes(task.status);
  };

  const canDelete = (task: Task) => {
    // Admin can delete any task
    if (user?.role === 'ADMIN') return true;

    // Task owner can delete their own completed or cancelled tasks
    return task.assigneeId === user?.id && ['COMPLETED', 'CANCELLED'].includes(task.status);
  };

  return (
    <Box sx={{ overflowX: 'auto', py: 2 }}>
      <Grid container spacing={2} sx={{ flexWrap: 'nowrap', minWidth: '1200px' }}>
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter((t) => {
            const matches = column.status.includes(t.status);
            return matches;
          });
          return (
            <Grid size={{ xs: 2 }} key={column.title}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {column.title}
                  </Typography>
                  <Badge badgeContent={columnTasks.length} color="primary" />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 500 }}>
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 },
                          borderLeft: `4px solid ${column.color}`,
                        }}
                        onClick={() => onView(task)}
                      >
                        <Box
                          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 500 }}
                        >
                          {columnTasks.length > 0 ? (
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                  {task.title}
                                </Typography>
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, task)}>
                                  <MoreVertIcon />
                                </IconButton>
                              </Box>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {task.description}
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  size="small"
                                  label={task.priority}
                                  color={getPriorityColor(task.priority)}
                                />
                                {task.deadline && (
                                  <Chip
                                    size="small"
                                    icon={<ScheduleIcon />}
                                    label={formatDate(task.deadline)}
                                    variant="outlined"
                                  />
                                )}
                              </Box>

                              {task.assigneeName && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                    {task.assigneeName.charAt(0)}
                                  </Avatar>
                                  <Typography variant="caption">{task.assigneeName}</Typography>
                                </Box>
                              )}
                            </CardContent>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: 200,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'divider',
                                p: 2,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" align="center">
                                No {column.title.toLowerCase()} tasks
                              </Typography>
                              {column.title === 'To Do' && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  align="center"
                                  sx={{ mt: 1 }}
                                >
                                  Tasks assigned to you will appear here
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                        <CardActions sx={{ p: 1, pt: 0 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {canStart(task) && (
                              <Tooltip title="Start Task">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStart(task);
                                  }}
                                >
                                  <StartIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canReview(task) && (
                              <Tooltip title="Send to Review">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'REVIEW');
                                  }}
                                >
                                  <ReviewIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canComplete(task) && (
                              <Tooltip title="Complete Task">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete(task);
                                  }}
                                >
                                  <CompleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canCancel(task) && (
                              <Tooltip title="Cancel Task">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'CANCELLED');
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardActions>
                      </Card>
                    ))
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        minHeight: 200,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'divider',
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" align="center">
                        No {column.title.toLowerCase()} tasks
                      </Typography>
                      {column.title === 'To Do' && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          align="center"
                          sx={{ mt: 1 }}
                        >
                          Tasks assigned to you will appear here
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction('view')}>View Details</MenuItem>
        {selectedTask && canDelete(selectedTask) && (
          <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TaskBoard;
