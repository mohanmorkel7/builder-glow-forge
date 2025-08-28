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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import {
  useSortable,
} from "@dnd-kit/sortable";
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
} from "lucide-react";
import { format, formatDistanceToNow, addHours, addMinutes, isBefore, isAfter } from "date-fns";

// Enhanced interfaces with status tracking and delay management
interface EnhancedFinOpsSubTask {
  id: string;
  name: string;
  description?: string;
  sla_hours: number;
  sla_minutes: number;
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

interface EnhancedFinOpsTask {
  id: number;
  task_name: string;
  description: string;
  assigned_to: string;
  reporting_managers: string[];
  escalation_managers: string[];
  effective_from: string;
  duration: "daily" | "weekly" | "monthly";
  is_active: boolean;
  subtasks: EnhancedFinOpsSubTask[];
  created_at: string;
  updated_at: string;
  created_by: string;
  last_run?: string;
  next_run?: string;
  status: "active" | "inactive" | "completed" | "overdue" | "delayed";
}

// Sortable SubTask Item Component with enhanced status management
interface SortableSubTaskItemProps {
  subtask: EnhancedFinOpsSubTask;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onStatusChange: (index: number, status: string, delayReason?: string, delayNotes?: string) => void;
}

function SortableSubTaskItem({ subtask, index, onUpdate, onRemove, onStatusChange }: SortableSubTaskItemProps) {
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayNotes, setDelayNotes] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "delayed") {
      setShowDelayDialog(true);
    } else {
      onStatusChange(index, newStatus);
    }
  };

  const handleDelaySubmit = () => {
    onStatusChange(index, "delayed", delayReason, delayNotes);
    setShowDelayDialog(false);
    setDelayReason("");
    setDelayNotes("");
  };

  const getSLATimeRemaining = () => {
    if (!subtask.started_at || subtask.status === 'completed') return null;
    
    const startTime = new Date(subtask.started_at);
    const slaTime = addHours(addMinutes(startTime, subtask.sla_minutes), subtask.sla_hours);
    const now = new Date();
    
    if (isBefore(slaTime, now)) {
      return { text: `Overdue by ${formatDistanceToNow(slaTime)}`, color: "text-red-600", isOverdue: true };
    } else {
      const timeRemaining = slaTime.getTime() - now.getTime();
      const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
      const color = minutesRemaining <= 15 ? "text-yellow-600" : "text-green-600";
      return { text: `${formatDistanceToNow(slaTime)} remaining`, color, isOverdue: false };
    }
  };

  const slaInfo = getSLATimeRemaining();

  return (
    <>
      <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="mt-2 cursor-grab">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Subtask Name *</Label>
                <Input
                  value={subtask.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder="e.g., RBL DUMP VS TCP DATA (DAILY ALERT MAIL)"
                  required
                />
              </div>

              <div>
                <Label>Daily Start Time *</Label>
                <Input
                  type="time"
                  value={subtask.start_time}
                  onChange={(e) => onUpdate(index, 'start_time', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>SLA Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    value={subtask.sla_hours}
                    onChange={(e) => onUpdate(index, 'sla_hours', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>SLA Minutes</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={subtask.sla_minutes}
                    onChange={(e) => onUpdate(index, 'sla_minutes', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={subtask.status} onValueChange={handleStatusChange}>
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

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={subtask.description || ''}
                onChange={(e) => onUpdate(index, 'description', e.target.value)}
                placeholder="Additional details about this subtask..."
                rows={2}
              />
            </div>

            {/* SLA Information */}
            {slaInfo && (
              <div className={`text-sm font-medium ${slaInfo.color} flex items-center gap-2`}>
                {slaInfo.isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                {slaInfo.text}
              </div>
            )}

            {/* Delay Information */}
            {subtask.status === "delayed" && subtask.delay_reason && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Delayed</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <div><strong>Reason:</strong> {subtask.delay_reason}</div>
                  {subtask.delay_notes && <div><strong>Notes:</strong> {subtask.delay_notes}</div>}
                </AlertDescription>
              </Alert>
            )}

            {/* Alerts Sent Information */}
            {subtask.alerts_sent && subtask.alerts_sent.length > 0 && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                Alerts sent: {subtask.alerts_sent.join(", ")}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delay Reason Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delayed</DialogTitle>
            <DialogDescription>
              Please provide a reason for the delay. This will trigger notifications to reporting managers.
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
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="data_unavailable">Data Unavailable</SelectItem>
                  <SelectItem value="external_dependency">External Dependency</SelectItem>
                  <SelectItem value="resource_constraint">Resource Constraint</SelectItem>
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

export default function EnhancedFinOpsTaskManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnhancedFinOpsTask | null>(null);

  // Form state for creating/editing tasks
  const [taskForm, setTaskForm] = useState({
    task_name: "",
    description: "",
    assigned_to: "",
    reporting_managers: [] as string[],
    escalation_managers: [] as string[],
    effective_from: new Date().toISOString().split('T')[0],
    duration: "daily" as "daily" | "weekly" | "monthly",
    is_active: true,
    subtasks: [] as EnhancedFinOpsSubTask[],
  });

  // Fetch FinOps tasks
  const { data: finopsTasks = [], isLoading } = useQuery({
    queryKey: ["enhanced-finops-tasks"],
    queryFn: () => apiClient.getFinOpsTasks(),
    refetchInterval: 30000, // Refresh every 30 seconds for SLA monitoring
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.getUsers(),
  });

  // Mutations for CRUD operations
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiClient.createFinOpsTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-finops-tasks"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }: { id: number; taskData: any }) =>
      apiClient.updateFinOpsTask(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-finops-tasks"] });
      setEditingTask(null);
      resetForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteFinOpsTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-finops-tasks"] });
    },
  });

  const updateSubTaskMutation = useMutation({
    mutationFn: ({ taskId, subTaskId, status, userName, delayReason, delayNotes }: { 
      taskId: number; 
      subTaskId: string; 
      status: string;
      userName?: string;
      delayReason?: string;
      delayNotes?: string;
    }) => apiClient.updateFinOpsSubTask(taskId, subTaskId, status, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-finops-tasks"] });
    },
  });

  const resetForm = () => {
    setTaskForm({
      task_name: "",
      description: "",
      assigned_to: "",
      reporting_managers: [],
      escalation_managers: [],
      effective_from: new Date().toISOString().split('T')[0],
      duration: "daily",
      is_active: true,
      subtasks: [],
    });
  };

  const addSubTask = () => {
    const newSubTask: EnhancedFinOpsSubTask = {
      id: Date.now().toString(),
      name: "",
      description: "",
      sla_hours: 1,
      sla_minutes: 0,
      start_time: "05:00",
      order_position: taskForm.subtasks.length,
      status: "pending",
    };
    setTaskForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubTask],
    }));
  };

  const updateSubTask = (index: number, field: string, value: any) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) =>
        i === index ? { ...subtask, [field]: value } : subtask
      ),
    }));
  };

  const removeSubTask = (index: number) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubTaskStatusChange = (index: number, status: string, delayReason?: string, delayNotes?: string) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) =>
        i === index ? { 
          ...subtask, 
          status: status as any, 
          delay_reason: delayReason,
          delay_notes: delayNotes,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          started_at: status === 'in_progress' && !subtask.started_at ? new Date().toISOString() : subtask.started_at
        } : subtask
      ),
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTaskForm(prev => {
        const oldIndex = prev.subtasks.findIndex(item => item.id === active.id);
        const newIndex = prev.subtasks.findIndex(item => item.id === over?.id);

        const reorderedSubtasks = arrayMove(prev.subtasks, oldIndex, newIndex);

        // Update order positions
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
    
    const taskData = {
      ...taskForm,
      created_by: user?.id || 1,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const startEditing = (task: EnhancedFinOpsTask) => {
    setEditingTask(task);
    setTaskForm({
      task_name: task.task_name,
      description: task.description,
      assigned_to: task.assigned_to,
      reporting_managers: task.reporting_managers,
      escalation_managers: task.escalation_managers,
      effective_from: task.effective_from,
      duration: task.duration,
      is_active: task.is_active,
      subtasks: task.subtasks,
    });
    setIsCreateDialogOpen(true);
  };

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

  const getTaskSummary = (task: EnhancedFinOpsTask) => {
    const totalSubtasks = task.subtasks.length;
    const completedSubtasks = task.subtasks.filter(st => st.status === "completed").length;
    const delayedSubtasks = task.subtasks.filter(st => st.status === "delayed").length;
    const overdueSubtasks = task.subtasks.filter(st => st.status === "overdue").length;
    
    return {
      total: totalSubtasks,
      completed: completedSubtasks,
      delayed: delayedSubtasks,
      overdue: overdueSubtasks,
      inProgress: task.subtasks.filter(st => st.status === "in_progress").length,
      pending: task.subtasks.filter(st => st.status === "pending").length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced FinOps Task Tracker</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive task management with SLA monitoring, delay tracking, and automated alerting
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Tasks List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading FinOps tasks...</p>
            </CardContent>
          </Card>
        ) : finopsTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No FinOps Tasks</h3>
              <p className="text-gray-600 mb-4">
                Create your first task to start tracking your FinOps processes.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          finopsTasks.map((task: EnhancedFinOpsTask) => {
            const summary = getTaskSummary(task);
            const taskStatus = summary.overdue > 0 ? "overdue" : 
                             summary.delayed > 0 ? "delayed" :
                             summary.completed === summary.total && summary.total > 0 ? "completed" :
                             summary.inProgress > 0 ? "in_progress" : "pending";
            const StatusIcon = getStatusIcon(taskStatus);

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{task.task_name}</CardTitle>
                        <Badge variant={task.is_active ? "default" : "secondary"}>
                          {task.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className={getStatusColor(taskStatus)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {task.duration}
                        </Badge>
                      </div>
                      <CardDescription>{task.description}</CardDescription>
                      
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Assigned: {task.assigned_to}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Reporting: {task.reporting_managers.length} managers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Next run: {task.next_run ? format(new Date(task.next_run), "MMM d, h:mm a") : "Not scheduled"}</span>
                        </div>
                      </div>

                      {/* Task Summary */}
                      <div className="grid grid-cols-5 gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{summary.total}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{summary.completed}</div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{summary.inProgress}</div>
                          <div className="text-xs text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">{summary.delayed}</div>
                          <div className="text-xs text-gray-600">Delayed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">{summary.overdue}</div>
                          <div className="text-xs text-gray-600">Overdue</div>
                        </div>
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
                          if (confirm(`Are you sure you want to delete "${task.task_name}"?`)) {
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

                {/* SubTasks Preview with Enhanced Information */}
                {task.subtasks.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Subtasks ({summary.completed}/{summary.total} completed)
                      </h4>
                      <div className="grid gap-3">
                        {task.subtasks.map((subtask) => {
                          const SubTaskStatusIcon = getStatusIcon(subtask.status);
                          return (
                            <div key={subtask.id} className="flex items-center justify-between text-sm p-3 border rounded-lg">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <SubTaskStatusIcon className={`w-4 h-4 flex-shrink-0 ${getStatusColor(subtask.status).split(' ')[0]}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{subtask.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-3">
                                    <span>Start: {subtask.start_time}</span>
                                    <span>SLA: {subtask.sla_hours}h {subtask.sla_minutes}m</span>
                                    {subtask.status === "delayed" && subtask.delay_reason && (
                                      <span className="text-yellow-600">⚠ {subtask.delay_reason}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge className={getStatusColor(subtask.status)}>
                                {subtask.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          );
                        })}
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
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setEditingTask(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit FinOps Task" : "Create New FinOps Task"}
            </DialogTitle>
            <DialogDescription>
              Configure comprehensive FinOps processes with SLA tracking, delay management, and automated alerting.
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
                  onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                  placeholder="e.g., CLEARING - FILE TRANSFER AND VALIDATION"
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={taskForm.duration}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, duration: value as any }))}
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

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., clearing daily steps for file transfer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To *</Label>
                <Select
                  value={taskForm.assigned_to}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user: any, index: number, arr: any[]) =>
                        arr.findIndex(u => u.id === user.id) === index
                      )
                      .map((user: any, index: number) => (
                        <SelectItem key={`enhanced-assigned-${user.id}-${index}`} value={`${user.first_name} ${user.last_name}`}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="effective_from">Effective From *</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={taskForm.effective_from}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, effective_from: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Team Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Team & Escalation</h3>
              
              <div>
                <Label>Reporting Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add reporting manager (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !taskForm.reporting_managers.includes(value)) {
                          setTaskForm(prev => ({
                            ...prev,
                            reporting_managers: [...prev.reporting_managers, value]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.reporting_managers.map((manager, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {manager}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setTaskForm(prev => ({
                          ...prev,
                          reporting_managers: prev.reporting_managers.filter((_, i) => i !== index)
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Escalation Managers</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add escalation manager (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !taskForm.escalation_managers.includes(value)) {
                          setTaskForm(prev => ({
                            ...prev,
                            escalation_managers: [...prev.escalation_managers, value]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taskForm.escalation_managers.map((manager, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {manager}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setTaskForm(prev => ({
                          ...prev,
                          escalation_managers: prev.escalation_managers.filter((_, i) => i !== index)
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={taskForm.is_active}
                  onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Task is active</Label>
              </div>
            </div>

            {/* Enhanced SubTasks with SLA and Time Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Enhanced Subtasks with SLA Tracking</h3>
                <Button type="button" onClick={addSubTask} variant="outline" size="sm">
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
                  items={taskForm.subtasks.map(st => st.id)}
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
                        onStatusChange={handleSubTaskStatusChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {taskForm.subtasks.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Timer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No subtasks added yet</p>
                  <p className="text-sm">Add subtasks to break down your FinOps process with SLA tracking</p>
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
              <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {editingTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
