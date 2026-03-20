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
            {entry.name === 'income' ? 'Income: ' : 'Tasks: '}
            {entry.name === 'income' ? formatCurrency(entry.value) : `${entry.value} tasks`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const MemberPerformanceChart = ({ data }: MemberPerformanceChartProps) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Team Performance (Last 30 Days)
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="userName" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#4caf50" />
            <Bar dataKey="taskCount" name="Tasks Completed" fill="#2196f3" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default MemberPerformanceChart;
