// frontend/src/components/blog/BlogViewDialog.tsx
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import type { BlogPost } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface BlogViewDialogProps {
  open: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

const categoryColors: Record<string, string> = {
  TUTORIAL: '#4caf50',
  TIP: '#ff9800',
  RESOURCE: '#2196f3',
  CODE_SNIPPET: '#9c27b0',
  EXPERIENCE: '#f44336',
};

const categoryLabels: Record<string, string> = {
  TUTORIAL: 'Tutorial',
  TIP: 'Tip',
  RESOURCE: 'Resource',
  CODE_SNIPPET: 'Code Snippet',
  EXPERIENCE: 'Experience',
};

const BlogViewDialog = ({ open, onClose, post }: BlogViewDialogProps) => {
  if (!post) return null;

  const handleCopyCode = () => {
    if (post.codeSnippet) {
      navigator.clipboard.writeText(post.codeSnippet);
      toast.success('Code copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{post.title}</Typography>
          <Chip
            label={categoryLabels[post.category]}
            size="small"
            sx={{
              bgcolor: categoryColors[post.category],
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              By {post.authorName} · {formatDateTime(post.publishedAt)} · {post.views} views
            </Typography>
          </Box>

          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {post.content}
            </Typography>
          </Paper>

          {post.tags && post.tags.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {post.url && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Related URL
              </Typography>
              <Button
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                variant="outlined"
                size="small"
              >
                {post.url}
              </Button>
            </Box>
          )}

          {post.codeSnippet && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Code Snippet
                </Typography>
                <Tooltip title="Copy code">
                  <IconButton size="small" onClick={handleCopyCode}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflowX: 'auto',
                  borderRadius: 1,
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  <code>{post.codeSnippet}</code>
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlogViewDialog;