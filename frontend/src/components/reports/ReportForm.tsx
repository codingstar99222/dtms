// frontend/src/components/reports/ReportForm.tsx
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Report } from '../../types';

const reportSchema = z.object({
  date: z.date({
    message: 'Please select a valid date',
  }),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => Promise<void>;
  report?: Report | null;
}

const ReportForm = ({ open, onClose, onSubmit, report }: ReportFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      date: new Date(),
      content: '',
    },
  });

  useEffect(() => {
    if (report) {
      reset({
        date: new Date(report.date),
        content: report.content,
      });
    } else {
      reset({
        date: new Date(),
        content: '',
      });
    }
  }, [report, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{report ? 'Edit Report' : 'Submit Daily Report'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Report Date"
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    readOnly={!!report}
                    disabled={!!report}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.date,
                        required: true,
                        helperText: report
                          ? 'Date cannot be changed after submission' // Show this when editing
                          : errors.date?.message, // Show error when creating
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="What did you work on today?"
                  multiline
                  rows={6}
                  fullWidth
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  placeholder="Describe your tasks, progress, challenges, and plans..."
                  required
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : report ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReportForm;
