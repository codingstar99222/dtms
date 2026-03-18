// frontend/src/components/users/UserList.tsx
import { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Search as SearchIcon,
  CheckCircleOutline as ApproveIcon, // Added
  Cancel as RejectIcon, // Added
} from '@mui/icons-material';
import type { User } from '../../types';
import { formatDate } from '../../utils/formatters';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleActive: (userId: string, currentStatus: boolean) => void;
  onApprove?: (userId: string) => void; // Added
  onReject?: (userId: string) => void; // Added
}

const UserList = ({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  onApprove,
  onReject,
}: UserListProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Pending'}
                    color={user.isActive ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {/* Show approve/reject for pending members */}
                    {!user.isActive && user.role !== 'ADMIN' && (
                      <>
                        <Tooltip title="Approve Member">
                          <IconButton
                            size="small"
                            onClick={() => onApprove?.(user.id)}
                            color="success"
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Member">
                          <IconButton
                            size="small"
                            onClick={() => onReject?.(user.id)}
                            color="error"
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {/* Show edit/activate/delete for active users */}
                    {user.isActive && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => onEdit(user)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => onToggleActive(user.id, user.isActive)}
                            color={user.isActive ? 'warning' : 'success'}
                          >
                            {user.isActive ? <BlockIcon /> : <ActiveIcon />}
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {/* Delete always available for admins */}
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => onDelete(user.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default UserList;
