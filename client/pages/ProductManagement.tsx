import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Search,
  Filter,
  Package,
  Rocket,
  Target,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  GitBranch,
  Code,
  Bug,
  Zap,
  Star,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: number;
  name: string;
  description?: string;
  category: "core" | "feature" | "integration" | "tool";
  status:
    | "planning"
    | "development"
    | "testing"
    | "staging"
    | "production"
    | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  assigned_team?: string;
  project_manager?: string;
  start_date?: string;
  target_release_date?: string;
  actual_release_date?: string;
  version?: string;
  progress_percentage?: number;
  budget?: number;
  estimated_effort_hours?: number;
  actual_effort_hours?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  tags?: string[];
  dependencies?: string[];
  features?: ProductFeature[];
  milestones?: ProductMilestone[];
}

interface ProductFeature {
  id: number;
  name: string;
  description?: string;
  status: "backlog" | "planning" | "development" | "testing" | "done";
  priority: "low" | "medium" | "high";
  assigned_to?: string;
  estimated_hours?: number;
  sprint?: string;
}

interface ProductMilestone {
  id: number;
  title: string;
  description?: string;
  target_date: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  completion_percentage?: number;
}

const productCategories = [
  { value: "core", label: "Core Product", icon: Package, color: "bg-blue-500" },
  {
    value: "feature",
    label: "Feature Module",
    icon: Zap,
    color: "bg-green-500",
  },
  {
    value: "integration",
    label: "Integration",
    icon: GitBranch,
    color: "bg-purple-500",
  },
  { value: "tool", label: "Tool/Utility", icon: Code, color: "bg-orange-500" },
];

const productStatuses = [
  { value: "planning", label: "Planning", color: "bg-gray-500" },
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "testing", label: "Testing", color: "bg-yellow-500" },
  { value: "staging", label: "Staging", color: "bg-purple-500" },
  { value: "production", label: "Production", color: "bg-green-500" },
  { value: "deprecated", label: "Deprecated", color: "bg-red-500" },
];

const priorities = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
];

const teams = [
  "Frontend Team",
  "Backend Team",
  "DevOps Team",
  "QA Team",
  "Design Team",
  "Data Team",
];
const projectManagers = [
  "Alice Johnson",
  "Bob Smith",
  "Carol Davis",
  "David Wilson",
];

// Mock data for products (would come from API in real implementation)
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Core Authentication System",
    description: "Multi-factor authentication and user management system",
    category: "core",
    status: "production",
    priority: "high",
    assigned_team: "Backend Team",
    project_manager: "Alice Johnson",
    start_date: "2024-01-15",
    target_release_date: "2024-03-15",
    actual_release_date: "2024-03-10",
    version: "v2.1.0",
    progress_percentage: 100,
    budget: 150000,
    estimated_effort_hours: 800,
    actual_effort_hours: 750,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-03-10T00:00:00Z",
    created_by: 1,
    tags: ["security", "authentication", "core"],
    dependencies: ["User Management API"],
    features: [
      {
        id: 1,
        name: "OAuth 2.0 Integration",
        status: "done",
        priority: "high",
        estimated_hours: 40,
      },
      {
        id: 2,
        name: "2FA Implementation",
        status: "done",
        priority: "high",
        estimated_hours: 60,
      },
    ],
    milestones: [
      {
        id: 1,
        title: "MVP Release",
        target_date: "2024-02-15",
        status: "completed",
        completion_percentage: 100,
      },
      {
        id: 2,
        title: "Production Deployment",
        target_date: "2024-03-15",
        status: "completed",
        completion_percentage: 100,
      },
    ],
  },
  {
    id: 2,
    name: "Analytics Dashboard",
    description: "Real-time analytics and reporting dashboard",
    category: "feature",
    status: "development",
    priority: "medium",
    assigned_team: "Frontend Team",
    project_manager: "Bob Smith",
    start_date: "2024-02-01",
    target_release_date: "2024-04-30",
    version: "v1.0.0",
    progress_percentage: 65,
    budget: 100000,
    estimated_effort_hours: 600,
    actual_effort_hours: 390,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-03-20T00:00:00Z",
    created_by: 2,
    tags: ["analytics", "dashboard", "reporting"],
    dependencies: ["Data Pipeline", "Chart Library"],
    features: [
      {
        id: 3,
        name: "Real-time Charts",
        status: "development",
        priority: "high",
        estimated_hours: 80,
      },
      {
        id: 4,
        name: "Export Functionality",
        status: "planning",
        priority: "medium",
        estimated_hours: 40,
      },
    ],
    milestones: [
      {
        id: 3,
        title: "UI Prototype",
        target_date: "2024-03-01",
        status: "completed",
        completion_percentage: 100,
      },
      {
        id: 4,
        title: "Beta Testing",
        target_date: "2024-04-15",
        status: "in_progress",
        completion_percentage: 30,
      },
    ],
  },
  {
    id: 3,
    name: "Payment Gateway Integration",
    description: "Integration with multiple payment providers",
    category: "integration",
    status: "testing",
    priority: "critical",
    assigned_team: "Backend Team",
    project_manager: "Carol Davis",
    start_date: "2024-01-01",
    target_release_date: "2024-03-31",
    version: "v1.2.0",
    progress_percentage: 85,
    budget: 80000,
    estimated_effort_hours: 400,
    actual_effort_hours: 340,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-03-25T00:00:00Z",
    created_by: 1,
    tags: ["payment", "integration", "fintech"],
    dependencies: ["Security Framework", "Compliance Module"],
    features: [
      {
        id: 5,
        name: "Stripe Integration",
        status: "done",
        priority: "high",
        estimated_hours: 60,
      },
      {
        id: 6,
        name: "PayPal Integration",
        status: "testing",
        priority: "medium",
        estimated_hours: 50,
      },
    ],
    milestones: [
      {
        id: 5,
        title: "Integration Setup",
        target_date: "2024-02-01",
        status: "completed",
        completion_percentage: 100,
      },
      {
        id: 6,
        title: "Security Testing",
        target_date: "2024-03-20",
        status: "in_progress",
        completion_percentage: 80,
      },
    ],
  },
];

function CreateProductDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "planning",
    priority: "medium",
    assigned_team: "",
    project_manager: "",
    target_release_date: "",
    budget: "",
    estimated_effort_hours: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In real implementation, this would call the API
    console.log("Creating product:", formData);

    // Reset form and close dialog
    setFormData({
      name: "",
      description: "",
      category: "",
      status: "planning",
      priority: "medium",
      assigned_team: "",
      project_manager: "",
      target_release_date: "",
      budget: "",
      estimated_effort_hours: "",
      tags: "",
    });
    onClose();
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the product"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_team">Assigned Team</Label>
              <Select
                value={formData.assigned_team}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assigned_team: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_manager">Project Manager</Label>
              <Select
                value={formData.project_manager}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, project_manager: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {projectManagers.map((pm) => (
                    <SelectItem key={pm} value={pm}>
                      {pm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_release_date">Target Release Date</Label>
              <Input
                id="target_release_date"
                type="date"
                value={formData.target_release_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_release_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budget: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="estimated_effort_hours">
                Estimated Effort (hours)
              </Label>
              <Input
                id="estimated_effort_hours"
                type="number"
                value={formData.estimated_effort_hours}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimated_effort_hours: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="e.g., security, api, frontend"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // In real implementation, these would be actual API calls
  const products = mockProducts;

  // Calculate dashboard stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) =>
    ["development", "testing", "staging"].includes(p.status),
  ).length;
  const completedProducts = products.filter(
    (p) => p.status === "production",
  ).length;
  const avgProgress =
    products.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
    products.length;

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesPriority =
      priorityFilter === "all" || product.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    const statusObj = productStatuses.find((s) => s.value === status);
    return statusObj?.color || "bg-gray-500";
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = productCategories.find((c) => c.value === category);
    return categoryObj?.icon || Package;
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find((p) => p.value === priority);
    return priorityObj?.color || "text-gray-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage product development lifecycle and roadmap
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Product
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Products
                </p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Development
                </p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
              <Rocket className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Production
                </p>
                <p className="text-2xl font-bold">{completedProducts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Progress
                </p>
                <p className="text-2xl font-bold">{avgProgress.toFixed(0)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {productStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {productCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/product/workflow")}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Lead-to-Product Workflow
        </Button>
      </div>

      {/* Products List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const CategoryIcon = getCategoryIcon(product.category);

              return (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-5 h-5" />
                        <div>
                          <CardTitle className="text-lg">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            v{product.version || "1.0.0"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(product.status)}>
                        {product.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{product.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${product.progress_percentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span className={getPriorityColor(product.priority)}>
                          {product.priority}
                        </span>
                      </div>
                      {product.assigned_team && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">
                            {product.assigned_team}
                          </span>
                        </div>
                      )}
                    </div>

                    {product.target_release_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Target:{" "}
                          {format(
                            new Date(product.target_release_date),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Product</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Progress</th>
                      <th className="text-left p-4 font-medium">Team</th>
                      <th className="text-left p-4 font-medium">Target Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {React.createElement(
                              getCategoryIcon(product.category),
                              { className: "w-4 h-4" },
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                v{product.version || "1.0.0"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={getPriorityColor(product.priority)}>
                            {product.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${product.progress_percentage || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {product.progress_percentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {product.assigned_team || "Unassigned"}
                        </td>
                        <td className="p-4 text-sm">
                          {product.target_release_date
                            ? format(
                                new Date(product.target_release_date),
                                "MMM d, yyyy",
                              )
                            : "Not set"}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {productStatuses.slice(0, 4).map((status) => {
              const statusProducts = filteredProducts.filter(
                (p) => p.status === status.value,
              );

              return (
                <Card key={status.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      {status.label}
                      <Badge variant="secondary" className="text-xs">
                        {statusProducts.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {statusProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="p-3 hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm">
                            {product.name}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={getPriorityColor(product.priority)}
                            >
                              {product.priority}
                            </span>
                            <span>{product.progress_percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{
                                width: `${product.progress_percentage || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    {statusProducts.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No products
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Product Dialog */}
      <CreateProductDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          // In real implementation, this would refetch data
          console.log("Product created successfully");
        }}
      />
    </div>
  );
}
