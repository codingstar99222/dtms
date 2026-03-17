// frontend/src/components/reports/ReportViewDialog.tsx
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
} from '@mui/material';
import type { Report } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface ReportViewDialogProps {
  open: boolean;
  onClose: () => void;
  report: Report | null;
}

type StatusColor = 'success' | 'error' | 'warning' | 'default';

const getStatusColor = (status: string): StatusColor => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    case 'PENDING':
      return 'warning';
    default:
      return 'default';
  }
};

const ReportViewDialog = ({ open, onClose, report }: ReportViewDialogProps) => {
  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Report Details
          <Chip
            label={report.status}
            color={getStatusColor(report.status)}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Report Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Author</Typography>
                <Typography variant="body2">{report.userName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Report Date</Typography>
                <Typography variant="body2">{formatDate(report.date)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Submitted</Typography>
                <Typography variant="body2">{formatDateTime(report.submittedAt)}</Typography>
              </Box>
              {report.approvedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Processed</Typography>
                  <Typography variant="body2">{formatDateTime(report.approvedAt)}</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Report Content
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {report.content}
            </Typography>
          </Paper>

          {report.reason && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {report.status === 'REJECTED' ? 'Rejection Reason' : 'Feedback'}
              </Typography>
              <Typography variant="body1" color={report.status === 'REJECTED' ? 'error' : 'text.primary'}>
                {report.reason}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportViewDialog;