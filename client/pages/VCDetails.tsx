import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { useUpdateVCStep, useDeleteVCStep } from "@/hooks/useApi";
import { DraggableVCStepsList } from "@/components/DraggableVCStepsList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  User,
  Target,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Award,
  Zap,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Send,
  MessageSquare,
} from "lucide-react";
import { formatToISTDateTime } from "@/lib/dateUtils";

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
  angel: "bg-sky-100 text-sky-800 border-sky-200",
  vc: "bg-indigo-100 text-indigo-800 border-indigo-200",
  private_equity: "bg-purple-100 text-purple-800 border-purple-200",
  family_office: "bg-orange-100 text-orange-800 border-orange-200",
  merchant_banker: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const roundStageColors = {
  pre_seed: "bg-gray-100 text-gray-800",
  seed: "bg-green-100 text-green-800",
  series_a: "bg-blue-100 text-blue-800",
  series_b: "bg-purple-100 text-purple-800",
  series_c: "bg-pink-100 text-pink-800",
  bridge: "bg-yellow-100 text-yellow-800",
  mezzanine: "bg-red-100 text-red-800",
};

export default function VCDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get primary contact from contacts array
  const getPrimaryContact = (vcData: any) => {
    if (!vcData?.contacts) {
      console.log("No contacts data available:", vcData?.contacts);
      return null;
    }

    try {
      const contacts =
        typeof vcData.contacts === "string"
          ? JSON.parse(vcData.contacts)
          : vcData.contacts;

      console.log("Parsed contacts:", contacts);
      return Array.isArray(contacts) && contacts.length > 0
        ? contacts[0]
        : null;
    } catch (error) {
      console.error(
        "Error parsing contacts:",
        error,
        "Raw contacts:",
        vcData.contacts,
      );
      return null;
    }
  };

  // Currency formatting function
  const formatCurrency = (
    amount: string | number,
    currency: string = "INR",
  ) => {
    if (!amount) return "N/A";

    // Convert to string if it's a number
    const amountStr = typeof amount === "number" ? amount.toString() : amount;

    // If amount already includes a currency symbol, return as is
    if (
      amountStr.includes("$") ||
      amountStr.includes("₹") ||
      amountStr.includes("د.إ")
    ) {
      return amountStr;
    }

    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    return `${symbol}${amountStr}`;
  };

  // Format large numbers with currency
  const formatLargeAmount = (
    amount: number | string,
    currency: string = "INR",
  ) => {
    console.log("🐛 DEBUG - formatLargeAmount called with:", {
      amount,
      currency,
      type: typeof amount,
    });

    // Handle null, undefined, empty string
    if (!amount && amount !== 0) {
      console.log("🐛 DEBUG - returning N/A for falsy value");
      return "N/A";
    }

    const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
    console.log("🐛 DEBUG - parsed amount:", amountNum);

    if (isNaN(amountNum) || amountNum <= 0) {
      console.log("🐛 DEBUG - returning N/A for zero/invalid value");
      return "N/A";
    }

    const symbol = currency === "USD" ? "$" : currency === "AED" ? "د.إ" : "₹";
    const formatted = (amountNum / 1000000).toFixed(1);
    const result = `${symbol}${formatted}M`;
    console.log("🐛 DEBUG - formatted result:", result);
    return result;
  };
  const vcId = parseInt(id || "0");

  const [newStepDialog, setNewStepDialog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(new Set<number>());
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    due_date: "",
    priority: "medium" as const,
    estimated_days: 1,
  });

  // Fetch VC details
  const {
    data: vcData,
    isLoading: vcLoading,
    error: vcError,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: async () => {
      const response = await apiClient.request(`/vc/${id}`);
      return response;
    },
    enabled: !!id,
  });

  // Fetch VC steps
  const {
    data: vcSteps = [],
    isLoading: stepsLoading,
    refetch: refetchSteps,
    error: stepsError,
  } = useQuery({
    queryKey: ["vc-steps", id],
    queryFn: async () => {
      const response = await apiClient.request(`/vc/${id}/steps`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      return response;
    },
    enabled: !!id,
    staleTime: 0, // Don't cache
    cacheTime: 0, // Don't cache
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async (stepData: any) => {
      const response = await apiClient.request(`/vc/${id}/steps`, {
        method: "POST",
        body: JSON.stringify(stepData),
      });
      return response;
    },
    onSuccess: () => {
      refetchSteps();
      setNewStepDialog(false);
      setNewStep({
        name: "",
        description: "",
        due_date: "",
        priority: "medium",
        estimated_days: 1,
      });
    },
  });

  const updateVCStepMutation = useUpdateVCStep();
  const deleteVCStepMutation = useDeleteVCStep();

  // Calculate completion percentage based on actual step probability percentages
  const calculateCompletionPercentage = () => {
    if (vcSteps && vcSteps.length > 0) {
      // Sum probability_percent of completed steps
      const completedProbability = vcSteps
        .filter((step: any) => step.status === "completed")
        .reduce((sum: number, step: any) => {
          const probability = parseFloat(step.probability_percent) || 0;
          return sum + probability;
        }, 0);

      // Add half probability for in-progress steps
      const inProgressProbability = vcSteps
        .filter((step: any) => step.status === "in_progress")
        .reduce((sum: number, step: any) => {
          const probability = parseFloat(step.probability_percent) || 0;
          return sum + probability * 0.5;
        }, 0);

      const total = completedProbability + inProgressProbability;
      return isNaN(total) ? 0 : Math.round(total);
    }

    return vcData?.probability || 0;
  };

  const completionPercentage = calculateCompletionPercentage();

  const handleBack = () => {
    navigate("/vc");
  };

  const handleEdit = () => {
    navigate(`/vc/${id}/edit`);
  };

  const handleAddStep = async () => {
    if (!newStep.name.trim()) {
      alert("Step name is required");
      return;
    }
    if (!newStep.description.trim()) {
      alert("Step description is required");
      return;
    }

    try {
      const stepData = {
        name: newStep.name.trim(),
        description: newStep.description.trim(),
        due_date: newStep.due_date.trim() || undefined,
        priority: newStep.priority,
        status: "pending",
        estimated_days: newStep.estimated_days,
        created_by: parseInt(user?.id || "1"),
      };

      await createStepMutation.mutateAsync(stepData);
    } catch (error) {
      console.error("Failed to create step:", error);
      alert("Failed to create step. Please try again.");
    }
  };

  const handleToggleExpansion = (stepId: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!window.confirm("Are you sure you want to delete this step?")) {
      return;
    }

    try {
      await deleteVCStepMutation.mutateAsync(stepId);
      refetchSteps();
      alert("Step deleted successfully!");
    } catch (error) {
      console.error("Failed to delete step:", error);
      alert("Failed to delete step. Please try again.");
    }
  };

  const handleReorderSteps = async (reorderedSteps: any[]) => {
    try {
      const stepOrders = reorderedSteps.map((step, index) => ({
        id: step.id,
        order_index: index + 1,
      }));

      await apiClient.request(`/vc/${id}/steps/reorder`, {
        method: "PUT",
        body: JSON.stringify({ stepOrders }),
      });

      refetchSteps();
    } catch (error) {
      console.error("Failed to reorder steps:", error);
    }
  };

  const getRoundStageDisplay = (stage: string) => {
    return (
      stage
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "N/A"
    );
  };

  if (vcLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading VC details...</div>
      </div>
    );
  }

  if (vcError || !vcData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Error loading VC details</div>
      </div>
    );
  }

  const SourceIcon =
    sourceIcons[vcData.lead_source as keyof typeof sourceIcons] || Zap;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Overview
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {vcData.round_title || vcData.investor_name}
              </h1>
              <Badge className="text-xs">{vcData.vc_id}</Badge>
              <Badge
                className={
                  statusColors[vcData.status as keyof typeof statusColors]
                }
              >
                {vcData.status.replace("-", " ")}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">VC Details & Funding Pipeline</p>
            {/* Enhanced Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  Progress:
                </span>
                <div className="flex-1 max-w-sm">
                  <div className="w-full bg-gray-200 rounded-full h-3 relative">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        completionPercentage === 100
                          ? "bg-green-500"
                          : completionPercentage >= 75
                            ? "bg-blue-500"
                            : completionPercentage >= 50
                              ? "bg-yellow-500"
                              : completionPercentage >= 25
                                ? "bg-orange-500"
                                : "bg-red-500"
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                    {completionPercentage > 0 && (
                      <div
                        className="absolute top-0 h-3 w-1 bg-white opacity-75 rounded-full"
                        style={{ left: `${completionPercentage}%` }}
                      ></div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    {completionPercentage}% Complete
                  </div>
                  <div className="text-xs text-gray-500">
                    {vcSteps
                      ? vcSteps.filter((s: any) => s.status === "completed")
                          .length
                      : 0}{" "}
                    of {vcSteps?.length || 0} steps
                  </div>
                </div>
              </div>

              {/* Step-by-step breakdown - moved below */}
              {vcSteps && vcSteps.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  <details className="cursor-pointer">
                    <summary className="hover:text-gray-800 select-none">
                      📊 View detailed progress breakdown
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded border space-y-1">
                      {vcSteps.map((step, index) => {
                        // Use actual database probability_percent or fallback to equal distribution
                        const stepProbability =
                          step.probability_percent || 100 / vcSteps.length;
                        return (
                          <div
                            key={step.id}
                            className="flex justify-between items-center"
                          >
                            <span className="flex items-center space-x-2">
                              {step.status === "completed" ? (
                                <span className="text-green-600">✓</span>
                              ) : step.status === "in_progress" ? (
                                <span className="text-blue-600">⋯</span>
                              ) : (
                                <span className="text-gray-400">○</span>
                              )}
                              <span
                                className={
                                  step.status === "completed"
                                    ? "line-through text-gray-500"
                                    : ""
                                }
                              >
                                {step.name}
                              </span>
                            </span>
                            <span className="font-medium">
                              {Math.round(stepProbability)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit VC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - VC Information */}
        <div className="lg:col-span-3 space-y-6">
          {/* VC Overview */}
          <Card>
            <CardHeader>
              <CardTitle>VC Overview</CardTitle>
              <CardDescription>
                Basic VC information and funding details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Lead Source:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1 rounded ${sourceColors[vcData.lead_source as keyof typeof sourceColors]}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="capitalize">
                            {vcData.lead_source.replace("-", " ")}
                          </span>
                          {vcData.lead_source_value && (
                            <span
                              className="text-sm text-blue-600 hover:underline cursor-pointer"
                              title={vcData.lead_source_value}
                            >
                              {vcData.lead_source === "email" ? (
                                <a href={`mailto:${vcData.lead_source_value}`}>
                                  {vcData.lead_source_value}
                                </a>
                              ) : vcData.lead_source === "phone" ||
                                vcData.lead_source === "cold-call" ? (
                                <a href={`tel:${vcData.lead_source_value}`}>
                                  {vcData.lead_source_value}
                                </a>
                              ) : vcData.lead_source === "website" ? (
                                <a
                                  href={
                                    vcData.lead_source_value.startsWith("http")
                                      ? vcData.lead_source_value
                                      : `https://${vcData.lead_source_value}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {vcData.lead_source_value}
                                </a>
                              ) : (
                                vcData.lead_source_value
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <Badge
                        className={
                          statusColors[
                            vcData.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {vcData.status.charAt(0).toUpperCase() +
                          vcData.status.slice(1).replace("-", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Priority:
                      </span>
                      <Badge
                        className={
                          priorityColors[
                            vcData.priority_level as keyof typeof priorityColors
                          ]
                        }
                      >
                        {vcData.priority_level?.charAt(0).toUpperCase() +
                          vcData.priority_level?.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Investor Category:
                      </span>
                      <Badge
                        className={
                          investorCategoryColors[
                            vcData.investor_category as keyof typeof investorCategoryColors
                          ]
                        }
                      >
                        {vcData.investor_category
                          ?.replace("_", " ")
                          .toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Contact Person:
                      </span>
                      <span className="text-gray-900">
                        {getPrimaryContact(vcData)?.contact_name ||
                          "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Email:</span>
                      {getPrimaryContact(vcData)?.email ? (
                        <a
                          href={`mailto:${getPrimaryContact(vcData)?.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {getPrimaryContact(vcData)?.email}
                        </a>
                      ) : (
                        <span className="text-gray-900">Not provided</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {getPrimaryContact(vcData)?.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Investor:
                      </span>
                      <span className="text-gray-900">
                        {vcData.investor_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Funding Information */}
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Funding Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">
                        Round Stage:{" "}
                      </span>
                      <Badge
                        className={
                          roundStageColors[
                            vcData.round_stage as keyof typeof roundStageColors
                          ]
                        }
                      >
                        {getRoundStageDisplay(vcData.round_stage)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Round Size:{" "}
                      </span>
                      <span className="text-gray-900">
                        {formatCurrency(
                          vcData.round_size,
                          vcData.billing_currency,
                        ) || "TBD"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Valuation:{" "}
                      </span>
                      <span className="text-gray-900">
                        {formatCurrency(
                          vcData.valuation,
                          vcData.billing_currency,
                        ) || "TBD"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(vcData.minimum_size || vcData.minimum_size === 0) && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Min. Investment:{" "}
                        </span>
                        <span className="text-gray-900">
                          {formatLargeAmount(
                            vcData.minimum_size,
                            vcData.billing_currency,
                          )}
                        </span>
                      </div>
                    )}
                    {(vcData.maximum_size || vcData.maximum_size === 0) && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Max. Investment:{" "}
                        </span>
                        <span className="text-gray-900">
                          {formatLargeAmount(
                            vcData.maximum_size,
                            vcData.billing_currency,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {vcData.round_description && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600">
                      Description:{" "}
                    </span>
                    <span className="text-gray-900">
                      {vcData.round_description}
                    </span>
                  </div>
                )}
              </div>

              {vcData.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Notes:</span>
                    </div>
                    <div className="pl-6 text-gray-900 whitespace-pre-wrap">
                      {vcData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Funding Pipeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Funding Pipeline</CardTitle>
                  <CardDescription>
                    Manage VC-specific funding steps with rich communication
                  </CardDescription>
                </div>
                <Dialog open={newStepDialog} onOpenChange={setNewStepDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Add New Step</DialogTitle>
                      <DialogDescription>
                        Create a custom step for this VC's funding process
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 overflow-y-auto flex-1 px-1">
                      <div>
                        <Label htmlFor="stepName">Step Name *</Label>
                        <Input
                          id="stepName"
                          value={newStep.name}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="e.g., Due Diligence Review"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stepDescription">Description *</Label>
                        <Textarea
                          id="stepDescription"
                          value={newStep.description}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe what needs to be done in this step"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newStep.due_date}
                            onChange={(e) =>
                              setNewStep((prev) => ({
                                ...prev,
                                due_date: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newStep.priority}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewStep((prev) => ({
                                ...prev,
                                priority: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="estimatedDays">Estimated Days</Label>
                        <Input
                          id="estimatedDays"
                          type="number"
                          min="1"
                          value={newStep.estimated_days}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              estimated_days: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-shrink-0 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setNewStepDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStep}
                        disabled={
                          !newStep.name.trim() ||
                          !newStep.description.trim() ||
                          createStepMutation.isPending
                        }
                      >
                        {createStepMutation.isPending
                          ? "Adding..."
                          : "Add Step"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* VC Steps Pipeline */}
              {(() => {
                // Show loading state if steps are still loading
                if (stepsLoading) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>Loading pipeline steps...</p>
                    </div>
                  );
                }

                // Show empty state or steps
                if (vcSteps.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No funding steps yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Create steps to track your funding process for this VC.
                      </p>
                      <Button onClick={() => setNewStepDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Funding Step
                      </Button>
                    </div>
                  );
                } else {
                  return (
                    <DraggableVCStepsList
                      vcId={vcId}
                      steps={vcSteps}
                      expandedSteps={expandedSteps}
                      onToggleExpansion={handleToggleExpansion}
                      onDeleteStep={handleDeleteStep}
                      onReorderSteps={handleReorderSteps}
                    />
                  );
                }
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>VC Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {completionPercentage}% complete
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {vcData.start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="text-gray-900">
                      {new Date(vcData.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {vcData.targeted_end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Close:</span>
                    <span className="text-gray-900">
                      {new Date(vcData.targeted_end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {vcData.potential_lead_investor !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lead Investor:</span>
                    <span className="text-gray-900">
                      {vcData.potential_lead_investor ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getPrimaryContact(vcData)?.email ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `mailto:${getPrimaryContact(vcData)?.email}?subject=Follow-up: ${vcData.round_title || vcData.investor_name}&body=Hi ${getPrimaryContact(vcData)?.contact_name},%0D%0A%0D%0AI wanted to follow up on our discussion regarding ${vcData.round_title || "your investment opportunity"}...`,
                      "_blank",
                    )
                  }
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              ) : (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email (No email available)
                </Button>
              )}

              {getPrimaryContact(vcData)?.phone ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `tel:${getPrimaryContact(vcData)?.phone}`,
                      "_self",
                    )
                  }
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call {getPrimaryContact(vcData)?.contact_name}
                </Button>
              ) : (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Make Call (No phone available)
                </Button>
              )}

              {vcData.website && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => window.open(vcData.website, "_blank")}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
