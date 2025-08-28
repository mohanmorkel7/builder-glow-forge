import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/useApi";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Info,
} from "lucide-react";

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: originalClient,
    isLoading,
    error,
  } = useClient(parseInt(id || "0"));

  const [client, setClient] = useState({
    client_name: "",
    contact_person: "",
    email: "",
    phone: "",
    status: "active",
    priority: "medium",
    industry: "",
    company_size: "",
    expected_value: "",
    start_date: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    notes: "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update state when client data is loaded
  React.useEffect(() => {
    if (originalClient) {
      setClient({
        client_name: originalClient.client_name || "",
        contact_person: originalClient.contact_person || "",
        email: originalClient.email || "",
        phone: originalClient.phone || "",
        status: originalClient.status || "active",
        priority: originalClient.priority || "medium",
        industry: originalClient.industry || "",
        company_size: originalClient.company_size || "",
        expected_value: originalClient.expected_value || "",
        start_date: originalClient.start_date || "",
        address: originalClient.address || "",
        city: originalClient.city || "",
        state: originalClient.state || "",
        zip_code: originalClient.zip_code || "",
        country: originalClient.country || "",
        notes: originalClient.notes || "",
      });
    }
  }, [originalClient]);

  const updateField = (field: string, value: any) => {
    setClient((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would make an API call to update the client
      console.log("Saving client:", client);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setHasChanges(false);
      navigate(`/sales/client/${id}`);
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/sales/client/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading client details...</div>
      </div>
    );
  }

  if (error || !originalClient) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading client details
        </div>
      </div>
    );
  }

  const isFormValid =
    client.client_name.trim() &&
    client.contact_person.trim() &&
    client.email.trim();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Client Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-600">{client.client_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
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
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Validation Alert */}
      {!isFormValid && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please fill in all required fields: Client Name, Contact Person, and
            Email.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
          <TabsTrigger value="address">Address & Location</TabsTrigger>
          <TabsTrigger value="notes">Notes & Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Client Information</CardTitle>
              <CardDescription>
                Essential client details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="client_name"
                      value={client.client_name}
                      onChange={(e) =>
                        updateField("client_name", e.target.value)
                      }
                      className="pl-10"
                      placeholder="Enter client/company name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_person"
                      value={client.contact_person}
                      onChange={(e) =>
                        updateField("contact_person", e.target.value)
                      }
                      className="pl-10"
                      placeholder="Primary contact name"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={client.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={client.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Client Status</Label>
                  <Select
                    value={client.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={client.priority}
                    onValueChange={(value) => updateField("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Industry, company size, and project details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={client.industry}
                    onChange={(e) => updateField("industry", e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={client.company_size}
                    onValueChange={(value) =>
                      updateField("company_size", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">
                        501-1000 employees
                      </SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_value">Expected Project Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="expected_value"
                      type="number"
                      value={client.expected_value}
                      onChange={(e) =>
                        updateField("expected_value", e.target.value)
                      }
                      className="pl-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="start_date">Project Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="start_date"
                      type="date"
                      value={client.start_date}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Physical location and mailing address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={client.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="pl-10"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={client.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={client.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                  <Input
                    id="zip_code"
                    value={client.zip_code}
                    onChange={(e) => updateField("zip_code", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={client.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Comments</CardTitle>
              <CardDescription>
                Additional information and internal notes about this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={client.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={6}
                  placeholder="Add any additional notes, requirements, or important information about this client..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
