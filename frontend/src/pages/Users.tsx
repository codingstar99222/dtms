// frontend/src/pages/Users.tsx
import { useState } from 'react';
import { Container, Typography, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import type { UpdateUserDto } from '../services/users.service';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { User } from '../types';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}
interface UserFormData {
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  password?: string;
  isActive?: boolean;
}
const Users = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.findAll,
  });

  // Update user mutation (for editing and approving)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  // Delete user mutation (for rejecting and delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success('User removed successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    },
  });

  // Toggle active status mutation (for activate/deactivate)
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.update(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  // Edit - opens form
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  // Delete - opens confirm dialog
  const handleDelete = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setDeleteDialogOpen(true);
    }
  };

  // Toggle active/deactive
  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id: userId, isActive: currentStatus });
  };

  // ✅ Approve - sets isActive to true
  const handleApprove = (userId: string) => {
    updateMutation.mutate({ id: userId, data: { isActive: true } });
  };

  // ✅ Reject - deletes the user
  const handleReject = (userId: string) => {
    if (confirm('Are you sure you want to reject this user?')) {
      deleteMutation.mutate(userId);
    }
  };

  // Form submit for editing
  const handleFormSubmit = async (data: UserFormData) => {
    if (selectedUser) {
      const updateData: UpdateUserDto = {
        name: data.name,
        email: data.email,
        role: data.role,
      };

      // Only include password if it was provided
      if (data.password) {
        updateData.password = data.password;
      }

      updateMutation.mutate({
        id: selectedUser.id,
        data: updateData,
      });
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load users
        </Alert>
      )}

      <UserList
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onApprove={handleApprove} // ✅ Still here
        onReject={handleReject} // ✅ Still here
      />

      <UserForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        user={selectedUser}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        userName={selectedUser?.name || ''}
      />
    </Container>
  );
};

export default Users;
