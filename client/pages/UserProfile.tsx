import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Phone,
  Building,
  Clock,
  Activity,
  Cloud,
  Key,
  BarChart3,
  TrendingUp,
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
}

interface ActivityStats {
  totalActions: number;
  actionsThisMonth: number;
  lastLoginDate: string;
  accountCreatedDate: string;
  loginCount: number;
}

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  azure_object_id?: string;
  sso_provider?: string;
  job_title?: string;
  last_login?: string;
  created_at: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch user details and activity data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch detailed user info from database
        const userResponse = await apiClient.request(`/users/${user.id}`, {
          method: "GET",
        });
        setUserDetails(userResponse);

        // Fetch recent activity logs
        const activityResponse = await apiClient.request(
          "/activity-production",
          {
            method: "GET",
            params: new URLSearchParams({
              limit: "10",
              user_id: user.id.toString(),
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
              user_id: user.id.toString(),
            }),
          },
        );

        if (statsResponse) {
          setActivityStats({
            totalActions: statsResponse.total_count || 0,
            actionsThisMonth: statsResponse.recent_count || 0,
            lastLoginDate: userResponse?.last_login || new Date().toISOString(),
            accountCreatedDate:
              userResponse?.created_at || new Date().toISOString(),
            loginCount: statsResponse.total_count || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Set fallback data if API fails
        setActivityStats({
          totalActions: 0,
          actionsThisMonth: 0,
          lastLoginDate: new Date().toISOString(),
          accountCreatedDate: new Date().toISOString(),
          loginCount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError("New password is required");
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return false;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleSubmitPasswordChange = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setPasswordError("");

    try {
      await apiClient.request(`/users/${user.id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      setPasswordError(
        error.message || "Failed to change password. Please try again.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setChangePasswordOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile and account settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${statusColors[userDetails?.status as keyof typeof statusColors] || "bg-green-100 text-green-700"}`}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            {userDetails?.status || "Active"}
          </Badge>
        </div>
      </div>

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
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      className={
                        roleColors[user.role as keyof typeof roleColors] ||
                        "bg-gray-100 text-gray-700"
                      }
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <Badge
                      className={
                        statusColors[
                          userDetails?.status as keyof typeof statusColors
                        ] || "bg-green-100 text-green-700"
                      }
                    >
                      {userDetails?.status || "Active"}
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
                      href={`mailto:${user.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {user.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">User ID:</span>
                    <span className="text-gray-900">#{user.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Role:</span>
                    <span className="text-gray-900 capitalize">
                      {user.role}
                    </span>
                  </div>
                  {user.department && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Department:
                      </span>
                      <span className="text-gray-900 capitalize">
                        {user.department}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Member Since:
                    </span>
                    <span className="text-gray-900">
                      {formatDate(
                        userDetails?.created_at || new Date().toISOString(),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Last Login:
                    </span>
                    <span className="text-gray-900">
                      {formatDateTime(
                        userDetails?.last_login || new Date().toISOString(),
                      )}
                    </span>
                  </div>

                  {userDetails?.job_title && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Job Title:
                      </span>
                      <span className="text-gray-900">
                        {userDetails.job_title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions and system interactions from database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading activity...
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No recent activity found
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.slice(0, 5).map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-start space-x-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.action)}`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action} {activity.entity_type}
                          {activity.entity_name && ` "${activity.entity_name}"`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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

        {/* Right Column - Security Settings */}
        <div className="space-y-6">
          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    {passwordSuccess && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "currentPassword",
                              e.target.value,
                            )
                          }
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility("current")}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            handlePasswordChange("newPassword", e.target.value)
                          }
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility("new")}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "confirmPassword",
                              e.target.value,
                            )
                          }
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility("confirm")}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={handleClosePasswordDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitPasswordChange}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="text-xs text-gray-500">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>At least 6 characters long</li>
                  <li>Different from current password</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Activity Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>
                Your account usage and activity metrics from database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading stats...
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
                      {getAccountAge(
                        userDetails?.created_at || new Date().toISOString(),
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
