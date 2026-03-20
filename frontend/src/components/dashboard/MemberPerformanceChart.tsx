// frontend/src/components/dashboard/MemberPerformanceChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { formatCurrency } from '../../utils/formatters';

interface MemberPerformanceChartProps {
  data: Array<{
    userName: string;
    income: number;
    taskCount: number;
  }>;
  startDate?: string;
  endDate?: string;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: {
    userName: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {payload[0]?.payload?.userName}
        </Typography>
        {payload.map((entry) => (
          <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
            {entry.name === 'income' ? 'Income: ' : 'Tasks Completed: '}
            {entry.name === 'income' ? formatCurrency(entry.value) : `${entry.value} tasks`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const MemberPerformanceChart = ({ data, startDate, endDate }: MemberPerformanceChartProps) => {
  // Format dates for display
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Selected Period';
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Team Performance ({formatDateRange()})
        </Typography>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body2" color="text.secondary">
            No performance data available for this period
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Team Performance ({formatDateRange()})
      </Typography>
      <Box sx={{ width: '100%', height: 400, minHeight: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userName" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis yAxisId="left" orientation="left" stroke="#4caf50" />
            <YAxis yAxisId="right" orientation="right" stroke="#2196f3" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="income" name="Income ($)" fill="#4caf50" />
            <Bar yAxisId="right" dataKey="taskCount" name="Tasks Completed" fill="#2196f3" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default MemberPerformanceChart;
