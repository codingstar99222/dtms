// frontend/src/components/reports/ApproveDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

interface ApproveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: 'APPROVED' | 'REJECTED', reason?: string) => void;
  reportDate: string;
  userName: string;
}

const ApproveDialog = ({ open, onClose, onConfirm, reportDate, userName }: ApproveDialogProps) => {
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(status, reason);
    setStatus('APPROVED');
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setStatus('APPROVED');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Review Report</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Reviewing report from {userName} for {reportDate}
        </DialogContentText>
        
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            row
            value={status}
            onChange={(e) => setStatus(e.target.value as 'APPROVED' | 'REJECTED')}
          >
            <FormControlLabel value="APPROVED" control={<Radio />} label="Approve" />
            <FormControlLabel value="REJECTED" control={<Radio />} label="Reject" />
          </RadioGroup>
        </FormControl>

        {status === 'REJECTED' && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this report is being rejected..."
            required
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={status === 'APPROVED' ? 'success' : 'error'}
          disabled={status === 'REJECTED' && !reason.trim()}
        >
          {status === 'APPROVED' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveDialog;