import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDeployments } from "@/hooks/useApi";
import {
  useDeploymentControl,
  useDeploymentStatus,
} from "@/hooks/useDeploymentControl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Edit3,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Rocket,
  Server,
  GitBranch,
  Calendar,
  User,
  Activity,
} from "lucide-react";

const mockDeployment = {
  id: "1",
  name: "Core App v2.1.0",
  product: "Core App",
  version: "v2.1.0",
  status: "in_progress",
  progress: 65,
  branch: "release/v2.1.0",
  environment: "production",
  deployedBy: "Jane Doe",
  startedAt: "2024-01-28T10:30:00Z",
  estimatedCompletion: "2024-01-28T11:15:00Z",
  description:
    "Major feature release including new dashboard widgets and performance improvements",
  steps: [
    { name: "Build Application", status: "completed", duration: "2m 15s" },
    { name: "Run Tests", status: "completed", duration: "5m 30s" },
    { name: "Deploy to Staging", status: "completed", duration: "1m 45s" },
    {
      name: "Run Integration Tests",
      status: "in_progress",
      duration: "3m 20s",
    },
    { name: "Deploy to Production", status: "pending", duration: "~2m" },
    { name: "Health Check", status: "pending", duration: "~30s" },
    { name: "Notification", status: "pending", duration: "~5s" },
  ],
  logs: [
    "2024-01-28 10:30:15 INFO: Starting deployment for Core App v2.1.0",
    "2024-01-28 10:30:20 INFO: Checking out branch release/v2.1.0",
    "2024-01-28 10:30:25 INFO: Installing dependencies...",
    "2024-01-28 10:31:45 INFO: Building application...",
    "2024-01-28 10:34:00 INFO: Build completed successfully",
    "2024-01-28 10:34:05 INFO: Running test suite...",
    "2024-01-28 10:39:35 INFO: All tests passed (127/127)",
    "2024-01-28 10:39:40 INFO: Deploying to staging environment...",
    "2024-01-28 10:41:25 INFO: Staging deployment successful",
    "2024-01-28 10:41:30 INFO: Running integration tests...",
    "2024-01-28 10:44:50 INFO: Integration tests in progress (15/23 completed)...",
  ],
};

export default function DeploymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: deployments = [] } = useDeployments();

  // Find deployment by ID or use mock data
  const deployment =
    deployments.find((d: any) => d.id === id) || mockDeployment;

  // Real-time deployment control and status
  const {
    updateStatus,
    actions,
    isLoading,
    progress: liveProgress,
  } = useDeploymentControl(id);

  const {
    status: liveStatus,
    isLive,
    progress: progressPercent,
    currentStep,
    steps: liveSteps,
    logs: liveLogs,
  } = useDeploymentStatus(id || "");

  // Use live data when available, fallback to deployment data
  const currentStatus =
    liveStatus !== "unknown" ? liveStatus : deployment.status;
  const currentProgress =
    liveProgress?.progress || progressPercent || deployment.progress;
  const currentSteps = liveSteps.length > 0 ? liveSteps : deployment.steps;
  const currentLogs = liveLogs.length > 0 ? liveLogs : deployment.logs;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "failed":
        return AlertTriangle;
      case "in_progress":
        return Clock;
      case "pending":
        return Clock;
      default:
        return Rocket;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (id) {
      updateStatus(id, newStatus);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "pause":
        actions.pause();
        break;
      case "resume":
        actions.resume();
        break;
      case "stop":
        actions.stop();
        break;
      case "retry":
        actions.retry();
        break;
      case "rollback":
        actions.rollback();
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const StatusIcon = getStatusIcon(currentStatus);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/product")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deployments
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {deployment.name}
            </h1>
            <p className="text-gray-600">{deployment.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/product/deployment/${id}/edit`)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={getStatusColor(currentStatus)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {currentStatus.charAt(0).toUpperCase() +
                    currentStatus.slice(1).replace("_", " ")}
                </Badge>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentProgress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity
                  className={`w-6 h-6 text-blue-600 ${isLive ? "animate-pulse" : ""}`}
                />
              </div>
            </div>
            <Progress value={currentProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Environment</p>
                <p className="text-lg font-semibold text-gray-900">
                  {deployment.environment}
                </p>
              </div>
              <Server className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deployed By</p>
                <p className="text-lg font-semibold text-gray-900">
                  {deployment.deployedBy}
                </p>
              </div>
              <User className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {currentStatus === "in_progress" && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Deployment is currently running. You can pause, stop, or monitor
              the progress.
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("pause")}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("stop")}
              >
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {currentStatus === "failed" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Deployment failed. You can retry the deployment or check the logs
              for more details.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("retry")}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Deployment Steps</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Branch</p>
                    <p className="text-sm text-gray-600">{deployment.branch}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Started At</p>
                    <p className="text-sm text-gray-600">
                      {new Date(deployment.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Estimated Completion</p>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        deployment.estimatedCompletion,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => handleAction("rollback")}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rollback Deployment
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => handleAction("promote")}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Promote to Production
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/product/deployment/new")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Create New Deployment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Pipeline</CardTitle>
              <CardDescription>
                Track the progress of each deployment step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentSteps.map((step: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    {getStepStatusIcon(step.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.name}</h4>
                        <span className="text-sm text-gray-500">
                          {step.duration ||
                            (step.status === "in_progress" ? "Running..." : "")}
                        </span>
                      </div>
                      {step.status === "in_progress" && (
                        <Progress value={75} className="mt-2 h-2" />
                      )}
                      {step.startTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Started: {step.startTime}{" "}
                          {step.endTime && `• Ended: ${step.endTime}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Logs</CardTitle>
              <CardDescription>
                Real-time logs from the deployment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {currentLogs.map((log: string, index: number) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
                {isLive && currentStatus === "in_progress" && (
                  <div className="animate-pulse">
                    <span className="inline-block w-2 h-4 bg-green-400 mr-1"></span>
                    Live deployment in progress...
                  </div>
                )}
                {!isLive && currentStatus === "in_progress" && (
                  <div className="text-yellow-400">
                    <span className="inline-block w-2 h-4 bg-yellow-400 mr-1"></span>
                    Deployment status: {currentStatus}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Configuration</CardTitle>
              <CardDescription>
                View and modify deployment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <p className="text-sm text-gray-600">
                    {deployment.environment}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <p className="text-sm text-gray-600">{deployment.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <p className="text-sm text-gray-600">{deployment.product}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <p className="text-sm text-gray-600">{deployment.branch}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
