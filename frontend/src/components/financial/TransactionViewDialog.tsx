// frontend/src/components/financial/TransactionViewDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';
import type { Transaction } from '../../types';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface TransactionViewDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionViewDialog = ({ open, onClose, transaction }: TransactionViewDialogProps) => {
  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Transaction Details
          <Chip
            icon={transaction.type === 'INCOME' ? <IncomeIcon /> : <ExpenseIcon />}
            label={transaction.type}
            color={transaction.type === 'INCOME' ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h5" gutterBottom align="center">
              <span style={{ color: transaction.type === 'INCOME' ? '#4caf50' : '#f44336' }}>
                {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">User</Typography>
              <Typography variant="body2">{transaction.userName}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Date & Time</Typography>
              <Typography variant="body2">{formatDateTime(transaction.timestamp)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography variant="body2">{transaction.description}</Typography>
            </Grid>
            {transaction.taskTitle && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Related Task</Typography>
                <Typography variant="body2">{transaction.taskTitle}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionViewDialog;