// frontend/src/components/dashboard/RecentActivities.tsx
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import {
  Assignment as ReportIcon,
  Task as TaskIcon,
  Article as BlogIcon,
  Timer as TimeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import type { Activity } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { Link } from 'react-router-dom';

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
    case 'time':
      return <TimeIcon />;
    case 'financial':
      return <MoneyIcon />;
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
    case 'time':
      return '#4caf50';
    case 'financial':
      return '#f44336';
  }
};

const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities
      </Typography>
      <List>
        {activities.map((activity, index) => (
          <Box key={activity.id}>
            <ListItem
              component={activity.link ? Link : 'div'}
              to={activity.link}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': activity.link ? {
                  backgroundColor: 'action.hover',
                } : {},
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{activity.userName}</Typography>
                    <Chip
                      label={activity.action}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(activity.timestamp)}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < activities.length - 1 && <Divider variant="inset" component="li" />}
          </Box>
        ))}
      </List>
    </Paper>
  );
};

export default RecentActivities;