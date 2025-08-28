const API_BASE_URL = "/api";

export class ApiClient {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private isOfflineMode = false;
  private offlineDetectedAt = 0;
  private readonly OFFLINE_THRESHOLD = 2; // Number of consecutive failures to trigger offline mode

  // Method to reset circuit breaker (for development/demo mode)
  public resetCircuitBreaker() {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.isOfflineMode = false;
    this.offlineDetectedAt = 0;
    console.log("Circuit breaker reset");
  }

  // Check if we should enter offline mode
  private checkOfflineMode() {
    if (this.failureCount >= this.OFFLINE_THRESHOLD && !this.isOfflineMode) {
      this.isOfflineMode = true;
      this.offlineDetectedAt = Date.now();
      console.warn(
        "🔴 Offline mode activated - backend server appears to be down",
      );
      console.warn(
        "���� The app will show cached/mock data until the server is restored",
      );
    }
  }

  // Check if we should try to exit offline mode
  private shouldRetryConnection(): boolean {
    if (!this.isOfflineMode) return true;

    const timeSinceOffline = Date.now() - this.offlineDetectedAt;
    const retryInterval = 60000; // Retry every 60 seconds when offline

    return timeSinceOffline > retryInterval;
  }

  public isOffline(): boolean {
    return this.isOfflineMode;
  }
  // Preserve original fetch to avoid FullStory interference
  private preserveOriginalFetch() {
    if (typeof window !== "undefined" && !(window as any).__originalFetch) {
      (window as any).__originalFetch = window.fetch.bind(window);
      console.log("🔒 Original fetch preserved for FullStory protection");
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    // Ensure original fetch is preserved
    this.preserveOriginalFetch();
    // Offline mode check
    if (this.isOfflineMode && !this.shouldRetryConnection()) {
      console.warn(
        `🔴 Request to ${endpoint} blocked - app is in offline mode`,
      );
      throw new Error("Offline mode: Backend server is unavailable");
    }

    // Circuit breaker check
    const now = Date.now();
    if (
      this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD &&
      now - this.lastFailureTime < this.CIRCUIT_BREAKER_TIMEOUT &&
      !this.isOfflineMode // Allow retries when trying to exit offline mode
    ) {
      throw new Error(
        "Circuit breaker: Too many failures, please wait before retrying",
      );
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log("Making API request to:", url);
      console.log("Request config:", JSON.stringify(config, null, 2));

      let response: Response;

      try {
        // Detect FullStory interference
        const hasFS = typeof window !== "undefined" && !!(window as any).FS;
        const hasFullStoryScript =
          typeof document !== "undefined" &&
          !!document.querySelector('script[src*="fullstory"]');
        const fetchContainsFullStory =
          window.fetch.toString().includes("fullstory") ||
          window.fetch.toString().includes("fs.js");
        const hasPreservedFetch = !!(window as any).__originalFetch;

        const isFullStoryActive =
          hasFS || hasFullStoryScript || fetchContainsFullStory;

        console.log("🔍 FullStory detection:", {
          hasFS,
          hasFullStoryScript,
          fetchContainsFullStory,
          hasPreservedFetch,
          isFullStoryActive,
          fetchSource: window.fetch.toString().substring(0, 100) + "...",
        });

        // Try to use preserved original fetch first
        const originalFetch =
          (window as any).__originalFetch || window.fetch.bind(window);

        if (isFullStoryActive && !(window as any).__originalFetch) {
          console.warn(
            "🚨 FullStory detected and no preserved fetch - using XMLHttpRequest fallback",
          );
          response = await this.xmlHttpRequestFallback(url, config);
        } else {
          console.log(
            "🔒 Using",
            (window as any).__originalFetch ? "preserved" : "current",
            "fetch for request",
          );

          // Add timeout to prevent hanging requests - longer for notifications
          const timeoutMs = endpoint.includes("notifications") ? 15000 : 8000; // 15s for notifications, 8s for others
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
          });

          const fetchPromise = originalFetch(url, config);
          response = await Promise.race([fetchPromise, timeoutPromise]);
        }
      } catch (fetchError) {
        console.error(
          "Primary fetch failed for URL:",
          url,
          "Error:",
          fetchError,
        );

        // Check if it's FullStory interference
        const isFullStoryError =
          fetchError instanceof Error &&
          (fetchError.stack?.includes("fullstory") ||
            fetchError.stack?.includes("fs.js") ||
            fetchError.message.includes("Failed to fetch"));

        if (isFullStoryError) {
          console.error(
            "🚨 FullStory interference detected - using XMLHttpRequest fallback",
          );
          try {
            response = await this.xmlHttpRequestFallback(url, config);
          } catch (xhrError) {
            console.error("XMLHttpRequest fallback also failed:", xhrError);
            this.failureCount++;
            this.lastFailureTime = Date.now();
            this.checkOfflineMode();
            return null;
          }
        } else if (
          fetchError instanceof TypeError &&
          fetchError.message.includes("Failed to fetch")
        ) {
          console.error("Network connectivity issue detected");
          this.failureCount++;
          this.lastFailureTime = Date.now();
          this.checkOfflineMode();
          // For network connectivity issues, return an empty response rather than throwing
          return null;
        } else if (fetchError.message === "Request timeout") {
          console.error("Request timed out - server may be unresponsive");
          // For timeouts, increment failure count for circuit breaker
          this.failureCount++;
          this.lastFailureTime = Date.now();
          this.checkOfflineMode();
          // Return null instead of throwing for timeout errors
          return null;
        } else {
          // For other errors, try XMLHttpRequest fallback
          try {
            console.log("Using XMLHttpRequest fallback for other fetch error");
            response = await this.xmlHttpRequestFallback(url, config);
          } catch (xhrError) {
            console.error("XMLHttpRequest fallback failed:", xhrError);
            this.failureCount++;
            this.lastFailureTime = Date.now();
            this.checkOfflineMode();
            return null;
          }
        }
      }

      // Handle null response from network errors
      if (response === null) {
        console.warn("Network error - returning empty response");
        return [];
      }

      if (!response.ok) {
        console.log(
          "API Response not OK. Status:",
          response.status,
          "StatusText:",
          response.statusText,
        );

        // Handle specific status codes
        if (response.status === 401) {
          throw new Error("Invalid credentials");
        }

        let errorText: string = "";
        let errorData: any = null;

        try {
          // Read response body immediately without cloning to avoid conflicts
          errorText = await response.text();
          console.log("Server error response:", errorText);

          // Try to parse as JSON if possible
          if (errorText.trim()) {
            try {
              errorData = JSON.parse(errorText);
              console.log("Parsed error data:", errorData);
            } catch (parseError) {
              console.log("Error response is not JSON");
            }
          }
        } catch (textError) {
          console.error("Could not read error response body:", textError);
          // Provide status-specific error without reading body
          switch (response.status) {
            case 400:
              throw new Error(
                `Bad Request (${response.status}): Invalid data provided`,
              );
            case 403:
              throw new Error(`Forbidden (${response.status}): Access denied`);
            case 404:
              throw new Error(
                `Not Found (${response.status}): Resource not found`,
              );
            case 500:
              throw new Error(
                `Server Error (${response.status}): Internal server error`,
              );
            default:
              throw new Error(
                `HTTP Error (${response.status}): Request failed`,
              );
          }
        }

        // Use already parsed error data or fall back to text
        if (errorData && (errorData.error || errorData.message)) {
          throw new Error(errorData.error || errorData.message);
        } else if (errorText) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`,
          );
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }

      // Read response as text first to avoid "body already used" errors
      let responseText: string;
      try {
        responseText = await response.text();
      } catch (textError) {
        console.error("Could not read response body:", textError);
        throw new Error(`Could not read response from server URL: ${url}`);
      }

      // Check if response is HTML instead of JSON (indicates routing issue)
      if (
        responseText.trim().startsWith("<!doctype") ||
        responseText.trim().startsWith("<!DOCTYPE") ||
        responseText.trim().startsWith("<html")
      ) {
        console.error(
          "Received HTML response instead of JSON for API endpoint:",
          url,
        );
        console.error(
          "This indicates the API request is not being routed to the backend server.",
        );
        console.error(
          "Response content:",
          responseText.substring(0, 200) + "...",
        );

        // Check if server might be down or misconfigured
        throw new Error(
          `Server routing error: API endpoint ${endpoint} returned HTML instead of JSON. This usually means the backend server is not running or API routes are not properly configured.`,
        );
      }

      // Try to parse as JSON
      try {
        const result = JSON.parse(responseText);
        // Reset failure count and offline mode on successful request
        if (this.isOfflineMode) {
          console.log("🟢 Connection restored - exiting offline mode");
          this.isOfflineMode = false;
          this.offlineDetectedAt = 0;
        }
        this.failureCount = 0;
        return result;
      } catch (jsonError) {
        console.error(
          "Invalid JSON response body:",
          responseText.substring(0, 500),
        ); // Log first 500 chars
        console.error("JSON parse error:", jsonError);
        throw new Error(`Invalid JSON response from server URL: ${url}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API request failed:", errorMessage, "URL:", url);

      // Only track actual network failures for circuit breaker, not server responses
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Network error") ||
          error.message.includes("body stream"));

      if (isNetworkError) {
        // Track failure for circuit breaker only for network errors
        this.failureCount++;
        this.lastFailureTime = Date.now();
      }

      // Retry logic for network errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch") &&
        retryCount < 2
      ) {
        console.log(`Retrying request ${retryCount + 1}/2 for ${url}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        ); // Exponential backoff
        return this.request(endpoint, options, retryCount + 1);
      }

      if (error instanceof TypeError) {
        if (error.message.includes("Failed to fetch")) {
          console.error("Network fetch failure details:", {
            url,
            config: JSON.stringify(config, null, 2),
            error: error.message,
            timestamp: new Date().toISOString(),
            retryCount,
          });
          throw new Error(
            `Network error: Cannot connect to server at ${url}. Please check your internet connection or server status.`,
          );
        }
        if (error.message.includes("body stream")) {
          console.error("Body stream error for URL:", url);
          throw new Error(
            `Network error: Connection interrupted for ${url}. Please try again.`,
          );
        }
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  private xmlHttpRequestFallback(
    url: string,
    config: RequestInit,
  ): Promise<Response> {
    console.log("🔧 Using XMLHttpRequest fallback for:", url);

    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.timeout = 15000; // Shorter timeout for faster fallback

        // Handle CORS for cross-origin requests
        if (url.includes("://") && !url.startsWith(window.location.origin)) {
          xhr.withCredentials = false;
        }

        xhr.open(config.method || "GET", url, true);

        // Set headers with better error handling
        if (config.headers) {
          Object.entries(config.headers).forEach(([key, value]) => {
            try {
              // Skip problematic headers that XHR handles automatically
              if (
                !["content-length", "host", "origin", "referer"].includes(
                  key.toLowerCase(),
                )
              ) {
                xhr.setRequestHeader(key, value as string);
              }
            } catch (headerError) {
              console.warn(`⚠️ Could not set header ${key}:`, headerError);
            }
          });
        }

        xhr.onload = () => {
          try {
            console.log(
              "✅ XMLHttpRequest success:",
              xhr.status,
              xhr.statusText,
            );

            // Parse response headers
            const headers = new Headers();
            const headerLines = xhr.getAllResponseHeaders().split("\r\n");
            headerLines.forEach((line) => {
              const parts = line.split(": ");
              if (parts.length === 2) {
                headers.append(parts[0], parts[1]);
              }
            });

            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers,
            });
            resolve(response);
          } catch (responseError) {
            console.error(
              "❌ Error creating response from XHR:",
              responseError,
            );
            reject(new Error("Failed to process XMLHttpRequest response"));
          }
        };

        xhr.onerror = (e) => {
          console.error("❌ XMLHttpRequest network error:", e);
          reject(new Error("XMLHttpRequest network error"));
        };

        xhr.ontimeout = () => {
          console.error("❌ XMLHttpRequest timeout");
          reject(new Error("XMLHttpRequest timeout"));
        };

        xhr.onabort = () => {
          console.error("❌ XMLHttpRequest aborted");
          reject(new Error("XMLHttpRequest aborted"));
        };

        xhr.send((config.body as string) || null);
      } catch (setupError) {
        console.error("❌ Failed to setup XMLHttpRequest:", setupError);
        reject(
          new Error(`Failed to setup XMLHttpRequest: ${setupError.message}`),
        );
      }
    });
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request("/users/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // User methods
  async getUsers() {
    return this.request("/users");
  }

  async getUser(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: any) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Client methods
  async getClients(salesRepId?: number) {
    const params = salesRepId ? `?salesRep=${salesRepId}` : "";
    return this.request(`/clients${params}`);
  }

  async getClient(id: number) {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData: any) {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: number, clientData: any) {
    return this.request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: number) {
    return this.request(`/clients/${id}`, {
      method: "DELETE",
    });
  }

  async getClientStats() {
    return this.request("/clients/stats");
  }

  // Template methods
  async getTemplates() {
    return this.request("/templates");
  }

  async getTemplate(id: number) {
    return this.request(`/templates/${id}`);
  }

  async createTemplate(templateData: any) {
    return this.request("/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(id: number, templateData: any) {
    return this.request(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(id: number) {
    return this.request(`/templates/${id}`, {
      method: "DELETE",
    });
  }

  async duplicateTemplate(templateId: number, createdBy?: number) {
    return this.request(`/templates/${templateId}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ created_by: createdBy || 1 }),
    });
  }

  // Deployment methods
  async getDeployments(assigneeId?: number) {
    const params = assigneeId ? `?assignee=${assigneeId}` : "";
    return this.request(`/deployments${params}`);
  }

  async getDeployment(id: number) {
    return this.request(`/deployments/${id}`);
  }

  async createDeployment(deploymentData: any) {
    return this.request("/deployments", {
      method: "POST",
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeployment(id: number, deploymentData: any) {
    return this.request(`/deployments/${id}`, {
      method: "PUT",
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeploymentStatus(id: number, status: string) {
    return this.request(`/deployments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteDeployment(id: number) {
    return this.request(`/deployments/${id}`, {
      method: "DELETE",
    });
  }

  async getDeploymentStats() {
    return this.request("/deployments/stats");
  }

  async getProducts() {
    return this.request("/deployments/products/list");
  }

  // Onboarding methods
  async getClientOnboardingSteps(clientId: number) {
    return this.request(`/onboarding/clients/${clientId}/steps`);
  }

  async createOnboardingStep(clientId: number, stepData: any) {
    return this.request(`/onboarding/clients/${clientId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateOnboardingStep(stepId: number, stepData: any) {
    return this.request(`/onboarding/steps/${stepId}`, {
      method: "PUT",
      body: JSON.stringify(stepData),
    });
  }

  async deleteOnboardingStep(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}`, {
      method: "DELETE",
    });
  }

  async reorderOnboardingSteps(
    clientId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/onboarding/clients/${clientId}/steps/reorder`, {
      method: "PUT",
      body: JSON.stringify({ stepOrders }),
    });
  }

  async getStepDocuments(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}/documents`);
  }

  async uploadStepDocument(stepId: number, documentData: any) {
    return this.request(`/onboarding/steps/${stepId}/documents`, {
      method: "POST",
      body: JSON.stringify(documentData),
    });
  }

  async deleteStepDocument(documentId: number) {
    return this.request(`/onboarding/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async getStepComments(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}/comments`);
  }

  async createStepComment(stepId: number, commentData: any) {
    return this.request(`/onboarding/steps/${stepId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async deleteStepComment(commentId: number) {
    return this.request(`/onboarding/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // Enhanced request method with retry logic
  private async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 2,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${maxRetries} for endpoint: ${endpoint}`,
        );
        const result = await this.request<T>(endpoint, options);
        console.log(`Success on attempt ${attempt} for endpoint: ${endpoint}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${endpoint}:`,
          error,
        );

        // If it's the last attempt, don't retry
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error(`All ${maxRetries} attempts failed for ${endpoint}`);
    throw lastError;
  }

  // Lead methods
  async getLeads(salesRepId?: number) {
    try {
      const params = salesRepId ? `?salesRep=${salesRepId}` : "";
      return await this.requestWithRetry(`/leads${params}`, {}, 3);
    } catch (error) {
      console.error("Failed to fetch leads after all retries:", error);
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  async getPartialLeads(salesRepId?: number) {
    const params = salesRepId
      ? `?salesRep=${salesRepId}&partial=true`
      : "?partial=true";
    return this.request(`/leads${params}`);
  }

  async getMyPartialSaves(userId?: number) {
    const params = userId
      ? `?created_by=${userId}&partial_saves_only=true`
      : "?partial_saves_only=true";
    return this.request(`/leads${params}`);
  }

  async getMyVCPartialSaves(userId?: number) {
    const params = userId
      ? `?created_by=${userId}&partial_saves_only=true`
      : "?partial_saves_only=true";
    return this.request(`/vc${params}`);
  }

  async getLead(id: number) {
    return this.request(`/leads/${id}`);
  }

  async createLead(leadData: any) {
    return this.request("/leads", {
      method: "POST",
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: number, leadData: any) {
    return this.request(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id: number) {
    return this.request(`/leads/${id}`, {
      method: "DELETE",
    });
  }

  async getLeadStats(salesRepId?: number) {
    const params = salesRepId ? `?salesRep=${salesRepId}` : "";
    return this.request(`/leads/stats${params}`);
  }

  async getTemplateStepDashboard() {
    return this.request("/leads/template-step-dashboard");
  }

  async getLeadProgressDashboard() {
    try {
      return await this.requestWithRetry("/leads/progress-dashboard", {}, 3);
    } catch (error) {
      console.error(
        "Failed to fetch lead progress dashboard after all retries:",
        error,
      );
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  async getLeadsForTemplateStep(
    templateId: number,
    stepId: number,
    status: string,
  ) {
    return this.request(
      `/leads/template-step/${templateId}/${stepId}/${status}`,
    );
  }

  // FinOps Task Management methods with enhanced error handling
  async getFinOpsTasks() {
    try {
      console.log("🔍 Fetching FinOps tasks...");

      // Use request with retry for better reliability
      const result = await this.requestWithRetry("/finops/tasks", {}, 3);

      console.log(
        "✅ FinOps tasks fetched successfully:",
        Array.isArray(result) ? result.length : "unknown count",
      );
      return result || [];
    } catch (error) {
      console.error(
        "❌ Failed to fetch FinOps tasks after all retries:",
        error,
      );

      // Return empty array as graceful fallback to prevent UI crashes
      return [];
    }
  }

  async createFinOpsTask(taskData: any) {
    return this.request("/finops/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateFinOpsTask(id: number, taskData: any) {
    return this.request(`/finops/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteFinOpsTask(id: number) {
    return this.request(`/finops/tasks/${id}`, {
      method: "DELETE",
    });
  }

  async updateFinOpsSubTask(
    taskId: number,
    subTaskId: string,
    status: string,
    userName?: string,
  ) {
    return this.request(`/finops/tasks/${taskId}/subtasks/${subTaskId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        user_name: userName,
      }),
    });
  }

  async getFinOpsActivityLog(filters?: {
    taskId?: number;
    userId?: string;
    action?: string;
    date?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.taskId) params.append("taskId", filters.taskId.toString());
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.action) params.append("action", filters.action);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return this.request(`/finops/activity-log?${params.toString()}`);
  }

  async runFinOpsTask(taskId: number) {
    return this.request(`/finops/tasks/${taskId}/run`, {
      method: "POST",
    });
  }

  async getFinOpsDailyTasks(date?: string) {
    const params = date ? `?date=${date}` : "";
    return this.request(`/finops/daily-tasks${params}`);
  }

  async triggerFinOpsSLACheck() {
    return this.request("/finops/check-sla", {
      method: "POST",
    });
  }

  async triggerFinOpsDailyExecution() {
    return this.request("/finops/trigger-daily", {
      method: "POST",
    });
  }

  async getFinOpsSchedulerStatus() {
    return this.request("/finops/scheduler-status");
  }

  async getFinOpsTaskSummary(taskId: number) {
    return this.request(`/finops/tasks/${taskId}/summary`);
  }

  async sendFinOpsManualAlert(
    taskId: number,
    subtaskId: string,
    alertType: string,
    message: string,
  ) {
    return this.request(`/finops/tasks/${taskId}/subtasks/${subtaskId}/alert`, {
      method: "POST",
      body: JSON.stringify({
        alert_type: alertType,
        message: message,
      }),
    });
  }

  // FinOps Clients Management methods
  async getFinOpsClients() {
    return this.request("/finops/clients");
  }

  async createFinOpsClient(clientData: any) {
    return this.request("/finops/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async updateFinOpsClient(id: number, clientData: any) {
    return this.request(`/finops/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteFinOpsClient(id: number) {
    return this.request(`/finops/clients/${id}`, {
      method: "DELETE",
    });
  }

  async getFinOpsClient(id: number) {
    return this.request(`/finops/clients/${id}`);
  }

  // Lead steps methods
  async getLeadSteps(leadId: number) {
    return this.request(`/leads/${leadId}/steps`);
  }

  async createLeadStep(leadId: number, stepData: any) {
    return this.request(`/leads/${leadId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateLeadStep(stepId: number, stepData: any) {
    return this.request(`/leads/steps/${stepId}`, {
      method: "PUT",
      body: JSON.stringify(stepData),
    });
  }

  async deleteLeadStep(stepId: number) {
    return this.request(`/leads/steps/${stepId}`, {
      method: "DELETE",
    });
  }

  async reorderLeadSteps(
    leadId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/leads/${leadId}/steps/reorder`, {
      method: "PUT",
      body: JSON.stringify({ stepOrders }),
    });
  }

  // Lead chat methods
  async getStepChats(stepId: number) {
    return this.request(`/leads/steps/${stepId}/chats`);
  }

  async createStepChat(stepId: number, chatData: any) {
    return this.request(`/leads/steps/${stepId}/chats`, {
      method: "POST",
      body: JSON.stringify(chatData),
    });
  }

  async editStepChat(
    chatId: number,
    updateData: { message: string; is_rich_text: boolean },
    isVC: boolean = false,
  ) {
    const endpoint = isVC ? `/vc/chats/${chatId}` : `/leads/chats/${chatId}`;
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteStepChat(chatId: number, isVC: boolean = false) {
    const endpoint = isVC ? `/vc/chats/${chatId}` : `/leads/chats/${chatId}`;
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Test method to verify upload endpoint
  async testUploadEndpoint() {
    const url = `${API_BASE_URL}/files/test`;
    try {
      const response = await fetch(url);
      const result = await response.text();
      console.log("Upload endpoint test:", response.status, result);
      return { status: response.status, result };
    } catch (error) {
      console.error("Upload endpoint test failed:", error);
      throw error;
    }
  }

  // Test method to verify what the server expects for uploads
  async testUploadFormat() {
    const url = `${API_BASE_URL}/files/upload`;

    // Create a simple test FormData
    const formData = new FormData();
    const testBlob = new Blob(["test file content"], { type: "text/plain" });
    const testFile = new File([testBlob], "test.txt", { type: "text/plain" });

    console.log(
      "Testing with simple file:",
      testFile.name,
      testFile.size,
      testFile.type,
    );

    // Test different field names
    const fieldNames = ["files", "file", "upload", "document"];

    for (const fieldName of fieldNames) {
      console.log(`Testing field name: ${fieldName}`);
      const testFormData = new FormData();
      testFormData.append(fieldName, testFile);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: testFormData,
        });

        console.log(`Field ${fieldName}: Status ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Success with field name: ${fieldName}`, result);
          return { fieldName, success: true, result };
        } else {
          console.log(`❌ Failed with field name: ${fieldName}`);
        }
      } catch (error) {
        console.log(`❌ Error with field name: ${fieldName}:`, error);
      }
    }

    return { success: false, message: "All field names failed" };
  }

  // File upload method
  async uploadFiles(files: FileList) {
    // Validate input
    if (!files || files.length === 0) {
      throw new Error("No files provided for upload");
    }

    console.log(`Starting upload of ${files.length} files`);

    const formData = new FormData();

    // Use consistent field name that multer expects
    Array.from(files).forEach((file, index) => {
      console.log(`Adding file ${index + 1} to FormData:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
      formData.append("files", file);
    });

    // Validate FormData was created properly
    let formDataEntryCount = 0;
    try {
      for (const entry of formData.entries()) {
        formDataEntryCount++;
      }
      console.log(`FormData contains ${formDataEntryCount} entries`);
    } catch (e) {
      console.warn("Cannot iterate FormData entries in this browser");
    }

    const url = `${API_BASE_URL}/files/upload`;

    try {
      console.log(`Uploading ${files.length} files to ${url}`);

      // Log file details for debugging
      Array.from(files).forEach((file, index) => {
        console.log(
          `File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type}, last modified: ${new Date(file.lastModified)})`,
        );

        // Check for potential issues
        if (file.size === 0) {
          console.warn(`⚠️  File ${file.name} is empty (0 bytes)`);
        }
        if (file.size > 50 * 1024 * 1024) {
          console.warn(`⚠️  File ${file.name} exceeds 50MB limit`);
        }
        if (!file.type) {
          console.warn(`⚠️  File ${file.name} has no MIME type`);
        }
      });

      // Debug FormData contents
      console.log("FormData created with files under 'files' field");
      console.log(
        "FormData has entries:",
        Array.from(formData.entries()).length,
      );

      // Try to log FormData entries (modern browsers)
      try {
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(
              `FormData entry: ${key} = File(${value.name}, ${value.size} bytes)`,
            );
          } else {
            console.log(`FormData entry: ${key} = ${value}`);
          }
        }
      } catch (e) {
        console.log("Cannot inspect FormData entries in this browser");
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let browser set it with boundary
      });

      clearTimeout(timeoutId);

      console.log(`Upload response status: ${response.status}`);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      // Read response body IMMEDIATELY to avoid stream conflicts
      let responseText = "";
      let responseData = null;

      try {
        console.log("Reading response body immediately...");
        responseText = await response.text();
        console.log("Raw response text:", responseText);

        // Try to parse as JSON if we have content
        if (responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
            console.log("Parsed response data:", responseData);
          } catch (parseError) {
            console.log("Response is not JSON, treating as text");
          }
        } else {
          console.log("Response body is empty");
        }
      } catch (readError) {
        console.error("Failed to read response body:", readError);
        // Continue with status-based error handling
      }

      // Now handle the response based on status, using already-read data
      if (!response.ok) {
        console.error("Upload failed:");
        console.error("- Status:", response.status);
        console.error("- Status Text:", response.statusText);
        console.error("- URL:", response.url);
        console.error("- Content-Type:", response.headers.get("content-type"));
        console.error(
          "- Content-Length:",
          response.headers.get("content-length"),
        );
        console.error("- Response Text:", responseText);
        console.error("- Response Data:", responseData);

        let errorMessage = "Upload failed";

        // Use server error message if available
        if (responseData && (responseData.error || responseData.message)) {
          errorMessage = responseData.message || responseData.error;
          console.error("Using server error message:", errorMessage);
        } else {
          // Fallback to status-based messages
          switch (response.status) {
            case 400:
              errorMessage =
                "Bad request - server rejected the file upload. Check the server logs for details.";
              break;
            case 413:
              errorMessage =
                "File too large. Please choose a smaller file (max 50MB).";
              break;
            case 404:
              errorMessage =
                "Upload service not found. Please contact support.";
              break;
            case 500:
              errorMessage = "Server error occurred. Please try again later.";
              break;
            case 503:
              errorMessage =
                "Upload service temporarily unavailable. Please try again later.";
              break;
            default:
              errorMessage = `Upload failed with error ${response.status}. Please try again.`;
          }
          console.error("Using fallback error message:", errorMessage);
        }

        throw new Error(errorMessage);
      }

      // Handle successful response using already-read data
      if (responseData) {
        console.log("Upload successful:", responseData);
        return responseData;
      } else {
        console.log("Success response but no valid JSON data");
        return {
          success: true,
          message: "Upload completed successfully",
          files: [],
        };
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.name === "AbortError") {
        throw new Error(
          "Upload timed out. Please try with smaller files or check your connection.",
        );
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during upload");
    }
  }

  // Follow-up methods
  async getAllFollowUps(params?: {
    userId?: string;
    userRole?: string;
    status?: string;
    assigned_to?: string;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.userId) searchParams.append("userId", params.userId);
      if (params?.userRole) searchParams.append("userRole", params.userRole);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.assigned_to)
        searchParams.append("assigned_to", params.assigned_to);

      const queryString = searchParams.toString();
      const endpoint = `/follow-ups${queryString ? `?${queryString}` : ""}`;

      console.log("Fetching follow-ups from:", endpoint);

      // Add a timeout and retry logic specifically for follow-ups
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Follow-ups request timeout")), 5000); // Reduced to 5 seconds
      });

      // Single attempt with fast timeout
      try {
        const requestPromise = this.request(endpoint);
        const result = await Promise.race([requestPromise, timeoutPromise]);
        console.log(
          "Follow-ups fetch successful, got",
          Array.isArray(result) ? result.length : "non-array",
          "items",
        );
        return result;
      } catch (error) {
        console.warn("Follow-ups request failed:", error);
        // Return empty array immediately on timeout/error
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);

      // Check if it's a network error vs server error
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - server may be unreachable");
      }

      // Return empty array as fallback to prevent crashes
      return [];
    }
  }

  async createFollowUp(followUpData: any) {
    return this.request("/follow-ups", {
      method: "POST",
      body: JSON.stringify(followUpData),
    });
  }

  async getClientFollowUps(clientId: number) {
    return this.request(`/follow-ups/client/${clientId}`);
  }

  async getLeadFollowUps(leadId: number) {
    return this.request(`/follow-ups/lead/${leadId}`);
  }

  async updateFollowUpStatus(followUpId: number, statusData: any) {
    return this.request(`/follow-ups/${followUpId}`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  }

  // Ticketing API methods
  async getTicketMetadata() {
    return this.request<{
      priorities: any[];
      statuses: any[];
      categories: any[];
    }>("/tickets/metadata");
  }

  async getTickets(filters?: any, page?: number, limit?: number) {
    let endpoint = "/tickets";
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request<{
      tickets: any[];
      total: number;
      pages: number;
    }>(endpoint);
  }

  async getTicketById(id: number) {
    return this.request<any>(`/tickets/${id}`);
  }

  async getTicketByTrackId(trackId: string) {
    return this.request<any>(`/tickets/track/${trackId}`);
  }

  async createTicket(ticketData: any, attachments?: File[]) {
    const formData = new FormData();

    // Add ticket data
    Object.entries(ticketData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Add attachments
    if (attachments) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    return this.request<any>("/tickets", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateTicket(id: number, updateData: any) {
    return this.request<any>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteTicket(id: number) {
    return this.request<void>(`/tickets/${id}`, {
      method: "DELETE",
    });
  }

  async getTicketComments(ticketId: number) {
    return this.request<any[]>(`/tickets/${ticketId}/comments`);
  }

  async addTicketComment(ticketId: number, commentData: any) {
    return this.request<any>(`/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async getTicketNotifications(userId: string, unreadOnly?: boolean) {
    let endpoint = `/tickets/notifications/${userId}`;
    if (unreadOnly) {
      endpoint += "?unread_only=true";
    }
    return this.request<any[]>(endpoint);
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request<void>(`/tickets/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async uploadTicketAttachment(
    ticketId: number,
    file: File,
    commentId?: number,
    userId?: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    if (commentId) formData.append("comment_id", String(commentId));
    if (userId) formData.append("user_id", userId);

    return this.request<any>(`/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Enhanced Template API methods
  async getTemplateCategories() {
    return this.request<any[]>("/templates/categories");
  }

  async getTemplatesByCategory(categoryId: number) {
    return this.request<any[]>(`/templates/category/${categoryId}`);
  }

  async getTemplatesWithCategories() {
    return this.request<any[]>("/templates/with-categories");
  }

  async getTemplateStats() {
    return this.request<any>("/templates/stats");
  }

  async searchTemplates(searchTerm: string, categoryId?: number) {
    let endpoint = `/templates/search?q=${encodeURIComponent(searchTerm)}`;
    if (categoryId) {
      endpoint += `&category=${categoryId}`;
    }
    return this.request<any[]>(endpoint);
  }

  async getStepCategories() {
    return this.request<any[]>("/templates/step-categories");
  }

  async recordTemplateUsage(
    templateId: number,
    entityType: string,
    entityId: number,
  ) {
    return this.request<void>(`/templates/${templateId}/usage`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    });
  }

  // FinOps API methods
  async getFinOpsDashboard() {
    return this.request("/finops/dashboard");
  }

  async getFinOpsMetrics(
    period?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const query = params.toString();
    return this.request(`/finops/metrics${query ? `?${query}` : ""}`);
  }

  async getFinOpsAccounts() {
    return this.request("/finops/accounts");
  }

  async createFinOpsAccount(accountData: any) {
    return this.request("/finops/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  }

  async getFinOpsTransactions(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const query = params.toString();
    return this.request(`/finops/transactions${query ? `?${query}` : ""}`);
  }

  async getFinOpsTransaction(id: number) {
    return this.request(`/finops/transactions/${id}`);
  }

  async createFinOpsTransaction(transactionData: any) {
    return this.request("/finops/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  }

  async getFinOpsBudgets() {
    return this.request("/finops/budgets");
  }

  async createFinOpsBudget(budgetData: any) {
    return this.request("/finops/budgets", {
      method: "POST",
      body: JSON.stringify(budgetData),
    });
  }

  async getFinOpsInvoices() {
    return this.request("/finops/invoices");
  }

  async createFinOpsInvoice(invoiceData: any) {
    return this.request("/finops/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  async getFinOpsCosts(referenceType?: string, referenceId?: number) {
    const params = new URLSearchParams();
    if (referenceType) params.append("reference_type", referenceType);
    if (referenceId) params.append("reference_id", referenceId.toString());

    const query = params.toString();
    return this.request(`/finops/costs${query ? `?${query}` : ""}`);
  }

  async createFinOpsCost(costData: any) {
    return this.request("/finops/costs", {
      method: "POST",
      body: JSON.stringify(costData),
    });
  }

  async generateFinOpsReport(reportData: any) {
    return this.request("/finops/reports/generate", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  async exportFinOpsData(
    type: string,
    format?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const params = new URLSearchParams();
    if (format) params.append("format", format);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const query = params.toString();
    return this.request(`/finops/export/${type}${query ? `?${query}` : ""}`);
  }

  // Workflow API methods
  async getWorkflowDashboard(userId: number, userRole: string) {
    return this.request(
      `/workflow/dashboard?userId=${userId}&userRole=${userRole}`,
    );
  }

  async getWorkflowProjects(userId?: number, userRole?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());
    if (userRole) params.append("userRole", userRole);

    const query = params.toString();
    return this.request(`/workflow/projects${query ? `?${query}` : ""}`);
  }

  async getWorkflowProject(id: number) {
    return this.request(`/workflow/projects/${id}`);
  }

  async createWorkflowProject(projectData: any) {
    return this.request("/workflow/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async createProjectFromLead(leadId: number, projectData: any) {
    return this.request(`/workflow/projects/from-lead/${leadId}`, {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async getProjectSteps(projectId: number) {
    return this.request(`/workflow/projects/${projectId}/steps`);
  }

  async createProjectStep(projectId: number, stepData: any) {
    return this.request(`/workflow/projects/${projectId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateStepStatus(stepId: number, status: string, updatedBy: number) {
    return this.request(`/workflow/steps/${stepId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, updated_by: updatedBy }),
    });
  }

  async getProjectComments(projectId: number, stepId?: number) {
    const params = new URLSearchParams();
    if (stepId) params.append("stepId", stepId.toString());

    const query = params.toString();
    return this.request(
      `/workflow/projects/${projectId}/comments${query ? `?${query}` : ""}`,
    );
  }

  async createProjectComment(projectId: number, commentData: any) {
    return this.request(`/workflow/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async getWorkflowNotifications(userId: number, unreadOnly?: boolean) {
    const params = new URLSearchParams();
    params.append("userId", userId.toString());
    if (unreadOnly) params.append("unreadOnly", "true");

    const query = params.toString();
    return this.request(`/workflow/notifications?${query}`);
  }

  async getWorkflowAutomations() {
    return this.request("/workflow/automations");
  }

  async triggerAutomation(automationId: number) {
    return this.request(`/workflow/automations/${automationId}/trigger`, {
      method: "POST",
    });
  }

  async getCompletedLeads() {
    return this.request("/workflow/leads/completed");
  }

  async reorderProjectSteps(
    projectId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/workflow/projects/${projectId}/steps/reorder`, {
      method: "POST",
      body: JSON.stringify({ stepOrders }),
    });
  }

  async createProjectFollowUp(projectId: number, followUpData: any) {
    return this.request(`/workflow/projects/${projectId}/follow-ups`, {
      method: "POST",
      body: JSON.stringify(followUpData),
    });
  }
}

export const apiClient = new ApiClient();

// Reset circuit breaker for development/demo mode
apiClient.resetCircuitBreaker();
