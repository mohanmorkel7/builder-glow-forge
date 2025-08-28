import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTemplate, useUpdateTemplate } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowLeft, Trash2, Save, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

interface TemplateStep {
  id: string;
  name: string;
  description: string;
  step_order?: number;
  order_position?: number;
}

// Sortable Step Item Component
function SortableStepItem({
  step,
  index,
  onDelete,
}: {
  step: TemplateStep;
  index: number;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-white ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                {index + 1}
              </div>
              <h3 className="font-medium text-gray-900">{step.name}</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">{step.description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(step.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TemplateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: templateData, isLoading: templateLoading } = useTemplate(
    parseInt(id || "0"),
  );
  const updateTemplateMutation = useUpdateTemplate();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [newStepDialog, setNewStepDialog] = useState(false);
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load template data when it becomes available
  useEffect(() => {
    if (templateData) {
      setTemplateName(templateData.name || "");
      setTemplateDescription(templateData.description || "");

      // Convert template steps to local format
      const convertedSteps = (templateData.steps || []).map(
        (step: any, index: number) => ({
          id: step.id?.toString() || index.toString(),
          name: step.name || "",
          description: step.description || "",
          step_order: step.step_order || step.order_position || index + 1,
        }),
      );

      // Sort steps by order
      convertedSteps.sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
      setSteps(convertedSteps);
    }
  }, [templateData]);

  if (templateLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">Loading template...</div>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/admin");
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || steps.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        steps: steps.map((step, index) => ({
          id: step.id === "new" ? undefined : parseInt(step.id),
          step_order: index + 1,
          name: step.name.trim(),
          description: step.description.trim(),
          default_eta_days: 3, // Default value
          auto_alert: false,
          email_reminder: false,
        })),
      };

      await updateTemplateMutation.mutateAsync({
        id: parseInt(id || "0"),
        templateData: templateData,
      });
      navigate("/admin");
    } catch (error) {
      console.error("Failed to update template:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    if (newStep.name.trim() && newStep.description.trim()) {
      const step: TemplateStep = {
        id: `new-${Date.now()}`,
        name: newStep.name.trim(),
        description: newStep.description.trim(),
      };
      setSteps([...steps, step]);
      setNewStep({ name: "", description: "" });
      setNewStepDialog(false);
    }
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((item) => item.id === active.id);
      const newIndex = steps.findIndex((item) => item.id === over.id);

      const newSteps = arrayMove(steps, oldIndex, newIndex);
      setSteps(newSteps);
    }

    setActiveId(null);
  };

  const activeStep = activeId
    ? steps.find((step) => step.id === activeId)
    : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          <p className="text-gray-600 mt-1">
            Modify template information and steps
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Enterprise Sales Process"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this template..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Template Steps</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage steps for this template
                </p>
              </div>
              <Dialog open={newStepDialog} onOpenChange={setNewStepDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Step</DialogTitle>
                    <DialogDescription>
                      Create a custom step for this template
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewStepDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStep}
                      disabled={
                        !newStep.name.trim() || !newStep.description.trim()
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
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No template steps yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add steps to define your sales process
                </p>
                <Button onClick={() => setNewStepDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={steps.map((step) => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <SortableStepItem
                        key={step.id}
                        step={step}
                        index={index}
                        onDelete={handleDeleteStep}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeStep ? (
                    <div className="border rounded-lg p-4 bg-white shadow-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                          <GripVertical className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                              {steps.findIndex((s) => s.id === activeStep.id) +
                                1}
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {activeStep.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 ml-11">
                            {activeStep.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || steps.length === 0 || saving}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Updating..." : "Update Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
