import * as React from "react";
const { useState } = React;
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useClient,
  useUsers,
  useCreateStepChat,
  useCreateFollowUp,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { formatToISTDateTime } from "@/lib/dateUtils";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  User,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

const followUpTypes = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "document", label: "Document Review" },
  { value: "proposal", label: "Proposal Follow-up" },
  { value: "contract", label: "Contract Discussion" },
  { value: "onboarding", label: "Onboarding Task" },
  { value: "other", label: "Other" },
];

export default function FollowUpNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if this is a follow-up from chat (either lead or VC)
  const isFromChat = location.state?.fromChat;
  const isVC = location.state?.isVC;
  const context = location.state;

  // Check if we have a client ID in the route
  const hasClientId = id && !isNaN(parseInt(id));
  const clientId = hasClientId ? parseInt(id) : null;

  const {
    data: client,
    isLoading,
    error,
  } = useClient(clientId && !isFromChat ? clientId : 0);

  const { data: users = [] } = useUsers();
  const { user } = useAuth();
  const createChatMutation = useCreateStepChat();
  const createFollowUpMutation = useCreateFollowUp();

  const [followUp, setFollowUp] = useState({
    type: "call",
    title: "",
    description: "",
    priority: "medium",
    due_date: new Date(),
    assigned_to: "",
    notes: "",
    estimated_duration: 0,
  });

  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setFollowUp((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create the follow-up using the API
      const followUpData = {
        ...followUp,
        client_id: !isFromChat && hasClientId ? clientId : undefined,
        // Lead context
        lead_id: isFromChat && !isVC ? context?.leadId : undefined,
        step_id: isFromChat && !isVC ? context?.stepId : undefined,
        // VC context
        vc_id: isFromChat && isVC ? context?.vcId : undefined,
        vc_step_id: isFromChat && isVC ? context?.vcStepId : undefined,
        message_id: isFromChat ? context?.messageId : undefined,
        created_by: parseInt(user?.id || "0"),
        follow_up_type: followUp.type,
      };

      console.log("Creating follow-up:", followUpData);
      await createFollowUpMutation.mutateAsync(followUpData);

      // Create system message for chat follow-up with assigned user info
      if (isFromChat && context?.createSystemMessage && user) {
        const assignedUser = users.find(
          (u: any) => u.id.toString() === followUp.assigned_to,
        );
        const assignedUserName = assignedUser
          ? `${assignedUser.first_name} ${assignedUser.last_name}`
          : "Unassigned";

        const systemMessageData = {
          user_id: parseInt(user.id),
          user_name: user.name,
          message: `📋 Follow-up created for message #${context.messageId} | Assigned to: ${assignedUserName} | Time: ${formatToISTDateTime(new Date())}`,
          message_type: "system" as const,
          is_rich_text: false,
        };

        try {
          await createChatMutation.mutateAsync({
            stepId: context.stepId,
            chatData: systemMessageData,
            isVC: isVC,
          });
        } catch (chatError) {
          console.error("Failed to create system message:", chatError);
        }
      }

      // Navigate back based on context
      if (isFromChat) {
        if (isVC) {
          navigate(`/vc/${context?.vcId}`);
        } else {
          navigate(`/leads`);
        }
      } else if (hasClientId) {
        navigate(`/sales/client/${id}`);
      } else {
        navigate(`/follow-ups`);
      }
    } catch (error) {
      console.error("Failed to create follow-up:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isFromChat) {
      if (isVC) {
        navigate(`/vc/${context?.vcId}`);
      } else {
        navigate(`/leads`);
      }
    } else if (hasClientId) {
      navigate(`/sales/client/${id}`);
    } else {
      navigate(`/follow-ups`);
    }
  };

  if (!isFromChat && hasClientId && isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading client details...</div>
      </div>
    );
  }

  if (!isFromChat && hasClientId && (error || !client)) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading client details
        </div>
      </div>
    );
  }

  const clientData = client as any;
  const isFormValid = followUp.title.trim() && followUp.description.trim();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isFromChat
              ? isVC
                ? "Back to VC"
                : "Back to Leads"
              : hasClientId
                ? "Back to Client"
                : "Back to Follow-ups"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Schedule Follow-up
            </h1>
            <p className="text-gray-600">
              {isFromChat
                ? isVC
                  ? `Create a follow-up task for VC step: ${context?.stepName || "VC Step"}`
                  : `Create a follow-up task for step: ${context?.stepName || "Lead Step"}`
                : hasClientId
                  ? `Create a new follow-up task for ${clientData?.client_name || "Client"}`
                  : "Create a new follow-up task"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Follow-up
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Context Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isFromChat ? (
            <>
              Creating follow-up for {isVC ? "VC" : "lead"} step:{" "}
              <strong>{context?.stepName}</strong>
              {context?.messageId && ` (Message #${context.messageId})`}
            </>
          ) : hasClientId ? (
            <>
              Creating follow-up for <strong>{clientData?.client_name}</strong>
              {clientData?.contact_person &&
                ` (Contact: ${clientData.contact_person})`}
              {clientData?.email && ` - ${clientData.email}`}
            </>
          ) : (
            <>Creating a general follow-up task</>
          )}
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Details</CardTitle>
          <CardDescription>
            Provide details about the follow-up task you want to schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Follow-up Type</Label>
              <Select
                value={followUp.type}
                onValueChange={(value) => updateField("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {followUpTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={followUp.priority}
                onValueChange={(value) => updateField("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${priority.color.split(" ")[0]}`}
                        />
                        <span>{priority.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Follow-up Title *</Label>
            <Input
              id="title"
              value={followUp.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., Follow up on proposal discussion"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={followUp.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Provide details about what needs to be discussed or completed..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="due_date"
                  type="date"
                  value={
                    followUp.due_date
                      ? followUp.due_date.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateField(
                      "due_date",
                      e.target.value ? new Date(e.target.value) : new Date(),
                    )
                  }
                  className="pl-10"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Select
                value={followUp.estimated_duration.toString()}
                onValueChange={(value) =>
                  updateField("estimated_duration", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={followUp.assigned_to}
              onValueChange={(value) => updateField("assigned_to", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>
                        {user.first_name} {user.last_name} ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">
              Select a user to assign this follow-up to
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={followUp.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              placeholder="Any additional context or notes for this follow-up..."
            />
          </div>

          {!isFormValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fill in all required fields (Title and Description)
                before saving.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Preview</CardTitle>
          <CardDescription>
            Review how this follow-up will appear in the task list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {followUp.title || "Follow-up Title"}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {followUp.description ||
                    "Follow-up description will appear here"}
                </p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  priorityOptions.find((p) => p.value === followUp.priority)
                    ?.color || "bg-gray-100 text-gray-700"
                }`}
              >
                {priorityOptions.find((p) => p.value === followUp.priority)
                  ?.label || "Medium"}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Due:{" "}
                {followUp.due_date
                  ? followUp.due_date.toLocaleDateString()
                  : "No date set"}
              </span>
              <span>
                <Clock className="w-3 h-3 inline mr-1" />
                {followUp.estimated_duration === 0
                  ? "No duration"
                  : `${followUp.estimated_duration}min`}
              </span>
            </div>
            {followUp.assigned_to && (
              <p className="text-xs text-gray-500 mt-1">
                Assigned to:{" "}
                {
                  users.find(
                    (user: any) => user.id.toString() === followUp.assigned_to,
                  )?.first_name
                }{" "}
                {
                  users.find(
                    (user: any) => user.id.toString() === followUp.assigned_to,
                  )?.last_name
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
