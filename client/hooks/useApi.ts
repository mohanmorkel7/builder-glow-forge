import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// Enhanced mock data for development without database
const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "admin@banani.com",
    role: "admin",
    status: "active",
    created_at: "2023-01-10T09:00:00Z",
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "sales@banani.com",
    role: "sales",
    status: "active",
    created_at: "2023-02-15T09:00:00Z",
  },
  {
    id: 3,
    first_name: "Mike",
    last_name: "Johnson",
    email: "product@banani.com",
    role: "product",
    status: "active",
    created_at: "2023-03-20T09:00:00Z",
  },
];

const mockClients = [
  {
    id: 1,
    client_name: "Acme Corp",
    contact_person: "Jane Doe",
    email: "jane@acme.com",
    status: "active",
    priority: "high",
    created_at: "2023-10-26T09:00:00Z",
  },
  {
    id: 2,
    client_name: "Globex Inc.",
    contact_person: "Bob Wilson",
    email: "bob@globex.com",
    status: "onboarding",
    priority: "medium",
    created_at: "2023-10-20T09:00:00Z",
  },
  {
    id: 3,
    client_name: "TechStart Solutions",
    contact_person: "Alice Johnson",
    email: "alice@techstart.com",
    status: "active",
    priority: "high",
    created_at: "2023-11-01T09:00:00Z",
  },
];

const mockTemplates = [
  {
    id: 1,
    name: "Standard Client Onboarding",
    description: "A comprehensive template for standard client onboarding",
    type: "standard",
    step_count: 5,
    is_active: true,
    created_at: "2023-01-15T09:00:00Z",
    steps: [
      {
        id: 1,
        name: "Initial Contact",
        description: "First contact with client",
        step_order: 1,
        probability_percent: 10,
      },
      {
        id: 2,
        name: "Requirement Analysis",
        description: "Analyze client requirements",
        step_order: 2,
        probability_percent: 25,
      },
      {
        id: 3,
        name: "Proposal Submission",
        description: "Submit project proposal",
        step_order: 3,
        probability_percent: 40,
      },
      {
        id: 4,
        name: "Contract Negotiation",
        description: "Negotiate contract terms",
        step_order: 4,
        probability_percent: 70,
      },
      {
        id: 5,
        name: "Project Kickoff",
        description: "Start project execution",
        step_order: 5,
        probability_percent: 100,
      },
    ],
  },
  {
    id: 2,
    name: "Enterprise Client Onboarding",
    description: "Tailored onboarding process for large enterprise clients",
    type: "enterprise",
    step_count: 8,
    is_active: true,
    created_at: "2023-01-15T09:00:00Z",
    steps: [
      {
        id: 6,
        name: "Discovery Call",
        description: "Initial discovery and assessment",
        step_order: 1,
        probability_percent: 5,
      },
      {
        id: 7,
        name: "Technical Review",
        description: "Technical requirements review",
        step_order: 2,
        probability_percent: 15,
      },
      {
        id: 8,
        name: "Security Assessment",
        description: "Security and compliance check",
        step_order: 3,
        probability_percent: 30,
      },
      {
        id: 9,
        name: "Stakeholder Meeting",
        description: "Meet with key stakeholders",
        step_order: 4,
        probability_percent: 45,
      },
      {
        id: 10,
        name: "Pilot Program",
        description: "Run pilot program",
        step_order: 5,
        probability_percent: 60,
      },
      {
        id: 11,
        name: "Implementation Plan",
        description: "Create implementation roadmap",
        step_order: 6,
        probability_percent: 75,
      },
      {
        id: 12,
        name: "Contract Finalization",
        description: "Finalize enterprise contract",
        step_order: 7,
        probability_percent: 90,
      },
      {
        id: 13,
        name: "Go Live",
        description: "Launch full implementation",
        step_order: 8,
        probability_percent: 100,
      },
    ],
  },
  {
    id: 3,
    name: "Partner Integration Template",
    description: "Template for partner integration and setup",
    type: "partner",
    step_count: 6,
    is_active: false,
    created_at: "2023-02-01T09:00:00Z",
    steps: [
      {
        id: 14,
        name: "Partner Qualification",
        description: "Qualify potential partner",
        step_order: 1,
        probability_percent: 15,
      },
      {
        id: 15,
        name: "Integration Planning",
        description: "Plan integration approach",
        step_order: 2,
        probability_percent: 30,
      },
      {
        id: 16,
        name: "Technical Integration",
        description: "Technical integration setup",
        step_order: 3,
        probability_percent: 50,
      },
      {
        id: 17,
        name: "Testing & Validation",
        description: "Test integration",
        step_order: 4,
        probability_percent: 70,
      },
      {
        id: 18,
        name: "Partnership Agreement",
        description: "Sign partnership agreement",
        step_order: 5,
        probability_percent: 85,
      },
      {
        id: 19,
        name: "Go Live",
        description: "Launch partnership",
        step_order: 6,
        probability_percent: 100,
      },
    ],
  },
];

const mockDeployments = [
  {
    id: 1,
    product_name: "Core App",
    version: "v2.1.0",
    environment: "production",
    status: "completed",
    assigned_to_name: "Mike Johnson",
    created_at: "2024-07-15T09:00:00Z",
  },
  {
    id: 2,
    product_name: "Analytics Module",
    version: "v1.5.2",
    environment: "production",
    status: "failed",
    assigned_to_name: "Mike Johnson",
    created_at: "2024-07-16T09:00:00Z",
  },
  {
    id: 3,
    product_name: "Payment Gateway",
    version: "v3.0.1",
    environment: "staging",
    status: "in_progress",
    assigned_to_name: "Jane Smith",
    created_at: "2024-07-17T09:00:00Z",
  },
];

const mockLeads = [
  {
    id: 1,
    lead_id: "#001",
    client_name: "Acme Corporation",
    company: "Acme Corp",
    lead_source: "email",
    lead_source_value: "contact@acme.com",
    status: "in-progress",
    project_title: "E-commerce Platform",
    project_description: "Building a new e-commerce platform",
    priority: "high",
    assigned_to: 1,
    template_id: 1,
    created_at: "2023-10-26T09:00:00Z",
    updated_at: "2023-10-26T09:00:00Z",
    solutions: ["CardToken", "Switch-Cards"],
    contacts: [
      {
        contact_name: "John Smith",
        designation: "CTO",
        email: "john@acme.com",
        phone: "+1-555-0123",
        linkedin: "https://linkedin.com/in/johnsmith",
      },
    ],
    commercial_pricing: [
      {
        solution: "CardToken",
        value: 10,
        unit: "paisa",
        currency: "INR",
      },
      {
        solution: "Switch-Cards",
        value: 0.12,
        unit: "cents",
        currency: "USD",
      },
      {
        solution: "FRM",
        value: 0.44,
        unit: "fils",
        currency: "AED",
      },
    ],
  },
  {
    id: 2,
    lead_id: "#002",
    client_name: "TechStart Inc",
    company: "TechStart Inc",
    lead_source: "website",
    lead_source_value: "https://techstart.com",
    status: "won",
    project_title: "Payment Gateway Integration",
    project_description: "Integrate payment gateway for mobile app",
    priority: "medium",
    assigned_to: 2,
    template_id: 2,
    created_at: "2023-10-25T09:00:00Z",
    updated_at: "2023-10-25T09:00:00Z",
    solutions: ["Switch-UPI", "FRM"],
    contacts: [
      {
        contact_name: "Sarah Wilson",
        designation: "Product Manager",
        email: "sarah@techstart.com",
        phone: "+1-555-0456",
        linkedin: "",
      },
    ],
    commercial_pricing: [],
  },
  {
    id: 8,
    lead_id: "#008",
    client_name: "Razorpay Technologies",
    company: "Razorpay",
    lead_source: "email",
    lead_source_value: "salesteam@razorpay.com",
    status: "in-progress",
    project_title: "Test1",
    project_description: "testing",
    project_requirements: "test",
    solutions: ["CardToken", "MylapaySecure", "FRM"],
    priority_level: "medium",
    start_date: "2025-07-31",
    targeted_end_date: "2025-08-28",
    expected_daily_txn_volume: 124,
    project_value: 34324,
    spoc: "Sales Team",
    template_id: 1,
    commercial_pricing: [
      { unit: "paisa", value: 0.5, currency: "INR", solution: "CardToken" },
      { unit: "paisa", value: 0.7, currency: "INR", solution: "MylapaySecure" },
      { unit: "paisa", value: 1, currency: "INR", solution: "FRM" },
    ],
    contacts: [
      {
        contact_name: "Mohan Morkel",
        designation: "Director",
        email: "mohan.m@mylapay.com",
        phone: "+919629558605",
        linkedin: "https://linkedin.com/12345",
      },
    ],
    client_type: "existing",
    company_location: "Chennai, Tamilnadu",
    category: "partner",
    country: "india",
    priority: "medium",
    expected_close_date: "",
    probability: 100,
    notes: "test",
    assigned_to: 2,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
  },
];

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
  });
}

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await apiClient.getUsers();
      } catch (error) {
        console.log("API unavailable, using mock users data");
        return mockUsers;
      }
    },
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying user fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error("User fetch failed:", error);
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: any) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) =>
      apiClient.updateUser(id, userData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Client hooks
export function useClients(salesRepId?: number) {
  return useQuery({
    queryKey: ["clients", salesRepId],
    queryFn: async () => {
      try {
        return await apiClient.getClients(salesRepId);
      } catch (error) {
        console.log("API unavailable, using mock clients data");
        return mockClients;
      }
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => apiClient.getClient(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying client fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error("Client fetch failed:", error);
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientData: any) => apiClient.createClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clientData }: { id: number; clientData: any }) =>
      apiClient.updateClient(id, clientData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      try {
        return await apiClient.getClientStats();
      } catch (error) {
        console.log("API unavailable, using mock client stats");
        return { total: 3, active: 2, onboarding: 1, completed: 0 };
      }
    },
  });
}

// Template hooks
export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      try {
        return await apiClient.getTemplates();
      } catch (error) {
        console.log("API unavailable, using mock templates data");
        return mockTemplates;
      }
    },
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      // Return null early if id is 0 to avoid unnecessary API calls
      if (!id) {
        return null;
      }
      try {
        return await apiClient.request(`/templates-production/${id}`);
      } catch (error) {
        console.log(`API unavailable for template ${id}, using mock data`);
        return mockTemplates.find((template) => template.id === id) || null;
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying template fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error("Template fetch failed:", error);
      // Don't throw the error, let the component handle it gracefully
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateData: any) => {
      try {
        return await apiClient.createTemplate(templateData);
      } catch (error) {
        console.log(
          "API unavailable for creating template, simulating creation",
        );
        return {
          id: Date.now(),
          ...templateData,
          created_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      templateData,
    }: {
      id: number;
      templateData: any;
    }) => {
      try {
        return await apiClient.updateTemplate(id, templateData);
      } catch (error) {
        console.log(
          `API unavailable for updating template ${id}, simulating update`,
        );
        return {
          ...templateData,
          id,
          updated_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates", id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, createdBy }: { id: number; createdBy: number }) =>
      apiClient.duplicateTemplate(id, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// Deployment hooks
export function useDeployments(assigneeId?: number) {
  return useQuery({
    queryKey: ["deployments", assigneeId],
    queryFn: async () => {
      try {
        return await apiClient.getDeployments(assigneeId);
      } catch (error) {
        console.log("API unavailable, using mock deployments data");
        return mockDeployments;
      }
    },
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: ["deployments", id],
    queryFn: () => apiClient.getDeployment(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying deployment fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error("Deployment fetch failed:", error);
    },
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deploymentData: any) =>
      apiClient.createDeployment(deploymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useUpdateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deploymentData }: { id: number; deploymentData: any }) =>
      apiClient.updateDeployment(id, deploymentData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployments", id] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useUpdateDeploymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.updateDeploymentStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployments", id] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteDeployment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useDeploymentStats() {
  return useQuery({
    queryKey: ["deployment-stats"],
    queryFn: async () => {
      try {
        return await apiClient.getDeploymentStats();
      } catch (error) {
        console.log("API unavailable, using mock deployment stats");
        return {
          total: 3,
          completed: 1,
          failed: 1,
          pending: 1,
          in_progress: 1,
        };
      }
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.getProducts(),
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying products fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error("Products fetch failed:", error);
    },
  });
}

// Onboarding hooks
export function useClientOnboardingSteps(clientId: number) {
  return useQuery({
    queryKey: ["onboarding-steps", clientId],
    queryFn: () => apiClient.getClientOnboardingSteps(clientId),
    enabled: !!clientId,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(
          `Retrying onboarding steps fetch (attempt ${failureCount + 1})`,
        );
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error("Onboarding steps fetch failed:", error);
    },
  });
}

export function useCreateOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, stepData }: { clientId: number; stepData: any }) =>
      apiClient.createOnboardingStep(clientId, stepData),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-steps", clientId],
      });
    },
  });
}

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, stepData }: { stepId: number; stepData: any }) =>
      apiClient.updateOnboardingStep(stepId, stepData),
    onSuccess: (data: any) => {
      if (data && data.client_id) {
        queryClient.invalidateQueries({
          queryKey: ["onboarding-steps", data.client_id],
        });
      }
      // Also invalidate the general query
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
    },
  });
}

export function useDeleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) => apiClient.deleteOnboardingStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
    },
  });
}

export function useReorderOnboardingSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      stepOrders,
    }: {
      clientId: number;
      stepOrders: { id: number; order: number }[];
    }) => apiClient.reorderOnboardingSteps(clientId, stepOrders),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-steps", clientId],
      });
    },
  });
}

export function useStepDocuments(stepId: number) {
  return useQuery({
    queryKey: ["step-documents", stepId],
    queryFn: () => apiClient.getStepDocuments(stepId),
    enabled: !!stepId && stepId > 0,
  });
}

export function useUploadStepDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      documentData,
    }: {
      stepId: number;
      documentData: any;
    }) => apiClient.uploadStepDocument(stepId, documentData),
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ["step-documents", stepId] });
    },
  });
}

export function useDeleteStepDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) =>
      apiClient.deleteStepDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-documents"] });
    },
  });
}

export function useStepComments(stepId: number) {
  return useQuery({
    queryKey: ["step-comments", stepId],
    queryFn: () => apiClient.getStepComments(stepId),
    enabled: !!stepId && stepId > 0,
  });
}

export function useCreateStepComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      commentData,
    }: {
      stepId: number;
      commentData: any;
    }) => apiClient.createStepComment(stepId, commentData),
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ["step-comments", stepId] });
    },
  });
}

export function useDeleteStepComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => apiClient.deleteStepComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-comments"] });
    },
  });
}

// Lead hooks
export function useLeads(salesRepId?: number) {
  return useQuery({
    queryKey: ["leads", salesRepId],
    queryFn: async () => {
      try {
        return await apiClient.getLeads(salesRepId);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        // Return empty array when backend is down
        if (
          error.message.includes("timeout") ||
          error.message.includes("unavailable") ||
          error.message.includes("Offline mode")
        ) {
          return [];
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if it's a timeout, offline, or server unavailable error
      if (
        error.message.includes("timeout") ||
        error.message.includes("unavailable") ||
        error.message.includes("Offline mode")
      ) {
        console.log("Not retrying due to offline/timeout condition");
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
  });
}

export function usePartialLeads(salesRepId?: number) {
  return useQuery({
    queryKey: ["partial-leads", salesRepId],
    queryFn: async () => {
      return await apiClient.getPartialLeads(salesRepId);
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useMyPartialSaves(userId?: number) {
  return useQuery({
    queryKey: ["my-partial-saves", userId],
    queryFn: async () => {
      return await apiClient.getMyPartialSaves(userId);
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useMyVCPartialSaves(userId?: number) {
  return useQuery({
    queryKey: ["my-vc-partial-saves", userId],
    queryFn: async () => {
      return await apiClient.getMyVCPartialSaves(userId);
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => {
      return await apiClient.getLead(id);
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying lead fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error("Lead fetch failed:", error);
      // Don't throw the error, let the component handle it gracefully
    },
  });
}

export function usePartialSaveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadData: any) => {
      const partialData = { ...leadData, is_partial: true };
      return await apiClient.createLead(partialData);
    },
    onSuccess: () => {
      // Invalidate all lead-related queries
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["partial-leads"] });
      queryClient.invalidateQueries({ queryKey: ["my-partial-saves"] });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadData: any) => {
      try {
        return await apiClient.createLead(leadData);
      } catch (error) {
        console.log("API unavailable for creating lead, simulating creation");
        return {
          id: Date.now(),
          ...leadData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadData }: { id: number; leadData: any }) => {
      try {
        return await apiClient.updateLead(id, leadData);
      } catch (error: any) {
        console.log(
          `API unavailable for updating lead ${id}, simulating update`,
        );
        // Simulate successful update for mock data
        return {
          ...leadData,
          id,
          updated_at: new Date().toISOString(),
        };
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors on mutations
      if (failureCount < 2 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying lead update (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
    onError: (error) => {
      console.error("Lead update failed:", error);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

export function useLeadStats(salesRepId?: number) {
  return useQuery({
    queryKey: ["lead-stats", salesRepId],
    queryFn: async () => {
      try {
        return await apiClient.getLeadStats(salesRepId);
      } catch (error) {
        console.log("API unavailable, using mock lead stats");
        return { total: 3, in_progress: 2, won: 1, lost: 0, completed: 0 };
      }
    },
  });
}

export function useTemplateStepDashboard() {
  return useQuery({
    queryKey: ["template-step-dashboard"],
    queryFn: async () => {
      try {
        return await apiClient.getTemplateStepDashboard();
      } catch (error) {
        console.error("Failed to fetch template step dashboard:", error);
        // Return empty array when backend is down
        if (
          error.message.includes("timeout") ||
          error.message.includes("unavailable") ||
          error.message.includes("Offline mode")
        ) {
          return [];
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if it's a timeout, offline, or server unavailable error
      if (
        error.message.includes("timeout") ||
        error.message.includes("unavailable") ||
        error.message.includes("Offline mode")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
  });
}

export function useLeadProgressDashboard() {
  return useQuery({
    queryKey: ["lead-progress-dashboard"],
    queryFn: () => apiClient.getLeadProgressDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

// Lead steps hooks
export function useLeadSteps(leadId: number) {
  return useQuery({
    queryKey: ["lead-steps", leadId],
    queryFn: async () => {
      try {
        return await apiClient.getLeadSteps(leadId);
      } catch (error) {
        console.log(
          `API unavailable for lead steps ${leadId}, using mock data`,
        );
        return [];
      }
    },
    enabled: !!leadId && leadId > 0,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes("Failed to fetch")) {
        console.log(`Retrying lead steps fetch (attempt ${failureCount + 1})`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error("Lead steps fetch failed:", error);
      // Don't throw the error, let the component handle it gracefully
    },
  });
}

export function useCreateLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      stepData,
    }: {
      leadId: number;
      stepData: any;
    }) => {
      try {
        return await apiClient.createLeadStep(leadId, stepData);
      } catch (error) {
        console.log(
          `API unavailable for creating lead step, simulating creation`,
        );
        return {
          id: Date.now(),
          ...stepData,
          lead_id: leadId,
          created_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

export function useUpdateLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, stepData }: { stepId: number; stepData: any }) =>
      apiClient.updateLeadStep(stepId, stepData),
    onSuccess: (data: any) => {
      // Get the lead_id from the response to invalidate specific queries
      if (data && data.lead_id) {
        // Invalidate specific lead steps and lead data
        queryClient.invalidateQueries({
          queryKey: ["lead-steps", data.lead_id],
        });
        queryClient.invalidateQueries({ queryKey: ["leads", data.lead_id] });
      }
      // Also invalidate broader queries as fallback
      queryClient.invalidateQueries({ queryKey: ["lead-steps"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

export function useDeleteLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) => apiClient.deleteLeadStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps"] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

export function useReorderLeadSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      stepOrders,
    }: {
      leadId: number;
      stepOrders: { id: number; order: number }[];
    }) => apiClient.reorderLeadSteps(leadId, stepOrders),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-progress-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["template-step-dashboard"] });
    },
  });
}

// Lead chat hooks
export function useStepChats(stepId: number, isVC: boolean = false) {
  return useQuery({
    queryKey: isVC ? ["vc-step-chats", stepId] : ["step-chats", stepId],
    queryFn: () => {
      if (isVC) {
        // Use VC step chat endpoint
        return apiClient.request(`/vc/steps/${stepId}/chats`);
      } else {
        // Use lead step chat endpoint
        return apiClient.getStepChats(stepId);
      }
    },
    enabled: !!stepId && stepId > 0,
  });
}

export function useCreateStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      chatData,
      isVC = false,
    }: {
      stepId: number;
      chatData: any;
      isVC?: boolean;
    }) => {
      if (isVC) {
        // Use VC step chat endpoint
        return apiClient.request(`/vc/steps/${stepId}/chats`, {
          method: "POST",
          body: JSON.stringify(chatData),
        });
      } else {
        // Use lead step chat endpoint
        return apiClient.createStepChat(stepId, chatData);
      }
    },
    onSuccess: (data, { stepId, isVC = false }) => {
      console.log("Chat created successfully:", data);
      // Invalidate and refetch the chat query
      const queryKey = isVC
        ? ["vc-step-chats", stepId]
        : ["step-chats", stepId];
      queryClient.invalidateQueries({ queryKey });
      // Also trigger an immediate refetch
      queryClient.refetchQueries({ queryKey });
    },
    onError: (error) => {
      console.error("Failed to create chat:", error);
    },
  });
}

export function useEditStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      updateData,
      isVC = false,
    }: {
      chatId: number;
      updateData: { message: string; is_rich_text: boolean };
      isVC?: boolean;
    }) => apiClient.editStepChat(chatId, updateData, isVC),
    onSuccess: (_, variables) => {
      const queryKey = variables.isVC ? ["vc-step-chats"] : ["step-chats"];
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      isVC = false,
    }: {
      chatId: number;
      isVC?: boolean;
    }) => apiClient.deleteStepChat(chatId, isVC),
    onSuccess: (_, variables) => {
      const queryKey = variables.isVC ? ["vc-step-chats"] : ["step-chats"];
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Follow-up hooks
export function useFollowUps(params?: {
  userId?: string;
  userRole?: string;
  status?: string;
  assigned_to?: string;
}) {
  return useQuery({
    queryKey: ["follow-ups", params],
    queryFn: async () => {
      try {
        return await apiClient.getAllFollowUps(params);
      } catch (error) {
        console.log("API unavailable, using mock follow-ups data");
        return [];
      }
    },
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpData: any) => apiClient.createFollowUp(followUpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

export function useClientFollowUps(clientId: number) {
  return useQuery({
    queryKey: ["follow-ups", "client", clientId],
    queryFn: () => apiClient.getClientFollowUps(clientId),
    enabled: !!clientId && clientId > 0,
  });
}

export function useLeadFollowUps(leadId: number) {
  return useQuery({
    queryKey: ["follow-ups", "lead", leadId],
    queryFn: () => apiClient.getLeadFollowUps(leadId),
    enabled: !!leadId && leadId > 0,
  });
}

export function useUpdateFollowUpStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      followUpId,
      statusData,
    }: {
      followUpId: number;
      statusData: any;
    }) => apiClient.updateFollowUpStatus(followUpId, statusData),
    onSuccess: () => {
      // Invalidate follow-up related queries
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

// Ticketing system hooks
export function useTicketMetadata() {
  return useQuery({
    queryKey: ["ticket-metadata"],
    queryFn: () => apiClient.getTicketMetadata(),
  });
}

export function useTickets(filters?: any, page?: number, limit?: number) {
  return useQuery({
    queryKey: ["tickets", filters, page, limit],
    queryFn: () => apiClient.getTickets(filters, page, limit),
  });
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => apiClient.getTicketById(id),
    enabled: !!id && id > 0,
  });
}

export function useTicketByTrackId(trackId: string) {
  return useQuery({
    queryKey: ["ticket", "track", trackId],
    queryFn: () => apiClient.getTicketByTrackId(trackId),
    enabled: !!trackId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketData,
      attachments,
    }: {
      ticketData: any;
      attachments?: File[];
    }) => apiClient.createTicket(ticketData, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: any }) =>
      apiClient.updateTicket(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket"] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useTicketComments(ticketId: number) {
  return useQuery({
    queryKey: ["ticket-comments", ticketId],
    queryFn: () => apiClient.getTicketComments(ticketId),
    enabled: !!ticketId && ticketId > 0,
  });
}

export function useAddTicketComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      commentData,
    }: {
      ticketId: number;
      commentData: any;
    }) => apiClient.addTicketComment(ticketId, commentData),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-comments", ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
    },
  });
}

export function useTicketNotifications(userId: string, unreadOnly?: boolean) {
  return useQuery({
    queryKey: ["ticket-notifications", userId, unreadOnly],
    queryFn: () => apiClient.getTicketNotifications(userId, unreadOnly),
    enabled: !!userId,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
    },
  });
}

export function useUploadTicketAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      file,
      commentId,
      userId,
    }: {
      ticketId: number;
      file: File;
      commentId?: number;
      userId?: string;
    }) => apiClient.uploadTicketAttachment(ticketId, file, commentId, userId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-comments", ticketId],
      });
    },
  });
}

// VC Step hooks
export function useUpdateVCStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, stepData }: { stepId: number; stepData: any }) => {
      console.log("🔄 Updating VC step:", stepId, stepData);
      return apiClient.request(`/vc/steps/${stepId}`, {
        method: "PUT",
        body: JSON.stringify(stepData),
      });
    },
    onSuccess: (data: any) => {
      console.log("✅ VC step update successful:", data);
      // Get the vc_id from the response to invalidate specific queries
      if (data && data.data && data.data.vc_id) {
        console.log("🔄 Invalidating queries for VC:", data.data.vc_id);
        // Invalidate specific VC steps and VC data
        queryClient.invalidateQueries({
          queryKey: ["vc-steps", data.data.vc_id.toString()],
        });
        queryClient.invalidateQueries({
          queryKey: ["vc", data.data.vc_id.toString()],
        });
      }
      // Also invalidate broader queries as fallback
      queryClient.invalidateQueries({ queryKey: ["vc-steps"] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
    },
    onError: (error: any) => {
      console.error("��� VC step update failed:", error);
    },
  });
}

export function useDeleteVCStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) =>
      apiClient.request(`/vc/steps/${stepId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps"] });
      queryClient.invalidateQueries({ queryKey: ["vcs"] });
    },
  });
}

export function useReorderVCSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vcId,
      stepOrders,
    }: {
      vcId: number;
      stepOrders: { id: number; order_index: number }[];
    }) =>
      apiClient.request(`/vc/${vcId}/steps/reorder`, {
        method: "PUT",
        body: JSON.stringify({ stepOrders }),
      }),
    onSuccess: (_, { vcId }) => {
      queryClient.invalidateQueries({ queryKey: ["vc-steps", vcId] });
    },
  });
}

// VC Step chat hooks - Disabled until backend endpoints are implemented
export function useVCStepChats(stepId: number) {
  return useQuery({
    queryKey: ["vc-step-chats", stepId],
    queryFn: async () => {
      // Return empty array since VC step chat endpoints are not implemented yet
      console.log(
        `VC step chats not implemented yet for step ${stepId}, returning empty array`,
      );
      return [];
    },
    enabled: false, // Disable the query entirely until endpoints are implemented
    retry: false,
    staleTime: Infinity,
  });
}

export function useCreateVCStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stepId,
      chatData,
    }: {
      stepId: number;
      chatData: any;
    }) => {
      // Mock implementation until VC step chat endpoints are implemented
      console.log(
        `VC step chat creation not implemented yet for step ${stepId}, returning mock response`,
      );
      return {
        id: Date.now(),
        ...chatData,
        created_at: new Date().toISOString(),
        step_id: stepId,
      };
    },
    onSuccess: (_, { stepId }) => {
      // Don't invalidate queries since they're disabled
      console.log(`Mock VC step chat created for step ${stepId}`);
    },
  });
}

export function useDeleteVCStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: number) => {
      // Mock implementation until VC step chat deletion endpoints are implemented
      console.log(
        `VC step chat deletion not implemented yet for chat ${chatId}, returning mock success`,
      );
      return { success: true };
    },
    onSuccess: () => {
      console.log("Mock VC step chat deleted");
    },
  });
}
