import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, CheckCircle } from "lucide-react";

interface TemplateStep {
  id: number;
  name: string;
  description: string;
  order_position?: number;
  step_order?: number;
  is_required?: boolean;
  probability_percent?: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  steps: TemplateStep[];
  created_by?: string;
  created_at?: string;
}

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const totalSteps = template.steps?.length || 0;
  const totalProbability = template.steps?.reduce((sum, step) => sum + (step.probability_percent || 0), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description ||
              "Template preview with all steps and details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Summary */}
          <div className="flex justify-center gap-4">
            <Card className="text-center w-48">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {totalSteps}
                </div>
                <div className="text-sm text-gray-600">Total Steps</div>
              </CardContent>
            </Card>
            <Card className="text-center w-48">
              <CardContent className="p-6">
                <div className={`text-3xl font-bold mb-2 ${
                  totalProbability === 100 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {totalProbability}%
                </div>
                <div className="text-sm text-gray-600">Total Probability</div>
              </CardContent>
            </Card>
          </div>

          {/* Steps List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle
                  key="title-icon"
                  className="w-5 h-5 text-green-600"
                />
                <span key="title-text">Template Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.steps && template.steps.length > 0 ? (
                <div className="space-y-4">
                  {template.steps
                    .sort(
                      (a, b) =>
                        (a.order_position || a.step_order || 0) -
                        (b.order_position || b.step_order || 0),
                    )
                    .map((step, index) => (
                      <div
                        key={step.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div
                                key={`number-${step.id}`}
                                className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm"
                              >
                                {index + 1}
                              </div>
                              <h3
                                key={`title-${step.id}`}
                                className="font-medium text-gray-900"
                              >
                                {step.name}
                              </h3>
                              {step.probability_percent !== undefined && (
                                <Badge
                                  key={`probability-${step.id}`}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700"
                                >
                                  {step.probability_percent}%
                                </Badge>
                              )}
                              {step.is_required && (
                                <Badge
                                  key={`badge-${step.id}`}
                                  variant="secondary"
                                  className="bg-red-100 text-red-700"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 ml-11">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle
                    key="no-steps-icon"
                    className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  />
                  <p key="no-steps-text">No steps defined in this template</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Info */}
          {(template.created_by || template.created_at) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  {template.created_by && (
                    <div
                      key="created-by"
                      className="flex items-center space-x-1"
                    >
                      <User key="created-by-icon" className="w-4 h-4" />
                      <span key="created-by-text">
                        Created by: {template.created_by}
                      </span>
                    </div>
                  )}
                  {template.created_at && (
                    <div
                      key="created-at"
                      className="flex items-center space-x-1"
                    >
                      <Calendar key="created-at-icon" className="w-4 h-4" />
                      <span key="created-at-text">
                        Created:{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
