import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  User,
  Info,
  Briefcase,
  Target,
  Users,
  Globe,
  FileText,
  Award,
  Zap,
  Plus,
  Eye,
} from "lucide-react";

const leadSources = [
  { value: "email", label: "Email", icon: Mail },
  { value: "social-media", label: "Social Media", icon: Users },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "website", label: "Website", icon: Globe },
  { value: "referral", label: "Referral", icon: Award },
  { value: "cold-call", label: "Cold Call", icon: Phone },
  { value: "event", label: "Event", icon: Briefcase },
  { value: "other", label: "Other", icon: Zap },
];

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const solutionsOptions = [
  "CardToken",
  "MylapaySecure",
  "FRM",
  "Switch-Cards",
  "Clearing-Base II",
  "Optimizer-Cards",
  "Switch-UPI",
  "Optimizer-UPI",
  "Chargeback",
  "NetworkConnectivity",
  "Orchestration",
];

const commercialsOptions = [
  "CardToken",
  "MylapaySecure",
  "FRM",
  "Switch-Cards",
  "Clearing-Base II",
  "Optimizer-Cards",
  "Switch-UPI",
  "Optimizer-UPI",
  "Chargeback",
  "NetworkConnectivity",
  "Orchestration",
];

const priorityLevels = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const currencyOptions = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "AED", label: "AED (د.إ)" },
];

const getCurrencyUnits = (currency: string) => {
  switch (currency) {
    case "INR":
      return [
        { value: "rupee", label: "Rupee (₹)" },
        { value: "paisa", label: "Paisa" },
      ];
    case "USD":
      return [
        { value: "dollar", label: "Dollar ($)" },
        { value: "cents", label: "Cents (¢)" },
      ];
    case "AED":
      return [
        { value: "dirham", label: "Dirham (د.إ)" },
        { value: "fils", label: "Fils" },
      ];
    default:
      return [
        { value: "rupee", label: "Rupee (₹)" },
        { value: "paisa", label: "Paisa" },
      ];
  }
};

const clientTypes = [
  { value: "new", label: "New" },
  { value: "existing", label: "Existing" },
];

const categories = [
  { value: "aggregator", label: "Aggregator" },
  { value: "banks", label: "Banks" },
  { value: "partner", label: "Partner" },
];

const countries = [
  { value: "india", label: "India" },
  { value: "usa", label: "United States" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "uk", label: "United Kingdom" },
  { value: "singapore", label: "Singapore" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

export default function CreateLead() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createLeadMutation = useCreateLead();
  const partialSaveMutation = usePartialSaveLead();

  // Get only Lead templates (category ID 2 based on our mock data)
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["templates-by-category", 2],
    queryFn: async () => {
      console.log("Fetching templates for category 2...");
      try {
        const result = await apiClient.request(
          "/templates-production/category/2",
        );
        console.log("Templates fetch successful:", result);
        return result;
      } catch (error) {
        console.error("Templates fetch error:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log(
        `Template fetch attempt ${failureCount + 1}, error:`,
        error.message,
      );
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying templates fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: (data) => {
      console.log("Templates loaded successfully:", data);
    },
    onError: (error) => {
      console.error("Templates fetch failed:", error);
      // Don't throw the error, let the component handle it gracefully
    },
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>("manual");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Debug templates state
  useEffect(() => {
    console.log("Templates state:", {
      templates,
      templatesLoading,
      templatesError,
      selectedTemplate,
      templateCount: templates.length,
    });
  }, [templates, templatesLoading, templatesError, selectedTemplate]);

  // Get selected template data
  const selectedTemplateId =
    selectedTemplate && selectedTemplate !== "manual"
      ? parseInt(selectedTemplate)
      : null;
  const { data: templateData } = useTemplate(selectedTemplateId || 0);

  const [leadData, setLeadData] = useState({
    // Lead Source
    lead_source: "",
    lead_source_value: "", // Dynamic field based on lead source selection
    lead_created_by: user?.email || "", // Capture login email, editable

    // Project Information
    project_title: "",
    project_description: "",
    project_requirements: "",

    // Enhanced Project Info
    solutions: [] as string[],
    priority_level: "medium",
    start_date: new Date().toISOString().split("T")[0], // Current date
    targeted_end_date: "",
    expected_daily_txn_volume: "",
    expected_daily_txn_volume_year1: "",
    expected_daily_txn_volume_year2: "",
    expected_daily_txn_volume_year3: "",
    expected_daily_txn_volume_year5: "",
    spoc: "",

    // Commercials
    billing_currency: "INR" as "INR" | "USD" | "AED",

    // Flat fee config
    flat_fee_config: [] as Array<{
      id: string;
      component_name: string;
      value: number;
      currency: "INR" | "USD" | "AED";
      type: "one_time" | "recurring";
      recurring_period?: "monthly" | "quarterly" | "yearly";
    }>,

    // Transaction fee config
    transaction_fee_config: [] as Array<{
      solution: string;
      value: number;
      currency: "INR" | "USD" | "AED";
    }>,

    // Client Information
    client_name: "",
    client_type: "",
    company_location: "",
    category: "",
    country: "",

    // Contact Information
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

    // Additional Information
    expected_close_date: "",
    probability: "0",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"INR" | "USD" | "AED">(
    "INR",
  );
  const [currentTab, setCurrentTab] = useState("basic");
  const [isPartialSaved, setIsPartialSaved] = useState(false);
  const [isResumedFromDraft, setIsResumedFromDraft] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [hasSavedDraftInSession, setHasSavedDraftInSession] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle resume data from location state (when coming from dashboard)
  useEffect(() => {
    if (location.state?.resumeData) {
      const resumeData = location.state.resumeData;
      console.log("Resuming from draft with data:", {
        id: resumeData.id,
        _resumeFromId: resumeData._resumeFromId,
        clientName: resumeData.client_name,
        template_id: resumeData.template_id,
      });

      // Ensure lead_created_by is set if not already present
      if (!resumeData.lead_created_by && user?.email) {
        resumeData.lead_created_by = user.email;
      }
      setLeadData(resumeData);
      setIsResumedFromDraft(true);

      // Store template_id in leadData so we can restore it after templates load
      if (resumeData.template_id) {
        setLeadData((prev) => ({
          ...prev,
          template_id: resumeData.template_id,
        }));
      }

      // Set draft ID if resuming from an existing draft
      if (resumeData.id) {
        console.log("Setting draftId to:", resumeData.id);
        setDraftId(resumeData.id);
        setHasSavedDraftInSession(true);
      } else {
        console.log("No draft ID found in resumeData");
      }

      // Set the active tab to the first incomplete tab if available
      if (resumeData._completedTabs && resumeData._completedTabs.length > 0) {
        const lastCompletedTab =
          resumeData._completedTabs[resumeData._completedTabs.length - 1];
        const lastCompletedTabIndex = tabs.findIndex(
          (tab) => tab.value === lastCompletedTab,
        );
        if (
          lastCompletedTabIndex >= 0 &&
          lastCompletedTabIndex < tabs.length - 1
        ) {
          setCurrentTab(tabs[lastCompletedTabIndex + 1].value);
        } else {
          setCurrentTab(lastCompletedTab);
        }
      }

      // Clear location state to prevent re-initialization on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize lead_created_by with user email when user loads or changes
  useEffect(() => {
    if (user?.email && !leadData.lead_created_by) {
      updateField("lead_created_by", user.email);
    }
  }, [user?.email]);

  // Restore template selection after templates are loaded
  useEffect(() => {
    if (templates.length > 0 && leadData.template_id && isResumedFromDraft) {
      const templateIdStr = leadData.template_id.toString();
      const templateExists = templates.some(
        (t: any) => t.id.toString() === templateIdStr,
      );

      console.log("Restoring template selection:", {
        template_id: leadData.template_id,
        templateIdStr,
        templateExists,
        currentSelectedTemplate: selectedTemplate,
        availableTemplates: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
      });

      if (templateExists && selectedTemplate !== templateIdStr) {
        console.log(
          `Setting template from ${selectedTemplate} to ${templateIdStr}`,
        );
        setSelectedTemplate(templateIdStr);
      } else if (!templateExists) {
        console.warn(
          "Template not found in available templates, setting to manual",
        );
        setSelectedTemplate("manual");
      }
    } else if (
      templates.length > 0 &&
      !leadData.template_id &&
      isResumedFromDraft &&
      selectedTemplate !== "manual"
    ) {
      console.log("No template in draft, setting to manual");
      setSelectedTemplate("manual");
    }
  }, [templates, leadData.template_id, isResumedFromDraft, selectedTemplate]);

  // Debug: Track draftId changes
  useEffect(() => {
    console.log("draftId changed to:", draftId);
    console.log("hasSavedDraftInSession:", hasSavedDraftInSession);
    console.log("isResumedFromDraft:", isResumedFromDraft);
    console.log("selectedTemplate:", selectedTemplate);
    console.log("templates loaded:", templates.length);
  }, [
    draftId,
    hasSavedDraftInSession,
    isResumedFromDraft,
    selectedTemplate,
    templates.length,
  ]);

  const tabs = [
    { value: "basic", label: "Lead Info", icon: "📋" },
    { value: "project", label: "Project Details", icon: "🎯" },
    { value: "commercials", label: "Commercials", icon: "��" },
    { value: "client", label: "Client & Contact", icon: "🏢" },
    { value: "additional", label: "Additional", icon: "📝" },
  ];

  const currentTabIndex = tabs.findIndex((tab) => tab.value === currentTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  // Current exchange rates (updated as of January 2025)
  const exchangeRates = {
    INR: { USD: 0.012, AED: 0.044, INR: 1 },
    USD: { INR: 85.2, AED: 3.67, USD: 1 },
    AED: { INR: 23.2, USD: 0.272, AED: 1 },
  };

  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    const rate =
      exchangeRates[fromCurrency as keyof typeof exchangeRates]?.[
        toCurrency as keyof typeof exchangeRates.INR
      ];
    return rate ? amount * rate : amount;
  };
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = (field: string, value: any) => {
    const newData = {
      ...leadData,
      [field]: value,
    };

    // Clear lead_source_value when lead_source changes
    if (field === "lead_source") {
      newData.lead_source_value = "";
    }

    // If solutions are updated, sync with transaction_fee_config
    if (field === "solutions") {
      const existingConfig = leadData.transaction_fee_config || [];
      const newConfig = value.map((solution: string) => {
        // Keep existing config if solution was already selected
        const existing = existingConfig.find((c) => c.solution === solution);
        return (
          existing || {
            solution,
            value: 0,
            currency: leadData.billing_currency,
          }
        );
      });
      newData.transaction_fee_config = newConfig;
    }

    // If billing currency is updated, update all related currency fields
    if (field === "billing_currency") {
      // Update transaction fee configs to new currency
      newData.transaction_fee_config = leadData.transaction_fee_config.map(
        (config) => ({
          ...config,
          currency: value,
        }),
      );

      // Update flat fee configs to new currency
      newData.flat_fee_config = leadData.flat_fee_config.map((config) => ({
        ...config,
        currency: value,
      }));
    }

    setLeadData(newData);
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
    if (saveError) {
      setSaveError(null);
    }
  };

  const updateTransactionFeeConfig = (
    index: number,
    field: string,
    value: any,
  ) => {
    const newConfig = [...(leadData.transaction_fee_config || [])];
    newConfig[index] = { ...newConfig[index], [field]: value };
    setLeadData((prev) => ({ ...prev, transaction_fee_config: newConfig }));
  };

  const addFlatFeeConfig = () => {
    const newConfig = {
      id: Date.now().toString(),
      component_name: "",
      value: 0,
      currency: leadData.billing_currency,
      type: "one_time" as const,
    };
    setLeadData((prev) => ({
      ...prev,
      flat_fee_config: [...prev.flat_fee_config, newConfig],
    }));
  };

  const updateFlatFeeConfig = (index: number, field: string, value: any) => {
    const newConfig = [...leadData.flat_fee_config];
    newConfig[index] = { ...newConfig[index], [field]: value };
    setLeadData((prev) => ({ ...prev, flat_fee_config: newConfig }));
  };

  const removeFlatFeeConfig = (index: number) => {
    const newConfig = leadData.flat_fee_config.filter((_, i) => i !== index);
    setLeadData((prev) => ({ ...prev, flat_fee_config: newConfig }));
  };

  // Summary calculations
  const calculateSummary = () => {
    const currentVolume = parseInt(leadData.expected_daily_txn_volume) || 0;
    const year1Volume = parseInt(leadData.expected_daily_txn_volume_year1) || 0;
    const year2Volume = parseInt(leadData.expected_daily_txn_volume_year2) || 0;
    const year3Volume = parseInt(leadData.expected_daily_txn_volume_year3) || 0;
    const year5Volume = parseInt(leadData.expected_daily_txn_volume_year5) || 0;

    const periods = [
      {
        label: "Current",
        volume: currentVolume,
        multiplier: 30,
        description: `(${currentVolume.toLocaleString()} daily txns × 30 days = ${(currentVolume * 30).toLocaleString()} total txns, ${(currentVolume * 360).toLocaleString()} yearly txns)`,
      },
      {
        label: "First Year",
        volume: year1Volume,
        multiplier: 30 * 12,
        description: `(${year1Volume.toLocaleString()} daily txns × 30 days × 12 months = ${(year1Volume * 360).toLocaleString()} total txns)`,
      },
      {
        label: "Second Year",
        volume: year2Volume,
        multiplier: 30 * 12,
        description: `(${year2Volume.toLocaleString()} daily txns × 30 days × 12 months = ${(year2Volume * 360).toLocaleString()} total txns)`,
      },
      {
        label: "Third Year",
        volume: year3Volume,
        multiplier: 30 * 12,
        description: `(${year3Volume.toLocaleString()} daily txns × 30 days × 12 months = ${(year3Volume * 360).toLocaleString()} total txns)`,
      },
      {
        label: "Fifth Year",
        volume: year5Volume,
        multiplier: 30 * 12,
        description: `(${year5Volume.toLocaleString()} daily txns × 30 days × 12 months = ${(year5Volume * 360).toLocaleString()} total txns)`,
      },
    ];

    return periods.map((period) => ({
      ...period,
      totalTransactions: period.volume * period.multiplier,
      // Transaction fees
      solutions: leadData.transaction_fee_config.map((config) => ({
        ...config,
        totalValue: period.volume * period.multiplier * config.value,
        totalValueUSD: convertCurrency(
          period.volume * period.multiplier * config.value,
          config.currency,
          "USD",
        ),
      })),
      // Flat fees - show all flat fees in all periods
      flatFees: leadData.flat_fee_config.map((config) => {
        let multiplier = 1;
        let description = "One time";

        if (config.type === "recurring" && config.recurring_period) {
          switch (config.recurring_period) {
            case "monthly":
              multiplier = 12;
              description = `Monthly (��${multiplier})`;
              break;
            case "quarterly":
              multiplier = 4;
              description = `Quarterly (×${multiplier})`;
              break;
            case "yearly":
              multiplier = 1;
              description = `Yearly (×${multiplier})`;
              break;
          }
        }

        return {
          ...config,
          multiplier,
          description,
          totalValue: config.value * multiplier,
          totalValueUSD: convertCurrency(
            config.value * multiplier,
            config.currency,
            "USD",
          ),
        };
      }),
    }));
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...leadData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setLeadData((prev) => ({ ...prev, contacts: newContacts }));
  };

  const addContact = () => {
    setLeadData((prev) => ({
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
    if (leadData.contacts.length > 1) {
      const newContacts = leadData.contacts.filter((_, i) => i !== index);
      setLeadData((prev) => ({ ...prev, contacts: newContacts }));
    }
  };

  const handleResumePartialSave = (resumeData: any) => {
    // Extract metadata
    const { _resumeFromId, _lastSaved, _completedTabs, ...formData } =
      resumeData;

    // Update the form with the resumed data
    setLeadData(formData);

    // Restore selected template if template_id exists
    if (formData.template_id) {
      setSelectedTemplate(formData.template_id.toString());
    } else {
      setSelectedTemplate("manual");
    }

    // Set the current tab to the last completed tab or first tab
    if (_completedTabs && _completedTabs.length > 0) {
      setCurrentTab(_completedTabs[0]);
    }

    // Mark as resumed from draft
    setIsResumedFromDraft(true);

    // Show a success message
    alert(`Resumed draft from ${new Date(_lastSaved).toLocaleString()}`);
  };

  const handlePartialSave = async () => {
    try {
      setSaving(true);
      console.log("handlePartialSave called - Current state:", {
        currentTab,
        draftId,
        hasSavedDraftInSession,
        clientName: leadData.client_name,
      });

      // Clean form data - convert empty strings to null for numeric fields
      const cleanedData = {
        ...leadData,
        // Properly serialize array fields
        solutions: JSON.stringify(leadData.solutions || []),
        contacts: JSON.stringify(leadData.contacts || []),
        // Convert empty strings to null for numeric fields
        expected_daily_txn_volume:
          leadData.expected_daily_txn_volume === ""
            ? null
            : leadData.expected_daily_txn_volume,
        billing_currency: leadData.billing_currency,
        flat_fee_config: JSON.stringify(leadData.flat_fee_config || []),
        transaction_fee_config: JSON.stringify(
          leadData.transaction_fee_config || [],
        ),
        expected_daily_txn_volume_year1:
          leadData.expected_daily_txn_volume_year1 === ""
            ? null
            : leadData.expected_daily_txn_volume_year1,
        expected_daily_txn_volume_year2:
          leadData.expected_daily_txn_volume_year2 === ""
            ? null
            : leadData.expected_daily_txn_volume_year2,
        expected_daily_txn_volume_year3:
          leadData.expected_daily_txn_volume_year3 === ""
            ? null
            : leadData.expected_daily_txn_volume_year3,
        expected_daily_txn_volume_year5:
          leadData.expected_daily_txn_volume_year5 === ""
            ? null
            : leadData.expected_daily_txn_volume_year5,
        probability: leadData.probability === "" ? null : leadData.probability,
        // Convert empty string dates to null
        expected_close_date:
          leadData.expected_close_date === ""
            ? null
            : leadData.expected_close_date,
        targeted_end_date:
          leadData.targeted_end_date === "" ? null : leadData.targeted_end_date,
        start_date: leadData.start_date === "" ? null : leadData.start_date,
      };

      // Filter out metadata fields that shouldn't go to database
      const {
        _resumeFromId,
        _lastSaved,
        _completedTabs,
        id,
        ...cleanDataForDb
      } = cleanedData;

      if (_resumeFromId || _lastSaved || _completedTabs) {
        console.log("Filtered out metadata fields:", {
          _resumeFromId,
          _lastSaved,
          _completedTabs,
          id,
        });
      }

      // Prepare partial data for database save
      const partialData = {
        ...cleanDataForDb,
        // Only set defaults for required fields if we're creating a new draft
        // For updates, preserve the actual user data
        lead_source: cleanDataForDb.lead_source || "other", // Ensure we have a lead_source
        category: cleanDataForDb.category || null, // Set to null if empty to avoid constraint violation
        client_type: cleanDataForDb.client_type || null, // Set to null if empty to avoid constraint violation
        country: cleanDataForDb.country || null, // Set to null if empty to avoid constraint violation
        client_name: draftId
          ? cleanDataForDb.client_name // For updates, use actual data
          : cleanDataForDb.client_name || "PARTIAL_SAVE_IN_PROGRESS", // For new drafts, use placeholder if empty
        project_title: draftId
          ? cleanDataForDb.project_title // For updates, use actual data
          : cleanDataForDb.project_title || "Partial Save - In Progress", // For new drafts, use placeholder if empty
        notes: JSON.stringify({
          isPartialSave: true,
          lastSaved: new Date().toISOString(),
          completedTabs: Array.from(
            new Set([...((leadData as any)._completedTabs || []), currentTab]),
          ),
          originalData: leadData,
        }),
        created_by: parseInt(user?.id || "1"),
        template_id:
          selectedTemplate && selectedTemplate !== "manual"
            ? parseInt(selectedTemplate)
            : null,
      };

      console.log("Template ID calculation:", {
        selectedTemplate,
        selectedTemplateType: typeof selectedTemplate,
        isManual: selectedTemplate === "manual",
        isNotManual: selectedTemplate !== "manual",
        hasSelectedTemplate: selectedTemplate && selectedTemplate !== "manual",
        parsedTemplateId:
          selectedTemplate && selectedTemplate !== "manual"
            ? parseInt(selectedTemplate)
            : null,
        finalTemplateId: partialData.template_id,
      });

      console.log("Final partialData being saved:", {
        draftId: draftId,
        client_name: partialData.client_name,
        project_title: partialData.project_title,
        lead_source: partialData.lead_source,
        category: partialData.category,
        client_type: partialData.client_type,
        country: partialData.country,
        solutions: partialData.solutions,
        contacts: partialData.contacts,
        template_id: partialData.template_id,
        selectedTemplate: selectedTemplate,
        // Don't log full notes as it contains large originalData
        hasNotes: !!partialData.notes,
        // Show that metadata fields were filtered out
        metadataFieldsFiltered: {
          _resumeFromId,
          _lastSaved,
          _completedTabs: _completedTabs?.length || 0,
        },
      });

      // If we have a draft ID, update the existing draft instead of creating a new one
      if (draftId) {
        try {
          console.log(
            `Attempting to update existing draft with ID: ${draftId}`,
          );

          // First check if the lead still exists
          try {
            await apiClient.getLead(draftId);
          } catch (checkError) {
            console.warn("Draft no longer exists, creating new one");
            // If the draft was deleted, clear the draft ID and create a new one
            setDraftId(null);
            const result = await partialSaveMutation.mutateAsync(partialData);
            setDraftId(result.id);
            setHasSavedDraftInSession(true);
            console.log(
              "New draft created after old one was not found:",
              result,
            );
            return;
          }

          // Try to update the existing draft
          const result = await apiClient.updateLead(draftId, partialData);
          console.log("Draft updated successfully:", result);

          // Invalidate relevant caches to ensure fresh data on resume
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          queryClient.invalidateQueries({ queryKey: ["leads", draftId] });
          queryClient.invalidateQueries({ queryKey: ["my-partial-saves"] });
          queryClient.invalidateQueries({
            queryKey: ["my-partial-saves", user?.id],
          });
        } catch (error) {
          console.error("Failed to update draft:", error);
          // Log the specific error to understand why update is failing
          if (error instanceof Error) {
            console.error("Update error message:", error.message);
          }

          // Show error but don't create duplicates
          throw new Error(
            `Failed to update existing draft. Please try again or create a new lead.`,
          );
        }
      } else {
        // Create new draft only if we haven't saved one in this session
        console.log("Creating new draft");
        const result = await partialSaveMutation.mutateAsync(partialData);
        setDraftId(result.id);
        setHasSavedDraftInSession(true);
        console.log("Draft created successfully:", result);
      }

      setIsPartialSaved(true);

      // Show success message for 2 seconds
      setTimeout(() => setIsPartialSaved(false), 2000);
    } catch (error) {
      console.error("Error saving partial data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save draft";
      setSaveError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleNextTab = async () => {
    if (!isLastTab) {
      // Only save if we have meaningful data in the current tab
      const hasData =
        currentTab === "basic"
          ? leadData.lead_source || leadData.lead_created_by
          : currentTab === "project"
            ? leadData.project_title ||
              leadData.project_description ||
              leadData.solutions.length > 0
            : currentTab === "commercials"
              ? leadData.flat_fee_config.length > 0 ||
                leadData.transaction_fee_config.length > 0
              : currentTab === "client"
                ? leadData.client_name || leadData.contacts[0]?.contact_name
                : true; // For additional tab, always save

      if (hasData) {
        await handlePartialSave();
      }
      setCurrentTab(tabs[currentTabIndex + 1].value);
    }
  };

  const handlePreviousTab = () => {
    if (!isFirstTab) {
      setCurrentTab(tabs[currentTabIndex - 1].value);
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!leadData.client_name.trim()) {
      newErrors.push("Client name is required");
    }
    if (!leadData.lead_source) {
      newErrors.push("Lead source is required");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...leadData,
        project_budget:
          leadData.project_budget && leadData.project_budget !== ""
            ? parseFloat(leadData.project_budget)
            : undefined,
        expected_daily_txn_volume:
          leadData.expected_daily_txn_volume &&
          leadData.expected_daily_txn_volume !== ""
            ? parseInt(leadData.expected_daily_txn_volume)
            : undefined,
        expected_daily_txn_volume_year1:
          leadData.expected_daily_txn_volume_year1 &&
          leadData.expected_daily_txn_volume_year1 !== ""
            ? parseInt(leadData.expected_daily_txn_volume_year1)
            : undefined,
        expected_daily_txn_volume_year2:
          leadData.expected_daily_txn_volume_year2 &&
          leadData.expected_daily_txn_volume_year2 !== ""
            ? parseInt(leadData.expected_daily_txn_volume_year2)
            : undefined,
        expected_daily_txn_volume_year3:
          leadData.expected_daily_txn_volume_year3 &&
          leadData.expected_daily_txn_volume_year3 !== ""
            ? parseInt(leadData.expected_daily_txn_volume_year3)
            : undefined,
        expected_daily_txn_volume_year5:
          leadData.expected_daily_txn_volume_year5 &&
          leadData.expected_daily_txn_volume_year5 !== ""
            ? parseInt(leadData.expected_daily_txn_volume_year5)
            : undefined,
        probability:
          leadData.probability && leadData.probability !== ""
            ? parseInt(leadData.probability)
            : undefined,
        // Clean date fields
        expected_close_date:
          leadData.expected_close_date === ""
            ? null
            : leadData.expected_close_date,
        targeted_end_date:
          leadData.targeted_end_date === "" ? null : leadData.targeted_end_date,
        start_date: leadData.start_date === "" ? null : leadData.start_date,
        created_by: parseInt(user?.id || "1"),
        template_id:
          selectedTemplate && selectedTemplate !== "manual"
            ? parseInt(selectedTemplate)
            : null,
      };

      // If this was a draft, create a new complete lead and delete the draft
      let result;
      if (draftId) {
        try {
          // Create new complete lead
          result = await createLeadMutation.mutateAsync(submitData);
          console.log("New complete lead created successfully");

          // Delete the draft to prevent duplicates
          try {
            await apiClient.deleteLead(draftId);
            console.log("Draft deleted successfully");
          } catch (deleteError) {
            console.warn(
              "Failed to delete draft, but lead was created:",
              deleteError,
            );
          }

          // Clean up draft-related state and queries
          setDraftId(null);
          setIsResumedFromDraft(false);
          setIsPartialSaved(false);
          setHasSavedDraftInSession(false);

          // Invalidate partial saves queries to remove from draft list
          queryClient.invalidateQueries({ queryKey: ["my-partial-saves"] });
          queryClient.invalidateQueries({
            queryKey: ["my-partial-saves", user?.id],
          });
          queryClient.invalidateQueries({ queryKey: ["partial-leads"] });
        } catch (error) {
          console.error("Failed to create complete lead:", error);

          // Clean up draft state even if creation failed
          setDraftId(null);
          setIsResumedFromDraft(false);
          setIsPartialSaved(false);
          setHasSavedDraftInSession(false);

          throw error; // Re-throw to be caught by outer try-catch
        }
      } else {
        // Create new complete lead
        result = await createLeadMutation.mutateAsync(submitData);
      }

      // Navigate to the created lead details page
      navigate(`/leads/${result.id}`);
    } catch (error) {
      console.error("Failed to create lead:", error);
      setErrors(["Failed to create lead. Please try again."]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/leads");
  };

  const isFormValid = leadData.client_name.trim() && leadData.lead_source;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Lead
            </h1>
            <p className="text-gray-600">
              Add a new lead to your sales pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
                Create Lead
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Save Error Alert */}
      {saveError && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>Save Error: {saveError}</AlertDescription>
        </Alert>
      )}

      {/* Resume Notification */}
      {isResumedFromDraft && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span>
              You are continuing from a saved draft. You can access other drafts
              from the Lead Dashboard.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Lead Info</TabsTrigger>
          <TabsTrigger value="project">Project Details</TabsTrigger>
          <TabsTrigger value="commercials">Commercials</TabsTrigger>
          <TabsTrigger value="client">Client & Contact Info</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
        </TabsList>

        {/* Lead Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                Essential information about the lead source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lead Created By */}
              <div>
                <Label htmlFor="lead_created_by">Lead Created By</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lead_created_by"
                    value={leadData.lead_created_by}
                    onChange={(e) =>
                      updateField("lead_created_by", e.target.value)
                    }
                    className="pl-10"
                    placeholder="Enter email address of lead creator"
                  />
                </div>
              </div>

              {/* Lead Source */}
              <div>
                <Label htmlFor="lead_source">Lead Source *</Label>
                <Select
                  value={leadData.lead_source}
                  onValueChange={(value) => updateField("lead_source", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select how you found this lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => {
                      const Icon = source.icon;
                      return (
                        <SelectItem key={source.value} value={source.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{source.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Lead Source Value */}
              {leadData.lead_source && (
                <div>
                  <Label htmlFor="lead_source_value">
                    {leadData.lead_source === "email" && "Email Address"}
                    {leadData.lead_source === "phone" && "Phone Number"}
                    {leadData.lead_source === "social-media" &&
                      "Social Media Profile/Link"}
                    {leadData.lead_source === "website" && "Website URL"}
                    {leadData.lead_source === "referral" &&
                      "Referral Source/Contact"}
                    {leadData.lead_source === "cold-call" &&
                      "Phone Number Called"}
                    {leadData.lead_source === "event" && "Event Name/Details"}
                    {leadData.lead_source === "other" && "Source Details"}
                  </Label>
                  <div className="relative mt-1">
                    {leadData.lead_source === "email" && (
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    {leadData.lead_source === "phone" && (
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    {leadData.lead_source === "website" && (
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
                    <Input
                      id="lead_source_value"
                      value={leadData.lead_source_value}
                      onChange={(e) =>
                        updateField("lead_source_value", e.target.value)
                      }
                      className="pl-10"
                      placeholder={
                        leadData.lead_source === "email"
                          ? "contact@company.com"
                          : leadData.lead_source === "phone"
                            ? "+1 (555) 000-0000"
                            : leadData.lead_source === "social-media"
                              ? "LinkedIn profile or social media link"
                              : leadData.lead_source === "website"
                                ? "https://company.com"
                                : leadData.lead_source === "referral"
                                  ? "Name of person who referred"
                                  : leadData.lead_source === "cold-call"
                                    ? "+1 (555) 000-0000"
                                    : leadData.lead_source === "event"
                                      ? "Conference name or event details"
                                      : "Describe the source"
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Information Tab */}
        <TabsContent value="project" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Details about the project or service they're interested in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="project_title">Project Title</Label>
                <div className="relative mt-1">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="project_title"
                    value={leadData.project_title}
                    onChange={(e) =>
                      updateField("project_title", e.target.value)
                    }
                    className="pl-10"
                    placeholder="e.g., E-commerce Platform Development"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="project_description">Project Description</Label>
                <Textarea
                  id="project_description"
                  value={leadData.project_description}
                  onChange={(e) =>
                    updateField("project_description", e.target.value)
                  }
                  className="mt-1"
                  rows={4}
                  placeholder="Describe what the client wants to achieve..."
                />
              </div>

              <div>
                <Label htmlFor="project_requirements">
                  Technical Requirements
                </Label>
                <Textarea
                  id="project_requirements"
                  value={leadData.project_requirements}
                  onChange={(e) =>
                    updateField("project_requirements", e.target.value)
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="List any specific technologies, integrations, or requirements..."
                />
              </div>

              {/* Enhanced Project Info */}
              <div className="border-t pt-6 space-y-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Template Selection
                </h4>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="template">
                      Choose Template
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
                    <div className="text-xs text-gray-500">
                      Current:{" "}
                      {selectedTemplate === "manual"
                        ? "Manual"
                        : selectedTemplate}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        console.log("Template selection changed:", {
                          from: selectedTemplate,
                          to: value,
                          availableTemplates: templates.map((t: any) => ({
                            id: t.id,
                            name: t.name,
                          })),
                          templatesLoading,
                          templatesError: templatesError?.message,
                        });
                        setSelectedTemplate(value);
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
                                : "Select a template or use manual"
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
                              : "No templates available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && selectedTemplate !== "manual" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplatePreview(true)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {templatesError && (
                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="text-red-600 font-medium">
                        Error loading templates:
                      </p>
                      <p className="text-red-500">{templatesError.message}</p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            console.log("Testing template API manually...");
                            const result = await apiClient.request(
                              "/templates-production/category/2",
                            );
                            console.log("Manual API test result:", result);
                            alert(
                              `Manual test successful! Found ${result.length} templates`,
                            );
                          } catch (error) {
                            console.error("Manual API test failed:", error);
                            alert(`Manual test failed: ${error.message}`);
                          }
                        }}
                        className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Test API Manually
                      </button>
                    </div>
                  )}
                  {!templatesLoading &&
                    !templatesError &&
                    templates.length === 0 && (
                      <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-600">
                          No templates available for category 2 (Leads)
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              console.log(
                                "Testing template API for empty result...",
                              );
                              const result = await apiClient.request(
                                "/templates-production/category/2",
                              );
                              console.log(
                                "API test result for empty case:",
                                result,
                              );
                              const allTemplates = await apiClient.request(
                                "/templates-production",
                              );
                              console.log("All templates:", allTemplates);
                              alert(
                                `Found ${result.length} templates for category 2, ${allTemplates.length} total templates`,
                              );
                            } catch (error) {
                              console.error("API test failed:", error);
                              alert(`API test failed: ${error.message}`);
                            }
                          }}
                          className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Debug API
                        </button>
                      </div>
                    )}
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Enhanced Project Information
                  </h4>
                </div>

                <div>
                  <Label htmlFor="solutions">Solutions (Multiselect)</Label>
                  <MultiSelect
                    options={solutionsOptions}
                    value={leadData.solutions}
                    onChange={(value) => updateField("solutions", value)}
                    placeholder="Select solutions..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority_level">Priority Level</Label>
                    <Select
                      value={leadData.priority_level}
                      onValueChange={(value) =>
                        updateField("priority_level", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="spoc">SPOC (Single Point of Contact)</Label>
                    <Input
                      id="spoc"
                      value={leadData.spoc}
                      onChange={(e) => updateField("spoc", e.target.value)}
                      className="mt-1"
                      placeholder="Main contact person for the project"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">
                      Start Date (Expected or Confirmed)
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={leadData.start_date}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targeted_end_date">Targeted End Date</Label>
                    <Input
                      id="targeted_end_date"
                      type="date"
                      value={leadData.targeted_end_date}
                      onChange={(e) =>
                        updateField("targeted_end_date", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_daily_txn_volume">
                    Current Txn Volume
                  </Label>
                  <Input
                    id="expected_daily_txn_volume"
                    type="number"
                    value={leadData.expected_daily_txn_volume}
                    onChange={(e) =>
                      updateField("expected_daily_txn_volume", e.target.value)
                    }
                    className="mt-1"
                    placeholder="Current daily transaction volume"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expected_daily_txn_volume_year1">
                      Expected Daily Txn Volume First Year
                    </Label>
                    <Input
                      id="expected_daily_txn_volume_year1"
                      type="number"
                      value={leadData.expected_daily_txn_volume_year1}
                      onChange={(e) =>
                        updateField(
                          "expected_daily_txn_volume_year1",
                          e.target.value,
                        )
                      }
                      className="mt-1"
                      placeholder="Daily transactions in year 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expected_daily_txn_volume_year2">
                      Expected Daily Txn Volume Second Year
                    </Label>
                    <Input
                      id="expected_daily_txn_volume_year2"
                      type="number"
                      value={leadData.expected_daily_txn_volume_year2}
                      onChange={(e) =>
                        updateField(
                          "expected_daily_txn_volume_year2",
                          e.target.value,
                        )
                      }
                      className="mt-1"
                      placeholder="Daily transactions in year 2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expected_daily_txn_volume_year3">
                      Expected Daily Txn Volume Third Year
                    </Label>
                    <Input
                      id="expected_daily_txn_volume_year3"
                      type="number"
                      value={leadData.expected_daily_txn_volume_year3}
                      onChange={(e) =>
                        updateField(
                          "expected_daily_txn_volume_year3",
                          e.target.value,
                        )
                      }
                      className="mt-1"
                      placeholder="Daily transactions in year 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expected_daily_txn_volume_year5">
                      Expected Daily Txn Volume Fifth Year
                    </Label>
                    <Input
                      id="expected_daily_txn_volume_year5"
                      type="number"
                      value={leadData.expected_daily_txn_volume_year5}
                      onChange={(e) =>
                        updateField(
                          "expected_daily_txn_volume_year5",
                          e.target.value,
                        )
                      }
                      className="mt-1"
                      placeholder="Daily transactions in year 5"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commercials Tab */}
        <TabsContent value="commercials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commercials Configuration</CardTitle>
                  <CardDescription>
                    Configure flat fees and transaction-based pricing for this
                    lead
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label
                    htmlFor="billing_currency"
                    className="text-sm font-medium"
                  >
                    Billing Currency:
                  </Label>
                  <Select
                    value={leadData.billing_currency}
                    onValueChange={(value: "INR" | "USD" | "AED") =>
                      updateField("billing_currency", value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {/* Commercials Config */}
                <AccordionItem value="commercials-config">
                  <AccordionTrigger className="text-lg font-semibold">
                    Commercials
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6">
                    {/* Flat Fee Config */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">Flat Fee Config</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addFlatFeeConfig}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Flat Fee
                        </Button>
                      </div>

                      {leadData.flat_fee_config.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No flat fees configured. Click "Add Flat Fee" to add
                          one.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {leadData.flat_fee_config.map((config, index) => (
                            <div
                              key={config.id}
                              className="border rounded-lg p-4 space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">
                                  Flat Fee #{index + 1}
                                </h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFlatFeeConfig(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label>Component Name</Label>
                                  <Input
                                    value={config.component_name}
                                    onChange={(e) =>
                                      updateFlatFeeConfig(
                                        index,
                                        "component_name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., Setup Fee"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    value={config.value}
                                    onChange={(e) =>
                                      updateFlatFeeConfig(
                                        index,
                                        "value",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    placeholder="0"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label>Currency</Label>
                                  <Select
                                    value={config.currency}
                                    onValueChange={(value) =>
                                      updateFlatFeeConfig(
                                        index,
                                        "currency",
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="INR">
                                        INR (₹)
                                      </SelectItem>
                                      <SelectItem value="USD">
                                        USD ($)
                                      </SelectItem>
                                      <SelectItem value="AED">
                                        AED (د.إ)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Type</Label>
                                  <Select
                                    value={config.type}
                                    onValueChange={(value) =>
                                      updateFlatFeeConfig(index, "type", value)
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="one_time">
                                        One Time
                                      </SelectItem>
                                      <SelectItem value="recurring">
                                        Recurring
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {config.type === "recurring" && (
                                <div className="w-40">
                                  <Label>Recurring Period</Label>
                                  <Select
                                    value={config.recurring_period || ""}
                                    onValueChange={(value) =>
                                      updateFlatFeeConfig(
                                        index,
                                        "recurring_period",
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly">
                                        Monthly
                                      </SelectItem>
                                      <SelectItem value="quarterly">
                                        Quarterly
                                      </SelectItem>
                                      <SelectItem value="yearly">
                                        Yearly
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Transaction Fee Config */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-medium mb-4">
                        Transaction Fee Config
                      </h4>

                      {!leadData.solutions ||
                      leadData.solutions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No solutions selected in Project Details tab. Go to
                          Project Details tab and select solutions to configure
                          transaction fees.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Solution Name</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>
                                Rate ({leadData.billing_currency})
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leadData.transaction_fee_config.map(
                              (config, index) => (
                                <TableRow key={config.solution}>
                                  <TableCell className="font-medium">
                                    {config.solution}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={config.currency}
                                      onValueChange={(value) =>
                                        updateTransactionFeeConfig(
                                          index,
                                          "currency",
                                          value,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="INR">
                                          INR (₹)
                                        </SelectItem>
                                        <SelectItem value="USD">
                                          USD ($)
                                        </SelectItem>
                                        <SelectItem value="AED">
                                          AED (د.إ)
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={config.value}
                                      onChange={(e) =>
                                        updateTransactionFeeConfig(
                                          index,
                                          "value",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="0.00"
                                      className="w-24"
                                    />
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Summary Config */}
                <AccordionItem value="summary-config">
                  <AccordionTrigger className="text-lg font-semibold">
                    Project Deal size
                  </AccordionTrigger>
                  <AccordionContent>
                    {leadData.transaction_fee_config.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Configure transaction fees to see summary calculations.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {calculateSummary().map((period, periodIndex) => (
                          <div
                            key={period.label}
                            className="border rounded-lg p-4"
                          >
                            <h5 className="font-semibold mb-3">
                              {period.label} {period.description}
                            </h5>

                            {period.solutions.length === 0 ? (
                              <p className="text-gray-500">
                                No transaction fees configured
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Solution</TableHead>
                                    <TableHead>
                                      Rate({leadData.billing_currency})
                                    </TableHead>
                                    {period.label === "Current" ? (
                                      <>
                                        <TableHead>
                                          Total Transaction Count (month)
                                        </TableHead>
                                        <TableHead>
                                          Total Transaction Count (year)
                                        </TableHead>
                                      </>
                                    ) : (
                                      <>
                                        <TableHead>
                                          Total Transaction Count (month)
                                        </TableHead>
                                        <TableHead>
                                          Total Transaction Count (year)
                                        </TableHead>
                                      </>
                                    )}
                                    <TableHead>INR Value (month)</TableHead>
                                    <TableHead>USD Value (month)</TableHead>
                                    <TableHead>INR Value (year)</TableHead>
                                    <TableHead>USD Value (year)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Transaction Fees Section */}
                                  {period.solutions.length > 0 && (
                                    <TableRow className="bg-blue-50">
                                      <TableCell
                                        colSpan={8}
                                        className="font-semibold text-blue-800"
                                      >
                                        Transaction Fees
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {period.solutions.map((solution, index) => (
                                    <TableRow key={solution.solution}>
                                      <TableCell className="font-medium">
                                        {solution.solution}
                                      </TableCell>
                                      <TableCell>{solution.value}</TableCell>
                                      {period.label === "Current" ? (
                                        <>
                                          <TableCell>
                                            {period.totalTransactions.toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            {(
                                              period.totalTransactions * 12
                                            ).toLocaleString()}
                                          </TableCell>
                                        </>
                                      ) : (
                                        <>
                                          <TableCell>
                                            {(
                                              period.volume * 30
                                            ).toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            {period.totalTransactions.toLocaleString()}
                                          </TableCell>
                                        </>
                                      )}
                                      <TableCell>
                                        ₹
                                        {convertCurrency(
                                          period.volume * 30 * solution.value,
                                          solution.currency,
                                          "INR",
                                        ).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        $
                                        {convertCurrency(
                                          period.volume * 30 * solution.value,
                                          solution.currency,
                                          "USD",
                                        ).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        ₹
                                        {convertCurrency(
                                          period.label === "Current"
                                            ? period.volume *
                                                30 *
                                                12 *
                                                solution.value
                                            : solution.totalValue,
                                          solution.currency,
                                          "INR",
                                        ).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        $
                                        {convertCurrency(
                                          period.label === "Current"
                                            ? period.volume *
                                                30 *
                                                12 *
                                                solution.value
                                            : solution.totalValue,
                                          solution.currency,
                                          "USD",
                                        ).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Flat Fees Section */}
                                  {period.flatFees.length > 0 && (
                                    <>
                                      <TableRow className="bg-blue-50">
                                        <TableCell
                                          colSpan={8}
                                          className="font-semibold text-blue-800"
                                        >
                                          Flat Fees
                                        </TableCell>
                                      </TableRow>
                                      {period.flatFees.map((flatFee, index) => (
                                        <TableRow key={`flat-${index}`}>
                                          <TableCell className="font-medium">
                                            {flatFee.component_name}
                                          </TableCell>
                                          <TableCell>
                                            {flatFee.description}
                                          </TableCell>
                                          {period.label === "Current" ? (
                                            <>
                                              <TableCell>-</TableCell>
                                              <TableCell>-</TableCell>
                                            </>
                                          ) : (
                                            <>
                                              <TableCell>-</TableCell>
                                              <TableCell>-</TableCell>
                                            </>
                                          )}
                                          <TableCell>
                                            ₹
                                            {convertCurrency(
                                              flatFee.type === "recurring" &&
                                                flatFee.recurring_period ===
                                                  "monthly"
                                                ? flatFee.value
                                                : flatFee.type ===
                                                      "recurring" &&
                                                    flatFee.recurring_period ===
                                                      "quarterly"
                                                  ? flatFee.value / 3
                                                  : flatFee.type ===
                                                        "recurring" &&
                                                      flatFee.recurring_period ===
                                                        "yearly"
                                                    ? flatFee.value / 12
                                                    : flatFee.value,
                                              flatFee.currency,
                                              "INR",
                                            ).toLocaleString(undefined, {
                                              maximumFractionDigits: 2,
                                            })}
                                          </TableCell>
                                          <TableCell>
                                            $
                                            {convertCurrency(
                                              flatFee.type === "recurring" &&
                                                flatFee.recurring_period ===
                                                  "monthly"
                                                ? flatFee.value
                                                : flatFee.type ===
                                                      "recurring" &&
                                                    flatFee.recurring_period ===
                                                      "quarterly"
                                                  ? flatFee.value / 3
                                                  : flatFee.type ===
                                                        "recurring" &&
                                                      flatFee.recurring_period ===
                                                        "yearly"
                                                    ? flatFee.value / 12
                                                    : flatFee.value,
                                              flatFee.currency,
                                              "USD",
                                            ).toLocaleString(undefined, {
                                              maximumFractionDigits: 2,
                                            })}
                                          </TableCell>
                                          <TableCell>
                                            ₹
                                            {convertCurrency(
                                              flatFee.totalValue,
                                              flatFee.currency,
                                              "INR",
                                            ).toLocaleString(undefined, {
                                              maximumFractionDigits: 2,
                                            })}
                                          </TableCell>
                                          <TableCell>
                                            $
                                            {flatFee.totalValueUSD.toLocaleString(
                                              undefined,
                                              { maximumFractionDigits: 2 },
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </>
                                  )}

                                  {/* Total Row */}
                                  <TableRow className="font-bold bg-gray-50">
                                    <TableCell>Total</TableCell>
                                    <TableCell>
                                      {period.solutions
                                        .reduce((sum, s) => sum + s.value, 0)
                                        .toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                      {leadData.billing_currency} (txn rate)
                                    </TableCell>
                                    {period.label === "Current" ? (
                                      <>
                                        <TableCell>
                                          {period.totalTransactions.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          {(
                                            period.totalTransactions * 12
                                          ).toLocaleString()}
                                        </TableCell>
                                      </>
                                    ) : (
                                      <>
                                        <TableCell>
                                          {(
                                            period.volume * 30
                                          ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          {period.totalTransactions.toLocaleString()}
                                        </TableCell>
                                      </>
                                    )}
                                    <TableCell>
                                      ₹
                                      {(
                                        period.solutions.reduce(
                                          (sum, s) =>
                                            sum +
                                            convertCurrency(
                                              period.volume * 30 * s.value,
                                              s.currency,
                                              "INR",
                                            ),
                                          0,
                                        ) +
                                        period.flatFees.reduce(
                                          (sum, f) =>
                                            sum +
                                            convertCurrency(
                                              f.type === "recurring" &&
                                                f.recurring_period === "monthly"
                                                ? f.value
                                                : f.type === "recurring" &&
                                                    f.recurring_period ===
                                                      "quarterly"
                                                  ? f.value / 3
                                                  : f.type === "recurring" &&
                                                      f.recurring_period ===
                                                        "yearly"
                                                    ? f.value / 12
                                                    : f.value,
                                              f.currency,
                                              "INR",
                                            ),
                                          0,
                                        )
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      $
                                      {(
                                        period.solutions.reduce(
                                          (sum, s) =>
                                            sum +
                                            convertCurrency(
                                              period.volume * 30 * s.value,
                                              s.currency,
                                              "USD",
                                            ),
                                          0,
                                        ) +
                                        period.flatFees.reduce(
                                          (sum, f) =>
                                            sum +
                                            convertCurrency(
                                              f.type === "recurring" &&
                                                f.recurring_period === "monthly"
                                                ? f.value
                                                : f.type === "recurring" &&
                                                    f.recurring_period ===
                                                      "quarterly"
                                                  ? f.value / 3
                                                  : f.type === "recurring" &&
                                                      f.recurring_period ===
                                                        "yearly"
                                                    ? f.value / 12
                                                    : f.value,
                                              f.currency,
                                              "USD",
                                            ),
                                          0,
                                        )
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      ₹
                                      {(
                                        period.solutions.reduce(
                                          (sum, s) =>
                                            sum +
                                            convertCurrency(
                                              period.label === "Current"
                                                ? period.volume *
                                                    30 *
                                                    12 *
                                                    s.value
                                                : s.totalValue,
                                              s.currency,
                                              "INR",
                                            ),
                                          0,
                                        ) +
                                        period.flatFees.reduce(
                                          (sum, f) =>
                                            sum +
                                            convertCurrency(
                                              f.totalValue,
                                              f.currency,
                                              "INR",
                                            ),
                                          0,
                                        )
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      $
                                      {(
                                        period.solutions.reduce(
                                          (sum, s) =>
                                            sum +
                                            convertCurrency(
                                              period.label === "Current"
                                                ? period.volume *
                                                    30 *
                                                    12 *
                                                    s.value
                                                : s.totalValue,
                                              s.currency,
                                              "USD",
                                            ),
                                          0,
                                        ) +
                                        period.flatFees.reduce(
                                          (sum, f) => sum + f.totalValueUSD,
                                          0,
                                        )
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Information Tab */}
        <TabsContent value="client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client & Contact Information</CardTitle>
              <CardDescription>
                Client company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name_client">Name *</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="client_name_client"
                      value={leadData.client_name}
                      onChange={(e) =>
                        updateField("client_name", e.target.value)
                      }
                      className="pl-10"
                      placeholder="Client/Company name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="client_type">Type *</Label>
                  <Select
                    value={leadData.client_type}
                    onValueChange={(value) => updateField("client_type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="company_location">Company Location</Label>
                  <Input
                    id="company_location"
                    value={leadData.company_location}
                    onChange={(e) =>
                      updateField("company_location", e.target.value)
                    }
                    className="mt-1"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={leadData.category}
                    onValueChange={(value) => updateField("category", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={leadData.country}
                    onValueChange={(value) => updateField("country", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="border-t pt-6 space-y-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Contact Information
                </h4>
                <p className="text-sm text-gray-600">
                  Add contact details. You can add multiple contacts for this
                  lead.
                </p>

                {leadData.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        Contact #{index + 1}
                      </h5>
                      {leadData.contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContact(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`contact_name_${index}`}>
                          Contact Name *
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                            className="pl-10"
                            placeholder="Full name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`designation_${index}`}>
                          Designation / Role
                        </Label>
                        <Input
                          id={`designation_${index}`}
                          value={contact.designation}
                          onChange={(e) =>
                            updateContact(index, "designation", e.target.value)
                          }
                          className="mt-1"
                          placeholder="e.g., CEO, CTO, Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`phone_${index}`}>Phone Number</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id={`phone_${index}`}
                            value={contact.phone}
                            onChange={(e) =>
                              updateContact(index, "phone", e.target.value)
                            }
                            className="pl-10"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`email_${index}`}>Email Address</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id={`email_${index}`}
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              updateContact(index, "email", e.target.value)
                            }
                            className="pl-10"
                            placeholder="contact@company.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`linkedin_${index}`}>
                        LinkedIn or Other Contact Links
                      </Label>
                      <Input
                        id={`linkedin_${index}`}
                        value={contact.linkedin}
                        onChange={(e) =>
                          updateContact(index, "linkedin", e.target.value)
                        }
                        className="mt-1"
                        placeholder="https://linkedin.com/in/username or other social links"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addContact}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Probability and additional notes about this lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={leadData.probability}
                    onChange={(e) => updateField("probability", e.target.value)}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={leadData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Any additional notes about this lead..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation and Action Bar */}
      <div className="border-t bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePreviousTab}
              disabled={isFirstTab}
            >
              ← Previous
            </Button>
            <div className="text-sm text-gray-600">
              Step {currentTabIndex + 1} of {tabs.length}:{" "}
              {tabs[currentTabIndex].label}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isPartialSaved && (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✓ {draftId ? "Draft updated" : "Draft saved"}
              </span>
            )}
            <Button
              variant="outline"
              onClick={handlePartialSave}
              disabled={saving}
            >
              {draftId ? "Update Draft" : "Save Progress"}
            </Button>
            {!isLastTab ? (
              <Button onClick={handleNextTab} disabled={saving}>
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving || !isFormValid}
                className="min-w-32"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Lead"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={templateData}
      />
    </div>
  );
}
