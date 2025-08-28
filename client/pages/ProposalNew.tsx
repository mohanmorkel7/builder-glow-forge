import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLead } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  FileText,
  DollarSign,
  Calendar,
  Info,
  Target,
  Building,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import ProposalPreview from "@/components/ProposalPreview";

const proposalTypes = [
  { value: "development", label: "Software Development" },
  { value: "integration", label: "System Integration" },
  { value: "consulting", label: "Consulting Services" },
  { value: "maintenance", label: "Maintenance & Support" },
  { value: "custom", label: "Custom Solution" },
];

const deliveryTimeframes = [
  { value: "1-2", label: "1-2 weeks" },
  { value: "3-4", label: "3-4 weeks" },
  { value: "1-2-months", label: "1-2 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "6-months+", label: "6+ months" },
];

export default function ProposalNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const leadId = parseInt(id || "0");

  const { data: lead, isLoading, error } = useLead(leadId);
  const leadData = location.state?.leadData || lead;

  const [proposalData, setProposalData] = useState({
    title: "",
    description: "",
    proposalType: "",
    estimatedValue: "",
    deliveryTimeframe: "",
    keyFeatures: "",
    assumptions: "",
    termsConditions: "",
    validUntil: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [useEnhancedBuilder, setUseEnhancedBuilder] = useState(false);

  const updateField = (field: string, value: any) => {
    setProposalData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would typically save the proposal to a backend
      // For now, we'll simulate a save operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back to lead details
      navigate(`/leads/${id}`, {
        state: {
          message: "Proposal created successfully and ready for review",
        },
      });
    } catch (error) {
      console.error("Failed to create proposal:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/leads/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading lead details...</div>
      </div>
    );
  }

  if (error || !leadData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading lead details
        </div>
      </div>
    );
  }

  const isFormValid =
    proposalData.title.trim() &&
    proposalData.proposalType &&
    proposalData.estimatedValue;

  if (useEnhancedBuilder) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setUseEnhancedBuilder(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Simple Form
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Enhanced Proposal Builder
              </h1>
              <p className="text-gray-600">
                Professional proposal builder for {leadData?.client_name}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        <ProposalPreview
          initialData={{
            title:
              proposalData.title ||
              `${leadData?.project_title || "Custom Solution"} - Proposal`,
            clientName: leadData?.client_name || "",
            leadId: id || "",
            value: proposalData.estimatedValue
              ? parseFloat(proposalData.estimatedValue)
              : 0,
            validUntil: proposalData.validUntil,
          }}
          onSave={async (data) => {
            setSaving(true);
            try {
              // Save the enhanced proposal data
              await new Promise((resolve) => setTimeout(resolve, 1000));
              navigate(`/leads/${id}`, {
                state: {
                  message:
                    "Enhanced proposal created successfully and ready for review",
                },
              });
            } catch (error) {
              console.error("Failed to create proposal:", error);
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Proposal
            </h1>
            <p className="text-gray-600">
              Generate a detailed proposal for {leadData.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setUseEnhancedBuilder(true)}
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Enhanced Builder
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="min-w-20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Proposal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lead Context */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Creating proposal for <strong>{leadData.client_name}</strong>
          {leadData.project_title && (
            <>
              {" "}
              - <strong>{leadData.project_title}</strong>
            </>
          )}
          {leadData.contacts && leadData.contacts.length > 0 && (
            <> (Contact: {leadData.contacts[0].contact_name})</>
          )}
        </AlertDescription>
      </Alert>

      {/* Form Validation Alert */}
      {!isFormValid && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please fill in all required fields: Title, Proposal Type, and
            Estimated Value.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
              <CardDescription>
                Basic information about the proposal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  value={proposalData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder={`${leadData.project_title || "Custom Solution"} - Proposal`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Executive Summary</Label>
                <Textarea
                  id="description"
                  value={proposalData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="Provide a high-level overview of the proposed solution..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposalType">Proposal Type *</Label>
                  <Select
                    value={proposalData.proposalType}
                    onValueChange={(value) =>
                      updateField("proposalType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select proposal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {proposalTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliveryTimeframe">Delivery Timeframe</Label>
                  <Select
                    value={proposalData.deliveryTimeframe}
                    onValueChange={(value) =>
                      updateField("deliveryTimeframe", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryTimeframes.map((timeframe) => (
                        <SelectItem
                          key={timeframe.value}
                          value={timeframe.value}
                        >
                          {timeframe.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Scope</CardTitle>
              <CardDescription>
                Detailed description of the proposed solution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="keyFeatures">Key Features & Deliverables</Label>
                <Textarea
                  id="keyFeatures"
                  value={proposalData.keyFeatures}
                  onChange={(e) => updateField("keyFeatures", e.target.value)}
                  rows={5}
                  placeholder="• Feature 1: Description&#10;• Feature 2: Description&#10;• Deliverable 1: Description"
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="assumptions">Assumptions & Requirements</Label>
                <Textarea
                  id="assumptions"
                  value={proposalData.assumptions}
                  onChange={(e) => updateField("assumptions", e.target.value)}
                  rows={4}
                  placeholder="List any assumptions, client requirements, or dependencies..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                Legal and business terms for the proposal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="termsConditions">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={proposalData.termsConditions}
                  onChange={(e) =>
                    updateField("termsConditions", e.target.value)
                  }
                  rows={4}
                  placeholder="Payment terms, project milestones, acceptance criteria..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={proposalData.validUntil}
                    onChange={(e) => updateField("validUntil", e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedValue">
                    Estimated Value (USD) *
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimatedValue"
                      type="number"
                      value={proposalData.estimatedValue}
                      onChange={(e) =>
                        updateField("estimatedValue", e.target.value)
                      }
                      className="pl-10"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={proposalData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  placeholder="Any additional information or special considerations..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Client:</span>
                  <span className="text-sm font-medium">
                    {leadData.client_name}
                  </span>
                </div>

                {leadData.contacts && leadData.contacts.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm">
                        {leadData.contacts[0].email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm">
                        {leadData.contacts[0].phone || "Not provided"}
                      </span>
                    </div>
                  </>
                )}

                {leadData.project_title && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Project:</span>
                    <span className="text-sm">{leadData.project_title}</span>
                  </div>
                )}

                {leadData.expected_close_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Expected Close:
                    </span>
                    <span className="text-sm">
                      {new Date(
                        leadData.expected_close_date,
                      ).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email to Client
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
