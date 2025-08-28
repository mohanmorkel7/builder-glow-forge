import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Plus,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Wallet,
  Receipt,
  CreditCard,
  Building,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  color: string;
}

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {change !== undefined && (
              <div
                className={`flex items-center text-sm ${
                  changeType === "positive"
                    ? "text-green-600"
                    : changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {changeType === "positive" ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : changeType === "negative" ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : null}
                {change > 0 ? "+" : ""}
                {change}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to safely format dates
const formatSafeDate = (
  dateValue: any,
  formatString: string = "MMM d, yyyy",
): string => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? "N/A" : format(date, formatString);
};

export default function FinOpsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["finops-dashboard"],
    queryFn: () => apiClient.getFinOpsDashboard(),
  });

  // Fetch financial metrics
  const { data: metrics } = useQuery({
    queryKey: [
      "finops-metrics",
      selectedPeriod,
      dateRange.start,
      dateRange.end,
    ],
    queryFn: () =>
      apiClient.getFinOpsMetrics(
        selectedPeriod,
        dateRange.start,
        dateRange.end,
      ),
  });

  // Fetch recent transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["finops-transactions", 10],
    queryFn: () => apiClient.getFinOpsTransactions(10, 0),
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ["finops-budgets"],
    queryFn: () => apiClient.getFinOpsBudgets(),
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["finops-invoices"],
    queryFn: () => apiClient.getFinOpsInvoices(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading FinOps dashboard...</div>
      </div>
    );
  }

  const handleExportData = async (type: string) => {
    try {
      const result = await apiClient.exportFinOpsData(
        type,
        "csv",
        dateRange.start,
        dateRange.end,
      );
      console.log("Export initiated:", result);
      // In a real implementation, this would trigger a download
      alert(
        `Export of ${type} data initiated. You will receive a download link shortly.`,
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const result = await apiClient.generateFinOpsReport({
        report_type: reportType,
        start_date: dateRange.start,
        end_date: dateRange.end,
        created_by: parseInt(user?.id || "1"),
      });
      console.log("Report generated:", result);
      alert(`${reportType} report generated successfully.`);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Report generation failed. Please try again.");
    }
  };

  const data = dashboardData || {
    total_revenue: 120000,
    total_costs: 45000,
    profit: 75000,
    profit_margin: 62.5,
    overdue_invoices: { overdue_count: 2, overdue_amount: 15000 },
    budget_utilization: [],
    daily_process_counts: {
      tasks_completed_today: 12,
      tasks_pending_today: 3,
      sla_breaches_today: 1,
      tasks_completed_this_month: 245,
      tasks_pending_this_month: 18,
      sla_breaches_this_month: 8,
    },
  };

  // Fetch real-time FinOps daily process data (mock for now)
  const dailyProcessData = {
    tasks_completed_today: 12,
    tasks_pending_today: 3,
    sla_breaches_today: 1,
    tasks_completed_this_month: 245,
    tasks_pending_this_month: 18,
    sla_breaches_this_month: 8,
  };

  const processData = dailyProcessData || data.daily_process_counts;

  const overdueInvoices = invoices.filter(
    (invoice: any) =>
      invoice.status === "overdue" ||
      (invoice.status === "sent" && new Date(invoice.due_date) < new Date()),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Operations
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor financial performance, budgets, and cash flow
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Period:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-40"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/finops/automation")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Automation Workflow
            </Button>
            <Button onClick={() => generateReport("profit_loss")}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`₹${data.total_revenue?.toLocaleString() || "0"}`}
          change={15.2}
          changeType="positive"
          icon={DollarSign}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Costs"
          value={`₹${data.total_costs?.toLocaleString() || "0"}`}
          change={-8.1}
          changeType="positive"
          icon={TrendingDown}
          color="bg-blue-500"
        />
        <MetricCard
          title="Net Profit"
          value={`₹${data.profit?.toLocaleString() || "0"}`}
          change={23.5}
          changeType="positive"
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <MetricCard
          title="Profit Margin"
          value={`${data.profit_margin?.toFixed(1) || "0"}%`}
          change={5.2}
          changeType="positive"
          icon={Target}
          color="bg-orange-500"
        />
      </div>

      {/* FinOps Daily Process Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            FinOps Daily Process - Real-time Tracking
          </CardTitle>
          <CardDescription>
            Track daily financial operations tasks and SLA compliance with
            month/day wise breakdowns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Today's Performance */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today ({format(new Date(), "MMM dd, yyyy")})
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Tasks Completed</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {processData.tasks_completed_today || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Tasks Pending</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">
                    {processData.tasks_pending_today || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">SLA Breaches</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700">
                    {processData.sla_breaches_today || 0}
                  </Badge>
                </div>
              </div>
            </div>

            {/* This Month's Performance */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                This Month ({format(new Date(), "MMMM yyyy")})
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Tasks Completed</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {processData.tasks_completed_this_month || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Tasks Pending</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">
                    {processData.tasks_pending_this_month || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">SLA Breaches</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700">
                    {processData.sla_breaches_this_month || 0}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Performance Summary & Actions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Performance Summary
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    Daily Success Rate
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {processData.tasks_completed_today &&
                    processData.tasks_pending_today
                      ? Math.round(
                          (processData.tasks_completed_today /
                            (processData.tasks_completed_today +
                              processData.tasks_pending_today)) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-1">
                    Monthly Success Rate
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {processData.tasks_completed_this_month &&
                    processData.tasks_pending_this_month
                      ? Math.round(
                          (processData.tasks_completed_this_month /
                            (processData.tasks_completed_this_month +
                              processData.tasks_pending_this_month)) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/finops/automation")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Detailed Process
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/alerts")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    View Notifications
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="costs">Cost Tracking</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trend</CardTitle>
                <CardDescription>
                  Revenue and expenses over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Cash flow chart would be displayed here</p>
                    <p className="text-sm">
                      (Chart component integration needed)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>
                  How much of each budget has been spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgets.slice(0, 3).map((budget: any) => (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {budget.budget_name}
                        </span>
                        <span>
                          {budget.utilization_percentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (budget.utilization_percentage || 0) > 80
                              ? "bg-red-500"
                              : (budget.utilization_percentage || 0) > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(budget.utilization_percentage || 0, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          ₹{budget.spent_amount?.toLocaleString() || "0"} spent
                        </span>
                        <span>
                          ₹{budget.total_budget?.toLocaleString() || "0"} budget
                        </span>
                      </div>
                    </div>
                  ))}
                  {budgets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-8 h-8 mx-auto mb-2" />
                      <p>No active budgets</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Alerts</CardTitle>
                <CardDescription>
                  Important items requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueInvoices.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">
                          Overdue Invoices
                        </p>
                        <p className="text-sm text-red-700">
                          {overdueInvoices.length} invoice
                          {overdueInvoices.length > 1 ? "s" : ""} past due
                        </p>
                      </div>
                    </div>
                  )}

                  {budgets.some(
                    (b: any) => (b.utilization_percentage || 0) > 90,
                  ) && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">
                          Budget Alert
                        </p>
                        <p className="text-sm text-yellow-700">
                          Some budgets are over 90% utilized
                        </p>
                      </div>
                    </div>
                  )}

                  {data.profit_margin > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">
                          Healthy Margins
                        </p>
                        <p className="text-sm text-green-700">
                          Current profit margin:{" "}
                          {data.profit_margin?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col">
                    <Receipt className="w-6 h-6 mb-2" />
                    <span className="text-xs">Create Invoice</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <CreditCard className="w-6 h-6 mb-2" />
                    <span className="text-xs">Record Payment</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Wallet className="w-6 h-6 mb-2" />
                    <span className="text-xs">Add Expense</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Building className="w-6 h-6 mb-2" />
                    <span className="text-xs">New Budget</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-right p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction: any) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          {formatSafeDate(transaction.transaction_date)}
                        </td>
                        <td className="p-4">{transaction.description}</td>
                        <td className="p-4">
                          <Badge
                            variant={
                              transaction.transaction_type === "income"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-medium">
                          ₹{transaction.total_amount?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              transaction.status === "posted"
                                ? "default"
                                : "outline"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Budget Overview</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget: any) => (
              <Card key={budget.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {budget.budget_name}
                  </CardTitle>
                  <CardDescription>{budget.budget_type} budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span className="font-medium">
                        ₹{budget.total_budget?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <span className="font-medium">
                        ₹{budget.spent_amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-medium">
                        ₹
                        {(
                          budget.total_budget - (budget.spent_amount || 0)
                        )?.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (budget.utilization_percentage || 0) > 80
                            ? "bg-red-500"
                            : (budget.utilization_percentage || 0) > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(budget.utilization_percentage || 0, 100)}%`,
                        }}
                      />
                    </div>
                    <Badge
                      variant={
                        budget.status === "active" ? "default" : "secondary"
                      }
                    >
                      {budget.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Invoice Management</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Invoice #</th>
                      <th className="text-left p-4 font-medium">Client</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Due Date</th>
                      <th className="text-right p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => (
                      <tr
                        key={invoice.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium">
                          {invoice.invoice_number}
                        </td>
                        <td className="p-4">{invoice.client_name || "N/A"}</td>
                        <td className="p-4">
                          {formatSafeDate(invoice.invoice_date)}
                        </td>
                        <td className="p-4">
                          {formatSafeDate(invoice.due_date)}
                        </td>
                        <td className="p-4 text-right font-medium">
                          ₹{invoice.total_amount?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cost Tracking</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </div>

          <div className="text-center py-8 text-gray-500">
            <PieChart className="w-12 h-12 mx-auto mb-2" />
            <p>Cost tracking interface would be displayed here</p>
            <p className="text-sm">
              Track expenses by category, project, and time period
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Reports</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportData("transactions")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={() => generateReport("balance_sheet")}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Profit & Loss",
                description: "Revenue and expenses breakdown",
                type: "profit_loss",
              },
              {
                name: "Balance Sheet",
                description: "Assets, liabilities, and equity",
                type: "balance_sheet",
              },
              {
                name: "Cash Flow",
                description: "Cash inflows and outflows",
                type: "cash_flow",
              },
              {
                name: "Budget Variance",
                description: "Budget vs actual analysis",
                type: "budget_variance",
              },
              {
                name: "Cost Analysis",
                description: "Detailed cost breakdown",
                type: "cost_analysis",
              },
              {
                name: "Revenue Report",
                description: "Revenue trends and analysis",
                type: "revenue_report",
              },
            ].map((report) => (
              <Card
                key={report.type}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport(report.type)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
