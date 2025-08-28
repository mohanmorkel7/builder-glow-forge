import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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

interface TemplateCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

interface TemplateStep {
  id: string;
  name: string;
  description: string;
  probability_percent: number;
}

interface CreateTemplateDialogProps {
  onSuccess: () => void;
  categories: TemplateCategory[];
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

export default function CreateTemplateDialogSimple({
  onSuccess,
  categories,
}: CreateTemplateDialogProps) {
  const { user } = useAuth();
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category_id: "",
    template_type_id: "",
    tags: [] as string[],
  });

  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTemplate(data),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
  });

  const resetForm = () => {
    setTemplateData({
      name: "",
      description: "",
      category_id: "",
      template_type_id: "",
      tags: [],
    });
    setSteps([]);
    setNewTag("");
    setActiveTab("basic");
  };

  const handleSubmit = () => {
    const submitData = {
      ...templateData,
      category_id: templateData.category_id
        ? parseInt(templateData.category_id)
        : undefined,
      template_type_id: templateData.template_type_id
        ? parseInt(templateData.template_type_id)
        : undefined,
      created_by: parseInt(user?.id || "1"),
      steps: steps.map((step, index) => ({
        step_order: index + 1,
        name: step.name,
        description: step.description,
        default_eta_days: 3,
        auto_alert: false,
        email_reminder: false,
        approval_required: false,
        parallel_execution: false,
        probability_percent: step.probability_percent || 0,
      })),
    };

    createTemplateMutation.mutate(submitData);
  };

  const addStep = () => {
    const newStep: TemplateStep = {
      id: Date.now().toString(),
      name: "",
      description: "",
      probability_percent: 0,
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

  return (
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
                    setTemplateData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const IconComponent = getCategoryIcon(category.icon);
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
                  <Button type="button" variant="outline" onClick={addTag}>
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
                  <li>• Break down complex processes into simple steps</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Template Steps</h3>
            <Button onClick={addStep} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
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
                            probability_percent: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="% probability"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={step.description}
                      onChange={(e) =>
                        updateStep(step.id, { description: e.target.value })
                      }
                      placeholder="Describe what needs to be done in this step"
                    />
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
                          steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) === 100
                            ? 'text-green-600'
                            : steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) > 100
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0)}%
                      </span>
                      <span className="text-gray-500">/ 100%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) === 100
                          ? 'bg-green-500'
                          : steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) > 100
                          ? 'bg-red-500'
                          : 'bg-orange-400'
                      }`}
                      style={{
                        width: `${Math.min(steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0), 100)}%`
                      }}
                    ></div>
                  </div>

                  {/* Status Messages */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      {steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) === 100 ? (
                        <span className="text-green-600 bg-green-100 px-2 py-1 rounded font-medium">
                          ✓ Perfect Distribution!
                        </span>
                      ) : steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) > 100 ? (
                        <span className="text-red-600 bg-red-100 px-2 py-1 rounded font-medium">
                          ⚠ Over 100% - Reduce by {steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0) - 100}%
                        </span>
                      ) : (
                        <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded font-medium">
                          📊 Remaining: {100 - steps.reduce((sum, step) => sum + (step.probability_percent || 0), 0)}%
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {steps.length} step{steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Individual Step Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex justify-between text-xs">
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
                          (c) => c.id.toString() === templateData.category_id,
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
                <Label>Tags ({templateData.tags.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {templateData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {templateData.tags.length === 0 && (
                    <span className="text-sm text-gray-500">No tags</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Steps ({steps.length})</Label>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-2 text-sm bg-gray-50 p-3 rounded"
                    >
                      <Badge variant="outline" className="text-xs mt-1">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{step.name}</div>
                        {step.description && (
                          <div className="text-gray-600 mt-1">
                            {step.description}
                          </div>
                        )}
                      </div>
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
        <Button variant="outline" onClick={resetForm}>
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !templateData.name.trim() ||
            steps.length === 0 ||
            createTemplateMutation.isPending
          }
        >
          <Save className="w-4 h-4 mr-2" />
          {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
