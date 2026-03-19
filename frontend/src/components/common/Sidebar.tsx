// frontend/src/components/common/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  Article as BlogIcon,
  AttachMoney as MoneyIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['ADMIN', 'MEMBER'] },
  { text: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['ADMIN'] },
  { text: 'Reports', icon: <AssignmentIcon />, path: '/reports', roles: ['ADMIN', 'MEMBER'] },
  { text: 'Tasks', icon: <TaskIcon />, path: '/tasks', roles: ['ADMIN', 'MEMBER'] },
  { text: 'Blog', icon: <BlogIcon />, path: '/blog', roles: ['ADMIN', 'MEMBER'] },
  { text: 'Financial', icon: <MoneyIcon />, path: '/financial', roles: ['ADMIN', 'MEMBER'] },
  { text: 'Time Tracking', icon: <TimerIcon />, path: '/time-tracking', roles: ['ADMIN', 'MEMBER'] },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role || 'MEMBER')
  );

  const handleDrawerClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={sidebarOpen}
      onClose={handleDrawerClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {filteredMenu.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={handleDrawerClose}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
      </Box>
    </Drawer>
  );
};

export default Sidebar;