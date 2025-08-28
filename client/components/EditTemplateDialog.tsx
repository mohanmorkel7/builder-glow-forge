import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Settings,
  Package,
  Target,
  DollarSign,
  UserPlus,
  Headphones,
  Megaphone,
} from "lucide-react";

interface EditTemplateDialogProps {
  templateId: number | null;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
}

interface TemplateStep {
  id: string;
  name: string;
  description: string;
  default_eta_days: number;
  auto_alert: boolean;
  email_reminder: boolean;
  step_category_id?: number;
  assigned_role?: string;
  required_documents?: string[];
  approval_required: boolean;
  parallel_execution: boolean;
  probability_percent: number;
}

const iconMap = {
  Package,
  Target,
  DollarSign,
  UserPlus,
  Headphones,
  Megaphone,
  Settings,
};

const roles = ["admin", "sales", "product", "support", "finance"];

export default function EditTemplateDialog({
  templateId,
  isOpen,
  onClose,
  categories,
}: EditTemplateDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category_id: "",
    template_type_id: "",
    tags: [] as string[],
    is_active: true,
  });

  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Use fallback template data
  const getFallbackTemplate = (id: number) => {
    return {
      id,
      name: `Template ${id}`,
      description: `Sample template ${id} for offline editing`,
      category_id: id === 4 || id === 5 ? 6 : 2, // VC templates or Leads
      template_type_id: "1",
      tags: ["sample", "offline"],
      is_active: true,
      steps: [
        {
          id: "1",
          name: "Sample Step",
          description: "This is a sample step",
          default_eta_days: 3,
          auto_alert: true,
          email_reminder: true,
          probability_percent: 25,
        },
      ],
    };
  };

  // Fetch template data from API
  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      try {
        return await apiClient.request(`/templates-production/${templateId}`);
      } catch (error) {
        console.error("Failed to fetch template:", error);
        // Fallback to mock data if API fails
        return getFallbackTemplate(templateId);
      }
    },
    enabled: !!templateId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Update template:", data);
      try {
        const result = await apiClient.request(
          `/templates-production/${templateId}`,
          {
            method: "PUT",
            body: JSON.stringify(data),
          },
        );
        return { success: true, data: result };
      } catch (error) {
        console.error("Failed to update template:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
      queryClient.invalidateQueries({
        queryKey: ["templates-with-categories"],
      });
      onClose();
    },
    onError: (error) => {
      console.error("Template update failed:", error);
      alert("Failed to update template. Please try again.");
    },
  });

  // Load template data when it's fetched
  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name || "",
        description: template.description || "",
        category_id: template.category_id?.toString() || "",
        template_type_id: template.template_type_id?.toString() || "",
        tags: template.tags || [],
        is_active: template.is_active !== false,
      });

      // Convert template steps to editable format
      if (template.steps) {
        const editableSteps = template.steps.map(
          (step: any, index: number) => ({
            id: step.id?.toString() || Date.now().toString() + index,
            name: step.name || "",
            description: step.description || "",
            default_eta_days: step.default_eta_days || 3,
            auto_alert: step.auto_alert || false,
            email_reminder: step.email_reminder || false,
            step_category_id: step.step_category_id,
            assigned_role: step.assigned_role,
            required_documents: step.required_documents || [],
            approval_required: step.approval_required || false,
            parallel_execution: step.parallel_execution || false,
            probability_percent: step.probability_percent || 0,
          }),
        );
        setSteps(editableSteps);
      }
    }
  }, [template]);

  const handleSubmit = () => {
    const submitData = {
      ...templateData,
      category_id: templateData.category_id
        ? parseInt(templateData.category_id)
        : undefined,
      template_type_id: templateData.template_type_id
        ? parseInt(templateData.template_type_id)
        : undefined,
      steps: steps.map((step, index) => ({
        step_order: index + 1,
        name: step.name,
        description: step.description,
        default_eta_days: step.default_eta_days,
        auto_alert: step.auto_alert,
        email_reminder: step.email_reminder,
        step_category_id: step.step_category_id,
        assigned_role: step.assigned_role,
        required_documents: step.required_documents,
        approval_required: step.approval_required,
        parallel_execution: step.parallel_execution,
        probability_percent: step.probability_percent || 0,
      })),
    };

    updateTemplateMutation.mutate(submitData);
  };

  const addStep = () => {
    const newStep: TemplateStep = {
      id: Date.now().toString(),
      name: "",
      description: "",
      default_eta_days: 3,
      auto_alert: false,
      email_reminder: false,
      approval_required: false,
      parallel_execution: false,
      probability_percent: 0,
      required_documents: [],
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (stepId: string, updates: Partial<TemplateStep>) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step,
      ),
    );
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter((step) => step.id !== stepId));
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const index = steps.findIndex((step) => step.id === stepId);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < steps.length - 1)
    ) {
      const newSteps = [...steps];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      setSteps(newSteps);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !templateData.tags.includes(newTag.trim())) {
      setTemplateData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return Settings;
    return iconMap[iconName as keyof typeof iconMap] || Settings;
  };

  if (!templateId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading template...</div>
        ) : (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="steps">Steps ({steps.length})</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={templateData.name}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter template name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={3}
                        value={templateData.description}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe what this template is for"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={templateData.category_id}
                        onValueChange={(value) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            category_id: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => {
                            const IconComponent = getCategoryIcon(
                              category.icon,
                            );
                            return (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <IconComponent className="w-4 h-4" />
                                  {category.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={templateData.is_active}
                        onCheckedChange={(checked) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            is_active: !!checked,
                          }))
                        }
                      />
                      <Label htmlFor="is_active">Template is active</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTag}
                        >
                          Add
                        </Button>
                      </div>
                      {templateData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {templateData.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Template Guidelines</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Choose a clear, descriptive name</li>
                        <li>• Select the appropriate category</li>
                        <li>• Add relevant tags for easy searching</li>
                        <li>• Break down complex processes into steps</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Template Steps</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Total Probability: </span>
                      <span
                        className={`font-medium ${
                          steps.reduce(
                            (sum, step) =>
                              sum + (step.probability_percent || 0),
                            0,
                          ) === 100
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {steps.reduce(
                          (sum, step) => sum + (step.probability_percent || 0),
                          0,
                        )}
                        %
                      </span>
                      <span className="text-gray-500 ml-1">/ 100%</span>
                    </div>
                    <Button onClick={addStep} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Step {index + 1}</Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveStep(step.id, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveStep(step.id, "down")}
                                disabled={index === steps.length - 1}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteStep(step.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Step Name *</Label>
                            <Input
                              value={step.name}
                              onChange={(e) =>
                                updateStep(step.id, { name: e.target.value })
                              }
                              placeholder="Enter step name"
                            />
                          </div>
                          <div>
                            <Label>Assigned Role</Label>
                            <Select
                              value={step.assigned_role || ""}
                              onValueChange={(value) =>
                                updateStep(step.id, { assigned_role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role.charAt(0).toUpperCase() +
                                      role.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            rows={2}
                            value={step.description}
                            onChange={(e) =>
                              updateStep(step.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe what needs to be done in this step"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`probability-${step.id}`}>
                              Probability (%)
                            </Label>
                            <Input
                              id={`probability-${step.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={step.probability_percent || 0}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  probability_percent:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="% probability"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {steps.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No steps added yet. Click "Add Step" to get started.
                    </div>
                  )}

                  {/* Probability Total Calculation */}
                  {steps.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">
                            🎯 Probability Distribution
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xl font-bold ${
                                steps.reduce(
                                  (sum, step) =>
                                    sum + (step.probability_percent || 0),
                                  0,
                                ) === 100
                                  ? "text-green-600"
                                  : steps.reduce(
                                        (sum, step) =>
                                          sum + (step.probability_percent || 0),
                                        0,
                                      ) > 100
                                    ? "text-red-600"
                                    : "text-orange-600"
                              }`}
                            >
                              {steps.reduce(
                                (sum, step) =>
                                  sum + (step.probability_percent || 0),
                                0,
                              )}
                              %
                            </span>
                            <span className="text-gray-500">/ 100%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              steps.reduce(
                                (sum, step) =>
                                  sum + (step.probability_percent || 0),
                                0,
                              ) === 100
                                ? "bg-green-500"
                                : steps.reduce(
                                      (sum, step) =>
                                        sum + (step.probability_percent || 0),
                                      0,
                                    ) > 100
                                  ? "bg-red-500"
                                  : "bg-orange-400"
                            }`}
                            style={{
                              width: `${Math.min(
                                steps.reduce(
                                  (sum, step) =>
                                    sum + (step.probability_percent || 0),
                                  0,
                                ),
                                100,
                              )}%`,
                            }}
                          ></div>
                        </div>

                        {/* Status Messages */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            {steps.reduce(
                              (sum, step) =>
                                sum + (step.probability_percent || 0),
                              0,
                            ) === 100 ? (
                              <span className="text-green-600 bg-green-100 px-2 py-1 rounded font-medium">
                                ✓ Perfect Distribution!
                              </span>
                            ) : steps.reduce(
                                (sum, step) =>
                                  sum + (step.probability_percent || 0),
                                0,
                              ) > 100 ? (
                              <span className="text-red-600 bg-red-100 px-2 py-1 rounded font-medium">
                                ⚠ Over 100% - Reduce by{" "}
                                {steps.reduce(
                                  (sum, step) =>
                                    sum + (step.probability_percent || 0),
                                  0,
                                ) - 100}
                                %
                              </span>
                            ) : (
                              <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded font-medium">
                                📊 Remaining:{" "}
                                {100 -
                                  steps.reduce(
                                    (sum, step) =>
                                      sum + (step.probability_percent || 0),
                                    0,
                                  )}
                                %
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500">
                            {steps.length} step{steps.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Individual Step Breakdown */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                          {steps.map((step, index) => (
                            <div
                              key={step.id}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-600 truncate">
                                {index + 1}. {step.name}
                              </span>
                              <span className="font-medium text-gray-800">
                                {step.probability_percent || 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <p className="text-sm bg-gray-50 p-2 rounded">
                          {templateData.name || "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <p className="text-sm bg-gray-50 p-2 rounded">
                          {templateData.category_id
                            ? categories.find(
                                (c) =>
                                  c.id.toString() === templateData.category_id,
                              )?.name
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {templateData.description || "Not set"}
                      </p>
                    </div>

                    <div>
                      <Label>Steps ({steps.length})</Label>
                      <div className="space-y-2">
                        {steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded"
                          >
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="flex-1">{step.name}</span>
                            <span className="text-gray-500">
                              {step.default_eta_days}d
                            </span>
                            {step.assigned_role && (
                              <Badge variant="secondary" className="text-xs">
                                {step.assigned_role}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {steps.length === 0 && (
                          <span className="text-sm text-gray-500">
                            No steps defined
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !templateData.name.trim() ||
                  steps.length === 0 ||
                  updateTemplateMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {updateTemplateMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
