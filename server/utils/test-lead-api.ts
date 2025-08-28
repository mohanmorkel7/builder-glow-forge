// Test utility to verify all lead fields are properly stored and retrieved

export const sampleLeadData = {
  // Lead Source Information
  lead_source: "website" as const,
  lead_source_value: "https://company.com/contact",

  // Project Information
  project_title: "E-commerce Platform Development",
  project_description:
    "Building a comprehensive e-commerce platform with advanced features",
  project_budget: 150000,
  project_timeline: "6-8 months",
  project_requirements:
    "React, Node.js, PostgreSQL, payment integration, mobile responsive",

  // Enhanced Project Info
  solutions: ["CardToken", "MylapaySecure", "FRM", "Switch-Cards"],
  priority_level: "high" as const,
  start_date: "2024-03-01",
  targeted_end_date: "2024-10-31",
  expected_daily_txn_volume: 10000,
  project_value: 250000,
  spoc: "John Smith",

  // Commercials
  commercials: ["CardToken", "MylapaySecure"],
  commercial_pricing: [
    {
      solution: "CardToken",
      value: 2.5,
      unit: "paisa" as const,
      currency: "INR" as const,
    },
    {
      solution: "MylapaySecure",
      value: 1.8,
      unit: "paisa" as const,
      currency: "INR" as const,
    },
  ],

  // Client Information
  client_name: "TechCorp Solutions",
  client_type: "enterprise" as const,
  company: "TechCorp Solutions Pvt Ltd",
  company_location: "Mumbai, Maharashtra",
  category: "fintech" as const,
  country: "india" as const,
  contact_person: "Sarah Johnson",
  email: "sarah.johnson@techcorp.com",
  phone: "+91-98765-43210",
  industry: "Financial Technology",
  company_size: "201-500" as const,

  // Contact Information
  contacts: [
    {
      contact_name: "Sarah Johnson",
      designation: "CTO",
      phone: "+91-98765-43210",
      email: "sarah.johnson@techcorp.com",
      linkedin: "https://linkedin.com/in/sarahjohnson",
    },
    {
      contact_name: "Mike Chen",
      designation: "VP Engineering",
      phone: "+91-98765-43211",
      email: "mike.chen@techcorp.com",
      linkedin: "https://linkedin.com/in/mikechen",
    },
  ],

  // Additional Information
  priority: "high" as const,
  expected_close_date: "2024-12-31",
  probability: 75,
  notes:
    "High priority lead with strong technical requirements. Good fit for our solutions.",

  // Metadata
  created_by: 1,
  assigned_to: 2,
};

export const expectedDatabaseColumns = [
  // Primary fields
  "id",
  "lead_id",
  "created_at",
  "updated_at",

  // Lead Source Information
  "lead_source",
  "lead_source_value",

  // Project Information
  "project_title",
  "project_description",
  "project_budget",
  "project_timeline",
  "project_requirements",

  // Enhanced Project Info
  "solutions",
  "priority_level",
  "start_date",
  "targeted_end_date",
  "expected_daily_txn_volume",
  "project_value",
  "spoc",

  // Commercials
  "commercials",
  "commercial_pricing",

  // Client Information
  "client_name",
  "client_type",
  "company",
  "company_location",
  "category",
  "country",
  "contact_person",
  "email",
  "phone",
  "industry",
  "company_size",

  // Contact Information
  "contacts",

  // Additional Information
  "status",
  "priority",
  "expected_close_date",
  "probability",
  "notes",

  // Metadata
  "created_by",
  "assigned_to",
];

export function validateLeadData(leadData: any): {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
} {
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Check required fields
  const requiredFields = [
    "client_name",
    "contact_person",
    "email",
    "lead_source",
    "created_by",
  ];
  for (const field of requiredFields) {
    if (!leadData[field]) {
      missingFields.push(field);
    }
  }

  // Validate data types and formats
  if (leadData.email && typeof leadData.email === "string") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      errors.push("Invalid email format");
    }
  }

  if (leadData.probability !== undefined) {
    const prob = Number(leadData.probability);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      errors.push("Probability must be between 0 and 100");
    }
  }

  if (leadData.project_budget !== undefined) {
    const budget = Number(leadData.project_budget);
    if (isNaN(budget) || budget < 0) {
      errors.push("Project budget must be a positive number");
    }
  }

  if (leadData.project_value !== undefined) {
    const value = Number(leadData.project_value);
    if (isNaN(value) || value < 0) {
      errors.push("Project value must be a positive number");
    }
  }

  if (leadData.expected_daily_txn_volume !== undefined) {
    const volume = Number(leadData.expected_daily_txn_volume);
    if (isNaN(volume) || volume < 0) {
      errors.push(
        "Expected daily transaction volume must be a positive number",
      );
    }
  }

  // Validate enum values
  const validLeadSources = [
    "email",
    "social-media",
    "phone",
    "website",
    "referral",
    "cold-call",
    "event",
    "other",
  ];
  if (
    leadData.lead_source &&
    !validLeadSources.includes(leadData.lead_source)
  ) {
    errors.push("Invalid lead source");
  }

  const validStatuses = ["in-progress", "won", "lost", "completed"];
  if (leadData.status && !validStatuses.includes(leadData.status)) {
    errors.push("Invalid status");
  }

  const validPriorities = ["low", "medium", "high", "urgent"];
  if (leadData.priority && !validPriorities.includes(leadData.priority)) {
    errors.push("Invalid priority");
  }

  const validPriorityLevels = ["high", "medium", "low"];
  if (
    leadData.priority_level &&
    !validPriorityLevels.includes(leadData.priority_level)
  ) {
    errors.push("Invalid priority level");
  }

  // Validate arrays
  if (leadData.solutions && !Array.isArray(leadData.solutions)) {
    errors.push("Solutions must be an array");
  }

  if (leadData.commercials && !Array.isArray(leadData.commercials)) {
    errors.push("Commercials must be an array");
  }

  if (
    leadData.commercial_pricing &&
    !Array.isArray(leadData.commercial_pricing)
  ) {
    errors.push("Commercial pricing must be an array");
  }

  if (leadData.contacts && !Array.isArray(leadData.contacts)) {
    errors.push("Contacts must be an array");
  }

  // Validate commercial pricing structure
  if (
    leadData.commercial_pricing &&
    Array.isArray(leadData.commercial_pricing)
  ) {
    for (let i = 0; i < leadData.commercial_pricing.length; i++) {
      const pricing = leadData.commercial_pricing[i];
      if (!pricing.solution || typeof pricing.solution !== "string") {
        errors.push(
          `Commercial pricing item ${i + 1}: solution is required and must be a string`,
        );
      }
      if (pricing.value === undefined || isNaN(Number(pricing.value))) {
        errors.push(
          `Commercial pricing item ${i + 1}: value is required and must be a number`,
        );
      }
      if (!pricing.unit || !["paisa", "cents"].includes(pricing.unit)) {
        errors.push(
          `Commercial pricing item ${i + 1}: unit must be either 'paisa' or 'cents'`,
        );
      }
      if (
        !pricing.currency ||
        !["INR", "USD", "Dubai"].includes(pricing.currency)
      ) {
        errors.push(
          `Commercial pricing item ${i + 1}: currency must be either 'INR', 'USD', or 'Dubai'`,
        );
      }
    }
  }

  // Validate contacts structure
  if (leadData.contacts && Array.isArray(leadData.contacts)) {
    for (let i = 0; i < leadData.contacts.length; i++) {
      const contact = leadData.contacts[i];
      if (contact.email && typeof contact.email === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email)) {
          errors.push(`Contact ${i + 1}: Invalid email format`);
        }
      }
    }
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
}

export const testApiEndpoints = {
  createLead: "/api/leads",
  getLeads: "/api/leads",
  getLead: (id: number) => `/api/leads/${id}`,
  updateLead: (id: number) => `/api/leads/${id}`,
  deleteLead: (id: number) => `/api/leads/${id}`,
  getLeadSteps: (leadId: number) => `/api/leads/${leadId}/steps`,
  createLeadStep: (leadId: number) => `/api/leads/${leadId}/steps`,
  getLeadStats: "/api/leads/stats",
};

export function logApiTestResults(
  testName: string,
  success: boolean,
  data?: any,
  error?: any,
) {
  const timestamp = new Date().toISOString();
  const status = success ? "✅ PASS" : "❌ FAIL";

  console.log(`\n${status} [${timestamp}] ${testName}`);

  if (success && data) {
    console.log("Response data keys:", Object.keys(data));
    if (data.id) console.log("Created with ID:", data.id);
    if (data.lead_id) console.log("Lead ID:", data.lead_id);
  }

  if (!success && error) {
    console.log("Error:", error.message || error);
  }
}
