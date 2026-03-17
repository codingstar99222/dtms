// frontend/src/components/time-tracking/TimeEntryList.tsx
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
  Box,
  Typography,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import type { TimeEntry } from '../../types';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

interface TimeEntryListProps {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
  onView: (entry: TimeEntry) => void;
}

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const TimeEntryList = ({ entries, onEdit, onDelete, onView }: TimeEntryListProps) => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(e => {
    return e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.taskTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const paginatedEntries = filteredEntries.slice(
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

  const isAdmin = user?.role === 'ADMIN';
  const canEdit = (entry: TimeEntry) => isAdmin || entry.userId === user?.id;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search entries by description, user, or task..."
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
      </Box>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEntries.map((entry) => (
              <TableRow key={entry.id} hover sx={{ cursor: 'pointer' }} onClick={() => onView(entry)}>
                <TableCell>
                  <Typography variant="body2">{entry.userName}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={formatDateTime(entry.startTime)}>
                    <span>{formatDate(entry.startTime)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {entry.taskTitle ? (
                    <Typography variant="body2">{entry.taskTitle}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<TimerIcon />}
                    label={formatDuration(entry.duration)}
                    size="small"
                    color={entry.duration ? 'default' : 'warning'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="View">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(entry);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {canEdit(entry) && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(entry);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(entry.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {paginatedEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No time entries found
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
        count={filteredEntries.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TimeEntryList;