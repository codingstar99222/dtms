// frontend/src/components/tasks/TaskBoard.tsx
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
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  RateReview as ReviewIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ArchiveIcon from '@mui/icons-material/Archive';

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
  onArchive: (task: Task) => void;
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
  onArchive,
}: TaskBoardProps) => {
  const { user } = useAuthStore();

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
    // Admin can delete any non-archived task
    if (user?.role === 'ADMIN') return !task.isArchived;
    // Owner can delete their own non-archived tasks that are not completed/cancelled
    return (
      task.assigneeId === user?.id &&
      !task.isArchived &&
      !['COMPLETED', 'CANCELLED'].includes(task.status)
    );
  };

  // Filter out archived tasks from board
  const visibleTasks = tasks.filter((task) => !task.isArchived);

  return (
    <Box sx={{ overflowX: 'auto', py: 2 }}>
      <Grid container spacing={2} sx={{ flexWrap: 'nowrap', minWidth: '1200px' }}>
        {statusColumns.map((column) => {
          const columnTasks = visibleTasks.filter((t) => {
            return column.status.includes(t.status);
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
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                        borderLeft: `4px solid ${column.color}`,
                      }}
                      onClick={() => onView(task)}
                    >
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

                          {/* Archive for COMPLETED or CANCELLED tasks */}
                          {(task.status === 'COMPLETED' || task.status === 'CANCELLED') &&
                            !task.isArchived && (
                              <Tooltip title="Archive">
                                <IconButton
                                  size="small"
                                  color="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onArchive(task);
                                  }}
                                >
                                  <ArchiveIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                          {/* Delete button for non-archived, non-completed, non-cancelled tasks */}
                          {canDelete(task) && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(task.id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
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
    </Box>
  );
};

export default TaskBoard;
