import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMyVCPartialSaves } from "@/hooks/useApi";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Mail,
  Phone,
  Globe,
  Users,
  Building,
  Zap,
  Trash2,
  MoreVertical,
  FileText,
  Play,
  DollarSign,
  Briefcase,
  Eye,
  Edit,
  Calendar,
  AlertCircle,
  PieChart,
  BarChart3,
  Activity,
} from "lucide-react";
import { formatToIST } from "@/lib/dateUtils";

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const sourceIcons = {
  email: Mail,
  "social-media": Users,
  phone: Phone,
  website: Globe,
  referral: Award,
  "cold-call": Phone,
  event: Building,
  other: Zap,
};

const sourceColors = {
  email: "bg-blue-100 text-blue-700",
  "social-media": "bg-purple-100 text-purple-700",
  phone: "bg-green-100 text-green-700",
  website: "bg-orange-100 text-orange-700",
  referral: "bg-pink-100 text-pink-700",
  "cold-call": "bg-cyan-100 text-cyan-700",
  event: "bg-indigo-100 text-indigo-700",
  other: "bg-gray-100 text-gray-700",
};

const investorCategoryColors = {
  angel: "bg-blue-100 text-blue-700",
  vc: "bg-green-100 text-green-700",
  private_equity: "bg-purple-100 text-purple-700",
  family_office: "bg-orange-100 text-orange-700",
  merchant_banker: "bg-indigo-100 text-indigo-700",
};

export default function VCDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"vcs" | "drafts">("vcs");

  // Get user ID for partial saves
  const userId = user?.id ? parseInt(user.id) : undefined;

  // Fetch VC partial saves
  const {
    data: vcPartialSaves = [],
    isLoading: partialSavesLoading,
    refetch: refetchVCPartialSaves,
  } = useMyVCPartialSaves(userId);

  // Delete mutation for partial saves
  const deleteVC = useMutation({
    mutationFn: (vcId: number) =>
      apiClient.request(`/vc/${vcId}`, { method: "DELETE" }),
    onSuccess: () => {
      // Invalidate all VC queries with any filters
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      queryClient.invalidateQueries({ queryKey: ["my-vc-partial-saves"] });
      queryClient.invalidateQueries({ queryKey: ["vc-stats"] });
      console.log(
        "VC partial save deleted successfully and queries invalidated",
      );
    },
  });

  // Fetch VC data from database
  const {
    data: vcList = [],
    isLoading: vcLoading,
    error: vcError,
    refetch: refetchVCs,
  } = useQuery({
    queryKey: ["vcs", statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all")
        params.append("investor_category", categoryFilter);

      const queryString = params.toString();
      const url = queryString ? `/vc?${queryString}` : "/vc";

      try {
        const result = await apiClient.request(url);
        return result || [];
      } catch (error) {
        console.error("Failed to fetch VCs:", error);
        // Always return empty array when any error occurs
        return [];
      }
    },
    retry: false, // Don't retry on errors, return fallback data instead
    staleTime: 30000, // 30 seconds
  });

  // Fetch VC statistics from database
  const {
    data: vcStats = { total: 0, in_progress: 0, won: 0, lost: 0 },
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["vc-stats"],
    queryFn: async () => {
      try {
        const result = await apiClient.request("/vc/stats");
        // Ensure we return a valid object even if the API returns null/undefined
        return result || { total: 0, in_progress: 0, won: 0, lost: 0 };
      } catch (error) {
        console.error("Failed to fetch VC stats:", error);
        // Always return default stats when any error occurs
        return { total: 0, in_progress: 0, won: 0, lost: 0 };
      }
    },
    retry: false, // Don't retry on errors, return fallback data instead
    staleTime: 60000, // 1 minute
  });

  // Fetch VC follow-ups from database
  const {
    data: vcFollowUps = [],
    isLoading: followUpsLoading,
    refetch: refetchFollowUps,
  } = useQuery({
    queryKey: ["vc-follow-ups"],
    queryFn: async () => {
      try {
        const result = await apiClient.request("/vc/follow-ups");
        return result || [];
      } catch (error) {
        console.error("Failed to fetch VC follow-ups:", error);
        // Always return empty array when any error occurs
        return [];
      }
    },
    retry: false, // Don't retry on errors, return fallback data instead
    staleTime: 30000,
    refetchOnMount: true,
  });

  // Fetch VC progress data from database
  const { data: vcProgressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ["vc-progress"],
    queryFn: async () => {
      try {
        const result = await apiClient.request("/vc/progress");
        return result || [];
      } catch (error) {
        console.error("Failed to fetch VC progress:", error);
        // Always return empty array when any error occurs
        return [];
      }
    },
    retry: false, // Don't retry on errors, return fallback data instead
    staleTime: 30000, // 30 seconds
  });

  // Fetch VC templates for quick insights
  const { data: vcTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["vc-templates-dashboard"],
    queryFn: async () => {
      try {
        const categories = await apiClient.request(
          "/templates-production/categories",
        );
        // Add null safety check for categories
        if (!categories || !Array.isArray(categories)) {
          console.warn("No categories data received");
          return [];
        }
        const vcCategory = categories.find((cat: any) => cat.name === "VC");

        if (vcCategory) {
          return await apiClient.request(
            `/templates-production/category/${vcCategory.id}`,
          );
        }
        return [];
      } catch (error) {
        console.error("Error fetching VC templates:", error);
        return [];
      }
    },
    retry: 1,
  });

  // Filter and sort VCs (status and category filtering is done server-side)
  const filteredVCs = (vcList || [])
    .filter((vc: any) => {
      // Exclude partial saves from main VC list
      if (
        vc.is_partial === true ||
        vc.investor_name === "PARTIAL_SAVE_IN_PROGRESS"
      ) {
        return false;
      }

      // Only apply search filtering on client-side since status/category are server-side
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        vc.round_title?.toLowerCase().includes(searchLower) ||
        vc.vc_id?.toLowerCase().includes(searchLower) ||
        vc.investor_name?.toLowerCase().includes(searchLower) ||
        vc.contact_person?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: any, b: any) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDeleteVC = async (vcId: number) => {
    try {
      await apiClient.request(`/vc/${vcId}`, { method: "DELETE" });
      // Invalidate all VC queries with any filters
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      queryClient.invalidateQueries({ queryKey: ["vc-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-vc-partial-saves"] });
      console.log("VC deleted successfully and queries invalidated");
    } catch (error) {
      console.error("Failed to delete VC:", error);
      alert("Failed to delete VC. Please try again.");
    }
  };

  const handleResumeVCPartialSave = (partialData: any) => {
    console.log("Navigating to CreateVC with resumeData:", {
      id: partialData.id,
      _resumeFromId: partialData.id,
      roundTitle: partialData.round_title,
      country: partialData.country, // Include country in the debug log
    });
    // Navigate to create VC page with partial data (include URL param as backup)
    navigate(`/vc/create?draftId=${partialData.id}`, {
      state: { resumeData: { ...partialData, _resumeFromId: partialData.id } },
    });
  };

  const handleDeleteVCPartialSave = async (
    partialSaveId: number,
    partialSaveName: string,
  ) => {
    try {
      await deleteVC.mutateAsync(partialSaveId);
      console.log(`Draft ${partialSaveName} deleted successfully`);
      // Refresh partial saves
      refetchVCPartialSaves();
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Failed to delete draft. Please try again.");
    }
  };

  const getVCPartialSaveInfo = (partialSave: any) => {
    try {
      const notes = JSON.parse(partialSave.notes || "{}");
      return {
        lastSaved: notes.lastSaved || partialSave.created_at,
        completedTabs: notes.completedTabs || [],
      };
    } catch (error) {
      return {
        lastSaved: partialSave.created_at,
        completedTabs: [],
      };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "won":
        return <CheckCircle className="w-4 h-4" />;
      case "lost":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    const IconComponent =
      sourceIcons[source as keyof typeof sourceIcons] || Zap;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatCurrency = (amount: string, currency: string = "INR") => {
    if (!amount) return "N/A";

    // If amount already includes a currency symbol, return as is
    if (
      amount.includes("$") ||
      amount.includes("₹") ||
      amount.includes("د.إ")
    ) {
      return amount;
    }

    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    return `${symbol}${amount}`;
  };

  if (vcError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load VC Data
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading the VC dashboard.
            </p>
            <Button onClick={() => refetchVCs()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VC Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage venture capital funding rounds
          </p>
        </div>
        <Button onClick={() => navigate("/vc/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create VC
        </Button>
      </div>

      {/* Statistics Cards - Enhanced with Gradients */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="bg-gray-200 p-3 rounded-full">
                    <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statsError ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load statistics</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total VCs</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {vcStats?.total || 0}
                  </p>
                </div>
                <div className="bg-blue-200 p-3 rounded-full">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {vcStats?.in_progress || 0}
                  </p>
                </div>
                <div className="bg-orange-200 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Successful Rounds
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {vcStats?.won || 0}
                  </p>
                </div>
                <div className="bg-green-200 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    VC Templates
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {(vcTemplates || []).length}
                  </p>
                </div>
                <div className="bg-purple-200 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters - Only show for VCs tab */}
      {activeTab === "vcs" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search VCs, investors, or round titles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by investor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investors</SelectItem>
                  <SelectItem value="angel">Angel</SelectItem>
                  <SelectItem value="vc">VC</SelectItem>
                  <SelectItem value="private_equity">Private Equity</SelectItem>
                  <SelectItem value="family_office">Family Office</SelectItem>
                  <SelectItem value="merchant_banker">
                    Merchant Banker
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="round_title-asc">Round A-Z</SelectItem>
                  <SelectItem value="round_title-desc">Round Z-A</SelectItem>
                  <SelectItem value="investor_name-asc">
                    Investor A-Z
                  </SelectItem>
                  <SelectItem value="investor_name-desc">
                    Investor Z-A
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VC Progress Dashboard */}
      {progressLoading ? (
        <Card className="max-w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              VC Progress Dashboard
            </CardTitle>
            <CardDescription>Loading progress data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ) : (
        (vcProgressData || []).length > 0 && (
          <Card className="max-w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                VC Progress Dashboard
              </CardTitle>
              <CardDescription>
                Track each VC opportunity's current stage and step progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate the maximum probability to normalize chart heights
                const allCompletedSteps = (vcProgressData || []).flatMap(
                  (vc: any) => vc.completed_steps || [],
                );
                const maxProbability =
                  allCompletedSteps.length > 0
                    ? Math.max(
                        ...allCompletedSteps.map((s: any) => s.probability),
                      )
                    : 100;

                // Extract all unique step names with their order from VC progress data
                const stepOrderMap = new Map<string, number>();
                const allStepsSet = new Set<string>();

                (vcProgressData || []).forEach((vc: any) => {
                  if (vc.all_steps && Array.isArray(vc.all_steps)) {
                    vc.all_steps.forEach((step: any, index: number) => {
                      if (step.name) {
                        allStepsSet.add(step.name);
                        // Use the index from the ordered all_steps array as order
                        if (!stepOrderMap.has(step.name)) {
                          stepOrderMap.set(step.name, index);
                        }
                      }
                    });
                  }
                });

                // If no steps found from data, use fallback with proper order
                let allSteps: string[];
                if (allStepsSet.size === 0) {
                  allSteps = [
                    "Initial Pitch",
                    "Product Demo",
                    "Due Diligence",
                    "Term Sheet",
                    "Legal Review",
                    "Final Approval",
                  ];
                } else {
                  // Sort steps by their order index from database
                  allSteps = Array.from(allStepsSet).sort((a, b) => {
                    const orderA = stepOrderMap.get(a) ?? 999;
                    const orderB = stepOrderMap.get(b) ?? 999;
                    return orderA - orderB;
                  });
                }

                // Define colors for different steps
                const stepColors = [
                  "#fca5a5", // red-300
                  "#fdba74", // orange-300
                  "#fde047", // yellow-300
                  "#86efac", // green-300
                  "#67e8f9", // cyan-300
                  "#93c5fd", // blue-300
                  "#c4b5fd", // violet-300
                  "#f9a8d4", // pink-300
                ];

                const getStepColor = (stepIndex: number) => {
                  return stepColors[stepIndex % stepColors.length];
                };

                const chartHeight = 400;

                return (
                  <div className="space-y-6">
                    {/* Two Charts in Same Line */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* VC Progress Chart - Left Side */}
                      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                        <div className="text-sm font-medium text-gray-700 mb-4">
                          All VCs Progress Overview (
                          {(vcProgressData || []).length} rounds)
                        </div>
                        <div className="w-full">
                          <div className="w-full">
                            {/* Chart Container with Y-axis labels */}
                            <div
                              className="flex"
                              style={{ height: `${chartHeight}px` }}
                            >
                              {/* Y-axis Step Labels on Left */}
                              <div
                                className="w-48 pr-4 flex flex-col"
                                style={{ height: `${chartHeight}px` }}
                              >
                                {allSteps
                                  .slice()
                                  .reverse()
                                  .map((stepName: string) => {
                                    const stepHeight =
                                      chartHeight / allSteps.length;
                                    return (
                                      <div
                                        key={stepName}
                                        className="flex items-center justify-end text-right border-b border-gray-200"
                                        style={{ height: `${stepHeight}px` }}
                                      >
                                        <span className="text-sm font-medium text-gray-700">
                                          {stepName}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>

                              {/* Chart Grid and VC Positions */}
                              <div
                                className="relative flex-1"
                                style={{
                                  height: `${chartHeight}px`,
                                  minWidth: `${Math.min((vcProgressData || []).length * 80, 800)}px`,
                                }}
                              >
                                {/* Grid Lines */}
                                <div className="absolute inset-0">
                                  {allSteps.map(
                                    (stepName: string, index: number) => {
                                      const stepHeight =
                                        chartHeight / allSteps.length;
                                      const yPosition =
                                        (allSteps.length - 1 - index) *
                                        stepHeight;
                                      return (
                                        <div
                                          key={stepName}
                                          className="absolute w-full border-b border-gray-200"
                                          style={{
                                            top: `${yPosition}px`,
                                            height: `${stepHeight}px`,
                                          }}
                                        />
                                      );
                                    },
                                  )}
                                </div>

                                {/* VC Progress Indicators */}
                                <div
                                  className="absolute inset-0 flex"
                                  style={{ paddingTop: "0px" }}
                                >
                                  {(vcProgressData || []).map(
                                    (vcProgress: any, vcIndex: number) => {
                                      const vcWidth =
                                        100 /
                                        Math.max(
                                          (vcProgressData || []).length,
                                          1,
                                        );
                                      return (
                                        <div
                                          key={vcProgress.vc_id}
                                          className="relative"
                                          style={{ width: `${vcWidth}%` }}
                                        >
                                          {/* Completed Steps */}
                                          {(
                                            vcProgress.completed_steps || []
                                          ).map((step: any) => {
                                            const stepIndex = allSteps.indexOf(
                                              step.name,
                                            );
                                            if (stepIndex === -1) return null;
                                            const stepHeight =
                                              chartHeight / allSteps.length;
                                            const yPosition =
                                              (allSteps.length -
                                                1 -
                                                stepIndex) *
                                              stepHeight;
                                            return (
                                              <div
                                                key={step.name}
                                                className="absolute left-1/2 transform -translate-x-1/2 w-8 rounded transition-all duration-300 cursor-pointer group flex items-center justify-center"
                                                style={{
                                                  top: `${yPosition}px`,
                                                  height: `${stepHeight}px`,
                                                  backgroundColor:
                                                    getStepColor(stepIndex),
                                                  opacity: 0.8,
                                                }}
                                                title={`${vcProgress.round_title}: ${step.name} - ${step.probability}% (Completed)`}
                                              >
                                                <span className="text-xs font-bold text-gray-800">
                                                  {step.probability}%
                                                </span>
                                              </div>
                                            );
                                          })}

                                          {/* Current Step */}
                                          {vcProgress.current_step &&
                                            (() => {
                                              const stepIndex =
                                                allSteps.indexOf(
                                                  vcProgress.current_step.name,
                                                );
                                              if (stepIndex === -1) return null;
                                              const stepHeight =
                                                chartHeight / allSteps.length;
                                              const yPosition =
                                                (allSteps.length -
                                                  1 -
                                                  stepIndex) *
                                                stepHeight;
                                              return (
                                                <div
                                                  className="absolute left-1/2 transform -translate-x-1/2 w-8 rounded border-2 border-blue-600 transition-all duration-300 cursor-pointer group flex items-center justify-center"
                                                  style={{
                                                    top: `${yPosition}px`,
                                                    height: `${stepHeight}px`,
                                                    backgroundColor:
                                                      getStepColor(stepIndex),
                                                    opacity: 1,
                                                  }}
                                                  title={`${vcProgress.round_title}: ${vcProgress.current_step.name} - ${vcProgress.current_step.probability}% (Current)`}
                                                >
                                                  <span className="text-xs font-bold text-gray-800">
                                                    {
                                                      vcProgress.current_step
                                                        .probability
                                                    }
                                                    %
                                                  </span>
                                                </div>
                                              );
                                            })()}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* X-axis VC Labels at Bottom */}
                            <div className="flex">
                              <div className="w-48 pr-4"></div>
                              <div
                                className="flex flex-1"
                                style={{
                                  minWidth: `${Math.min((vcProgressData || []).length * 80, 800)}px`,
                                }}
                              >
                                {(vcProgressData || []).map(
                                  (vcProgress: any) => {
                                    const vcWidth =
                                      100 /
                                      Math.max(
                                        (vcProgressData || []).length,
                                        1,
                                      );
                                    return (
                                      <div
                                        key={vcProgress.vc_id}
                                        className="text-center"
                                        style={{ width: `${vcWidth}%` }}
                                      >
                                        <div className="text-xs font-medium text-gray-700 mb-1">
                                          {vcProgress.round_title}
                                        </div>
                                        <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-1 inline-block">
                                          {
                                            vcProgress.total_completed_probability
                                          }
                                          %
                                        </div>
                                        <div className="text-sm font-semibold text-gray-800 break-words px-1">
                                          {vcProgress.investor_name}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step-wise Distribution Chart - Right Side */}
                      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                        <div className="text-sm font-medium text-gray-700 mb-4">
                          Step-wise Distribution - VC Count by Step
                        </div>
                        <div>
                          <div>
                            {(() => {
                              // Calculate step-wise distribution (only in-progress/current steps)
                              const stepDistribution = allSteps.map(
                                (stepName: string) => {
                                  const currentVCsCount = (
                                    vcProgressData || []
                                  ).filter(
                                    (vc: any) =>
                                      vc.current_step?.name === stepName,
                                  ).length;
                                  // Only count current/in-progress VCs, not completed ones
                                  const totalVCsAtStep = currentVCsCount;
                                  return {
                                    stepName,
                                    currentVCsCount,
                                    completedVCsCount: 0, // Not showing completed steps
                                    totalVCsAtStep,
                                    stepIndex: allSteps.indexOf(stepName),
                                  };
                                },
                              );

                              const maxVCsAtStep = Math.max(
                                ...stepDistribution.map(
                                  (s) => s.totalVCsAtStep,
                                ),
                                1,
                              );

                              return (
                                <div
                                  className="flex"
                                  style={{ height: `${chartHeight}px` }}
                                >
                                  {/* Y-axis Step Labels on Left */}
                                  <div
                                    className="w-48 pr-4 flex flex-col"
                                    style={{ height: `${chartHeight}px` }}
                                  >
                                    {allSteps
                                      .slice()
                                      .reverse()
                                      .map((stepName: string) => {
                                        const stepHeight =
                                          chartHeight / allSteps.length;
                                        return (
                                          <div
                                            key={stepName}
                                            className="flex items-center justify-end text-right border-b border-gray-200"
                                            style={{
                                              height: `${stepHeight}px`,
                                            }}
                                          >
                                            <span className="text-sm font-medium text-gray-700">
                                              {stepName}
                                            </span>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  {/* Horizontal Bar Chart */}
                                  <div
                                    className="relative flex-1"
                                    style={{ height: `${chartHeight}px` }}
                                  >
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0">
                                      {allSteps.map(
                                        (stepName: string, index: number) => {
                                          const stepHeight =
                                            chartHeight / allSteps.length;
                                          const yPosition =
                                            (allSteps.length - 1 - index) *
                                            stepHeight;
                                          return (
                                            <div
                                              key={stepName}
                                              className="absolute w-full border-b border-gray-200"
                                              style={{
                                                top: `${yPosition}px`,
                                                height: `${stepHeight}px`,
                                              }}
                                            />
                                          );
                                        },
                                      )}
                                    </div>

                                    {/* Horizontal Bars for VC Count */}
                                    <div className="absolute inset-0">
                                      {stepDistribution.map((stepData) => {
                                        const stepIndex = allSteps.indexOf(
                                          stepData.stepName,
                                        );
                                        const stepHeight =
                                          chartHeight / allSteps.length;
                                        const yPosition =
                                          (allSteps.length - 1 - stepIndex) *
                                          stepHeight;
                                        const barWidth =
                                          (stepData.totalVCsAtStep /
                                            maxVCsAtStep) *
                                          85; // Max 85% width
                                        return (
                                          <div key={stepData.stepName}>
                                            {/* Total bar background */}
                                            <div
                                              className="absolute rounded transition-all duration-300 cursor-pointer group"
                                              style={{
                                                top: `${yPosition + stepHeight * 0.2}px`,
                                                left: "10px",
                                                height: `${stepHeight * 0.6}px`,
                                                width: `${Math.max(barWidth, 5)}%`,
                                                backgroundColor:
                                                  getStepColor(stepIndex),
                                                opacity: 0.8,
                                              }}
                                              title={`${stepData.stepName}: ${stepData.totalVCsAtStep} VCs currently in progress`}
                                            >
                                              {/* All bars represent current VCs only */}

                                              {/* VC count text */}
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-800">
                                                  {stepData.totalVCsAtStep}
                                                </span>
                                              </div>

                                              {/* Hover tooltip */}
                                              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                {stepData.stepName}:{" "}
                                                {stepData.totalVCsAtStep} VCs in
                                                progress
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          Total Completed Steps
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {(vcProgressData || []).reduce(
                            (sum: number, vc: any) =>
                              sum + (vc.completed_count || 0),
                            0,
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          Active VC Rounds
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {
                            (vcProgressData || []).filter(
                              (vc: any) => vc.current_step,
                            ).length
                          }
                        </div>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-orange-800">
                          Avg Progress
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                          {(() => {
                            const avgProgress =
                              (vcProgressData || []).length > 0
                                ? Math.round(
                                    (vcProgressData || []).reduce(
                                      (sum: number, vc: any) => {
                                        console.log(
                                          `🔢 VC ${vc.vc_id}: total_completed_probability = ${vc.total_completed_probability}`,
                                        );
                                        return (
                                          sum +
                                          (vc.total_completed_probability || 0)
                                        );
                                      },
                                      0,
                                    ) / (vcProgressData || []).length,
                                  )
                                : 0;
                            console.log(
                              `📊 Average Progress Calculated: ${avgProgress}%`,
                            );
                            return avgProgress;
                          })()}
                          %
                        </div>
                      </div>
                    </div>

                    {/* VC List Summary */}
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Quick VC Summary:
                      </div>
                      {/* Debug logging */}
                      {console.log(
                        "🐛 VC Progress Data for debugging:",
                        vcProgressData,
                      )}
                      <div className="space-y-2">
                        {(vcProgressData || []).map((vc: any) => (
                          <div
                            key={vc.vc_id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => navigate(`/vc/${vc.vc_id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="font-medium text-gray-900">
                                {vc.round_title}
                              </div>
                              <Badge
                                className={
                                  statusColors[
                                    vc.status as keyof typeof statusColors
                                  ]
                                }
                              >
                                {vc.status.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">
                                {vc.total_completed_probability || 0}% completed
                              </div>
                              <div className="text-xs text-gray-500">
                                {vc.current_step?.name || "All steps completed"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )
      )}

      {/* Follow-up Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(() => {
          // Filter follow-ups by due status
          const now = new Date();
          const currentDueFollowUps = (vcFollowUps || []).filter(
            (followUp: any) => {
              if (!followUp.due_date || followUp.status === "completed")
                return false;

              const dueDate = new Date(followUp.due_date);
              if (isNaN(dueDate.getTime())) return false;

              const timeDiff = dueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

              // Show follow-ups due within the next 7 days
              return diffDays >= 0 && diffDays <= 7;
            },
          );

          const overdueFollowUps = (vcFollowUps || []).filter(
            (followUp: any) => {
              if (!followUp.due_date || followUp.status === "completed")
                return false;

              const dueDate = new Date(followUp.due_date);
              if (isNaN(dueDate.getTime())) return false;

              return dueDate < now;
            },
          );

          return (
            <>
              {/* Current Due Follow-ups Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Follow-ups Due
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        Follow-ups due within the next 7 days (
                        {currentDueFollowUps.length} items)
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-200 text-blue-800"
                    >
                      {currentDueFollowUps.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {followUpsLoading ? (
                    <div className="p-6 text-center text-gray-500">
                      Loading follow-ups...
                    </div>
                  ) : currentDueFollowUps.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        All caught up!
                      </p>
                      <p className="text-gray-500 text-sm">
                        No follow-ups due in the next 7 days
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[calc(100vh-400px)] min-h-[200px] overflow-y-auto">
                      {currentDueFollowUps.map(
                        (followUp: any, index: number) => {
                          const dueDate = new Date(followUp.due_date);
                          const diffDays = Math.ceil(
                            (dueDate.getTime() - now.getTime()) /
                              (1000 * 60 * 60 * 24),
                          );
                          const isToday = diffDays === 0;
                          const isTomorrow = diffDays === 1;

                          return (
                            <div
                              key={followUp.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${index === currentDueFollowUps.length - 1 ? "border-b-0" : ""}`}
                              onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                              title={
                                followUp.description ||
                                followUp.title ||
                                "No description available"
                              }
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                      {followUp.title}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        isToday
                                          ? "border-orange-300 text-orange-700 bg-orange-50"
                                          : isTomorrow
                                            ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                            : "border-blue-300 text-blue-700 bg-blue-50"
                                      }`}
                                    >
                                      {isToday
                                        ? "Today"
                                        : isTomorrow
                                          ? "Tomorrow"
                                          : `${diffDays} days`}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>
                                      VC: {followUp.round_title || "Unknown"}
                                    </span>
                                    <span>
                                      Step: {followUp.step_name || "N/A"}
                                    </span>
                                    <span>
                                      Assigned to:{" "}
                                      {followUp.assigned_user_name ||
                                        "Unassigned"}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                  Due:{" "}
                                  {followUp.due_date
                                    ? (() => {
                                        // Convert UTC datetime to local date
                                        const utcDate = new Date(
                                          followUp.due_date,
                                        );
                                        const year = utcDate.getFullYear();
                                        const month = String(
                                          utcDate.getMonth() + 1,
                                        ).padStart(2, "0");
                                        const day = String(
                                          utcDate.getDate(),
                                        ).padStart(2, "0");
                                        return `${year}-${month}-${day}`;
                                      })()
                                    : "No date"}
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overdue Follow-ups Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-red-900 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        Overdue Follow-ups
                      </CardTitle>
                      <CardDescription className="text-red-700">
                        Follow-ups that are past their due date (
                        {overdueFollowUps.length} items)
                      </CardDescription>
                    </div>
                    <Badge
                      variant="destructive"
                      className="bg-red-200 text-red-800"
                    >
                      {overdueFollowUps.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {followUpsLoading ? (
                    <div className="p-6 text-center text-gray-500">
                      Loading follow-ups...
                    </div>
                  ) : overdueFollowUps.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="text-gray-600 font-medium">Great job!</p>
                      <p className="text-gray-500 text-sm">
                        No overdue follow-ups
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[calc(100vh-400px)] min-h-[200px] overflow-y-auto">
                      {overdueFollowUps.map((followUp: any, index: number) => {
                        const dueDate = new Date(followUp.due_date);
                        const diffDays = Math.floor(
                          (now.getTime() - dueDate.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );

                        return (
                          <div
                            key={followUp.id}
                            className={`p-4 border-b border-gray-100 hover:bg-red-50 transition-colors cursor-pointer ${index === overdueFollowUps.length - 1 ? "border-b-0" : ""}`}
                            onClick={() => navigate(`/vc/${followUp.vc_id}`)}
                            title={
                              followUp.description ||
                              followUp.title ||
                              "No description available"
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                    {followUp.title}
                                  </h4>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs bg-red-100 text-red-700"
                                  >
                                    {diffDays === 1
                                      ? "1 day overdue"
                                      : `${diffDays} days overdue`}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>
                                    VC: {followUp.round_title || "Unknown"}
                                  </span>
                                  <span>
                                    Step: {followUp.step_name || "N/A"}
                                  </span>
                                  <span>
                                    Assigned to:{" "}
                                    {followUp.assigned_user_name ||
                                      "Unassigned"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-xs text-red-600 font-medium">
                                Due:{" "}
                                {followUp.due_date
                                  ? (() => {
                                      // Convert UTC datetime to local date
                                      const utcDate = new Date(
                                        followUp.due_date,
                                      );
                                      const year = utcDate.getFullYear();
                                      const month = String(
                                        utcDate.getMonth() + 1,
                                      ).padStart(2, "0");
                                      const day = String(
                                        utcDate.getDate(),
                                      ).padStart(2, "0");
                                      return `${year}-${month}-${day}`;
                                    })()
                                  : "No date"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={activeTab === "vcs" ? "default" : "outline"}
              onClick={() => setActiveTab("vcs")}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              VCs ({(filteredVCs || []).length})
            </Button>
            <Button
              variant={activeTab === "drafts" ? "default" : "outline"}
              onClick={() => setActiveTab("drafts")}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Saved Drafts ({(vcPartialSaves || []).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "vcs" ? (
        <Card>
          <CardContent className="p-6">
            {vcLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading VCs...</p>
              </div>
            ) : (filteredVCs || []).length > 0 ? (
              <div className="space-y-4">
                {(filteredVCs || []).map((vc: any) => (
                  <div
                    key={vc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/vc/${vc.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {vc.round_title || "Untitled Round"}
                              </h3>
                              <Badge variant="secondary">{vc.vc_id}</Badge>
                              {vc.status && (
                                <Badge
                                  className={`${statusColors[vc.status as keyof typeof statusColors]} border-0`}
                                >
                                  {getStatusIcon(vc.status)}
                                  <span className="ml-1 capitalize">
                                    {vc.status.replace("-", " ")}
                                  </span>
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Investor
                                </p>
                                <p className="font-medium">
                                  {vc.investor_name || "N/A"}
                                </p>
                                {vc.investor_category && (
                                  <Badge
                                    className={`${investorCategoryColors[vc.investor_category as keyof typeof investorCategoryColors]} border-0 text-xs`}
                                  >
                                    {vc.investor_category
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </Badge>
                                )}
                              </div>

                              <div>
                                <p className="text-sm text-gray-600">
                                  Round Details
                                </p>
                                <p className="font-medium">
                                  {vc.round_stage
                                    ? vc.round_stage
                                        .replace("_", " ")
                                        .toUpperCase()
                                    : "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(
                                    vc.round_size,
                                    vc.billing_currency,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-600">Contact</p>
                                <p className="font-medium">
                                  {vc.contact_person || "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {vc.email || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                {getSourceIcon(vc.lead_source)}
                                <span className="capitalize">
                                  {vc.lead_source?.replace("-", " ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Created {formatToIST(vc.created_at)}
                                </span>
                              </div>
                              {vc.priority_level && (
                                <Badge
                                  className={`${priorityColors[vc.priority_level as keyof typeof priorityColors]} border-0 text-xs`}
                                >
                                  {vc.priority_level.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vc/${vc.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vc/${vc.id}/edit`);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete VC Opportunity
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {vc.round_title}
                                "? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVC(vc.id);
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No VCs Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  categoryFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "Get started by creating your first VC round."}
                </p>
                <Button onClick={() => navigate("/vc/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create VC
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : /* Saved Drafts Tab */
      partialSavesLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading saved drafts...</p>
          </CardContent>
        </Card>
      ) : (vcPartialSaves || []).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Saved Drafts
            </h3>
            <p className="text-gray-600 mb-4">
              Draft VCs will appear here when you save your progress using the
              "Save Draft" button while creating a VC.
            </p>
            <Button onClick={() => navigate("/vc/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create VC
            </Button>
          </CardContent>
        </Card>
      ) : (
        (vcPartialSaves || []).map((partialSave: any) => {
          const info = getVCPartialSaveInfo(partialSave);
          const lastSaved = new Date(info.lastSaved);
          const formatDateForInput = (dateString: string) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().split("T")[0];
          };

          return (
            <Card
              key={partialSave.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {partialSave.investor_name ===
                        "PARTIAL_SAVE_IN_PROGRESS"
                          ? "Unsaved VC Draft"
                          : partialSave.round_title || "Untitled VC Draft"}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>
                          Last saved:{" "}
                          {lastSaved.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {partialSave.investor_name &&
                        partialSave.investor_name !==
                          "PARTIAL_SAVE_IN_PROGRESS" && (
                          <>
                            <span className="text-gray-600">Investor: </span>
                            <span className="text-blue-600">
                              {partialSave.investor_name}
                            </span>
                          </>
                        )}

                      {partialSave.lead_source && (
                        <>
                          <span className="text-gray-600">Source: </span>
                          <span className="capitalize">
                            {partialSave.lead_source.replace("-", " ")}
                          </span>
                        </>
                      )}
                    </div>

                    {partialSave.round_description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {partialSave.round_description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          const resumeData = {
                            ...partialSave,
                            id: partialSave.id,
                            _resumeFromId: partialSave.id,
                            _lastSaved: info.lastSaved,
                          };

                          handleResumeVCPartialSave(resumeData);
                        } catch (error) {
                          console.error(
                            "Error resuming VC partial save:",
                            error,
                          );
                          alert(
                            "Error resuming draft. Please try again or create a new VC.",
                          );
                        }
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Continue
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this saved draft?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteVCPartialSave(
                                partialSave.id,
                                partialSave.investor_name ===
                                  "PARTIAL_SAVE_IN_PROGRESS"
                                  ? "Unsaved VC Draft"
                                  : partialSave.round_title ||
                                      "Untitled VC Draft",
                              )
                            }
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Created: {formatToIST(partialSave.created_at)}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
