import * as XLSX from 'xlsx';

export interface SubscriptionUser {
  userId: string;
  name: string;
  email: string;
  plan: string;
  subscriptionDate: string;
  status: string;
  revenue: number;
  region: string;
  age?: number;
  usage?: number;
}

export interface ProcessedDataset {
  users: SubscriptionUser[];
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  topPlans: string[];
  userGrowth: { labels: string[]; data: number[] };
  revenueGrowth: { labels: string[]; data: number[] };
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

export class DatasetService {
  private static instance: DatasetService;
  private dataset: SubscriptionUser[] = [];
  private processedData: ProcessedDataset | null = null;

  private constructor() {}

  public static getInstance(): DatasetService {
    if (!DatasetService.instance) {
      DatasetService.instance = new DatasetService();
    }
    return DatasetService.instance;
  }

  public async loadDataset(): Promise<void> {
    try {
      const response = await fetch('/SubscriptionUseCase_Dataset.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Assume the first sheet contains the user data
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      // Process and clean the data
      this.dataset = this.processRawData(rawData);
      this.processedData = this.generateProcessedData();
      
      console.log('Dataset loaded successfully:', this.dataset.length, 'users');
    } catch (error) {
      console.error('Error loading dataset:', error);
      // Fallback to mock data if Excel file is not available
      this.generateMockData();
    }
  }

  private processRawData(rawData: any[]): SubscriptionUser[] {
    return rawData.map((row, index) => {
      // Map Excel columns to our interface
      // Adjust these field names based on actual Excel columns
      return {
        userId: row.UserID || row.user_id || `user_${index + 1}`,
        name: row.Name || row.user_name || `User ${index + 1}`,
        email: row.Email || row.email || `user${index + 1}@example.com`,
        plan: row.Plan || row.subscription_plan || row.plan_type || 'Basic',
        subscriptionDate: row.SubscriptionDate || row.subscription_date || new Date().toISOString(),
        status: row.Status || row.subscription_status || 'Active',
        revenue: this.parseNumber(row.Revenue || row.revenue || row.amount) || 100,
        region: row.Region || row.region || row.location || 'North',
        age: this.parseNumber(row.Age || row.age),
        usage: this.parseNumber(row.Usage || row.usage_hours)
      };
    });
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private generateMockData(): void {
    console.log('Generating mock dataset as fallback...');
    this.dataset = [
      {
        userId: 'user_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        plan: 'Premium',
        subscriptionDate: '2024-01-15',
        status: 'Active',
        revenue: 299,
        region: 'North',
        age: 28,
        usage: 45
      },
      {
        userId: 'user_2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        plan: 'Basic',
        subscriptionDate: '2024-02-20',
        status: 'Active',
        revenue: 99,
        region: 'South',
        age: 32,
        usage: 30
      },
      {
        userId: 'user_3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        plan: 'Business Pro',
        subscriptionDate: '2024-03-10',
        status: 'Active',
        revenue: 499,
        region: 'East',
        age: 45,
        usage: 80
      },
      {
        userId: 'user_4',
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        plan: 'Premium',
        subscriptionDate: '2024-04-05',
        status: 'Cancelled',
        revenue: 299,
        region: 'West',
        age: 26,
        usage: 25
      },
      {
        userId: 'user_5',
        name: 'Charlie Wilson',
        email: 'charlie.wilson@example.com',
        plan: 'Basic',
        subscriptionDate: '2024-05-12',
        status: 'Active',
        revenue: 99,
        region: 'North',
        age: 35,
        usage: 40
      }
    ];
    this.processedData = this.generateProcessedData();
  }

  private generateProcessedData(): ProcessedDataset {
    const activeUsers = this.dataset.filter(user => user.status === 'Active');
    const planCounts = this.groupByPlan();
    const regionCounts = this.groupByRegion();
    const monthlyData = this.generateMonthlyGrowth();

    return {
      users: this.dataset,
      totalUsers: this.dataset.length,
      activeSubscriptions: activeUsers.length,
      totalRevenue: this.dataset.reduce((sum, user) => sum + user.revenue, 0),
      topPlans: Object.keys(planCounts).sort((a, b) => planCounts[b] - planCounts[a]).slice(0, 3),
      userGrowth: monthlyData.userGrowth,
      revenueGrowth: monthlyData.revenueGrowth,
      planPerformance: Object.entries(planCounts).map(([plan, count]) => ({
        name: plan,
        subscriptions: count,
        revenue: this.dataset
          .filter(user => user.plan === plan)
          .reduce((sum, user) => sum + user.revenue, 0),
        growthRate: Math.floor(Math.random() * 30) + 5 // Simulated growth rate
      })),
      usersByRegion: Object.entries(regionCounts).map(([region, count]) => ({
        region,
        count
      })),
      recentActivities: this.generateRecentActivities()
    };
  }

  private groupByPlan(): Record<string, number> {
    return this.dataset.reduce((acc, user) => {
      acc[user.plan] = (acc[user.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByRegion(): Record<string, number> {
    return this.dataset.reduce((acc, user) => {
      acc[user.region] = (acc[user.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateMonthlyGrowth() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const usersByMonth = months.map((_, index) => {
      const monthUsers = this.dataset.filter(user => {
        const date = new Date(user.subscriptionDate);
        return date.getMonth() === index;
      }).length;
      return Math.max(monthUsers, Math.floor(Math.random() * 20) + 10);
    });

    const revenueByMonth = months.map((_, index) => {
      const monthRevenue = this.dataset
        .filter(user => {
          const date = new Date(user.subscriptionDate);
          return date.getMonth() === index;
        })
        .reduce((sum, user) => sum + user.revenue, 0);
      return Math.max(monthRevenue, Math.floor(Math.random() * 5000) + 2000);
    });

    return {
      userGrowth: { labels: months, data: usersByMonth },
      revenueGrowth: { labels: months, data: revenueByMonth }
    };
  }

  private generateRecentActivities(): Array<{
    id: string;
    type: 'subscription' | 'cancellation' | 'payment' | 'user_joined';
    description: string;
    timestamp: string;
  }> {
    const activities: Array<{
      id: string;
      type: 'subscription' | 'cancellation' | 'payment' | 'user_joined';
      description: string;
      timestamp: string;
    }> = [];
    const recentUsers = this.dataset.slice(-5);

    recentUsers.forEach((user, index) => {
      const activityType: 'subscription' | 'cancellation' | 'payment' | 'user_joined' = 
        user.status === 'Active' ? 'subscription' : 'cancellation';
      
      activities.push({
        id: `activity_${index + 1}`,
        type: activityType,
        description: `${user.name} ${user.status === 'Active' ? 'subscribed to' : 'cancelled'} ${user.plan} plan`,
        timestamp: new Date(Date.now() - (index * 3600000)).toISOString()
      });
    });

    return activities;
  }

  public getProcessedData(): ProcessedDataset | null {
    return this.processedData;
  }

  public getUserRecommendations(): any[] {
    if (!this.dataset.length) return [];

    // Simple ML-like recommendations based on user patterns
    const recommendations = [];
    const planCounts = this.groupByPlan();
    const mostPopularPlan = Object.keys(planCounts).reduce((a, b) => 
      planCounts[a] > planCounts[b] ? a : b
    );

    // Recommend upgrades for Basic plan users
    const basicUsers = this.dataset.filter(user => user.plan === 'Basic' && user.status === 'Active');
    if (basicUsers.length > 0) {
      recommendations.push({
        planId: 'basic_upgrade',
        type: 'upgrade',
        title: 'Upgrade Basic Users to Premium',
        description: `${basicUsers.length} Basic plan users could be targeted for Premium upgrade`,
        confidence: 0.85,
        estimatedRevenue: basicUsers.length * 200,
        status: 'pending'
      });
    }

    // Recommend retention for high-usage users
    const highUsageUsers = this.dataset.filter(user => (user.usage || 0) > 60);
    if (highUsageUsers.length > 0) {
      recommendations.push({
        planId: 'retention_program',
        type: 'retention',
        title: 'Retention Program for High-Usage Users',
        description: `${highUsageUsers.length} users with high usage should be offered special retention deals`,
        confidence: 0.92,
        estimatedRevenue: highUsageUsers.length * 150,
        status: 'pending'
      });
    }

    return recommendations;
  }
}

export const datasetService = DatasetService.getInstance();