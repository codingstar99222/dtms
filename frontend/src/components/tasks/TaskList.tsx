// frontend/src/components/tasks/TaskList.tsx
import { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  type SelectChangeEvent,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  AssignmentInd as AssignIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAssign: (task: Task) => void;
  onStart: (task: Task) => void;
  onComplete: (task: Task) => void;
  onView: (task: Task) => void;
}

type StatusColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';

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

const TaskList = ({ 
  tasks, 
  onEdit, 
  onDelete, 
  onAssign, 
  onStart, 
  onComplete,
  onView 
}: TaskListProps) => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assigneeName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search tasks by title, description, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="CREATED">To Do</MenuItem>
              <MenuItem value="ASSIGNED">Assigned</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="REVIEW">Review</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e: SelectChangeEvent) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map((task) => (
              <TableRow key={task.id} hover sx={{ cursor: 'pointer' }} onClick={() => onView(task)}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{
                    display: 'block',
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status.replace('_', ' ')}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {task.assigneeName ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        {task.assigneeName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{task.assigneeName}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {task.deadline ? formatDate(task.deadline) : '-'}
                </TableCell>
                <TableCell>{task.hoursWorked.toFixed(1)}h</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="View">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(task);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>

                    {canEdit(task) && task.status === 'CREATED' && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assign">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssign(task);
                            }}
                          >
                            <AssignIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {canStart(task) && (
                      <Tooltip title="Start">
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
                      <Tooltip title="Complete">
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

                    {user?.role === 'ADMIN' && (
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
                </TableCell>
              </TableRow>
            ))}
            {paginatedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No tasks found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTasks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TaskList;