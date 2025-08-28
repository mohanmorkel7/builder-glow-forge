import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers, useLeads, useLeadStats, useFollowUps } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  Download,
  Filter,
  Users,
  Building,
  Rocket,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

// Real-time data function
const getSystemMetrics = (
  users: any[],
  leads: any[],
  leadStats: any,
  followUps: any[],
) => {
  return {
    totalUsers: users.length,
    totalLeads: leads.length,
    totalFollowUps: followUps.length,
    revenue: leads.reduce(
      (sum: number, lead: any) => sum + (lead.project_value || 0),
      0,
    ),
    userGrowth: 12.5, // Could be calculated from user creation dates
    leadGrowth: 8.3, // Could be calculated from lead creation dates
    followUpGrowth: 15.2, // Could be calculated from follow-up creation dates
    revenueGrowth: 18.7, // Could be calculated from revenue changes
  };
};

const monthlyData = [
  { month: "Jan", users: 45, clients: 12, deployments: 8, revenue: 25000 },
  { month: "Feb", users: 52, clients: 15, deployments: 12, revenue: 32000 },
  { month: "Mar", users: 48, clients: 18, deployments: 15, revenue: 28000 },
  { month: "Apr", users: 61, clients: 22, deployments: 18, revenue: 35000 },
  { month: "May", users: 55, clients: 25, deployments: 21, revenue: 42000 },
  { month: "Jun", users: 67, clients: 28, deployments: 19, revenue: 38000 },
];

const getDepartmentData = (users: any[]) => {
  const roleCounts = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return [
    { name: "Admin", value: roleCounts.admin || 0, color: "#8B5CF6" },
    { name: "Sales", value: roleCounts.sales || 0, color: "#3B82F6" },
    { name: "Product", value: roleCounts.product || 0, color: "#10B981" },
  ];
};

const getLeadStatusData = (leadStats: any) => {
  return [
    {
      status: "In Progress",
      count: leadStats?.in_progress || 0,
      color: "#3B82F6",
    },
    { status: "Won", count: leadStats?.won || 0, color: "#10B981" },
    { status: "Completed", count: leadStats?.completed || 0, color: "#8B5CF6" },
    { status: "Lost", count: leadStats?.lost || 0, color: "#EF4444" },
  ];
};

const getFollowUpTrends = (followUps: any[]) => {
  // Group follow-ups by week for trends
  const statusCounts = followUps.reduce((acc: any, followUp: any) => {
    acc[followUp.status] = (acc[followUp.status] || 0) + 1;
    return acc;
  }, {});

  return [
    {
      week: "Current",
      completed: statusCounts.completed || 0,
      in_progress: statusCounts.in_progress || 0,
      pending: statusCounts.pending || 0,
    },
  ];
};

const topClients = [
  {
    name: "TechCorp Solutions",
    revenue: 45000,
    status: "active",
    deployments: 12,
  },
  {
    name: "Global Industries",
    revenue: 38000,
    status: "active",
    deployments: 8,
  },
  {
    name: "Innovation Labs",
    revenue: 32000,
    status: "onboarding",
    deployments: 6,
  },
  {
    name: "Digital Ventures",
    revenue: 28000,
    status: "active",
    deployments: 10,
  },
  {
    name: "Smart Systems",
    revenue: 25000,
    status: "completed",
    deployments: 7,
  },
];

const recentActivity = [
  {
    type: "user_created",
    message: "New user John Doe created",
    timestamp: "2 hours ago",
    icon: Users,
  },
  {
    type: "deployment_completed",
    message: 'Deployment "API Gateway v3.0" completed',
    timestamp: "4 hours ago",
    icon: CheckCircle,
  },
  {
    type: "client_added",
    message: 'New client "TechStart Inc." added',
    timestamp: "6 hours ago",
    icon: Building,
  },
  {
    type: "deployment_failed",
    message: 'Deployment "Mobile App v1.2" failed',
    timestamp: "8 hours ago",
    icon: AlertTriangle,
  },
  {
    type: "user_login",
    message: "User admin@banani.com logged in",
    timestamp: "1 day ago",
    icon: Activity,
  },
];

export default function AdminReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("last_30_days");
  const [reportType, setReportType] = useState("overview");

  // Fetch real data from APIs
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: leadStats } = useLeadStats();
  const { data: followUps = [] } = useFollowUps();

  // Calculate real-time data
  const systemMetrics = getSystemMetrics(users, leads, leadStats, followUps);
  const departmentData = getDepartmentData(users);
  const leadStatusData = getLeadStatusData(leadStats);
  const followUpTrends = getFollowUpTrends(followUps);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "onboarding":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      user_created: Users,
      deployment_completed: CheckCircle,
      client_added: Building,
      deployment_failed: AlertTriangle,
      user_login: Activity,
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const exportReport = (format: string) => {
    console.log(`Exporting report in ${format} format`);
    // Here you would implement the actual export functionality
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and system reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {systemMetrics.totalUsers}
                </p>
                <p className="text-sm text-green-600">
                  +{systemMetrics.userGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">
                  {systemMetrics.totalLeads}
                </p>
                <p className="text-sm text-green-600">
                  +{systemMetrics.leadGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Follow-ups
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {systemMetrics.totalFollowUps}
                </p>
                <p className="text-sm text-green-600">
                  +{systemMetrics.followUpGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  ${systemMetrics.revenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600">
                  +{systemMetrics.revenueGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  User growth and activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" type="category" />
                    <YAxis type="number" />
                    <Tooltip cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" type="category" />
                    <YAxis type="number" />
                    <Tooltip
                      cursor={false}
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>
                  User distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
                <CardDescription>Current lead status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadStatusData.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.status}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold">{item.count}</span>
                        <Badge
                          className={getStatusColor(item.status.toLowerCase())}
                        >
                          {Math.round(
                            (item.count /
                              leadStatusData.reduce(
                                (sum, d) => sum + d.count,
                                0,
                              )) *
                              100,
                          )}
                          %
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {users.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter((u: any) => u.status === "active").length}
                  </p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {
                      users.filter(
                        (u: any) =>
                          new Date(u.created_at) >
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      ).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">New This Month</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" type="category" />
                  <YAxis type="number" />
                  <Tooltip cursor={false} />
                  <Bar dataKey="users" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Leads by Value</CardTitle>
              <CardDescription>Highest value generating leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {lead.client_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {lead.project_title || "No project title"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                      <span className="font-bold text-lg">
                        ${(lead.project_value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Status Overview</CardTitle>
              <CardDescription>
                Current follow-up status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={followUpTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" type="category" />
                  <YAxis type="number" />
                  <Tooltip cursor={false} />
                  <Bar dataKey="successful" fill="#10B981" name="Successful" />
                  <Bar dataKey="failed" fill="#EF4444" name="Failed" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                Latest system events and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 border rounded-lg"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === "deployment_failed"
                            ? "bg-red-100"
                            : activity.type === "deployment_completed"
                              ? "bg-green-100"
                              : "bg-blue-100"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            activity.type === "deployment_failed"
                              ? "text-red-600"
                              : activity.type === "deployment_completed"
                                ? "text-green-600"
                                : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download reports in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => exportReport("pdf")}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport("excel")}>
              <FileText className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => exportReport("csv")}>
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportReport("json")}>
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
