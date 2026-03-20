// frontend/src/components/dashboard/StatsCards.tsx
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  Task as TasksIcon,
  People as MembersIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import type { DashboardSummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface StatsCardsProps {
  overview: DashboardSummary['overview'];
  isAdmin?: boolean;
}

const StatsCards = ({ overview, isAdmin }: StatsCardsProps) => {
  const stats = [
    ...(isAdmin
      ? [
          {
            title: 'Total Members',
            value: overview.totalMembers.toString(),
            icon: <MembersIcon />,
            color: '#1976d2',
            subtext: `${overview.activeMembers} active`,
          },
        ]
      : []),
    {
      title: 'Pending Reports',
      value: overview.pendingReports.toString(),
      icon: <PendingIcon />,
      color: '#ff9800',
    },
    {
      title: 'Completed Tasks',
      value: overview.totalTasks.toString(),
      icon: <TasksIcon />,
      color: '#2196f3',
    },
    {
      title: 'Total Income',
      value: formatCurrency(overview.totalIncome),
      icon: <IncomeIcon />,
      color: '#4caf50',
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="body2">
                {stat.title}
              </Typography>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 1 }}>
                {stat.value}
              </Typography>
              {stat.subtext && (
                <Typography variant="caption" color="text.secondary">
                  {stat.subtext}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: stat.color,
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {stat.icon}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
