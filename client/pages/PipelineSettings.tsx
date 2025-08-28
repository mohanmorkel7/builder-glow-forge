import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLead, useLeadSteps } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Save,
  Settings,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Target,
  Users,
} from "lucide-react";

const statusOptions = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-700",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

const stepTypes = [
  { value: "discovery", label: "Discovery & Requirements" },
  { value: "demo", label: "Product Demo" },
  { value: "proposal", label: "Proposal Preparation" },
  { value: "negotiation", label: "Negotiation" },
  { value: "contract", label: "Contract Finalization" },
  { value: "onboarding", label: "Client Onboarding" },
  { value: "custom", label: "Custom Step" },
];

export default function PipelineSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const leadId = parseInt(id || "0");

  const {
    data: lead,
    isLoading: leadLoading,
    error: leadError,
  } = useLead(leadId);
  const { data: leadSteps = [], isLoading: stepsLoading } =
    useLeadSteps(leadId);
  const leadData = location.state?.leadData || lead;

  const [pipelineSettings, setPipelineSettings] = useState({
    autoProgressSteps: true,
    requireApproval: false,
    emailNotifications: true,
    slackIntegration: false,
    defaultStepDuration: 3,
    escalationThreshold: 7,
  });

  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    type: "",
    estimated_days: 3,
    auto_alert: false,
    email_reminder: true,
  });

  const [saving, setSaving] = useState(false);

  const updateSetting = (field: string, value: any) => {
    setPipelineSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNewStep = (field: string, value: any) => {
    setNewStep((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would typically save the pipeline settings to a backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigate(`/leads/${id}`, {
        state: {
          message: "Pipeline settings updated successfully",
        },
      });
    } catch (error) {
      console.error("Failed to save pipeline settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/leads/${id}`);
  };

  const addNewStep = () => {
    if (newStep.name.trim()) {
      // In a real implementation, this would call an API
      console.log("Adding new step:", newStep);
      setNewStep({
        name: "",
        description: "",
        type: "",
        estimated_days: 3,
        auto_alert: false,
        email_reminder: true,
      });
    }
  };

  if (leadLoading || stepsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading pipeline settings...</div>
      </div>
    );
  }

  if (leadError || !leadData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading lead details
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pipeline Settings
            </h1>
            <p className="text-gray-600">
              Configure sales pipeline for {leadData.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-20">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lead Context */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configuring pipeline settings for{" "}
          <strong>{leadData.client_name}</strong>
          {leadData.project_title && (
            <>
              {" "}
              - <strong>{leadData.project_title}</strong>
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Pipeline Settings</CardTitle>
              <CardDescription>
                Configure how this lead's pipeline should behave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Progress Steps</Label>
                      <p className="text-sm text-gray-500">
                        Automatically move to next step when current is
                        completed
                      </p>
                    </div>
                    <Switch
                      checked={pipelineSettings.autoProgressSteps}
                      onCheckedChange={(checked) =>
                        updateSetting("autoProgressSteps", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Approval</Label>
                      <p className="text-sm text-gray-500">
                        Require manager approval for step completion
                      </p>
                    </div>
                    <Switch
                      checked={pipelineSettings.requireApproval}
                      onCheckedChange={(checked) =>
                        updateSetting("requireApproval", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Send email alerts for step updates
                      </p>
                    </div>
                    <Switch
                      checked={pipelineSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Slack Integration</Label>
                      <p className="text-sm text-gray-500">
                        Post updates to Slack channels
                      </p>
                    </div>
                    <Switch
                      checked={pipelineSettings.slackIntegration}
                      onCheckedChange={(checked) =>
                        updateSetting("slackIntegration", checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultDuration">
                      Default Step Duration (days)
                    </Label>
                    <Input
                      id="defaultDuration"
                      type="number"
                      min="1"
                      max="30"
                      value={pipelineSettings.defaultStepDuration}
                      onChange={(e) =>
                        updateSetting(
                          "defaultStepDuration",
                          parseInt(e.target.value),
                        )
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="escalationThreshold">
                      Escalation Threshold (days)
                    </Label>
                    <Input
                      id="escalationThreshold"
                      type="number"
                      min="1"
                      max="30"
                      value={pipelineSettings.escalationThreshold}
                      onChange={(e) =>
                        updateSetting(
                          "escalationThreshold",
                          parseInt(e.target.value),
                        )
                      }
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Alert when steps are overdue by this many days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Pipeline Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Current Pipeline Steps</CardTitle>
              <CardDescription>
                Manage and reorder the steps in this lead's sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadSteps.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pipeline steps yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add custom steps to create a sales pipeline for this lead
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Order</TableHead>
                      <TableHead>Step Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSteps.map((step: any, index: number) => (
                      <TableRow key={step.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                            <span className="font-medium">{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{step.name}</p>
                            {step.description && (
                              <p className="text-sm text-gray-500">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusOptions.find((s) => s.value === step.status)
                                ?.color || "bg-gray-100 text-gray-700"
                            }
                          >
                            {step.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {step.due_date ? (
                            new Date(step.due_date).toLocaleDateString(
                              "en-IN",
                              {
                                timeZone: "Asia/Kolkata",
                              },
                            )
                          ) : (
                            <span className="text-gray-400">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {step.assigned_user_name || (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingStep(step.id)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
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

          {/* Add New Step */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Step</CardTitle>
              <CardDescription>
                Create a new step in the sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stepName">Step Name</Label>
                  <Input
                    id="stepName"
                    value={newStep.name}
                    onChange={(e) => updateNewStep("name", e.target.value)}
                    placeholder="e.g., Technical Demo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="stepType">Step Type</Label>
                  <Select
                    value={newStep.type}
                    onValueChange={(value) => updateNewStep("type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select step type" />
                    </SelectTrigger>
                    <SelectContent>
                      {stepTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="stepDescription">Description</Label>
                <Textarea
                  id="stepDescription"
                  value={newStep.description}
                  onChange={(e) => updateNewStep("description", e.target.value)}
                  placeholder="Describe what needs to be done in this step"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="estimatedDays">Estimated Days</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    min="1"
                    value={newStep.estimated_days}
                    onChange={(e) =>
                      updateNewStep("estimated_days", parseInt(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={newStep.auto_alert}
                    onCheckedChange={(checked) =>
                      updateNewStep("auto_alert", checked)
                    }
                  />
                  <Label>Auto Alert</Label>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={newStep.email_reminder}
                    onCheckedChange={(checked) =>
                      updateNewStep("email_reminder", checked)
                    }
                  />
                  <Label>Email Reminder</Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={addNewStep} disabled={!newStep.name.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {leadSteps.length}
                  </div>
                  <div className="text-sm text-blue-600">Total Steps</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      leadSteps.filter(
                        (step: any) => step.status === "completed",
                      ).length
                    }
                  </div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pipeline Progress</span>
                  <span>
                    {leadSteps.length > 0
                      ? Math.round(
                          (leadSteps.filter(
                            (step: any) => step.status === "completed",
                          ).length /
                            leadSteps.length) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        leadSteps.length > 0
                          ? (leadSteps.filter(
                              (step: any) => step.status === "completed",
                            ).length /
                              leadSteps.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Target className="w-4 h-4 mr-2" />
                Reset Pipeline
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Assign All Steps
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Export Configuration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
