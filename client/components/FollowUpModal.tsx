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
import { Calendar, Clock, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useUsers } from "@/hooks/useApi";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  stepId?: number;
  stepName?: string;
  messageId?: number;
  commentText?: string;
}

export function FollowUpModal({
  isOpen,
  onClose,
  projectId,
  stepId,
  stepName,
  messageId,
  commentText,
}: FollowUpModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: usersLoading } = useUsers();

  const [followUpData, setFollowUpData] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "",
    priority: "medium",
    assigned_to: "",
    follow_up_type: "task",
    reminder_date: "",
  });

  const createFollowUpMutation = useMutation({
    mutationFn: (data: any) => {
      // Create follow-up via API
      return apiClient.createProjectFollowUp(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-follow-ups", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-step-comments", stepId],
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to create follow-up:", error);
      alert("Failed to create follow-up. Please try again.");
    },
  });

  const resetForm = () => {
    setFollowUpData({
      title: "",
      description: "",
      due_date: "",
      due_time: "",
      priority: "medium",
      assigned_to: "",
      follow_up_type: "task",
      reminder_date: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!followUpData.title.trim()) {
      alert("Please enter a follow-up title");
      return;
    }

    const submitData = {
      ...followUpData,
      project_id: projectId,
      step_id: stepId,
      message_id: messageId,
      reference_text: commentText,
      created_by: parseInt(user?.id || "1"),
      context: {
        step_name: stepName,
        project_type: "product",
        source: "step_comment",
      },
    };

    createFollowUpMutation.mutate(submitData);
  };

  // Filter active users and format for dropdown
  const teamMembers = users
    .filter((user: any) => user.status === "active")
    .map((user: any) => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Create Follow-up
          </DialogTitle>
          <DialogDescription>
            Create a follow-up task for this step comment in project workflow
          </DialogDescription>
          {stepName && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <strong>Step:</strong> {stepName}
            </div>
          )}
          {commentText && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <strong>Reference:</strong> "{commentText.substring(0, 100)}..."
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor="title">Follow-up Title *</Label>
              <Input
                id="title"
                value={followUpData.title}
                onChange={(e) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g., Review implementation progress"
                required
              />
            </div>

            <div>
              <Label htmlFor="follow_up_type">Type</Label>
              <Select
                value={followUpData.follow_up_type}
                onValueChange={(value) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    follow_up_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={followUpData.priority}
                onValueChange={(value) =>
                  setFollowUpData((prev) => ({ ...prev, priority: value }))
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

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={followUpData.due_date}
                onChange={(e) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    due_date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="due_time">Due Time</Label>
              <Input
                id="due_time"
                type="time"
                value={followUpData.due_time}
                onChange={(e) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    due_time: e.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={followUpData.assigned_to}
                onValueChange={(value) =>
                  setFollowUpData((prev) => ({ ...prev, assigned_to: value }))
                }
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading ? "Loading users..." : "Select team member"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{member.name}</span>
                        <span className="text-xs text-gray-500 ml-2 capitalize">
                          {member.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={followUpData.description}
                onChange={(e) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what needs to be followed up on..."
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="reminder_date">Reminder Date (optional)</Label>
              <Input
                id="reminder_date"
                type="date"
                value={followUpData.reminder_date}
                onChange={(e) =>
                  setFollowUpData((prev) => ({
                    ...prev,
                    reminder_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFollowUpMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createFollowUpMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
