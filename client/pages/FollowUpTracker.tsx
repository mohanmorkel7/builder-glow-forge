import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MessageCircle,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Reply,
  Target,
} from "lucide-react";
import { formatToIST, formatToISTDateTime, isOverdue } from "@/lib/dateUtils";
import { updateFollowUpStatusWithNotification } from "@/utils/followUpUtils";

interface FollowUp {
  id: number;
  message_id?: number;
  step_id?: number;
  lead_id?: number;
  vc_id?: number;
  client_id?: number;
  title: string;
  description?: string;
  lead_name?: string;
  lead_client_name?: string;
  client_name?: string;
  vc_round_title?: string;
  investor_name?: string;
  step_name?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  created_by?: number;
  created_by_name?: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority?: "low" | "medium" | "high" | "urgent";
  follow_up_type?: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  notes?: string;
  type?: "lead" | "vc"; // Add type to distinguish between lead and VC follow-ups
}

// Mock follow-up data with both leads and VC follow-ups
const mockFollowUps: FollowUp[] = [
  // Lead follow-ups
  {
    id: 13,
    message_id: 2,
    step_id: 1,
    lead_id: 1,
    title: "Technical Specifications Review",
    description: "Review technical specifications for TechCorp integration",
    lead_client_name: "TechCorp Solutions",
    step_name: "Initial Contact",
    assigned_user_name: "Mike Johnson",
    created_by_name: "Jane Smith",
    status: "pending",
    priority: "high",
    due_date: "2024-01-25",
    created_at: "2024-01-16T14:15:00Z",
    notes: "Need to validate feasibility of custom integration requirements",
    type: "lead",
  },
  {
    id: 14,
    message_id: 4,
    step_id: 2,
    lead_id: 1,
    title: "API Documentation",
    description: "Provide API documentation for client review",
    lead_client_name: "TechCorp Solutions",
    step_name: "Document Collection",
    assigned_user_name: "John Doe",
    created_by_name: "Jane Smith",
    status: "in_progress",
    priority: "medium",
    due_date: "2024-01-24",
    created_at: "2024-01-21T09:00:00Z",
    notes: "API documentation is 70% complete, waiting for security review",
    type: "lead",
  },
  {
    id: 15,
    message_id: 6,
    step_id: 3,
    lead_id: 2,
    title: "Timeline Assessment",
    description: "Assess timeline impact for additional reporting features",
    lead_client_name: "RetailMax Inc",
    step_name: "Proposal Sent",
    assigned_user_name: "Mike Johnson",
    created_by_name: "John Doe",
    status: "completed",
    priority: "medium",
    due_date: "2024-01-20",
    created_at: "2024-01-18T11:30:00Z",
    completed_at: "2024-01-19T16:45:00Z",
    notes:
      "Timeline assessment completed - 2 additional weeks needed for reporting features",
    type: "lead",
  },
  // VC follow-ups (visible only to admin)
  {
    id: 16,
    vc_id: 1,
    step_id: 4,
    title: "Investment Committee Presentation",
    description:
      "Schedule and prepare presentation for Accel Partners investment committee",
    vc_round_title: "Series A Funding",
    investor_name: "Accel Partners",
    step_name: "Due Diligence Review",
    assigned_user_name: "Emily Davis",
    created_by_name: "David Kim",
    status: "pending",
    priority: "high",
    due_date: "2024-01-27",
    created_at: "2024-01-24T10:00:00Z",
    notes: "Need to coordinate with legal team for compliance review",
    type: "vc",
  },
  {
    id: 17,
    vc_id: 2,
    step_id: 5,
    title: "Financial Projections Update",
    description: "Send updated Q4 financial projections to Sequoia Capital",
    vc_round_title: "Seed Round",
    investor_name: "Sequoia Capital",
    step_name: "Financial Review",
    assigned_user_name: "Finance Team",
    created_by_name: "Bob Wilson",
    status: "in_progress",
    priority: "medium",
    due_date: "2024-01-26",
    created_at: "2024-01-23T14:30:00Z",
    notes: "Waiting for final approval from CFO",
    type: "vc",
  },
  {
    id: 18,
    vc_id: 4,
    step_id: 6,
    title: "Technical Architecture Deep Dive",
    description: "Technical review meeting with Lightspeed technical partners",
    vc_round_title: "Pre-Series A",
    investor_name: "Lightspeed Venture",
    step_name: "Technical Due Diligence",
    assigned_user_name: "Tech Lead",
    created_by_name: "David Kim",
    status: "pending",
    priority: "high",
    due_date: "2024-01-30",
    created_at: "2024-01-22T09:15:00Z",
    notes: "Prepare detailed system architecture documentation",
    type: "vc",
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
  urgent: "bg-purple-100 text-purple-700",
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  overdue: AlertCircle,
};

export default function FollowUpTracker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(
    null,
  );
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all"); // Filter for lead vs VC follow-ups

  // Check user role for follow-up visibility
  const isAdmin = user?.role === "admin";
  const isSales = user?.role === "sales";
  const isVC = user?.role === "vc" || user?.role === "venture";

  // Helper function to check if user can see a follow-up based on role
  const canViewFollowUp = (followUp: FollowUp) => {
    const followUpType =
      followUp.type ||
      (followUp.vc_id || followUp.vc_round_title || followUp.investor_name
        ? "vc"
        : "lead");

    if (isAdmin) return true; // Admin sees all
    if (followUpType === "vc" && !isVC) return false; // VC follow-ups only for VC/admin
    if (followUpType === "lead" && isVC) return false; // Lead follow-ups hidden from VC role
    return true;
  };

  // Fetch follow-ups data from API
  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          userId: user?.id || "",
          userRole: user?.role || "",
        });

        const response = await fetch(`/api/follow-ups?${params.toString()}`);
        const data = await response.json();

        // Convert to expected format and ensure IST timestamps
        const formattedFollowUps = data.map((f: any) => ({
          ...f,
          created_at: new Date(f.created_at).toISOString(),
          updated_at: new Date(f.updated_at).toISOString(),
          due_date: f.due_date || new Date().toISOString().split("T")[0],
          // Determine type based on available fields if not explicitly set
          type:
            f.type ||
            (f.vc_id || f.vc_round_title || f.investor_name ? "vc" : "lead"),
        }));

        setFollowUps(formattedFollowUps);
      } catch (error) {
        console.error("Failed to fetch follow-ups:", error);
        // Fallback to mock data when API fails
        const formattedMockFollowUps = mockFollowUps.map((f: any) => ({
          ...f,
          created_at: new Date(f.created_at).toISOString(),
          updated_at: new Date(f.updated_at || f.created_at).toISOString(),
          due_date: f.due_date || new Date().toISOString().split("T")[0],
          // Determine type based on available fields if not explicitly set
          type:
            f.type ||
            (f.vc_id || f.vc_round_title || f.investor_name ? "vc" : "lead"),
        }));
        setFollowUps(formattedMockFollowUps);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFollowUps();
    }
  }, [user]);

  // Check if we came here to view a specific follow-up ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const followUpId = params.get("id");
    if (followUpId && followUps.length > 0) {
      const followUp = followUps.find((f) => f.id === parseInt(followUpId));
      if (followUp) {
        setSelectedFollowUp(followUp);
      }
    }
  }, [location.search, followUps]);

  const handleNavigateToMessage = (followUp: FollowUp) => {
    // Navigate to the lead details page and scroll to the specific message
    navigate(`/leads/${followUp.lead_id}`, {
      state: {
        scrollToMessage: followUp.message_id,
        highlightMessage: true,
        fromFollowUp: followUp.id,
      },
    });
  };

  const handleUpdateStatus = async (followUpId: number, newStatus: string) => {
    try {
      const completedAt =
        newStatus === "completed" ? new Date().toISOString() : null;

      // Find the follow-up to get step_id and title for notification
      const followUp = followUps.find((f) => f.id === followUpId);
      console.log("Found follow-up for status update:", followUp);

      if (followUp && user) {
        // Determine if this is a VC follow-up
        const followUpType =
          followUp.type ||
          (followUp.vc_id || followUp.vc_round_title || followUp.investor_name
            ? "vc"
            : "lead");

        const notificationData = {
          stepId:
            followUpType === "vc" ? followUp.vc_step_id : followUp.step_id,
          userId: parseInt(user.id),
          userName: user.name,
          followUpTitle:
            followUp.title ||
            followUp.description?.substring(0, 50) + "..." ||
            `Follow-up #${followUpId}`,
          isVC: followUpType === "vc",
        };

        console.log("Updating follow-up status with notification:", {
          followUpId,
          newStatus,
          notificationData,
        });

        // Use the utility function that includes chat notification
        await updateFollowUpStatusWithNotification(
          followUpId,
          { status: newStatus, completed_at: completedAt },
          notificationData,
        );
        console.log(
          "Follow-up status update with notification completed successfully",
        );
      } else {
        // Fallback to original method if follow-up not found or no user
        const response = await fetch(`/api/follow-ups/${followUpId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            completed_at: completedAt,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update status");
        }
      }

      // Update local state
      setFollowUps((prevFollowUps) =>
        prevFollowUps.map((f) =>
          f.id === followUpId
            ? { ...f, status: newStatus as any, completed_at: completedAt }
            : f,
        ),
      );
      console.log(`Follow-up ${followUpId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update follow-up status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Base filter function for search and filters
  const baseFilter = (followUp: FollowUp) => {
    if (!followUp) return false;

    // Determine follow-up type with fallback logic
    const followUpType =
      followUp.type ||
      (followUp.vc_id || followUp.vc_round_title || followUp.investor_name
        ? "vc"
        : "lead");

    // Role-based filtering for follow-up visibility
    if (!canViewFollowUp(followUp)) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (
        followUp.lead_name ||
        followUp.lead_client_name ||
        followUp.vc_round_title ||
        ""
      )
        .toLowerCase()
        .includes(searchLower) ||
      (followUp.investor_name || "").toLowerCase().includes(searchLower) ||
      (followUp.step_name || "").toLowerCase().includes(searchLower) ||
      (followUp.assigned_user_name || "").toLowerCase().includes(searchLower) ||
      (followUp.created_by_name || "").toLowerCase().includes(searchLower) ||
      (followUp.title || "").toLowerCase().includes(searchLower) ||
      (followUp.description || "").toLowerCase().includes(searchLower) ||
      (followUp.id || "").toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || followUp.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "all" ||
      followUp.assigned_user_name === assigneeFilter;
    const matchesType = typeFilter === "all" || followUpType === typeFilter;

    return matchesSearch && matchesStatus && matchesAssignee && matchesType;
  };

  // Filter follow-ups based on search and filters
  const filteredFollowUps = followUps.filter(baseFilter);

  // Tab-specific filtered follow-ups
  const allFollowUps = filteredFollowUps;
  const pendingFollowUps = filteredFollowUps.filter(
    (f) => f.status === "pending",
  );
  const inProgressFollowUps = filteredFollowUps.filter(
    (f) => f.status === "in_progress",
  );
  const completedFollowUps = filteredFollowUps.filter(
    (f) => f.status === "completed",
  );
  const overdueFollowUps = filteredFollowUps.filter((f) => {
    const isOverdueStatus =
      f.status === "overdue" ||
      (f.status !== "completed" && f.due_date && isOverdue(f.due_date));
    return isOverdueStatus;
  });

  const myFollowUps = filteredFollowUps.filter(
    (f) => f.assigned_user_name === user?.name,
  );
  const assignedByMe = filteredFollowUps.filter(
    (f) => f.created_by_name === user?.name,
  );

  // Get current tab's follow-ups
  const getCurrentTabFollowUps = () => {
    switch (activeTab) {
      case "pending":
        return pendingFollowUps;
      case "in_progress":
        return inProgressFollowUps;
      case "completed":
        return completedFollowUps;
      case "overdue":
        return overdueFollowUps;
      case "my_tasks":
        return myFollowUps;
      case "assigned_by_me":
        return assignedByMe;
      default:
        return allFollowUps;
    }
  };

  const currentTabFollowUps = getCurrentTabFollowUps();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Follow-up Tracker
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage follow-up tasks from{" "}
            {isAdmin ? "leads and VC rounds" : isVC ? "VC rounds" : "leads"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {myFollowUps.length} assigned to me
          </Badge>
          <Badge variant="outline" className="text-sm">
            {assignedByMe.length} assigned by me
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {
                    followUps.filter(
                      (f) => f.status === "pending" && canViewFollowUp(f),
                    ).length
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">
                  {
                    followUps.filter(
                      (f) => f.status === "in_progress" && canViewFollowUp(f),
                    ).length
                  }
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    followUps.filter(
                      (f) => f.status === "completed" && canViewFollowUp(f),
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-900">
                  {
                    followUps.filter((f) => {
                      const isOverdueStatus =
                        f.status === "overdue" ||
                        (f.status !== "completed" &&
                          f.due_date &&
                          isOverdue(f.due_date));
                      return isOverdueStatus && canViewFollowUp(f);
                    }).length
                  }
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by lead, assignee, message content, or follow-up ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="vc">VC</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                  <SelectItem value="Finance Team">Finance Team</SelectItem>
                  <SelectItem value="Tech Lead">Tech Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Follow-ups */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all" className="text-sm">
            All ({allFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm">
            Pending ({pendingFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-sm">
            In Progress ({inProgressFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm">
            Completed ({completedFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-sm">
            Overdue ({overdueFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="my_tasks" className="text-sm">
            My Tasks ({myFollowUps.length})
          </TabsTrigger>
          <TabsTrigger value="assigned_by_me" className="text-sm">
            Assigned by Me ({assignedByMe.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Follow-ups List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Loading follow-ups...
                  </h3>
                </CardContent>
              </Card>
            ) : currentTabFollowUps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No follow-ups found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    assigneeFilter !== "all"
                      ? "Try adjusting your search criteria"
                      : "Follow-ups will appear here when team members mention specific tasks"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              currentTabFollowUps.map((followUp) => {
                const StatusIcon = statusIcons[followUp.status] || Clock;
                const isFollowUpOverdue =
                  followUp.status === "overdue" ||
                  (followUp.status !== "completed" &&
                    followUp.due_date &&
                    isOverdue(followUp.due_date));
                const isAssignedToMe =
                  followUp.assigned_user_name === user?.name;

                // Determine follow-up type with fallback logic
                const followUpType =
                  followUp.type ||
                  (followUp.vc_id ||
                  followUp.vc_round_title ||
                  followUp.investor_name
                    ? "vc"
                    : "lead");

                return (
                  <Card
                    key={followUp.id}
                    className={`hover:shadow-md transition-shadow border-l-4 ${
                      isAssignedToMe
                        ? isFollowUpOverdue
                          ? "border-l-red-500 bg-red-50"
                          : "border-l-blue-500 bg-blue-50"
                        : "border-l-gray-300"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge
                              className="text-lg font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `#${followUp.id}`,
                                );
                                // Show a brief success message
                              }}
                            >
                              #{followUp.id}
                            </Badge>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {followUpType === "vc" ? (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className="mr-2 bg-purple-100 text-purple-700"
                                  >
                                    VC
                                  </Badge>
                                  {followUp.vc_round_title ||
                                    "Unknown VC Round"}{" "}
                                  •{" "}
                                  {followUp.investor_name || "Unknown Investor"}
                                </>
                              ) : (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className="mr-2 bg-blue-100 text-blue-700"
                                  >
                                    LEAD
                                  </Badge>
                                  {followUp.lead_client_name ||
                                    followUp.client_name ||
                                    "Unknown Lead"}
                                </>
                              )}{" "}
                              • {followUp.title || "Follow-up"}
                            </h3>
                            <Badge
                              className={
                                statusColors[followUp.status] ||
                                "bg-gray-100 text-gray-700"
                              }
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {(followUp.status || "unknown").replace("_", " ")}
                            </Badge>
                            {followUp.priority && (
                              <Badge
                                className={priorityColors[followUp.priority]}
                              >
                                {followUp.priority}
                              </Badge>
                            )}
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg mb-3 border-l-4 border-blue-200">
                            <p className="text-sm text-gray-700 italic">
                              "
                              {followUp.description ||
                                followUp.title ||
                                "No description available"}
                              "
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                Assigned to:{" "}
                                <strong>
                                  {followUp.assigned_user_name || "Unassigned"}
                                </strong>
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                By: {followUp.created_by_name || "Unknown"}
                              </span>
                            </span>
                            {followUp.due_date && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span
                                  className={
                                    isFollowUpOverdue
                                      ? "text-red-600 font-medium"
                                      : ""
                                  }
                                >
                                  Due:{" "}
                                  {formatToISTDateTime(followUp.due_date, {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </span>
                            )}
                          </div>

                          {followUp.notes && (
                            <div className="bg-yellow-50 p-2 rounded text-sm text-gray-700 mb-3">
                              <strong>Notes:</strong> {followUp.notes}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              Created: {formatToIST(followUp.created_at)}
                            </span>
                            {followUp.completed_at && (
                              <span>
                                Completed: {formatToIST(followUp.completed_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          {followUpType === "lead" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToMessage(followUp)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Message
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View VC Round
                            </Button>
                          )}

                          {followUp.status !== "completed" && (
                            <Select
                              value={followUp.status}
                              onValueChange={(value) =>
                                handleUpdateStatus(followUp.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {followUpType === "lead" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/leads/${followUp.lead_id}`)
                              }
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Go to Lead
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Go to VC
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
