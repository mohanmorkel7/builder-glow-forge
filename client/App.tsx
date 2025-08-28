import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// Preserve original fetch before FullStory interference - CRITICAL for API reliability
if (typeof window !== "undefined" && !(window as any).__originalFetch) {
  (window as any).__originalFetch = window.fetch.bind(window);
  console.log(
    "🔒 Original fetch preserved at application startup for FullStory protection",
  );
}

// Error Boundary for Auth errors
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);

    // Check if it's an auth-related error
    if (
      error.message?.includes("useAuth") ||
      error.message?.includes("AuthProvider")
    ) {
      console.warn("Auth context error detected - possible HMR issue");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-4">
              There was an issue with authentication. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import AdminPanel from "@/pages/AdminPanel";
import TemplateCreator from "@/pages/TemplateCreator";
import UserManagement from "@/pages/UserManagement";
import UserDetails from "@/pages/UserDetails";
import AddUser from "@/pages/AddUser";
import AzureUserRoleAssignment from "@/pages/AzureUserRoleAssignment";
import AzureTestPage from "@/pages/AzureTestPage";
import DepartmentTestPage from "@/pages/DepartmentTestPage";
import AuthDebugPage from "@/pages/AuthDebugPage";
import SSOTroubleshootPage from "@/pages/SSOTroubleshootPage";
import AzureConfigPage from "@/pages/AzureConfigPage";
import AzureDomainFixPage from "@/pages/AzureDomainFixPage";
import AzureImportDemoPage from "@/pages/AzureImportDemoPage";
import AddClient from "@/pages/AddClient";
import ClientDetails from "@/pages/ClientDetails";
import NewDeployment from "@/pages/NewDeployment";
import DeploymentDetails from "@/pages/DeploymentDetails";
import DeploymentEdit from "@/pages/DeploymentEdit";
import TemplateEdit from "@/pages/TemplateEdit";
import UserEdit from "@/pages/UserEdit";
import ClientEdit from "@/pages/ClientEdit";
import FollowUpNew from "@/pages/FollowUpNew";
import AdminReports from "@/pages/AdminReports";
import SalesDashboard from "@/pages/SalesDashboard";
import ProductManagement from "@/pages/ProductManagement";
import ProductWorkflow from "@/pages/ProductWorkflow";
import AlertsNotifications from "@/pages/AlertsNotifications";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LeadDashboard from "@/pages/LeadDashboard";
import CreateLead from "@/pages/CreateLead";
import LeadDetails from "@/pages/LeadDetails";
import LeadEdit from "@/pages/LeadEdit";
import VCDashboard from "@/pages/VCDashboard";
import CreateVC from "@/pages/CreateVC";
import VCDetails from "@/pages/VCDetails";
import VCEdit from "@/pages/VCEdit";
import ProposalNew from "@/pages/ProposalNew";
import ProposalList from "@/pages/ProposalList";
import FollowUpTracker from "@/pages/FollowUpTracker";
import PipelineSettings from "@/pages/PipelineSettings";
import Tickets from "@/pages/Tickets";
import AdminTemplates from "@/pages/AdminTemplates";
import FinOpsDashboard from "@/pages/FinOpsDashboard";
import FinOpsAutomation from "@/pages/FinOpsAutomation";
import UserProfile from "@/pages/UserProfile";
import DepartmentManager from "@/pages/DepartmentManager";
import DepartmentUploadTestPage from "@/pages/DepartmentUploadTestPage";
import UserRoleDebugPage from "@/pages/UserRoleDebugPage";
import NotFound from "@/pages/NotFound";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error: any) {
    // Handle case where AuthProvider is not available (e.g., during HMR)
    console.error("ProtectedRoute AuthProvider error:", error);

    // Don't redirect to login for API/upload errors that might bubble up
    if (error && typeof error.message === "string") {
      const errorMsg = error.message.toLowerCase();
      if (
        errorMsg.includes("upload") ||
        errorMsg.includes("fetch") ||
        errorMsg.includes("network") ||
        errorMsg.includes("400") ||
        errorMsg.includes("413") ||
        errorMsg.includes("body stream")
      ) {
        console.log("API error in ProtectedRoute, preserving auth state");
        // Try to render children anyway
        return <>{children}</>;
      }
    }

    return <Navigate to="/login" replace />;
  }
}

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
    }

    if (user) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // Handle case where AuthProvider is not available (e.g., during HMR)
    console.error("AuthGuard AuthProvider error:", error);
    return <>{children}</>;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <AuthGuard>
            <Login />
          </AuthGuard>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminTemplates />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminTemplates />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <TemplateCreator />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tickets />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AddUser />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/azure-role-assignment"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AzureUserRoleAssignment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/azure-test"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AzureTestPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/department-test"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <DepartmentTestPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/auth-debug"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AuthDebugPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sso-troubleshoot"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <SSOTroubleshootPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/azure-config"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AzureConfigPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/azure-domain-fix"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AzureDomainFixPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/azure-import-demo"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AzureImportDemoPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/add"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AddUser />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <TemplateEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminReports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finops"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance"]}>
            <DashboardLayout>
              <FinOpsAutomation />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finops/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance"]}>
            <DashboardLayout>
              <FinOpsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finops/automation"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance"]}>
            <DashboardLayout>
              <FinOpsAutomation />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <SalesDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ClientDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/new-client"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <AddClient />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ClientEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id/followup/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/followup/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/follow-up"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <LeadDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <CreateLead />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <LeadDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <LeadEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* VC Routes */}
      <Route
        path="/vc"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <VCDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vc/create"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <CreateVC />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vc/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <VCDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vc/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <VCEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/follow-up"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/proposals"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <ProposalList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ProposalNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <FollowUpTracker />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id/proposal"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <ProposalNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/pipeline-settings"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <PipelineSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="Sales Reports"
                description="View sales performance metrics and analytics"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <ProductWorkflow />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/workflow"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <ProductWorkflow />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <ProductManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <NewDeployment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <DeploymentDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <DeploymentEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/pipeline"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="Release Pipeline"
                description="Monitor and manage the product release pipeline"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/health"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="System Health"
                description="Monitor system performance and health metrics"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AlertsNotifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PlaceholderPage
                title="Alert Details"
                description="View detailed information about this alert or notification"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* User Profile - Available to all authenticated users */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UserProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Department Manager - Admin only */}
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <DepartmentManager />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/department-upload-test"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <DepartmentUploadTestPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user-role-debug"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserRoleDebugPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Page */}
      <Route
        path="*"
        element={
          <DashboardLayout>
            <NotFound />
          </DashboardLayout>
        }
      />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application...</p>
                  </div>
                </div>
              }
            >
              <OfflineIndicator />
              <AppRoutes />
            </React.Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AuthErrorBoundary>
    </QueryClientProvider>
  );
}

// Handle HMR properly to prevent connection issues
if (import.meta.hot) {
  import.meta.hot.accept();
}
