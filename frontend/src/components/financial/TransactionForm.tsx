// frontend/src/components/financial/TransactionForm.tsx
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction } from '../../types';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.date().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  transaction?: Transaction | null;
  users?: { id: string; name: string }[];
  tasks?: { id: string; title: string }[];
  isAdmin?: boolean;
}

const TransactionForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  transaction, 
  users = [], 
  tasks = [],
  isAdmin = false,
}: TransactionFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'INCOME',
      amount: undefined,
      description: '',
      taskId: '',
      userId: '',
      timestamp: new Date(),
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        taskId: transaction.taskId || '',
        userId: transaction.userId,
        timestamp: new Date(transaction.timestamp),
      });
    } else {
      reset({
        type: 'INCOME',
        amount: undefined,
        description: '',
        taskId: '',
        userId: '',
        timestamp: new Date(),
      });
    }
  }, [transaction, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {transaction ? 'Edit Transaction' : 'Add Transaction'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select {...field} label="Type">
                        <MenuItem value="INCOME">Income</MenuItem>
                        <MenuItem value="EXPENSE">Expense</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Amount"
                      type="number"
                      fullWidth
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      required
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  required
                />
              )}
            />

            <Grid container spacing={2}>
              {isAdmin && (
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>User</InputLabel>
                        <Select {...field} label="User">
                          <MenuItem value="">Select User</MenuItem>
                          {users.map(user => (
                            <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              <Grid size={{ xs: isAdmin ? 6 : 12 }}>
                <Controller
                  name="taskId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Related Task</InputLabel>
                      <Select {...field} label="Related Task">
                        <MenuItem value="">None</MenuItem>
                        {tasks.map(task => (
                          <MenuItem key={task.id} value={task.id}>{task.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name="timestamp"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date"
                    value={field.value || null}
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.timestamp,
                        helperText: errors.timestamp?.message,
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionForm;