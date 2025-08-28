import {
  PublicClientApplication,
  AccountInfo,
  BrowserAuthError,
} from "@azure/msal-browser";
import { msalConfig, syncRequest, graphConfig } from "./msal-config";

// Initialize MSAL instance
let msalInstance: PublicClientApplication | null = null;
let msalInitialized = false;

// Utility to detect if popups are blocked
const isPopupBlocked = (): boolean => {
  try {
    const popup = window.open("", "_blank", "width=1,height=1");
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      return true;
    }
    popup.close();
    return false;
  } catch (e) {
    return true;
  }
};

// Utility to show popup blocker warning
const showPopupBlockerWarning = () => {
  const message = `Popup windows are blocked in your browser. This is required for Azure AD authentication.

Please:
1. Allow popups for this site in your browser settings
2. Or try using redirect-based authentication (less secure but works with popup blockers)

Would you like to try redirect-based authentication instead?`;

  return confirm(message);
};

export const initializeMsal = async (): Promise<PublicClientApplication> => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }

  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }

  return msalInstance;
};

export class AzureSyncService {
  private msal: PublicClientApplication | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize in constructor, do it lazily
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeMsal();
    }
    await this.initPromise;
  }

  private async initializeMsal(): Promise<void> {
    try {
      this.msal = await initializeMsal();

      // Handle redirect response if present
      await this.handleRedirectResponse();
    } catch (error) {
      console.error("Failed to initialize MSAL:", error);
      throw new Error(`MSAL initialization failed: ${error.message}`);
    }
  }

  /**
   * Handle redirect response after authentication redirect
   */
  private async handleRedirectResponse(): Promise<void> {
    if (!this.msal) return;

    try {
      const response = await this.msal.handleRedirectPromise();
      if (response) {
        console.log(
          "Redirect authentication successful:",
          response.account?.name,
        );
        // Store success state in sessionStorage for UI feedback
        sessionStorage.setItem("msal_redirect_success", "true");
      }
    } catch (error) {
      console.error("Error handling redirect response:", error);
      // Store error state for UI feedback
      sessionStorage.setItem("msal_redirect_error", error.message);
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken(useRedirect: boolean = false): Promise<string> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        throw new Error("MSAL instance not initialized");
      }

      // Check if user is already signed in
      const accounts = this.msal.getAllAccounts();
      let account: AccountInfo | null = null;

      if (accounts.length > 0) {
        account = accounts[0];
      } else {
        // No accounts found, need to login
        account = await this.performLogin(useRedirect);
      }

      if (!account) {
        throw new Error("No account found. Please sign in first.");
      }

      // Get access token silently
      try {
        const tokenResponse = await this.msal.acquireTokenSilent({
          ...syncRequest,
          account: account,
        });
        return tokenResponse.accessToken;
      } catch (silentError) {
        console.warn(
          "Silent token acquisition failed, trying interactive auth:",
          silentError,
        );

        // If silent acquisition fails, try interactive authentication
        return await this.performInteractiveAuth(account, useRedirect);
      }
    } catch (error) {
      console.error("Failed to get access token:", error);

      // Handle specific MSAL errors
      if (error instanceof BrowserAuthError) {
        if (error.errorCode === "popup_window_error") {
          throw new Error(
            "Popup windows are blocked. Please enable popups for this site or use redirect-based authentication.",
          );
        }
        if (error.errorCode === "user_cancelled") {
          throw new Error("Authentication was cancelled by user.");
        }
      }

      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Perform login with popup/redirect fallback
   */
  private async performLogin(useRedirect: boolean): Promise<AccountInfo> {
    if (!this.msal) {
      throw new Error("MSAL instance not initialized");
    }

    if (useRedirect) {
      // For redirect, we need to handle the response on page load
      await this.msal.loginRedirect(syncRequest);
      // This will redirect the page, so we won't reach here
      throw new Error("Redirect authentication initiated");
    } else {
      try {
        // Check if popups are blocked before attempting
        if (isPopupBlocked()) {
          const useRedirectFallback = showPopupBlockerWarning();
          if (useRedirectFallback) {
            return await this.performLogin(true);
          } else {
            throw new Error(
              "Popup authentication cannot be used - popups are blocked.",
            );
          }
        }

        const loginResponse = await this.msal.loginPopup(syncRequest);
        return loginResponse.account;
      } catch (error) {
        if (
          error instanceof BrowserAuthError &&
          error.errorCode === "popup_window_error"
        ) {
          const useRedirectFallback = showPopupBlockerWarning();
          if (useRedirectFallback) {
            return await this.performLogin(true);
          }
        }
        throw error;
      }
    }
  }

  /**
   * Perform interactive authentication with popup/redirect fallback
   */
  private async performInteractiveAuth(
    account: AccountInfo,
    useRedirect: boolean,
  ): Promise<string> {
    if (!this.msal) {
      throw new Error("MSAL instance not initialized");
    }

    if (useRedirect) {
      await this.msal.acquireTokenRedirect({
        ...syncRequest,
        account: account,
      });
      // This will redirect the page, so we won't reach here
      throw new Error("Redirect authentication initiated");
    } else {
      try {
        // Check if popups are blocked before attempting
        if (isPopupBlocked()) {
          const useRedirectFallback = showPopupBlockerWarning();
          if (useRedirectFallback) {
            return await this.performInteractiveAuth(account, true);
          } else {
            throw new Error(
              "Interactive authentication cannot be used - popups are blocked.",
            );
          }
        }

        const tokenResponse = await this.msal.acquireTokenPopup({
          ...syncRequest,
          account: account,
        });
        return tokenResponse.accessToken;
      } catch (error) {
        if (
          error instanceof BrowserAuthError &&
          error.errorCode === "popup_window_error"
        ) {
          const useRedirectFallback = showPopupBlockerWarning();
          if (useRedirectFallback) {
            return await this.performInteractiveAuth(account, true);
          }
        }
        throw error;
      }
    }
  }

  /**
   * Sync users from Azure AD
   */
  async syncUsersFromAzure(useRedirect: boolean = false): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(useRedirect);

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
  async testGraphConnection(useRedirect: boolean = false): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(useRedirect);

      const response = await fetch(graphConfig.graphUsersEndpoint + "?$top=1", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

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
   * Check if user has required permissions
   */
  async checkPermissions(useRedirect: boolean = false): Promise<boolean> {
    try {
      await this.testGraphConnection(useRedirect);
      return true;
    } catch (error) {
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        console.error("Insufficient permissions for Azure sync");
        return false;
      }
      throw error;
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
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        throw new Error("MSAL instance not initialized");
      }

      await this.msal.logoutPopup();
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Check if redirect authentication was successful
   */
  getRedirectStatus(): { success: boolean; error?: string } {
    const success = sessionStorage.getItem("msal_redirect_success") === "true";
    const error = sessionStorage.getItem("msal_redirect_error");

    // Clear status after reading
    sessionStorage.removeItem("msal_redirect_success");
    sessionStorage.removeItem("msal_redirect_error");

    return { success, error: error || undefined };
  }

  /**
   * Check if popups are available
   */
  arePopupsAvailable(): boolean {
    return !isPopupBlocked();
  }

  /**
   * Get authentication method recommendation
   */
  getRecommendedAuthMethod(): "popup" | "redirect" {
    return this.arePopupsAvailable() ? "popup" : "redirect";
  }
}

// Export singleton instance
export const azureSyncService = new AzureSyncService();

// Helper function to ensure service is initialized
export const initializeAzureSyncService =
  async (): Promise<AzureSyncService> => {
    await azureSyncService.ensureInitialized();
    return azureSyncService;
  };
