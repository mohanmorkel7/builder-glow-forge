import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { roleGroups, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Cloud,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { azureSilentAuth } from "@/lib/azure-silent-auth";

// Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="w-8 h-8 p-0"
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// User row component for better performance
const UserRow = React.memo(({ user, onView, onEdit, onDelete, onSettings }) => {
  const formatLastLogin = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return dateString;
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.first_name && user.last_name
                ? `${user.first_name[0]}${user.last_name[0]}`
                : user.first_name?.[0] || user.last_name?.[0] || "N/A"}
            </span>
          </div>
          <div>
            <div className="font-medium">
              {(user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.last_name || "Unknown") || "N/A"}
            </div>
            <div className="text-sm text-gray-500">{user.email || "N/A"}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={roleGroups[user.role as UserRole]?.color}>
          {roleGroups[user.role as UserRole]?.label}
        </Badge>
      </TableCell>
      <TableCell>{user.department || "N/A"}</TableCell>
      <TableCell>
        {user.last_login ? formatLastLogin(user.last_login) : "N/A"}
      </TableCell>
      <TableCell>
        <Badge className={getUserStatusColor(user.status)}>{user.status}</Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-500">Local</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(user.id)}
            title="View User"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(user.id)}
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onDelete(
                user.id,
                (user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || user.last_name || "Unknown") || "N/A",
              )
            }
            title="Delete User"
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

UserRow.displayName = "UserRow";

export default function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: localUsers = [], refetch: refetchUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [azureConnectionStatus, setAzureConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  // Refs for debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // ResizeObserver errors are now handled globally in main.tsx

  // Auto-inactivate users who haven't logged in for more than a week
  const processUsersForInactivity = useCallback(async (users: any[]) => {
    // Add throttling to prevent excessive processing
    const lastProcessingTime = localStorage.getItem("auto-inactivation-last-time");
    const now = Date.now();
    if (lastProcessingTime && (now - parseInt(lastProcessingTime)) < 60000) {
      // Don't process more than once per minute
      return users;
    }
    localStorage.setItem("auto-inactivation-last-time", now.toString());

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Check if we've already processed auto-inactivation today to prevent duplicates
    const today = new Date().toDateString();
    const lastProcessed = localStorage.getItem(
      "auto-inactivation-last-processed",
    );

    const usersToInactivate: number[] = [];
    const processedUsers = users.map((user) => {
      if (user.last_login && user.status === "active") {
        const lastLoginDate = new Date(user.last_login);
        if (lastLoginDate < oneWeekAgo) {
          // Only mark for API update if we haven't processed today
          if (lastProcessed !== today) {
            usersToInactivate.push(user.id);
          }
          return { ...user, status: "inactive" };
        }
      }
      return user;
    });

    // If there are users to inactivate and we haven't processed today, call the API
    if (usersToInactivate.length > 0 && lastProcessed !== today) {
      try {
        console.log(
          `Auto-inactivating ${usersToInactivate.length} users:`,
          usersToInactivate,
        );
        const response = await fetch("/api/users/bulk-inactive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: usersToInactivate }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(
            `Successfully auto-inactivated ${result.updatedCount} users`,
          );
          // Mark that we've processed auto-inactivation today
          localStorage.setItem("auto-inactivation-last-processed", today);
        } else {
          console.error(
            "Failed to auto-inactivate users:",
            await response.text(),
          );
        }
      } catch (error) {
        console.error("Error auto-inactivating users:", error);
      }
    }

    return processedUsers;
  }, []);

  // State for processed users
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Process users for inactivity when localUsers changes - debounced to prevent rapid updates
  useEffect(() => {
    if (localUsers?.length > 0) {
      // Use requestAnimationFrame to prevent ResizeObserver loops
      const processUsers = () => {
        processUsersForInactivity(localUsers).then(setAllUsers);
      };

      const rafId = requestAnimationFrame(processUsers);
      return () => cancelAnimationFrame(rafId);
    } else {
      setAllUsers([]);
    }
  }, [localUsers, processUsersForInactivity]);

  // Test Azure connection on component mount and handle page refresh
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check if returning from authentication
        const token = await azureSilentAuth.handleAuthReturn();
        if (token) {
          setAzureConnectionStatus("connected");
          return;
        }

        // Check if already authenticated
        const isAuth = await azureSilentAuth.isAuthenticated();
        if (isAuth) {
          setAzureConnectionStatus("connected");
        } else {
          // Don't immediately show disconnected, just stay in unknown state
          setAzureConnectionStatus("unknown");
        }
      } catch (error) {
        console.log("Azure connection test failed:", error);
        // Only show disconnected if there's an actual error
        setAzureConnectionStatus("disconnected");
      }
    };

    // Check if we should refresh data after returning from role assignment
    const shouldRefresh = sessionStorage.getItem("refreshUserManagement");
    if (shouldRefresh) {
      sessionStorage.removeItem("refreshUserManagement");
      // Use debounced refresh to prevent ResizeObserver loops
      debouncedRefresh();
    }

    testConnection();
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      isRefreshingRef.current = false;
    };
  }, []);

  // Debounced refresh function to prevent rapid re-renders
  const debouncedRefresh = useCallback(() => {
    if (isRefreshingRef.current) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) return;

      isRefreshingRef.current = true;
      try {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        await refetchUsers();
      } catch (error) {
        console.warn('Refresh failed:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, 300); // 300ms debounce
  }, [queryClient, refetchUsers]);

  // Listen for navigation back from role assignment page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const returnFlag = sessionStorage.getItem("returnToUserManagement");
        if (returnFlag) {
          sessionStorage.removeItem("returnToUserManagement");
          // Use debounced refresh to prevent ResizeObserver loops
          debouncedRefresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [debouncedRefresh]);

  // Memoized filtered users for better performance - with stable references
  const filteredUsers = useMemo(() => {
    if (!allUsers.length) return [];

    return allUsers.filter((user) => {
      const matchesSearch =
        (user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.last_name || "Unknown"
        )
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesDepartment =
        selectedDepartment === "all" || user.department === selectedDepartment;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [allUsers, searchTerm, selectedRole, selectedDepartment]);

  // Memoized inactive users
  const inactiveUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesSearch =
        (user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.last_name || "Unknown"
        )
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;

      return user.status === "inactive" && matchesSearch;
    });
  }, [allUsers, searchTerm]);

  // Memoized pagination with stable calculations
  const paginationData = useMemo(() => {
    if (!filteredUsers.length) {
      return { paginatedUsers: [], totalPages: 0 };
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    return { paginatedUsers, totalPages };
  }, [filteredUsers, currentPage, itemsPerPage]);

  const { paginatedUsers, totalPages } = paginationData;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedDepartment]);

  // Group users by role (use allUsers for role view, not filteredUsers)
  const usersByRole = useMemo(() => {
    return Object.keys(roleGroups).reduce(
      (acc, role) => {
        if (role === "unknown") {
          // Map users with null, undefined, empty, "N/A", or explicit "unknown" roles to unknown
          acc[role as UserRole] = allUsers.filter(
            (user) =>
              !user.role ||
              user.role === "" ||
              user.role === "N/A" ||
              user.role === "null" ||
              user.role === "unknown",
          );
        } else {
          acc[role as UserRole] = allUsers.filter((user) => user.role === role);
        }
        return acc;
      },
      {} as Record<UserRole, typeof allUsers>,
    );
  }, [allUsers]);

  const handleTestAzureConnection = async () => {
    try {
      setAzureConnectionStatus("unknown");

      console.log("🔍 Testing Azure AD connection...");

      await azureSilentAuth.testGraphConnection();
      setAzureConnectionStatus("connected");

      console.log("✅ Azure AD connection test successful!");
    } catch (error) {
      setAzureConnectionStatus("disconnected");

      if (error.message.includes("Redirecting to Azure AD")) {
        console.log("🔐 Redirecting to Azure AD for authentication...");
        return;
      }

      console.error("�� Azure AD connection test failed:", error.message);
    }
  };

  const handleAddUser = () => {
    navigate("/admin/users/add");
  };

  const handleSyncAzure = async () => {
    try {
      console.log("🚀 Starting Azure AD sync...");

      // Show loading state
      const syncButton = document.querySelector(
        "[data-sync-azure]",
      ) as HTMLButtonElement;
      if (syncButton) {
        syncButton.disabled = true;
        syncButton.textContent = "Syncing...";
      }

      // Perform sync using silent authentication service
      const result = await azureSilentAuth.syncUsersFromAzure();

      if (result.success) {
        const message = `✅ Azure AD sync completed successfully!\n\nStats:\n- Total users: ${result.stats.total}\n- New users: ${result.stats.inserted}\n- Updated users: ${result.stats.updated}\n- Skipped users: ${result.stats.skipped}\n\nJSON file saved: ${result.jsonFile}`;

        console.log(message);

        // Refresh user data
        window.location.reload();
      } else {
        throw new Error(result.message || "Azure AD sync failed");
      }
    } catch (error) {
      console.error("❌ Azure AD sync error:", error);

      // Don't show error for redirect flow initiation
      if (error.message.includes("Redirecting to Azure AD")) {
        console.log("🔄 Redirecting to Azure AD for authentication...");
        return;
      }

      let errorMessage = "❌ Azure AD sync failed";
      if (error.message.includes("consent")) {
        errorMessage =
          "🔒 Admin consent required. Please ask your Azure AD administrator to grant consent for User.Read.All and Directory.Read.All permissions.";
      } else if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        errorMessage =
          "🚫 Access denied. You don't have sufficient permissions to read Azure AD users.";
      } else if (error.message.includes("Authentication in progress")) {
        errorMessage = "🔄 Authentication in progress. Please wait...";
      } else {
        errorMessage = `❌ Sync failed: ${error.message}`;
      }

      console.error(errorMessage);
    } finally {
      // Reset button state
      const syncButton = document.querySelector(
        "[data-sync-azure]",
      ) as HTMLButtonElement;
      if (syncButton) {
        syncButton.disabled = false;
        syncButton.innerHTML =
          '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.4 4.4 0 003 15z"></path></svg>Sync Azure AD';
      }
    }
  };

  const handleExportUsers = () => {
    // Export users to CSV
    const csv = [
      "Name,Email,Role,Department,Last Login,Status",
      ...filteredUsers.map((user) => {
        const fullName =
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.first_name || user.last_name || "Unknown";

        return `"${fullName || "N/A"}","${user.email || "N/A"}","${user.role || "N/A"}","${user.department || "N/A"}","${user.last_login || "N/A"}","${user.status || "N/A"}"`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
  };

  const handleViewUser = useCallback(
    (userId: string) => {
      // Navigate to user details page
      navigate(`/admin/users/${userId}`);
    },
    [navigate],
  );

  const handleEditUser = useCallback(
    (userId: string) => {
      // Navigate to user edit page
      navigate(`/admin/users/${userId}/edit`);
    },
    [navigate],
  );

  const handleDeleteUser = useCallback((userId: string, userName: string) => {
    // Show confirmation dialog
    if (
      window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      // In real implementation, this would call the delete API
      console.log(`Deleting user ${userId}`);
      // Show success toast
      alert(`User "${userName}" has been scheduled for deletion.`);
    }
  }, []);

  const handleUserSettings = useCallback(
    (userId: string) => {
      // Navigate to user settings/permissions page
      navigate(`/admin/users/${userId}/settings`);
    },
    [navigate],
  );

  const handleManualRefresh = useCallback(() => {
    // Use debounced refresh to prevent ResizeObserver loops
    debouncedRefresh();
  }, [debouncedRefresh]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and roles</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Azure Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-50 text-sm">
            {azureConnectionStatus === "connected" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Azure AD Ready</span>
              </>
            )}
            {azureConnectionStatus === "disconnected" && (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700">Azure AD Setup Needed</span>
              </>
            )}
            {azureConnectionStatus === "unknown" && (
              <>
                <Cloud className="w-4 h-4 text-blue-500" />
                <span className="text-blue-700">Azure AD Available</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              // Set a flag to refresh data when we return
              sessionStorage.setItem("returnToUserManagement", "true");
              navigate("/admin/users/azure-role-assignment");
            }}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Assign Roles
          </Button>
          <Button variant="outline" onClick={handleManualRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {allUsers.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {allUsers.filter((u) => u.status === "active").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Departments
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(allUsers.map((u) => u.department)).size}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {allUsers.filter((u) => u.status === "inactive").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(roleGroups).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(allUsers.map((u) => u.department))).map(
                    (dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Views */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">All Users</TabsTrigger>
          <TabsTrigger value="roles">By Role Groups</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
        </TabsList>

        {/* All Users List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Complete list of all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onView={handleViewUser}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                      onSettings={handleUserSettings}
                    />
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Role Groups */}
        <TabsContent value="roles">
          <div className="grid gap-6">
            {Object.entries(usersByRole).map(([role, users]) => (
              <Card key={role}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={roleGroups[role as UserRole]?.color}>
                        {roleGroups[role as UserRole]?.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {users.length} users
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Permissions:{" "}
                      {roleGroups[role as UserRole]?.permissions.join(", ")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewUser(user.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.first_name && user.last_name
                                ? `${user.first_name[0]}${user.last_name[0]}`
                                : user.first_name?.[0] ||
                                  user.last_name?.[0] ||
                                  "N/A"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {(user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name ||
                                  user.last_name ||
                                  "Unknown") || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.department || "N/A"}
                            </div>
                          </div>
                          {user.azureObjectId && (
                            <Cloud className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inactive Users Tab */}
        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Inactive Users ({inactiveUsers.length})</span>
              </CardTitle>
              <CardDescription>
                Users who have been inactive for more than a week or manually
                set to inactive status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inactiveUsers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No inactive users found
                  </p>
                  <p className="text-gray-400 text-sm">
                    All users are currently active
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Inactive Since</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveUsers.map((user) => (
                      <TableRow key={user.id} className="opacity-75">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.first_name && user.last_name
                                  ? `${user.first_name[0]}${user.last_name[0]}`
                                  : user.first_name?.[0] ||
                                    user.last_name?.[0] ||
                                    "N/A"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700">
                                {(user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name ||
                                    user.last_name ||
                                    "Unknown") || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${roleGroups[user.role as UserRole]?.color} opacity-75`}
                          >
                            {roleGroups[user.role as UserRole]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {user.department || "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {user.last_login ? user.last_login : "Never"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-red-600">
                            {user.last_login
                              ? `${Math.ceil((new Date().getTime() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                              : "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user.id)}
                              title="View User"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user.id)}
                              title="Reactivate User"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
