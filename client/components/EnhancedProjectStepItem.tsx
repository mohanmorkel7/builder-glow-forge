import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  Send,
  GripVertical,
  Paperclip,
  X,
  Users,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  Upload,
  Reply,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { FollowUpModal } from "./FollowUpModal";

interface EnhancedProjectStepItemProps {
  step: any;
  projectId: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateStatus: (stepId: number, status: string) => void;
  isDragOverlay?: boolean;
}

interface StepComment {
  id: number;
  user_name: string;
  user_id?: number;
  comment_text: string;
  comment_type: "comment" | "system" | "file";
  created_at: string;
  attachments?: any[];
}

export function EnhancedProjectStepItem({
  step,
  projectId,
  isExpanded,
  onToggleExpansion,
  onUpdateStatus,
  isDragOverlay = false,
}: EnhancedProjectStepItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Fetch step comments
  const { data: stepComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["project-step-comments", step.id],
    queryFn: () => apiClient.getProjectComments(projectId, step.id),
    enabled: isExpanded && !!step.id,
  });

  // Sort comments by created_at
  const sortedComments = React.useMemo(() => {
    return [...stepComments].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [stepComments]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (messagesContainerRef.current && sortedComments.length > 0) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [sortedComments]);

  const [newComment, setNewComment] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<StepComment | null>(
    null,
  );

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (commentData: any) =>
      apiClient.createProjectComment(projectId, {
        ...commentData,
        step_id: step.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-step-comments", step.id],
      });
      setNewComment("");
      setStagedAttachments([]);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return PlayCircle;
      case "blocked":
        return PauseCircle;
      case "cancelled":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "blocked":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingFiles(true);
    try {
      const uploadResult = await apiClient.uploadFiles(files);

      if (!uploadResult.success) {
        throw new Error("File upload failed");
      }

      const newAttachments = uploadResult.files.map((file: any) => ({
        file_name: file.originalName,
        file_path: file.path,
        file_size: file.size,
        file_type: file.mimetype,
        server_filename: file.filename,
      }));

      setStagedAttachments((prev) => [...prev, ...newAttachments]);
      event.target.value = "";
    } catch (error) {
      console.error("Failed to upload files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendComment = async () => {
    if ((!newComment.trim() && stagedAttachments.length === 0) || !user) return;

    const commentText = newComment.trim() || "📎 File attachment";

    const commentData = {
      comment_text: commentText,
      comment_type: "comment" as const,
      is_internal: false,
      created_by: parseInt(user.id),
      user_name: user.name || "Current User",
      attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
    };

    addCommentMutation.mutate(commentData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFollowUp = async (comment: StepComment) => {
    if (!user) return;

    setSelectedComment(comment);
    setFollowUpModalOpen(true);
  };

  const StatusIcon = getStatusIcon(step.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white transition-all duration-200 hover:shadow-md ${
        isDragOverlay ? "shadow-2xl scale-105 border-blue-300" : ""
      } ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <div className="flex items-center space-x-4 p-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Drag to reorder step"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Status Icon */}
          <div
            className={`flex-shrink-0 p-2 rounded-full ${getStatusColor(step.status)}`}
          >
            <StatusIcon className="w-4 h-4" />
          </div>

          <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {step.step_name}
                </span>
                <Badge variant="outline">Step {step.step_order}</Badge>
                {sortedComments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {sortedComments.length} comment
                    {sortedComments.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {step.step_description && (
                <div className="text-sm text-gray-600 mt-1">
                  {step.step_description}
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {step.assigned_user_name && (
                  <span>Assigned: {step.assigned_user_name}</span>
                )}
                {step.estimated_hours && (
                  <span>Est: {step.estimated_hours}h</span>
                )}
                {step.due_date && (
                  <span>Due: {format(new Date(step.due_date), "MMM d")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400 italic">
                Click to {isExpanded ? "collapse" : "expand"}
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </CollapsibleTrigger>

          {/* Status Update Dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={step.status}
              onValueChange={(value) => onUpdateStatus(step.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t bg-gray-50">
            <div className="p-4">
              {/* Chat Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Step Communication
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Collaborate and track progress for this step
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {sortedComments.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {sortedComments.length} message
                          {sortedComments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comments List */}
                  <div
                    ref={messagesContainerRef}
                    className="space-y-3 max-h-96 overflow-y-auto"
                  >
                    {commentsLoading && (
                      <div className="text-center py-4 text-gray-500">
                        Loading comments...
                      </div>
                    )}
                    {!commentsLoading && sortedComments.length > 0
                      ? sortedComments.map((comment: StepComment) => (
                          <div
                            key={comment.id}
                            className={`flex space-x-3 p-3 rounded border ${
                              comment.comment_type === "system"
                                ? "bg-blue-50 border-blue-200"
                                : comment.user_id === parseInt(user?.id || "0")
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                comment.comment_type === "system"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                              }`}
                            >
                              {comment.comment_type === "system"
                                ? "⚙"
                                : (comment.user_name || "?").charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {comment.user_id === parseInt(user?.id || "0")
                                    ? "Me"
                                    : comment.user_name || "Unknown User"}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {format(
                                      new Date(comment.created_at),
                                      "MMM d, h:mm a",
                                    )}
                                  </span>
                                  {comment.comment_type !== "system" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleFollowUp(comment)}
                                      className="text-blue-600 hover:text-blue-700 h-6 px-2 text-xs"
                                    >
                                      <Reply className="w-3 h-3 mr-1" />
                                      Follow-up
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {comment.comment_text}
                              </div>
                              {comment.attachments &&
                                comment.attachments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {comment.attachments.map(
                                      (attachment, index) => (
                                        <div
                                          key={index}
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
                                                    attachment.file_name;
                                                  document.body.appendChild(
                                                    link,
                                                  );
                                                  link.click();
                                                  document.body.removeChild(
                                                    link,
                                                  );
                                                  window.URL.revokeObjectURL(
                                                    url,
                                                  );
                                                } else {
                                                  throw new Error(
                                                    "Download failed",
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  "Download failed:",
                                                  error,
                                                );
                                                alert(
                                                  "Download failed. File may not be available.",
                                                );
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
                        ))
                      : !commentsLoading && (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No comments yet. Start the conversation!
                          </p>
                        )}
                  </div>

                  {/* Rich Text Editor */}
                  <div className="border-t bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 font-medium">
                          💬 Add Comment
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFiles}
                          className="h-8 px-3 text-xs"
                        >
                          {uploadingFiles ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 mr-1" />
                          )}
                          {uploadingFiles ? "Uploading..." : "Attach"}
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
                              key={index}
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
                                  ({formatFileSize(attachment.file_size)})
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
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Add a detailed comment for this step..."
                        className="min-h-[100px] border-gray-200"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Press Ctrl+Enter to send
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSendComment}
                        disabled={
                          (!newComment.trim() &&
                            stagedAttachments.length === 0) ||
                          addCommentMutation.isPending
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                      >
                        {addCommentMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => {
          setFollowUpModalOpen(false);
          setSelectedComment(null);
        }}
        projectId={projectId}
        stepId={step.id}
        stepName={step.step_name}
        messageId={selectedComment?.id}
        commentText={selectedComment?.comment_text}
      />
    </div>
  );
}
