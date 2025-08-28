import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useUpdateUser } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Building,
  Info,
  AlertTriangle,
} from "lucide-react";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = parseInt(id || "0");
  const { data: originalUser, isLoading, error } = useUser(userId);
  const updateUserMutation = useUpdateUser();

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "sales",
    status: "active",
    department: "",
    start_date: "",
    notes: "",
    two_factor_enabled: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Change password state
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changePasswordError, setChangePasswordError] = useState<string | null>(
    null,
  );
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [roleAutoUpdated, setRoleAutoUpdated] = useState(false);

  // Update state when user data is loaded
  React.useEffect(() => {
    if (originalUser) {
      const department = originalUser.department || "";
      const role = department
        ? getDepartmentRole(department)
        : originalUser.role || "sales";

      setUser({
        first_name: originalUser.first_name || "",
        last_name: originalUser.last_name || "",
        email: originalUser.email || "",
        phone: originalUser.phone || "",
        role: role,
        status: originalUser.status || "active",
        department: department,
        start_date: originalUser.start_date || "",
        notes: originalUser.notes || "",
        two_factor_enabled: originalUser.two_factor_enabled || false,
      });
    }
  }, [originalUser]);

  // Map departments to appropriate user roles
  const getDepartmentRole = (department: string): string => {
    const departmentRoleMap: { [key: string]: string } = {
      administration: "admin",
      sales: "sales",
      hr: "hr_management",
      finance: "finance",
      finops: "finops",
      database: "db",
      frontend: "development",
      backend: "development",
      infra: "infra",
      switch_team: "switch_team",
    };

    return departmentRoleMap[department] || "development";
  };

  const updateField = (field: string, value: any) => {
    setUser((prev) => {
      const updatedUser = {
        ...prev,
        [field]: value,
      };

      // Auto-update role when department changes
      if (field === "department" && value) {
        updatedUser.role = getDepartmentRole(value);
        setRoleAutoUpdated(true);

        // Clear the indicator after 3 seconds
        setTimeout(() => {
          setRoleAutoUpdated(false);
        }, 3000);
      }

      return updatedUser;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        userData: user,
      });
      setHasChanges(false);
      navigate(`/admin/users/${id}`);
    } catch (error) {
      console.error("Failed to save user:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save user. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    setResetError(null);
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
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

  const changePassword = async () => {
    setChangePasswordError(null);

    if (
      !changePasswordData.oldPassword ||
      !changePasswordData.newPassword ||
      !changePasswordData.confirmPassword
    ) {
      setChangePasswordError("All fields are required");
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError("New password and confirm password do not match");
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters long");
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: changePasswordData.oldPassword,
          newPassword: changePasswordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      alert("Password changed successfully!");
      setChangePasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      setChangePasswordError(
        error instanceof Error
          ? error.message
          : "Failed to change password. Please try again.",
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const toggleTwoFactor = () => {
    updateField("two_factor_enabled", !user.two_factor_enabled);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading user details...</div>
      </div>
    );
  }

  if (error || !originalUser) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading user details
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/users/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">
              {user.first_name} {user.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* User Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-primary text-white">
                {user.first_name[0]}
                {user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-700"
                      : user.role === "sales"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-700"
                      : user.status === "inactive"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alerts */}
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {resetError && (
        <Alert variant="destructive">
          <AlertDescription>{resetError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic user profile information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={user.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={user.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={user.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={user.department}
                    onValueChange={(value) => updateField("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administration">
                        Administration
                      </SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="finops">
                        Financial Operations
                      </SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="frontend">
                        Frontend Development
                      </SelectItem>
                      <SelectItem value="backend">
                        Backend Development
                      </SelectItem>
                      <SelectItem value="infra">Infrastructure</SelectItem>
                      <SelectItem value="switch_team">Switch Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    User's organizational department (automatically sets role:{" "}
                    {user.department
                      ? getDepartmentRole(user.department)
                      : "Select department"}
                    )
                  </p>
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="start_date"
                      type="date"
                      value={user.start_date}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={user.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  placeholder="Additional notes about the user..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage user role, status, and account permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">
                    User Role
                    <span className="text-xs text-blue-600 ml-2">
                      (Auto-assigned)
                    </span>
                    {roleAutoUpdated && (
                      <span className="text-xs text-green-600 ml-2 animate-pulse">
                        ✓ Updated
                      </span>
                    )}
                  </Label>
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateField("role", value)}
                    disabled={true}
                  >
                    <SelectTrigger className="bg-blue-50 border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="sales">Sales Team</SelectItem>
                      <SelectItem value="product">Product Team</SelectItem>
                      <SelectItem value="development">
                        Development Team
                      </SelectItem>
                      <SelectItem value="db">Database Administrator</SelectItem>
                      <SelectItem value="finops">FinOps Team</SelectItem>
                      <SelectItem value="finance">Finance Team</SelectItem>
                      <SelectItem value="hr_management">
                        HR Management
                      </SelectItem>
                      <SelectItem value="infra">Infrastructure Team</SelectItem>
                      <SelectItem value="switch_team">Switch Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-blue-600 mt-1">
                    Role is automatically assigned based on department selection
                    {roleAutoUpdated && " • Just updated!"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">Account Status</Label>
                  <Select
                    value={user.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Controls whether the user can log in and access the system
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Department-Based Role:</strong> User roles are
                  automatically assigned based on their department.
                  {user.role === "admin" &&
                    " Admin users have full system access."}
                  {user.role === "sales" &&
                    " Sales users can manage clients and follow-ups."}
                  {user.role === "product" &&
                    " Product users can manage deployments and releases."}
                  {user.role === "development" &&
                    " Development users can access development features and code management."}
                  {user.role === "db" &&
                    " Database administrators can manage database operations and access."}
                  {user.role === "finops" &&
                    " FinOps users can manage financial operations and cost optimization."}
                  {user.role === "finance" &&
                    " Finance users can handle accounting, billing, and financial reporting."}
                  {user.role === "hr_management" &&
                    " HR Management users can manage employee records and HR processes."}
                  {user.role === "infra" &&
                    " Infrastructure users can manage servers, deployments, and system infrastructure."}
                  {user.role === "switch_team" &&
                    " Switch team members have specialized access for team transitions."}
                  {user.department &&
                    ` Current mapping: ${user.department.charAt(0).toUpperCase() + user.department.slice(1)} → ${user.role}`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage password and security options for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to this account
                    </p>
                  </div>
                  <Switch
                    checked={user.two_factor_enabled}
                    onCheckedChange={toggleTwoFactor}
                  />
                </div>

                {user.two_factor_enabled && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Two-Factor Authentication Enabled:</strong> This
                      user will need to provide a second verification factor
                      (SMS, app, or email) when logging in.
                    </AlertDescription>
                  </Alert>
                )}

                {!user.two_factor_enabled && (
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Enable Two-Factor Authentication:</strong>{" "}
                      Recommended for improved account security, especially for
                      users with administrative privileges.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Change Password</h4>
                {originalUser?.sso_provider ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>SSO User:</strong> This user authenticates via{" "}
                      {originalUser.sso_provider === "microsoft"
                        ? "Microsoft SSO"
                        : originalUser.sso_provider.toUpperCase()}
                      . Password changes should be managed through the SSO
                      provider's system.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm text-gray-600">
                    Change the user's password by providing the current password
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={changePasswordData.oldPassword}
                      onChange={(e) =>
                        setChangePasswordData((prev) => ({
                          ...prev,
                          oldPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                      className="mt-1"
                      disabled={!!originalUser?.sso_provider}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={changePasswordData.newPassword}
                      onChange={(e) =>
                        setChangePasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      className="mt-1"
                      disabled={!!originalUser?.sso_provider}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={changePasswordData.confirmPassword}
                      onChange={(e) =>
                        setChangePasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      className="mt-1"
                      disabled={!!originalUser?.sso_provider}
                    />
                  </div>
                </div>

                {changePasswordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{changePasswordError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={changePassword}
                  disabled={
                    changePasswordLoading || !!originalUser?.sso_provider
                  }
                  className="w-full"
                >
                  {changePasswordLoading ? "Changing..." : "Change Password"}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Admin Reset Password</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Reset the user's password and send them new login instructions
                </p>
                <Button variant="outline" onClick={resetPassword}>
                  <Shield className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> Any changes to security
                  settings will be logged and may require the user to
                  re-authenticate.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
