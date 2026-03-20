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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Stack,
  type SelectChangeEvent,
  Pagination,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
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
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const postsPerPage = 9;

  const canEdit = (post: BlogPost) => {
    return post.userId === user?.id; // Only author can edit
  };

  const canDelete = (post: BlogPost) => {
    return user?.role === 'ADMIN' || post.userId === user?.id; // Admin or author can delete
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Paginate
  const paginatedPosts = sortedPosts.slice((page - 1) * postsPerPage, page * postsPerPage);

  const editIconColor = theme.palette.mode === 'light' ? '#2222cc' : '#aaaaff';
  const deleteIconColor = theme.palette.mode === 'light' ? '#cc2222' : '#ffaaaa';
  
  return (
    <Box>
      {/* Search and Filter Bar */}
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e: SelectChangeEvent) => setSortBy(e.target.value)}
            >
              <SelectMenuItem value="newest">Newest First</SelectMenuItem>
              <SelectMenuItem value="oldest">Oldest First</SelectMenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {paginatedPosts.length} of {filteredPosts.length} posts
      </Typography>

      {/* Posts Grid */}
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
                transition: 'box-shadow 0.3s',
              }}
              onClick={() => onView(post)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header with category and action icons */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Chip
                    label={categoryLabels[post.category]}
                    size="small"
                    sx={{
                      bgcolor: categoryColors[post.category],
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Action Icons - Always visible with proper colors */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* Edit icon - only for author */}
                    {canEdit(post) && (
                      <Tooltip title="Edit Post">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(post);
                          }}
                          sx={{ color: `${editIconColor} !important` }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Delete icon - for admin or author */}
                    {canDelete(post) && (
                      <Tooltip title="Delete Post">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(post.id);
                          }}
                          sx={{ color: `${deleteIconColor} !important` }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {post.title}
                </Typography>

                {/* Content preview */}
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

                {/* Tags */}
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
                      <Chip label={`+${post.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                )}

                {/* Metadata icons */}
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
                </Box>
              </CardContent>

              {/* Footer with author info */}
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

        {/* Empty state */}
        {paginatedPosts.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No blog posts found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {filteredPosts.length > postsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredPosts.length / postsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default BlogList;
