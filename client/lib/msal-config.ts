import { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId:
      import.meta.env.VITE_AZURE_CLIENT_ID ||
      "d982ffb1-9734-4470-bf4d-1b23b434edd3", // Replace with your Azure AD app client ID
    authority:
      import.meta.env.VITE_AZURE_AUTHORITY ||
      "https://login.microsoftonline.com/13ae5dfc-2750-47cb-8eca-689b5bc353b6", // Replace with your tenant ID if needed
    redirectUri:
      import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

// Add scopes here for ID token to be used at Microsoft Graph API endpoints.
export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

// Add scopes for Azure AD sync functionality
export const syncRequest: PopupRequest = {
  scopes: ["User.Read.All", "Directory.Read.All", "openid", "profile", "email"],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphUsersEndpoint: "https://graph.microsoft.com/v1.0/users",
};
