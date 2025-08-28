import {
  PublicClientApplication,
  AccountInfo,
  SilentRequest,
} from "@azure/msal-browser";
import { msalConfig, syncRequest } from "./msal-config";

export class AzureSilentAuthService {
  private msal: PublicClientApplication | null = null;
  private initPromise: Promise<void> | null = null;
  private tokenCache: string | null = null;

  constructor() {
    // Load cached token if available
    this.tokenCache = localStorage.getItem("azure_access_token");
  }

  /**
   * Initialize MSAL silently
   */
  private async initializeMsal(): Promise<void> {
    if (!this.msal) {
      this.msal = new PublicClientApplication(msalConfig);
      await this.msal.initialize();

      // Handle any pending redirect response silently
      await this.msal.handleRedirectPromise();
    }
  }

  /**
   * Ensure MSAL is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeMsal();
    }
    await this.initPromise;
  }

  /**
   * Get access token silently - similar to Python implementation
   */
  async getAccessToken(): Promise<string> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        throw new Error("MSAL instance not initialized");
      }

      // Try to get cached token first
      if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
        return this.tokenCache;
      }

      // Get accounts (similar to Python's app.get_accounts())
      const accounts = this.msal.getAllAccounts();

      if (accounts.length > 0) {
        // Try silent token acquisition (similar to Python's acquire_token_silent)
        try {
          const silentRequest: SilentRequest = {
            ...syncRequest,
            account: accounts[0],
          };

          const result = await this.msal.acquireTokenSilent(silentRequest);

          if (result && result.accessToken) {
            this.cacheToken(result.accessToken);
            return result.accessToken;
          }
        } catch (silentError) {
          console.log(
            "Silent token acquisition failed, redirecting to login...",
          );
          // Fall through to redirect authentication
        }
      }

      // No accounts or silent acquisition failed - redirect to login
      // This is similar to Python's device flow but uses browser redirect
      console.log("🔐 Redirecting to Azure AD for authentication...");

      // Save current location to return to after authentication
      sessionStorage.setItem("azure_auth_return_url", window.location.href);
      sessionStorage.setItem("azure_auth_in_progress", "true");

      // Redirect to Azure AD (no popup, no alert)
      await this.msal.loginRedirect(syncRequest);

      // This will redirect the page, so we won't reach here
      throw new Error("Redirecting to Azure AD for authentication");
    } catch (error) {
      console.error("Failed to get access token:", error);

      // If we're in the middle of authentication flow, don't throw
      if (sessionStorage.getItem("azure_auth_in_progress") === "true") {
        throw new Error("Authentication in progress");
      }

      throw error;
    }
  }

  /**
   * Check if we just returned from Azure AD authentication
   */
  async handleAuthReturn(): Promise<string | null> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        return null;
      }

      // Check if we're returning from authentication
      const authInProgress = sessionStorage.getItem("azure_auth_in_progress");
      if (!authInProgress) {
        return null;
      }

      // Handle the redirect response
      const response = await this.msal.handleRedirectPromise();

      if (response && response.accessToken) {
        // Clear authentication flags
        sessionStorage.removeItem("azure_auth_in_progress");

        // Cache the token
        this.cacheToken(response.accessToken);

        // Return to original URL if available
        const returnUrl = sessionStorage.getItem("azure_auth_return_url");
        if (returnUrl && returnUrl !== window.location.href) {
          sessionStorage.removeItem("azure_auth_return_url");
          window.location.href = returnUrl;
          return response.accessToken;
        }

        return response.accessToken;
      } else if (response) {
        // Authentication succeeded but need to get token
        const accounts = this.msal.getAllAccounts();
        if (accounts.length > 0) {
          try {
            const tokenResult = await this.msal.acquireTokenSilent({
              ...syncRequest,
              account: accounts[0],
            });

            if (tokenResult && tokenResult.accessToken) {
              sessionStorage.removeItem("azure_auth_in_progress");
              this.cacheToken(tokenResult.accessToken);
              return tokenResult.accessToken;
            }
          } catch (error) {
            console.error("Failed to get token after authentication:", error);
          }
        }
      }

      // Clear authentication flags on failure
      sessionStorage.removeItem("azure_auth_in_progress");
      return null;
    } catch (error) {
      console.error("Error handling auth return:", error);
      sessionStorage.removeItem("azure_auth_in_progress");
      return null;
    }
  }

  /**
   * Cache token with expiration
   */
  private cacheToken(token: string): void {
    this.tokenCache = token;

    // Store in localStorage with timestamp
    const tokenData = {
      token,
      timestamp: Date.now(),
      expiresIn: 3600000, // 1 hour in milliseconds
    };

    localStorage.setItem("azure_access_token", token);
    localStorage.setItem("azure_token_data", JSON.stringify(tokenData));
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(token: string): boolean {
    try {
      const tokenDataStr = localStorage.getItem("azure_token_data");
      if (!tokenDataStr) {
        return false;
      }

      const tokenData = JSON.parse(tokenDataStr);
      const now = Date.now();
      const tokenAge = now - tokenData.timestamp;

      // Consider token valid if less than 50 minutes old (with 10min buffer)
      return tokenAge < tokenData.expiresIn - 600000;
    } catch {
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AccountInfo | null> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        return null;
      }

      const accounts = this.msal.getAllAccounts();
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Clear cached token
      this.tokenCache = null;
      localStorage.removeItem("azure_access_token");
      localStorage.removeItem("azure_token_data");
      sessionStorage.removeItem("azure_auth_in_progress");
      sessionStorage.removeItem("azure_auth_return_url");

      await this.ensureInitialized();

      if (this.msal) {
        // Use redirect logout to avoid popups
        await this.msal.logoutRedirect({
          postLogoutRedirectUri: window.location.origin,
        });
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  }

  /**
   * Sync users from Azure AD
   */
  async syncUsersFromAzure(): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch("/api/azure-sync/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage =
                errorJson.message || errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (readError) {
          console.warn("Could not read error response:", readError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Azure sync failed:", error);
      throw error;
    }
  }

  /**
   * Test Graph API connection
   */
  async testGraphConnection(): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        "https://graph.microsoft.com/v1.0/users?$top=1",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Graph API test failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Graph API test failed:", error);
      throw error;
    }
  }

  /**
   * Check if authentication is in progress
   */
  isAuthInProgress(): boolean {
    return sessionStorage.getItem("azure_auth_in_progress") === "true";
  }

  /**
   * Clear authentication state
   */
  clearAuthState(): void {
    sessionStorage.removeItem("azure_auth_in_progress");
    sessionStorage.removeItem("azure_auth_return_url");
  }
}

// Export singleton instance
export const azureSilentAuth = new AzureSilentAuthService();
