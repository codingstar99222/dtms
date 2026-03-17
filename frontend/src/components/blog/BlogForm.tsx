// frontend/src/components/blog/BlogForm.tsx
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
  Chip,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BlogPost } from '../../types';

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.enum(['TUTORIAL', 'TIP', 'RESOURCE', 'CODE_SNIPPET', 'EXPERIENCE']),
  tags: z.array(z.string()).optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  codeSnippet: z.string().optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

interface BlogFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BlogFormData) => Promise<void>;
  post?: BlogPost | null;
}

const categoryOptions = [
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'TIP', label: 'Tip' },
  { value: 'RESOURCE', label: 'Resource' },
  { value: 'CODE_SNIPPET', label: 'Code Snippet' },
  { value: 'EXPERIENCE', label: 'Experience' },
];

const BlogForm = ({ open, onClose, onSubmit, post }: BlogFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'TUTORIAL',
      tags: [],
      url: '',
      codeSnippet: '',
    },
  });

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags || [],
        url: post.url || '',
        codeSnippet: post.codeSnippet || '',
      });
    } else {
      reset({
        title: '',
        content: '',
        category: 'TUTORIAL',
        tags: [],
        url: '',
        codeSnippet: '',
      });
    }
  }, [post, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {post ? 'Edit Blog Post' : 'Create New Blog Post'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  required
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select {...field} label="Category">
                    {categoryOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Content"
                  multiline
                  rows={6}
                  fullWidth
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  required
                />
              )}
            />

            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={field.value || []}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Add tags and press Enter"
                      helperText="Press Enter to add tags"
                    />
                  )}
                />
              )}
            />

            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Related URL (optional)"
                  fullWidth
                  error={!!errors.url}
                  helperText={errors.url?.message}
                />
              )}
            />

            <Controller
              name="codeSnippet"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Code Snippet (optional)"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.codeSnippet}
                  helperText={errors.codeSnippet?.message}
                  placeholder="Paste your code here..."
                  sx={{ fontFamily: 'monospace' }}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : post ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BlogForm;