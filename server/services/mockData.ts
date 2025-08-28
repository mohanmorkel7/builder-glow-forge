import bcrypt from "bcryptjs";

// Mock data that will be used when database is not available
export const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "admin@banani.com",
    phone: "+1 (555) 123-4567",
    password_hash:
      "$2b$10$oXLUwWLLFbWsc9idoXZXHO.dGmN/vAIurZd7Ib5Br1S8aMzYPPAYO", // 'password'
    role: "admin" as const,
    department: "Administration",
    manager_id: null,
    status: "active" as const,
    start_date: "2023-01-10",
    last_login: "2024-01-15T10:30:00Z",
    two_factor_enabled: false,
    notes: "System administrator",
    created_at: "2023-01-10T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "sales@banani.com",
    phone: "+1 (555) 234-5678",
    password_hash:
      "$2b$10$oXLUwWLLFbWsc9idoXZXHO.dGmN/vAIurZd7Ib5Br1S8aMzYPPAYO", // 'password'
    role: "sales" as const,
    department: "Sales & Marketing",
    manager_id: 1,
    status: "active" as const,
    start_date: "2023-02-15",
    last_login: "2024-01-14T14:20:00Z",
    two_factor_enabled: true,
    notes: "Senior sales representative",
    created_at: "2023-02-15T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z",
  },
  {
    id: 3,
    first_name: "Mike",
    last_name: "Johnson",
    email: "product@banani.com",
    phone: "+1 (555) 345-6789",
    password_hash:
      "$2b$10$oXLUwWLLFbWsc9idoXZXHO.dGmN/vAIurZd7Ib5Br1S8aMzYPPAYO", // 'password'
    role: "product" as const,
    department: "Product Development",
    manager_id: 1,
    status: "active" as const,
    start_date: "2023-03-20",
    last_login: "2024-01-13T16:45:00Z",
    two_factor_enabled: false,
    notes: "Lead product manager",
    created_at: "2023-03-20T09:00:00Z",
    updated_at: "2024-01-13T16:45:00Z",
  },
  {
    id: 4,
    first_name: "Sarah",
    last_name: "Wilson",
    email: "sarah@banani.com",
    phone: "+1 (555) 456-7890",
    password_hash:
      "$2b$10$oXLUwWLLFbWsc9idoXZXHO.dGmN/vAIurZd7Ib5Br1S8aMzYPPAYO", // 'password'
    role: "sales" as const,
    department: "Sales & Marketing",
    manager_id: 2,
    status: "inactive" as const,
    start_date: "2023-04-01",
    last_login: "2023-12-20T12:00:00Z",
    two_factor_enabled: false,
    notes: "On temporary leave",
    created_at: "2023-04-01T09:00:00Z",
    updated_at: "2023-12-20T12:00:00Z",
  },
  {
    id: 5,
    first_name: "Tom",
    last_name: "Brown",
    email: "tom@banani.com",
    phone: "+1 (555) 567-8901",
    password_hash:
      "$2b$10$oXLUwWLLFbWsc9idoXZXHO.dGmN/vAIurZd7Ib5Br1S8aMzYPPAYO", // 'password'
    role: "product" as const,
    department: "Product Development",
    manager_id: 3,
    status: "pending" as const,
    start_date: "2024-01-10",
    last_login: null,
    two_factor_enabled: false,
    notes: "New hire - pending setup",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z",
  },
  {
    id: 6,
    first_name: "Microsoft",
    last_name: "User",
    email: "microsoft.user@company.com",
    phone: "+1 (555) 678-9012",
    password_hash: "", // SSO user, no password
    role: "admin" as const,
    department: "SSO Users",
    manager_id: null,
    status: "active" as const,
    start_date: "2024-01-20",
    last_login: new Date().toISOString(),
    two_factor_enabled: false,
    notes: "Microsoft SSO authenticated user",
    created_at: "2024-01-20T09:00:00Z",
    updated_at: new Date().toISOString(),
  },
];

// Map string user IDs to numeric IDs for SSO users
export function normalizeUserId(userId: string | number): number {
  if (typeof userId === "number") return userId;

  // Handle special SSO user IDs
  if (userId === "sso-user-1") return 6;

  // Try to parse as integer
  const parsed = parseInt(userId);
  return isNaN(parsed) ? 1 : parsed; // Default to admin user if parsing fails
}

export const mockClients = [
  {
    id: 1,
    client_name: "Acme Corp",
    contact_person: "Jane Doe",
    email: "jane@acme.com",
    phone: "+1 (555) 123-4567",
    company_size: "large",
    industry: "technology",
    address: "123 Business Ave",
    city: "New York",
    state: "NY",
    zip_code: "10001",
    country: "us",
    expected_value: 50000,
    priority: "high" as const,
    status: "active" as const,
    sales_rep_id: 2,
    start_date: "2023-10-26",
    notes: "Important enterprise client",
    created_at: "2023-10-26T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 2,
    client_name: "Globex Inc.",
    contact_person: "Bob Wilson",
    email: "bob@globex.com",
    phone: "+1 (555) 234-5678",
    company_size: "medium",
    industry: "finance",
    address: "456 Corporate Blvd",
    city: "Chicago",
    state: "IL",
    zip_code: "60601",
    country: "us",
    expected_value: 25000,
    priority: "medium" as const,
    status: "onboarding" as const,
    sales_rep_id: 2,
    start_date: "2023-10-20",
    notes: "In onboarding process",
    created_at: "2023-10-20T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 3,
    client_name: "Soylent Corp",
    contact_person: "Alice Green",
    email: "alice@soylent.com",
    phone: "+1 (555) 345-6789",
    company_size: "small",
    industry: "manufacturing",
    address: "789 Industrial Way",
    city: "Detroit",
    state: "MI",
    zip_code: "48201",
    country: "us",
    expected_value: 15000,
    priority: "low" as const,
    status: "completed" as const,
    sales_rep_id: 2,
    start_date: "2023-09-15",
    notes: "Successfully onboarded",
    created_at: "2023-09-15T09:00:00Z",
    updated_at: "2023-11-01T16:00:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 4,
    client_name: "Initech",
    contact_person: "Peter Gibbons",
    email: "peter@initech.com",
    phone: "+1 (555) 456-7890",
    company_size: "medium",
    industry: "technology",
    address: "321 Office Park Dr",
    city: "Austin",
    state: "TX",
    zip_code: "73301",
    country: "us",
    expected_value: 35000,
    priority: "high" as const,
    status: "active" as const,
    sales_rep_id: 2,
    start_date: "2023-10-25",
    notes: "Rapid growth potential",
    created_at: "2023-10-25T09:00:00Z",
    updated_at: "2024-01-13T11:15:00Z",
    sales_rep_name: "Jane Smith",
  },
];

export const mockTemplates = [
  {
    id: 1,
    name: "Standard Client Onboarding",
    description:
      "A comprehensive template for standard client onboarding, covering initial contact to final setup.",
    type: "standard" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 5,
    creator_name: "John Doe",
    steps: [
      {
        id: 1,
        template_id: 1,
        step_order: 1,
        name: "Initial Contact",
        description:
          "Reach out to the client to introduce the onboarding process.",
        default_eta_days: 2,
        probability_percent: 20,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 2,
        template_id: 1,
        step_order: 2,
        name: "Document Collection",
        description:
          "Gather all necessary legal and financial documents from the client.",
        default_eta_days: 5,
        probability_percent: 30,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 3,
        template_id: 1,
        step_order: 3,
        name: "Contract Signing",
        description: "Review and execute service agreements.",
        default_eta_days: 3,
        probability_percent: 25,
        auto_alert: true,
        email_reminder: false,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 4,
        template_id: 1,
        step_order: 4,
        name: "Account Setup",
        description: "Create client accounts and configure initial settings.",
        default_eta_days: 2,
        probability_percent: 15,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 5,
        template_id: 1,
        step_order: 5,
        name: "Training Session",
        description: "Conduct onboarding training and knowledge transfer.",
        default_eta_days: 7,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
    ],
  },
  {
    id: 2,
    name: "Enterprise Client Onboarding",
    description:
      "Tailored onboarding process for large enterprise clients with complex integration requirements.",
    type: "enterprise" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 8,
    creator_name: "John Doe",
    steps: [
      {
        id: 6,
        template_id: 2,
        step_order: 1,
        name: "Enterprise Discovery Call",
        description:
          "Comprehensive discovery session with stakeholders to understand enterprise requirements.",
        default_eta_days: 3,
        probability_percent: 15,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "sales",
        order_position: 1,
        estimated_days: 3,
      },
      {
        id: 7,
        template_id: 2,
        step_order: 2,
        name: "Technical Architecture Review",
        description:
          "Review existing technical infrastructure and integration requirements.",
        default_eta_days: 5,
        probability_percent: 15,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "product",
        order_position: 2,
        estimated_days: 5,
      },
      {
        id: 8,
        template_id: 2,
        step_order: 3,
        name: "Security Assessment",
        description: "Conduct security review and compliance assessment.",
        default_eta_days: 7,
        probability_percent: 10,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 3,
        estimated_days: 7,
      },
      {
        id: 9,
        template_id: 2,
        step_order: 4,
        name: "Custom Integration Planning",
        description:
          "Design custom integration solutions for enterprise systems.",
        default_eta_days: 10,
        probability_percent: 20,
        auto_alert: true,
        email_reminder: false,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "product",
        order_position: 4,
        estimated_days: 10,
      },
      {
        id: 10,
        template_id: 2,
        step_order: 5,
        name: "Legal & Compliance Review",
        description: "Enterprise contract review and compliance verification.",
        default_eta_days: 14,
        probability_percent: 15,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 5,
        estimated_days: 14,
      },
      {
        id: 11,
        template_id: 2,
        step_order: 6,
        name: "Pilot Implementation",
        description: "Deploy pilot version in enterprise environment.",
        default_eta_days: 21,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: false,
        assigned_role: "product",
        order_position: 6,
        estimated_days: 21,
      },
      {
        id: 12,
        template_id: 2,
        step_order: 7,
        name: "Enterprise Training Program",
        description: "Comprehensive training for enterprise team members.",
        default_eta_days: 14,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: false,
        assigned_role: "sales",
        order_position: 7,
        estimated_days: 14,
      },
      {
        id: 13,
        template_id: 2,
        step_order: 8,
        name: "Go-Live & Support Setup",
        description: "Full deployment with dedicated enterprise support.",
        default_eta_days: 7,
        probability_percent: 5,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 8,
        estimated_days: 7,
      },
    ],
  },
  {
    id: 3,
    name: "SMB Onboarding Lite",
    description:
      "A streamlined onboarding template for small to medium businesses with essential steps.",
    type: "smb" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 3,
    creator_name: "John Doe",
    steps: [
      {
        id: 14,
        template_id: 3,
        step_order: 1,
        name: "Quick Setup Call",
        description:
          "Brief onboarding call to gather basic requirements and set expectations.",
        default_eta_days: 1,
        probability_percent: 40,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "sales",
        order_position: 1,
        estimated_days: 1,
      },
      {
        id: 15,
        template_id: 3,
        step_order: 2,
        name: "Basic Configuration",
        description:
          "Configure essential settings and integrations for SMB client.",
        default_eta_days: 2,
        probability_percent: 35,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "product",
        order_position: 2,
        estimated_days: 2,
      },
      {
        id: 16,
        template_id: 3,
        step_order: 3,
        name: "Go-Live Support",
        description:
          "Activate service and provide basic support documentation.",
        default_eta_days: 1,
        probability_percent: 25,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "sales",
        order_position: 3,
        estimated_days: 1,
      },
    ],
  },
  {
    id: 4,
    name: "Series A Funding Process",
    description:
      "Comprehensive template for managing Series A funding rounds from initial pitch to closing.",
    type: "vc" as const,
    category_id: 6, // VC category
    is_active: true,
    created_by: 1,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
    step_count: 6,
    creator_name: "John Doe",
    usage_count: 5,
    steps: [
      {
        id: 21,
        template_id: 4,
        step_order: 1,
        name: "Initial Pitch Deck Review",
        description:
          "Review investor pitch deck and prepare presentation materials.",
        default_eta_days: 3,
        probability_percent: 20,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 1,
        estimated_days: 3,
      },
      {
        id: 22,
        template_id: 4,
        step_order: 2,
        name: "Due Diligence Preparation",
        description:
          "Prepare all financial and legal documents for investor review.",
        default_eta_days: 7,
        probability_percent: 25,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 2,
        estimated_days: 7,
      },
      {
        id: 23,
        template_id: 4,
        step_order: 3,
        name: "Investor Meetings",
        description: "Schedule and conduct meetings with potential investors.",
        default_eta_days: 14,
        probability_percent: 20,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 3,
        estimated_days: 14,
      },
      {
        id: 24,
        template_id: 4,
        step_order: 4,
        name: "Term Sheet Negotiation",
        description: "Negotiate and finalize term sheet with lead investor.",
        default_eta_days: 10,
        probability_percent: 15,
        auto_alert: true,
        email_reminder: false,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 4,
        estimated_days: 10,
      },
      {
        id: 25,
        template_id: 4,
        step_order: 5,
        name: "Legal Documentation",
        description:
          "Complete all legal documentation and investor agreements.",
        default_eta_days: 21,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 5,
        estimated_days: 21,
      },
      {
        id: 26,
        template_id: 4,
        step_order: 6,
        name: "Closing and Fund Transfer",
        description: "Complete the funding round and transfer funds.",
        default_eta_days: 5,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 6,
        estimated_days: 5,
      },
    ],
  },
  {
    id: 5,
    name: "Seed Round Management",
    description:
      "Template for managing seed funding rounds with angel investors and early-stage VCs.",
    type: "vc" as const,
    category_id: 6, // VC category
    is_active: true,
    created_by: 1,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
    step_count: 5,
    creator_name: "John Doe",
    usage_count: 8,
    steps: [
      {
        id: 27,
        template_id: 5,
        step_order: 1,
        name: "Business Plan Validation",
        description:
          "Validate business model and create investor-ready business plan.",
        default_eta_days: 5,
        probability_percent: 25,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 1,
        estimated_days: 5,
      },
      {
        id: 28,
        template_id: 5,
        step_order: 2,
        name: "Angel Investor Outreach",
        description: "Identify and reach out to potential angel investors.",
        default_eta_days: 10,
        probability_percent: 30,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 2,
        estimated_days: 10,
      },
      {
        id: 29,
        template_id: 5,
        step_order: 3,
        name: "Pitch Presentations",
        description: "Conduct pitch presentations to interested investors.",
        default_eta_days: 14,
        probability_percent: 25,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 3,
        estimated_days: 14,
      },
      {
        id: 30,
        template_id: 5,
        step_order: 4,
        name: "Investment Commitments",
        description: "Secure investment commitments and finalize terms.",
        default_eta_days: 7,
        probability_percent: 15,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 4,
        estimated_days: 7,
      },
      {
        id: 31,
        template_id: 5,
        step_order: 5,
        name: "Fund Disbursement",
        description: "Complete paperwork and receive funding.",
        default_eta_days: 3,
        probability_percent: 5,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 5,
        estimated_days: 3,
      },
    ],
  },
  {
    id: 6,
    name: "Growth Round Strategy",
    description:
      "Template for later-stage funding rounds focusing on growth and expansion.",
    type: "vc" as const,
    category_id: 6, // VC category
    is_active: true,
    created_by: 1,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
    step_count: 4,
    creator_name: "John Doe",
    usage_count: 3,
    steps: [
      {
        id: 32,
        template_id: 6,
        step_order: 1,
        name: "Growth Metrics Analysis",
        description:
          "Analyze current growth metrics and prepare investor materials.",
        default_eta_days: 7,
        probability_percent: 30,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 1,
        estimated_days: 7,
      },
      {
        id: 33,
        template_id: 6,
        step_order: 2,
        name: "Strategic Investor Identification",
        description:
          "Identify strategic investors aligned with growth objectives.",
        default_eta_days: 14,
        probability_percent: 35,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 2,
        estimated_days: 14,
      },
      {
        id: 34,
        template_id: 6,
        step_order: 3,
        name: "Valuation and Terms Discussion",
        description: "Negotiate valuation and investment terms.",
        default_eta_days: 21,
        probability_percent: 25,
        auto_alert: true,
        email_reminder: false,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 3,
        estimated_days: 21,
      },
      {
        id: 35,
        template_id: 6,
        step_order: 4,
        name: "Round Completion",
        description: "Finalize investment and execute growth strategy.",
        default_eta_days: 10,
        probability_percent: 10,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 4,
        estimated_days: 10,
      },
    ],
  },
  {
    id: 7,
    name: "Bridge Funding Process",
    description:
      "Quick template for bridge rounds to extend runway before major funding.",
    type: "vc" as const,
    category_id: 6, // VC category
    is_active: true,
    created_by: 1,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
    step_count: 3,
    creator_name: "John Doe",
    usage_count: 2,
    steps: [
      {
        id: 36,
        template_id: 7,
        step_order: 1,
        name: "Existing Investor Outreach",
        description:
          "Contact existing investors for bridge funding participation.",
        default_eta_days: 3,
        probability_percent: 40,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 1,
        estimated_days: 3,
      },
      {
        id: 37,
        template_id: 7,
        step_order: 2,
        name: "Bridge Terms Negotiation",
        description: "Negotiate bridge funding terms and conversion rights.",
        default_eta_days: 5,
        probability_percent: 35,
        auto_alert: true,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 2,
        estimated_days: 5,
      },
      {
        id: 38,
        template_id: 7,
        step_order: 3,
        name: "Quick Close",
        description: "Execute bridge funding documentation and close.",
        default_eta_days: 7,
        probability_percent: 25,
        auto_alert: false,
        email_reminder: true,
        created_at: "2024-01-15T09:00:00Z",
        is_required: true,
        assigned_role: "admin",
        order_position: 3,
        estimated_days: 7,
      },
    ],
  },
];

export const mockDeployments = [
  {
    id: 1,
    product_id: 1,
    version: "v2.1.0",
    environment: "production" as const,
    status: "completed" as const,
    description: "Major release with new features",
    assigned_to: 3,
    scheduled_date: "2024-07-18T10:00:00Z",
    started_at: "2024-07-18T10:00:00Z",
    completed_at: "2024-07-18T11:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Added new dashboard features and performance improvements",
    created_by: 3,
    created_at: "2024-07-15T09:00:00Z",
    updated_at: "2024-07-18T11:30:00Z",
    product_name: "Core App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 2,
    product_id: 2,
    version: "v1.5.2",
    environment: "production" as const,
    status: "failed" as const,
    description: "Analytics module update",
    assigned_to: 3,
    scheduled_date: "2024-07-17T14:00:00Z",
    started_at: "2024-07-17T14:00:00Z",
    completed_at: "2024-07-17T14:45:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "Bug fixes and minor improvements",
    created_by: 3,
    created_at: "2024-07-16T09:00:00Z",
    updated_at: "2024-07-17T14:45:00Z",
    product_name: "Analytics Module",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 3,
    product_id: 3,
    version: "v3.0.1",
    environment: "production" as const,
    status: "completed" as const,
    description: "API Gateway security patch",
    assigned_to: 3,
    scheduled_date: "2024-07-16T09:00:00Z",
    started_at: "2024-07-16T09:00:00Z",
    completed_at: "2024-07-16T09:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Security updates and bug fixes",
    created_by: 3,
    created_at: "2024-07-15T16:00:00Z",
    updated_at: "2024-07-16T09:30:00Z",
    product_name: "API Gateway",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 4,
    product_id: 4,
    version: "v1.2.3",
    environment: "staging" as const,
    status: "pending" as const,
    description: "Mobile app feature update",
    assigned_to: 3,
    scheduled_date: "2024-07-20T10:00:00Z",
    started_at: null,
    completed_at: null,
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "New user interface improvements",
    created_by: 3,
    created_at: "2024-07-15T10:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
    product_name: "Mobile App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
];

export const mockProducts = [
  {
    id: 1,
    name: "Core App",
    description: "Main application platform",
    current_version: "v2.0.9",
    repository_url: "https://github.com/company/core-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-18T11:30:00Z",
  },
  {
    id: 2,
    name: "Analytics Module",
    description: "Data analytics and reporting",
    current_version: "v1.5.1",
    repository_url: "https://github.com/company/analytics",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-17T14:45:00Z",
  },
  {
    id: 3,
    name: "API Gateway",
    description: "API management and routing",
    current_version: "v3.0.0",
    repository_url: "https://github.com/company/api-gateway",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-16T09:30:00Z",
  },
  {
    id: 4,
    name: "Mobile App",
    description: "Mobile application",
    current_version: "v1.2.2",
    repository_url: "https://github.com/company/mobile-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
  },
  {
    id: 5,
    name: "Reporting Service",
    description: "Report generation service",
    current_version: "v0.8.9",
    repository_url: "https://github.com/company/reporting",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-14T16:00:00Z",
  },
];

// Helper functions for mock data operations
export class MockDataService {
  private static users = [...mockUsers];
  private static clients = [...mockClients];
  private static templates = [...mockTemplates];
  private static deployments = [...mockDeployments];
  private static chatMessages: any[] = []; // In-memory storage for chat messages
  private static leadSteps: any[] = []; // In-memory storage for lead steps
  private static nextUserId = 6;
  private static nextClientId = 5;
  private static nextTemplateId = 4;
  private static nextDeploymentId = 5;
  private static nextChatId = 5; // Start after existing seed data (IDs 1-4) to prevent duplicates

  // User operations
  static async findUserByEmail(email: string) {
    return this.users.find((user) => user.email === email) || null;
  }

  static async verifyPassword(email: string, password: string) {
    console.log("MockDataService verifyPassword called:", {
      email,
      passwordLength: password?.length,
    });

    const user = await this.findUserByEmail(email);
    if (!user) {
      console.log("User not found in mock data for email:", email);
      return null;
    }

    console.log("Found user in mock data:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    console.log("Attempting password verification with bcrypt...");

    try {
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log("Password verification result:", isValid);
      console.log("Expected hash:", user.password_hash);
      console.log("Provided password:", password);

      if (!isValid) {
        // Try manual verification for demo purposes
        if (password === "password") {
          console.log("Manual demo password verification - allowing access");
          const { password_hash, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        console.log("Password verification failed");
        return null;
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error("Error during password verification:", error);
      // Fallback for demo purposes
      if (password === "password") {
        console.log("Bcrypt error, but using demo fallback");
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }
  }

  static async getAllUsers() {
    return this.users.map(({ password_hash, ...user }) => user);
  }

  static async createUser(userData: any) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const newUser = {
      id: this.nextUserId++,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone || null,
      password_hash: passwordHash,
      role: userData.role,
      department: userData.department || null,
      manager_id: userData.manager_id || null,
      status: "active" as const,
      start_date: userData.start_date || null,
      last_login: null,
      two_factor_enabled: userData.two_factor_enabled || false,
      notes: userData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.push(newUser);
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async updateUser(id: number, userData: any) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...userData,
      updated_at: new Date().toISOString(),
    };
    const { password_hash, ...userWithoutPassword } = this.users[index];
    return userWithoutPassword;
  }

  static async deleteUser(id: number) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }

  // Client operations
  static async getAllClients() {
    return this.clients;
  }

  static async createClient(clientData: any) {
    const newClient = {
      id: this.nextClientId++,
      ...clientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clients.push(newClient);
    return newClient;
  }

  static async updateClient(id: number, clientData: any) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return null;

    this.clients[index] = {
      ...this.clients[index],
      ...clientData,
      updated_at: new Date().toISOString(),
    };
    return this.clients[index];
  }

  static async deleteClient(id: number) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return false;

    this.clients.splice(index, 1);
    return true;
  }

  // Template operations
  static async getAllTemplates() {
    return this.templates;
  }

  static async createTemplate(templateData: any) {
    const newTemplate = {
      id: this.nextTemplateId++,
      ...templateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  // Deployment operations
  static async getAllDeployments() {
    return this.deployments;
  }

  static async createDeployment(deploymentData: any) {
    const product = mockProducts.find(
      (p) => p.id === deploymentData.product_id,
    );
    const newDeployment = {
      id: this.nextDeploymentId++,
      ...deploymentData,
      product_name: product?.name || "Unknown Product",
      assigned_to_name: "Mike Johnson",
      created_by_name: "Mike Johnson",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.deployments.push(newDeployment);
    return newDeployment;
  }

  // Products
  static async getAllProducts() {
    return mockProducts;
  }

  // Stats
  static async getClientStats() {
    return {
      total: this.clients.length,
      active: this.clients.filter((c) => c.status === "active").length,
      onboarding: this.clients.filter((c) => c.status === "onboarding").length,
      completed: this.clients.filter((c) => c.status === "completed").length,
    };
  }

  static async getDeploymentStats() {
    return {
      total: this.deployments.length,
      completed: this.deployments.filter((d) => d.status === "completed")
        .length,
      failed: this.deployments.filter((d) => d.status === "failed").length,
      pending: this.deployments.filter((d) => d.status === "pending").length,
    };
  }

  // Onboarding mock data
  static async getClientOnboardingSteps(clientId: number) {
    return [
      {
        id: 1,
        client_id: clientId,
        name: "Initial Contact",
        description:
          "Make first contact with client and gather basic requirements",
        status: "completed",
        step_order: 1,
        due_date: "2024-06-15",
        completed_date: "2024-06-15",
        estimated_days: 1,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-06-15T15:30:00Z",
      },
      {
        id: 2,
        client_id: clientId,
        name: "Proposal Sent",
        description: "Prepare and send detailed proposal to client",
        status: "completed",
        step_order: 2,
        due_date: "2024-06-20",
        completed_date: "2024-06-20",
        estimated_days: 3,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-06-20T10:15:00Z",
      },
      {
        id: 3,
        client_id: clientId,
        name: "Document Collection",
        description: "Collect all necessary documents from client",
        status: "in_progress",
        step_order: 3,
        due_date: "2024-07-15",
        completed_date: null,
        estimated_days: 5,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-07-01T09:00:00Z",
      },
      {
        id: 4,
        client_id: clientId,
        name: "Contract Signing",
        description: "Review and sign final contract",
        status: "pending",
        step_order: 4,
        due_date: "2024-07-25",
        completed_date: null,
        estimated_days: 2,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-06-10T09:00:00Z",
      },
      {
        id: 5,
        client_id: clientId,
        name: "Onboarding Call",
        description: "Schedule and conduct onboarding call",
        status: "pending",
        step_order: 5,
        due_date: "2024-08-01",
        completed_date: null,
        estimated_days: 1,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-06-10T09:00:00Z",
      },
      {
        id: 6,
        client_id: clientId,
        name: "Deployment",
        description: "Deploy and configure client systems",
        status: "pending",
        step_order: 6,
        due_date: "2024-08-10",
        completed_date: null,
        estimated_days: 7,
        created_at: "2024-06-10T09:00:00Z",
        updated_at: "2024-06-10T09:00:00Z",
      },
    ];
  }

  static async getStepDocuments(stepId: number) {
    const documents = [
      {
        id: 1,
        step_id: 1,
        name: "Initial_Requirements.pdf",
        file_path: "/uploads/initial_requirements.pdf",
        file_size: 2417664, // 2.3 MB
        file_type: "application/pdf",
        uploaded_by: "Jane Smith",
        uploaded_at: "2024-06-15T14:30:00Z",
      },
      {
        id: 2,
        step_id: 2,
        name: "Project_Proposal_v2.docx",
        file_path: "/uploads/project_proposal_v2.docx",
        file_size: 1887437, // 1.8 MB
        file_type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by: "John Doe",
        uploaded_at: "2024-06-20T10:15:00Z",
      },
      {
        id: 3,
        step_id: 3,
        name: "Tax_Documents.pdf",
        file_path: "/uploads/tax_documents.pdf",
        file_size: 5452595, // 5.2 MB
        file_type: "application/pdf",
        uploaded_by: "Client Portal",
        uploaded_at: "2024-07-01T15:22:00Z",
      },
    ];

    return documents.filter((doc) => doc.step_id === stepId);
  }

  static async getStepComments(stepId: number) {
    const comments = [
      {
        id: 1,
        step_id: 1,
        user_id: 2,
        user_name: "Jane Smith",
        message: "Client is very responsive. Initial requirements documented.",
        comment_type: "note",
        created_at: "2024-06-15T14:30:00Z",
      },
      {
        id: 2,
        step_id: 2,
        user_id: 1,
        user_name: "John Doe",
        message: "Proposal sent with detailed timeline and pricing structure.",
        comment_type: "update",
        created_at: "2024-06-20T10:15:00Z",
      },
      {
        id: 3,
        step_id: 3,
        user_id: 2,
        user_name: "Jane Smith",
        message:
          "Still waiting for incorporation documents. Following up today.",
        comment_type: "note",
        created_at: "2024-07-01T09:00:00Z",
      },
      {
        id: 4,
        step_id: 3,
        user_id: null,
        user_name: "System",
        message: "Document uploaded via client portal",
        comment_type: "system",
        created_at: "2024-07-01T15:22:00Z",
      },
    ];

    return comments.filter((comment) => comment.step_id === stepId);
  }

  // Lead mock data
  static async getAllLeads(salesRepId?: number) {
    const leads = [
      {
        id: 1,
        lead_id: "#001",
        lead_source: "email",
        lead_source_value: "sarah@techcorp.com",
        status: "in-progress",
        project_title: "E-commerce Platform Development",
        project_description:
          "Build a modern e-commerce platform with advanced features",
        project_requirements: "React, Node.js, PostgreSQL, Payment integration",
        client_name: "TechCorp Solutions",
        company: "TechCorp Solutions",
        category: "aggregator",
        client_type: "new",
        country: "usa",
        contacts: [
          {
            contact_name: "Sarah Johnson",
            email: "sarah@techcorp.com",
            phone: "+1 (555) 123-4567",
            designation: "CTO",
            linkedin: "https://linkedin.com/in/sarah-johnson",
          },
        ],
        priority: "high",
        expected_close_date: "2024-08-15",
        probability: 75,
        assigned_to: 2,
        created_by: 2,
        template_id: 1,
        notes: "Very interested client, follow up regularly",
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        sales_rep_name: "Jane Smith",
        creator_name: "Jane Smith",
      },
      {
        id: 2,
        lead_id: "#002",
        lead_source: "social-media",
        lead_source_value: "https://linkedin.com/company/healthfirst",
        status: "won",
        project_title: "Mobile App for Healthcare",
        project_description: "Patient management mobile application",
        project_requirements: "React Native, Firebase, HIPAA compliance",
        client_name: "HealthFirst Clinic",
        company: "HealthFirst Clinic",
        category: "banks",
        client_type: "existing",
        country: "usa",
        contacts: [
          {
            contact_name: "Dr. Michael Brown",
            email: "michael@healthfirst.com",
            phone: "+1 (555) 234-5678",
            designation: "Chief Medical Officer",
            linkedin: "https://linkedin.com/in/dr-michael-brown",
          },
        ],
        priority: "medium",
        expected_close_date: "2024-07-30",
        probability: 100,
        assigned_to: 2,
        created_by: 1,
        template_id: 2,
        notes: "Successfully closed deal, project starting next month",
        created_at: "2024-01-10T10:00:00Z",
        updated_at: "2024-02-01T16:45:00Z",
        sales_rep_name: "Jane Smith",
        creator_name: "John Doe",
      },
      {
        id: 3,
        lead_id: "#003",
        lead_source: "referral",
        lead_source_value: "Referred by TechCorp Solutions",
        status: "lost",
        project_title: "CRM System Integration",
        project_description: "Integrate existing CRM with third-party tools",
        project_requirements: "API integration, data migration, training",
        client_name: "Global Sales Inc",
        company: "Global Sales Inc",
        category: "aggregator",
        client_type: "new",
        country: "canada",
        contacts: [
          {
            contact_name: "Lisa Chen",
            email: "lisa@globalsales.com",
            phone: "+1 (555) 345-6789",
            designation: "VP Sales",
            linkedin: "https://linkedin.com/in/lisa-chen-vp",
          },
        ],
        priority: "low",
        expected_close_date: "2024-06-30",
        probability: 0,
        assigned_to: 2,
        created_by: 2,
        notes: "Lost to competitor due to pricing",
        created_at: "2024-01-05T11:00:00Z",
        updated_at: "2024-01-25T09:15:00Z",
        sales_rep_name: "Jane Smith",
        creator_name: "Jane Smith",
      },
      {
        id: 4,
        lead_id: "#004",
        lead_source: "website",
        lead_source_value: "https://datavizpro.com/contact",
        status: "completed",
        project_title: "Analytics Dashboard",
        project_description:
          "Real-time analytics dashboard for business intelligence",
        project_requirements: "React, D3.js, real-time data processing",
        client_name: "DataViz Pro",
        company: "DataViz Pro",
        category: "banks",
        client_type: "new",
        country: "singapore",
        contacts: [
          {
            contact_name: "Robert Taylor",
            email: "robert@datavizpro.com",
            phone: "+1 (555) 456-7890",
            designation: "CEO",
            linkedin: "https://linkedin.com/in/robert-taylor-ceo",
          },
        ],
        priority: "medium",
        expected_close_date: "2024-05-15",
        probability: 100,
        assigned_to: 2,
        created_by: 1,
        notes: "Project completed successfully, client very satisfied",
        created_at: "2023-12-20T08:00:00Z",
        updated_at: "2024-05-15T17:30:00Z",
        sales_rep_name: "Jane Smith",
        creator_name: "John Doe",
      },
      {
        id: 9,
        lead_id: "#2633",
        lead_source: "email",
        lead_source_value: "mohan.m@mylapay.com",
        status: "in-progress",
        project_title: "E-commerce Platform Development1",
        project_description: "sadasd",
        project_requirements: "asdsadasd",
        solutions: ["MylapaySecure", "FRM", "Switch-Cards"],
        priority_level: "medium",
        start_date: "2025-08-01",
        targeted_end_date: "2025-08-21",
        expected_daily_txn_volume: 2323,
        project_value: 234324.0,
        spoc: "asdasdasd",
        commercials: [],
        commercial_pricing: [
          {
            unit: "paisa",
            value: 1,
            currency: "INR",
            solution: "MylapaySecure",
          },
          { unit: "paisa", value: 2, currency: "INR", solution: "FRM" },
          {
            unit: "paisa",
            value: 2,
            currency: "INR",
            solution: "Switch-Cards",
          },
        ],
        client_name: "sdasdsad",
        client_type: "existing",
        company_location: "sdasd",
        category: "aggregator",
        country: "usa",
        contacts: [
          {
            email: "mohan.m@mylapay.com",
            phone: "+919629558605",
            linkedin: "sdfsdfsdf",
            designation: "sdsdfsdf",
            contact_name: "Mohan Morkel",
          },
        ],
        priority: "medium",
        expected_close_date: "",
        probability: 50,
        notes: "sdfsdfsdf",
        assigned_to: 38,
        created_by: 41,
        created_at: "2025-08-01T19:08:05.261Z",
        updated_at: "2025-08-01T19:08:05.261Z",
        sales_rep_name: "Team Member",
        creator_name: "Team Member",
      },
    ];

    return salesRepId
      ? leads.filter((lead) => lead.sales_rep_id === salesRepId)
      : leads;
  }

  static async getLeadById(id: number) {
    const leads = await this.getAllLeads();
    const lead = leads.find((lead) => lead.id === id) || null;

    // Use calculated probability if available (from step status changes)
    if (
      lead &&
      this.calculatedProbabilities &&
      this.calculatedProbabilities[id]
    ) {
      return {
        ...lead,
        probability: this.calculatedProbabilities[id],
      };
    }

    return lead;
  }

  static async updateLead(id: number, leadData: any) {
    // For mock data, just return the updated lead with new data
    const existingLead = await this.getLeadById(id);
    if (!existingLead) {
      return null;
    }

    const updatedLead = {
      ...existingLead,
      ...leadData,
      id: id,
      updated_at: new Date().toISOString(),
    };

    return updatedLead;
  }

  static async getLeadStats(salesRepId?: number) {
    const leads = await this.getAllLeads(salesRepId);
    return {
      total: leads.length,
      in_progress: leads.filter((l) => l.status === "in-progress").length,
      won: leads.filter((l) => l.status === "won").length,
      lost: leads.filter((l) => l.status === "lost").length,
      completed: leads.filter((l) => l.status === "completed").length,
    };
  }

  static async getLeadSteps(leadId: number) {
    const steps = [
      {
        id: 1,
        lead_id: leadId,
        name: "First Introduction Call",
        description: "Initial introduction call with prospect",
        status: "completed",
        step_order: 1,
        due_date: "2024-01-16",
        completed_date: "2024-01-16",
        estimated_days: 1,
        probability_percent: 10,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-16T10:30:00Z",
      },
      {
        id: 2,
        lead_id: leadId,
        name: "Product Demo",
        description: "Detailed product demonstration",
        status: "in-progress",
        step_order: 2,
        due_date: "2024-01-20",
        completed_date: null,
        estimated_days: 3,
        probability_percent: 90,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-20T15:45:00Z",
      },
      {
        id: 3,
        lead_id: leadId,
        name: "Proposal Preparation",
        description: "Prepare detailed proposal based on requirements",
        status: "in-progress",
        step_order: 3,
        due_date: "2024-01-25",
        completed_date: null,
        estimated_days: 4,
        probability_percent: 30,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-21T09:00:00Z",
      },
      {
        id: 4,
        lead_id: leadId,
        name: "Proposal Review & Negotiation",
        description: "Present proposal and handle negotiations",
        status: "pending",
        step_order: 4,
        due_date: "2024-02-01",
        completed_date: null,
        estimated_days: 5,
        probability_percent: 15,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 5,
        lead_id: leadId,
        name: "Contract Finalization",
        description: "Finalize contract terms and get signatures",
        status: "pending",
        step_order: 5,
        due_date: "2024-02-10",
        completed_date: null,
        estimated_days: 3,
        probability_percent: 10,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 6,
        lead_id: leadId,
        name: "Onboarding Preparation",
        description: "Prepare onboarding materials and timeline",
        status: "pending",
        step_order: 6,
        due_date: "2024-02-15",
        completed_date: null,
        estimated_days: 2,
        probability_percent: 0,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 7,
        lead_id: leadId,
        name: "Implementation Planning",
        description: "Plan technical implementation and project timeline",
        status: "pending",
        step_order: 7,
        due_date: "2024-02-20",
        completed_date: null,
        estimated_days: 5,
        probability_percent: 0,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 8,
        lead_id: leadId,
        name: "System Integration",
        description: "Integrate systems and perform testing",
        status: "pending",
        step_order: 8,
        due_date: "2024-03-01",
        completed_date: null,
        estimated_days: 7,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 9,
        lead_id: leadId,
        name: "Go-Live & Support",
        description: "Go live with the solution and provide initial support",
        status: "pending",
        step_order: 9,
        due_date: "2024-03-10",
        completed_date: null,
        estimated_days: 3,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
      {
        id: 10,
        lead_id: leadId,
        name: "Project Closure",
        description: "Complete project documentation and handover",
        status: "pending",
        step_order: 10,
        due_date: "2024-03-15",
        completed_date: null,
        estimated_days: 2,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
    ];

    // Apply any stored step updates
    return steps.map((step) => {
      if (this.updatedSteps[step.id]) {
        return {
          ...step,
          ...this.updatedSteps[step.id],
        };
      }
      return step;
    });
  }

  static async updateLeadStep(stepId: number, stepData: any) {
    console.log(
      `MockDataService.updateLeadStep: Updating step ${stepId} with:`,
      stepData,
    );

    // Get the lead_id from the original step to recalculate probability
    const originalSteps = await this.getLeadSteps(1); // Using lead 1 for demo
    const originalStep = originalSteps.find((s) => s.id === stepId);

    if (!originalStep) {
      console.log(`Step ${stepId} not found`);
      return null;
    }

    // Create updated step
    const updatedStep = {
      ...originalStep,
      ...stepData,
      updated_at: new Date().toISOString(),
    };

    // If status was updated, recalculate lead probability
    if (stepData.status && stepData.status !== originalStep.status) {
      console.log(
        `Step ${stepId} status changed from ${originalStep.status} to ${stepData.status}, recalculating lead probability`,
      );

      // Get all steps for the lead and calculate new probability
      const allSteps = await this.getLeadSteps(originalStep.lead_id);

      let totalStepProbability = 0;
      let totalCompletedProbability = 0;

      allSteps.forEach((step) => {
        // Use updated status for the changed step
        const currentStatus =
          step.id === stepId ? stepData.status : step.status;
        const stepProbability = step.probability_percent || 0;

        totalStepProbability += stepProbability;

        if (currentStatus === "completed") {
          totalCompletedProbability += stepProbability;
        }
        // Only completed steps contribute to progress
      });

      const newProbability = Math.min(
        100,
        Math.round(totalCompletedProbability),
      );

      console.log(
        `Updated lead ${originalStep.lead_id} probability to ${newProbability}%`,
      );
      console.log(
        `Calculation: Completed steps total = ${totalCompletedProbability}% (capped at 100%)`,
      );

      // Store the calculated probability for subsequent lead queries
      if (!this.calculatedProbabilities) {
        this.calculatedProbabilities = {};
      }
      this.calculatedProbabilities[originalStep.lead_id] = newProbability;
    }

    // Store the updated step for future getLeadSteps calls
    this.updatedSteps[stepId] = updatedStep;

    console.log(`MockDataService.updateLeadStep: Updated step:`, updatedStep);
    return updatedStep;
  }

  // Add properties to store calculated probabilities and updated steps
  private static calculatedProbabilities: { [leadId: number]: number } = {};
  private static updatedSteps: { [stepId: number]: any } = {};

  static async getStepChats(stepId: number) {
    // Initialize with some default chats if none exist
    if (this.chatMessages.length === 0) {
      this.chatMessages = [
        {
          id: 1,
          step_id: 1,
          user_id: 2,
          user_name: "Jane Smith",
          message:
            "Had a great initial call with the client. They're very interested in our e-commerce solution.",
          message_type: "text",
          is_rich_text: false,
          created_at: "2024-01-16T10:30:00Z",
          attachments: [],
        },
        {
          id: 2,
          step_id: 1,
          user_id: 2,
          user_name: "Jane Smith",
          message: "Client requirements documented and shared with the team.",
          message_type: "file",
          is_rich_text: false,
          created_at: "2024-01-16T14:15:00Z",
          attachments: [
            {
              id: 1,
              file_name: "client_requirements.txt",
              file_path: "/uploads/client_requirements.txt",
              file_size: 2048,
              file_type: "text/plain",
              uploaded_at: "2024-01-16T14:15:00Z",
            },
          ],
        },
        {
          id: 3,
          step_id: 2,
          user_id: 1,
          user_name: "John Doe",
          message:
            "<p><strong>Demo went excellent!</strong> Client was particularly impressed with:</p><ul><li>Real-time inventory management</li><li>Advanced reporting features</li><li>Mobile-responsive design</li></ul><p><em>Next steps: Prepare detailed proposal</em></p>",
          message_type: "text",
          is_rich_text: true,
          created_at: "2024-01-20T15:45:00Z",
          attachments: [],
        },
        {
          id: 4,
          step_id: 3,
          user_id: 2,
          user_name: "Jane Smith",
          message:
            "Working on the proposal. Need technical specifications from the development team.",
          message_type: "text",
          is_rich_text: false,
          created_at: "2024-01-21T09:00:00Z",
          attachments: [],
        },
      ];
    }

    // Ensure nextChatId is higher than any existing message ID to prevent duplicates
    const maxExistingId = Math.max(
      ...this.chatMessages.map((chat) => chat.id),
      0,
    );
    if (this.nextChatId <= maxExistingId) {
      this.nextChatId = maxExistingId + 1;
      console.log(
        `MockDataService: Updated nextChatId to ${this.nextChatId} to prevent duplicates`,
      );
    }

    const filteredChats = this.chatMessages.filter(
      (chat) => chat.step_id === stepId,
    );

    console.log(
      `MockDataService.getStepChats: returning ${filteredChats.length} messages for step ${stepId}`,
    );

    return filteredChats;
  }

  static addLeadStep(step: any) {
    console.log(
      `MockDataService.addLeadStep: Adding step ${step.id} to storage`,
    );
    this.leadSteps.push(step);
    console.log(
      `MockDataService.addLeadStep: Total steps now: ${this.leadSteps.length}`,
    );
  }

  static getStoredLeadSteps() {
    return this.leadSteps;
  }

  static async deleteLeadStep(stepId: number) {
    console.log(`MockDataService.deleteLeadStep: Deleting step ${stepId}`);

    // Remove from leadSteps if it exists
    const stepIndex = this.leadSteps.findIndex((step) => step.id === stepId);
    if (stepIndex !== -1) {
      const deletedStep = this.leadSteps.splice(stepIndex, 1)[0];
      console.log(
        `MockDataService.deleteLeadStep: Removed step from leadSteps:`,
        deletedStep,
      );
    }

    // Remove all associated chat messages
    const initialChatCount = this.chatMessages.length;
    this.chatMessages = this.chatMessages.filter(
      (chat) => chat.step_id !== stepId,
    );
    const removedChatCount = initialChatCount - this.chatMessages.length;

    if (removedChatCount > 0) {
      console.log(
        `MockDataService.deleteLeadStep: Removed ${removedChatCount} chat messages for step ${stepId}`,
      );
    }

    console.log(
      `MockDataService.deleteLeadStep: Step ${stepId} deletion complete`,
    );
    return true;
  }

  static async createStepChat(stepId: number, chatData: any) {
    // For mock data, we'll accept any step_id and create the chat
    // This allows follow-ups with any step_id to work when database is unavailable
    console.log(
      `MockDataService.createStepChat: Creating chat for step ${stepId} (mock mode - accepting any step_id)`,
    );

    const newChat = {
      id: this.nextChatId++,
      step_id: stepId,
      user_id: chatData.user_id || null,
      user_name: chatData.user_name,
      message: chatData.message,
      message_type: chatData.message_type || "text",
      is_rich_text: chatData.is_rich_text || false,
      created_at: new Date().toISOString(),
      attachments: chatData.attachments || [],
    };

    this.chatMessages.push(newChat);
    console.log(
      `MockDataService.createStepChat: Created message ${newChat.id} for step ${stepId}`,
    );
    console.log(
      `MockDataService.createStepChat: Total messages now: ${this.chatMessages.length}`,
    );
    return newChat;
  }

  // VC mock data
  static async getAllVCs(createdBy?: number) {
    const vcs = [
      {
        id: 1,
        vc_id: "#VC001",
        lead_source: "referral",
        lead_source_value: "John Investor",
        lead_created_by: "admin@banani.com",
        status: "in-progress",
        round_title: "Series A Funding",
        round_description:
          "Raising Series A for product expansion and market growth",
        round_stage: "series_a",
        round_size: "$10M",
        valuation: "$50M",
        investor_category: "vc",
        investor_name: "Sequoia Capital",
        contact_person: "John Partner",
        email: "john@sequoia.com",
        phone: "+1 (555) 100-1001",
        address: "2800 Sand Hill Road",
        city: "Menlo Park",
        state: "CA",
        country: "United States",
        website: "https://sequoiacap.com",
        potential_lead_investor: true,
        minimum_size: 5000000,
        maximum_size: 15000000,
        minimum_arr_requirement: 10000000,
        priority_level: "high",
        start_date: "2024-01-15",
        targeted_end_date: "2024-06-15",
        company_size: "large",
        industry: "technology",
        spoc: "Jane Doe",
        billing_currency: "USD",
        notes: "Strong interest in our AI-powered solutions",
        contacts: [
          {
            contact_name: "John Partner",
            email: "john@sequoia.com",
            phone: "+1 (555) 100-1001",
            designation: "Partner",
            linkedin: "https://linkedin.com/in/johnpartner",
          },
        ],
        probability: 75,
        assigned_to: 2,
        created_by: 1,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        is_partial: false,
      },
      {
        id: 2,
        vc_id: "#VC002",
        lead_source: "email",
        lead_source_value: "sarah@accel.com",
        lead_created_by: "sales@banani.com",
        status: "in-progress",
        round_title: "Seed Round",
        round_description: "Initial seed funding to launch MVP and build team",
        round_stage: "seed",
        round_size: "15Cr",
        valuation: "90Cr",
        investor_category: "vc",
        investor_name: "Sequoia India",
        contact_person: "Arjun Investor",
        email: "arjun@sequoiacap.com",
        phone: "+91 9876543210",
        address: "UB City Mall",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        website: "https://sequoiacap.com",
        potential_lead_investor: false,
        minimum_size: 75000000,
        maximum_size: 375000000,
        minimum_arr_requirement: 150000000,
        priority_level: "medium",
        start_date: "2024-02-01",
        targeted_end_date: "2024-05-01",
        company_size: "medium",
        industry: "fintech",
        spoc: "Mike Johnson",
        billing_currency: "INR",
        notes: "Interested in fintech solutions, awaiting technical demo",
        contacts: [
          {
            contact_name: "Arjun Investor",
            email: "arjun@sequoiacap.com",
            phone: "+91 9876543210",
            designation: "Principal",
            linkedin: "https://linkedin.com/in/arjuninvestor",
          },
        ],
        probability: 60,
        assigned_to: 2,
        created_by: 2,
        created_at: "2024-02-01T10:30:00Z",
        updated_at: "2024-02-10T16:45:00Z",
        is_partial: false,
      },
      {
        id: 3,
        vc_id: "#VC003",
        lead_source: "website",
        lead_source_value: "https://kleinerperkins.com",
        lead_created_by: "product@banani.com",
        status: "won",
        round_title: "Bridge Funding",
        round_description: "Bridge round to extend runway before Series A",
        round_stage: "bridge",
        round_size: "11M",
        valuation: "92M",
        investor_category: "vc",
        investor_name: "MEVP",
        contact_person: "Ahmed Investor",
        email: "ahmed@mevp.com",
        phone: "+971 50 123 4567",
        address: "Dubai International Financial Centre",
        city: "Dubai",
        state: "Dubai",
        country: "UAE",
        website: "https://mevp.com",
        potential_lead_investor: true,
        minimum_size: 7350000,
        maximum_size: 18375000,
        minimum_arr_requirement: 18375000,
        priority_level: "high",
        start_date: "2023-10-01",
        targeted_end_date: "2024-01-01",
        company_size: "large",
        industry: "healthcare",
        spoc: "Jane Doe",
        billing_currency: "AED",
        notes: "Successfully closed! Great partnership for healthcare tech",
        contacts: [
          {
            contact_name: "Ahmed Investor",
            email: "ahmed@mevp.com",
            phone: "+971 50 123 4567",
            designation: "General Partner",
            linkedin: "https://linkedin.com/in/ahmedinvestor",
          },
        ],
        probability: 100,
        assigned_to: 1,
        created_by: 3,
        created_at: "2023-10-01T08:00:00Z",
        updated_at: "2024-01-05T12:00:00Z",
        is_partial: false,
      },
      {
        id: 4,
        vc_id: "#VC004",
        lead_source: "cold-call",
        lead_source_value: "+1 (555) 400-4004",
        lead_created_by: "sales@banani.com",
        status: "lost",
        round_title: "Series B Growth",
        round_description: "Series B for international expansion",
        round_stage: "series_b",
        round_size: "$25M",
        valuation: "$150M",
        investor_category: "private_equity",
        investor_name: "Goldman Sachs",
        contact_person: "Robert Finance",
        email: "robert@gs.com",
        phone: "+1 (555) 400-4004",
        address: "200 West Street",
        city: "New York",
        state: "NY",
        country: "United States",
        website: "https://goldmansachs.com",
        potential_lead_investor: true,
        minimum_size: 20000000,
        maximum_size: 50000000,
        minimum_arr_requirement: 50000000,
        priority_level: "medium",
        start_date: "2024-01-01",
        targeted_end_date: "2024-04-01",
        company_size: "enterprise",
        industry: "enterprise",
        spoc: "Jane Doe",
        billing_currency: "USD",
        notes: "Did not proceed due to valuation mismatch",
        contacts: [
          {
            contact_name: "Robert Finance",
            email: "robert@gs.com",
            phone: "+1 (555) 400-4004",
            designation: "Managing Director",
            linkedin: "https://linkedin.com/in/robertfinance",
          },
        ],
        probability: 0,
        assigned_to: 2,
        created_by: 2,
        created_at: "2024-01-01T09:15:00Z",
        updated_at: "2024-04-05T11:30:00Z",
        is_partial: false,
      },
      {
        id: 5,
        vc_id: "#VC005",
        lead_source: "event",
        lead_source_value: "TechCrunch Disrupt 2024",
        lead_created_by: "admin@banani.com",
        status: "in-progress",
        round_title: "Pre-Seed Funding",
        round_description: "Early stage funding to validate product-market fit",
        round_stage: "pre_seed",
        round_size: "$500K",
        valuation: "$5M",
        investor_category: "angel",
        investor_name: "Angel Collective",
        contact_person: "Emma Angel",
        email: "emma@angelcollective.com",
        phone: "+1 (555) 500-5005",
        address: "1 Hacker Way",
        city: "San Francisco",
        state: "CA",
        country: "United States",
        website: "https://angelcollective.com",
        potential_lead_investor: false,
        minimum_size: 250000,
        maximum_size: 1000000,
        minimum_arr_requirement: 500000,
        priority_level: "low",
        start_date: "2024-03-01",
        targeted_end_date: "2024-06-01",
        company_size: "startup",
        industry: "technology",
        spoc: "Mike Johnson",
        billing_currency: "USD",
        notes: "Early stage discussion, good chemistry with founder",
        contacts: [
          {
            contact_name: "Emma Angel",
            email: "emma@angelcollective.com",
            phone: "+1 (555) 500-5005",
            designation: "Lead Angel",
            linkedin: "https://linkedin.com/in/emmaangel",
          },
        ],
        probability: 45,
        assigned_to: 3,
        created_by: 1,
        template_id: 5, // Seed Round Management template
        created_at: "2024-03-01T11:00:00Z",
        updated_at: "2024-03-15T13:20:00Z",
        is_partial: false,
      },
    ];

    // Filter by created_by if provided
    if (createdBy) {
      return vcs.filter((vc) => vc.created_by === createdBy);
    }

    return vcs;
  }

  static async getVCById(id: number) {
    const vcs = await this.getAllVCs();
    return vcs.find((vc) => vc.id === id) || null;
  }

  static async getVCStats(createdBy?: number) {
    const vcs = await this.getAllVCs(createdBy);
    return {
      total: vcs.length,
      in_progress: vcs.filter((vc) => vc.status === "in-progress").length,
      won: vcs.filter((vc) => vc.status === "won").length,
      lost: vcs.filter((vc) => vc.status === "lost").length,
      completed: vcs.filter((vc) => vc.status === "completed").length,
    };
  }

  static async getVCSteps(vcId: number) {
    // Get VC to check if it has a template
    const vc = await this.getVCById(vcId);

    // VC-specific template steps for Seed Round Management (template_id: 5)
    if (vc?.template_id === 5) {
      return [
        {
          id: 1,
          vc_id: vcId,
          name: "Business Plan Validation",
          description:
            "Review and validate the comprehensive business plan and financial projections",
          status: "completed",
          order_index: 1,
          due_date: "2024-03-05",
          completed_date: "2024-03-05",
          estimated_days: 3,
          priority: "high",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-05T15:30:00Z",
        },
        {
          id: 2,
          vc_id: vcId,
          name: "Angel Investor Outreach",
          description:
            "Initial outreach to angel investors and presentation of opportunity",
          status: "in_progress",
          order_index: 2,
          due_date: "2024-03-20",
          estimated_days: 5,
          priority: "high",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-10T10:15:00Z",
        },
        {
          id: 3,
          vc_id: vcId,
          name: "Pitch Presentation",
          description:
            "Formal pitch presentation to interested angel investors",
          status: "pending",
          order_index: 3,
          due_date: "2024-03-25",
          estimated_days: 2,
          priority: "medium",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-01T11:00:00Z",
        },
        {
          id: 4,
          vc_id: vcId,
          name: "Due Diligence Review",
          description:
            "Comprehensive due diligence review of company financials and operations",
          status: "pending",
          order_index: 4,
          estimated_days: 7,
          priority: "medium",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-01T11:00:00Z",
        },
        {
          id: 5,
          vc_id: vcId,
          name: "Term Sheet Negotiation",
          description:
            "Negotiate and finalize term sheet with lead angel investor",
          status: "pending",
          order_index: 5,
          estimated_days: 4,
          priority: "high",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-01T11:00:00Z",
        },
        {
          id: 6,
          vc_id: vcId,
          name: "Legal Documentation",
          description: "Complete legal documentation and investment agreements",
          status: "pending",
          order_index: 6,
          estimated_days: 10,
          priority: "medium",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-01T11:00:00Z",
        },
        {
          id: 7,
          vc_id: vcId,
          name: "Funding Closure",
          description:
            "Finalize funding round and transfer of investment capital",
          status: "pending",
          order_index: 7,
          estimated_days: 2,
          priority: "high",
          created_by: 1,
          created_at: "2024-03-01T11:00:00Z",
          updated_at: "2024-03-01T11:00:00Z",
        },
      ];
    }

    // Default generic VC steps for VCs without templates
    return [
      {
        id: 1,
        vc_id: vcId,
        name: "Initial Contact",
        description: "First introduction and initial discussion",
        status: "completed",
        order_index: 1,
        due_date: "2024-01-16",
        completed_date: "2024-01-16",
        estimated_days: 1,
        priority: "medium",
        created_by: 1,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-16T14:30:00Z",
      },
      {
        id: 2,
        vc_id: vcId,
        name: "Investment Presentation",
        description: "Present investment opportunity and business case",
        status: "in_progress",
        order_index: 2,
        due_date: "2024-01-20",
        estimated_days: 3,
        priority: "high",
        created_by: 1,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-18T11:20:00Z",
      },
    ];
  }
}
