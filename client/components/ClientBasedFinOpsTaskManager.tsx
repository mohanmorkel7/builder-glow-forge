import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Calendar,
  User,
  Timer,
  Save,
  X,
  Bell,
  MessageSquare,
  AlertCircle,
  Target,
  Users,
  Activity,
  Filter,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  addHours,
  addMinutes,
  isBefore,
  isAfter,
} from "date-fns";

// Helper function to extract name from "Name (email)" format or JSON stringified format
const extractNameFromValue = (value: string, depth: number = 0): string => {
  if (!value) return value;

  // Prevent infinite recursion
  if (depth > 5) {
    console.log("⚠️ Max recursion depth reached, returning:", value);
    return value;
  }

  console.log(
    `🔍 extractNameFromValue input (depth ${depth}):`,
    JSON.stringify(value),
  );

  // Handle malformed JSON objects like {"John Doe"} - extract content between braces
  if (value.startsWith("{") && value.endsWith("}")) {
    // First try normal JSON parsing
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        const values = Object.values(parsed);
        const firstString = values.find((v) => typeof v === "string");
        if (firstString) {
          console.log("✅ JSON object parsed:", firstString);
          return extractNameFromValue(firstString, depth + 1);
        }
      }
      if (typeof parsed === "string") {
        console.log("✅ JSON string parsed:", parsed);
        return extractNameFromValue(parsed, depth + 1);
      }
    } catch (e) {
      // If JSON parsing fails, try to extract content manually
      console.log("⚠️ JSON parsing failed, trying manual extraction");
      const content = value.slice(1, -1); // Remove { and }

      // Handle cases like {"John Doe"} where John Doe might be quoted or unquoted
      if (content.startsWith('"') && content.endsWith('"')) {
        const extracted = content.slice(1, -1); // Remove quotes
        console.log("✅ Manual extraction with quotes:", extracted);
        // Recursively parse in case there are more nested levels
        return extractNameFromValue(extracted, depth + 1);
      } else {
        // Handle unquoted content
        console.log("✅ Manual extraction without quotes:", content);
        // Recursively parse in case there are more nested levels
        return extractNameFromValue(content, depth + 1);
      }
    }
  }

  // Handle JSON stringified values like "{\"Sanjay Kumar\"}" or nested like "{"{\"Sanjay Kumar\"}"}"
  if (value.startsWith('"{') && value.endsWith('}"')) {
    try {
      const parsed = JSON.parse(value);
      console.log("✅ Stringified JSON parsed:", parsed);
      return typeof parsed === "string"
        ? extractNameFromValue(parsed, depth + 1)
        : value;
    } catch (e) {
      console.log("⚠️ Stringified JSON parsing failed");
    }
  }

  // Handle regular JSON strings like "Sanjay Kumar" (quoted strings)
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      console.log("✅ Quoted string parsed:", parsed);
      return typeof parsed === "string"
        ? extractNameFromValue(parsed, depth + 1)
        : value;
    } catch (e) {
      console.log("⚠️ Quoted string parsing failed");
    }
  }

  // Handle escaped quotes like \"Sanjay Kumar\"
  if (value.startsWith('\\"') && value.endsWith('\\"')) {
    const unescaped = value.slice(2, -2); // Remove \" and \"
    console.log("✅ Escaped quotes removed:", unescaped);
    return extractNameFromValue(unescaped, depth + 1);
  }

  // Handle "Name (email)" format
  const match = value.match(/^(.+)\s\([^)]+\)$/);
  if (match) {
    console.log("✅ Email format matched:", match[1]);
    return match[1];
  }

  console.log("✅ Returning original value:", value);
  return value;
};

// Helper function to convert name to "Name (email)" format
const convertNameToValueFormat = (name: string, users: any[]): string => {
  if (name.includes("(") && name.includes(")")) {
    return name; // Already in new format
  }
  const user = users.find((u) => `${u.first_name} ${u.last_name}` === name);
  return user ? `${name} (${user.email || "no-email"})` : `${name} (no-email)`;
};

// Time conversion utilities for AM/PM format
const convertTo12Hour = (time24: string): { time: string; period: string } => {
  if (!time24) return { time: "", period: "AM" };

  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const adjustedHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return {
    time: `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    period,
  };
};

const convertTo24Hour = (time12: string, period: string): string => {
  if (!time12) return "";

  const [hours, minutes] = time12.split(":").map(Number);
  let adjustedHours = hours;

  if (period === "PM" && hours !== 12) {
    adjustedHours = hours + 12;
  } else if (period === "AM" && hours === 12) {
    adjustedHours = 0;
  }

  return `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Enhanced interfaces with client integration
interface ClientBasedFinOpsSubTask {
  id: string;
  name: string;
  description?: string;
  start_time: string; // Daily start time (e.g., "05:00")
  order_position: number;
  status: "pending" | "in_progress" | "completed" | "delayed" | "overdue";
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  due_at?: string;
  delay_reason?: string;
  delay_notes?: string;
  alerts_sent?: string[];
}

interface ClientBasedFinOpsTask {
  id: number;
  task_name: string;
  description: string;
  client_id: number;
  client_name: string;
  assigned_to: string[]; // Changed to array for multiple assignments
  reporting_managers: string[];
  escalation_managers: string[];
  effective_from: string;
  duration: "daily" | "weekly" | "monthly";
  is_active: boolean;
  subtasks: ClientBasedFinOpsSubTask[];
  created_at: string;
  updated_at: string;
  created_by: string;
  last_run?: string;
  next_run?: string;
  status: "active" | "inactive" | "completed" | "overdue" | "delayed";
}

// Time Picker Component with AM/PM support
interface TimePickerWithAmPmProps {
  value: string; // 24-hour format (e.g., "14:30")
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function TimePickerWithAmPm({
  value,
  onChange,
  placeholder = "Select time",
  required = false,
}: TimePickerWithAmPmProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Convert current value to 12-hour format for display
  const { time: currentTime12, period: currentPeriod } = convertTo12Hour(value);

  // Generate time options for 12-hour format
  const timeOptions = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // 15-minute intervals
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeOptions.push(timeStr);
    }
  }

  // Filter time options based on search
  const filteredTimes = timeOptions.filter((time) =>
    time.includes(searchTerm.toLowerCase()),
  );

  const handleTimeSelect = (time12: string, period: string) => {
    const time24 = convertTo24Hour(time12, period);
    onChange(time24);
  };

  return (
    <div className="relative">
      <Select
        value={value ? `${currentTime12} ${currentPeriod}` : ""}
        onValueChange={(selected) => {
          const [time12, period] = selected.split(" ");
          handleTimeSelect(time12, period);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <div className="p-2 border-b">
            <Input
              placeholder="Search time (e.g., 9:00)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {["AM", "PM"].map((period) => (
              <div key={period}>
                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                  {period}
                </div>
                {filteredTimes.map((time) => (
                  <SelectItem
                    key={`${time}-${period}`}
                    value={`${time} ${period}`}
                    className="pl-6"
                  >
                    {time} {period}
                  </SelectItem>
                ))}
              </div>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

// Enhanced Sortable SubTask Component with inline status change
interface SortableSubTaskItemProps {
  subtask: ClientBasedFinOpsSubTask;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onStatusChange?: (
    subtaskId: string,
    status: string,
    delayReason?: string,
    delayNotes?: string,
  ) => void;
  isInline?: boolean;
}

function SortableSubTaskItem({
  subtask,
  index,
  onUpdate,
  onRemove,
  onStatusChange,
  isInline = false,
}: SortableSubTaskItemProps) {
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayNotes, setDelayNotes] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStatusChange = (newStatus: string) => {
    if (isInline && onStatusChange) {
      if (newStatus === "delayed") {
        setShowDelayDialog(true);
      } else {
        onStatusChange(subtask.id, newStatus);
      }
    } else {
      onUpdate(index, "status", newStatus);
    }
  };

  const handleDelaySubmit = () => {
    if (isInline && onStatusChange) {
      onStatusChange(subtask.id, "delayed", delayReason, delayNotes);
    }
    setShowDelayDialog(false);
    setDelayReason("");
    setDelayNotes("");
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="border rounded-lg p-4 bg-gray-50"
      >
        <div className="flex items-start gap-3">
          {!isInline && (
            <div {...attributes} {...listeners} className="mt-2 cursor-grab">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <div className="flex-1 space-y-3">
            {isInline ? (
              // Inline view for task management
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm break-words whitespace-pre-wrap">
                      {subtask.name}
                    </h4>
                    {subtask.description && (
                      <p className="text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap">
                        {subtask.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>
                        Start:{" "}
                        {(() => {
                          if (!subtask.start_time) return "Not set";
                          const { time, period } = convertTo12Hour(
                            subtask.start_time,
                          );
                          return time
                            ? `${time} ${period}`
                            : subtask.start_time;
                        })()}
                      </span>
                      {subtask.started_at && (
                        <span>
                          Started:{" "}
                          {format(new Date(subtask.started_at), "h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Select
                      value={subtask.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show delay information if present */}
                {subtask.status === "delayed" && subtask.delay_reason && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Delayed</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      <div>
                        <strong>Reason:</strong> {subtask.delay_reason}
                      </div>
                      {subtask.delay_notes && (
                        <div>
                          <strong>Notes:</strong> {subtask.delay_notes}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              // Form view for add/edit
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Subtask Name *</Label>
                  <Input
                    value={subtask.name || ""}
                    onChange={(e) => onUpdate(index, "name", e.target.value)}
                    placeholder="e.g., RBL DUMP VS TCP DATA (DAILY ALERT MAIL)"
                    required
                  />
                </div>

                <div>
                  <Label>Daily Start Time *</Label>
                  <TimePickerWithAmPm
                    value={subtask.start_time || ""}
                    onChange={(value) => onUpdate(index, "start_time", value)}
                    placeholder="Select start time"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={subtask.description || ""}
                    onChange={(e) =>
                      onUpdate(index, "description", e.target.value)
                    }
                    placeholder="Additional details about this subtask..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={subtask.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {!isInline && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Delay Reason Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delayed</DialogTitle>
            <DialogDescription>
              Please provide a reason for the delay. This will trigger
              notifications to reporting managers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Delay Reason *</Label>
              <Select value={delayReason} onValueChange={setDelayReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delay reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical_issue">
                    Technical Issue
                  </SelectItem>
                  <SelectItem value="data_unavailable">
                    Data Unavailable
                  </SelectItem>
                  <SelectItem value="external_dependency">
                    External Dependency
                  </SelectItem>
                  <SelectItem value="resource_constraint">
                    Resource Constraint
                  </SelectItem>
                  <SelectItem value="process_change">Process Change</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={delayNotes}
                onChange={(e) => setDelayNotes(e.target.value)}
                placeholder="Provide additional context about the delay..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelaySubmit} disabled={!delayReason}>
              Mark as Delayed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ClientBasedFinOpsTaskManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientBasedFinOpsTask | null>(
    null,
  );

  // Client creation states
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  ); // Default to today
  const [viewMode, setViewMode] = useState<"all" | "daily">("daily");

  // Show more/less states for subtasks
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Selected client from summary
  const [selectedClientFromSummary, setSelectedClientFromSummary] = useState<
    string | null
  >(null);

  // Search states for dropdowns
  const [assignedToSearch, setAssignedToSearch] = useState("");
  const [reportingManagerSearch, setReportingManagerSearch] = useState("");
  const [escalationManagerSearch, setEscalationManagerSearch] = useState("");

  // Real-time timer state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form state for creating/editing tasks
  const [taskForm, setTaskForm] = useState({
    task_name: "",
    description: "",
    client_id: "",
    assigned_to: [] as string[], // Changed to array for multiple assignments
    reporting_managers: [] as string[],
    escalation_managers: [] as string[],
    effective_from: new Date().toISOString().split("T")[0],
    duration: "daily" as "daily" | "weekly" | "monthly",
    is_active: true,
    subtasks: [] as ClientBasedFinOpsSubTask[],
  });

  // Fetch FinOps tasks with enhanced error handling
  const {
    data: finopsTasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client-finops-tasks"],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching FinOps tasks...");
        const result = await apiClient.getFinOpsTasks();
        console.log(
          "✅ FinOps tasks query successful:",
          Array.isArray(result) ? result.length : "unknown",
        );
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("❌ FinOps tasks query failed:", error);
        // Return empty array to prevent UI crashes
        return [];
      }
    },
    refetchInterval: 30000,
    retry: (failureCount, error) => {
      console.log(`🔄 FinOps tasks query retry ${failureCount}:`, error);
      // Only retry network errors, not server errors
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        return failureCount < 2; // Max 2 retries for network errors
      }
      return false; // Don't retry server errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 30000, // Consider data stale after 30 seconds
    onError: (error) => {
      console.error("🚨 FinOps tasks query error:", error);
    },
    onSuccess: (data) => {
      console.log("✅ FinOps tasks query success:", data?.length || 0, "tasks");
    },
  });

  // Real-time updates for SLA warnings
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch FinOps clients (separate from sales leads)
  const {
    data: rawClients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useQuery({
    queryKey: ["finops-clients"],
    queryFn: async () => {
      try {
        // Use dedicated FinOps clients API (not leads)
        const finopsClients = await apiClient.getFinOpsClients();
        return finopsClients;
      } catch (error) {
        console.error("❌ Error fetching FinOps clients:", error);
        // Return empty array if API fails
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Deduplicate clients at the component level to prevent dropdown duplicates
  const clients = React.useMemo(() => {
    const uniqueClients = rawClients.filter(
      (client: any, index: number, arr: any[]) => {
        const clientName =
          client.company_name || client.client_name || `Client ${client.id}`;
        const firstIndex = arr.findIndex((c: any) => {
          const cName = c.company_name || c.client_name || `Client ${c.id}`;
          return cName === clientName;
        });
        return firstIndex === index;
      },
    );
    console.log(
      "Raw clients count:",
      rawClients.length,
      "Unique clients count:",
      uniqueClients.length,
    );
    if (rawClients.length !== uniqueClients.length) {
      console.warn(
        "Duplicate clients detected and removed:",
        rawClients.length - uniqueClients.length,
        "\nDuplicates:",
        rawClients.filter((client: any, index: number) => {
          const clientName =
            client.company_name || client.client_name || `Client ${client.id}`;
          return !uniqueClients.some((uc: any) => {
            const ucName =
              uc.company_name || uc.client_name || `Client ${uc.id}`;
            return ucName === clientName && uc.id === client.id;
          });
        }),
      );
    }
    return uniqueClients;
  }, [rawClients]);

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.getUsers(),
  });

  // Mutations for CRUD operations
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiClient.createFinOpsTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }: { id: number; taskData: any }) =>
      apiClient.updateFinOpsTask(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
      setEditingTask(null);
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteFinOpsTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
    },
  });

  const updateSubTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      subTaskId,
      status,
      userName,
      delayReason,
      delayNotes,
    }: {
      taskId: number;
      subTaskId: string;
      status: string;
      userName?: string;
      delayReason?: string;
      delayNotes?: string;
    }) => apiClient.updateFinOpsSubTask(taskId, subTaskId, status, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-finops-tasks"] });
    },
  });

  // FinOps client mutations
  const createFinOpsClientMutation = useMutation({
    mutationFn: (clientData: any) => apiClient.createFinOpsClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finops-clients"] });
      setIsAddClientDialogOpen(false);
      setNewClientForm({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    },
  });

  const resetForm = () => {
    setTaskForm({
      task_name: "",
      description: "",
      client_id: "",
      assigned_to: [], // Changed to empty array for multiple assignments
      reporting_managers: [],
      escalation_managers: [],
      effective_from: new Date().toISOString().split("T")[0],
      duration: "daily",
      is_active: true,
      subtasks: [],
    });
    // Reset search states
    setAssignedToSearch("");
    setReportingManagerSearch("");
    setEscalationManagerSearch("");
  };

  const addSubTask = () => {
    const newSubTask: ClientBasedFinOpsSubTask = {
      id: Date.now().toString(),
      name: "",
      description: "",
      start_time: "05:00",
      order_position: taskForm.subtasks.length,
      status: "pending",
    };
    setTaskForm((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubTask],
    }));
  };

  const updateSubTask = (index: number, field: string, value: any) => {
    setTaskForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) =>
        i === index ? { ...subtask, [field]: value } : subtask,
      ),
    }));
  };

  const removeSubTask = (index: number) => {
    setTaskForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleInlineSubTaskStatusChange = (
    taskId: number,
    subtaskId: string,
    status: string,
    delayReason?: string,
    delayNotes?: string,
  ) => {
    updateSubTaskMutation.mutate({
      taskId,
      subTaskId: subtaskId,
      status,
      userName: user?.first_name + " " + user?.last_name,
      delayReason,
      delayNotes,
    });
  };

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTimeSinceStart = (startTime: string) => {
    if (!startTime || typeof startTime !== "string") return "N/A";

    const [hours, minutes] = startTime.split(":").map(Number);
    const taskStartTime = new Date();
    taskStartTime.setHours(hours, minutes, 0, 0);

    const diffMs = currentTime.getTime() - taskStartTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 0) {
      const remaining = Math.abs(diffMinutes);
      // Show "need to start" when within 15 minutes of start time
      if (remaining <= 15) {
        return "need to start";
      }
      return `Starts in ${remaining} min`;
    } else if (diffMinutes <= 15) {
      // Show "need to start" for the first 15 minutes after start time
      return "need to start";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ${diffMinutes % 60}m ago`;
    }
  };

  const getSLAWarning = (startTime: string, status: string) => {
    if (status === "completed" || !startTime || typeof startTime !== "string")
      return null;

    const [hours, minutes] = startTime.split(":").map(Number);
    const taskStartTime = new Date();
    taskStartTime.setHours(hours, minutes, 0, 0);

    // Add 15 minutes SLA buffer
    const slaDeadline = new Date(taskStartTime.getTime() + 15 * 60 * 1000);
    const diffMs = slaDeadline.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
      return {
        type: "overdue",
        message: `Overdue by ${Math.abs(diffMinutes)} min`,
      };
    } else if (diffMinutes <= 15) {
      return {
        type: "warning",
        message: `SLA Warning - ${diffMinutes} min remaining`,
      };
    }

    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTaskForm((prev) => {
        const oldIndex = prev.subtasks.findIndex(
          (item) => item.id === active.id,
        );
        const newIndex = prev.subtasks.findIndex(
          (item) => item.id === over?.id,
        );

        const reorderedSubtasks = arrayMove(prev.subtasks, oldIndex, newIndex);

        const updatedItems = reorderedSubtasks.map((item, index) => ({
          ...item,
          order_position: index,
        }));

        return { ...prev, subtasks: updatedItems };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one assignee is selected
    if (taskForm.assigned_to.length === 0) {
      alert("Please select at least one assignee for this task.");
      return;
    }

    const selectedClientData = clients.find(
      (c: any) => c.id.toString() === taskForm.client_id,
    );

    const taskData = {
      ...taskForm,
      assigned_to: taskForm.assigned_to.map(extractNameFromValue),
      reporting_managers: taskForm.reporting_managers.map(extractNameFromValue),
      escalation_managers:
        taskForm.escalation_managers.map(extractNameFromValue),
      client_name: selectedClientData?.company_name || "",
      created_by: user?.id || 1,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const startEditing = (task: ClientBasedFinOpsTask) => {
    setEditingTask(task);
    setTaskForm({
      task_name: task.task_name || "",
      description: task.description || "",
      client_id: task.client_id?.toString() || "",
      assigned_to: (() => {
        console.log(
          "🔍 Edit form - raw task.assigned_to:",
          JSON.stringify(task.assigned_to),
        );

        let assignedArray = [];

        if (Array.isArray(task.assigned_to)) {
          assignedArray = task.assigned_to;
        } else if (task.assigned_to) {
          // Extract and parse the assigned_to value
          const extracted = extractNameFromValue(task.assigned_to);
          console.log("🔄 Edit form - after extractNameFromValue:", extracted);

          // Check if it contains comma-separated names
          if (
            extracted.includes('","') ||
            extracted.includes('", "') ||
            extracted.includes(",")
          ) {
            // Split by various comma patterns and clean up
            assignedArray = extracted
              .split(/,\s*"?|",\s*"?|"\s*,\s*"?/)
              .map((name) => name.replace(/^"|"$/g, "").trim())
              .filter((name) => name.length > 0);
            console.log("🔄 Edit form - split names:", assignedArray);
          } else {
            // Single name
            assignedArray = [extracted];
          }
        }

        const result = assignedArray.map((name) =>
          convertNameToValueFormat(extractNameFromValue(name), users),
        );
        console.log("✅ Edit form - final assigned_to array:", result);
        return result;
      })(),
      reporting_managers: (task.reporting_managers || []).map((name) =>
        convertNameToValueFormat(extractNameFromValue(name), users),
      ),
      escalation_managers: (task.escalation_managers || []).map((name) =>
        convertNameToValueFormat(extractNameFromValue(name), users),
      ),
      effective_from: task.effective_from
        ? new Date(task.effective_from).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      duration: task.duration || "daily",
      is_active: task.is_active ?? true,
      subtasks: (task.subtasks || []).map((subtask) => ({
        ...subtask,
        name: subtask.name || "",
        description: subtask.description || "",
        start_time: subtask.start_time || "05:00",
      })),
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    createFinOpsClientMutation.mutate({
      ...newClientForm,
      created_by: user?.id || 1,
    });
  };

  // Filter tasks based on client, status, search, and date
  const filteredTasks = finopsTasks.filter((task: ClientBasedFinOpsTask) => {
    console.log("Processing task:", task.task_name, "for filtering");
    // Client filter from summary (takes priority)
    if (selectedClientFromSummary) {
      if (task.client_name !== selectedClientFromSummary) return false;
    } else {
      // Regular client filter
      if (selectedClient !== "all") {
        if (selectedClient === "unknown") {
          if (
            task.client_id &&
            task.client_name &&
            task.client_name !== "Unknown Client"
          )
            return false;
        } else {
          if (task.client_id?.toString() !== selectedClient) return false;
        }
      }
    }

    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    // Search filter
    if (
      searchTerm &&
      !task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    // Date filter for daily tasks (always enabled)
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const taskDate = new Date(task.effective_from);

      console.log("Date filtering:", {
        filterDate: filterDate.toDateString(),
        taskDate: taskDate.toDateString(),
        taskName: task.task_name,
        duration: task.duration,
        effective_from: task.effective_from,
      });

      // For daily tasks, check if task should run on the selected date
      if (task.duration === "daily") {
        // Daily task should show if it started on or before the selected date
        if (taskDate > filterDate) {
          console.log("Filtering out daily task - not started yet");
          return false; // Task hasn't started yet
        }
      } else {
        // For non-daily tasks, check if the date matches exactly
        if (taskDate.toDateString() !== filterDate.toDateString()) {
          console.log("Filtering out non-daily task - date doesn't match");
          return false;
        }
      }
      console.log("Task passed date filter");
    }

    console.log("Task passed all filters:", task.task_name);
    return true;
  });

  console.log(
    "Total tasks:",
    finopsTasks.length,
    "Filtered tasks:",
    filteredTasks.length,
    "Date filter:",
    dateFilter,
  );

  // Calculate summary statistics
  const getOverallSummary = () => {
    const summary = {
      total_tasks: filteredTasks.length,
      total_subtasks: 0,
      completed_tasks: 0,
      delayed_tasks: 0,
      overdue_tasks: 0,
      completed_subtasks: 0,
      delayed_subtasks: 0,
      overdue_subtasks: 0,
    };

    filteredTasks.forEach((task: ClientBasedFinOpsTask) => {
      summary.total_subtasks += task.subtasks?.length || 0;
      if (task.status === "completed") summary.completed_tasks++;
      if (task.status === "delayed") summary.delayed_tasks++;
      if (task.status === "overdue") summary.overdue_tasks++;

      task.subtasks?.forEach((subtask) => {
        if (subtask.status === "completed") summary.completed_subtasks++;
        if (subtask.status === "delayed") summary.delayed_subtasks++;
        if (subtask.status === "overdue") summary.overdue_subtasks++;
      });
    });

    return summary;
  };

  // Get client-wise summary
  const getClientSummary = () => {
    const clientSummary: { [key: string]: any } = {};

    console.log("Filtered tasks for client summary:", filteredTasks);

    filteredTasks.forEach((task: ClientBasedFinOpsTask) => {
      console.log(
        "Processing task:",
        task.task_name,
        "Client:",
        task.client_name,
        "Client ID:",
        task.client_id,
      );

      // Resolve client name with proper fallback logic
      let clientName = "Unknown Client";

      if (
        task.client_name &&
        task.client_name !== "" &&
        task.client_name !== "undefined"
      ) {
        // Use the client_name if available and valid
        clientName = task.client_name;
      } else if (task.client_id) {
        // Look up client by ID in the clients array
        const foundClient = clients.find(
          (c: any) => c.id.toString() === task.client_id.toString(),
        );
        if (foundClient) {
          clientName =
            foundClient.company_name ||
            foundClient.client_name ||
            `Client ${foundClient.id}`;
        } else {
          clientName = `Client ${task.client_id}`;
        }
      }

      console.log(
        `📝 Task "${task.task_name}" -> Client: "${clientName}" (ID: ${task.client_id})`,
      );

      if (!clientSummary[clientName]) {
        clientSummary[clientName] = {
          total_tasks: 0,
          total_subtasks: 0,
          completed_subtasks: 0,
          delayed_subtasks: 0,
          overdue_subtasks: 0,
        };
      }

      clientSummary[clientName].total_tasks++;
      clientSummary[clientName].total_subtasks += task.subtasks?.length || 0;

      task.subtasks?.forEach((subtask) => {
        if (subtask.status === "completed")
          clientSummary[clientName].completed_subtasks++;
        if (subtask.status === "delayed")
          clientSummary[clientName].delayed_subtasks++;
        if (subtask.status === "overdue")
          clientSummary[clientName].overdue_subtasks++;
      });
    });

    console.log("Client summary result:", clientSummary);
    return clientSummary;
  };

  const overallSummary = getOverallSummary();
  const clientSummary = getClientSummary();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return PlayCircle;
      case "delayed":
        return Clock;
      case "overdue":
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
      case "delayed":
        return "text-yellow-600 bg-yellow-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              FinOps Daily Process -{" "}
              {format(new Date(dateFilter), "MMM d, yyyy")}
            </h2>
            <p className="text-gray-600 mt-1">
              Daily process tracking and task execution monitoring for the
              selected date
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Create a test task for today's date
                const testTaskData = {
                  task_name: "Test Daily Task",
                  description: "Test task for date filtering",
                  client_id: "1",
                  client_name: "Test Client",
                  assigned_to: "Test User",
                  reporting_managers: [],
                  escalation_managers: [],
                  effective_from: dateFilter,
                  duration: "daily",
                  is_active: true,
                  subtasks: [
                    {
                      id: "test-subtask-1",
                      name: "Test Subtask",
                      description: "Test subtask",
                      start_time: "09:00",
                      order_position: 0,
                      status: "pending",
                    },
                  ],
                  created_by: user?.id || 1,
                };
                createTaskMutation.mutate(testTaskData);
              }}
            >
              Create Test Task
            </Button>
          </div>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {overallSummary.total_tasks}
              </div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {overallSummary.total_subtasks}
              </div>
              <div className="text-xs text-gray-600">Total Subtasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {overallSummary.completed_subtasks}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {overallSummary.delayed_subtasks}
              </div>
              <div className="text-xs text-gray-600">Delayed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {overallSummary.overdue_subtasks}
              </div>
              <div className="text-xs text-gray-600">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(clientSummary).length}
              </div>
              <div className="text-xs text-gray-600">Active Clients</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[150px]">
              <Label>Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Search Tasks</Label>
              <Input
                placeholder="Search by task name or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="min-w-[150px]">
              <Label>Filter by Client</Label>
              <Select
                value={
                  selectedClientFromSummary
                    ? "summary-selected"
                    : selectedClient
                }
                onValueChange={
                  selectedClientFromSummary ? undefined : setSelectedClient
                }
                disabled={!!selectedClientFromSummary}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedClientFromSummary
                        ? `Selected: ${selectedClientFromSummary}`
                        : "Select client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.length > 0 ? (
                    clients.map((client: any) => (
                      <SelectItem
                        key={`filter-client-${client.id}`}
                        value={client.id.toString()}
                      >
                        {client.company_name ||
                          client.client_name ||
                          `Client ${client.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      No clients available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedClientFromSummary && (
                <p className="text-xs text-blue-600 mt-1">
                  Client selected from summary above
                </p>
              )}
            </div>

            <div className="min-w-[150px]">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client-wise Summary */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Daily Process Summary by Client
              <Badge variant="outline" className="ml-2">
                {format(new Date(dateFilter), "MMM d, yyyy")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(clientSummary).length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Client Data Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Tasks exist but client information is not properly configured.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["clients"] });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Client Data
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(clientSummary).map(
                  ([clientName, summary]: [string, any]) => (
                    <div
                      key={clientName}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedClientFromSummary === clientName
                          ? "bg-blue-50 border-blue-300 shadow-md"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        if (selectedClientFromSummary === clientName) {
                          setSelectedClientFromSummary(null);
                        } else {
                          setSelectedClientFromSummary(clientName);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{clientName}</h4>
                        {selectedClientFromSummary === clientName && (
                          <Badge variant="secondary" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {summary.total_tasks}
                          </div>
                          <div className="text-xs text-gray-600">Tasks</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {summary.total_subtasks}
                          </div>
                          <div className="text-xs text-gray-600">Subtasks</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {summary.completed_subtasks}
                          </div>
                          <div className="text-xs text-gray-600">Done</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">
                            {summary.delayed_subtasks}
                          </div>
                          <div className="text-xs text-gray-600">Delayed</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-600">
                            {summary.overdue_subtasks}
                          </div>
                          <div className="text-xs text-gray-600">Overdue</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Click to{" "}
                        {selectedClientFromSummary === clientName
                          ? "show all"
                          : "filter"}{" "}
                        tasks
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {selectedClientFromSummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Showing tasks for:{" "}
                  <strong>{selectedClientFromSummary}</strong>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClientFromSummary(null)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <X className="w-3 h-3 mr-1" />
                Show All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading tasks...</p>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tasks Found
              </h3>
              <p className="text-gray-600 mb-4">
                {finopsTasks.length === 0
                  ? "Create your first task to get started."
                  : "No tasks match your current filters."}
              </p>
              {finopsTasks.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: ClientBasedFinOpsTask) => {
            const completedSubtasks =
              task.subtasks?.filter((st) => st.status === "completed").length ||
              0;
            const totalSubtasks = task.subtasks?.length || 0;
            const delayedSubtasks =
              task.subtasks?.filter((st) => st.status === "delayed").length ||
              0;
            const overdueSubtasks =
              task.subtasks?.filter((st) => st.status === "overdue").length ||
              0;

            const taskStatus =
              overdueSubtasks > 0
                ? "overdue"
                : delayedSubtasks > 0
                  ? "delayed"
                  : completedSubtasks === totalSubtasks && totalSubtasks > 0
                    ? "completed"
                    : completedSubtasks > 0
                      ? "in_progress"
                      : "pending";
            const StatusIcon = getStatusIcon(taskStatus);

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg break-words">
                          {task.task_name}
                        </CardTitle>
                        {task.client_name &&
                          task.client_name !== "Unknown Client" && (
                            <Badge variant="outline" className="text-blue-600">
                              {task.client_name}
                            </Badge>
                          )}
                        <Badge
                          variant={task.is_active ? "default" : "secondary"}
                        >
                          {task.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className={getStatusColor(taskStatus)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {taskStatus.charAt(0).toUpperCase() +
                            taskStatus.slice(1).replace("_", " ")}
                        </Badge>
                      </div>
                      <CardDescription className="break-words whitespace-pre-wrap">
                        {task.description}
                      </CardDescription>

                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            Assigned:{" "}
                            {(() => {
                              console.log(
                                "🔍 Raw task.assigned_to:",
                                JSON.stringify(task.assigned_to),
                              );

                              // Handle various formats of assigned_to
                              let assignedArray = [];

                              if (Array.isArray(task.assigned_to)) {
                                console.log(
                                  "✅ Already an array:",
                                  task.assigned_to,
                                );
                                assignedArray = task.assigned_to;
                              } else if (task.assigned_to) {
                                // First try to extract using our helper function
                                const extracted = extractNameFromValue(
                                  task.assigned_to,
                                );
                                console.log(
                                  "🔄 After extractNameFromValue:",
                                  extracted,
                                );

                                // Check if the result looks like multiple names separated by comma
                                if (
                                  extracted.includes('","') ||
                                  extracted.includes('", "') ||
                                  extracted.includes(",")
                                ) {
                                  // Split by various comma patterns
                                  const splitNames = extracted
                                    .split(/,\s*"?|",\s*"?|"\s*,\s*"?/)
                                    .map((name) =>
                                      name.replace(/^"|"$/g, "").trim(),
                                    )
                                    .filter((name) => name.length > 0);
                                  console.log("🔄 Split names:", splitNames);
                                  assignedArray = splitNames;
                                } else {
                                  // Single name
                                  assignedArray = [extracted];
                                }
                              }

                              const result =
                                assignedArray.length > 0
                                  ? assignedArray
                                      .map((name) => extractNameFromValue(name))
                                      .join(", ")
                                  : "Unassigned";

                              console.log("✅ Final result:", result);
                              return result;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{task.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>
                            {completedSubtasks}/{totalSubtasks} completed
                          </span>
                        </div>
                        {task.duration === "daily" && (
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            <span>
                              {task.subtasks && task.subtasks.length > 0
                                ? (() => {
                                    const subtasksWithTime =
                                      task.subtasks.filter(
                                        (st) => st.start_time,
                                      );
                                    if (subtasksWithTime.length === 0)
                                      return "No schedule set";
                                    const sorted = subtasksWithTime.sort(
                                      (a, b) =>
                                        (a.start_time || "").localeCompare(
                                          b.start_time || "",
                                        ),
                                    );
                                    const { time, period } = convertTo12Hour(
                                      sorted[0].start_time,
                                    );
                                    return `Starts: ${time ? `${time} ${period}` : sorted[0].start_time}`;
                                  })()
                                : "No schedule set"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(task)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${task.task_name}"?`,
                            )
                          ) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Inline Subtasks Management */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Subtasks ({completedSubtasks}/{totalSubtasks}{" "}
                          completed)
                        </h4>
                        {task.subtasks.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {expandedTasks.has(task.id)
                              ? "Show Less"
                              : "Show More"}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const inProgressSubtasks = task.subtasks.filter(
                            (st) => st.status === "in_progress",
                          );
                          const otherSubtasks = task.subtasks.filter(
                            (st) => st.status !== "in_progress",
                          );
                          const isExpanded = expandedTasks.has(task.id);

                          // Always show in-progress subtasks
                          let subtasksToShow = [...inProgressSubtasks];

                          if (isExpanded) {
                            // Show all subtasks when expanded
                            subtasksToShow = task.subtasks;
                          } else {
                            // Show in-progress + up to 2 others
                            subtasksToShow = [
                              ...inProgressSubtasks,
                              ...otherSubtasks.slice(
                                0,
                                Math.max(0, 3 - inProgressSubtasks.length),
                              ),
                            ];
                          }

                          return subtasksToShow.map((subtask) => {
                            const slaWarning = getSLAWarning(
                              subtask.start_time,
                              subtask.status,
                            );
                            return (
                              <div key={subtask.id}>
                                <SortableSubTaskItem
                                  subtask={subtask}
                                  index={0}
                                  onUpdate={() => {}}
                                  onRemove={() => {}}
                                  onStatusChange={(
                                    subtaskId,
                                    status,
                                    delayReason,
                                    delayNotes,
                                  ) =>
                                    handleInlineSubTaskStatusChange(
                                      task.id,
                                      subtaskId,
                                      status,
                                      delayReason,
                                      delayNotes,
                                    )
                                  }
                                  isInline={true}
                                />
                                {(slaWarning || subtask.start_time) && (
                                  <Alert
                                    className={`mt-2 p-2 ${
                                      slaWarning?.type === "overdue"
                                        ? "border-red-200 bg-red-50"
                                        : slaWarning?.type === "warning"
                                          ? "border-orange-200 bg-orange-50"
                                          : "border-blue-200 bg-blue-50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <Clock
                                        className={`h-3 w-3 flex-shrink-0 ${
                                          slaWarning?.type === "overdue"
                                            ? "text-red-600"
                                            : slaWarning?.type === "warning"
                                              ? "text-orange-600"
                                              : "text-blue-600"
                                        }`}
                                      />
                                      <AlertDescription
                                        className={`text-xs ${
                                          slaWarning?.type === "overdue"
                                            ? "text-red-700"
                                            : slaWarning?.type === "warning"
                                              ? "text-orange-700"
                                              : "text-blue-700"
                                        }`}
                                      >
                                        {slaWarning?.message || "Status"} •{" "}
                                        {getTimeSinceStart(subtask.start_time)}
                                      </AlertDescription>
                                    </div>
                                  </Alert>
                                )}
                              </div>
                            );
                          });
                        })()}

                        {!expandedTasks.has(task.id) &&
                          task.subtasks.length > 3 && (
                            <div className="text-center py-2">
                              <span className="text-sm text-gray-500">
                                {task.subtasks.length -
                                  Math.min(
                                    3,
                                    task.subtasks.filter(
                                      (st) => st.status === "in_progress",
                                    ).length +
                                      Math.max(
                                        0,
                                        3 -
                                          task.subtasks.filter(
                                            (st) => st.status === "in_progress",
                                          ).length,
                                      ),
                                  )}{" "}
                                more subtasks hidden
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingTask(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit FinOps Task" : "Create New FinOps Task"}
            </DialogTitle>
            <DialogDescription>
              Configure client-based FinOps processes with comprehensive
              tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task_name">Task Name *</Label>
                <Input
                  id="task_name"
                  value={taskForm.task_name}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      task_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., CLEARING - FILE TRANSFER AND VALIDATION"
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_id">Client *</Label>
                <div className="flex gap-2">
                  <Select
                    value={taskForm.client_id}
                    onValueChange={(value) =>
                      setTaskForm((prev) => ({ ...prev, client_id: value }))
                    }
                    required
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        console.log("🎯 Rendering client dropdown:", {
                          isLoading: clientsLoading,
                          clientsCount: clients.length,
                          rawClientsCount: rawClients.length,
                          hasError: !!clientsError,
                          error: clientsError?.message,
                        });

                        if (clientsLoading) {
                          return (
                            <SelectItem value="loading" disabled>
                              Loading FinOps clients...
                            </SelectItem>
                          );
                        }

                        if (clients.length > 0) {
                          return clients.map((client: any) => (
                            <SelectItem
                              key={`create-client-${client.id}`}
                              value={client.id.toString()}
                            >
                              {client.company_name ||
                                client.client_name ||
                                `Client ${client.id}`}
                            </SelectItem>
                          ));
                        }

                        return (
                          <SelectItem value="no-clients" disabled>
                            No FinOps clients available
                          </SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddClientDialogOpen(true)}
                    className="whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Client
                  </Button>
                </div>
                <div className="mt-2">
                  {!clientsLoading && clients.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 font-medium">
                        🎯 No FinOps clients found
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Create your first FinOps client by clicking "Add Client"
                        above. These clients are separate from your sales leads.
                      </p>
                    </div>
                  )}
                  {clientsError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        ❌ Failed to load FinOps clients
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {clientsError.message}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["finops-clients"],
                          });
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry Loading
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={taskForm.duration}
                  onValueChange={(value) =>
                    setTaskForm((prev) => ({ ...prev, duration: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigned To *</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !taskForm.assigned_to.includes(value)) {
                        setTaskForm((prev) => ({
                          ...prev,
                          assigned_to: [...prev.assigned_to, value],
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignees (multiple)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <div className="p-2 border-b bg-white sticky top-0 z-10">
                        <Input
                          placeholder="Search users..."
                          value={assignedToSearch}
                          className="h-8"
                          onChange={(e) => setAssignedToSearch(e.target.value)}
                          onKeyDown={(e) => {
                            // Prevent Select from closing when typing
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            // Prevent Select from capturing mouse events
                            e.stopPropagation();
                          }}
                          autoFocus={false}
                        />
                      </div>
                      {users
                        .filter(
                          (user: any, index: number, arr: any[]) =>
                            arr.findIndex((u) => u.id === user.id) === index,
                        )
                        .filter((user: any) => {
                          const userValue = `${user.first_name} ${user.last_name} (${user.email || "no-email"})`;
                          return !taskForm.assigned_to.includes(userValue);
                        })
                        .filter((user: any) => {
                          const fullName =
                            `${user.first_name} ${user.last_name}`.toLowerCase();
                          const email = (user.email || "").toLowerCase();
                          const searchTerm = assignedToSearch.toLowerCase();
                          return (
                            fullName.includes(searchTerm) ||
                            email.includes(searchTerm)
                          );
                        })
                        .map((user: any, index: number) => {
                          const fullName = `${user.first_name} ${user.last_name}`;
                          const userValue = `${fullName} (${user.email || "no-email"})`;
                          return (
                            <SelectItem
                              key={`assigned-to-${user.id}`}
                              value={userValue}
                            >
                              {fullName}{" "}
                              <span className="text-xs text-gray-500">
                                ({user.email || "no-email"})
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.assigned_to.map((assignee, index) => (
                    <Badge
                      key={`assignee-${assignee}-${index}`}
                      variant="default"
                      className="gap-1"
                    >
                      {extractNameFromValue(assignee)}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setTaskForm((prev) => ({
                            ...prev,
                            assigned_to: prev.assigned_to.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                      />
                    </Badge>
                  ))}
                  {taskForm.assigned_to.length === 0 && (
                    <span className="text-sm text-gray-500">
                      No assignees selected. Please select at least one.
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="e.g., clearing daily steps for file transfer"
                  required
                />
              </div>

              <div className="md:col-start-1">
                <Label htmlFor="effective_from">Effective From *</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={taskForm.effective_from}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      effective_from: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2 md:col-start-2">
                <Switch
                  checked={taskForm.is_active}
                  onCheckedChange={(checked) =>
                    setTaskForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label>Task is active</Label>
              </div>
            </div>

            {/* Team Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Team & Escalation</h3>

              <div>
                <Label>Reporting Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (
                        value &&
                        !taskForm.reporting_managers.includes(value)
                      ) {
                        setTaskForm((prev) => ({
                          ...prev,
                          reporting_managers: [
                            ...prev.reporting_managers,
                            value,
                          ],
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reporting manager" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <div className="p-2 border-b bg-white sticky top-0 z-10">
                        <Input
                          placeholder="Search reporting managers..."
                          value={reportingManagerSearch}
                          className="h-8"
                          onChange={(e) =>
                            setReportingManagerSearch(e.target.value)
                          }
                          onKeyDown={(e) => {
                            // Prevent Select from closing when typing
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            // Prevent Select from capturing mouse events
                            e.stopPropagation();
                          }}
                          autoFocus={false}
                        />
                      </div>
                      {users
                        .filter(
                          (user: any, index: number, arr: any[]) =>
                            arr.findIndex((u) => u.id === user.id) === index,
                        )
                        .filter((user: any) => {
                          const userValue = `${user.first_name} ${user.last_name} (${user.email || "no-email"})`;
                          return !taskForm.reporting_managers.includes(
                            userValue,
                          );
                        })
                        .filter((user: any) => {
                          const fullName =
                            `${user.first_name} ${user.last_name}`.toLowerCase();
                          const email = (user.email || "").toLowerCase();
                          const searchTerm =
                            reportingManagerSearch.toLowerCase();
                          return (
                            fullName.includes(searchTerm) ||
                            email.includes(searchTerm)
                          );
                        })
                        .map((user: any, index: number) => {
                          const fullName = `${user.first_name} ${user.last_name}`;
                          const userValue = `${fullName} (${user.email || "no-email"})`;
                          return (
                            <SelectItem
                              key={`reporting-manager-${user.id}`}
                              value={userValue}
                            >
                              {fullName}{" "}
                              <span className="text-xs text-gray-500">
                                ({user.email || "no-email"})
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.reporting_managers.map((manager, index) => (
                    <Badge
                      key={`manager-${manager}-${index}`}
                      variant="secondary"
                      className="gap-1"
                    >
                      {extractNameFromValue(manager)}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setTaskForm((prev) => ({
                            ...prev,
                            reporting_managers: prev.reporting_managers.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Escalation Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (
                        value &&
                        !taskForm.escalation_managers.includes(value)
                      ) {
                        setTaskForm((prev) => ({
                          ...prev,
                          escalation_managers: [
                            ...prev.escalation_managers,
                            value,
                          ],
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select escalation manager" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <div className="p-2 border-b bg-white sticky top-0 z-10">
                        <Input
                          placeholder="Search escalation managers..."
                          value={escalationManagerSearch}
                          className="h-8"
                          onChange={(e) =>
                            setEscalationManagerSearch(e.target.value)
                          }
                          onKeyDown={(e) => {
                            // Prevent Select from closing when typing
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            // Prevent Select from capturing mouse events
                            e.stopPropagation();
                          }}
                          autoFocus={false}
                        />
                      </div>
                      {users
                        .filter(
                          (user: any, index: number, arr: any[]) =>
                            arr.findIndex((u) => u.id === user.id) === index,
                        )
                        .filter((user: any) => {
                          const userValue = `${user.first_name} ${user.last_name} (${user.email || "no-email"})`;
                          return !taskForm.escalation_managers.includes(
                            userValue,
                          );
                        })
                        .filter((user: any) => {
                          const fullName =
                            `${user.first_name} ${user.last_name}`.toLowerCase();
                          const email = (user.email || "").toLowerCase();
                          const searchTerm =
                            escalationManagerSearch.toLowerCase();
                          return (
                            fullName.includes(searchTerm) ||
                            email.includes(searchTerm)
                          );
                        })
                        .map((user: any, index: number) => {
                          const fullName = `${user.first_name} ${user.last_name}`;
                          const userValue = `${fullName} (${user.email || "no-email"})`;
                          return (
                            <SelectItem
                              key={`escalation-manager-${user.id}`}
                              value={userValue}
                            >
                              {fullName}{" "}
                              <span className="text-xs text-gray-500">
                                ({user.email || "no-email"})
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.escalation_managers.map((manager, index) => (
                    <Badge
                      key={`escalation-${manager}-${index}`}
                      variant="destructive"
                      className="gap-1"
                    >
                      {extractNameFromValue(manager)}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setTaskForm((prev) => ({
                            ...prev,
                            escalation_managers:
                              prev.escalation_managers.filter(
                                (_, i) => i !== index,
                              ),
                          }))
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtasks without SLA Hours/Minutes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Subtasks</h3>
                <Button
                  type="button"
                  onClick={addSubTask}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subtask
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={taskForm.subtasks.map((st) => st.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {taskForm.subtasks.map((subtask, index) => (
                      <SortableSubTaskItem
                        key={subtask.id}
                        subtask={subtask}
                        index={index}
                        onUpdate={updateSubTask}
                        onRemove={removeSubTask}
                        isInline={false}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {taskForm.subtasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Timer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No subtasks added yet</p>
                  <p className="text-sm">
                    Add subtasks to break down your process
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createTaskMutation.isPending || updateTaskMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog
        open={isAddClientDialogOpen}
        onOpenChange={setIsAddClientDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New FinOps Client</DialogTitle>
            <DialogDescription>
              Create a new client for FinOps task management. This client will
              be separate from sales leads.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={newClientForm.company_name}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                placeholder="e.g., Acme Corporation"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={newClientForm.contact_person}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    contact_person: e.target.value,
                  }))
                }
                placeholder="e.g., John Smith"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClientForm.email}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="e.g., contact@acme.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newClientForm.phone}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newClientForm.address}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Client address..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newClientForm.notes}
                onChange={(e) =>
                  setNewClientForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes about the client..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddClientDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createFinOpsClientMutation.isPending}
              >
                {createFinOpsClientMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
