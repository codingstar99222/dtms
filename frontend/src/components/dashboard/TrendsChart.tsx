// frontend/src/components/dashboard/TrendsChart.tsx
import { useState } from 'react';
import {
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TrendPoint, MonthlyTrend } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TrendsChartProps {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: MonthlyTrend[];
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
type ChartType = 'line' | 'area' | 'bar';
type DataType = 'daily' | 'weekly' | 'monthly';
type MetricType = 'reports' | 'tasks' | 'hours' | 'income';

// Union type for chart data
type ChartDataPoint = TrendPoint | MonthlyTrend;

const TrendsChart = ({ daily, weekly, monthly }: TrendsChartProps) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dataType, setDataType] = useState<DataType>('daily');
  const [metrics, setMetrics] = useState<MetricType[]>(['income', 'hours']);

  const getData = (): ChartDataPoint[] => {
    switch (dataType) {
      case 'daily':
        return daily;
      case 'weekly':
        return weekly;
      case 'monthly':
        return monthly;
      default:
        return daily;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry, index) => {
            const value = entry.value as number;
            const name = entry.name as string;
            let formattedValue: string;
            
            if (name === 'income' || name === 'expenses' || name === 'net') {
              formattedValue = formatCurrency(value);
            } else if (name === 'hours') {
              formattedValue = `${value.toFixed(1)}h`;
            } else {
              formattedValue = value.toString();
            }
            
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: entry.color, borderRadius: 0.5 }} />
                <Typography variant="body2">
                  {name}: {formattedValue}
                </Typography>
              </Box>
            );
          })}
        </Paper>
      );
    }
    return null;
  };

  const renderChart = () => {
    const data = getData();
    const colors = {
      reports: theme.palette.primary.main,
      tasks: theme.palette.secondary.main,
      hours: theme.palette.success.main,
      income: theme.palette.warning.main,
      expenses: theme.palette.error.main,
      net: theme.palette.info.main,
    };

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataType === 'monthly' ? 'month' : 'date'} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {metrics.includes('reports') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="reports"
                stroke={colors.reports}
                fill={colors.reports}
                fillOpacity={0.3}
              />
            )}
            {metrics.includes('tasks') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tasks"
                stroke={colors.tasks}
                fill={colors.tasks}
                fillOpacity={0.3}
              />
            )}
            {metrics.includes('hours') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke={colors.hours}
                fill={colors.hours}
                fillOpacity={0.3}
              />
            )}
            {metrics.includes('income') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="income"
                stroke={colors.income}
                fill={colors.income}
                fillOpacity={0.3}
              />
            )}
            {dataType === 'monthly' && (
              <>
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="expenses"
                  stroke={colors.expenses}
                  fill={colors.expenses}
                  fillOpacity={0.3}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="net"
                  stroke={colors.net}
                  fill={colors.net}
                  fillOpacity={0.3}
                />
              </>
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataType === 'monthly' ? 'month' : 'date'} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {metrics.includes('reports') && (
              <Bar yAxisId="left" dataKey="reports" fill={colors.reports} />
            )}
            {metrics.includes('tasks') && (
              <Bar yAxisId="left" dataKey="tasks" fill={colors.tasks} />
            )}
            {metrics.includes('hours') && (
              <Bar yAxisId="left" dataKey="hours" fill={colors.hours} />
            )}
            {metrics.includes('income') && (
              <Bar yAxisId="right" dataKey="income" fill={colors.income} />
            )}
            {dataType === 'monthly' && (
              <>
                <Bar yAxisId="right" dataKey="expenses" fill={colors.expenses} />
                <Bar yAxisId="right" dataKey="net" fill={colors.net} />
              </>
            )}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataType === 'monthly' ? 'month' : 'date'} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {metrics.includes('reports') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reports"
                stroke={colors.reports}
              />
            )}
            {metrics.includes('tasks') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tasks"
                stroke={colors.tasks}
              />
            )}
            {metrics.includes('hours') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke={colors.hours}
              />
            )}
            {metrics.includes('income') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="income"
                stroke={colors.income}
              />
            )}
            {dataType === 'monthly' && (
              <>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="expenses"
                  stroke={colors.expenses}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="net"
                  stroke={colors.net}
                />
              </>
            )}
          </LineChart>
        );
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">Trends</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            size="small"
            value={dataType}
            exclusive
            onChange={(_, value) => value && setDataType(value as DataType)}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            size="small"
            value={chartType}
            exclusive
            onChange={(_, value) => value && setChartType(value as ChartType)}
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="area">Area</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup 
          size="small" 
          value={metrics} 
          onChange={(_, value) => value && setMetrics(value as MetricType[])}
        >
          <ToggleButton value="reports">Reports</ToggleButton>
          <ToggleButton value="tasks">Tasks</ToggleButton>
          <ToggleButton value="hours">Hours</ToggleButton>
          <ToggleButton value="income">Income</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </Paper>
  );
};

export default TrendsChart;