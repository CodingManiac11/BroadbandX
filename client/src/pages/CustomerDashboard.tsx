import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Wifi as PlansIcon,
  Subscriptions as SubscriptionsIcon,
  Analytics as AnalyticsIcon,
  Receipt as BillingIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Speed as SpeedIcon,
  TrendingUp,
  AttachMoney,
  DataUsage,
  SignalWifi4Bar,
  Payment,
  Support,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { customerService, CustomerStats, BillingHistory } from '../services/customerService';
import { Plan, Subscription } from '../types/index';
import UPIPaymentForm from '../components/UPIPaymentForm';
import { Modal, ModalBody } from '../components/Modal';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState<CustomerStats>({
    activeSubscriptions: 0,
    monthlySpending: 0,
    totalDataUsage: 0,
    averageSpeed: 0,
    upcomingBills: 0,
    supportTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState({
    plans: false,
    subscriptions: false,
    billing: false,
    usage: false,
  });

  useEffect(() => {
    fetchCustomerStats();
  }, []);

  const fetchCustomerStats = async () => {
    try {
      console.log('Fetching customer stats...');
      const statsData = await customerService.getCustomerStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      // Fallback to mock data if API fails
      setStats({
        activeSubscriptions: 2,
        monthlySpending: 2499,
        totalDataUsage: 45.6,
        averageSpeed: 87.3,
        upcomingBills: 1,
        supportTickets: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setSectionsLoading(prev => ({ ...prev, subscriptions: true }));
      const subscriptionsData = await customerService.getMySubscriptions();
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setSectionsLoading(prev => ({ ...prev, subscriptions: false }));
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      setSectionsLoading(prev => ({ ...prev, plans: true }));
      const response = await customerService.getAvailablePlans();
      if (response?.plans && Array.isArray(response.plans)) {
        setAvailablePlans(response.plans);
      } else {
        console.error('Invalid plans data format:', response);
        setAvailablePlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setAvailablePlans([]);
    } finally {
      setSectionsLoading(prev => ({ ...prev, plans: false }));
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setSectionsLoading(prev => ({ ...prev, billing: true }));
      const response = await customerService.getBillingHistory();
      setBillingHistory(response.bills);
    } catch (error) {
      console.error('Error fetching billing history:', error);
      setBillingHistory([]);
    } finally {
      setSectionsLoading(prev => ({ ...prev, billing: false }));
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    // Refresh subscriptions
    await fetchSubscriptions();
    // Show success message
    alert('Subscription activated successfully!');
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
    { text: 'Browse Plans', icon: <PlansIcon />, value: 'plans' },
    { text: 'My Subscriptions', icon: <SubscriptionsIcon />, value: 'subscriptions' },
    { text: 'Usage Analytics', icon: <AnalyticsIcon />, value: 'usage' },
    { text: 'Billing', icon: <BillingIcon />, value: 'billing' },
    { text: 'Support', icon: <Support />, value: 'support' },
    { text: 'Settings', icon: <SettingsIcon />, value: 'settings' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
          {user?.firstName?.charAt(0) || user?.email?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h6" noWrap>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Customer Portal
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={activeSection === item.value}
              onClick={() => setActiveSection(item.value)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
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

  const StatCard = ({ title, value, icon, color = "primary", unit = "" }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "info";
    unit?: string;
  }) => (
    <Card sx={{ height: '100%', minWidth: 250 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {loading ? <CircularProgress size={24} /> : `${value}${unit}`}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const PlansSection = () => {
    useEffect(() => {
      if (activeSection === 'plans' && availablePlans.length === 0) {
        fetchAvailablePlans();
      }
    }, [activeSection]);

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Browse Available Plans
        </Typography>
        
        {sectionsLoading.plans ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : availablePlans.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom color="textSecondary">
              No Plans Available
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Please try again later or contact support.
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" gap={3}>
            {availablePlans.map((plan) => (
              <Card key={plan._id} sx={{ minWidth: 300, maxWidth: 400, flex: '1 1 300px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {plan.description}
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="h4" color="primary">
                      ₹{plan.pricing.monthly.toLocaleString()}
                      <Typography component="span" variant="body2" color="textSecondary">
                        /month
                      </Typography>
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      <SpeedIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Speed: {plan.features.speed.download} {plan.features.speed.unit} Download
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <DataUsage sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Data: {plan.features.dataLimit.unlimited ? 'Unlimited' : `${plan.features.dataLimit.amount} ${plan.features.dataLimit.unit}`}
                    </Typography>
                    <Typography variant="body2">
                      <Chip 
                        label={plan.category} 
                        size="small" 
                        color={plan.category === 'business' ? 'secondary' : 'primary'}
                      />
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => handleSubscribe(plan)}
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const SubscriptionsSection = () => {
    useEffect(() => {
      if (activeSection === 'subscriptions' && subscriptions.length === 0) {
        fetchSubscriptions();
      }
    }, [activeSection]);

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          My Subscriptions
        </Typography>
        
        {sectionsLoading.subscriptions ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" gap={3}>
            {subscriptions.map((subscription) => (
              <Card key={subscription._id} sx={{ minWidth: 350, maxWidth: 500, flex: '1 1 350px' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6">
                      {subscription.plan.name}
                    </Typography>
                    <Chip 
                      label={subscription.status} 
                      color={subscription.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {subscription.plan.description}
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Speed:</strong> {subscription.plan.features.speed.download} {subscription.plan.features.speed.unit}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Monthly Cost:</strong> ₹{subscription.pricing?.totalAmount?.toLocaleString() || 'N/A'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Billing Cycle:</strong> {subscription.billingCycle}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>End Date:</strong> {new Date(subscription.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} mt={2}>
                    <Button size="small" variant="outlined">
                      View Usage
                    </Button>
                    <Button size="small" variant="outlined">
                      Modify Plan
                    </Button>
                    <Button size="small" variant="outlined" color="error">
                      Cancel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const BillingSection = () => {
    useEffect(() => {
      if (activeSection === 'billing' && billingHistory.length === 0) {
        fetchBillingHistory();
      }
    }, [activeSection]);

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Billing & Payments
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
          {stats.activeSubscriptions > 0 ? (
            <>
              <StatCard 
                title="Next Bill Amount" 
                value={`₹${stats.monthlySpending.toLocaleString()}`}
                icon={<Payment sx={{ fontSize: 40 }} />} 
                color="info" 
              />
              <StatCard 
                title="Due Date" 
                value="Oct 15" 
                icon={<BillingIcon sx={{ fontSize: 40 }} />} 
                color="secondary" 
              />
              <StatCard 
                title="Monthly Average" 
                value={`₹${stats.monthlySpending.toLocaleString()}`}
                icon={<TrendingUp sx={{ fontSize: 40 }} />} 
                color="success" 
              />
            </>
          ) : (
            <StatCard 
              title="Subscription Status" 
              value="No active subscription"
              icon={<SubscriptionsIcon sx={{ fontSize: 40 }} />} 
              color="info" 
            />
          )}
        </Box>

        {sectionsLoading.billing ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : stats.activeSubscriptions === 0 && billingHistory.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" gutterBottom color="textSecondary">
                  No Billing History
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  You haven't subscribed to any plans yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlansIcon />}
                  onClick={() => setActiveSection('plans')}
                >
                  Browse Plans
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing History
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingHistory.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(bill.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={bill.status} 
                            color={
                              bill.status === 'paid' ? 'success' : 
                              bill.status === 'pending' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {bill.status === 'pending' && (
                            <Button size="small" variant="contained" color="primary">
                              Pay Now
                            </Button>
                          )}
                          {bill.status === 'paid' && (
                            <Button size="small" variant="outlined">
                              Download Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderDashboardContent = () => {
    switch (activeSection) {
      case 'plans':
        return <PlansSection />;
      case 'subscriptions':
        return <SubscriptionsSection />;
      case 'billing':
        return <BillingSection />;
      case 'usage':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Analytics
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Usage analytics and charts will be implemented here.
              </Typography>
            </CardContent>
          </Card>
        );
      case 'support':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Support Center
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Support ticket management will be implemented here.
              </Typography>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Profile management and settings will be implemented here.
              </Typography>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Box>
            <Typography variant="h4" gutterBottom>
              Customer Dashboard
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
              <StatCard 
                title="Active Subscriptions" 
                value={stats.activeSubscriptions} 
                icon={<SubscriptionsIcon sx={{ fontSize: 40 }} />} 
                color="primary" 
              />
              <StatCard 
                title="Monthly Spending" 
                value={stats.activeSubscriptions > 0 ? `₹${stats.monthlySpending.toLocaleString()}` : 'No active subscription'}
                icon={<AttachMoney sx={{ fontSize: 40 }} />} 
                color="secondary" 
              />
              <StatCard 
                title="Data Usage" 
                value={stats.totalDataUsage} 
                unit=" GB"
                icon={<DataUsage sx={{ fontSize: 40 }} />} 
                color="info" 
              />
              <StatCard 
                title="Average Speed" 
                value={stats.averageSpeed} 
                unit=" Mbps"
                icon={<SignalWifi4Bar sx={{ fontSize: 40 }} />} 
                color="success" 
              />
            </Box>

            <Box display="flex" flexWrap="wrap" gap={3}>
              <Card sx={{ flex: '2 1 400px', minWidth: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Button 
                      variant="contained" 
                      startIcon={<PlansIcon />}
                      onClick={() => setActiveSection('plans')}
                    >
                      Browse Plans
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<AnalyticsIcon />}
                      onClick={() => setActiveSection('usage')}
                    >
                      View Usage
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<Payment />}
                      onClick={() => setActiveSection('billing')}
                    >
                      Pay Bills
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
              
              <Card sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Summary
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Next Bill Due
                    </Typography>
                    <Typography variant="h6" color="primary">
                      October 15, 2025
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Amount Due
                    </Typography>
                    <Typography variant="h6">
                      {stats.activeSubscriptions > 0 ? `₹${stats.monthlySpending.toLocaleString()}` : 'No active subscription'}
                    </Typography>
                  </Box>
                  {stats.activeSubscriptions > 0 && (
                    <Button variant="contained" fullWidth startIcon={<Payment />}>
                      Pay Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        );
    }
  };

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
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
            BroadbandX - Customer Portal
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="customer navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {renderDashboardContent()}
        </Container>
      </Box>

      {/* Payment Modal */}
      {selectedPlan && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Subscribe to Plan"
          size="lg"
        >
          <ModalBody>
            <UPIPaymentForm
              plan={selectedPlan}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          </ModalBody>
        </Modal>
      )}
    </Box>
  );
};

export default CustomerDashboard;