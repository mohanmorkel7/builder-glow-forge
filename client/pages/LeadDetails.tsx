import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLead,
  useLeadSteps,
  useCreateLeadStep,
  useReorderLeadSteps,
  useTemplate,
} from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import { DraggableStepsList } from "@/components/DraggableStepsList";
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
} from "lucide-react";

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

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const leadId = parseInt(id || "0");

  const { data: lead, isLoading, error } = useLead(leadId);
  const { data: leadSteps = [], isLoading: stepsLoading } =
    useLeadSteps(leadId);

  // Debug steps data
  React.useEffect(() => {
    if (leadSteps.length > 0) {
      console.log(
        "LeadDetails leadSteps:",
        leadSteps.map((s) => ({
          id: s.id,
          name: s.name,
          step_order: s.step_order,
        })),
      );

      // Check for duplicates at source
      const idCounts = {};
      leadSteps.forEach((step) => {
        idCounts[step.id] = (idCounts[step.id] || 0) + 1;
      });

      Object.entries(idCounts).forEach(([id, count]) => {
        if (count > 1) {
          console.error(
            `LeadDetails: Step ID ${id} appears ${count} times in leadSteps`,
          );
        }
      });
    }
  }, [leadSteps]);

  // Get template data if lead has a template_id
  const templateId = (lead as any)?.template_id;
  const { data: templateData, isLoading: templateLoading } = useTemplate(
    templateId || 0,
  );
  const createStepMutation = useCreateLeadStep();
  const reorderStepsMutation = useReorderLeadSteps();

  const [newStepDialog, setNewStepDialog] = useState(false);

  // Calculate completion percentage based on step completion or lead probability
  const calculateCompletionPercentage = () => {
    // If we have lead steps, calculate based on step completion with probability weights
    if (leadSteps && leadSteps.length > 0) {
      let totalCompletedProbability = 0;
      let totalStepProbability = 0;

      leadSteps.forEach((step) => {
        // Use step probability_percent from database (from template or manually set)
        const stepProbability = step.probability_percent || 0;
        totalStepProbability += stepProbability;

        if (step.status === "completed") {
          // Only count completed steps for progress
          totalCompletedProbability += stepProbability;
        }
        // In-progress, pending, cancelled, blocked steps contribute 0 to progress
        // pending, cancelled, blocked steps contribute 0
      });

      // Calculate percentage based on completed steps only (cumulative progress)
      if (totalStepProbability > 0) {
        // Show cumulative progress of completed steps only
        const percentage = Math.min(100, Math.round(totalCompletedProbability));

        console.log("🔍 DETAILED PROBABILITY CALCULATION:", {
          totalStepProbability,
          totalCompletedProbability,
          percentage,
          stepBreakdown: leadSteps.map((s) => {
            const prob = s.probability_percent || 0;
            let contribution = 0;
            if (s.status === "completed") contribution = prob;
            // Only completed steps contribute in new calculation

            return {
              name: s.name,
              status: s.status,
              probability_percent: prob,
              contribution: contribution,
            };
          }),
        });

        return percentage;
      }

      // If no probability weights set, fall back to equal distribution
      const completedSteps = leadSteps.filter(
        (step) => step.status === "completed",
      ).length;
      const inProgressSteps = leadSteps.filter(
        (step) => step.status === "in_progress",
      ).length;
      const totalSteps = leadSteps.length;

      return Math.round(
        ((completedSteps + inProgressSteps * 0.5) / totalSteps) * 100,
      );
    }

    // If no steps exist, use the lead's probability value
    return lead?.probability || 0;
  };

  const completionPercentage = calculateCompletionPercentage();
  const [expandedSteps, setExpandedSteps] = useState(new Set<number>());
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    due_date: "",
    probability_percent: "",
  });

  const handleBack = () => {
    navigate("/leads");
  };

  const handleEdit = () => {
    navigate(`/leads/${id}/edit`);
  };

  const handleAddStep = async () => {
    // Validate required fields
    if (!newStep.name.trim()) {
      alert("Step name is required");
      return;
    }
    if (!newStep.description.trim()) {
      alert("Step description is required");
      return;
    }

    // Validate probability doesn't exceed 100%
    const currentTotal = leadSteps
      ? leadSteps.reduce(
          (sum: number, step: any) => sum + (step.probability_percent || 0),
          0,
        )
      : 0;
    const newProbability = parseInt(newStep.probability_percent) || 0;
    const totalAfterAdd = currentTotal + newProbability;

    if (totalAfterAdd > 100) {
      alert(
        `Total probability cannot exceed 100%. Current total: ${currentTotal}%, Adding: ${newProbability}%, Total would be: ${totalAfterAdd}%`,
      );
      return;
    }

    try {
      const stepData = {
        name: newStep.name.trim(),
        description: newStep.description.trim(),
        due_date: newStep.due_date.trim() || undefined,
        estimated_days: 3, // Default value to satisfy API requirement
        probability_percent: newStep.probability_percent
          ? parseInt(newStep.probability_percent)
          : 0,
      };

      console.log("Creating step with data:", { leadId, stepData });
      const result = await createStepMutation.mutateAsync({
        leadId,
        stepData,
      });
      console.log("Step creation result:", result);

      setNewStep({
        name: "",
        description: "",
        due_date: "",
        probability_percent: "",
      });
      setNewStepDialog(false);
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
      await apiClient.deleteLeadStep(stepId);

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["lead-steps", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // Show success message
      alert("Step deleted successfully!");

      // Fallback refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to delete step:", error);
      alert("Failed to delete step. Please try again.");
    }
  };

  const handleReorderSteps = async (reorderedSteps: any[]) => {
    try {
      const stepOrders = reorderedSteps.map((step, index) => ({
        id: step.id,
        order: index + 1,
      }));

      await reorderStepsMutation.mutateAsync({
        leadId,
        stepOrders,
      });
    } catch (error) {
      console.error("Failed to reorder steps:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading lead details
        </div>
      </div>
    );
  }

  const leadData = lead as any;
  const SourceIcon =
    sourceIcons[leadData.lead_source as keyof typeof sourceIcons] || Zap;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {leadData.client_name}
              </h1>
              <Badge className="text-xs">{leadData.lead_id}</Badge>
              <Badge
                className={
                  statusColors[leadData.status as keyof typeof statusColors]
                }
              >
                {leadData.status.replace("-", " ")}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Lead Details &{" "}
              {templateLoading
                ? "Loading..."
                : templateData?.name
                  ? `${templateData.name} Pipeline`
                  : "Custom Sales Pipeline"}
            </p>
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
                    {leadSteps
                      ? leadSteps.filter((s) => s.status === "completed").length
                      : 0}{" "}
                    of {leadSteps?.length || 0} steps
                  </div>
                </div>
              </div>

              {/* Step-by-step breakdown */}
              {leadSteps && leadSteps.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <details className="cursor-pointer">
                    <summary className="hover:text-gray-800 select-none">
                      📊 View detailed progress breakdown
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded border space-y-1">
                      {leadSteps.map((step, index) => {
                        const stepProbability =
                          step.probability_percent || 100 / leadSteps.length;
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

              {/* Steps Preview */}
              {(() => {
                // Show only actual lead steps in preview
                const allSteps = leadSteps;

                // If no lead steps but template exists, show template as reference
                if (
                  allSteps.length === 0 &&
                  templateData?.steps &&
                  templateData.steps.length > 0
                ) {
                  const templateStepsPreview = templateData.steps.map(
                    (templateStep: any, index: number) => ({
                      ...templateStep,
                      id: `template-${templateStep.id}`,
                      isTemplate: true,
                      step_order: index + 1,
                      status: "pending",
                    }),
                  );

                  return (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
                      <div className="text-sm font-medium text-blue-700 mb-2">
                        📋 Template Steps Reference (
                        {templateStepsPreview.length} steps)
                      </div>
                      <div className="text-xs text-blue-600 mb-2">
                        These are template steps. Actual trackable steps will be
                        created when you start working on this lead.
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {templateStepsPreview.slice(0, 6).map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-center space-x-2 p-2 rounded text-xs bg-blue-100 border border-blue-200"
                          >
                            <div className="flex-shrink-0">
                              <span className="text-blue-500">📋</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium text-blue-800">
                                {step.name}
                              </div>
                              <div className="text-blue-600 text-xs">
                                Template
                              </div>
                            </div>
                          </div>
                        ))}
                        {templateStepsPreview.length > 6 && (
                          <div className="flex items-center justify-center p-2 bg-blue-100 rounded text-xs text-blue-600">
                            +{templateStepsPreview.length - 6} more template
                            steps
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Lead Information */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lead Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Overview</CardTitle>
              <CardDescription>
                Basic lead information and project details
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
                          className={`p-1 rounded ${sourceColors[leadData.lead_source as keyof typeof sourceColors]}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="capitalize">
                            {leadData.lead_source.replace("-", " ")}
                          </span>
                          {leadData.lead_source_value && (
                            <span
                              className="text-sm text-blue-600 hover:underline cursor-pointer"
                              title={leadData.lead_source_value}
                            >
                              {leadData.lead_source === "email" ? (
                                <a
                                  href={`mailto:${leadData.lead_source_value}`}
                                >
                                  {leadData.lead_source_value}
                                </a>
                              ) : leadData.lead_source === "phone" ||
                                leadData.lead_source === "cold-call" ? (
                                <a href={`tel:${leadData.lead_source_value}`}>
                                  {leadData.lead_source_value}
                                </a>
                              ) : leadData.lead_source === "website" ? (
                                <a
                                  href={
                                    leadData.lead_source_value.startsWith(
                                      "http",
                                    )
                                      ? leadData.lead_source_value
                                      : `https://${leadData.lead_source_value}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {leadData.lead_source_value}
                                </a>
                              ) : (
                                leadData.lead_source_value
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
                            leadData.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {leadData.status.charAt(0).toUpperCase() +
                          leadData.status.slice(1).replace("-", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Priority:
                      </span>
                      <Badge
                        className={
                          priorityColors[
                            leadData.priority as keyof typeof priorityColors
                          ]
                        }
                      >
                        {leadData.priority.charAt(0).toUpperCase() +
                          leadData.priority.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-600">
                        Probability:
                      </span>
                      <span className="text-gray-900">
                        {completionPercentage}%
                      </span>
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
                        {leadData.contacts &&
                        leadData.contacts.length > 0 &&
                        leadData.contacts[0].contact_name
                          ? leadData.contacts[0].contact_name
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Email:</span>
                      {leadData.contacts &&
                      leadData.contacts.length > 0 &&
                      leadData.contacts[0].email ? (
                        <a
                          href={`mailto:${leadData.contacts[0].email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {leadData.contacts[0].email}
                        </a>
                      ) : (
                        <span className="text-gray-900">Not provided</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {leadData.contacts &&
                        leadData.contacts.length > 0 &&
                        leadData.contacts[0].phone
                          ? leadData.contacts[0].phone
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">
                        Company:
                      </span>
                      <span className="text-gray-900">
                        {leadData.company || leadData.client_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {leadData.project_title && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Project Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">
                          Title:{" "}
                        </span>
                        <span className="text-gray-900">
                          {leadData.project_title}
                        </span>
                      </div>
                      {leadData.project_description && (
                        <div>
                          <span className="font-medium text-gray-600">
                            Description:{" "}
                          </span>
                          <span className="text-gray-900">
                            {leadData.project_description}
                          </span>
                        </div>
                      )}

                      {leadData.project_requirements && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600">
                            Requirements:{" "}
                          </span>
                          <span className="text-gray-900">
                            {leadData.project_requirements}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {leadData.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Notes:</span>
                    </div>
                    <div className="pl-6 text-gray-900 whitespace-pre-wrap">
                      {leadData.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sales Pipeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {templateLoading
                      ? "Loading..."
                      : templateData?.name
                        ? `${templateData.name} Pipeline`
                        : "Custom Sales Pipeline"}
                  </CardTitle>
                  <CardDescription>
                    {templateLoading
                      ? "Loading template details..."
                      : templateData?.description ||
                        "Manage lead-specific sales steps with rich communication"}
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
                        Create a custom step for this lead's sales process
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 overflow-y-auto flex-1 px-1">
                      {/* Consolidated Steps Probability Info */}
                      {(leadSteps && leadSteps.length > 0) ||
                      (templateData?.steps && templateData.steps.length > 0) ? (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-xs font-medium text-blue-900 mb-1">
                            📊 Steps Overview (
                            {templateData?.steps?.length || 0} steps,
                            {(() => {
                              console.log(
                                "=== ADD STEP MODAL TEMPLATE STEPS DEBUGGING ===",
                              );
                              console.log("Template data:", templateData);
                              console.log(
                                "Template steps:",
                                templateData?.steps,
                              );
                              const templateTotal = templateData?.steps
                                ? templateData.steps.reduce(
                                    (sum: number, step: any) => {
                                      console.log(
                                        `Template step "${step.name}" probability: ${step.probability_percent}%`,
                                      );
                                      return (
                                        sum + (step.probability_percent || 0)
                                      );
                                    },
                                    0,
                                  )
                                : 0;
                              const newStepProb =
                                parseInt(newStep.probability_percent) || 0;
                              const total = templateTotal + newStepProb;
                              console.log(
                                "Template total:",
                                templateTotal,
                                "New step prob:",
                                newStepProb,
                                "Final total:",
                                total,
                              );
                              return total;
                            })()}
                            % total
                            {(() => {
                              const templateTotal = templateData?.steps
                                ? templateData.steps.reduce(
                                    (sum: number, step: any) =>
                                      sum + (step.probability_percent || 0),
                                    0,
                                  )
                                : 0;
                              const newStepProb =
                                parseInt(newStep.probability_percent) || 0;
                              const total = templateTotal + newStepProb;
                              return (
                                total > 100 && (
                                  <span className="text-red-600 ml-1">
                                    ⚠️ Exceeds 100%
                                  </span>
                                )
                              );
                            })()}
                            )
                          </div>
                          <div className="text-xs text-blue-700 max-h-24 overflow-y-auto">
                            {/* Always show template steps from database */}
                            {templateData?.steps &&
                            templateData.steps.length > 0 ? (
                              <>
                                {templateData.steps.map(
                                  (step: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between py-0.5"
                                    >
                                      <span className="truncate mr-2">
                                        {step.name}
                                      </span>
                                      <span className="font-medium flex-shrink-0 text-blue-600">
                                        {step.probability_percent || 0}%
                                      </span>
                                    </div>
                                  ),
                                )}
                              </>
                            ) : (
                              <div className="text-gray-500 italic">
                                No template steps available
                              </div>
                            )}
                            {/* Show new step preview */}
                            {parseInt(newStep.probability_percent) > 0 && (
                              <div className="flex justify-between py-0.5 border-t border-blue-300 mt-1 pt-1">
                                <span className="truncate mr-2 italic">
                                  + {newStep.name || "New step"}
                                </span>
                                <span className="font-medium flex-shrink-0 text-orange-600">
                                  {newStep.probability_percent}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Show message when no steps exist */
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-xs text-gray-600 text-center">
                            No steps defined yet. Add the first step below.
                          </div>
                        </div>
                      )}

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
                          placeholder="e.g., Technical Demo"
                          className=""
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
                          className=""
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
                          <Label htmlFor="probabilityPercent">
                            Probability Weight (%)
                            <span className="text-xs text-gray-500 ml-1">
                              (Remaining:{" "}
                              {(() => {
                                const currentTotal = leadSteps
                                  ? leadSteps.reduce(
                                      (sum: number, step: any) =>
                                        sum + (step.probability_percent || 0),
                                      0,
                                    )
                                  : 0;
                                const remaining = Math.max(
                                  0,
                                  100 - currentTotal,
                                );
                                return remaining;
                              })()}
                              %)
                            </span>
                          </Label>
                          <Input
                            id="probabilityPercent"
                            type="number"
                            min="0"
                            max="100"
                            value={newStep.probability_percent}
                            onChange={(e) =>
                              setNewStep((prev) => ({
                                ...prev,
                                probability_percent: e.target.value,
                              }))
                            }
                            placeholder={(() => {
                              const currentTotal = leadSteps
                                ? leadSteps.reduce(
                                    (sum: number, step: any) =>
                                      sum + (step.probability_percent || 0),
                                    0,
                                  )
                                : 0;
                              const remaining = Math.max(0, 100 - currentTotal);
                              return remaining > 0 ? remaining.toString() : "0";
                            })()}
                          />
                        </div>
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
                          (leadSteps
                            ? leadSteps.reduce(
                                (sum: number, step: any) =>
                                  sum + (step.probability_percent || 0),
                                0,
                              )
                            : 0) +
                            (parseInt(newStep.probability_percent) || 0) >
                            100
                        }
                      >
                        Add Step
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Lead Steps Pipeline */}
              {(() => {
                // Only show actual lead steps in the draggable pipeline
                const allSteps = leadSteps;

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
                if (allSteps.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No lead steps yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {templateData?.steps && templateData.steps.length > 0
                          ? `This lead uses the "${templateData.name}" template. Create lead-specific steps to start tracking progress.`
                          : "Create custom steps to track your sales process for this lead."}
                      </p>
                      <div className="space-y-2">
                        <Button onClick={() => setNewStepDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lead Step
                        </Button>
                        {templateData?.steps &&
                          templateData.steps.length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 Tip: You can create lead-specific steps based
                              on the template, or add completely custom steps.
                            </div>
                          )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <DraggableStepsList
                      leadId={leadId}
                      steps={allSteps}
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
              <CardTitle>Lead Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {completionPercentage}% probability
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {leadData.expected_close_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Close:</span>
                    <span className="text-gray-900">
                      {new Date(
                        leadData.expected_close_date,
                      ).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
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
              {leadData.contacts &&
              leadData.contacts.length > 0 &&
              leadData.contacts[0].email ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `mailto:${leadData.contacts[0].email}?subject=Follow-up: ${leadData.project_title || leadData.client_name}&body=Hi ${leadData.contacts[0].contact_name},%0D%0A%0D%0AI wanted to follow up on our discussion regarding ${leadData.project_title || "your project"}...`,
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

              {leadData.contacts &&
              leadData.contacts.length > 0 &&
              leadData.contacts[0].phone ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() =>
                    window.open(`tel:${leadData.contacts[0].phone}`, "_self")
                  }
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call {leadData.contacts[0].contact_name}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
