import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar, Download, Filter } from 'lucide-react';

interface AnalyticsData {
  subscriptions: {
    total: number;
    active: number;
    churned: number;
    new: number;
    growth: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    arpu: number;
  };
  usage: {
    totalBandwidth: number;
    averageUsage: number;
    peakUsage: number;
  };
  trends: {
    subscriptionTrend: Array<{ month: string; active: number; new: number; churned: number }>;
    revenueTrend: Array<{ month: string; revenue: number; target: number }>;
    usageTrend: Array<{ month: string; usage: number; bandwidth: number }>;
    planDistribution: Array<{ name: string; value: number; color: string }>;
  };
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('subscriptions');

  // Mock data generation
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      const subscriptionTrend = [
        { month: 'Jan', active: 1200, new: 150, churned: 25 },
        { month: 'Feb', active: 1325, new: 180, churned: 35 },
        { month: 'Mar', active: 1470, new: 200, churned: 45 },
        { month: 'Apr', active: 1625, new: 220, churned: 55 },
        { month: 'May', active: 1790, new: 250, churned: 65 },
        { month: 'Jun', active: 1975, new: 275, churned: 80 }
      ];

      const revenueTrend = [
        { month: 'Jan', revenue: 48000, target: 45000 },
        { month: 'Feb', revenue: 53000, target: 50000 },
        { month: 'Mar', revenue: 58800, target: 55000 },
        { month: 'Apr', revenue: 65000, target: 60000 },
        { month: 'May', revenue: 71600, target: 65000 },
        { month: 'Jun', revenue: 79000, target: 70000 }
      ];

      const usageTrend = [
        { month: 'Jan', usage: 85, bandwidth: 100 },
        { month: 'Feb', usage: 92, bandwidth: 100 },
        { month: 'Mar', usage: 88, bandwidth: 100 },
        { month: 'Apr', usage: 95, bandwidth: 100 },
        { month: 'May', usage: 90, bandwidth: 100 },
        { month: 'Jun', usage: 97, bandwidth: 100 }
      ];

      const planDistribution = [
        { name: 'Basic', value: 35, color: '#8884d8' },
        { name: 'Standard', value: 45, color: '#82ca9d' },
        { name: 'Premium', value: 15, color: '#ffc658' },
        { name: 'Enterprise', value: 5, color: '#ff7c7c' }
      ];

      return {
        subscriptions: {
          total: 1975,
          active: 1895,
          churned: 80,
          new: 275,
          growth: 12.5
        },
        revenue: {
          total: 79000,
          monthly: 79000,
          growth: 18.2,
          arpu: 40
        },
        usage: {
          totalBandwidth: 19750,
          averageUsage: 97,
          peakUsage: 134
        },
        trends: {
          subscriptionTrend,
          revenueTrend,
          usageTrend,
          planDistribution
        }
      };
    };

    setAnalyticsData(generateMockData());
  }, [timeRange]);

  if (!analyticsData) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const MetricCard = ({ title, value, change, icon: Icon, trend }: {
    title: string;
    value: string;
    change: number;
    icon: any;
    trend: 'up' | 'down';
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
        <div className={`flex items-center space-x-1 text-sm ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your BroadbandX performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Subscriptions"
          value={analyticsData.subscriptions.total.toLocaleString()}
          change={analyticsData.subscriptions.growth}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${analyticsData.revenue.monthly.toLocaleString()}`}
          change={analyticsData.revenue.growth}
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Average Usage"
          value={`${analyticsData.usage.averageUsage}%`}
          change={5.2}
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="ARPU"
          value={`$${analyticsData.revenue.arpu}`}
          change={2.8}
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.trends.subscriptionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="new" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="churned" stroke="#ff7c7c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Target */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.trends.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Actual Revenue" />
              <Bar dataKey="target" fill="#82ca9d" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trends.usageTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="usage" stackId="1" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.trends.planDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const name = props.name || '';
                  const value = typeof props.value === 'number' ? props.value : 0;
                  const total = analyticsData.trends.planDistribution.reduce((sum, entry) => sum + entry.value, 0);
                  return `${name} ${((value / total) * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.trends.planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Active Subscriptions</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{analyticsData.subscriptions.active}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,690</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+12.1%</td>
                <td className="px-6 py-4 whitespace-nowrap"><TrendingUp className="w-4 h-4 text-green-600" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Monthly Revenue</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${analyticsData.revenue.monthly.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$67,600</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+16.9%</td>
                <td className="px-6 py-4 whitespace-nowrap"><TrendingUp className="w-4 h-4 text-green-600" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Churn Rate</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4.2%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5.1%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-0.9%</td>
                <td className="px-6 py-4 whitespace-nowrap"><TrendingDown className="w-4 h-4 text-green-600" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};