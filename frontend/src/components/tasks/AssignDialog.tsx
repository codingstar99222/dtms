// frontend/src/components/tasks/AssignDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography,
} from '@mui/material';

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (assigneeId: string) => void;
  taskTitle: string;
  users: { id: string; name: string }[];
}

const AssignDialog = ({ open, onClose, onConfirm, taskTitle, users }: AssignDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleConfirm = () => {
    if (selectedUserId) {
      onConfirm(selectedUserId);
      setSelectedUserId('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Task</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Assign task "{taskTitle}" to a team member
        </DialogContentText>
        
        <FormControl fullWidth>
          <InputLabel>Select Member</InputLabel>
          <Select
            value={selectedUserId}
            label="Select Member"
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                    {user.name.charAt(0)}
                  </Avatar>
                  <Typography>{user.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedUserId}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDialog;