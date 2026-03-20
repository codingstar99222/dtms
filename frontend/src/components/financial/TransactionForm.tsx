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
  userId: z.string().min(1, 'Member is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  source: z.string().optional(),
  paymentMethod: z.string().optional(),
  timestamp: z.date().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  transaction?: Transaction | null;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
}

const TransactionForm = ({
  open,
  onClose,
  onSubmit,
  transaction,
  users = [],
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
      userId: '',
      amount: undefined,
      description: '',
      source: '',
      paymentMethod: '',
      timestamp: new Date(),
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        userId: transaction.userId,
        amount: transaction.amount,
        description: transaction.description,
        source: transaction.source || '',
        paymentMethod: transaction.paymentMethod || '',
        timestamp: new Date(transaction.timestamp),
      });
    } else {
      reset({
        userId: '',
        amount: undefined,
        description: '',
        source: '',
        paymentMethod: '',
        timestamp: new Date(),
      });
    }
  }, [transaction, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{transaction ? 'Edit Income Entry' : 'Add Income'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              {isAdmin && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Member</InputLabel>
                        <Select {...field} label="Member">
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

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
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      required
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="timestamp"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Payment Date"
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
              </Grid>
            </Grid>

            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Source (Client/Company)"
                  fullWidth
                  placeholder="e.g., ABC Corp, Freelance Client"
                />
              )}
            />

            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Payment Method"
                  fullWidth
                  placeholder="e.g., Bank Transfer, Payoneer, Crypto, Cash"
                  helperText="How was this payment received?"
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={2}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  required
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionForm;
