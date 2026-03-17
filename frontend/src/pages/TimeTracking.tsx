// frontend/src/pages/TimeTracking.tsx
import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingService } from '../services/time-tracking.service';
import { tasksService } from '../services/tasks.service';
import { usersService } from '../services/users.service';
import Timer from '../components/time-tracking/Timer';
import ManualEntryForm from '../components/time-tracking/ManualEntryForm';
import TimeEntryList from '../components/time-tracking/TimeEntryList';
import TimeSummary from '../components/time-tracking/TimeSummary';
import TimeEntryViewDialog from '../components/time-tracking/TimeEntryViewDialog';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { TimeEntry } from '../types';
import { useAuthStore } from '../store/authStore';
import { getDateRange } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import type { CreateManualTimeEntryDto } from '../services/time-tracking.service';

interface ErrorResponse {
  message: string;
}

interface ManualEntryFormData {
  startTime: Date;
  endTime: Date;
  taskId?: string;
  description?: string;
}

type TabValue = 'entries' | 'summary';

const TimeTracking = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [dateRange, setDateRange] = useState(getDateRange(7));
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [tabValue, setTabValue] = useState<TabValue>('entries');

  const isAdmin = user?.role === 'ADMIN';

  // Fetch time entries
  const { data: entries = [], isLoading, error, refetch } = useQuery<TimeEntry[]>({
    queryKey: ['time-tracking', 'entries', dateRange, selectedUserId],
    queryFn: () => timeTrackingService.getEntries(
      dateRange,
      selectedUserId || undefined
    ),
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['time-tracking', 'summary', dateRange, selectedUserId],
    queryFn: () => timeTrackingService.getSummary(
      dateRange,
      selectedUserId || undefined
    ),
  });

  // Fetch tasks for manual entry
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.findAll(),
  });

  // Fetch users for admin filter
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.findAll,
    enabled: isAdmin,
  });

  // Create manual entry mutation - FIXED: Properly typed
  const createMutation = useMutation<TimeEntry, AxiosError<ErrorResponse>, CreateManualTimeEntryDto>({
    mutationFn: (data: CreateManualTimeEntryDto) => timeTrackingService.createManualEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] });
      setManualFormOpen(false);
      toast.success('Time entry added successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to add entry');
    },
  });

  // Delete entry mutation - FIXED: Properly typed
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => timeTrackingService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] });
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
      toast.success('Time entry deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    },
  });

  const handleAddManual = () => {
    setManualFormOpen(true);
  };

  const handleView = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  const handleDelete = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
      setDeleteDialogOpen(true);
    }
  };

  const handleManualSubmit = async (data: ManualEntryFormData) => {
    const entryData: CreateManualTimeEntryDto = {
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      taskId: data.taskId,
      description: data.description,
    };
    createMutation.mutate(entryData);
  };

  const handleDeleteConfirm = () => {
    if (selectedEntry) {
      deleteMutation.mutate(selectedEntry.id);
    }
  };

  const handleCloseDialogs = () => {
    setManualFormOpen(false);
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleUserFilterChange = (event: SelectChangeEvent) => {
    setSelectedUserId(event.target.value);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Time Tracking
      </Typography>

      <Grid container spacing={3}>
        {/* Timer Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Timer 
            onTimerStart={() => refetch()}
            onTimerStop={() => refetch()}
          />
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddManual}
            fullWidth
            sx={{ mt: 2 }}
          >
            Add Manual Entry
          </Button>
        </Grid>

        {/* Entries/Summary Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={new Date(dateRange.startDate)}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setDateRange(prev => ({
                        ...prev,
                        startDate: date.toISOString().split('T')[0],
                      }));
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={new Date(dateRange.endDate)}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setDateRange(prev => ({
                        ...prev,
                        endDate: date.toISOString().split('T')[0],
                      }));
                    }
                  }}
                />
              </LocalizationProvider>

              <Button
                variant="outlined"
                onClick={() => setDateRange(getDateRange(7))}
              >
                Last 7 days
              </Button>
              <Button
                variant="outlined"
                onClick={() => setDateRange(getDateRange(30))}
              >
                Last 30 days
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </Stack>

            {isAdmin && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Filter by User</InputLabel>
                  <Select
                    value={selectedUserId}
                    label="Filter by User"
                    onChange={handleUserFilterChange}
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
              <Tab label="Entries" value="entries" />
              <Tab label="Summary" value="summary" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load time entries
              </Alert>
            )}

            {tabValue === 'entries' ? (
              <TimeEntryList
                entries={entries}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ) : (
              summary && <TimeSummary summary={summary} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <ManualEntryForm
        open={manualFormOpen}
        onClose={handleCloseDialogs}
        onSubmit={handleManualSubmit}
        tasks={tasks}
      />

      <TimeEntryViewDialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        entry={selectedEntry}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName="this time entry"
      />
    </Container>
  );
};

export default TimeTracking;