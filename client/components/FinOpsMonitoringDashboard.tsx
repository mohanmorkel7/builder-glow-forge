import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  PlayCircle,
  Calendar,
  Activity,
  User,
  Timer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface FinOpsSubTask {
  id: string;
  name: string;
  description?: string;
  sla_hours: number;
  sla_minutes: number;
  status: "pending" | "in_progress" | "completed" | "overdue";
  started_at?: string;
  completed_at?: string;
  order_position: number;
}

interface FinOpsTask {
  id: number;
  task_name: string;
  description: string;
  assigned_to: string;
  reporting_managers: string[];
  escalation_managers: string[];
  status: "active" | "inactive" | "completed" | "overdue";
  subtasks: FinOpsSubTask[];
  next_run?: string;
  last_run?: string;
}

interface ActivityLogEntry {
  id: number;
  task_id: number;
  subtask_id?: string;
  action: string;
  user_name: string;
  timestamp: string;
  details: string;
  task_name?: string;
  subtask_name?: string;
}

interface DailyTasksResponse {
  date: string;
  tasks: FinOpsTask[];
  summary: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    in_progress_tasks: number;
  };
}

export default function FinOpsMonitoringDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch daily tasks
  const { data: dailyTasksData, isLoading: tasksLoading, refetch: refetchTasks } = useQuery<DailyTasksResponse>({
    queryKey: ["finops-daily-tasks", selectedDate],
    queryFn: () => apiClient.getFinOpsDailyTasks(selectedDate),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch activity log
  const { data: activityLog = [], isLoading: activityLoading, refetch: refetchActivity } = useQuery<ActivityLogEntry[]>({
    queryKey: ["finops-activity-log"],
    queryFn: () => apiClient.getFinOpsActivityLog({ limit: 50 }),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch scheduler status
  const { data: schedulerStatus, refetch: refetchScheduler } = useQuery({
    queryKey: ["finops-scheduler-status"],
    queryFn: () => apiClient.getFinOpsSchedulerStatus(),
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return PlayCircle;
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
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSLATimeRemaining = (subtask: FinOpsSubTask) => {
    if (!subtask.started_at || subtask.status === 'completed') return null;
    
    const startTime = new Date(subtask.started_at);
    const slaTime = new Date(startTime.getTime() + (subtask.sla_hours * 60 + subtask.sla_minutes) * 60000);
    const now = new Date();
    const timeRemaining = slaTime.getTime() - now.getTime();
    
    if (timeRemaining < 0) {
      return { text: `Overdue by ${formatDistanceToNow(slaTime)}`, color: "text-red-600" };
    } else {
      return { text: `${formatDistanceToNow(slaTime)} remaining`, color: timeRemaining < 15 * 60000 ? "text-yellow-600" : "text-green-600" };
    }
  };

  const manualRefresh = () => {
    refetchTasks();
    refetchActivity();
    refetchScheduler();
  };

  const triggerSLACheck = async () => {
    try {
      await apiClient.triggerFinOpsSLACheck();
      alert('SLA check triggered successfully');
      refetchTasks();
    } catch (error) {
      console.error('Error triggering SLA check:', error);
      alert('Failed to trigger SLA check');
    }
  };

  const triggerDailyExecution = async () => {
    try {
      await apiClient.triggerFinOpsDailyExecution();
      alert('Daily execution triggered successfully');
      refetchTasks();
    } catch (error) {
      console.error('Error triggering daily execution:', error);
      alert('Failed to trigger daily execution');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FinOps Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring of automated FinOps processes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10000">10 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
              <SelectItem value="300000">5 minutes</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 text-green-700" : ""}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={manualRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {dailyTasksData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyTasksData.summary.total_tasks}</div>
              <p className="text-xs text-muted-foreground">Today's active tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dailyTasksData.summary.completed_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {dailyTasksData.summary.total_tasks > 0 
                  ? Math.round((dailyTasksData.summary.completed_tasks / dailyTasksData.summary.total_tasks) * 100)
                  : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dailyTasksData.summary.in_progress_tasks}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dailyTasksData.summary.overdue_tasks}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Control Panel
          </CardTitle>
          <CardDescription>Manual triggers and scheduler information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button onClick={triggerSLACheck} variant="outline" size="sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Check SLA
            </Button>
            <Button onClick={triggerDailyExecution} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Trigger Daily Tasks
            </Button>
          </div>
          
          {schedulerStatus && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Scheduler Status: 
                <Badge className={schedulerStatus.initialized ? "ml-2 bg-green-100 text-green-800" : "ml-2 bg-red-100 text-red-800"}>
                  {schedulerStatus.initialized ? "Running" : "Stopped"}
                </Badge>
              </h4>
              {schedulerStatus.activeJobs && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {schedulerStatus.activeJobs.map((job: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      {job}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Daily Tasks ({selectedDate})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p>Loading tasks...</p>
              </div>
            ) : dailyTasksData?.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No tasks scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyTasksData?.tasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  return (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.task_name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.assigned_to}
                            </span>
                            {task.next_run && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {format(new Date(task.next_run), "h:mm a")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {task.status}
                        </Badge>
                      </div>

                      {/* Subtasks */}
                      <div className="space-y-2">
                        {task.subtasks.slice(0, 3).map((subtask) => {
                          const SubTaskStatusIcon = getStatusIcon(subtask.status);
                          const slaInfo = getSLATimeRemaining(subtask);
                          
                          return (
                            <div key={subtask.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <SubTaskStatusIcon className={`w-3 h-3 flex-shrink-0 ${getStatusColor(subtask.status).split(' ')[0]}`} />
                                <span className="truncate">{subtask.name}</span>
                              </div>
                              <div className="text-right ml-2 flex-shrink-0">
                                <div className="text-gray-500">
                                  SLA: {subtask.sla_hours}h {subtask.sla_minutes}m
                                </div>
                                {slaInfo && (
                                  <div className={`${slaInfo.color} font-medium`}>
                                    {slaInfo.text}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {task.subtasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{task.subtasks.length - 3} more subtasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p>Loading activity...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLog.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <div className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.action.replace('_', ' ')}
                          </Badge>
                          <span className="text-gray-600">{entry.user_name}</span>
                        </div>
                        <p className="text-gray-800">{entry.details}</p>
                        {entry.task_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Task: {entry.task_name}
                            {entry.subtask_name && ` → ${entry.subtask_name}`}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(entry.timestamp))} ago
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dailyTasksData?.summary.overdue_tasks > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">SLA Breach Alert</AlertTitle>
          <AlertDescription className="text-red-700">
            There are {dailyTasksData.summary.overdue_tasks} overdue tasks that require immediate attention.
            Escalation managers have been notified.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
