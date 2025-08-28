import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useUsers, useLeads, useLeadStats, useFollowUps, useTemplates } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import { formatToIST } from "@/lib/dateUtils";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Rocket,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
  Eye,
  Target,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";

interface TemplateStep {
  id: number;
  name: string;
  description: string;
  step_order: number;
  probability_percent: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  steps: TemplateStep[];
  is_active: boolean;
}

interface StepStatusModal {
  isOpen: boolean;
  step: TemplateStep | null;
  status: string;
  leads: any[];
}

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepModal, setStepModal] = useState<StepStatusModal>({
    isOpen: false,
    step: null,
    status: "",
    leads: []
  });

  // Fetch data
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: leadStats } = useLeadStats();
  const { data: followUps = [] } = useFollowUps();
  
  // Get active (frozen) templates for step-wise dashboard
  const { data: templates = [] } = useQuery({
    queryKey: ["frozen-templates"],
    queryFn: () => apiClient.getTemplates(),
  });

  // Get template steps with lead status counts
  const { data: templateStepData = [] } = useQuery({
    queryKey: ["template-step-dashboard"],
    queryFn: async () => {
      const frozenTemplates = templates.filter((t: Template) => t.is_active);
      const stepData = [];
      
      for (const template of frozenTemplates) {
        for (const step of template.steps || []) {
          // Get leads at this step with different statuses
          const leadsAtStep = leads.filter((lead: any) => {
            // Mock logic: match leads that have this step in their process
            return lead.template_id === template.id;
          });
          
          stepData.push({
            template_id: template.id,
            template_name: template.name,
            step_id: step.id,
            step_name: step.name,
            step_order: step.step_order,
            probability_percent: step.probability_percent || 0,
            total_leads: leadsAtStep.length,
            pending_count: Math.floor(leadsAtStep.length * 0.4),
            in_progress_count: Math.floor(leadsAtStep.length * 0.3),
            completed_count: Math.floor(leadsAtStep.length * 0.2),
            blocked_count: Math.floor(leadsAtStep.length * 0.1),
            leads: leadsAtStep
          });
        }
      }
      
      return stepData;
    },
    enabled: templates.length > 0,
  });

  const handleStepStatusClick = async (stepData: any, status: string) => {
    // Filter leads by the clicked status
    const statusLeads = stepData.leads.filter((lead: any) => {
      // Mock status filtering - in real implementation, this would query actual step statuses
      const statuses = ['pending', 'in_progress', 'completed', 'blocked'];
      const leadStatus = statuses[lead.id % 4]; // Mock status assignment
      return leadStatus === status;
    });

    setStepModal({
      isOpen: true,
      step: {
        id: stepData.step_id,
        name: stepData.step_name,
        description: `Step ${stepData.step_order} in ${stepData.template_name}`,
        step_order: stepData.step_order,
        probability_percent: stepData.probability_percent
      },
      status,
      leads: statusLeads
    });
  };

  const handleLeadClick = (leadId: number) => {
    setStepModal(prev => ({ ...prev, isOpen: false }));
    navigate(`/leads/${leadId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in_progress': return PlayCircle;
      case 'completed': return CheckCircle;
      case 'blocked': return XCircle;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-template":
        navigate("/admin/templates/new");
        break;
      case "view-reports":
        navigate("/admin/reports");
        break;
      case "manage-users":
        navigate("/admin/users");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.first_name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your overview dashboard with template step tracking
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {formatToIST(new Date())}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-green-600">{leads.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Rocket className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{leadStats?.in_progress || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
                <p className="text-2xl font-bold text-purple-600">{leadStats?.won || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Step-wise Dashboard */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Template Step Progress</h2>
          <Badge variant="outline" className="text-sm">
            {templates.filter((t: Template) => t.is_active).length} Active Templates
          </Badge>
        </div>

        {templateStepData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templateStepData.map((stepData: any) => (
              <Card key={`${stepData.template_id}-${stepData.step_id}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{stepData.step_name}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Step {stepData.step_order} • {stepData.template_name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stepData.probability_percent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center"
                      onClick={() => handleStepStatusClick(stepData, 'pending')}
                    >
                      <Clock className="w-4 h-4 text-gray-600 mb-1" />
                      <div className="text-xs text-gray-600">Pending</div>
                      <div className="text-lg font-bold text-gray-800">{stepData.pending_count}</div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center"
                      onClick={() => handleStepStatusClick(stepData, 'in_progress')}
                    >
                      <PlayCircle className="w-4 h-4 text-blue-600 mb-1" />
                      <div className="text-xs text-blue-600">In Progress</div>
                      <div className="text-lg font-bold text-blue-800">{stepData.in_progress_count}</div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center"
                      onClick={() => handleStepStatusClick(stepData, 'completed')}
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 mb-1" />
                      <div className="text-xs text-green-600">Completed</div>
                      <div className="text-lg font-bold text-green-800">{stepData.completed_count}</div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center"
                      onClick={() => handleStepStatusClick(stepData, 'blocked')}
                    >
                      <XCircle className="w-4 h-4 text-red-600 mb-1" />
                      <div className="text-xs text-red-600">Blocked</div>
                      <div className="text-lg font-bold text-red-800">{stepData.blocked_count}</div>
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Leads:</span>
                      <span className="font-medium">{stepData.total_leads}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Templates</h3>
              <p className="text-gray-600 mb-4">
                Freeze templates in the Admin Panel to see step-wise lead progress here.
              </p>
              <Button onClick={() => navigate("/admin/templates")}>
                Go to Admin Templates
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickAction("create-template")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Target className="w-6 h-6" />
              <span>Create Template</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("view-reports")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("manage-users")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step Status Modal */}
      <Dialog open={stepModal.isOpen} onOpenChange={(open) => setStepModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stepModal.step && (
                <>
                  {React.createElement(getStatusIcon(stepModal.status), { 
                    className: `w-5 h-5 ${getStatusColor(stepModal.status).split(' ')[0]}` 
                  })}
                  {stepModal.step.name} - {stepModal.status.replace('_', ' ').toUpperCase()} Leads
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {stepModal.step && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Step Order:</span> {stepModal.step.step_order}
                  </div>
                  <div>
                    <span className="font-medium">Probability:</span> {stepModal.step.probability_percent}%
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Description:</span> {stepModal.step.description}
                </div>
              </div>
            )}

            {stepModal.leads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepModal.leads.map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">#{lead.lead_id || lead.id}</TableCell>
                      <TableCell>{lead.client_name}</TableCell>
                      <TableCell>{lead.project_title || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(stepModal.status)}>
                          {stepModal.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeadClick(lead.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No leads found with {stepModal.status.replace('_', ' ')} status for this step.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
