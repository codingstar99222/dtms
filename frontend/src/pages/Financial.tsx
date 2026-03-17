// frontend/src/pages/Financial.tsx
import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  type SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService } from '../services/financial.service';
import { tasksService } from '../services/tasks.service';
import { usersService } from '../services/users.service';
import type { CreateTransactionDto, UpdateTransactionDto } from '../services/financial.service';
import TransactionList from '../components/financial/TransactionList';
import TransactionForm from '../components/financial/TransactionForm';
import TransactionViewDialog from '../components/financial/TransactionViewDialog';
import FinancialSummary from '../components/financial/FinancialSummary';
import UserSummaryTable from '../components/financial/UserSummaryTable';
import MonthlyChart from '../components/financial/MonthlyChart';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { getDateRange } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface TransactionFormData {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  taskId?: string;
  userId?: string;
  timestamp?: Date;
}

type TabValue = 'transactions' | 'summary' | 'trends';

const Financial = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState(getDateRange(30));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<TabValue>('transactions');

  const isAdmin = user?.role === 'ADMIN';

  // Fetch transactions
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['financial', 'transactions', dateRange],
    queryFn: () => financialService.getTransactions(dateRange),
  });

  // Fetch my summary
  const { data: mySummary } = useQuery({
    queryKey: ['financial', 'summary', 'me', dateRange],
    queryFn: () => financialService.getMySummary(dateRange),
  });

  // Fetch all users summary (admin only)
  const { data: usersSummary } = useQuery({
    queryKey: ['financial', 'summary', 'users', dateRange],
    queryFn: () => financialService.getAllUsersSummary(dateRange),
    enabled: isAdmin,
  });

  // Fetch monthly trends
  const { data: monthlyTrends } = useQuery({
    queryKey: ['financial', 'trends', selectedYear],
    queryFn: () => financialService.getMonthlyTrends(selectedYear),
  });

  // Fetch users for form (admin only)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.findAll,
    enabled: isAdmin,
  });

  // Fetch tasks for form
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.findAll(),
  });

  // Create transaction mutation
  const createMutation = useMutation<Transaction, AxiosError<ErrorResponse>, CreateTransactionDto>({
    mutationFn: (data: CreateTransactionDto) => financialService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setFormOpen(false);
      toast.success('Transaction added successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to add transaction');
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation<Transaction, AxiosError<ErrorResponse>, { id: string; data: UpdateTransactionDto }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      financialService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setFormOpen(false);
      setSelectedTransaction(null);
      toast.success('Transaction updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update transaction');
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => financialService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      toast.success('Transaction deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    },
  });

  const handleCreate = () => {
    setSelectedTransaction(null);
    setFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormOpen(true);
  };

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleDelete = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setDeleteDialogOpen(true);
    }
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    const transactionData: CreateTransactionDto = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      taskId: data.taskId,
      userId: data.userId,
      timestamp: data.timestamp?.toISOString(),
    };

    if (selectedTransaction) {
      updateMutation.mutate({ id: selectedTransaction.id, data: transactionData });
    } else {
      createMutation.mutate(transactionData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTransaction) {
      deleteMutation.mutate(selectedTransaction.id);
    }
  };

  const handleCloseDialogs = () => {
    setFormOpen(false);
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Financial Management
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Transaction
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Transactions" value="transactions" />
          <Tab label="Summary" value="summary" />
          <Tab label="Trends" value="trends" />
        </Tabs>
      </Box>

      {tabValue === 'transactions' && (
        <>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
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
                variant="outlined"
                onClick={() => setDateRange(getDateRange(90))}
              >
                Last 90 days
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load transactions
            </Alert>
          )}

          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </>
      )}

      {tabValue === 'summary' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <FinancialSummary 
              summary={mySummary || { totalIncome: 0, totalExpense: 0, netBalance: 0 }}
              title="My Financial Summary"
            />
          </Grid>

          {isAdmin && usersSummary && usersSummary.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Team Summary
                </Typography>
                <UserSummaryTable summaries={usersSummary} />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 'trends' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e: SelectChangeEvent<number>) => setSelectedYear(e.target.value as number)}
                >
                  {[2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {monthlyTrends && <MonthlyChart data={monthlyTrends} />}
          </Grid>
        </Grid>
      )}

      <TransactionForm
        open={formOpen}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
        users={users}
        tasks={tasks}
        isAdmin={isAdmin}
      />

      <TransactionViewDialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        transaction={selectedTransaction}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName={`transaction "${selectedTransaction?.description}"`}
      />
    </Container>
  );
};

export default Financial;