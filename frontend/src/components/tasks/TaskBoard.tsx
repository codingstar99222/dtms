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
  MoreVert as MoreIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAssign: (task: Task) => void;
  onStart: (task: Task) => void;
  onComplete: (task: Task) => void;
  onView: (task: Task) => void;
}

type TaskStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'CREATED', title: 'To Do', color: '#9e9e9e' },
  { status: 'ASSIGNED', title: 'Assigned', color: '#2196f3' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: '#ff9800' },
  { status: 'REVIEW', title: 'Review', color: '#9c27b0' },
  { status: 'COMPLETED', title: 'Completed', color: '#4caf50' },
  { status: 'CANCELLED', title: 'Cancelled', color: '#f44336' },
];

const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    default: return 'default';
  }
};

const TaskBoard = ({ 
  tasks, 
  onEdit, 
  onDelete, 
  onAssign, 
  onStart, 
  onComplete, 
  onView 
}: TaskBoardProps) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleAction = (action: 'edit' | 'delete' | 'assign' | 'start' | 'complete' | 'view') => {
    if (!selectedTask) return;
    
    switch (action) {
      case 'edit':
        onEdit(selectedTask);
        break;
      case 'delete':
        onDelete(selectedTask.id);
        break;
      case 'assign':
        onAssign(selectedTask);
        break;
      case 'start':
        onStart(selectedTask);
        break;
      case 'complete':
        onComplete(selectedTask);
        break;
      case 'view':
        onView(selectedTask);
        break;
    }
    handleMenuClose();
  };

  const canEdit = (task: Task) => {
    return user?.role === 'ADMIN' || task.creatorId === user?.id;
  };

  const canStart = (task: Task) => {
    return task.assigneeId === user?.id && task.status === 'ASSIGNED';
  };

  const canComplete = (task: Task) => {
    return (task.assigneeId === user?.id || task.creatorId === user?.id) && 
      ['IN_PROGRESS', 'REVIEW'].includes(task.status);
  };

  return (
    <Box sx={{ overflowX: 'auto', py: 2 }}>
      <Grid container spacing={2} sx={{ flexWrap: 'nowrap', minWidth: '1200px' }}>
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.status);
          
          return (
            <Grid size={{ xs: 2 }} key={column.status}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {task.title}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, task);
                            }}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
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
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                        </Box>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>View Details</MenuItem>
        {selectedTask && canEdit(selectedTask) && (
          <MenuItem onClick={() => handleAction('edit')}>Edit</MenuItem>
        )}
        {selectedTask && selectedTask.status === 'CREATED' && (
          <MenuItem onClick={() => handleAction('assign')}>Assign</MenuItem>
        )}
        {selectedTask && user?.role === 'ADMIN' && (
          <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TaskBoard;