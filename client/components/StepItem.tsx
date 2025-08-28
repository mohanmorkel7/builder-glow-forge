import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import {
  useStepDocuments,
  useStepComments,
  useUploadStepDocument,
  useCreateStepComment,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { formatToISTDateTime } from "@/lib/dateUtils";

interface StepItemProps {
  step: any;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateStatus: (stepId: number, status: string) => void;
  onDeleteStep: (stepId: number) => void;
}

export function StepItem({
  step,
  isExpanded,
  onToggleExpansion,
  onUpdateStatus,
  onDeleteStep,
}: StepItemProps) {
  const { user } = useAuth();

  // Safety check: only fetch data if step.id exists
  const stepId = step?.id;
  const { data: documents = [], isLoading: documentsLoading } =
    useStepDocuments(stepId || 0);
  const { data: comments = [], isLoading: commentsLoading } = useStepComments(
    stepId || 0,
  );
  const uploadDocumentMutation = useUploadStepDocument();
  const createCommentMutation = useCreateStepComment();

  // Don't render if step is invalid
  if (!step || !stepId) {
    return null;
  }

  const [newComment, setNewComment] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];

    try {
      const documentData = {
        name: file.name,
        file_path: `/uploads/${file.name}`,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: `${user.first_name} ${user.last_name}`,
      };

      await uploadDocumentMutation.mutateAsync({
        stepId: stepId,
        documentData,
      });
      event.target.value = "";
    } catch (error) {
      console.error("Failed to upload document:", error);
    }
  };

  const handleAddComment = async () => {
    const comment = newComment.trim();
    if (!comment || !user) return;

    try {
      await createCommentMutation.mutateAsync({
        stepId: stepId,
        commentData: {
          message: comment,
          user_name: `${user.first_name} ${user.last_name}`,
          user_id: parseInt(user.id),
          comment_type: "note",
        },
      });
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <div className="border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <div className="flex items-center space-x-4 p-4">
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
                <span className="font-medium text-gray-900">{step.name}</span>
                <div className="flex items-center space-x-2">
                  {documents.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {documents.length} doc{documents.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {comments.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {comments.length} comment
                      {comments.length !== 1 ? "s" : ""}
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
                  `Completed on ${formatToISTDateTime(step.completed_date).split(",")[0]}`}
                {step.status !== "completed" &&
                  step.due_date &&
                  `Due: ${formatToISTDateTime(step.due_date).split(",")[0]}`}
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
              onValueChange={(value) => onUpdateStatus(stepId, value)}
            >
              <SelectTrigger className="w-32">
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
              onClick={() => onDeleteStep(stepId)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Documents</h4>
                  <div>
                    <input
                      type="file"
                      id={`file-upload-${stepId}`}
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        document
                          .getElementById(`file-upload-${stepId}`)
                          ?.click()
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No documents uploaded yet
                    </p>
                  ) : (
                    documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((doc.file_size / 1024 / 1024) * 10) /
                                10}{" "}
                              MB • {doc.uploaded_by} •{" "}
                              {formatToISTDateTime(doc.uploaded_at)}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Comments</h4>
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-white rounded border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatToISTDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.message}</p>
                      {comment.comment_type === "system" && (
                        <Badge variant="outline" className="text-xs mt-1">
                          System
                        </Badge>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
