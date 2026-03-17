// frontend/src/components/financial/FinancialSummary.tsx
import { Grid, Typography, Box, Card, CardContent } from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

interface FinancialSummaryProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
  title?: string;
}

const FinancialSummary = ({ summary, title }: FinancialSummaryProps) => {
  const items = [
    {
      title: 'Total Income',
      value: formatCurrency(summary.totalIncome),
      icon: <IncomeIcon />,
      color: '#4caf50',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpense),
      icon: <ExpenseIcon />,
      color: '#f44336',
    },
    {
      title: 'Net Balance',
      value: formatCurrency(summary.netBalance),
      icon: <BalanceIcon />,
      color: summary.netBalance >= 0 ? '#4caf50' : '#f44336',
    },
  ];

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Grid container spacing={3}>
        {items.map((item, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {item.title}
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FinancialSummary;