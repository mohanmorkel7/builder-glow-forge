import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

interface ViewTemplateDialogProps {
  templateId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewTemplateDialog({
  templateId,
  isOpen,
  onClose,
}: ViewTemplateDialogProps) {
  // Fallback template data
  const getFallbackTemplate = (id: number) => {
    const templates = {
      1: {
        id: 1,
        name: "Standard Lead Process",
        description: "Standard lead qualification and conversion process",
        usage_count: 15,
        step_count: 5,
        is_active: true,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
        creator_name: "John Doe",
        category: { id: 2, name: "Leads", color: "#10B981", icon: "Target" },
        steps: [
          {
            id: 1,
            name: "Initial Contact",
            description: "Reach out to the lead and establish initial contact",
            default_eta_days: 2,
            probability_percent: 20,
            auto_alert: true,
            email_reminder: true,
            step_order: 1,
          },
          {
            id: 2,
            name: "Qualification Call",
            description: "Conduct qualification call to assess fit",
            default_eta_days: 3,
            probability_percent: 30,
            auto_alert: true,
            email_reminder: true,
            step_order: 2,
          },
          {
            id: 3,
            name: "Proposal Preparation",
            description: "Prepare and send detailed proposal",
            default_eta_days: 5,
            probability_percent: 25,
            auto_alert: false,
            email_reminder: true,
            step_order: 3,
          },
          {
            id: 4,
            name: "Negotiation",
            description: "Negotiate terms and finalize agreement",
            default_eta_days: 7,
            probability_percent: 15,
            auto_alert: true,
            email_reminder: false,
            step_order: 4,
          },
          {
            id: 5,
            name: "Contract Signing",
            description: "Execute final contract and close deal",
            default_eta_days: 3,
            probability_percent: 10,
            auto_alert: true,
            email_reminder: true,
            step_order: 5,
          },
        ],
      },
      4: {
        id: 4,
        name: "Series A Funding Process",
        description:
          "Comprehensive template for managing Series A funding rounds from initial pitch to closing",
        usage_count: 5,
        step_count: 6,
        is_active: true,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
        creator_name: "John Doe",
        category: { id: 6, name: "VC", color: "#6366F1", icon: "Megaphone" },
        steps: [
          {
            id: 21,
            name: "Initial Pitch Deck Review",
            description:
              "Review investor pitch deck and prepare presentation materials",
            default_eta_days: 3,
            probability_percent: 20,
            auto_alert: true,
            email_reminder: true,
            step_order: 1,
          },
          {
            id: 22,
            name: "Due Diligence Preparation",
            description:
              "Prepare all financial and legal documents for investor review",
            default_eta_days: 7,
            probability_percent: 25,
            auto_alert: true,
            email_reminder: true,
            step_order: 2,
          },
          {
            id: 23,
            name: "Investor Meetings",
            description:
              "Schedule and conduct meetings with potential investors",
            default_eta_days: 14,
            probability_percent: 20,
            auto_alert: true,
            email_reminder: true,
            step_order: 3,
          },
          {
            id: 24,
            name: "Term Sheet Negotiation",
            description: "Negotiate and finalize term sheet with lead investor",
            default_eta_days: 10,
            probability_percent: 15,
            auto_alert: true,
            email_reminder: false,
            step_order: 4,
          },
          {
            id: 25,
            name: "Legal Documentation",
            description:
              "Complete all legal documentation and investor agreements",
            default_eta_days: 21,
            probability_percent: 10,
            auto_alert: false,
            email_reminder: true,
            step_order: 5,
          },
          {
            id: 26,
            name: "Closing and Fund Transfer",
            description: "Complete the funding round and transfer funds",
            default_eta_days: 5,
            probability_percent: 10,
            auto_alert: false,
            email_reminder: true,
            step_order: 6,
          },
        ],
      },
      5: {
        id: 5,
        name: "Seed Round Management",
        description:
          "Template for managing seed funding rounds with angel investors and early-stage VCs",
        usage_count: 8,
        step_count: 5,
        is_active: true,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
        creator_name: "John Doe",
        category: { id: 6, name: "VC", color: "#6366F1", icon: "Megaphone" },
        steps: [
          {
            id: 27,
            name: "Business Plan Validation",
            description:
              "Validate business model and create investor-ready business plan",
            default_eta_days: 5,
            probability_percent: 25,
            auto_alert: true,
            email_reminder: true,
            step_order: 1,
          },
          {
            id: 28,
            name: "Angel Investor Outreach",
            description: "Identify and reach out to potential angel investors",
            default_eta_days: 10,
            probability_percent: 30,
            auto_alert: true,
            email_reminder: true,
            step_order: 2,
          },
          {
            id: 29,
            name: "Pitch Presentations",
            description: "Conduct pitch presentations to interested investors",
            default_eta_days: 14,
            probability_percent: 25,
            auto_alert: true,
            email_reminder: true,
            step_order: 3,
          },
          {
            id: 30,
            name: "Investment Commitments",
            description: "Secure investment commitments and finalize terms",
            default_eta_days: 7,
            probability_percent: 15,
            auto_alert: false,
            email_reminder: true,
            step_order: 4,
          },
          {
            id: 31,
            name: "Fund Disbursement",
            description: "Complete paperwork and receive funding",
            default_eta_days: 3,
            probability_percent: 5,
            auto_alert: false,
            email_reminder: true,
            step_order: 5,
          },
        ],
      },
    };

    return (
      templates[id as keyof typeof templates] || {
        id,
        name: "Sample Template",
        description: "Sample template for offline viewing",
        usage_count: 1,
        step_count: 3,
        is_active: true,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
        creator_name: "System",
        category: { id: 1, name: "Product", color: "#3B82F6", icon: "Package" },
        steps: [
          {
            id: 1,
            name: "Sample Step 1",
            description: "This is a sample step for offline viewing",
            default_eta_days: 1,
            probability_percent: 50,
            auto_alert: false,
            email_reminder: false,
            step_order: 1,
          },
        ],
      }
    );
  };

  // Fetch template data from API
  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      try {
        return await apiClient.request(`/templates-production/${templateId}`);
      } catch (error) {
        console.error("Failed to fetch template:", error);
        // Fallback to mock data if API fails
        return getFallbackTemplate(templateId);
      }
    },
    enabled: !!templateId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  console.log(
    "ViewTemplateDialog - Template ID:",
    templateId,
    "Template:",
    template,
  );

  if (!templateId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading template details...</div>
        ) : template ? (
          <div className="space-y-6">
            {/* Template Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-gray-600 mt-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={template.is_active ? "default" : "secondary"}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Created by {template.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      Created{" "}
                      {format(new Date(template.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{template.step_count || 0} steps</span>
                  </div>
                  {template.steps &&
                    template.steps.some(
                      (step: any) => step.probability_percent !== undefined,
                    ) && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span
                          className={`${
                            template.steps.reduce(
                              (sum: number, step: any) =>
                                sum + (step.probability_percent || 0),
                              0,
                            ) === 100
                              ? "text-green-600 font-medium"
                              : "text-orange-600 font-medium"
                          }`}
                        >
                          Total:{" "}
                          {template.steps.reduce(
                            (sum: number, step: any) =>
                              sum + (step.probability_percent || 0),
                            0,
                          )}
                          % probability
                        </span>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Template Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Steps</CardTitle>
                  {template.steps &&
                    template.steps.some(
                      (step: any) => step.probability_percent !== undefined,
                    ) && (
                      <div className="text-sm">
                        <span className="text-gray-600">
                          Total Probability:{" "}
                        </span>
                        <span
                          className={`font-medium ${
                            template.steps.reduce(
                              (sum: number, step: any) =>
                                sum + (step.probability_percent || 0),
                              0,
                            ) === 100
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {template.steps.reduce(
                            (sum: number, step: any) =>
                              sum + (step.probability_percent || 0),
                            0,
                          )}
                          %
                        </span>
                        <span className="text-gray-500 ml-1">/ 100%</span>
                      </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {template.steps && template.steps.length > 0 ? (
                  <div className="space-y-4">
                    {template.steps
                      .sort(
                        (a: any, b: any) =>
                          (a.step_order || a.order_position || 0) -
                          (b.step_order || b.order_position || 0),
                      )
                      .map((step: any, index: number) => (
                        <div
                          key={step.id || index}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                                {index + 1}
                              </div>
                              <h4 className="font-medium">{step.name}</h4>
                            </div>
                            {step.probability_percent !== undefined &&
                              step.probability_percent !== null && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700"
                                >
                                  {step.probability_percent}%
                                </Badge>
                              )}
                          </div>

                          {step.description && (
                            <p className="text-gray-600 mb-3 ml-10">
                              {step.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No steps defined in this template
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Metadata */}
            {template.tags && template.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Template not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
