import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Rocket,
  Package,
  Server,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Save,
  Play,
} from "lucide-react";

export default function NewDeployment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product: "",
    version: "",
    environment: "",
    description: "",
    assignedTo: "",
    scheduledDate: "",
    scheduledTime: "",
    autoRollback: true,
    notifyTeam: true,
    runTests: true,
    requireApproval: false,
    releaseNotes: "",
    initialStatus: "pending",
  });

  const products = [
    { id: "core-app", name: "Core App", currentVersion: "v2.0.9" },
    { id: "analytics", name: "Analytics Module", currentVersion: "v1.5.1" },
    { id: "api-gateway", name: "API Gateway", currentVersion: "v3.0.0" },
    { id: "mobile-app", name: "Mobile App", currentVersion: "v1.2.2" },
    { id: "reporting", name: "Reporting Service", currentVersion: "v0.8.9" },
  ];

  const environments = [
    { id: "staging", name: "Staging", description: "Pre-production testing" },
    { id: "production", name: "Production", description: "Live environment" },
    { id: "development", name: "Development", description: "Dev environment" },
    { id: "qa", name: "QA", description: "Quality assurance testing" },
  ];

  const teamMembers = [
    { id: "jane-doe", name: "Jane Doe", role: "Lead Developer" },
    { id: "mike-johnson", name: "Mike Johnson", role: "DevOps Engineer" },
    { id: "alice-brown", name: "Alice Brown", role: "QA Engineer" },
    { id: "john-smith", name: "John Smith", role: "Product Manager" },
  ];

  const handleBack = () => {
    navigate("/product");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating deployment:", formData);
    navigate("/product");
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedProduct = products.find((p) => p.id === formData.product);
  const selectedEnvironment = environments.find(
    (e) => e.id === formData.environment,
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Deployment</h1>
          <p className="text-gray-600 mt-1">
            Create and configure a new product deployment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deployment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Deployment Details</span>
            </CardTitle>
            <CardDescription>
              Configure the basic deployment parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => handleInputChange("product", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                        <span className="text-gray-500 ml-2">
                          ({product.currentVersion})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Current: {selectedProduct.currentVersion}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => handleInputChange("version", e.target.value)}
                  placeholder="e.g., v2.1.0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="environment">Deployment Environment *</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) =>
                  handleInputChange("environment", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      <div className="flex flex-col">
                        <span>{env.name}</span>
                        <span className="text-sm text-gray-500">
                          {env.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEnvironment && formData.environment === "production" && (
                <div className="mt-2 flex items-center space-x-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Production deployment requires additional approval
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Brief description of the deployment..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Scheduling</span>
            </CardTitle>
            <CardDescription>
              Set deployment timing and assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    handleInputChange("scheduledDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    handleInputChange("scheduledTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) =>
                  handleInputChange("assignedTo", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col">
                        <span>{member.name}</span>
                        <span className="text-sm text-gray-500">
                          {member.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="initialStatus">Initial Status</Label>
              <Select
                value={formData.initialStatus}
                onValueChange={(value) =>
                  handleInputChange("initialStatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ready">Ready to Deploy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Configuration Options</span>
            </CardTitle>
            <CardDescription>
              Set deployment behavior and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.autoRollback}
                  onCheckedChange={(checked) =>
                    handleInputChange("autoRollback", checked)
                  }
                />
                <Label className="text-sm">
                  Enable automatic rollback on failure
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.runTests}
                  onCheckedChange={(checked) =>
                    handleInputChange("runTests", checked)
                  }
                />
                <Label className="text-sm">
                  Run automated tests before deployment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.notifyTeam}
                  onCheckedChange={(checked) =>
                    handleInputChange("notifyTeam", checked)
                  }
                />
                <Label className="text-sm">
                  Send notifications to team members
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.requireApproval}
                  onCheckedChange={(checked) =>
                    handleInputChange("requireApproval", checked)
                  }
                />
                <Label className="text-sm">
                  Require approval before deployment
                </Label>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="releaseNotes">Release Notes</Label>
              <Textarea
                id="releaseNotes"
                value={formData.releaseNotes}
                onChange={(e) =>
                  handleInputChange("releaseNotes", e.target.value)
                }
                placeholder="What's new in this release..."
                rows={4}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pre-deployment Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Pre-deployment Checklist</span>
            </CardTitle>
            <CardDescription>Ensure all requirements are met</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">Code review completed</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm">Unit tests passing</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm">Integration tests pending</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                <span className="text-sm text-gray-600">
                  Database migration scripts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <div className="space-x-3">
            <Button type="button" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button type="submit">
              <Rocket className="w-4 h-4 mr-2" />
              Create Deployment
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
