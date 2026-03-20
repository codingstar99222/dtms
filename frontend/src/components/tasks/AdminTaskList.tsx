// frontend/src/components/tasks/AdminTaskList.tsx
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
  Avatar,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import { formatDate } from '../../utils/formatters';

interface AdminTaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAssign: (task: Task) => void;
  onView: (task: Task) => void;
  filterUnassigned?: boolean;
}

type StatusColor = 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary';

const getStatusColor = (status: string): StatusColor => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    case 'IN_PROGRESS':
      return 'warning';
    case 'REVIEW':
      return 'info';
    case 'ASSIGNED':
      return 'secondary'; // Show ASSIGNED in admin list
    default:
      return 'default';
  }
};

const getPriorityColor = (priority: string): StatusColor => {
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

const AdminTaskList = ({ tasks, onEdit, onDelete, onAssign, onView, filterUnassigned = false }: AdminTaskListProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const assignees = Array.from(
    new Set(tasks.filter((t) => t.assigneeName).map((t) => t.assigneeName))
  ).filter(Boolean) as string[];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !task.assigneeName) ||
      task.assigneeName === assigneeFilter;
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleAssigneeFilterChange = (event: SelectChangeEvent) => {
    setAssigneeFilter(event.target.value);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search tasks..."
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
            <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
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
            <InputLabel>Assignee</InputLabel>
            <Select value={assigneeFilter} onChange={handleAssigneeFilterChange} label="Assignee">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
              {assignees.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
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
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
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
                      <Chip label="Unassigned" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{task.deadline ? formatDate(task.deadline) : '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => onView(task)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(task)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign">
                        <IconButton size="small" onClick={() => onAssign(task)} color="info">
                          <AssignIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(task.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No tasks found
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {filterUnassigned
                      ? 'All tasks are assigned'
                      : 'Create your first task to get started'}
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

export default AdminTaskList;
