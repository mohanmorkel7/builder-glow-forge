import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useLeads,
  useLeadStats,
  useDeleteLead,
  useMyPartialSaves,
  useLeadProgressDashboard,
  useTemplateStepDashboard,
  useFollowUps,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";
import { formatToIST } from "@/lib/dateUtils";

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
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

export default function LeadDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const {
    data: stats = { total: 0, in_progress: 0, won: 0, lost: 0, completed: 0 },
  } = useLeadStats();
  const deleteLead = useDeleteLead();
  const userId = user?.id ? parseInt(user.id) : undefined;
  const {
    data: partialSaves = [],
    isLoading: partialSavesLoading,
    refetch: refetchPartialSaves,
  } = useMyPartialSaves(userId);
  const { data: leadProgressData = [], isLoading: leadProgressLoading } =
    useLeadProgressDashboard();
  const { data: templateStepData = [], isLoading: templateStepLoading } =
    useTemplateStepDashboard();
  const { data: followUpsData = [], isLoading: followUpsLoading } =
    useFollowUps({
      userId: user?.id,
      userRole: "all",
    });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"leads" | "drafts">("leads");

  // Refresh partial saves when component mounts
  useEffect(() => {
    if (userId) {
      refetchPartialSaves();
    }
  }, [userId, refetchPartialSaves]);

  const handleCreateLead = () => {
    navigate("/leads/new");
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  const handleDeleteLead = async (leadId: number, leadName: string) => {
    try {
      await deleteLead.mutateAsync(leadId);
      console.log(`Lead ${leadName} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const handleResumePartialSave = (partialData: any) => {
    console.log("Navigating to CreateLead with resumeData:", {
      id: partialData.id,
      _resumeFromId: partialData._resumeFromId,
      clientName: partialData.client_name,
    });
    // Navigate to create lead page with partial data
    navigate("/leads/new", { state: { resumeData: partialData } });
  };

  const handleDeletePartialSave = async (
    partialSaveId: number,
    partialSaveName: string,
  ) => {
    try {
      await deleteLead.mutateAsync(partialSaveId);
      console.log(`Draft ${partialSaveName} deleted successfully`);
      // Refresh both partial saves and main leads to ensure clean state
      refetchPartialSaves();
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const getPartialSaveInfo = (partialSave: any) => {
    try {
      const notes = JSON.parse(partialSave.notes || "{}");
      return {
        lastSaved: notes.lastSaved,
        completedTabs: notes.completedTabs || [],
        originalData: notes.originalData || {},
      };
    } catch {
      return {
        lastSaved: partialSave.created_at,
        completedTabs: [],
        originalData: {},
      };
    }
  };

  // Filter leads based on search and filters, excluding partial saves
  const filteredLeads = leads.filter((lead: any) => {
    // Exclude partial saves from main leads list
    let isPartialSave = false;

    try {
      isPartialSave =
        lead.client_name === "PARTIAL_SAVE_IN_PROGRESS" ||
        lead.is_partial === true ||
        (lead.notes &&
          typeof lead.notes === "string" &&
          JSON.parse(lead.notes).isPartialSave === true);
    } catch (error) {
      // If JSON parsing fails, check for string indicators
      isPartialSave =
        lead.client_name === "PARTIAL_SAVE_IN_PROGRESS" ||
        lead.is_partial === true;
    }

    if (isPartialSave) {
      return false;
    }

    const matchesSearch =
      lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.contacts &&
        lead.contacts.some(
          (contact: any) =>
            contact.contact_name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        )) ||
      lead.project_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    const matchesSource =
      sourceFilter === "all" || lead.lead_source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  if (leadsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline and track lead progress
          </p>
        </div>
        <Button
          onClick={handleCreateLead}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Lead
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.total}
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
                  {stats.in_progress}
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
                <p className="text-green-600 text-sm font-medium">Won</p>
                <p className="text-2xl font-bold text-green-900">{stats.won}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Lost</p>
                <p className="text-2xl font-bold text-red-900">{stats.lost}</p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead-wise Step Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lead Progress Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Track each lead's current step and completed step probabilities
            </p>
          </div>
        </div>

        {leadProgressLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading lead progress...</div>
            </CardContent>
          </Card>
        ) : leadProgressData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No leads available
              </h3>
              <p className="text-gray-600">
                Lead progress will appear here once you have active leads
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                All Leads Progress Overview
              </CardTitle>
              <CardDescription>
                Combined view of all leads with their current steps and
                completed step probabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate the maximum probability to normalize chart heights
                const allCompletedSteps = leadProgressData.flatMap(
                  (lead: any) => lead.completed_steps,
                );
                const maxProbability =
                  allCompletedSteps.length > 0
                    ? Math.max(
                        ...allCompletedSteps.map((s: any) => s.probability),
                      )
                    : 100;

                // Get all available steps from template step dashboard, fall back to lead-specific steps
                const allAvailableSteps =
                  templateStepData.length > 0
                    ? Array.from(
                        new Set(
                          templateStepData.map((step: any) => step.step_name),
                        ),
                      )
                    : Array.from(
                        new Set(
                          leadProgressData.flatMap((lead: any) => [
                            ...lead.completed_steps.map(
                              (step: any) => step.name,
                            ),
                            ...(lead.current_step
                              ? [lead.current_step.name]
                              : []),
                          ]),
                        ),
                      );

                const allSteps = allAvailableSteps.sort((a, b) => {
                  // Extract step numbers for proper ordering (Step 1, Step 2, etc.)
                  const getStepNumber = (stepName: string) => {
                    const match = stepName.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                  };
                  return getStepNumber(a) - getStepNumber(b);
                });

                // Define light colors for different steps
                const stepColors = [
                  "#fca5a5", // red-300
                  "#fdba74", // orange-300
                  "#fde047", // yellow-300
                  "#86efac", // green-300
                  "#67e8f9", // cyan-300
                  "#93c5fd", // blue-300
                  "#c4b5fd", // violet-300
                  "#f9a8d4", // pink-300
                  "#d1d5db", // gray-300
                  "#bef264", // lime-300
                ];

                const getStepColor = (stepIndex: number) => {
                  return stepColors[stepIndex % stepColors.length];
                };

                const chartHeight = 400;

                return (
                  <div className="space-y-6">
                    {/* Two Charts in Same Line */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Lead Progress Chart - Left Side */}
                      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                        <div className="text-sm font-medium text-gray-700 mb-4">
                          All Leads Progress ({leadProgressData.length} leads)
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
                                  .map(
                                    (
                                      stepName: string,
                                      reverseIndex: number,
                                    ) => {
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
                                    },
                                  )}
                              </div>

                              {/* Chart Grid and Lead Positions */}
                              <div
                                className="relative flex-1"
                                style={{
                                  height: `${chartHeight}px`,
                                  minWidth: `${Math.min(leadProgressData.length * 60, 800)}px`,
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

                                {/* Lead Progress Indicators */}
                                <div
                                  className="absolute inset-0 flex"
                                  style={{ paddingTop: "0px" }}
                                >
                                  {leadProgressData.map(
                                    (leadProgress: any, leadIndex: number) => {
                                      const leadWidth =
                                        100 / leadProgressData.length;

                                      return (
                                        <div
                                          key={leadProgress.lead_id}
                                          className="relative"
                                          style={{ width: `${leadWidth}%` }}
                                        >
                                          {/* Completed Steps */}
                                          {leadProgress.completed_steps.map(
                                            (step: any) => {
                                              const stepIndex =
                                                allSteps.indexOf(step.name);
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
                                                  title={`${leadProgress.client_name}: ${step.name} - ${step.probability}% (Completed)`}
                                                >
                                                  <span className="text-xs font-bold text-gray-800">
                                                    {step.probability}%
                                                  </span>
                                                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                    {step.name}:{" "}
                                                    {step.probability}%
                                                    (Completed)
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}

                                          {/* Current Step */}
                                          {leadProgress.current_step &&
                                            (() => {
                                              const stepIndex =
                                                allSteps.indexOf(
                                                  leadProgress.current_step
                                                    .name,
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
                                                  title={`${leadProgress.client_name}: ${leadProgress.current_step.name} - ${leadProgress.current_step.probability}% (Current)`}
                                                >
                                                  <span className="text-xs font-bold text-gray-800">
                                                    {
                                                      leadProgress.current_step
                                                        .probability
                                                    }
                                                    %
                                                  </span>
                                                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                    {
                                                      leadProgress.current_step
                                                        .name
                                                    }
                                                    :{" "}
                                                    {
                                                      leadProgress.current_step
                                                        .probability
                                                    }
                                                    % (Current)
                                                  </div>
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

                            {/* X-axis Lead Labels at Bottom */}
                            <div className="flex">
                              <div className="w-48 pr-4"></div>
                              <div
                                className="flex flex-1"
                                style={{
                                  minWidth: `${Math.min(leadProgressData.length * 60, 800)}px`,
                                }}
                              >
                                {leadProgressData.map((leadProgress: any) => {
                                  const leadWidth =
                                    100 / leadProgressData.length;

                                  return (
                                    <div
                                      key={leadProgress.lead_id}
                                      className="text-center"
                                      style={{ width: `${leadWidth}%` }}
                                    >
                                      <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-1 inline-block">
                                        {
                                          leadProgress.total_completed_probability
                                        }
                                        %
                                      </div>
                                      <div className="text-sm font-semibold text-gray-800 break-words px-1">
                                        {leadProgress.client_name}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step-wise Distribution Chart - Right Side */}
                      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                        <div className="text-sm font-medium text-gray-700 mb-4">
                          Step-wise Distribution - Lead Count by Step
                        </div>
                        <div>
                          <div>
                            {(() => {
                              // Calculate step-wise distribution (only in-progress/current steps)
                              const stepDistribution = allSteps.map(
                                (stepName: string) => {
                                  const currentLeadsCount =
                                    leadProgressData.filter(
                                      (lead: any) =>
                                        lead.current_step?.name === stepName,
                                    ).length;

                                  // Only count current/in-progress leads, not completed ones
                                  const totalLeadsAtStep = currentLeadsCount;

                                  return {
                                    stepName,
                                    currentLeadsCount,
                                    completedLeadsCount: 0, // Not showing completed steps
                                    totalLeadsAtStep,
                                    stepIndex: allSteps.indexOf(stepName),
                                  };
                                },
                              );

                              const maxLeadsAtStep = Math.max(
                                ...stepDistribution.map(
                                  (s) => s.totalLeadsAtStep,
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
                                    style={{
                                      height: `${chartHeight}px`,
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

                                    {/* Horizontal Bars for Lead Count */}
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
                                          (stepData.totalLeadsAtStep /
                                            maxLeadsAtStep) *
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
                                              title={`${stepData.stepName}: ${stepData.totalLeadsAtStep} leads currently in progress`}
                                            >
                                              {/* All bars represent current leads only */}

                                              {/* Lead count text */}
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-800">
                                                  {stepData.totalLeadsAtStep}
                                                </span>
                                              </div>

                                              {/* Hover tooltip */}
                                              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                {stepData.stepName}:{" "}
                                                {stepData.totalLeadsAtStep}{" "}
                                                leads in progress
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
                          {leadProgressData.reduce(
                            (sum: number, lead: any) =>
                              sum + lead.completed_count,
                            0,
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          Active Leads
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {
                            leadProgressData.filter(
                              (lead: any) => lead.current_step,
                            ).length
                          }
                        </div>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-orange-800">
                          Avg Progress
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                          {Math.round(
                            leadProgressData.reduce(
                              (sum: number, lead: any) =>
                                sum + lead.total_completed_probability,
                              0,
                            ) / leadProgressData.length,
                          )}
                          %
                        </div>
                      </div>
                    </div>

                    {/* Lead List Summary */}
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Quick Lead Summary:
                      </div>
                      <div className="space-y-2">
                        {leadProgressData.map((lead: any) => (
                          <div
                            key={lead.lead_id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleLeadClick(lead.lead_id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="font-medium text-gray-900">
                                {lead.client_name}
                              </div>
                              <Badge
                                className={
                                  statusColors[
                                    lead.lead_status as keyof typeof statusColors
                                  ]
                                }
                              >
                                {lead.lead_status.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">
                                {lead.total_completed_probability}% completed
                              </div>
                              <div className="text-xs text-gray-500">
                                {lead.current_step?.name || "All steps done"}
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
        )}
      </div>

      {/* Follow-up Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(() => {
          // Filter follow-ups by due status, excluding VC follow-ups
          const now = new Date();
          const leadFollowUpsOnly = followUpsData.filter(
            (followUp: any) => !followUp.vc_id,
          );

          const currentDueFollowUps = leadFollowUpsOnly.filter(
            (followUp: any) => {
              if (!followUp.due_date) return false;
              const dueDate = new Date(followUp.due_date);
              const diffDays = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              return (
                diffDays >= 0 &&
                diffDays <= 7 &&
                followUp.status !== "completed"
              ); // Due within 7 days
            },
          );

          const overdueFollowUps = leadFollowUpsOnly.filter((followUp: any) => {
            if (!followUp.due_date) return false;
            const dueDate = new Date(followUp.due_date);
            return dueDate < now && followUp.status !== "completed";
          });

          return (
            <>
              {/* Current Due Follow-ups Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Current Due Follow-ups
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
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === currentDueFollowUps.length - 1 ? "border-b-0" : ""}`}
                              title={
                                followUp.description ||
                                followUp.title ||
                                followUp.original_message ||
                                "No description available"
                              }
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                      {followUp.title ||
                                        followUp.original_message}
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
                                      Lead:{" "}
                                      {followUp.lead_client_name ||
                                        followUp.client_name ||
                                        "Unknown"}
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
                            className={`p-4 border-b border-gray-100 hover:bg-red-50 transition-colors ${index === overdueFollowUps.length - 1 ? "border-b-0" : ""}`}
                            title={
                              followUp.description ||
                              followUp.title ||
                              followUp.original_message ||
                              "No description available"
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                    {followUp.title ||
                                      followUp.original_message}
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
                                    Lead:{" "}
                                    {followUp.lead_client_name ||
                                      followUp.client_name ||
                                      "Unknown"}
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

      {/* Tabs and Search/Filters */}
      <Card>
        <CardContent className="p-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={activeTab === "leads" ? "default" : "outline"}
              onClick={() => setActiveTab("leads")}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Leads ({filteredLeads.length})
            </Button>
            <Button
              variant={activeTab === "drafts" ? "default" : "outline"}
              onClick={() => setActiveTab("drafts")}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Saved Drafts ({partialSaves.length})
            </Button>
          </div>

          {/* Search and Filters - Only show for leads tab */}
          {activeTab === "leads" && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name, contact, ID, or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold-call">Cold Call</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      <div className="grid gap-4">
        {activeTab === "leads" ? (
          filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No leads found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  sourceFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first lead"}
                </p>
                <Button onClick={handleCreateLead}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead: any) => {
              const SourceIcon =
                sourceIcons[lead.lead_source as keyof typeof sourceIcons] ||
                Zap;

              return (
                <Card
                  key={lead.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleLeadClick(lead.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lead.client_name}
                          </h3>
                          <Badge className="text-xs">{lead.lead_id}</Badge>
                          <Badge
                            className={
                              statusColors[
                                lead.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {lead.status.replace("-", " ")}
                          </Badge>
                          <Badge
                            className={
                              priorityColors[
                                lead.priority as keyof typeof priorityColors
                              ]
                            }
                          >
                            {lead.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center space-x-1">
                            <div
                              className={`p-1 rounded ${sourceColors[lead.lead_source as keyof typeof sourceColors]}`}
                            >
                              <SourceIcon className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <span className="capitalize">
                                {lead.lead_source.replace("-", " ")}
                              </span>
                              {lead.lead_source_value && (
                                <span
                                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                                  title={lead.lead_source_value}
                                >
                                  {lead.lead_source === "email" ? (
                                    <a
                                      href={`mailto:${lead.lead_source_value}`}
                                    >
                                      {lead.lead_source_value.length > 20
                                        ? `${lead.lead_source_value.substring(0, 20)}...`
                                        : lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source === "phone" ||
                                    lead.lead_source === "cold-call" ? (
                                    <a href={`tel:${lead.lead_source_value}`}>
                                      {lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source === "website" ? (
                                    <a
                                      href={
                                        lead.lead_source_value.startsWith(
                                          "http",
                                        )
                                          ? lead.lead_source_value
                                          : `https://${lead.lead_source_value}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {lead.lead_source_value.length > 20
                                        ? `${lead.lead_source_value.substring(0, 20)}...`
                                        : lead.lead_source_value}
                                    </a>
                                  ) : lead.lead_source_value.length > 20 ? (
                                    `${lead.lead_source_value.substring(0, 20)}...`
                                  ) : (
                                    lead.lead_source_value
                                  )}
                                </span>
                              )}
                            </div>
                          </span>
                          {lead.contacts && lead.contacts.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{lead.contacts[0].contact_name}</span>
                              <span>•</span>
                              <span>{lead.contacts[0].email}</span>
                            </>
                          )}
                          {lead.probability && (
                            <>
                              <span>•</span>
                              <span>{lead.probability}% probability</span>
                            </>
                          )}
                        </div>

                        {lead.project_title && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {lead.project_title}
                            </h4>
                            {lead.project_description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {lead.project_description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end space-y-2">
                        {lead.expected_close_date && (
                          <div className="text-sm text-gray-500">
                            Expected: {formatToIST(lead.expected_close_date)}
                          </div>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {lead.client_name}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteLead(lead.id, lead.client_name)
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

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {lead.company && <span>Company: {lead.company}</span>}
                        {lead.category && (
                          <span>Category: {lead.category}</span>
                        )}
                      </div>
                      <div>Created: {formatToIST(lead.created_at)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )
        ) : /* Saved Drafts Tab */
        partialSavesLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-center">Loading saved drafts...</div>
            </CardContent>
          </Card>
        ) : partialSaves.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No saved drafts
              </h3>
              <p className="text-gray-600 mb-4">
                Start creating a lead and use "Save Progress" to save your work.
              </p>
              <Button onClick={handleCreateLead}>
                <Plus className="w-4 h-4 mr-2" />
                Create Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          partialSaves.map((partialSave: any) => {
            const info = getPartialSaveInfo(partialSave);
            const lastSaved = new Date(info.lastSaved);
            const timeSince = Math.floor(
              (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60),
            ); // hours

            return (
              <Card
                key={partialSave.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {partialSave.client_name ===
                          "PARTIAL_SAVE_IN_PROGRESS"
                            ? "Unsaved Lead Draft"
                            : partialSave.client_name || "Untitled Draft"}
                        </h3>
                        <Badge className="text-xs bg-yellow-100 text-yellow-700">
                          DRAFT
                        </Badge>
                        {info.completedTabs.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {info.completedTabs[0]} tab
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {timeSince < 1
                              ? "Saved less than 1 hour ago"
                              : timeSince < 24
                                ? `Saved ${timeSince} hours ago`
                                : `Saved ${Math.floor(timeSince / 24)} days ago`}
                          </span>
                        </span>

                        {partialSave.project_title &&
                          partialSave.project_title !==
                            "Partial Save - In Progress" && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">
                                {partialSave.project_title}
                              </span>
                            </>
                          )}

                        {partialSave.lead_source && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {partialSave.lead_source.replace("-", " ")}
                            </span>
                          </>
                        )}
                      </div>

                      {partialSave.project_description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {partialSave.project_description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              const notes = JSON.parse(
                                partialSave.notes || "{}",
                              );
                              const originalData = notes.originalData || {};

                              // Helper function to safely parse JSON strings
                              const safeJsonParse = (
                                jsonString: string,
                                fallback: any = [],
                              ) => {
                                try {
                                  return JSON.parse(jsonString || "[]");
                                } catch {
                                  return fallback;
                                }
                              };

                              // Helper function to convert ISO date to YYYY-MM-DD format
                              const formatDateForInput = (dateValue: any) => {
                                if (!dateValue) return "";
                                if (
                                  typeof dateValue === "string" &&
                                  dateValue.includes("T")
                                ) {
                                  // ISO format, convert to YYYY-MM-DD using local timezone to avoid date shifts
                                  const date = new Date(dateValue);
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1,
                                  ).padStart(2, "0");
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  return `${year}-${month}-${day}`;
                                }
                                return dateValue; // Already in correct format
                              };

                              const resumeData = {
                                ...originalData,
                                // Override with database saved values, properly deserializing JSON fields
                                lead_source:
                                  partialSave.lead_source ||
                                  originalData.lead_source,
                                client_name:
                                  partialSave.client_name ===
                                  "PARTIAL_SAVE_IN_PROGRESS"
                                    ? ""
                                    : partialSave.client_name ||
                                      originalData.client_name,
                                project_title:
                                  partialSave.project_title ===
                                  "Partial Save - In Progress"
                                    ? ""
                                    : partialSave.project_title ||
                                      originalData.project_title,
                                project_description:
                                  partialSave.project_description ||
                                  originalData.project_description,
                                project_requirements:
                                  partialSave.project_requirements ||
                                  originalData.project_requirements,

                                // Deserialize JSON fields from database
                                solutions: safeJsonParse(
                                  partialSave.solutions,
                                  originalData.solutions || [],
                                ),
                                contacts: safeJsonParse(
                                  partialSave.contacts,
                                  originalData.contacts || [],
                                ),
                                flat_fee_config: safeJsonParse(
                                  partialSave.flat_fee_config,
                                  originalData.flat_fee_config || [],
                                ),
                                transaction_fee_config: safeJsonParse(
                                  partialSave.transaction_fee_config,
                                  originalData.transaction_fee_config || [],
                                ),

                                // Include other database fields
                                lead_created_by:
                                  partialSave.lead_created_by ||
                                  originalData.lead_created_by,
                                priority_level:
                                  partialSave.priority_level ||
                                  originalData.priority_level,
                                start_date: formatDateForInput(
                                  partialSave.start_date ||
                                    originalData.start_date,
                                ),
                                targeted_end_date: formatDateForInput(
                                  partialSave.targeted_end_date ||
                                    originalData.targeted_end_date,
                                ),
                                expected_close_date: formatDateForInput(
                                  partialSave.expected_close_date ||
                                    originalData.expected_close_date,
                                ),
                                expected_daily_txn_volume:
                                  partialSave.expected_daily_txn_volume ||
                                  originalData.expected_daily_txn_volume,
                                expected_daily_txn_volume_year1:
                                  partialSave.expected_daily_txn_volume_year1 ||
                                  originalData.expected_daily_txn_volume_year1,
                                expected_daily_txn_volume_year2:
                                  partialSave.expected_daily_txn_volume_year2 ||
                                  originalData.expected_daily_txn_volume_year2,
                                expected_daily_txn_volume_year3:
                                  partialSave.expected_daily_txn_volume_year3 ||
                                  originalData.expected_daily_txn_volume_year3,
                                expected_daily_txn_volume_year5:
                                  partialSave.expected_daily_txn_volume_year5 ||
                                  originalData.expected_daily_txn_volume_year5,
                                spoc: partialSave.spoc || originalData.spoc,
                                billing_currency:
                                  partialSave.billing_currency ||
                                  originalData.billing_currency,
                                client_type:
                                  partialSave.client_type ||
                                  originalData.client_type,
                                company_location:
                                  partialSave.company_location ||
                                  originalData.company_location,
                                category:
                                  partialSave.category || originalData.category,
                                country:
                                  partialSave.country || originalData.country,
                                probability:
                                  partialSave.probability ||
                                  originalData.probability,
                                template_id:
                                  partialSave.template_id ||
                                  originalData.template_id,
                                notes: originalData.notes, // Keep the original notes for form use

                                id: partialSave.id, // This is the key field that CreateLead looks for
                                _resumeFromId: partialSave.id,
                                _lastSaved: notes.lastSaved,
                                _completedTabs: notes.completedTabs,
                              };

                              handleResumePartialSave(resumeData);
                            } catch (error) {
                              console.error(
                                "Error resuming partial save:",
                                error,
                              );
                              alert(
                                "Error loading saved data. Please try again.",
                              );
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Saved Draft
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this saved
                                draft? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeletePartialSave(
                                    partialSave.id,
                                    partialSave.client_name ===
                                      "PARTIAL_SAVE_IN_PROGRESS"
                                      ? "Unsaved Lead Draft"
                                      : partialSave.client_name ||
                                          "Untitled Draft",
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Draft
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="text-sm text-gray-500">
                        Created: {formatToIST(partialSave.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
