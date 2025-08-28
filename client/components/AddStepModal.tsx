import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Target } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentStepCount: number;
}

export function AddStepModal({
  isOpen,
  onClose,
  projectId,
  currentStepCount,
}: AddStepModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [stepData, setStepData] = useState({
    step_name: "",
    step_description: "",
    estimated_hours: "",
    due_date: "",
    assigned_to: "",
    priority: "medium",
  });

  const createStepMutation = useMutation({
    mutationFn: (data: any) => {
      return apiClient.createProjectStep(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-project-details", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["workflow-projects"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to create step:", error);
      alert("Failed to create step. Please try again.");
    },
  });

  const resetForm = () => {
    setStepData({
      step_name: "",
      step_description: "",
      estimated_hours: "",
      due_date: "",
      assigned_to: "",
      priority: "medium",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!stepData.step_name.trim()) {
      alert("Please enter a step name");
      return;
    }

    const submitData = {
      ...stepData,
      step_order: currentStepCount + 1,
      status: "pending",
      estimated_hours: stepData.estimated_hours
        ? parseInt(stepData.estimated_hours)
        : undefined,
      assigned_to: stepData.assigned_to
        ? parseInt(stepData.assigned_to)
        : undefined,
      created_by: parseInt(user?.id || "1"),
    };

    createStepMutation.mutate(submitData);
  };

  const teamMembers = [
    { id: 2, name: "Alice Johnson" },
    { id: 3, name: "Bob Smith" },
    { id: 4, name: "Carol Davis" },
    { id: 5, name: "David Wilson" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Project Step
          </DialogTitle>
          <DialogDescription>
            Create a new step for this project. It will be added as step #
            {currentStepCount + 1}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="step_name">Step Name *</Label>
              <Input
                id="step_name"
                value={stepData.step_name}
                onChange={(e) =>
                  setStepData((prev) => ({
                    ...prev,
                    step_name: e.target.value,
                  }))
                }
                placeholder="e.g., Implement user authentication"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="step_description">Description</Label>
              <Textarea
                id="step_description"
                value={stepData.step_description}
                onChange={(e) =>
                  setStepData((prev) => ({
                    ...prev,
                    step_description: e.target.value,
                  }))
                }
                placeholder="Describe what needs to be done in this step..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={stepData.estimated_hours}
                onChange={(e) =>
                  setStepData((prev) => ({
                    ...prev,
                    estimated_hours: e.target.value,
                  }))
                }
                placeholder="e.g., 16"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={stepData.due_date}
                onChange={(e) =>
                  setStepData((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={stepData.assigned_to}
                onValueChange={(value) =>
                  setStepData((prev) => ({ ...prev, assigned_to: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={stepData.priority}
                onValueChange={(value) =>
                  setStepData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStepMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createStepMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Add Step
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
