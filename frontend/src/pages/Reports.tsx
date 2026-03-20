// frontend/src/pages/Reports.tsx
import { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Chip } from '@mui/material';
import {
  Add as AddIcon,
  PendingActions as PendingIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';
import type { CreateReportDto, UpdateReportDto } from '../services/reports.service';
import ReportList from '../components/reports/ReportList';
import ReportForm from '../components/reports/ReportForm';
import ReportViewDialog from '../components/reports/ReportViewDialog';
import ApproveDialog from '../components/reports/ApproveDialog';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Report } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface ReportFormSubmitData {
  date: string; // string, not Date
  content: string;
}

const Reports = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports
  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: reportsService.findAll,
  });

  // Fetch pending count
  const { data: pendingCount } = useQuery<{ count: number }>({
    queryKey: ['reports', 'pending'],
    queryFn: reportsService.getPendingCount,
    refetchInterval: 30000,
  });

  // Missing reports
  const { data: missingReports = [] } = useQuery({
    queryKey: ['reports', 'missing'],
    queryFn: () => reportsService.getMissingReports(),
    throwOnError: false, // This replaces onError
  });
  // Create report mutation
  const createMutation = useMutation<Report, AxiosError<ErrorResponse>, CreateReportDto>({
    mutationFn: (data: CreateReportDto) => reportsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setFormOpen(false);
      toast.success('Report submitted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    },
  });

  // Update report mutation
  const updateMutation = useMutation<
    Report,
    AxiosError<ErrorResponse>,
    { id: string; data: UpdateReportDto }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportDto }) =>
      reportsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setFormOpen(false);
      setSelectedReport(null);
      toast.success('Report updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update report');
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => reportsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setDeleteDialogOpen(false);
      setSelectedReport(null);
      toast.success('Report deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    },
  });

  // Approve report mutation
  const approveMutation = useMutation<
    Report,
    AxiosError<ErrorResponse>,
    { id: string; data: { status: 'APPROVED' | 'REJECTED'; reason?: string } }
  >({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: 'APPROVED' | 'REJECTED'; reason?: string };
    }) => reportsService.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'pending'] });
      setApproveDialogOpen(false);
      setSelectedReport(null);
      toast.success('Report reviewed successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to review report');
    },
  });

  const handleCreate = () => {
    setSelectedReport(null);
    setFormOpen(true);
  };

  const handleEdit = (report: Report) => {
    setSelectedReport(report);
    setFormOpen(true);
  };

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleApprove = (report: Report) => {
    setSelectedReport(report);
    setApproveDialogOpen(true);
  };

  const handleReject = (report: Report) => {
    setSelectedReport(report);
    setApproveDialogOpen(true);
  };

  const handleDelete = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setDeleteDialogOpen(true);
    }
  };

  const handleFormSubmit = async (data: ReportFormSubmitData) => {
    // data.date is already a string from ReportForm
    const reportData: CreateReportDto = {
      date: data.date, // already string
      content: data.content,
    };

    if (selectedReport) {
      updateMutation.mutate({ id: selectedReport.id, data: reportData });
    } else {
      createMutation.mutate(reportData);
    }
  };

  const handleApproveConfirm = (status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (selectedReport) {
      approveMutation.mutate({
        id: selectedReport.id,
        data: { status, reason },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedReport) {
      deleteMutation.mutate(selectedReport.id);
    }
  };

  const handleCloseDialogs = () => {
    setFormOpen(false);
    setViewDialogOpen(false);
    setApproveDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedReport(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const pendingReports = pendingCount?.count || 0;

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Daily Reports
          </Typography>
          {isAdmin && pendingReports > 0 && (
            <Chip
              icon={<PendingIcon />}
              label={`${pendingReports} pending review`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {/* Conditional button - Admin sees Notification, Members see Submit */}
        {isAdmin ? (
          <Button
            variant="contained"
            startIcon={<NotificationsIcon />}
            onClick={() => toast.success('Notifications coming soon!')}
          >
            Add Notification
          </Button>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Submit Report
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load reports
        </Alert>
      )}

      {/* Missing reports warning - only for members */}
      {!isAdmin && missingReports.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setFormOpen(true)}>
              Submit Now
            </Button>
          }
        >
          <Typography variant="body2">
            You have {missingReports.length} missing report{missingReports.length > 1 ? 's' : ''}{' '}
            from the last 7 days.
          </Typography>
        </Alert>
      )}

      <ReportList
        reports={reports}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
      />

      <ReportForm
        open={formOpen}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        report={selectedReport}
      />

      <ReportViewDialog
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        report={selectedReport}
      />

      <ApproveDialog
        open={approveDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleApproveConfirm}
        reportDate={selectedReport ? new Date(selectedReport.date).toLocaleDateString() : ''}
        userName={selectedReport?.userName || ''}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName={
          selectedReport ? `report from ${new Date(selectedReport.date).toLocaleDateString()}` : ''
        }
      />
    </Container>
  );
};

export default Reports;
