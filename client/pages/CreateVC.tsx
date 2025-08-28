import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCreateLead, usePartialSaveLead, useTemplate } from "@/hooks/useApi";
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
import { MultiSelect } from "@/components/ui/multi-select";
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
  { value: "lead", label: "Lead Information", icon: "📋" },
  { value: "investor", label: "Investor Information", icon: "🏢" },
  { value: "round", label: "Round Information", icon: "💰" },
  { value: "additional", label: "Additional Information", icon: "📝" },
];

export default function CreateVC() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if we're in edit mode or resuming from draft
  const isEditMode = !!id;
  const resumeData = location.state?.resumeData;

  // Check URL parameters for draft ID (fallback when location state is lost)
  const urlParams = new URLSearchParams(location.search);
  const draftIdFromUrl = urlParams.get("draftId");

  // Track the current draft ID for subsequent saves
  const [currentDraftId, setCurrentDraftId] = useState(
    resumeData?._resumeFromId || resumeData?.id || draftIdFromUrl || null,
  );

  // Ensure currentDraftId is properly set when resumeData changes or URL changes
  useEffect(() => {
    if (resumeData && (resumeData._resumeFromId || resumeData.id)) {
      const draftId = resumeData._resumeFromId || resumeData.id;
      setCurrentDraftId(draftId);
      console.log(
        "useEffect: Setting currentDraftId from resumeData to:",
        draftId,
      );
    } else if (draftIdFromUrl) {
      setCurrentDraftId(draftIdFromUrl);
      console.log(
        "useEffect: Setting currentDraftId from URL to:",
        draftIdFromUrl,
      );
    }
  }, [resumeData, draftIdFromUrl]);

  // State for VC data
  const [vcData, setVcData] = useState(() => {
    // Use function initialization to prevent re-runs
    return resumeData
      ? {
          // Initialize with resume data
          lead_source: resumeData.lead_source || "",
          lead_source_value: resumeData.lead_source_value || "",
          lead_created_by: resumeData.lead_created_by || "",
          status: resumeData.status || "in-progress",
          investor_category: resumeData.investor_category || "",
          investor_name:
            resumeData.investor_name === "PARTIAL_SAVE_IN_PROGRESS"
              ? ""
              : resumeData.investor_name || "",
          company_size: resumeData.company_size || "",
          phone: resumeData.phone || "",
          address: resumeData.address || "",
          city: resumeData.city || "",
          state: resumeData.state || "",
          // Handle country initialization correctly
          country: (() => {
            const savedCountry = resumeData.country || "";
            // If no country was saved, return empty
            if (!savedCountry) return "";
            // If saved country is in our predefined list, use it directly
            if (COUNTRIES.includes(savedCountry)) return savedCountry;
            // If saved country is not in our list, set dropdown to "Other"
            return "Other";
          })(),
          custom_country: (() => {
            const savedCountry = resumeData.country || "";
            // If saved country is in our predefined list, no custom country needed
            if (!savedCountry || COUNTRIES.includes(savedCountry)) return "";
            // If saved country is not in our list, store it as custom country
            return savedCountry;
          })(),
          website: resumeData.website || "",
          potential_lead_investor: resumeData.potential_lead_investor || false,
          minimum_size: resumeData.minimum_size || "",
          maximum_size: resumeData.maximum_size || "",
          minimum_arr_requirement: resumeData.minimum_arr_requirement || "",
          contacts: resumeData.contacts
            ? typeof resumeData.contacts === "string"
              ? JSON.parse(resumeData.contacts)
              : resumeData.contacts
            : [
                {
                  contact_name: "",
                  designation: "",
                  phone: "",
                  email: "",
                  linkedin: "",
                },
              ],
          round_title:
            resumeData.round_title === "Draft VC - In Progress"
              ? ""
              : resumeData.round_title || "",
          round_size: resumeData.round_size || "",
          valuation: resumeData.valuation || "",
          round_stage: resumeData.round_stage || "",
          project_description: resumeData.round_description || "",
          priority_level: resumeData.priority_level || "medium",
          start_date: (() => {
            try {
              return resumeData.start_date
                ? new Date(resumeData.start_date).toISOString().split("T")[0]
                : "";
            } catch (e) {
              console.warn(
                "Failed to parse resumeData start_date:",
                resumeData.start_date,
              );
              return "";
            }
          })(),
          targeted_end_date: (() => {
            try {
              return resumeData.targeted_end_date
                ? new Date(resumeData.targeted_end_date)
                    .toISOString()
                    .split("T")[0]
                : "";
            } catch (e) {
              console.warn(
                "Failed to parse resumeData targeted_end_date:",
                resumeData.targeted_end_date,
              );
              return "";
            }
          })(),
          spoc: resumeData.spoc || "",
          template_id: resumeData.template_id || "",
          billing_currency: resumeData.billing_currency || "INR",
          flat_fee_config: [],
          probability: resumeData.probability || "0",
          notes: resumeData.notes || "",
          documents: [],
        }
      : {
          // Default Lead Info
          lead_source: "" as const,
          lead_source_value: "",
          lead_created_by: "",
          status: "in-progress" as const,

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

          // Additional contacts (similar to CreateLead)
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
          priority_level: "medium" as const,
          start_date: "",
          targeted_end_date: "",
          spoc: "",
          template_id: "",

          // Billing and Commercials
          billing_currency: "INR" as const,
          flat_fee_config: [] as any[],

          // Additional fields
          probability: "0",
          notes: "",
          documents: [] as any[],
        };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (resumeData) {
      const savedTab = localStorage.getItem(`vc_draft_${resumeData.id}_tab`);
      return savedTab || "lead";
    }
    return "lead";
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    resumeData?.template_id ? resumeData.template_id.toString() : "manual",
  );
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(
    resumeData?.billing_currency || vcData.billing_currency || "INR",
  );

  // Navigation helpers
  const currentTabIndex = TABS.findIndex((tab) => tab.value === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const currencyData = CURRENCIES.find((c) => c.value === currency);
    return currencyData?.symbol || "₹";
  };

  // Get VC templates (category ID for VC templates)
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["templates-by-category", "VC"],
    queryFn: async () => {
      console.log("Fetching VC templates...");
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
          console.log("VC templates fetch successful:", result);
          return result;
        } else {
          console.log("VC category not found, returning empty array");
          return [];
        }
      } catch (error) {
        console.error("VC templates fetch error:", error);
        console.log("Falling back to mock VC templates");
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
    staleTime: 1 * 60 * 1000, // Shorter stale time to check DB more frequently
    cacheTime: 5 * 60 * 1000, // Shorter cache time
  });

  // Fetch template details from API when a template is selected
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
        console.log("Template details fetched:", result);
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

  // Initialize lead_created_by with user email when user loads or changes
  useEffect(() => {
    if (user?.email && !vcData.lead_created_by) {
      console.log(
        "🐛 DEBUG - Setting lead_created_by to user email:",
        user.email,
      );
      handleInputChange("lead_created_by", user.email);
    }
  }, [user?.email, vcData.lead_created_by]);

  // Synchronize selectedTemplate with loaded template_id from draft data
  useEffect(() => {
    console.log("🔄 Template sync useEffect triggered:", {
      "vcData.template_id": vcData.template_id,
      selectedTemplate,
      "vcData.template_id type": typeof vcData.template_id,
      "selectedTemplate type": typeof selectedTemplate,
      "vcData.investor_name": vcData.investor_name,
      currentDraftId: currentDraftId,
    });

    // Only sync if we have meaningful data (indicating draft is loaded)
    // Skip if we're still in initial state or if investor_name indicates partial save
    const isDraftDataLoaded =
      vcData.investor_name &&
      vcData.investor_name !== "PARTIAL_SAVE_IN_PROGRESS" &&
      vcData.investor_name.trim() !== "";

    if (!isDraftDataLoaded && currentDraftId) {
      console.log("🔄 Draft data not fully loaded yet, skipping template sync");
      return;
    }

    // Convert template_id to string for comparison since Select component uses strings
    const templateIdStr = vcData.template_id
      ? vcData.template_id.toString()
      : "";

    if (templateIdStr && templateIdStr !== selectedTemplate) {
      console.log(
        "✅ Synchronizing selectedTemplate with loaded template_id:",
        templateIdStr,
        "Previous selectedTemplate:",
        selectedTemplate,
      );
      setSelectedTemplate(templateIdStr);
    } else if (!templateIdStr && selectedTemplate !== "manual") {
      console.log("❌ No template_id in draft, setting to manual");
      setSelectedTemplate("manual");
    } else {
      console.log("✨ Template sync - no change needed");
    }
  }, [vcData.template_id, vcData.investor_name, currentDraftId]); // Track multiple fields to ensure proper timing

  // Fetch draft data if we have a draftId but no resumeData
  useEffect(() => {
    const fetchDraftData = async () => {
      if (currentDraftId && !resumeData) {
        console.log("🐛 DEBUG - Fetching draft data for ID:", currentDraftId);
        try {
          const response = await apiClient.request(`/vc/${currentDraftId}`);
          console.log("🐛 DEBUG - Fetched draft data:", response);
          console.log("🐛 DEBUG - Date fields from API:", {
            start_date: response.start_date,
            targeted_end_date: response.targeted_end_date,
            start_date_type: typeof response.start_date,
            targeted_end_date_type: typeof response.targeted_end_date,
          });

          // Update the VC data with the fetched draft
          setVcData((prevData) => ({
            ...prevData,
            lead_source: response.lead_source || prevData.lead_source,
            lead_source_value:
              response.lead_source_value || prevData.lead_source_value,
            lead_created_by:
              response.lead_created_by || prevData.lead_created_by,
            status: response.status || prevData.status,
            investor_category:
              response.investor_category || prevData.investor_category,
            investor_name:
              response.investor_name === "PARTIAL_SAVE_IN_PROGRESS"
                ? ""
                : response.investor_name || prevData.investor_name,
            company_size: response.company_size || prevData.company_size,
            phone: response.phone || prevData.phone,
            address: response.address || prevData.address,
            city: response.city || prevData.city,
            state: response.state || prevData.state,
            // Handle country field properly - preserve current value if exists
            country: (() => {
              // If user has already selected a country, preserve it
              if (prevData.country && prevData.country.trim()) {
                console.log(
                  "🐛 DEBUG - Preserving current country:",
                  prevData.country,
                );
                return prevData.country;
              }

              const savedCountry = response.country || "";
              console.log("🐛 DEBUG - Fetched country from API:", savedCountry);
              if (!savedCountry) return "";
              if (COUNTRIES.includes(savedCountry)) return savedCountry;
              return "Other";
            })(),
            custom_country: (() => {
              // If user has already set custom country, preserve it
              if (prevData.custom_country && prevData.custom_country.trim()) {
                console.log(
                  "🐛 DEBUG - Preserving current custom_country:",
                  prevData.custom_country,
                );
                return prevData.custom_country;
              }

              const savedCountry = response.country || "";
              if (!savedCountry || COUNTRIES.includes(savedCountry)) return "";
              return savedCountry;
            })(),
            website: response.website || prevData.website,
            potential_lead_investor:
              response.potential_lead_investor ||
              prevData.potential_lead_investor,
            minimum_size: response.minimum_size || prevData.minimum_size,
            maximum_size: response.maximum_size || prevData.maximum_size,
            minimum_arr_requirement:
              response.minimum_arr_requirement ||
              prevData.minimum_arr_requirement,
            contacts: response.contacts
              ? typeof response.contacts === "string"
                ? JSON.parse(response.contacts)
                : response.contacts
              : prevData.contacts,
            round_title:
              response.round_title === "Draft VC - In Progress"
                ? ""
                : response.round_title || prevData.round_title,
            round_size: response.round_size || prevData.round_size,
            valuation: response.valuation || prevData.valuation,
            round_stage: response.round_stage || prevData.round_stage,
            project_description:
              response.round_description || prevData.project_description,
            priority_level: response.priority_level || prevData.priority_level,
            start_date: (() => {
              try {
                return response.start_date
                  ? new Date(response.start_date).toISOString().split("T")[0]
                  : prevData.start_date || "";
              } catch (e) {
                console.warn(
                  "Failed to parse start_date:",
                  response.start_date,
                );
                return prevData.start_date || "";
              }
            })(),
            targeted_end_date: (() => {
              try {
                return response.targeted_end_date
                  ? new Date(response.targeted_end_date)
                      .toISOString()
                      .split("T")[0]
                  : prevData.targeted_end_date || "";
              } catch (e) {
                console.warn(
                  "Failed to parse targeted_end_date:",
                  response.targeted_end_date,
                );
                return prevData.targeted_end_date || "";
              }
            })(),
            spoc: response.spoc || prevData.spoc,
            template_id: (() => {
              const templateId = response.template_id || prevData.template_id;
              console.log("�� DEBUG - Loading template_id from API:", {
                "response.template_id": response.template_id,
                "prevData.template_id": prevData.template_id,
                "final templateId": templateId,
                "templateId type": typeof templateId,
              });
              return templateId;
            })(),
            billing_currency:
              response.billing_currency || prevData.billing_currency,
            probability: response.probability || prevData.probability,
            notes: response.notes || prevData.notes,
          }));

          // Debug: Check what dates were actually set
          setTimeout(() => {
            console.log("🐛 DEBUG - Final date values in state:", {
              start_date: vcData.start_date,
              targeted_end_date: vcData.targeted_end_date,
            });
          }, 100);

          // Force template synchronization after API data is loaded
          setTimeout(() => {
            const apiTemplateId = response.template_id;
            if (apiTemplateId) {
              const templateIdStr = apiTemplateId.toString();
              console.log("🔄 Force syncing template after API load:", {
                apiTemplateId,
                templateIdStr,
                currentSelectedTemplate: selectedTemplate,
              });
              if (templateIdStr !== selectedTemplate) {
                console.log(
                  "✅ Force setting selectedTemplate to:",
                  templateIdStr,
                );
                setSelectedTemplate(templateIdStr);
              }
            } else {
              console.log(
                "❌ No template_id in API response, force setting to manual",
              );
              if (selectedTemplate !== "manual") {
                setSelectedTemplate("manual");
              }
            }
          }, 200);

          console.log(
            "�� DEBUG - After setting vcData from API, country fields should be:",
            {
              country: (() => {
                const savedCountry = response.country || "";
                if (!savedCountry) return "";
                if (COUNTRIES.includes(savedCountry)) return savedCountry;
                return "Other";
              })(),
              custom_country: (() => {
                const savedCountry = response.country || "";
                if (!savedCountry || COUNTRIES.includes(savedCountry))
                  return "";
                return savedCountry;
              })(),
              originalApiCountry: response.country,
            },
          );

          // Restore the saved tab if available
          const savedTab = localStorage.getItem(
            `vc_draft_${currentDraftId}_tab`,
          );
          if (savedTab && savedTab !== activeTab) {
            console.log("🐛 DEBUG - Restoring saved tab:", savedTab);
            setActiveTab(savedTab);
          }
        } catch (error) {
          console.error("🐛 ERROR - Failed to fetch draft data:", error);
        }
      }
    };

    fetchDraftData();
  }, [currentDraftId, resumeData]); // Removed activeTab to prevent refetch on tab changes

  // Debug country initialization when resuming from draft
  useEffect(() => {
    console.log("🐛 DEBUG - Component initialized/updated:");
    console.log("resumeData:", resumeData);
    console.log("resumeData?.country:", resumeData?.country);
    console.log("resumeData?.template_id:", resumeData?.template_id);
    console.log("vcData.country:", vcData.country);
    console.log("vcData.custom_country:", vcData.custom_country);
    console.log("vcData.template_id:", vcData.template_id);
    console.log("selectedTemplate:", selectedTemplate);
    console.log("currentDraftId:", currentDraftId);
    if (resumeData?.country) {
      console.log(
        "Is resumeData.country in COUNTRIES?",
        COUNTRIES.includes(resumeData.country),
      );
    }
  }, [
    resumeData,
    vcData.country,
    vcData.custom_country,
    vcData.template_id,
    selectedTemplate,
    currentDraftId,
  ]);

  const createVCMutation = useMutation({
    mutationFn: (vcData: any) =>
      apiClient.request("/vc", {
        method: "POST",
        body: JSON.stringify(vcData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      queryClient.invalidateQueries({ queryKey: ["my-vc-partial-saves"] });
      queryClient.invalidateQueries({ queryKey: ["vc-stats"] });
    },
  });

  const partialSaveMutation = useMutation({
    mutationFn: (vcData: any) => {
      // If we have a current draft ID, update the existing draft
      if (currentDraftId) {
        return apiClient.request(`/vc/${currentDraftId}`, {
          method: "PUT",
          body: JSON.stringify({ ...vcData, is_partial: true }),
        });
      } else {
        // Create a new draft
        return apiClient.request("/vc", {
          method: "POST",
          body: JSON.stringify({ ...vcData, is_partial: true }),
        });
      }
    },
    onSuccess: (response: any) => {
      console.log(
        "Partial save success - currentDraftId:",
        currentDraftId,
        "response:",
        response,
      );

      // If this was a new draft (no currentDraftId), set the draft ID from the response
      if (!currentDraftId && response.data?.id) {
        console.log("Setting new draft ID from response:", response.data.id);
        setCurrentDraftId(response.data.id);
      }

      queryClient.invalidateQueries({ queryKey: ["vcs"] });
      queryClient.invalidateQueries({ queryKey: ["my-vc-partial-saves"] });
      queryClient.invalidateQueries({ queryKey: ["vc-stats"] });
    },
  });

  // Navigation functions
  const handleNextTab = async () => {
    if (!isLastTab) {
      // Auto-save when moving to next tab
      const hasData =
        vcData.investor_name || vcData.round_title || vcData.email;
      if (hasData) {
        try {
          await partialSaveMutation.mutateAsync();
        } catch (error) {
          console.error("Failed to auto-save when navigating:", error);
        }
      }
      const nextTab = TABS[currentTabIndex + 1].value;
      setActiveTab(nextTab);
      // Save current tab to localStorage
      if (currentDraftId) {
        localStorage.setItem(`vc_draft_${currentDraftId}_tab`, nextTab);
      }
    }
  };

  const handlePreviousTab = () => {
    if (!isFirstTab) {
      const prevTab = TABS[currentTabIndex - 1].value;
      setActiveTab(prevTab);
      // Save current tab to localStorage
      if (currentDraftId) {
        localStorage.setItem(`vc_draft_${currentDraftId}_tab`, prevTab);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Debug country field changes
    if (field === "country" || field === "custom_country") {
      console.log(`🐛 DEBUG - handleInputChange: ${field} = "${value}"`);
      console.log("Current vcData.country:", vcData.country);
      console.log("Current vcData.custom_country:", vcData.custom_country);
    }

    // Debug template_id field changes
    if (field === "template_id") {
      console.log(`🔄 DEBUG - handleInputChange: template_id = "${value}"`);
      console.log("Current vcData.template_id:", vcData.template_id);
      console.log("Current selectedTemplate:", selectedTemplate);
    }

    // Use functional state update to ensure we have the latest state
    setVcData((prevData) => {
      const newData = {
        ...prevData,
        [field]: value,
      };

      // Clear lead_source_value when lead_source changes
      if (field === "lead_source") {
        newData.lead_source_value = "";
      }

      // Debug country specific updates
      if (field === "country") {
        console.log(
          "🐛 DEBUG - Functional update - setting country to:",
          value,
        );
        console.log("🐛 DEBUG - Previous data country:", prevData.country);
        console.log("🐛 DEBUG - New data country:", newData.country);
      }

      return newData;
    });

    // Additional debugging for country field - check state persistence
    if (field === "country") {
      setTimeout(() => {
        console.log("🐛 DEBUG - vcData.country after 100ms:", vcData.country);
      }, 100);
    }

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
        country:
          vcData.country === "Other" && vcData.custom_country?.trim()
            ? vcData.custom_country.trim()
            : vcData.country || null,
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
        start_date: vcData.start_date || null,
        targeted_end_date: vcData.targeted_end_date || null,
        spoc: vcData.spoc,
        template_id: vcData.template_id || null,
        billing_currency: vcData.billing_currency,
        notes: vcData.notes,
        contacts: JSON.stringify(vcData.contacts),
        created_by: parseInt(user.id),
      };

      console.log("🚀 DEBUG - Submitting final data:", submitData);
      console.log("🚀 DEBUG - Country values at submit time:", {
        "vcData.country": vcData.country,
        "vcData.custom_country": vcData.custom_country,
        "submitData.country": submitData.country,
      });
      console.log("🚀 DEBUG - Full vcData at submit:", vcData);
      const result = await createVCMutation.mutateAsync(submitData);

      // If we were working with a draft, delete the draft
      if (currentDraftId) {
        try {
          await apiClient.request(`/vc/${currentDraftId}`, {
            method: "DELETE",
          });
          queryClient.invalidateQueries({ queryKey: ["my-vc-partial-saves"] });
          localStorage.removeItem(`vc_draft_${currentDraftId}_tab`); // Clean up saved tab
          setCurrentDraftId(null); // Clear the draft ID
        } catch (error) {
          console.error("Failed to delete draft after creation:", error);
          // Don't block navigation on draft deletion failure
        }
      }

      navigate(`/vc/${result.data?.id || result.id}`);
    } catch (error) {
      console.error("Failed to create VC:", error);
      alert("Failed to create VC. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialSave = async () => {
    try {
      // Log current state before doing anything
      console.log(
        "🐛 DEBUG - handlePartialSave called, current vcData.country:",
        vcData.country,
      );
      console.log(
        "��� DEBUG - handlePartialSave called, current vcData.custom_country:",
        vcData.custom_country,
      );

      // Check actual DOM values vs state
      const countryDropdown = document
        .querySelector('label[for="country"]')
        ?.nextElementSibling?.querySelector("span")
        ?.textContent?.trim();
      const customCountryInput =
        document.querySelector("#custom_country")?.value;
      console.log("🐛 DEBUG - DOM vs State comparison:", {
        domCountryDropdown: countryDropdown,
        stateCountry: vcData.country,
        domCustomCountry: customCountryInput,
        stateCustomCountry: vcData.custom_country,
      });

      // Determine the final country value to save
      const countryValue =
        vcData.country === "Other" && vcData.custom_country?.trim()
          ? vcData.custom_country.trim()
          : vcData.country || null;

      console.log("🐛 DEBUG - Partial Save Country:", {
        dropdown: vcData.country,
        custom: vcData.custom_country,
        finalValue: countryValue,
      });

      const partialData = {
        lead_source: vcData.lead_source || "other",
        lead_source_value: vcData.lead_source_value,
        lead_created_by: vcData.lead_created_by,
        status: vcData.status,
        round_title: vcData.round_title,
        round_description: vcData.project_description,
        round_stage: vcData.round_stage || null,
        round_size: vcData.round_size,
        valuation: vcData.valuation,
        investor_category: vcData.investor_category,
        investor_name: vcData.investor_name || "PARTIAL_SAVE_IN_PROGRESS",
        phone: vcData.phone,
        address: vcData.address,
        city: vcData.city,
        state: vcData.state,
        country: countryValue,
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
        start_date: vcData.start_date || null,
        targeted_end_date: vcData.targeted_end_date || null,
        spoc: vcData.spoc,
        template_id: vcData.template_id || null,
        billing_currency: vcData.billing_currency,
        notes: vcData.notes,
        contacts: JSON.stringify(vcData.contacts),
        created_by: parseInt(user.id),
        is_partial: true,
      };

      console.log("🚀 DEBUG - Saving partial data:", partialData);
      const result = await partialSaveMutation.mutateAsync(partialData);

      // Save the current active tab for restoration when continuing
      localStorage.setItem(
        `vc_draft_${currentDraftId || "new"}_tab`,
        activeTab,
      );

      alert(
        currentDraftId
          ? "Draft updated successfully!"
          : "VC data saved as draft!",
      );
    } catch (error) {
      console.error("Failed to save partial VC:", error);
      alert("Failed to save draft. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/vc")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to VC Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentDraftId ? "Edit VC Draft" : "Create VC"}
            </h1>
            <p className="text-gray-600">
              {currentDraftId
                ? "Continue working on your saved VC draft"
                : "Create a new venture capital opportunity"}
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
            variant="outline"
            onClick={handlePartialSave}
            disabled={partialSaveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {currentDraftId ? "Update Draft" : "Save Draft"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || createVCMutation.isPending}
          >
            {isSubmitting ? "Creating..." : "Create VC"}
          </Button>
        </div>
      </div>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lead">📋 Lead Information</TabsTrigger>
          <TabsTrigger value="investor">🏢 Investor Information</TabsTrigger>
          <TabsTrigger value="round">💰 Round Information</TabsTrigger>
          <TabsTrigger value="additional">
            📝 Additional Information
          </TabsTrigger>
        </TabsList>

        {/* Lead Info Tab */}
        <TabsContent value="lead" className="space-y-6">
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
                </div>

                {/* Dynamic Lead Source Value */}
                {vcData.lead_source && (
                  <div className="md:col-span-2">
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

                {isEditMode && (
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
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
        <TabsContent value="investor" className="space-y-6">
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

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
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
                      console.log(
                        "🐛 DEBUG - Country dropdown changed to:",
                        value,
                      );
                      console.log(
                        "🐛 DEBUG - Current vcData.country before change:",
                        vcData.country,
                      );
                      handleInputChange("country", value);
                      if (value !== "Other") {
                        console.log(
                          "🐛 DEBUG - Clearing custom_country because not Other",
                        );
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
                      onChange={(e) => {
                        console.log(
                          "🐛 DEBUG - Custom country changed to:",
                          e.target.value,
                        );
                        handleInputChange("custom_country", e.target.value);
                      }}
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

              {/* Multiple Contacts Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContact}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>

                <div className="space-y-4">
                  {vcData.contacts.map((contact, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          Contact {index + 1}
                          {index === 0 && " (Primary)"}
                        </h4>
                        {vcData.contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeContact(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`contact_name_${index}`}>
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id={`contact_name_${index}`}
                              value={contact.contact_name}
                              onChange={(e) =>
                                updateContact(
                                  index,
                                  "contact_name",
                                  e.target.value,
                                )
                              }
                              placeholder="Contact person's name"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`designation_${index}`}>
                            Designation
                          </Label>
                          <Input
                            id={`designation_${index}`}
                            value={contact.designation}
                            onChange={(e) =>
                              updateContact(
                                index,
                                "designation",
                                e.target.value,
                              )
                            }
                            placeholder="Partner, Associate, etc."
                          />
                        </div>

                        <div>
                          <Label htmlFor={`contact_email_${index}`}>
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id={`contact_email_${index}`}
                              type="email"
                              value={contact.email}
                              onChange={(e) =>
                                updateContact(index, "email", e.target.value)
                              }
                              placeholder="contact@investor.com"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`contact_phone_${index}`}>
                            Phone
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id={`contact_phone_${index}`}
                              value={contact.phone}
                              onChange={(e) =>
                                updateContact(index, "phone", e.target.value)
                              }
                              placeholder="+1 (555) 123-4567"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor={`linkedin_${index}`}>
                            LinkedIn Profile
                          </Label>
                          <Input
                            id={`linkedin_${index}`}
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
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
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
        <TabsContent value="round" className="space-y-6">
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
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="spoc">SPOC (Single Point of Contact)</Label>
                  <Input
                    id="spoc"
                    placeholder="Primary contact for this round"
                    value={vcData.spoc}
                    onChange={(e) => handleInputChange("spoc", e.target.value)}
                  />
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
                  <Label htmlFor="targeted_end_date">Target Close Date</Label>
                  <Input
                    id="targeted_end_date"
                    type="date"
                    value={vcData.targeted_end_date}
                    onChange={(e) =>
                      handleInputChange("targeted_end_date", e.target.value)
                    }
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
                      Choose Template (4 available)
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
                            {templatesError
                              ? `Error: ${templatesError.message}`
                              : "No VC templates available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && selectedTemplate !== "manual" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (templateDetails) {
                            setPreviewTemplate(templateDetails);
                            setIsTemplatePreviewOpen(true);
                          }
                        }}
                        disabled={templateDetailsLoading}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a VC-specific template to automatically configure
                    workflow steps for this round.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
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

        {/* Additional Tab */}
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

          {/* Navigation Buttons */}
          <div className="flex justify-between">
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

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="list-disc list-inside mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={isTemplatePreviewOpen}
        onClose={() => setIsTemplatePreviewOpen(false)}
        template={previewTemplate}
      />
    </div>
  );
}
