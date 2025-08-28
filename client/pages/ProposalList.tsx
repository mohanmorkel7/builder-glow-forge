import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Eye,
  Download,
  Calendar,
  DollarSign,
  User,
  Building,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import ProposalPreview from "@/components/ProposalPreview";

interface Proposal {
  id: number;
  title: string;
  client_name: string;
  lead_id: string;
  status: "draft" | "sent" | "approved" | "rejected" | "under_review";
  value: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  description: string;
  valid_until: string;
  content: string;
}

// Mock proposal data
const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "E-commerce Platform Development",
    client_name: "TechCorp Solutions",
    lead_id: "LEAD-001",
    status: "sent",
    value: 75000,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-16T14:20:00Z",
    created_by: "Jane Smith",
    description:
      "Complete e-commerce platform with inventory management, payment processing, and analytics dashboard.",
    valid_until: "2024-02-15T23:59:59Z",
    content: `
      <h1>E-commerce Platform Development Proposal</h1>
      <h2>Project Overview</h2>
      <p>We propose to develop a comprehensive e-commerce platform that will revolutionize your online business operations.</p>
      
      <h2>Scope of Work</h2>
      <ul>
        <li>Frontend development with React and TypeScript</li>
        <li>Backend API development with Node.js</li>
        <li>Database design and implementation</li>
        <li>Payment gateway integration</li>
        <li>Inventory management system</li>
        <li>Analytics and reporting dashboard</li>
      </ul>
      
      <h2>Timeline</h2>
      <p>The project will be completed in 12 weeks, divided into 4 phases of 3 weeks each.</p>
      
      <h2>Investment</h2>
      <p>Total project cost: $75,000</p>
      <p>Payment schedule: 30% upfront, 40% at milestone completion, 30% on final delivery</p>
    `,
  },
  {
    id: 2,
    title: "Mobile App Development",
    client_name: "RetailMax Inc",
    lead_id: "LEAD-002",
    status: "approved",
    value: 45000,
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-18T16:45:00Z",
    created_by: "Mike Johnson",
    description:
      "Cross-platform mobile application for customer engagement and loyalty programs.",
    valid_until: "2024-02-10T23:59:59Z",
    content: `
      <h1>Mobile App Development Proposal</h1>
      <h2>Project Overview</h2>
      <p>Development of a cross-platform mobile application to enhance customer engagement.</p>
      
      <h2>Features</h2>
      <ul>
        <li>User authentication and profiles</li>
        <li>Loyalty program integration</li>
        <li>Push notifications</li>
        <li>In-app purchases</li>
        <li>Social media integration</li>
      </ul>
      
      <h2>Timeline</h2>
      <p>8 weeks development cycle</p>
      
      <h2>Investment</h2>
      <p>Total project cost: $45,000</p>
    `,
  },
  {
    id: 3,
    title: "Data Analytics Dashboard",
    client_name: "FinanceFirst Bank",
    lead_id: "LEAD-003",
    status: "under_review",
    value: 32000,
    created_at: "2024-01-20T11:00:00Z",
    updated_at: "2024-01-22T13:30:00Z",
    created_by: "John Doe",
    description:
      "Real-time data analytics dashboard for financial reporting and compliance.",
    valid_until: "2024-02-20T23:59:59Z",
    content: `
      <h1>Data Analytics Dashboard Proposal</h1>
      <h2>Project Overview</h2>
      <p>Custom analytics dashboard for real-time financial data visualization and reporting.</p>
      
      <h2>Key Components</h2>
      <ul>
        <li>Real-time data processing</li>
        <li>Interactive charts and graphs</li>
        <li>Compliance reporting tools</li>
        <li>User role management</li>
        <li>Export functionality</li>
      </ul>
      
      <h2>Timeline</h2>
      <p>6 weeks development</p>
      
      <h2>Investment</h2>
      <p>Total project cost: $32,000</p>
    `,
  },
];

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  under_review: "bg-yellow-100 text-yellow-700",
};

const statusIcons = {
  draft: FileText,
  sent: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  under_review: Clock,
};

export default function ProposalList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  const handleCreateProposal = () => {
    navigate("/proposals/new");
  };

  // Filter proposals based on search and filters
  const filteredProposals = mockProposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.lead_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.created_by.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadProposal = (proposal: Proposal) => {
    // Create a simple HTML document for the proposal
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${proposal.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            ul { padding-left: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${proposal.title}</h1>
            <p><strong>Client:</strong> ${proposal.client_name}</p>
            <p><strong>Lead ID:</strong> ${proposal.lead_id}</p>
            <p><strong>Value:</strong> $${proposal.value.toLocaleString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(proposal.valid_until).toLocaleDateString()}</p>
          </div>
          ${proposal.content}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Prepared by ${proposal.created_by}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${proposal.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_proposal.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (showEnhancedPreview) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enhanced Proposal Editor
            </h1>
            <p className="text-gray-600">
              Professional proposal builder with advanced features
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowEnhancedPreview(false);
              setEditingProposal(null);
            }}
          >
            Back to List
          </Button>
        </div>
        <ProposalPreview
          initialData={{
            title: editingProposal?.title || "New Proposal",
            clientName: editingProposal?.client_name || "",
            leadId: editingProposal?.lead_id || "",
            value: editingProposal?.value || 0,
            validUntil: editingProposal?.valid_until || "",
          }}
          onSave={(data) => {
            console.log("Saving proposal:", data);
            // Here you would typically save to backend
            setShowEnhancedPreview(false);
            setEditingProposal(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all client proposals
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleCreateProposal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
          <Button
            onClick={() => {
              setEditingProposal(null);
              setShowEnhancedPreview(true);
            }}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Enhanced Builder
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {mockProposals.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Draft</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {mockProposals.filter((p) => p.status === "draft").length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Sent</p>
                <p className="text-2xl font-bold text-orange-900">
                  {mockProposals.filter((p) => p.status === "sent").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-900">
                  {mockProposals.filter((p) => p.status === "approved").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Total Value
                </p>
                <p className="text-lg font-bold text-purple-900">
                  $
                  {mockProposals
                    .reduce((sum, p) => sum + p.value, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search proposals by title, client, lead ID, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      <div className="grid gap-4">
        {filteredProposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No proposals found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first proposal"}
              </p>
              <Button onClick={handleCreateProposal}>
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProposals.map((proposal) => {
            const StatusIcon = statusIcons[proposal.status];

            return (
              <Card
                key={proposal.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {proposal.title}
                        </h3>
                        <Badge className={statusColors[proposal.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {proposal.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{proposal.client_name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{proposal.lead_id}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${proposal.value.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{proposal.created_by}</span>
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {proposal.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Created:{" "}
                          {new Date(proposal.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              timeZone: "Asia/Kolkata",
                            },
                          )}
                        </span>
                        <span>
                          Valid until:{" "}
                          {new Date(proposal.valid_until).toLocaleDateString(
                            "en-IN",
                            {
                              timeZone: "Asia/Kolkata",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProposal(proposal)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Quick Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{proposal.title}</DialogTitle>
                            <DialogDescription>
                              {proposal.client_name} • {proposal.lead_id} • $
                              {proposal.value.toLocaleString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div
                            className="prose max-w-none mt-4"
                            dangerouslySetInnerHTML={{
                              __html: proposal.content,
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProposal(proposal);
                          setShowEnhancedPreview(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Enhanced Editor
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadProposal(proposal)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
