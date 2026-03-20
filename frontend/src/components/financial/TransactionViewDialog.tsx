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
import { TrendingUp as IncomeIcon } from '@mui/icons-material';
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
          Income Details
          <Chip icon={<IncomeIcon />} label="INCOME" color="success" size="small" />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h5" gutterBottom align="center" color="success.main">
              +{formatCurrency(transaction.amount)}
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Date & Time
              </Typography>
              <Typography variant="body2">{formatDateTime(transaction.timestamp)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Member
              </Typography>
              <Typography variant="body2">{transaction.userName}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">{transaction.source || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Payment Method
              </Typography>
              <Typography variant="body2">{transaction.paymentMethod || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {transaction.description}
              </Typography>
            </Grid>
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
