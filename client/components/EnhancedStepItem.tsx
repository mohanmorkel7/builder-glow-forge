import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  MessageCircle,
  Upload,
  Send,
  Trash2,
  GripVertical,
  Reply,
  Paperclip,
  X,
  Bold,
  Italic,
  Link,
  AlignLeft,
  List,
  Image,
  Eye,
  Edit,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useStepChats,
  useCreateStepChat,
  useEditStepChat,
  useDeleteStepChat,
  useCreateFollowUp,
  useUsers,
} from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import { formatToISTDateTime } from "@/lib/dateUtils";

interface EnhancedStepItemProps {
  step: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateStatus: (stepId: number, status: string) => void;
  onDeleteStep: (stepId: number) => void;
  isDragOverlay?: boolean;
  isVC?: boolean; // Flag to indicate if this is for VC (disables step-level chat)
}

interface ChatMessage {
  id: number;
  user_name: string;
  user_id?: number;
  message: string;
  is_rich_text: boolean;
  message_type: "text" | "file" | "system";
  created_at: string;
  attachments?: any[];
}

export function EnhancedStepItem({
  step,
  isExpanded,
  onToggleExpansion,
  onUpdateStatus,
  onDeleteStep,
  isDragOverlay = false,
  isVC = false,
}: EnhancedStepItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { data: users = [], isLoading: usersLoading } = useUsers();

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

  // Filter active users and format for dropdown
  const teamMembers = users
    .filter((user: any) => user.status === "active")
    .map((user: any) => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
    }));

  // Fetch real chat data from API (only for actual lead steps)
  // For manually added steps, isTemplate is undefined, so they should use their actual ID
  // For template steps, isTemplate is true, so they should use 0 (disabled)
  const stepId = step.isTemplate === true ? 0 : step.id;

  // Use step chat for both leads and VCs
  const {
    data: chatMessages = [],
    isLoading: chatLoading,
    error: chatError,
  } = useStepChats(stepId, isVC); // Pass isVC flag to determine endpoint
  const createChatMutation = useCreateStepChat();
  const editChatMutation = useEditStepChat();
  const deleteChatMutation = useDeleteStepChat();
  const createFollowUpMutation = useCreateFollowUp();

  // Sort messages by created_at in ascending order (latest last for bottom scroll)
  const sortedMessages = React.useMemo(() => {
    const sorted = [...chatMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    // Note: Message ID uniqueness is now ensured by proper MockDataService initialization

    return sorted;
  }, [chatMessages, step.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && sortedMessages.length > 0) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [sortedMessages]);

  // Debug logging
  React.useEffect(() => {
    if (chatError) {
      console.error("Chat loading error for step", step.id, ":", chatError);
    }
  }, [chatError, step.id]);

  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);

  // Follow-up related states
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpAssignTo, setFollowUpAssignTo] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  // Function to highlight mentions and make follow-up IDs clickable
  const processMessageContent = (messageText: string) => {
    if (!user) return messageText;

    let processedText = messageText;

    // Look for mentions of current user (case insensitive)
    const userNamePattern = new RegExp(`@${user.name}`, "gi");
    processedText = processedText.replace(
      userNamePattern,
      `<span class="bg-red-100 text-red-700 px-1 rounded font-medium">@${user.name}</span>`,
    );

    // Make follow-up IDs clickable (#13, #14, etc.)
    const followUpPattern = /#(\d+)/g;
    processedText = processedText.replace(
      followUpPattern,
      `<span class="follow-up-link bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium cursor-pointer hover:bg-blue-200"
        data-follow-up-id="$1"
        onclick="window.location.href='/follow-ups?id=$1'"
      >#$1</span>`,
    );

    return processedText;
  };

  // Don't render if step is invalid
  if (!step || !step.id) {
    return null;
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    // Check file size limits (50MB per file)
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > maxSizeBytes,
    );

    if (oversizedFiles.length > 0) {
      alert(
        `The following files are too large (max 50MB): ${oversizedFiles.map((f) => f.name).join(", ")}`,
      );
      event.target.value = "";
      return;
    }

    try {
      // Test the endpoint first
      console.log("Testing upload endpoint...");
      try {
        const testResult = await apiClient.testUploadEndpoint();
        console.log("Upload endpoint test result:", testResult);
      } catch (testError) {
        console.error("Upload endpoint test failed:", testError);
      }

      // Test upload format expectations
      console.log("Testing server upload format expectations...");
      try {
        const formatTest = await apiClient.testUploadFormat();
        console.log("Upload format test result:", formatTest);
        if (!formatTest.success) {
          console.warn(
            "⚠️ Server format test failed - proceeding with default field name",
          );
        }
      } catch (formatError) {
        console.error("Upload format test failed:", formatError);
      }

      // First, upload the actual files to the server
      console.log(
        "Uploading files to server...",
        Array.from(files).map((f) => ({ name: f.name, size: f.size })),
      );
      const uploadResult = await apiClient.uploadFiles(files);

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "File upload failed");
      }

      if (!uploadResult.files || uploadResult.files.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      console.log("Files uploaded successfully:", uploadResult.files);

      // Create attachments array with the uploaded file information
      const newAttachments = uploadResult.files.map((file: any) => ({
        file_name: file.originalName,
        file_path: file.path,
        file_size: file.size,
        file_type: file.mimetype,
        server_filename: file.filename,
      }));

      // Stage the attachments instead of immediately sending
      setStagedAttachments((prev) => [...prev, ...newAttachments]);
      event.target.value = "";

      console.log("Files staged for sending:", newAttachments);
    } catch (error: any) {
      console.error("Failed to upload files:", error);

      let errorMessage = "Failed to upload files. Please try again.";

      if (error.message) {
        // Use the error message from the API client
        errorMessage = error.message;
      }

      console.error("File upload error details:");
      console.error("- Error message:", error.message);
      console.error("- Error stack:", error.stack);
      console.error("- Files attempted:");
      Array.from(files).forEach((file, index) => {
        console.error(
          `  File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`,
        );
      });

      // Prevent error from bubbling up and potentially affecting auth state
      try {
        alert(errorMessage);
      } catch (alertError) {
        console.error("Could not show alert:", alertError);
      }

      event.target.value = "";

      // Prevent any navigation or state corruption
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && stagedAttachments.length === 0) || !user) return;

    const messageText = newMessage.trim() || "📎 File attachment";

    const chatData = {
      user_id: parseInt(user.id),
      user_name: user.name,
      message: messageText,
      message_type: "text" as const,
      is_rich_text: true,
      attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
    };

    try {
      console.log("Sending message to step:", step.id, "with data:", chatData);
      const result = await createChatMutation.mutateAsync({
        stepId: step.id,
        chatData,
        isVC,
      });
      console.log("Message sent successfully:", result);

      // Create follow-up if checkbox is checked
      if (
        createFollowUp &&
        (followUpNotes.trim() || followUpAssignTo || followUpDueDate)
      ) {
        try {
          const followUpData = {
            title: `Follow-up: ${step.name}`,
            description:
              followUpNotes.trim() || `Follow-up for message: ${messageText}`,
            priority: "medium" as const,
            status: "pending" as const,
            assigned_to: followUpAssignTo || user.id,
            due_date: followUpDueDate || undefined,
            ...(isVC
              ? { vc_id: step.vc_id, vc_step_id: step.id }
              : { lead_id: step.lead_id, step_id: step.id }),
            created_by: parseInt(user.id),
          };

          const followUpResult =
            await createFollowUpMutation.mutateAsync(followUpData);
          console.log("Follow-up created successfully:", followUpResult);

          // Add a system message to chat indicating follow-up was created
          const systemChatData = {
            user_id: parseInt(user.id),
            user_name: user.name,
            message: `📋 Follow-up task created: "${followUpData.title}" - Due: ${followUpDueDate || "No due date"} - Assigned to: ${followUpAssignTo || "Myself"}`,
            message_type: "system" as const,
            is_rich_text: false,
          };

          await createChatMutation.mutateAsync({
            stepId: step.id,
            chatData: systemChatData,
            isVC,
          });
        } catch (followUpError) {
          console.error("Failed to create follow-up:", followUpError);
          alert(
            "Message sent, but failed to create follow-up. Please create it manually.",
          );
        }
      }

      // Reset form
      setNewMessage("");
      setStagedAttachments([]);
      setCreateFollowUp(false);
      setFollowUpNotes("");
      setFollowUpAssignTo("");
      setFollowUpDueDate("");

      // Scroll to bottom after sending message (longer delay to ensure refetch completes)
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 500);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleFollowUp = async (messageId: number) => {
    if (!user) return;

    // Navigate to follow-up screen with message and step context
    // The system message will be created after the follow-up is saved with assignment info
    navigate(`/follow-up`, {
      state: {
        messageId,
        stepId: step.id,
        ...(isVC
          ? { vcId: step.vc_id, vcStepId: step.id }
          : { leadId: step.lead_id }),
        stepName: step.name,
        fromChat: true,
        createSystemMessage: true, // Flag to indicate system message should be created
        isVC: isVC, // Add flag to indicate if this is from VC context
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleEditMessage = (
    messageId: number,
    currentMessage: string,
    isRichText: boolean,
  ) => {
    setEditingMessageId(messageId);
    // For rich text messages, we keep the HTML content for the rich text editor
    // For plain text messages, we use the text as-is
    setEditMessageText(currentMessage);
  };

  const handleSaveEdit = async (
    messageId: number,
    originalIsRichText: boolean,
  ) => {
    if (!editMessageText.trim()) {
      alert("Message cannot be empty");
      return;
    }

    try {
      await editChatMutation.mutateAsync({
        chatId: messageId,
        updateData: {
          message: editMessageText.trim(),
          is_rich_text: originalIsRichText, // Preserve the original format
        },
        isVC,
      });
      setEditingMessageId(null);
      setEditMessageText("");
    } catch (error) {
      console.error("Failed to edit message:", error);
      alert("Failed to edit message. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText("");
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessageToDelete(messageId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await deleteChatMutation.mutateAsync({
        chatId: messageToDelete,
        isVC,
      });
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  const cancelDeleteMessage = () => {
    setDeleteConfirmOpen(false);
    setMessageToDelete(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white ${isDragOverlay ? "shadow-2xl" : ""}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <div className="flex items-center space-x-4 p-4">
          {/* Drag Handle */}
          <div
            {...(step.isTemplate ? {} : attributes)}
            {...(step.isTemplate ? {} : listeners)}
            className={`flex-shrink-0 ${
              step.isTemplate
                ? "text-gray-300 cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            }`}
            title={
              step.isTemplate
                ? "Template steps cannot be reordered"
                : "Drag to reorder"
            }
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {step.status === "completed" ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : step.status === "in_progress" ? (
              <Clock className="w-6 h-6 text-blue-600" />
            ) : (
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
            )}
          </div>

          <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${step.isTemplate ? "text-blue-700" : "text-gray-900"}`}
                >
                  {step.name}
                </span>
                <div className="flex items-center space-x-2">
                  {step.isTemplate && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                    >
                      📋 Template
                    </Badge>
                  )}
                  {step.probability_percent !== undefined &&
                    step.probability_percent !== null && (
                      <Badge variant="outline" className="text-xs">
                        {parseFloat(step.probability_percent).toString()}%
                        weight
                      </Badge>
                    )}
                  {!chatLoading && sortedMessages.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {sortedMessages.length} message
                      {sortedMessages.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {step.description}
              </div>
              <div className="text-sm text-gray-600">
                {step.status === "completed" &&
                  step.completed_date &&
                  `Completed on ${new Date(step.completed_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
                {step.status !== "completed" &&
                  step.due_date &&
                  `Due: ${new Date(step.due_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </CollapsibleTrigger>

          <div className="flex items-center space-x-2">
            <Select
              value={step.status}
              onValueChange={(value) => onUpdateStatus(step.id, value)}
              disabled={step.isTemplate}
            >
              <SelectTrigger
                className={`w-32 ${step.isTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !step.isTemplate && onDeleteStep(step.id)}
              className={`${
                step.isTemplate
                  ? "text-gray-400 cursor-not-allowed opacity-50"
                  : "text-red-600 hover:text-red-700"
              }`}
              disabled={step.isTemplate}
              title={
                step.isTemplate
                  ? "Template steps cannot be deleted"
                  : "Delete this step"
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t bg-gray-50">
            <div className="p-4">
              {/* Full Chat Functionality for All Steps */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Team Chat
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Real-time collaboration for this step
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
                      {sortedMessages.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {sortedMessages.length} messages
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chat Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="space-y-3 max-h-96 overflow-y-auto"
                  >
                    {chatLoading && (
                      <div className="text-center py-4 text-gray-500">
                        Loading messages...
                      </div>
                    )}
                    {chatError && (
                      <div className="text-center py-4 text-red-500">
                        Error loading messages: {chatError.message}
                      </div>
                    )}
                    {!chatLoading &&
                      !chatError &&
                      sortedMessages.map((message, index) => (
                        <div
                          key={`msg-${message.id}-${index}`}
                          className={`flex space-x-3 p-3 rounded border ${
                            message.message_type === "system"
                              ? "bg-blue-50 border-blue-200"
                              : message.user_id === parseInt(user.id)
                                ? "bg-green-50 border-green-200"
                                : "bg-white"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              message.message_type === "system"
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {message.message_type === "system"
                              ? "📋"
                              : message.user_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.user_id === parseInt(user.id)
                                  ? "Me"
                                  : message.user_name}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {formatToISTDateTime(message.created_at)}
                                </span>
                                {message.message_type !== "system" && (
                                  <>
                                    {/* Only show edit/delete for own messages */}
                                    {message.user_id === parseInt(user.id) && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            handleEditMessage(
                                              message.id,
                                              message.message,
                                              message.is_rich_text,
                                            )
                                          }
                                          className="text-gray-600 hover:text-gray-700"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            handleDeleteMessage(message.id)
                                          }
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleFollowUp(message.id)}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Reply className="w-3 h-3 mr-1" />
                                      Follow-up
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  {message.is_rich_text ? (
                                    <RichTextEditor
                                      value={editMessageText}
                                      onChange={setEditMessageText}
                                      placeholder="Edit your message with rich formatting..."
                                      className="min-h-[80px] border-gray-200"
                                    />
                                  ) : (
                                    <Textarea
                                      value={editMessageText}
                                      onChange={(e) =>
                                        setEditMessageText(e.target.value)
                                      }
                                      className="min-h-[60px]"
                                      placeholder="Edit your message..."
                                    />
                                  )}
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSaveEdit(
                                          message.id,
                                          message.is_rich_text,
                                        )
                                      }
                                      disabled={!editMessageText.trim()}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {message.is_rich_text ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: processMessageContent(
                                          message.message,
                                        ),
                                      }}
                                    />
                                  ) : (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: processMessageContent(
                                          message.message,
                                        ),
                                      }}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {message.attachments.map(
                                    (attachment, index) => (
                                      <div
                                        key={`attachment-${attachment.file_name}-${index}`}
                                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg border"
                                      >
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                          <Paperclip className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {attachment.file_name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(
                                              attachment.file_size,
                                            )}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-3 text-xs"
                                          onClick={async () => {
                                            try {
                                              const fileToDownload =
                                                attachment.server_filename ||
                                                attachment.file_name;
                                              console.log(
                                                `Attempting to download: ${fileToDownload}`,
                                              );

                                              // First try the API endpoint
                                              const response = await fetch(
                                                `/api/files/download/${fileToDownload}`,
                                              );

                                              if (response.ok) {
                                                const blob =
                                                  await response.blob();
                                                const url =
                                                  window.URL.createObjectURL(
                                                    blob,
                                                  );
                                                const link =
                                                  document.createElement("a");
                                                link.href = url;
                                                link.download =
                                                  attachment.file_name; // Use original name for download
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                                console.log(
                                                  `Successfully downloaded: ${attachment.file_name}`,
                                                );
                                                return;
                                              }

                                              // If API fails, try direct file access
                                              console.log(
                                                `API download failed (${response.status}), trying direct access...`,
                                              );

                                              const directResponse =
                                                await fetch(
                                                  `/uploads/${fileToDownload}`,
                                                );
                                              if (directResponse.ok) {
                                                const blob =
                                                  await directResponse.blob();
                                                const url =
                                                  window.URL.createObjectURL(
                                                    blob,
                                                  );
                                                const link =
                                                  document.createElement("a");
                                                link.href = url;
                                                link.download =
                                                  attachment.file_name; // Use original name for download
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                                console.log(
                                                  `Successfully downloaded via direct access: ${attachment.file_name}`,
                                                );
                                                return;
                                              }

                                              // If both fail, show user-friendly error
                                              throw new Error(
                                                `File '${attachment.file_name}' not found on server`,
                                              );
                                            } catch (error) {
                                              console.error(
                                                "Download failed:",
                                                error,
                                              );

                                              // Show user-friendly error message
                                              alert(
                                                `Download failed: ${error.message || "File not found"}\n\nThe file may have been moved or deleted.`,
                                              );

                                              // As a last resort, try to open the file in a new tab
                                              const fallbackLink =
                                                document.createElement("a");
                                              fallbackLink.href = `/uploads/${fileToDownload}`;
                                              fallbackLink.target = "_blank";
                                              fallbackLink.click();
                                            }
                                          }}
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    {!chatLoading &&
                      !chatError &&
                      sortedMessages.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">
                          {step.isTemplate
                            ? "Template steps don't have chat functionality. Create actual lead steps to start conversations."
                            : "No messages yet. Start the conversation!"}
                        </p>
                      )}
                  </div>

                  {/* Rich Text Editor - Only show for actual lead steps */}
                  {!step.isTemplate && (
                    <div className="border-t bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700 font-medium">
                            💬 Compose Message
                          </span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            multiple
                            accept="*/*"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload documents"
                            className="h-8 px-3 text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Attach
                          </Button>
                        </div>
                      </div>

                      {/* Staged Attachments Display */}
                      {stagedAttachments.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-2">
                            Files ready to send:
                          </div>
                          <div className="space-y-2">
                            {stagedAttachments.map((attachment, index) => (
                              <div
                                key={`staged-${attachment.file_name}-${index}`}
                                className="flex items-center justify-between p-2 bg-white border rounded"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                    📎
                                  </div>
                                  <span className="text-sm text-gray-700">
                                    {attachment.file_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({Math.round(attachment.file_size / 1024)}{" "}
                                    KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStagedAttachment(index)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <RichTextEditor
                          value={newMessage}
                          onChange={setNewMessage}
                          placeholder="Type your message with rich formatting..."
                          className="min-h-[80px] border-gray-200"
                        />
                      </div>

                      {/* Follow-up checkbox and form */}
                      <div className="mb-3 border-t border-gray-200 pt-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            id="create-followup"
                            checked={createFollowUp}
                            onCheckedChange={(checked) =>
                              setCreateFollowUp(checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="create-followup"
                            className="text-sm font-medium"
                          >
                            Create follow-up task
                          </Label>
                        </div>

                        {createFollowUp && (
                          <div className="space-y-3 pl-6 border-l-2 border-blue-200 bg-blue-50 p-3 rounded">
                            <div>
                              <Label
                                htmlFor="followup-notes"
                                className="text-sm font-medium"
                              >
                                Follow-up Notes
                              </Label>
                              <Input
                                id="followup-notes"
                                placeholder="Enter follow-up notes..."
                                value={followUpNotes}
                                onChange={(e) =>
                                  setFollowUpNotes(e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label
                                  htmlFor="followup-assign"
                                  className="text-sm font-medium"
                                >
                                  Assign To
                                </Label>
                                <Select
                                  value={followUpAssignTo}
                                  onValueChange={setFollowUpAssignTo}
                                  disabled={usersLoading}
                                >
                                  <SelectTrigger
                                    id="followup-assign"
                                    className="mt-1"
                                  >
                                    <SelectValue
                                      placeholder={
                                        usersLoading
                                          ? "Loading users..."
                                          : "Select assignee"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teamMembers.map((member) => (
                                      <SelectItem
                                        key={member.id}
                                        value={member.id.toString()}
                                      >
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

                              <div>
                                <Label
                                  htmlFor="followup-date"
                                  className="text-sm font-medium"
                                >
                                  Due Date
                                </Label>
                                <Input
                                  id="followup-date"
                                  type="date"
                                  value={followUpDueDate}
                                  onChange={(e) =>
                                    setFollowUpDueDate(e.target.value)
                                  }
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Press Ctrl+Enter to send
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={
                            !newMessage.trim() && stagedAttachments.length === 0
                          }
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Template Step Notice */}
                  {step.isTemplate && (
                    <div className="border-t bg-blue-50 p-4">
                      <div className="text-center text-blue-700">
                        <div className="text-sm font-medium mb-1">
                          📋 Template Step
                        </div>
                        <div className="text-xs text-blue-600">
                          This is a template step for reference. Create actual
                          lead steps to track progress and enable chat
                          functionality.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteMessage}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMessage}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
