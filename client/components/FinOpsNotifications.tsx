import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  User,
  Calendar,
  MessageSquare,
  Filter,
  RefreshCw,
  ExternalLink,
  Trash2,
  UserX,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

interface FinOpsNotification {
  id: string;
  type:
    | "sla_warning"
    | "sla_overdue"
    | "task_delayed"
    | "task_completed"
    | "task_pending"
    | "daily_reminder"
    | "escalation";
  title: string;
  message: string;
  task_name: string;
  client_name?: string;
  subtask_name?: string;
  assigned_to: string;
  reporting_managers: string[];
  escalation_managers?: string[];
  priority: "low" | "medium" | "high" | "critical";
  status: "unread" | "read" | "archived";
  created_at: string;
  action_required: boolean;
  delay_reason?: string;
  sla_remaining?: string;
  overdue_minutes?: number;
  members_list?: string[];
}

// Mock notifications data
// Transform database notifications to match our interface
const transformDbNotifications = (
  dbNotifications: any[],
  currentTime?: Date,
): FinOpsNotification[] => {
  console.log("🔄 Transform input:", dbNotifications.slice(0, 2)); // Log first 2 items for debugging

  return dbNotifications.map((dbNotif) => {
    // Initialize all variables at the beginning to avoid reference errors
    let realTimeDetails = dbNotif.details;
    let realTimeTitle = dbNotif.details;
    let realTimeSlaRemaining = undefined;
    let isExpiredSLA = false;
    let overdueMinutesFromSLA = 0;

    // Extract overdue minutes from details if present and calculate real-time overdue
    const overdueMatch =
      dbNotif.details?.match(/overdue by (\d+) min/i) ||
      dbNotif.details?.match(/overdue by (\d+) minutes?/i);
    let overdueMinutes = overdueMatch ? parseInt(overdueMatch[1]) : undefined;

    // For existing overdue notifications, calculate current overdue time
    if (
      overdueMinutes &&
      currentTime &&
      dbNotif.created_at &&
      dbNotif.action === "overdue_notification_sent"
    ) {
      const notificationTime = new Date(dbNotif.created_at);
      const timeSinceNotificationMs =
        currentTime.getTime() - notificationTime.getTime();
      const minutesSinceNotification = Math.floor(
        timeSinceNotificationMs / 60000,
      );

      // Current overdue minutes = original overdue + time passed since notification
      const currentOverdueMinutes = overdueMinutes + minutesSinceNotification;
      const totalTimeAgo = Math.floor(timeSinceNotificationMs / 60000) + 2; // Add base overdue time

      // Update details with current overdue time
      realTimeDetails = dbNotif.details.replace(
        /overdue by (\d+) min • (\d+) min ago/i,
        `Overdue by ${currentOverdueMinutes} min • ${totalTimeAgo} min ago`,
      );
      realTimeTitle = `SLA Overdue - ${currentOverdueMinutes} min overdue`;

      overdueMinutes = currentOverdueMinutes;

      console.log(
        `🚨 Real-time overdue calculation: Originally ${overdueMatch[1]} min → Now ${currentOverdueMinutes} min overdue (${minutesSinceNotification} min since notification)`,
      );
    }

    // Extract start time if present
    const startTimeMatch = dbNotif.details?.match(/Start: (\d+:\d+ [AP]M)/i);
    const startTime = startTimeMatch ? startTimeMatch[1] : undefined;

    // Calculate real-time remaining minutes for SLA warnings with improved precision

    if (
      currentTime &&
      dbNotif.details?.includes("SLA Warning - ") &&
      dbNotif.details?.includes("min remaining")
    ) {
      const originalMinMatch = dbNotif.details.match(/(\d+) min remaining/);
      if (originalMinMatch && dbNotif.created_at) {
        const originalMinutes = parseInt(originalMinMatch[1]);
        const notificationTime = new Date(dbNotif.created_at);

        // More precise calculation with seconds consideration
        const timeDiffMs = currentTime.getTime() - notificationTime.getTime();
        const minutesPassed = Math.floor(timeDiffMs / 60000);
        const secondsPassed = Math.floor((timeDiffMs % 60000) / 1000);

        // Calculate current remaining minutes with better rounding
        const exactRemainingMinutes = originalMinutes - timeDiffMs / 60000;
        const currentRemainingMinutes = Math.max(
          0,
          Math.ceil(exactRemainingMinutes),
        );

        // Check if SLA has expired
        if (exactRemainingMinutes <= 0) {
          isExpiredSLA = true;
          overdueMinutesFromSLA = Math.floor(Math.abs(exactRemainingMinutes));

          // Convert to overdue notification
          realTimeDetails = `Overdue by ${overdueMinutesFromSLA} min • ${Math.floor(timeDiffMs / 60000)} min ago`;
          realTimeTitle = `SLA Overdue - ${overdueMinutesFromSLA} min overdue`;
          realTimeSlaRemaining = `Overdue by ${overdueMinutesFromSLA} min`;

          console.log(
            `🚨 SLA EXPIRED: ${originalMinutes} min → OVERDUE by ${overdueMinutesFromSLA} min (${minutesPassed}:${secondsPassed.toString().padStart(2, "0")} elapsed)`,
          );
        } else {
          // Still within SLA - preserve any text after "min remaining" like "• need to start"
          realTimeDetails = dbNotif.details.replace(
            /(\d+) min remaining(.*)$/,
            `${currentRemainingMinutes} min remaining$2`,
          );
          realTimeTitle = realTimeDetails;
          realTimeSlaRemaining = `${currentRemainingMinutes} min remaining`;

          console.log(
            `🕒 Real-time SLA calculation (precise): ${originalMinutes} min → ${currentRemainingMinutes} min (${minutesPassed}:${secondsPassed.toString().padStart(2, "0")} elapsed, exact: ${exactRemainingMinutes.toFixed(2)})`,
          );
        }
      }
    }

    // Determine notification type based on action and details (with real-time SLA expiry check)
    let notificationType = "daily_reminder";
    if (isExpiredSLA) {
      // SLA warning has expired, convert to overdue
      notificationType = "sla_overdue";
    } else if (
      dbNotif.action === "overdue_notification_sent" ||
      dbNotif.details?.toLowerCase().includes("overdue") ||
      (dbNotif.action === "task_status_changed" &&
        dbNotif.details?.toLowerCase().includes("overdue"))
    ) {
      notificationType = "sla_overdue";
    } else if (
      dbNotif.action === "sla_alert" ||
      dbNotif.action === "sla_warning" ||
      dbNotif.details?.includes("starting in") ||
      dbNotif.details?.includes("sla warning") ||
      dbNotif.details?.includes("min remaining")
    ) {
      notificationType = "sla_warning";
    } else if (dbNotif.action === "escalation_required") {
      notificationType = "escalation";
    } else if (
      (dbNotif.details?.toLowerCase().includes("pending") &&
        dbNotif.details?.toLowerCase().includes("need to start")) ||
      dbNotif.details?.toLowerCase().includes("pending status")
    ) {
      notificationType = "task_pending";
    }

    // Mock member data based on task type
    const getMembersForTask = (taskId: number, type: string) => {
      const taskMembers = {
        1: {
          // CLEARING - FILE TRANSFER AND VALIDATION
          assigned_to: "John Durairaj",
          reporting_managers: ["Albert Kumar", "Hari Prasad"],
          escalation_managers: ["Sarah Wilson", "Mike Johnson"],
          members_list: [
            "John Durairaj",
            "Albert Kumar",
            "Hari Prasad",
            "Sarah Wilson",
            "Mike Johnson",
          ],
        },
        2: {
          assigned_to: "Maria Garcia",
          reporting_managers: ["Robert Chen"],
          escalation_managers: ["David Lee"],
          members_list: ["Maria Garcia", "Robert Chen", "David Lee"],
        },
        3: {
          assigned_to: "Alex Thompson",
          reporting_managers: ["Jennifer Smith", "Mark Davis"],
          escalation_managers: ["Lisa Brown"],
          members_list: [
            "Alex Thompson",
            "Jennifer Smith",
            "Mark Davis",
            "Lisa Brown",
          ],
        },
        4: {
          assigned_to: "Test User",
          reporting_managers: ["Manager One", "Manager Two"],
          escalation_managers: ["Escalation Manager"],
          members_list: [
            "Test User",
            "Manager One",
            "Manager Two",
            "Escalation Manager",
          ],
        },
        5: {
          // RECONCILIATION - DAILY SETTLEMENT PROCESS
          assigned_to: "Maria Garcia",
          reporting_managers: ["Robert Chen"],
          escalation_managers: ["Sarah Wilson"],
          members_list: ["Maria Garcia", "Robert Chen", "Sarah Wilson"],
        },
        6: {
          // RECONCILIATION - DAILY SETTLEMENT PROCESS (Enterprise Banking)
          assigned_to: "Maria Garcia",
          reporting_managers: ["Robert Chen"],
          escalation_managers: ["Sarah Wilson"],
          members_list: ["Maria Garcia", "Robert Chen", "Sarah Wilson"],
        },
        16: {
          // Check task (PaySwiff)
          assigned_to: "Sanjay Kumar",
          reporting_managers: ["Sarumathi Manickam", "Vishnu Vardhan"],
          escalation_managers: ["Harini NL", "Vishal S"],
          members_list: [
            "Sanjay Kumar",
            "Mugundhan Selvam",
            "Sarumathi Manickam",
            "Vishnu Vardhan",
            "Harini NL",
            "Vishal S",
          ],
        },
      };
      return (
        taskMembers[taskId] || {
          assigned_to: "Unassigned",
          reporting_managers: [],
          escalation_managers: [],
          members_list: [],
        }
      );
    };

    const members = getMembersForTask(dbNotif.task_id, notificationType);

    const transformed = {
      id: dbNotif.id.toString(),
      type: notificationType,
      title:
        realTimeTitle && realTimeTitle !== dbNotif.details
          ? realTimeTitle
          : realTimeDetails?.includes("FinOps: sla warning")
            ? realTimeDetails
            : realTimeDetails?.includes("SLA Warning - ") &&
                realTimeDetails?.includes("min remaining")
              ? realTimeDetails
              : realTimeDetails?.includes("Overdue by")
                ? realTimeTitle || `SLA Overdue - ${overdueMinutes} min overdue`
                : realTimeDetails?.includes("Subtasks (0/1 completed)")
                  ? realTimeDetails.split("Start:")[0].trim()
                  : realTimeDetails?.includes(
                        "CLEARING - FILE TRANSFER AND VALIDATION",
                      )
                    ? "CLEARING - FILE TRANSFER AND VALIDATION"
                    : startTime
                      ? `Task (Start: ${startTime})`
                      : dbNotif.action
                        ? `FinOps: ${dbNotif.action.replace(/_/g, " ")}`
                        : "FinOps Notification",
      message: realTimeDetails || "",
      task_name:
        dbNotif.task_name ||
        (dbNotif.task_id === 5 || dbNotif.task_id === 6
          ? "RECONCILIATION - DAILY SETTLEMENT PROCESS"
          : dbNotif.task_id === 16
            ? "Check"
            : startTime
              ? `Task scheduled for ${startTime}`
              : "CLEARING - FILE TRANSFER AND VALIDATION"),
      client_name:
        dbNotif.client_name ||
        (dbNotif.task_id === 6
          ? "Enterprise Banking Solutions"
          : dbNotif.task_id === 16
            ? "PaySwiff"
            : "ABC Corporation"),
      subtask_name: dbNotif.subtask_name,
      assigned_to: members.assigned_to,
      reporting_managers: members.reporting_managers,
      escalation_managers: members.escalation_managers,
      priority:
        overdueMinutes || isExpiredSLA
          ? "critical"
          : dbNotif.priority || "medium",
      status: dbNotif.read ? "read" : "unread",
      created_at: dbNotif.created_at,
      action_required:
        notificationType === "sla_overdue" ||
        notificationType === "escalation" ||
        isExpiredSLA ||
        (notificationType === "sla_warning" &&
          (dbNotif.details?.includes("min remaining") ||
            dbNotif.details?.includes("need to start"))),
      delay_reason:
        dbNotif.action === "delay_reported" ? "Process delayed" : undefined,
      sla_remaining:
        realTimeSlaRemaining ||
        (overdueMinutes ? `Overdue by ${overdueMinutes} min` : undefined),
      overdue_minutes: overdueMinutes,
      members_list: members.members_list,
    };

    console.log("🔄 Transformed notification:", transformed);
    return transformed;
  });
};

// Type and priority mapping functions removed since API already returns correct format

const mockNotifications: FinOpsNotification[] = [
  {
    id: "1",
    type: "sla_overdue",
    title: "SLA Overdue Alert",
    message: "MASTER AND VISA FILE VALIDATION subtask is overdue by 2 hours",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "MASTER AND VISA FILE VALIDATION",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "critical",
    status: "unread",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action_required: true,
    sla_remaining: "-2 hours",
  },
  {
    id: "2",
    type: "sla_warning",
    title: "SLA Warning - 15 Minutes Remaining",
    message:
      "VISA - VALIDATION OF THE BASE 2 FILE will breach SLA in 15 minutes",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "VISA - VALIDATION OF THE BASE 2 FILE",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "high",
    status: "unread",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    action_required: true,
    sla_remaining: "15 minutes",
  },
  {
    id: "3",
    type: "task_delayed",
    title: "Task Marked as Delayed",
    message:
      "SHARING OF THE FILE TO M2P has been marked as delayed due to external dependency",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name: "SHARING OF THE FILE TO M2P",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "medium",
    status: "read",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    action_required: false,
    delay_reason: "External Dependency",
  },
  {
    id: "4",
    type: "task_completed",
    title: "Task Completed Successfully",
    message:
      "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) has been completed on time",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    subtask_name:
      "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) VS DAILY STATUS FILE COUNT",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "low",
    status: "read",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    action_required: false,
  },
  {
    id: "5",
    type: "daily_reminder",
    title: "Daily Process Starting Soon",
    message:
      "Daily clearing process will start in 30 minutes. Please ensure all prerequisites are met.",
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    client_name: "ABC Corporation",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    priority: "medium",
    status: "unread",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    action_required: true,
  },
  {
    id: "6",
    type: "escalation",
    title: "Escalation Required",
    message:
      "Multiple subtasks are overdue. Escalation managers have been notified.",
    task_name: "DATA RECONCILIATION PROCESS",
    client_name: "XYZ Industries",
    assigned_to: "Sarah Wilson",
    reporting_managers: ["Albert", "Hari"],
    priority: "critical",
    status: "unread",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    action_required: true,
  },
  {
    id: "7",
    type: "sla_warning",
    title: "SLA Warning - Client Meeting",
    message: "Prepare client presentation materials - SLA expires in 1 hour",
    task_name: "CLIENT REPORTING AND PRESENTATION",
    client_name: "LMN Enterprises",
    assigned_to: "Mike Johnson",
    reporting_managers: ["Jennifer", "Robert"],
    priority: "high",
    status: "read",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action_required: true,
    sla_remaining: "1 hour",
  },
];

export default function FinOpsNotifications() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [overdueReasonDialog, setOverdueReasonDialog] = useState<{
    open: boolean;
    notificationId: string;
    taskName: string;
  }>({ open: false, notificationId: "", taskName: "" });
  const [overdueReason, setOverdueReason] = useState("");
  const [debugMode, setDebugMode] = useState(false);

  // Real-time timer for live time updates - synchronized to minute boundaries
  React.useEffect(() => {
    // Initial update
    setCurrentTime(new Date());

    // Calculate time until next minute boundary for synchronization
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();

    let timer: NodeJS.Timeout;

    // First timeout to sync to minute boundary
    const syncTimeout = setTimeout(() => {
      setCurrentTime(new Date());

      // Then set regular 30-second intervals
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 30000); // Update every 30 seconds for better real-time responsiveness
    }, secondsUntilNextMinute * 1000);

    return () => {
      clearTimeout(syncTimeout);
      if (timer) clearInterval(timer);
    };
  }, []);

  // Fetch notifications from database
  const {
    data: dbNotifications,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["finops-notifications"],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching FinOps notifications from API...");
        const result = await apiClient.request("/notifications-production");
        console.log("✅ FinOps notifications API response:", result);
        return result;
      } catch (error) {
        console.error("❌ FinOps notifications API failed:", error);

        // Check if it's timeout error
        if (error instanceof Error && error.message.includes("timeout")) {
          console.warn("⏱️ Request timeout - using empty notifications");
          return {
            notifications: [],
            pagination: { total: 0, limit: 50, offset: 0, has_more: false },
            unread_count: 0,
          };
        }

        // Check if it's FullStory interference
        if (
          error instanceof Error &&
          (error.message.includes("Failed to fetch") ||
            error.stack?.includes("fullstory") ||
            error.stack?.includes("fs.js"))
        ) {
          console.warn(
            "🚨 FullStory interference detected in notifications query",
          );
          // Return empty structure to prevent component crash
          return {
            notifications: [],
            pagination: { total: 0, limit: 50, offset: 0, has_more: false },
            unread_count: 0,
          };
        }

        throw error;
      }
    },
    refetchInterval: 60000, // Refresh every 60 seconds (reduced from 30s)
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for notifications`);

      // Don't retry timeout errors immediately
      if (error instanceof Error && error.message.includes("timeout")) {
        return failureCount < 1; // Only 1 retry for timeouts
      }

      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Transform database notifications - DATABASE ONLY (no mock fallback)
  const notifications = React.useMemo(() => {
    console.log("🔍 Processing notifications data (DATABASE-ONLY MODE):", {
      dbNotifications,
      hasError: !!error,
      isLoading,
      dbStructure: dbNotifications ? Object.keys(dbNotifications) : null,
    });

    // Only use database data - no mock fallback
    if (
      dbNotifications &&
      typeof dbNotifications === "object" &&
      "notifications" in dbNotifications
    ) {
      console.log("✅ Using REAL DATABASE data:", {
        notificationsArray: dbNotifications.notifications,
        arrayLength: dbNotifications.notifications?.length,
        pagination: dbNotifications.pagination,
        unreadCount: dbNotifications.unread_count,
      });

      if (
        dbNotifications.notifications &&
        dbNotifications.notifications.length > 0
      ) {
        console.log(
          `📊 Transforming ${dbNotifications.notifications.length} database notifications`,
        );
        const transformed = transformDbNotifications(
          dbNotifications.notifications,
          currentTime,
        );
        console.log(
          `✅ Database transformation complete: ${transformed.length} notifications processed`,
        );
        return transformed;
      } else {
        console.log("📭 Database returned empty notifications array");
        return []; // Database is empty - this is valid
      }
    }

    // Return empty array if database is unavailable (no mock fallback)
    console.log(
      "❌ Database unavailable - showing empty notifications (database-only mode)",
    );
    return [];
  }, [dbNotifications, error, isLoading, currentTime]);

  // Manual sync function for debugging time gaps (defined after refetch is available)
  const forceTimeSync = React.useCallback(() => {
    console.log("🔧 Force time synchronization triggered");
    setCurrentTime(new Date());
    refetch(); // Refresh notifications from API
  }, [refetch]);

  // Expose debug functions to window for console access (after all dependencies are available)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).finopsDebug = {
        forceTimeSync,
        getCurrentTime: () => currentTime,
        toggleDebugMode: () => setDebugMode(!debugMode),
        getNotifications: () => notifications,
        refetchNotifications: refetch,
      };
    }
  }, [forceTimeSync, currentTime, debugMode, notifications, refetch]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filterType !== "all" && notification.type !== filterType) return false;
    if (filterPriority !== "all" && notification.priority !== filterPriority)
      return false;
    if (filterStatus !== "all" && notification.status !== filterStatus)
      return false;
    return true;
  });

  const markAsRead = async (
    notificationId: string,
    isOverdue = false,
    taskName = "",
  ) => {
    if (isOverdue) {
      // Open dialog for overdue reason
      setOverdueReasonDialog({
        open: true,
        notificationId,
        taskName,
      });
      return;
    }

    try {
      await apiClient.request(
        `/notifications-production/${notificationId}/read`,
        {
          method: "PUT",
        },
      );
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const submitOverdueReason = async () => {
    try {
      // First, store the overdue reason
      await apiClient.request("/notifications-production/overdue-reason", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_id: overdueReasonDialog.notificationId,
          task_name: overdueReasonDialog.taskName,
          overdue_reason: overdueReason,
          created_at: new Date().toISOString(),
        }),
      });

      // Then mark as read
      await apiClient.request(
        `/notifications-production/${overdueReasonDialog.notificationId}/read`,
        {
          method: "PUT",
        },
      );

      // Close dialog and refresh
      setOverdueReasonDialog({ open: false, notificationId: "", taskName: "" });
      setOverdueReason("");
      refetch();
    } catch (error) {
      console.error("Failed to submit overdue reason:", error);
    }
  };

  const markAsArchived = async (notificationId: string) => {
    try {
      await apiClient.request(`/notifications-production/${notificationId}`, {
        method: "DELETE",
      });
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Failed to archive notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(
        (n) => n.status === "unread",
      );
      await Promise.all(
        unreadNotifications.map((notification) =>
          apiClient.request(
            `/notifications-production/${notification.id}/read`,
            {
              method: "PUT",
            },
          ),
        ),
      );
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sla_overdue":
      case "escalation":
        return AlertTriangle;
      case "sla_warning":
        return Clock;
      case "task_completed":
        return CheckCircle;
      case "task_delayed":
        return MessageSquare;
      case "task_pending":
        return Clock;
      case "daily_reminder":
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-blue-500 bg-blue-50";
      case "low":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Real-time calculation like in task management
    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffMinutes < 1440) {
      // Less than 24 hours
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m ago`;
    } else if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  // Calculate summary statistics
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const criticalCount = notifications.filter(
    (n) => n.priority === "critical" && n.status !== "archived",
  ).length;
  const actionRequiredCount = notifications.filter(
    (n) => n.action_required && n.status !== "archived",
  ).length;

  // Determine database connection status (database-only mode)
  const isDatabaseConnected =
    dbNotifications &&
    typeof dbNotifications === "object" &&
    "notifications" in dbNotifications;
  const isDatabaseEmpty =
    isDatabaseConnected &&
    (!dbNotifications.notifications ||
      dbNotifications.notifications.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            FinOps Notifications
            {isDatabaseConnected ? (
              <Badge
                variant="outline"
                className="ml-2 text-green-600 bg-green-50 border-green-200"
              >
                Database Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="ml-2 text-red-600 bg-red-50 border-red-200"
              >
                Database Unavailable
              </Badge>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            Automated SLA monitoring with 15-minute warnings and overdue alerts
            {isDatabaseConnected && " • Real-time database monitoring active"}
            {!isDatabaseConnected && " • Database connection required"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.length}
            </div>
            <div className="text-xs text-gray-600">Total Notifications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {unreadCount}
            </div>
            <div className="text-xs text-gray-600">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {criticalCount}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {actionRequiredCount}
            </div>
            <div className="text-xs text-gray-600">Action Required</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sla_overdue">SLA Overdue</SelectItem>
                  <SelectItem value="sla_warning">SLA Warning</SelectItem>
                  <SelectItem value="task_delayed">Task Delayed</SelectItem>
                  <SelectItem value="task_completed">Task Completed</SelectItem>
                  <SelectItem value="daily_reminder">Daily Reminder</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Filter by Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Alerts</AlertTitle>
          <AlertDescription className="text-red-700">
            You have {criticalCount} critical notification(s) that require
            immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Notifications
              </h3>
              <p className="text-gray-600">
                {notifications.length === 0
                  ? isDatabaseEmpty
                    ? "✅ Database connected. No notifications yet. The system automatically monitors subtask start_time and creates SLA warnings 15 minutes before and overdue alerts 15 minutes after scheduled times."
                    : isDatabaseConnected
                      ? "Database connected but no notifications found. Check subtasks table for entries with start_time to enable automatic notifications."
                      : "❌ Database unavailable. Please ensure database connection is working to see automated SLA notifications."
                  : "No notifications match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`${getNotificationColor(notification.priority)} border-l-4 ${
                  notification.status === "unread" ? "shadow-md" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${
                          notification.priority === "critical"
                            ? "text-red-600"
                            : notification.priority === "high"
                              ? "text-orange-600"
                              : notification.priority === "medium"
                                ? "text-blue-600"
                                : "text-green-600"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4
                              className={`font-medium text-sm ${
                                notification.status === "unread"
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-700 mt-1 break-words">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge
                              className={getPriorityColor(
                                notification.priority,
                              )}
                            >
                              {notification.priority}
                            </Badge>
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.task_name}
                          </span>
                          {notification.client_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {notification.client_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notification.assigned_to}
                          </span>
                          <span>
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>

                        {notification.subtask_name && (
                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Subtask:</strong>{" "}
                            {notification.subtask_name}
                          </div>
                        )}

                        {notification.delay_reason && (
                          <div className="text-xs text-yellow-700 mb-2">
                            <strong>Delay Reason:</strong>{" "}
                            {notification.delay_reason}
                          </div>
                        )}

                        {notification.sla_remaining && (
                          <div
                            className={`text-xs mb-2 font-semibold ${
                              notification.type === "sla_overdue"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            <strong>SLA Status:</strong>{" "}
                            {notification.sla_remaining}
                          </div>
                        )}

                        {/* Members List - Enhanced Display */}
                        {notification.members_list &&
                          notification.members_list.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                              <div className="text-xs font-medium text-gray-800 mb-2">
                                Team Members:
                              </div>

                              {/* Assigned To */}
                              <div className="mb-2">
                                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Assigned: {notification.assigned_to}
                                </span>
                              </div>

                              {/* Reporting Managers - Show for tasks <15 min or overdue */}
                              {notification.reporting_managers &&
                                notification.reporting_managers.length > 0 && (
                                  <div className="mb-2">
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      Reporting Managers:{" "}
                                      {notification.reporting_managers.join(
                                        ", ",
                                      )}
                                    </span>
                                  </div>
                                )}

                              {/* Escalation Managers - Show for overdue tasks */}
                              {notification.type === "sla_overdue" &&
                                notification.escalation_managers &&
                                notification.escalation_managers.length > 0 && (
                                  <div className="mb-2">
                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                      <Shield className="w-3 h-3" />
                                      Escalation Managers:{" "}
                                      {notification.escalation_managers.join(
                                        ", ",
                                      )}
                                    </span>
                                  </div>
                                )}
                            </div>
                          )}

                        {notification.action_required && (
                          <Alert className="mt-3 p-2 border-orange-200 bg-orange-50">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <AlertDescription className="text-xs text-orange-700 ml-1">
                              Action required - Please review and take necessary
                              steps
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 ml-3">
                      {notification.status === "unread" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            markAsRead(
                              notification.id,
                              notification.type === "sla_overdue",
                              notification.task_name,
                            )
                          }
                          className="h-8 px-2"
                          title={
                            notification.type === "sla_overdue"
                              ? "Mark as read and provide reason"
                              : "Mark as read"
                          }
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsArchived(notification.id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          // Handle view action - could open task details
                          console.log("View notification:", notification.id);
                        }}
                        title="View Details"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Overdue Reason Dialog */}
      <Dialog
        open={overdueReasonDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setOverdueReasonDialog({
              open: false,
              notificationId: "",
              taskName: "",
            });
            setOverdueReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Overdue Task - Reason Required
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for marking this overdue notification as
              read:
              <br />
              <strong>{overdueReasonDialog.taskName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="overdue-reason">Overdue Reason</Label>
              <Textarea
                id="overdue-reason"
                placeholder="Please explain why this task was overdue and what actions were taken..."
                value={overdueReason}
                onChange={(e) => setOverdueReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOverdueReasonDialog({
                  open: false,
                  notificationId: "",
                  taskName: "",
                });
                setOverdueReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitOverdueReason}
              disabled={!overdueReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Submit Reason & Mark Read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
