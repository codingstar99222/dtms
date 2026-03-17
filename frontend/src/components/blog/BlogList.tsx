// frontend/src/components/blog/BlogList.tsx
import { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Stack,
  type SelectChangeEvent,
  Pagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Bookmark as BookmarkIcon,
  LocalOffer as TagIcon,
  Link as LinkIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import type { BlogPost, BlogCategory } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

interface BlogListProps {
  posts: BlogPost[];
  onEdit: (post: BlogPost) => void;
  onDelete: (postId: string) => void;
  onView: (post: BlogPost) => void;
}

const categoryColors: Record<BlogCategory, string> = {
  TUTORIAL: '#4caf50',
  TIP: '#ff9800',
  RESOURCE: '#2196f3',
  CODE_SNIPPET: '#9c27b0',
  EXPERIENCE: '#f44336',
};

const categoryLabels: Record<BlogCategory, string> = {
  TUTORIAL: 'Tutorial',
  TIP: 'Tip',
  RESOURCE: 'Resource',
  CODE_SNIPPET: 'Code Snippet',
  EXPERIENCE: 'Experience',
};

const BlogList = ({ posts, onEdit, onDelete, onView }: BlogListProps) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const postsPerPage = 9;

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paginatedPosts = filteredPosts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, post: BlogPost) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleAction = (action: 'edit' | 'delete' | 'view') => {
    if (!selectedPost) return;
    
    switch (action) {
      case 'edit':
        onEdit(selectedPost);
        break;
      case 'delete':
        onDelete(selectedPost.id);
        break;
      case 'view':
        onView(selectedPost);
        break;
    }
    handleMenuClose();
  };

  const canEdit = (post: BlogPost) => {
    return user?.role === 'ADMIN' || post.userId === user?.id;
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search posts by title, content, or tags..."
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
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}
            >
              <SelectMenuItem value="all">All Categories</SelectMenuItem>
              <SelectMenuItem value="TUTORIAL">Tutorials</SelectMenuItem>
              <SelectMenuItem value="TIP">Tips</SelectMenuItem>
              <SelectMenuItem value="RESOURCE">Resources</SelectMenuItem>
              <SelectMenuItem value="CODE_SNIPPET">Code Snippets</SelectMenuItem>
              <SelectMenuItem value="EXPERIENCE">Experiences</SelectMenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {paginatedPosts.map((post) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': { boxShadow: 6 },
                position: 'relative',
              }}
              onClick={() => onView(post)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip
                    label={categoryLabels[post.category]}
                    size="small"
                    sx={{
                      bgcolor: categoryColors[post.category],
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, post);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {post.title}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {post.content}
                </Typography>

                {post.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {post.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        icon={<TagIcon />}
                        variant="outlined"
                      />
                    ))}
                    {post.tags.length > 3 && (
                      <Chip
                        label={`+${post.tags.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {post.url && (
                    <Tooltip title="Has URL">
                      <LinkIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  {post.codeSnippet && (
                    <Tooltip title="Has Code Snippet">
                      <CodeIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  <Tooltip title={`${post.views} views`}>
                    <BookmarkIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                    {post.authorName.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {post.authorName} · {formatDate(post.publishedAt)}
                  </Typography>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {paginatedPosts.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No blog posts found
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {filteredPosts.length > postsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredPosts.length / postsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>View</MenuItem>
        {selectedPost && canEdit(selectedPost) && (
          <MenuItem onClick={() => handleAction('edit')}>Edit</MenuItem>
        )}
        {(user?.role === 'ADMIN' || selectedPost?.userId === user?.id) && (
          <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default BlogList;