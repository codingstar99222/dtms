// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/authStore';
import StatsCards from '../components/dashboard/StatsCards';
import MemberPerformanceChart from '../components/dashboard/MemberPerformanceChart';
import RecentActivities from '../components/dashboard/RecentActivities';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getDateRange } from '../utils/dateUtils';
import { usersService } from '../services/users.service';
import type { User } from '../types';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(
    getDateRange(30)
  );
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [members, setMembers] = useState<User[]>([]);

  // Fetch members for admin filter
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      usersService.findAll().then(setMembers).catch(console.error);
    }
  }, [user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dateRange, selectedUser],
    queryFn: () =>
      selectedUser && user?.role === 'ADMIN'
        ? dashboardService.getMemberDashboard(selectedUser, dateRange.startDate, dateRange.endDate)
        : dashboardService.getSummary(dateRange.startDate, dateRange.endDate),
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load dashboard data');
    }
  }, [error]);

  if (isLoading) return <LoadingSpinner />;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={new Date(dateRange.startDate)}
              onChange={(date: Date | null) => {
                if (date) {
                  setDateRange((prev) => ({
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
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: date.toISOString().split('T')[0],
                  }));
                }
              }}
            />
          </LocalizationProvider>

          <Button variant="outlined" onClick={() => setDateRange(getDateRange(7))}>
            Last 7 days
          </Button>
          <Button variant="outlined" onClick={() => setDateRange(getDateRange(30))}>
            Last 30 days
          </Button>

          {isAdmin && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Member</InputLabel>
              <Select
                value={selectedUser}
                label="Select Member"
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <MenuItem value="">All Members</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button variant="contained" onClick={() => refetch()}>
            Apply Filters
          </Button>
        </Stack>
      </Box>

      {data && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <StatsCards overview={data.overview} isAdmin={isAdmin && !selectedUser} />
          </Grid>

          {/* Member Performance Chart - Only show for admin with all members selected */}
          {isAdmin &&
            !selectedUser &&
            data.memberPerformance &&
            data.memberPerformance.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <MemberPerformanceChart data={data.memberPerformance} />
              </Grid>
            )}

          {/* Recent Activities - Admin only */}
          {isAdmin && (
            <Grid size={{ xs: 12 }}>
              <RecentActivities activities={data.recentActivities} />
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
