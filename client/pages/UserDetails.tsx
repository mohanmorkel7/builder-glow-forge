import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Building,
  User,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  Cloud,
  Key,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";

const roleColors = {
  admin: "bg-red-100 text-red-700",
  sales: "bg-blue-100 text-blue-700",
  product: "bg-green-100 text-green-700",
  development: "bg-purple-100 text-purple-700",
  db: "bg-gray-100 text-gray-700",
  finops: "bg-yellow-100 text-yellow-700",
  finance: "bg-green-100 text-green-700",
  hr_management: "bg-pink-100 text-pink-700",
  infra: "bg-indigo-100 text-indigo-700",
  switch_team: "bg-orange-100 text-orange-700",
  backend: "bg-purple-100 text-purple-700",
  unknown: "bg-gray-100 text-gray-700",
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name?: string;
  timestamp: string;
  user_name?: string;
  details?: string;
}

interface ActivityStats {
  totalActions: number;
  actionsThisMonth: number;
  loginCount: number;
}

// Mock permissions data
const mockPermissions = {
  admin: [
    "User Management",
    "Template Creation & Editing",
    "System Configuration",
    "Analytics & Reports",
    "Client Management",
    "Deployment Management",
  ],
  sales: [
    "Client Management",
    "Follow-up Tracking",
    "Template Usage",
    "Sales Reports",
    "Contact Management",
  ],
  product: [
    "Deployment Management",
    "Product Configuration",
    "Release Management",
    "System Monitoring",
    "Development Tools",
  ],
  development: [
    "Technical Development",
    "Code Repository Access",
    "API Management",
    "Testing Tools",
  ],
  db: [
    "Database Administration",
    "Data Management",
    "Backup & Recovery",
    "Query Optimization",
  ],
  finops: [
    "Financial Operations",
    "Cost Management",
    "Budget Planning",
    "Financial Reports",
  ],
  finance: [
    "Financial Management",
    "Accounting",
    "Budget Control",
    "Financial Analytics",
  ],
  hr_management: [
    "Human Resources",
    "Employee Management",
    "Recruitment",
    "Performance Reviews",
  ],
  infra: [
    "Infrastructure Management",
    "System Monitoring",
    "Server Administration",
    "Network Management",
  ],
  switch_team: [
    "Switch Operations",
    "Integration Management",
    "System Integration",
    "Technical Support",
  ],
  backend: [
    "Backend Development",
    "API Development",
    "Server Management",
    "Database Integration",
  ],
  unknown: ["Limited Access", "Pending Role Assignment"],
};

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Handle both numeric IDs and string IDs (like azure-1)
  const userId = id && !isNaN(parseInt(id)) ? parseInt(id) : 0;
  const { data: user, isLoading, error } = useUser(userId);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);
  const [activityStats, setActivityStats] =
    React.useState<ActivityStats | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);

  // If ID is not numeric, show appropriate error
  const isInvalidId = id && isNaN(parseInt(id));

  // Fetch real activity data
  React.useEffect(() => {
    const fetchActivityData = async () => {
      if (!userId || isInvalidId) return;

      try {
        setDataLoading(true);

        // Fetch recent activity logs
        const activityResponse = await apiClient.request(
          "/activity-production",
          {
            method: "GET",
            params: new URLSearchParams({
              limit: "10",
              user_id: userId.toString(),
            }),
          },
        );

        if (activityResponse?.activity_logs) {
          setActivityLogs(activityResponse.activity_logs);
        }

        // Fetch activity statistics
        const statsResponse = await apiClient.request(
          "/activity-production/stats/summary",
          {
            method: "GET",
            params: new URLSearchParams({
              days: "30",
              user_id: userId.toString(),
            }),
          },
        );

        if (statsResponse) {
          setActivityStats({
            totalActions: statsResponse.total_count || 0,
            actionsThisMonth: statsResponse.recent_count || 0,
            loginCount:
              statsResponse.login_count || statsResponse.total_count || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching activity data:", error);
        // Set fallback data if API fails
        setActivityStats({
          totalActions: 0,
          actionsThisMonth: 0,
          loginCount: 0,
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchActivityData();
  }, [userId, isInvalidId]);

  const resetPassword = async () => {
    if (!id) return;

    setResetError(null);
    try {
      const response = await fetch(`/api/users/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      alert("Password reset email sent successfully!");
    } catch (error) {
      console.error("Failed to reset password:", error);
      setResetError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.",
      );
    }
  };

  const handleBack = () => {
    navigate("/admin/users");
  };

  const handleEdit = () => {
    navigate(`/admin/users/${id}/edit`);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getAccountAge = (createdAt: string) => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch {
      return "N/A";
    }
  };

  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
      case "logged in":
        return "bg-green-500";
      case "create":
      case "created":
        return "bg-blue-500";
      case "update":
      case "updated":
        return "bg-yellow-500";
      case "delete":
      case "deleted":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          Loading user details...
        </div>
      </div>
    );
  }

  if (isInvalidId) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <Alert>
            <AlertDescription>
              Invalid user ID "{id}". User IDs must be numeric. If you're
              looking for a specific user, please use the user management page
              to find them.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <Alert>
            <AlertDescription>
              Error loading user details. The user may not exist or there may be
              a connection issue.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const userData = user as any;
  const userPermissions =
    mockPermissions[userData.role] || mockPermissions.unknown;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {userData.first_name} {userData.last_name}
            </h1>
            <p className="text-gray-600 mt-1">User Profile & Activity</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit User
        </Button>
      </div>

      {/* Error Display */}
      {resetError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{resetError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Basic user information and authentication details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-xl bg-primary text-white">
                    {userData.first_name?.[0] || "U"}
                    {userData.last_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {userData.first_name} {userData.last_name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      className={
                        roleColors[userData.role] || roleColors.unknown
                      }
                    >
                      {userData.role.charAt(0).toUpperCase() +
                        userData.role.slice(1)}
                    </Badge>
                    <Badge
                      className={
                        statusColors[userData.status] || statusColors.active
                      }
                    >
                      {userData.status?.charAt(0).toUpperCase() +
                        userData.status?.slice(1) || "Active"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Email:</span>
                    <a
                      href={`mailto:${userData.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {userData.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-900">
                      {userData.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Department:
                    </span>
                    <span className="text-gray-900">
                      {userData.department || "Not specified"}
                    </span>
                  </div>

                  {/* Job Title */}
                  {userData.job_title && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Job Title:
                      </span>
                      <span className="text-gray-900">
                        {userData.job_title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Start Date:
                    </span>
                    <span className="text-gray-900">
                      {userData.start_date
                        ? new Date(userData.start_date).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Last Login:
                    </span>
                    <span className="text-gray-900">
                      {userData.last_login
                        ? formatDateTime(userData.last_login)
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">2FA:</span>
                    <span className="text-gray-900">
                      {userData.two_factor_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {userData.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {userData.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest user actions and system interactions from database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading activity data...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity found for this user
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.slice(0, 6).map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.action)}`}
                      ></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {activity.action} {activity.entity_type}
                          {activity.entity_name && ` "${activity.entity_name}"`}
                        </p>
                        {activity.details && (
                          <p className="text-sm text-gray-600">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(activity.timestamp)}
                          {activity.user_name && ` • by ${activity.user_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Permissions & Actions */}
        <div className="space-y-6">
          {/* Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Access rights for {userData.role} role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPermissions.map((permission, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                Real-time activity and performance metrics from database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Loading statistics...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Total Actions
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {activityStats?.totalActions || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Actions This Month
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {activityStats?.actionsThisMonth || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Login Count
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {activityStats?.loginCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Account Age
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {getAccountAge(userData.created_at)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={resetPassword}
              >
                <Shield className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                View Full Activity Log
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <User className="w-4 h-4 mr-2" />
                Change Role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
