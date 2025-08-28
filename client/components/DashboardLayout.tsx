import React, { useState, useEffect, ReactNode } from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Settings,
  BarChart3,
  Users,
  LayoutDashboard,
  Bell,
  LogOut,
  Grid3X3,
  Target,
  FileText,
  MessageCircle,
  AlertCircle,
  Ticket,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { usePermissions, Permission } from "@/hooks/usePermissions";

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // Keep for backward compatibility
  permissions?: Permission[]; // New permission-based access
  submenu?: {
    name: string;
    href: string;
    roles: UserRole[];
    permissions?: Permission[];
  }[];
}

const navigationItems: NavigationItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "sales", "product"],
    permissions: ["leads", "vc", "product"],
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Users,
    roles: ["admin"],
    permissions: ["admin"],
  },
  {
    name: "Sales",
    href: "/leads",
    icon: Target,
    roles: ["admin", "sales", "product"],
    permissions: ["leads"],
  },
  {
    name: "VC",
    href: "/vc",
    icon: Megaphone,
    roles: ["admin", "sales", "product"],
    permissions: ["vc"],
  },
  {
    name: "Follow-ups",
    href: "/follow-ups",
    icon: MessageCircle,
    roles: ["admin", "sales", "product"],
    permissions: ["leads", "vc"],
  },
  {
    name: "FinOps",
    href: "/finops",
    icon: DollarSign,
    roles: ["admin", "finance"],
  },
  {
    name: "Product Management",
    href: "/product",
    icon: Grid3X3,
    roles: ["admin", "product"],
  },
  {
    name: "Proposals",
    href: "/proposals",
    icon: FileText,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Support Tickets",
    href: "/tickets",
    icon: Ticket,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Alerts & Notifications",
    href: "/alerts",
    icon: Bell,
    roles: ["admin", "sales", "product"],
  },
  {
    name: "Settings",
    icon: Settings,
    roles: ["admin"],
    submenu: [
      {
        name: "Manage Users",
        href: "/admin/users",
        roles: ["admin"],
      },
    ],
  },
];

interface Notification {
  id: number;
  type:
    | "follow_up_assigned"
    | "follow_up_mentioned"
    | "follow_up_overdue"
    | "finops_sla_warning"
    | "finops_overdue"
    | "ticket_assigned"
    | "lead_updated";
  title: string;
  message: string;
  entity_id: number;
  entity_type: "follow_up" | "finops_task" | "ticket" | "lead";
  created_at: string;
  read: boolean;
}

// Get real notifications based on follow-ups data
const getNotificationsFromFollowUps = async (
  userId: string,
  userName: string,
): Promise<Notification[]> => {
  try {
    console.log(
      "Fetching follow-ups for notifications, userId:",
      userId,
      "userName:",
      userName,
    );

    // Add timeout to prevent hanging requests - increased to 10 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 10000);
    });

    const followUpsPromise = apiClient
      .getAllFollowUps({
        userId,
        userRole: "all",
      })
      .catch((error) => {
        // Better error classification
        if (
          error.name === "TypeError" &&
          error.message.includes("Failed to fetch")
        ) {
          console.warn(
            "Network connectivity issue - follow-ups API unreachable:",
            error.message,
          );
        } else if (error.message.includes("timeout")) {
          console.warn(
            "Follow-ups API timeout (network or database slow):",
            error.message,
          );
        } else if (error.message.includes("Offline mode")) {
          console.warn("Follow-ups API blocked - app is in offline mode");
        } else {
          console.warn("Follow-ups API call failed:", error.message);
        }
        return []; // Return empty array as fallback
      });

    let followUps;
    try {
      followUps = await Promise.race([followUpsPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === "Request timeout") {
        console.warn(
          "Follow-ups API request timed out after 10 seconds - using empty fallback",
        );
        return [];
      }
      throw error; // Re-throw other errors
    }

    if (!Array.isArray(followUps)) {
      console.warn("Follow-ups response is not an array:", followUps);
      return [];
    }

    const notifications: Notification[] = [];
    const currentDate = new Date();

    followUps.forEach((followUp: any) => {
      // Check if user is assigned to this follow-up
      if (
        followUp.assigned_user_name === userName &&
        followUp.status === "pending"
      ) {
        notifications.push({
          id: followUp.id,
          type: "follow_up_assigned",
          title: "Follow-up Assigned",
          message: `You have been assigned: ${followUp.title}`,
          entity_id: followUp.id,
          entity_type: "follow_up",
          created_at: followUp.created_at,
          read: false,
        });
      }

      // Check if follow-up is overdue
      if (
        followUp.assigned_user_name === userName &&
        followUp.status !== "completed" &&
        followUp.due_date &&
        new Date(followUp.due_date) < currentDate
      ) {
        notifications.push({
          id: followUp.id + 1000, // Offset to avoid ID conflicts
          type: "follow_up_overdue",
          title: "Follow-up Overdue",
          message: `Overdue: ${followUp.title}`,
          entity_id: followUp.id,
          entity_type: "follow_up",
          created_at: followUp.updated_at,
          read: false,
        });
      }
    });

    return notifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<{
    [key: string]: boolean;
  }>({});

  // Auto-expand Settings menu when on settings-related pages
  useEffect(() => {
    if (location.pathname.startsWith("/admin/users")) {
      setExpandedMenus((prev) => ({ ...prev, Settings: true }));
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedNavItems = navigationItems.filter((item) => {
    // Check permissions first, fall back to roles for backward compatibility
    if (item.permissions) {
      return hasAnyPermission(item.permissions);
    }
    return item.roles.includes(user.role);
  });

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [networkIssueDetected, setNetworkIssueDetected] = React.useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch real notifications on component mount
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (user && notificationsEnabled) {
        try {
          console.log("Fetching notifications for user:", user.name);
          const realNotifications = await getNotificationsFromFollowUps(
            user.id,
            user.name,
          );
          console.log(
            "Successfully fetched",
            realNotifications.length,
            "notifications",
          );
          setNotifications(realNotifications);

          // Reset network issue flag on successful fetch
          if (networkIssueDetected) {
            console.log("Network connectivity restored");
            setNetworkIssueDetected(false);
          }
        } catch (error) {
          // Enhanced error handling for different types of failures
          const errorMsg = error?.message || "Unknown error";

          if (
            error?.name === "TypeError" &&
            errorMsg.includes("Failed to fetch")
          ) {
            if (!networkIssueDetected) {
              console.warn(
                "Network connectivity issue detected - notifications will retry later",
              );
              setNetworkIssueDetected(true);
            }
            setNotifications([]);
          } else if (errorMsg.includes("timeout")) {
            console.warn(
              "Notifications API timeout - will retry on next cycle",
            );
            // Instead of clearing notifications, keep existing ones if any
            if (notifications.length === 0) {
              setNotifications([]);
            }
          } else if (
            errorMsg.includes("HTML instead of JSON") ||
            errorMsg.includes("Server routing error")
          ) {
            console.error(
              "Backend server appears to be down or misconfigured. Disabling notifications.",
            );
            setNotificationsEnabled(false);
            setNotifications([]);
          } else {
            console.warn(
              "Failed to fetch notifications (non-critical):",
              errorMsg,
            );
            setNotifications([]);
          }
        }
      }
    };

    // Add a small delay to ensure auth context is stable
    const timeoutId = setTimeout(() => {
      // Wrap in try-catch to prevent any unhandled promise rejections
      fetchNotifications().catch((error) => {
        const errorMsg = error?.message || "Unknown error";
        if (
          error?.name === "TypeError" &&
          errorMsg.includes("Failed to fetch")
        ) {
          console.warn(
            "Initial notifications fetch failed due to network connectivity",
          );
        } else {
          console.warn("Notifications fetch failed silently:", errorMsg);
        }
        setNotifications([]);
      });
    }, 3000); // Increased delay to ensure page is fully loaded and network is stable

    // Refresh notifications every 2 minutes (less frequent to avoid network issues)
    const interval = setInterval(() => {
      // Only refresh if notifications are still enabled
      if (notificationsEnabled) {
        fetchNotifications().catch((error) => {
          const errorMsg = error?.message || "Unknown error";
          if (
            error?.name === "TypeError" &&
            errorMsg.includes("Failed to fetch")
          ) {
            console.warn(
              "Periodic notifications refresh failed due to network connectivity",
            );
          } else {
            console.warn("Notifications refresh failed silently:", errorMsg);
          }
        });
      }
    }, 120000); // Increased to 2 minutes

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [user, notificationsEnabled]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read (in a real app, this would make an API call)
    notification.read = true;

    // Navigate based on notification type
    switch (notification.entity_type) {
      case "follow_up":
        navigate(`/follow-ups?id=${notification.entity_id}`);
        break;
      case "finops_task":
        navigate(`/finops`);
        break;
      case "ticket":
        navigate(`/tickets`);
        break;
      case "lead":
        navigate(`/leads/${notification.entity_id}`);
        break;
      default:
        navigate(`/dashboard`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src="/mylapaylogo.png"
              alt="Mylapay"
              className="h-8 object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;

            // Handle expandable menu items (like Settings)
            if (item.submenu) {
              const isExpanded = expandedMenus[item.name] || false;
              const hasActiveSubmenu = item.submenu.some(
                (subItem) => location.pathname === subItem.href,
              );

              return (
                <div key={item.name}>
                  {/* Main menu item */}
                  <button
                    onClick={() =>
                      setExpandedMenus((prev) => ({
                        ...prev,
                        [item.name]: !prev[item.name],
                      }))
                    }
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Submenu items */}
                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu
                        .filter((subItem) => {
                          if (subItem.permissions) {
                            return hasAnyPermission(subItem.permissions);
                          }
                          return subItem.roles.includes(user.role);
                        })
                        .map((subItem) => {
                          const isSubActive =
                            location.pathname === subItem.href;

                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={cn(
                                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isSubActive
                                  ? "bg-primary text-white"
                                  : "text-gray-600 hover:bg-gray-100",
                              )}
                            >
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            // Handle regular menu items
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href!));

            return (
              <Link
                key={item.name}
                to={item.href!}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Notifications */}
        <div className="p-4 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full relative">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount} unread notifications
                  {networkIssueDetected && (
                    <span className="text-orange-500 ml-2">
                      (Network issue detected)
                    </span>
                  )}
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === "follow_up_assigned"
                              ? "bg-blue-100"
                              : notification.type === "follow_up_mentioned"
                                ? "bg-red-100"
                                : "bg-yellow-100"
                          }`}
                        >
                          {notification.type === "follow_up_assigned" ||
                          notification.type === "follow_up_mentioned" ? (
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                          ) : notification.type === "follow_up_overdue" ? (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          ) : notification.type === "finops_sla_warning" ||
                            notification.type === "finops_overdue" ? (
                            <DollarSign className="w-4 h-4 text-orange-600" />
                          ) : notification.type === "ticket_assigned" ? (
                            <Ticket className="w-4 h-4 text-green-600" />
                          ) : notification.type === "lead_updated" ? (
                            <Target className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Bell className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(
                              notification.created_at,
                            ).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate("/alerts")}
                  >
                    View All Notifications
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <Link to="/profile" className="block mb-3">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
