// frontend/src/components/financial/MonthlyChart.tsx
import { Paper, Typography, Box, useTheme } from '@mui/material';
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
import type { MonthlyTrend } from '../../services/financial.service';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyChartProps {
  data: MonthlyTrend[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        {payload.map((entry, index) => {
          const value = entry.value;
          const name = entry.name;
          return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: entry.color, borderRadius: 0.5 }} />
              <Typography variant="body2">
                {name}: {formatCurrency(value)}
              </Typography>
            </Box>
          );
        })}
      </Paper>
    );
  }
  return null;
};

const MonthlyChart = ({ data }: MonthlyChartProps) => {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Monthly Trends
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" fill={theme.palette.success.main} name="Income" />
          <Bar dataKey="expense" fill={theme.palette.error.main} name="Expense" />
          <Bar dataKey="net" fill={theme.palette.info.main} name="Net" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default MonthlyChart;