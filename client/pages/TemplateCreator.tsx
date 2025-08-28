import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTemplate } from "@/hooks/useApi";
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
import { Plus, ArrowLeft, Trash2, Save } from "lucide-react";

interface TemplateStep {
  id: string;
  name: string;
  description: string;
}

export default function TemplateCreator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createTemplateMutation = useCreateTemplate();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [newStepDialog, setNewStepDialog] = useState(false);
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

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
        created_by: parseInt(user?.id || "1"),
        steps: steps.map((step, index) => ({
          step_order: index + 1,
          name: step.name.trim(),
          description: step.description.trim(),
          default_eta_days: 3, // Default value
          auto_alert: false,
          email_reminder: false,
        })),
      };

      console.log("Creating template with data:", templateData);
      console.log("User ID:", user?.id);

      await createTemplateMutation.mutateAsync(templateData);
      navigate("/admin");
    } catch (error) {
      console.error("Failed to create template:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    if (newStep.name.trim() && newStep.description.trim()) {
      const step: TemplateStep = {
        id: Date.now().toString(),
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Template
          </h1>
          <p className="text-gray-600 mt-1">
            Create a template with custom steps for your sales process
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
                  Create custom steps for this template
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
                  Create custom steps to define your sales process
                </p>
                <Button onClick={() => setNewStepDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                            {index + 1}
                          </div>
                          <h3 className="font-medium text-gray-900">
                            {step.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 ml-11">
                          {step.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
            {saving ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
