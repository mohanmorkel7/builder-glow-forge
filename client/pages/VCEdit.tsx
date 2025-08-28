import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Eye,
  Globe,
  User,
  MessageSquare,
  ExternalLink,
  UserCheck,
  PhoneCall,
  Presentation,
  HelpCircle,
} from "lucide-react";

const INVESTOR_CATEGORIES = [
  { value: "angel", label: "Angel" },
  { value: "vc", label: "VC" },
  { value: "private_equity", label: "Private Equity" },
  { value: "family_office", label: "Family Office" },
  { value: "merchant_banker", label: "Merchant Banker" },
  { value: "individual", label: "Individual" },
];

const ROUND_STAGES = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "pre_series_a", label: "Pre-Series A" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "bridge", label: "Bridge" },
  { value: "growth", label: "Growth" },
  { value: "ipo", label: "IPO" },
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Singapore",
  "UAE",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Other",
];

const CURRENCIES = [
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
];

const TABS = [
  { value: "lead-info", label: "Lead Information", icon: "📋" },
  { value: "investor-contact", label: "Investor Information", icon: "����" },
  { value: "deal-details", label: "Round Information", icon: "💰" },
  { value: "additional", label: "Additional Information", icon: "📝" },
];

export default function VCEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for VC data
  const [vcData, setVcData] = useState({
    // Lead Info
    lead_source: "",
    lead_source_value: "",
    lead_created_by: user?.email || "",
    status: "in-progress",

    // Investor and Contact Info
    investor_category: "",
    investor_name: "",
    company_size: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    custom_country: "",
    website: "",
    potential_lead_investor: false,
    minimum_size: "",
    maximum_size: "",
    minimum_arr_requirement: "",

    // Additional contacts
    contacts: [
      {
        contact_name: "",
        designation: "",
        phone: "",
        email: "",
        linkedin: "",
      },
    ] as Array<{
      contact_name: string;
      designation: string;
      phone: string;
      email: string;
      linkedin: string;
    }>,

    // Deal Details (Round Information)
    round_title: "",
    round_size: "",
    valuation: "",
    round_stage: "",
    project_description: "",
    priority_level: "medium",
    start_date: "",
    targeted_end_date: "",
    spoc: "",
    template_id: "",

    // Billing and Commercials
    billing_currency: "INR",

    // Additional fields
    probability: "0",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("lead-info");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("manual");
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(
    vcData.billing_currency || "INR",
  );

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const currencyData = CURRENCIES.find((c) => c.value === currency);
    return currencyData?.symbol || "₹";
  };

  // Navigation helpers
  const currentTabIndex = TABS.findIndex((tab) => tab.value === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  // Fetch VC details
  const {
    data: vcDataFromAPI,
    isLoading: vcLoading,
    error: vcError,
  } = useQuery({
    queryKey: ["vc", id],
    queryFn: async () => {
      const response = await apiClient.request(`/vc/${id}`);
      return response;
    },
    enabled: !!id,
  });

  // Get VC templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["templates-by-category", "VC"],
    queryFn: async () => {
      try {
        // First, try to get the VC category ID
        const categories = await apiClient.request(
          "/templates-production/categories",
        );
        const vcCategory = categories.find((cat: any) => cat.name === "VC");

        if (vcCategory) {
          const result = await apiClient.request(
            `/templates-production/category/${vcCategory.id}`,
          );
          return result;
        } else {
          return [];
        }
      } catch (error) {
        console.error("VC templates fetch error:", error);
        // Return mock templates when database is not available
        return [
          {
            id: 7,
            name: "Series A Funding Process",
            description: "Complete workflow for Series A funding rounds",
            category: "VC",
            created_by: "System",
            created_at: new Date().toISOString(),
          },
          {
            id: 8,
            name: "Seed Round Management",
            description: "Template for managing seed funding rounds",
            category: "VC",
            created_by: "System",
            created_at: new Date().toISOString(),
          },
        ];
      }
    },
    retry: 2,
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  // Fetch template details when a template is selected
  const {
    data: templateDetails,
    isLoading: templateDetailsLoading,
    error: templateDetailsError,
  } = useQuery({
    queryKey: ["template-details", selectedTemplate],
    queryFn: async () => {
      if (!selectedTemplate || selectedTemplate === "manual") return null;
      try {
        const result = await apiClient.request(
          `/templates-production/${selectedTemplate}`,
        );
        return result;
      } catch (error) {
        console.error("Failed to fetch template details:", error);

        // Fallback to mock data for specific known templates
        const id = parseInt(selectedTemplate);
        if (id === 7) {
          return {
            id: 7,
            name: "Series A Funding Process",
            description: "Complete workflow for Series A funding rounds",
            steps: [
              {
                id: 1,
                name: "Initial Pitch Deck Review",
                description: "Review and refine pitch deck",
                probability_percent: 15,
              },
              {
                id: 2,
                name: "Management Presentation",
                description: "Present to investment committee",
                probability_percent: 25,
              },
              {
                id: 3,
                name: "Due Diligence Initiation",
                description: "Begin comprehensive due diligence",
                probability_percent: 35,
              },
              {
                id: 4,
                name: "Term Sheet Negotiation",
                description: "Negotiate terms and valuation",
                probability_percent: 50,
              },
              {
                id: 5,
                name: "Legal Documentation",
                description: "Draft and finalize legal agreements",
                probability_percent: 75,
              },
              {
                id: 6,
                name: "Final Approval",
                description: "Board approval and closing",
                probability_percent: 100,
              },
            ],
            created_by: "VC Team",
            category: {
              id: 6,
              name: "VC",
              color: "#6366F1",
              icon: "Megaphone",
            },
          };
        }
        if (id === 8) {
          return {
            id: 8,
            name: "Seed Round Management",
            description: "Template for managing seed funding rounds",
            steps: [
              {
                id: 1,
                name: "Product Demo",
                description: "Demonstrate product capabilities",
                probability_percent: 20,
              },
              {
                id: 2,
                name: "Market Analysis",
                description: "Present market opportunity",
                probability_percent: 40,
              },
              {
                id: 3,
                name: "Financial Review",
                description: "Review financial projections",
                probability_percent: 60,
              },
              {
                id: 4,
                name: "Investment Agreement",
                description: "Finalize investment terms",
                probability_percent: 80,
              },
              {
                id: 5,
                name: "Closing",
                description: "Complete the funding round",
                probability_percent: 100,
              },
            ],
            created_by: "VC Team",
            category: {
              id: 6,
              name: "VC",
              color: "#6366F1",
              icon: "Megaphone",
            },
          };
        }
        throw error;
      }
    },
    enabled: !!selectedTemplate && selectedTemplate !== "manual",
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Update VC mutation
  const updateVCMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.request(`/vc/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc", id] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      navigate(`/vc/${id}`);
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      setErrors({ submit: "Failed to update VC. Please try again." });
    },
  });

  // Navigation functions
  const handleNextTab = () => {
    if (!isLastTab) {
      const nextTab = TABS[currentTabIndex + 1].value;
      setActiveTab(nextTab);
    }
  };

  const handlePreviousTab = () => {
    if (!isFirstTab) {
      const prevTab = TABS[currentTabIndex - 1].value;
      setActiveTab(prevTab);
    }
  };

  // Load VC data into form when available
  useEffect(() => {
    if (vcDataFromAPI) {
      setVcData({
        lead_source: vcDataFromAPI.lead_source || "",
        lead_source_value: vcDataFromAPI.lead_source_value || "",
        lead_created_by: vcDataFromAPI.lead_created_by || user?.email || "",
        status: vcDataFromAPI.status || "in-progress",
        investor_category: vcDataFromAPI.investor_category || "",
        investor_name: vcDataFromAPI.investor_name || "",
        company_size: (() => {
          console.log(
            "🐛 DEBUG - VCEdit company_size loading:",
            vcDataFromAPI.company_size,
          );
          return vcDataFromAPI.company_size || "";
        })(),
        phone: vcDataFromAPI.phone || "",
        address: vcDataFromAPI.address || "",
        city: vcDataFromAPI.city || "",
        state: vcDataFromAPI.state || "",
        // Handle country initialization correctly
        country: (() => {
          const savedCountry = vcDataFromAPI.country || "";
          console.log("🐛 DEBUG - VCEdit country loading:", {
            savedCountry,
            COUNTRIES,
          });
          if (!savedCountry) return "";
          if (COUNTRIES.includes(savedCountry)) return savedCountry;
          return "Other";
        })(),
        custom_country: (() => {
          const savedCountry = vcDataFromAPI.country || "";
          if (!savedCountry || COUNTRIES.includes(savedCountry)) return "";
          return savedCountry;
        })(),
        website: vcDataFromAPI.website || "",
        potential_lead_investor: vcDataFromAPI.potential_lead_investor || false,
        minimum_size: vcDataFromAPI.minimum_size?.toString() || "",
        maximum_size: vcDataFromAPI.maximum_size?.toString() || "",
        minimum_arr_requirement:
          vcDataFromAPI.minimum_arr_requirement?.toString() || "",
        contacts: vcDataFromAPI.contacts
          ? typeof vcDataFromAPI.contacts === "string"
            ? JSON.parse(vcDataFromAPI.contacts)
            : vcDataFromAPI.contacts
          : [
              {
                contact_name: "",
                designation: "",
                phone: "",
                email: "",
                linkedin: "",
              },
            ],
        round_title: vcDataFromAPI.round_title || "",
        round_size: vcDataFromAPI.round_size || "",
        valuation: vcDataFromAPI.valuation || "",
        round_stage: vcDataFromAPI.round_stage || "",
        project_description: vcDataFromAPI.round_description || "",
        priority_level: vcDataFromAPI.priority_level || "medium",
        start_date: (() => {
          try {
            if (!vcDataFromAPI.start_date) return "";

            // Handle different date formats more robustly
            let dateStr = vcDataFromAPI.start_date;

            // If it's already a YYYY-MM-DD string, use it directly
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              console.log(
                "🐛 DEBUG - start_date already in correct format:",
                dateStr,
              );
              return dateStr;
            }

            // If it contains T (ISO format), extract date part
            if (dateStr.includes("T")) {
              dateStr = dateStr.split("T")[0];
            }

            console.log("🐛 DEBUG - start_date conversion:", {
              original: vcDataFromAPI.start_date,
              extracted: dateStr,
            });
            return dateStr;
          } catch (e) {
            console.warn(
              "Failed to parse start_date:",
              vcDataFromAPI.start_date,
            );
            return "";
          }
        })(),
        targeted_end_date: (() => {
          try {
            if (!vcDataFromAPI.targeted_end_date) return "";

            // Handle different date formats more robustly
            let dateStr = vcDataFromAPI.targeted_end_date;

            // If it's already a YYYY-MM-DD string, use it directly
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              console.log(
                "🐛 DEBUG - targeted_end_date already in correct format:",
                dateStr,
              );
              return dateStr;
            }

            // If it contains T (ISO format), extract date part
            if (dateStr.includes("T")) {
              dateStr = dateStr.split("T")[0];
            }

            console.log("🐛 DEBUG - targeted_end_date conversion:", {
              original: vcDataFromAPI.targeted_end_date,
              extracted: dateStr,
            });
            return dateStr;
          } catch (e) {
            console.warn(
              "Failed to parse targeted_end_date:",
              vcDataFromAPI.targeted_end_date,
            );
            return "";
          }
        })(),
        spoc: vcDataFromAPI.spoc || "",
        template_id: vcDataFromAPI.template_id?.toString() || "",
        billing_currency: vcDataFromAPI.billing_currency || "INR",
        probability: vcDataFromAPI.probability?.toString() || "0",
        notes: vcDataFromAPI.notes || "",
      });

      // Set selected template
      if (vcDataFromAPI.template_id) {
        setSelectedTemplate(vcDataFromAPI.template_id.toString());
      }

      // Set selected currency
      setSelectedCurrency(vcDataFromAPI.billing_currency || "INR");
    }
  }, [vcDataFromAPI, user?.email]);

  const handleInputChange = (field: string, value: any) => {
    const newData = {
      ...vcData,
      [field]: value,
    };

    // Clear lead_source_value when lead_source changes
    if (field === "lead_source") {
      newData.lead_source_value = "";
    }

    setVcData(newData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Contact management functions
  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...vcData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setVcData((prev) => ({ ...prev, contacts: newContacts }));
  };

  const addContact = () => {
    setVcData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          contact_name: "",
          designation: "",
          phone: "",
          email: "",
          linkedin: "",
        },
      ],
    }));
  };

  const removeContact = (index: number) => {
    if (vcData.contacts.length > 1) {
      const newContacts = vcData.contacts.filter((_, i) => i !== index);
      setVcData((prev) => ({ ...prev, contacts: newContacts }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!vcData.round_title.trim()) {
      newErrors.round_title = "Round title is required";
    }
    if (!vcData.investor_name.trim()) {
      newErrors.investor_name = "Investor name is required";
    }
    if (!vcData.investor_category) {
      newErrors.investor_category = "Investor category is required";
    }
    if (!vcData.lead_source) {
      newErrors.lead_source = "Lead source is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare VC data for submission
      const submitData = {
        lead_source: vcData.lead_source,
        lead_source_value: vcData.lead_source_value,
        lead_created_by: vcData.lead_created_by,
        status: vcData.status,
        round_title: vcData.round_title,
        round_description: vcData.project_description,
        round_stage: vcData.round_stage || null,
        round_size: vcData.round_size,
        valuation: vcData.valuation,
        investor_category: vcData.investor_category,
        investor_name: vcData.investor_name,
        phone: vcData.phone,
        address: vcData.address,
        city: vcData.city,
        state: vcData.state,
        country: (() => {
          if (vcData.country === "Other" && vcData.custom_country?.trim()) {
            return vcData.custom_country.trim();
          }
          if (vcData.country && vcData.country !== "Other") {
            return vcData.country;
          }
          return "";
        })(),
        website: vcData.website,
        company_size: vcData.company_size,
        potential_lead_investor: vcData.potential_lead_investor,
        minimum_size: vcData.minimum_size
          ? parseInt(vcData.minimum_size)
          : null,
        maximum_size: vcData.maximum_size
          ? parseInt(vcData.maximum_size)
          : null,
        minimum_arr_requirement: vcData.minimum_arr_requirement
          ? parseInt(vcData.minimum_arr_requirement)
          : null,
        priority_level: vcData.priority_level,
        start_date: (() => {
          console.log("🐛 DEBUG - Saving start_date:", vcData.start_date);
          return vcData.start_date || null;
        })(),
        targeted_end_date: (() => {
          console.log(
            "🐛 DEBUG - Saving targeted_end_date:",
            vcData.targeted_end_date,
          );
          return vcData.targeted_end_date || null;
        })(),
        spoc: vcData.spoc,
        template_id: vcData.template_id || null,
        billing_currency: vcData.billing_currency,
        notes: vcData.notes,
        contacts: JSON.stringify(vcData.contacts),
      };

      await updateVCMutation.mutateAsync(submitData);
    } catch (error) {
      console.error("Failed to update VC:", error);
      alert("Failed to update VC. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/vc/${id}`);
  };

  const previewTemplateDetails = (template: any) => {
    setPreviewTemplate(template);
    setIsTemplatePreviewOpen(true);
  };

  if (vcLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading VC details...</div>
      </div>
    );
  }

  if (vcError || !vcDataFromAPI) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Error loading VC details</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit VC</h1>
            <p className="text-gray-600">
              Update venture capital opportunity details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="currency" className="text-sm font-medium">
              Currency:
            </Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => {
                setSelectedCurrency(value);
                handleInputChange("billing_currency", value);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || updateVCMutation.isPending}
          >
            {isSubmitting ? "Updating..." : "Update VC"}
          </Button>
        </div>
      </div>

      {errors.submit && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lead-info">Lead Information</TabsTrigger>
          <TabsTrigger value="investor-contact">
            Investor Information
          </TabsTrigger>
          <TabsTrigger value="deal-details">Round Information</TabsTrigger>
          <TabsTrigger value="additional">Additional Information</TabsTrigger>
        </TabsList>

        {/* Lead Info Tab */}
        <TabsContent value="lead-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                Basic information about this VC opportunity lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lead_created_by">Lead Created By</Label>
                  <Input
                    id="lead_created_by"
                    placeholder="Name of person who created this lead"
                    value={vcData.lead_created_by}
                    onChange={(e) =>
                      handleInputChange("lead_created_by", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="lead_source">Lead Source *</Label>
                  <Select
                    value={vcData.lead_source}
                    onValueChange={(value) =>
                      handleInputChange("lead_source", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select how you found this lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="social-media">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Social Media
                        </div>
                      </SelectItem>
                      <SelectItem value="phone">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </div>
                      </SelectItem>
                      <SelectItem value="website">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website
                        </div>
                      </SelectItem>
                      <SelectItem value="referral">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Referral
                        </div>
                      </SelectItem>
                      <SelectItem value="cold-call">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-4 h-4" />
                          Cold Call
                        </div>
                      </SelectItem>
                      <SelectItem value="event">
                        <div className="flex items-center gap-2">
                          <Presentation className="w-4 h-4" />
                          Event
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" />
                          Other
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.lead_source && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.lead_source}
                    </p>
                  )}
                </div>

                {/* Dynamic Lead Source Value */}
                {vcData.lead_source && (
                  <div>
                    <Label htmlFor="lead_source_value">
                      {vcData.lead_source === "email" && "Email Address"}
                      {vcData.lead_source === "phone" && "Phone Number"}
                      {vcData.lead_source === "social-media" &&
                        "Social Media Profile/Link"}
                      {vcData.lead_source === "website" && "Website URL"}
                      {vcData.lead_source === "referral" &&
                        "Referral Source/Contact"}
                      {vcData.lead_source === "cold-call" &&
                        "Phone Number Called"}
                      {vcData.lead_source === "event" && "Event Name/Details"}
                      {vcData.lead_source === "other" && "Source Details"}
                    </Label>
                    <div className="relative mt-1">
                      {vcData.lead_source === "email" && (
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      )}
                      {vcData.lead_source === "phone" && (
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      )}
                      {vcData.lead_source === "website" && (
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      )}
                      <Input
                        id="lead_source_value"
                        value={vcData.lead_source_value}
                        onChange={(e) =>
                          handleInputChange("lead_source_value", e.target.value)
                        }
                        className="pl-10"
                        placeholder={
                          vcData.lead_source === "email"
                            ? "contact@investor.com"
                            : vcData.lead_source === "phone"
                              ? "+1 (555) 000-0000"
                              : vcData.lead_source === "social-media"
                                ? "LinkedIn profile or social media link"
                                : vcData.lead_source === "website"
                                  ? "https://investor.com"
                                  : vcData.lead_source === "referral"
                                    ? "Name of person who referred"
                                    : vcData.lead_source === "cold-call"
                                      ? "+1 (555) 000-0000"
                                      : vcData.lead_source === "event"
                                        ? "Conference name or event details"
                                        : "Describe the source"
                        }
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={vcData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousTab}
              disabled={isFirstTab}
            >
              Previous
            </Button>
            <Button onClick={handleNextTab} disabled={isLastTab}>
              Next
            </Button>
          </div>
        </TabsContent>

        {/* Investor and Contact Info Tab */}
        <TabsContent value="investor-contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investor Information</CardTitle>
              <CardDescription>
                Details about the investor and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investor_category">Investor Category *</Label>
                  <Select
                    value={vcData.investor_category}
                    onValueChange={(value) =>
                      handleInputChange("investor_category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select investor category" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTOR_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.investor_category && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.investor_category}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="investor_name">Investor Name *</Label>
                  <Input
                    id="investor_name"
                    placeholder="Name of the investor/firm"
                    value={vcData.investor_name}
                    onChange={(e) =>
                      handleInputChange("investor_name", e.target.value)
                    }
                    className={errors.investor_name ? "border-red-500" : ""}
                  />
                  {errors.investor_name && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.investor_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://investor.com"
                    value={vcData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="company_size">Company/Fund Size</Label>
                  <Select
                    value={vcData.company_size}
                    onValueChange={(value) =>
                      handleInputChange("company_size", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund/company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">
                        Startup Fund ($1M-$10M)
                      </SelectItem>
                      <SelectItem value="small">
                        Small Fund ($10M-$50M)
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium Fund ($50M-$200M)
                      </SelectItem>
                      <SelectItem value="large">
                        Large Fund ($200M-$1B)
                      </SelectItem>
                      <SelectItem value="mega">Mega Fund ($1B+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={vcData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={vcData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="State or Province"
                    value={vcData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={
                      vcData.country && vcData.country.trim()
                        ? vcData.country
                        : undefined
                    }
                    onValueChange={(value) => {
                      handleInputChange("country", value);
                      if (value !== "Other") {
                        handleInputChange("custom_country", "");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {vcData.country === "Other" && (
                  <div>
                    <Label htmlFor="custom_country">Custom Country</Label>
                    <Input
                      id="custom_country"
                      placeholder="Enter country name"
                      value={vcData.custom_country}
                      onChange={(e) =>
                        handleInputChange("custom_country", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Investment Details */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Investment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="potential_lead_investor"
                      checked={vcData.potential_lead_investor}
                      onCheckedChange={(checked) =>
                        handleInputChange("potential_lead_investor", checked)
                      }
                    />
                    <Label htmlFor="potential_lead_investor">
                      Potential Lead Investor
                    </Label>
                  </div>

                  <div></div>

                  <div>
                    <Label htmlFor="minimum_size">
                      Minimum Size ({getCurrencySymbol(selectedCurrency)})
                    </Label>
                    <Input
                      id="minimum_size"
                      placeholder={`e.g., ${getCurrencySymbol(selectedCurrency) === "$" ? "10M" : getCurrencySymbol(selectedCurrency) === "د.إ" ? "37M" : "10Cr"}`}
                      value={vcData.minimum_size}
                      onChange={(e) =>
                        handleInputChange("minimum_size", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="maximum_size">
                      Maximum Size ({getCurrencySymbol(selectedCurrency)})
                    </Label>
                    <Input
                      id="maximum_size"
                      placeholder={`e.g., ${getCurrencySymbol(selectedCurrency) === "$" ? "100M" : getCurrencySymbol(selectedCurrency) === "د.إ" ? "367M" : "100Cr"}`}
                      value={vcData.maximum_size}
                      onChange={(e) =>
                        handleInputChange("maximum_size", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimum_arr_requirement">
                      Minimum ARR Requirement (
                      {getCurrencySymbol(selectedCurrency)})
                    </Label>
                    <Input
                      id="minimum_arr_requirement"
                      placeholder={`e.g., ${getCurrencySymbol(selectedCurrency) === "$" ? "5M" : getCurrencySymbol(selectedCurrency) === "د.إ" ? "18M" : "5Cr"}`}
                      value={vcData.minimum_arr_requirement}
                      onChange={(e) =>
                        handleInputChange(
                          "minimum_arr_requirement",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Additional Contacts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Contacts
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addContact}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
                {vcData.contacts.map((contact, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Contact {index + 1}</h4>
                      {vcData.contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={contact.contact_name}
                          onChange={(e) =>
                            updateContact(index, "contact_name", e.target.value)
                          }
                          placeholder="Contact name"
                        />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input
                          value={contact.designation}
                          onChange={(e) =>
                            updateContact(index, "designation", e.target.value)
                          }
                          placeholder="Job title"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(index, "email", e.target.value)
                          }
                          placeholder="email@company.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(index, "phone", e.target.value)
                          }
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>LinkedIn</Label>
                        <Input
                          value={contact.linkedin}
                          onChange={(e) =>
                            updateContact(index, "linkedin", e.target.value)
                          }
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousTab}
              disabled={isFirstTab}
            >
              Previous
            </Button>
            <Button onClick={handleNextTab} disabled={isLastTab}>
              Next
            </Button>
          </div>
        </TabsContent>

        {/* Deal Details Tab */}
        <TabsContent value="deal-details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Round Information</CardTitle>
              <CardDescription>
                Details about the funding round and investment terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="round_title">Round Title *</Label>
                  <Input
                    id="round_title"
                    placeholder="e.g., Series A Funding"
                    value={vcData.round_title}
                    onChange={(e) =>
                      handleInputChange("round_title", e.target.value)
                    }
                    className={errors.round_title ? "border-red-500" : ""}
                  />
                  {errors.round_title && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.round_title}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="round_stage">Round Stage</Label>
                  <Select
                    value={vcData.round_stage}
                    onValueChange={(value) =>
                      handleInputChange("round_stage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select round stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUND_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="round_size">
                    Round Size ({getCurrencySymbol(selectedCurrency)})
                  </Label>
                  <Input
                    id="round_size"
                    placeholder={`e.g., ${getCurrencySymbol(selectedCurrency)}10M`}
                    value={vcData.round_size}
                    onChange={(e) =>
                      handleInputChange("round_size", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="valuation">
                    Valuation ({getCurrencySymbol(selectedCurrency)})
                  </Label>
                  <Input
                    id="valuation"
                    placeholder={`e.g., ${getCurrencySymbol(selectedCurrency)}100M`}
                    value={vcData.valuation}
                    onChange={(e) =>
                      handleInputChange("valuation", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="priority_level">Priority Level</Label>
                  <Select
                    value={vcData.priority_level}
                    onValueChange={(value) =>
                      handleInputChange("priority_level", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={vcData.start_date}
                    onChange={(e) =>
                      handleInputChange("start_date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="targeted_end_date">Target End Date</Label>
                  <Input
                    id="targeted_end_date"
                    type="date"
                    value={vcData.targeted_end_date}
                    onChange={(e) =>
                      handleInputChange("targeted_end_date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="spoc">SPOC (Single Point of Contact)</Label>
                  <Input
                    id="spoc"
                    placeholder="Internal contact person"
                    value={vcData.spoc}
                    onChange={(e) => handleInputChange("spoc", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="project_description">Round Description</Label>
                <Textarea
                  id="project_description"
                  placeholder="Describe the funding round, use of funds, and key details..."
                  value={vcData.project_description}
                  onChange={(e) =>
                    handleInputChange("project_description", e.target.value)
                  }
                  rows={4}
                />
              </div>

              {/* Template Selection - Moved to bottom */}
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Template Selection
                </h4>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="template">
                      Choose Template ({templates.length} available)
                      {templatesLoading && (
                        <span className="text-blue-500">(Loading...)</span>
                      )}
                      {templatesError && (
                        <span className="text-red-500">(Error)</span>
                      )}
                      {!templatesLoading && !templatesError && (
                        <span className="text-green-500">
                          ({templates.length} available)
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value);
                        handleInputChange(
                          "template_id",
                          value === "manual" ? "" : value,
                        );
                      }}
                      disabled={templatesLoading}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue
                          placeholder={
                            templatesLoading
                              ? "Loading templates..."
                              : templatesError
                                ? "Failed to load templates"
                                : "Select a VC template or use manual"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          Manual (Create from scratch)
                        </SelectItem>
                        {templates.map((template: any) => (
                          <SelectItem
                            key={template.id}
                            value={template.id.toString()}
                          >
                            {template.name}
                          </SelectItem>
                        ))}
                        {templates.length === 0 && !templatesLoading && (
                          <SelectItem value="no-templates" disabled>
                            No VC templates available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedTemplate !== "manual" && templateDetails && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => previewTemplateDetails(templateDetails)}
                        className="px-3"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Template Description */}
                  {selectedTemplate !== "manual" && templateDetails && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>{templateDetails.name}:</strong>{" "}
                        {templateDetails.description}
                      </p>
                      {templateDetails.steps &&
                        templateDetails.steps.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            This template includes{" "}
                            {templateDetails.steps.length} predefined steps.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousTab}
              disabled={isFirstTab}
            >
              Previous
            </Button>
            <Button onClick={handleNextTab} disabled={isLastTab}>
              Next
            </Button>
          </div>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Any additional notes, documents, or configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="probability">Success Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={vcData.probability}
                  onChange={(e) =>
                    handleInputChange("probability", e.target.value)
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default: 0% - Estimate the likelihood of closing this VC
                  opportunity
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this VC opportunity..."
                  value={vcData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousTab}
              disabled={isFirstTab}
            >
              Previous
            </Button>
            <Button onClick={handleNextTab} disabled={isLastTab}>
              Next
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={isTemplatePreviewOpen}
        onClose={() => setIsTemplatePreviewOpen(false)}
        template={previewTemplate}
      />
    </div>
  );
}
