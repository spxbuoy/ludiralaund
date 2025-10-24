import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  List as ListIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  LocalLaundryService as ServicesIcon,
  Logout as LogoutIcon,
  AttachMoney as EarningsIcon,
  AccessTime as AvailabilityIcon,
  Analytics as AnalyticsIcon,
  Payment as PaymentIcon,
  RateReview as ReviewsIcon,
  History as HistoryIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useThemeMode } from '../../app/ThemeModeProvider';

const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXs = useMediaQuery(theme.breakpoints.down(600));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode, toggleTheme } = useThemeMode();

  // Responsive drawer width
  const responsiveDrawerWidth = isXs ? 260 : drawerWidth;

  const getMenuItems = () => {
    switch (user?.role) {
      case 'service_provider':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/provider' },
          { text: 'Orders', icon: <ListIcon />, path: '/provider/orders' },
          { text: 'Earnings', icon: <EarningsIcon />, path: '/provider/earnings' },
          { text: 'Availability', icon: <AvailabilityIcon />, path: '/provider/availability' },
          { text: 'Profile', icon: <PersonIcon />, path: '/provider/profile' },
          { text: 'Settings', icon: <SettingsIcon />, path: '/provider/settings' },
        ];
      case 'customer':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/customer' },
          { text: 'New Order', icon: <AddIcon />, path: '/customer/new-order' },
          { text: 'Orders', icon: <ListIcon />, path: '/customer/orders' },
          { text: 'Payment History', icon: <HistoryIcon />, path: '/customer/payment-history' },
          { text: 'Services', icon: <ServicesIcon />, path: '/customer/services' },
          { text: 'Profile', icon: <PersonIcon />, path: '/customer/profile' },
          { text: 'Settings', icon: <SettingsIcon />, path: '/customer/settings' },
        ];
      case 'admin':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
          { text: 'Users', icon: <PersonIcon />, path: '/admin/users' },
          { text: 'Orders', icon: <ListIcon />, path: '/admin/orders' },
                    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
                    { text: 'Payment History', icon: <HistoryIcon />, path: '/admin/payment-history' },
                    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Laundry App
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${responsiveDrawerWidth}px)` },
          ml: { sm: `${responsiveDrawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            aria-label="toggle theme"
            sx={{ ml: 1 }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: responsiveDrawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: responsiveDrawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${responsiveDrawerWidth}px)` },
          mt: '64px',
          overflowX: 'hidden', // Prevent horizontal scrolling
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
