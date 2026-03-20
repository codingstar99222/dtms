// frontend/src/pages/Financial.tsx
import { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Stack, Paper, Grid } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  type CreateTransactionDto,
  type UpdateTransactionDto,
} from '../services/financial.service';
import { usersService } from '../services/users.service';
import TransactionList from '../components/financial/TransactionList';
import TransactionForm from '../components/financial/TransactionForm';
import TransactionViewDialog from '../components/financial/TransactionViewDialog';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { getDateRange } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}
interface TransactionFormData {
  userId?: string;
  amount: number;
  description: string;
  source?: string;
  paymentMethod?: string;
  timestamp?: Date; // Keep as Date for the form, convert on submit
}

const Financial = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState(() => getDateRange(30).startDate);
  const [endDate, setEndDate] = useState(() => getDateRange(30).endDate);

  const isAdmin = user?.role === 'ADMIN';
  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery<Transaction[]>({
    queryKey: ['financial', startDate, endDate],
    queryFn: () => {
      return financialService.getTransactions({ startDate, endDate });
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['financial', 'summary', startDate, endDate],
    queryFn: async () => {
      if (isAdmin) {
        // Admin: sum all transactions
        const transactions = await financialService.getTransactions({ startDate, endDate });
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome: total };
      } else {
        // Member: get their own summary
        return financialService.getMySummary({ startDate, endDate });
      }
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'members'],
    queryFn: async () => {
      const allUsers = await usersService.findAll();
      return allUsers.filter((u) => u.role === 'MEMBER');
    },
    enabled: isAdmin,
  });

  const { data: topUsers = [] } = useQuery({
    queryKey: ['financial', 'top-users', startDate, endDate],
    queryFn: async () => {
      const transactions = await financialService.getTransactions({ startDate, endDate });

      // Group by user and sum income
      const userMap = new Map<string, { name: string; total: number }>();
      transactions.forEach((t) => {
        const existing = userMap.get(t.userId);
        if (existing) {
          existing.total += t.amount;
        } else {
          userMap.set(t.userId, { name: t.userName, total: t.amount });
        }
      });

      // Convert to array and sort by total descending
      return Array.from(userMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
    },
    enabled: isAdmin, // Only run for admin
  });

  const createMutation = useMutation<Transaction, AxiosError<ErrorResponse>, CreateTransactionDto>({
    mutationFn: (data: CreateTransactionDto) => financialService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setFormOpen(false);
      toast.success('Income added successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to add income');
    },
  });

  const updateMutation = useMutation<
    Transaction,
    AxiosError<ErrorResponse>,
    { id: string; data: UpdateTransactionDto }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      financialService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setFormOpen(false);
      setSelectedTransaction(null);
      toast.success('Income updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update income');
    },
  });

  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => financialService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      toast.success('Income deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete income');
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
    const transaction = transactions.find((t) => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setDeleteDialogOpen(true);
    }
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    const transactionData: CreateTransactionDto = {
      type: 'INCOME',
      amount: data.amount,
      description: data.description,
      source: data.source,
      paymentMethod: data.paymentMethod,
      userId: data.userId,
      timestamp: data.timestamp
        ? data.timestamp.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    if (selectedTransaction) {
      // For update, only send fields that can be updated (amount, description, source, paymentMethod)
      const updateData: UpdateTransactionDto = {
        amount: data.amount,
        description: data.description,
        source: data.source,
        paymentMethod: data.paymentMethod,
      };
      updateMutation.mutate({ id: selectedTransaction.id, data: updateData });
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

        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Add Income
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Income
            </Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(summary?.totalIncome || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {startDate} to {endDate}
            </Typography>
          </Paper>
        </Grid>

        {isAdmin && topUsers.length > 0 && (
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Top 3 Earners
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  gap: 2,
                  mt: 1,
                }}
              >
                {topUsers.map((user, index) => {
                  const colors = ['gold', 'silver', '#cd7f32'];
                  return (
                    <Box key={user.name} sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h5" sx={{ color: `${colors[index]} !important` }}>
                        #{index + 1}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                        {formatCurrency(user.total)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={new Date(startDate)}
              onChange={(date: Date | null) => {
                if (date) {
                  setStartDate(date.toISOString().split('T')[0]);
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={new Date(endDate)}
              onChange={(date: Date | null) => {
                if (date) {
                  setEndDate(date.toISOString().split('T')[0]);
                }
              }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            onClick={() => {
              const range = getDateRange(7);
              setStartDate(range.startDate);
              setEndDate(range.endDate);
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const range = getDateRange(30);
              setStartDate(range.startDate);
              setEndDate(range.endDate);
            }}
          >
            Last 30 days
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

      {isAdmin && (
        <TransactionForm
          open={formOpen}
          onClose={handleCloseDialogs}
          onSubmit={handleFormSubmit}
          transaction={selectedTransaction}
          users={users}
          isAdmin={isAdmin}
        />
      )}

      <TransactionViewDialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        transaction={selectedTransaction}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName={`income "${selectedTransaction?.description}"`}
      />
    </Container>
  );
};

export default Financial;
