import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Target,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Settings,
} from "lucide-react";

interface StepsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

export function StepsPreviewModal({
  isOpen,
  onClose,
  lead,
}: StepsPreviewModalProps) {
  if (!lead) return null;

  // Calculate estimated steps based on budget and complexity
  const estimatedSteps = Math.ceil((lead.estimated_budget || 100000) / 50000);

  // Generate step templates based on budget
  const generateSteps = (count: number) => {
    const baseSteps = [
      {
        name: "Requirements Analysis",
        description:
          "Analyze and document detailed requirements from lead information",
        estimatedHours: 16,
        category: "Planning",
      },
      {
        name: "Technical Architecture",
        description: "Design system architecture and technology stack",
        estimatedHours: 24,
        category: "Design",
      },
      {
        name: "UI/UX Design",
        description: "Create user interface designs and user experience flows",
        estimatedHours: 32,
        category: "Design",
      },
      {
        name: "Backend Development",
        description: "Implement server-side logic and database structure",
        estimatedHours: 80,
        category: "Development",
      },
      {
        name: "Frontend Development",
        description: "Build user interface and client-side functionality",
        estimatedHours: 64,
        category: "Development",
      },
      {
        name: "API Integration",
        description: "Connect frontend and backend systems",
        estimatedHours: 24,
        category: "Development",
      },
      {
        name: "Testing & QA",
        description: "Comprehensive testing and quality assurance",
        estimatedHours: 40,
        category: "Testing",
      },
      {
        name: "Deployment Setup",
        description: "Prepare production environment and deployment pipeline",
        estimatedHours: 16,
        category: "Deployment",
      },
      {
        name: "Documentation",
        description: "Create user and technical documentation",
        estimatedHours: 12,
        category: "Documentation",
      },
      {
        name: "Go-Live Support",
        description: "Launch support and initial monitoring",
        estimatedHours: 8,
        category: "Support",
      },
    ];

    return baseSteps.slice(0, Math.max(3, Math.min(10, count)));
  };

  const projectSteps = generateSteps(estimatedSteps);
  const totalHours = projectSteps.reduce(
    (sum, step) => sum + step.estimatedHours,
    0,
  );
  const totalCost = totalHours * 75; // Assuming ₹75/hour

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Planning":
        return "bg-purple-100 text-purple-700";
      case "Design":
        return "bg-blue-100 text-blue-700";
      case "Development":
        return "bg-green-100 text-green-700";
      case "Testing":
        return "bg-yellow-100 text-yellow-700";
      case "Deployment":
        return "bg-orange-100 text-orange-700";
      case "Documentation":
        return "bg-gray-100 text-gray-700";
      case "Support":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Project Steps Preview - {lead.client_name}
          </DialogTitle>
          <DialogDescription>
            Estimated project steps based on lead requirements and budget
            analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">Total Steps</Label>
                    <p className="text-lg font-bold text-blue-700">
                      {projectSteps.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      Estimated Hours
                    </Label>
                    <p className="text-lg font-bold text-blue-700">
                      {totalHours}h
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      Estimated Cost
                    </Label>
                    <p className="text-lg font-bold text-blue-700">
                      ₹{totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">Team Size</Label>
                    <p className="text-lg font-bold text-blue-700">
                      {Math.ceil(projectSteps.length / 3)}-
                      {Math.ceil(projectSteps.length / 2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimated Project Steps</CardTitle>
              <DialogDescription>
                These steps are automatically generated based on project scope
                and budget
              </DialogDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectSteps.map((step, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Step {index + 1}
                            </Badge>
                            <Badge className={getCategoryColor(step.category)}>
                              {step.category}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {step.estimatedHours}h
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {step.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {step.description}
                          </p>
                        </div>
                        <div className="ml-4">
                          <Badge variant="outline" className="bg-gray-50">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Reference */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">
                Source Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Project Title</Label>
                  <p className="text-green-700">{lead.project_title}</p>
                </div>
                <div>
                  <Label className="font-medium">Lead Budget</Label>
                  <p className="text-green-700">
                    ₹{lead.estimated_budget?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Lead Steps</Label>
                  <p className="text-green-700">
                    {lead.completed_steps}/{lead.total_steps} completed
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Completion Date</Label>
                  <p className="text-green-700">
                    {new Date(lead.completion_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Ready to convert to product development project
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800">
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-orange-700">
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    Click "Create Project" to convert this lead into a product
                    development project
                  </span>
                </div>
                <div className="flex items-center gap-2 text-orange-700">
                  <Settings className="w-4 h-4" />
                  <span>
                    Steps can be customized and modified after project creation
                  </span>
                </div>
                <div className="flex items-center gap-2 text-orange-700">
                  <Users className="w-4 h-4" />
                  <span>
                    Team members will be assigned to individual steps during
                    project setup
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
