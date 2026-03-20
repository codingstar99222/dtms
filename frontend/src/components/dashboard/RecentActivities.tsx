// frontend/src/components/dashboard/RecentActivities.tsx
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import {
  Assignment as ReportIcon,
  Task as TaskIcon,
  Article as BlogIcon,
} from '@mui/icons-material';
import type { Activity } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface RecentActivitiesProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'report':
      return <ReportIcon />;
    case 'task':
      return <TaskIcon />;
    case 'blog':
      return <BlogIcon />;
    default:
      return <ReportIcon />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'report':
      return '#ff9800';
    case 'task':
      return '#2196f3';
    case 'blog':
      return '#9c27b0';
    default:
      return '#9e9e9e';
  }
};

const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities (Last 7 Days)
      </Typography>
      <List>
        {activities.map((activity, index) => (
          <Box key={activity.id}>
            <ListItem sx={{ py: 1.5, alignItems: 'flex-start' }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}
                >
                  <Typography component="span" variant="body1">
                    {activity.userName}
                  </Typography>
                  <Chip label={activity.action} size="small" color="primary" variant="outlined" />
                </Box>
                <Box component="div" sx={{ mt: 0.5, mb: 0.5 }}>
                  {activity.description}
                </Box>
                <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {formatDateTime(activity.timestamp)}
                </Box>
              </Box>
            </ListItem>
            {index < activities.length - 1 && <Divider variant="inset" component="li" />}
          </Box>
        ))}
        {activities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No recent activities in the last 7 days</Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default RecentActivities;
