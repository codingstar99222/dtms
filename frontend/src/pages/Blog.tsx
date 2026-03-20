// frontend/src/pages/Blog.tsx
import { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Tabs, Tab, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '../services/blog.service';
import type { CreateBlogPostDto, UpdateBlogPostDto } from '../services/blog.service';
import BlogList from '../components/blog/BlogList';
import BlogForm from '../components/blog/BlogForm';
import BlogViewDialog from '../components/blog/BlogViewDialog';
import DeleteConfirmDialog from '../components/users/DeleteConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { BlogPost } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface BlogFormData {
  title: string;
  content: string;
  category: 'TUTORIAL' | 'TIP' | 'RESOURCE' | 'CODE_SNIPPET' | 'EXPERIENCE';
  tags?: string[];
  url?: string;
  codeSnippet?: string;
}

type TabValue = 'all' | 'my-posts';

const Blog = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [tabValue, setTabValue] = useState<TabValue>('all');

  // Fetch posts based on tab
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery<BlogPost[]>({
    queryKey: ['blog', tabValue],
    queryFn: async () => {
      switch (tabValue) {
        case 'my-posts':
          if (!user?.id) return [];
          return blogService.getUserPosts(user.id);
        default:
          return blogService.findAll();
      }
    },
  });

  // Create post mutation
  const createMutation = useMutation<BlogPost, AxiosError<ErrorResponse>, CreateBlogPostDto>({
    mutationFn: (data: CreateBlogPostDto) => blogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      setFormOpen(false);
      toast.success('Blog post created successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    },
  });

  // Update post mutation
  const updateMutation = useMutation<
    BlogPost,
    AxiosError<ErrorResponse>,
    { id: string; data: UpdateBlogPostDto }
  >({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogPostDto }) =>
      blogService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      setFormOpen(false);
      setSelectedPost(null);
      toast.success('Blog post updated successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to update post');
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (id: string) => blogService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      setDeleteDialogOpen(false);
      setSelectedPost(null);
      toast.success('Blog post deleted successfully');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    },
  });

  const handleCreate = () => {
    setSelectedPost(null);
    setFormOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormOpen(true);
  };

  const handleView = (post: BlogPost) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const handleDelete = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setDeleteDialogOpen(true);
    }
  };

  const handleFormSubmit = async (data: BlogFormData) => {
    if (selectedPost) {
      updateMutation.mutate({ id: selectedPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedPost) {
      deleteMutation.mutate(selectedPost.id);
    }
  };

  const handleCloseDialogs = () => {
    setFormOpen(false);
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedPost(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Knowledge Blog
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Write Post
          </Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="All Posts" value="all" />
          {user && <Tab label="My Posts" value="my-posts" />}
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load blog posts
        </Alert>
      )}

      <BlogList posts={posts} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />

      <BlogForm
        key={formOpen ? (selectedPost ? selectedPost.id : 'new') : 'closed'}
        open={formOpen}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        post={selectedPost}
      />

      <BlogViewDialog open={viewDialogOpen} onClose={handleCloseDialogs} post={selectedPost} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteConfirm}
        userName={`blog post "${selectedPost?.title}"`}
      />
    </Container>
  );
};

export default Blog;
