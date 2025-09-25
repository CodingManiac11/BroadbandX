export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  topPlans: string[];
  userGrowth: {
    labels: string[];
    data: number[];
  };
  revenueGrowth: {
    labels: string[];
    data: number[];
  };
  planPerformance: Array<{
    name: string;
    subscriptions: number;
    revenue: number;
    growthRate: number;
  }>;
  usersByRegion: Array<{
    region: string;
    count: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'subscription' | 'cancellation' | 'payment' | 'user_joined';
    description: string;
    timestamp: string;
  }>;
}