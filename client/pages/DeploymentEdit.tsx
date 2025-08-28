import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDeployments, useUsers } from "@/hooks/useApi";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Settings,
  Activity,
  GitBranch,
  Server,
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
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
  description:
    "Major feature release including new dashboard widgets and performance improvements",
  autoRollback: true,
  healthCheckEnabled: true,
  notificationsEnabled: true,
  maxRetries: 3,
  timeout: 30,
  variables: {
    NODE_ENV: "production",
    API_URL: "https://api.example.com",
    CACHE_ENABLED: "true",
  },
};

export default function DeploymentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: deployments = [] } = useDeployments();
  const { data: users = [] } = useUsers();

  // Find deployment by ID or use mock data
  const originalDeployment =
    deployments.find((d: any) => d.id === id) || mockDeployment;

  const [deployment, setDeployment] = useState({
    ...originalDeployment,
    variables: originalDeployment.variables || {},
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setDeployment((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const updateVariable = (key: string, value: string) => {
    setDeployment((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const addVariable = () => {
    const key = prompt("Enter variable name:");
    if (key && !deployment.variables[key]) {
      updateVariable(key, "");
    }
  };

  const removeVariable = (key: string) => {
    setDeployment((prev) => ({
      ...prev,
      variables: Object.fromEntries(
        Object.entries(prev.variables).filter(([k]) => k !== key),
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would make an API call to update the deployment
      console.log("Saving deployment:", deployment);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setHasChanges(false);
      navigate(`/product/deployment/${id}`);
    } catch (error) {
      console.error("Failed to save deployment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateField("status", newStatus);
    console.log(`Changing deployment status to: ${newStatus}`);
  };

  const handleAction = (action: string) => {
    console.log(`Performing action: ${action} on deployment ${id}`);
    // Here you would make API calls for deployment actions
    switch (action) {
      case "pause":
        updateField("status", "paused");
        break;
      case "resume":
        updateField("status", "in_progress");
        break;
      case "stop":
        updateField("status", "stopped");
        break;
      case "retry":
        updateField("status", "in_progress");
        updateField("progress", 0);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "paused":
        return "bg-orange-100 text-orange-700";
      case "stopped":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/product/deployment/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Deployment
            </h1>
            <p className="text-gray-600">{deployment.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="min-w-20"
          >
            {saving ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Deployment Control</span>
          </CardTitle>
          <CardDescription>
            Manage the current status and control the deployment process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Current Status</p>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deployment.status)}`}
              >
                {deployment.status.charAt(0).toUpperCase() +
                  deployment.status.slice(1).replace("_", " ")}
              </div>
            </div>
            <div className="flex space-x-2">
              {deployment.status === "in_progress" && (
                <>
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
                </>
              )}
              {deployment.status === "paused" && (
                <Button size="sm" onClick={() => handleAction("resume")}>
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
              )}
              {(deployment.status === "failed" ||
                deployment.status === "stopped") && (
                <Button size="sm" onClick={() => handleAction("retry")}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {deployment.status === "in_progress" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{deployment.progress}%</span>
              </div>
              <Progress value={deployment.progress} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status-select">Force Status Change</Label>
              <Select
                value={deployment.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress-input">Progress Override (%)</Label>
              <Input
                id="progress-input"
                type="number"
                min="0"
                max="100"
                value={deployment.progress}
                onChange={(e) =>
                  updateField("progress", parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Configuration */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Deployment Name</Label>
                  <Input
                    id="name"
                    value={deployment.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={deployment.version}
                    onChange={(e) => updateField("version", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={deployment.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={deployment.product}
                    onValueChange={(value) => updateField("product", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Core App">Core App</SelectItem>
                      <SelectItem value="Analytics Module">
                        Analytics Module
                      </SelectItem>
                      <SelectItem value="API Gateway">API Gateway</SelectItem>
                      <SelectItem value="Mobile App">Mobile App</SelectItem>
                      <SelectItem value="Reporting Service">
                        Reporting Service
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">Git Branch</Label>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="branch"
                      value={deployment.branch}
                      onChange={(e) => updateField("branch", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deployedBy">Deployed By</Label>
                  <Select
                    value={deployment.deployedBy}
                    onValueChange={(value) => updateField("deployedBy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users as any[]).map((user: any) => (
                        <SelectItem
                          key={user.id}
                          value={user.first_name + " " + user.last_name}
                        >
                          {user.first_name} {user.last_name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={deployment.assignedTo || deployment.deployedBy}
                    onValueChange={(value) => updateField("assignedTo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users as any[])
                        .filter(
                          (user: any) =>
                            user.role === "product" || user.role === "admin",
                        )
                        .map((user: any) => (
                          <SelectItem
                            key={user.id}
                            value={user.first_name + " " + user.last_name}
                          >
                            {user.first_name} {user.last_name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="environment">Target Environment</Label>
                <Select
                  value={deployment.environment}
                  onValueChange={(value) => updateField("environment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  {deployment.environment === "production"
                    ? "Production deployments require additional approvals and monitoring."
                    : `Deploying to ${deployment.environment} environment.`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Rollback on Failure</Label>
                    <p className="text-sm text-gray-600">
                      Automatically rollback if deployment fails
                    </p>
                  </div>
                  <Switch
                    checked={deployment.autoRollback}
                    onCheckedChange={(checked) =>
                      updateField("autoRollback", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Health Check</Label>
                    <p className="text-sm text-gray-600">
                      Run health checks after deployment
                    </p>
                  </div>
                  <Switch
                    checked={deployment.healthCheckEnabled}
                    onCheckedChange={(checked) =>
                      updateField("healthCheckEnabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Send notifications on status changes
                    </p>
                  </div>
                  <Switch
                    checked={deployment.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      updateField("notificationsEnabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxRetries">Max Retry Attempts</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    value={deployment.maxRetries}
                    onChange={(e) =>
                      updateField("maxRetries", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (minutes)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1"
                    max="120"
                    value={deployment.timeout}
                    onChange={(e) =>
                      updateField("timeout", parseInt(e.target.value) || 30)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Manage environment variables for this deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Variables</Label>
                <Button size="sm" variant="outline" onClick={addVariable}>
                  Add Variable
                </Button>
              </div>

              <div className="space-y-3">
                {Object.entries(deployment.variables).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          if (newKey !== key) {
                            const newVars = { ...deployment.variables };
                            delete newVars[key];
                            newVars[newKey] = value;
                            setDeployment((prev) => ({
                              ...prev,
                              variables: newVars,
                            }));
                            setHasChanges(true);
                          }
                        }}
                        placeholder="Variable name"
                      />
                      <Input
                        value={value as string}
                        onChange={(e) => updateVariable(key, e.target.value)}
                        placeholder="Variable value"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariable(key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {Object.keys(deployment.variables).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No environment variables configured
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
