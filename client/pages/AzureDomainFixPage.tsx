import React, { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Copy,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Globe,
  Settings,
} from "lucide-react";

export default function AzureDomainFixPage() {
  const [copied, setCopied] = useState("");

  // Get the exact current domain
  const currentDomain =
    "d7b2d3c602404b4b86d25bbaa919fce3-ff6713a8d48143f18afd4ef92.fly.dev";
  const protocol = "https://";
  const fullDomain = `${protocol}${currentDomain}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  // Exact redirect URIs needed for this domain
  const redirectURIs = [
    fullDomain,
    `${fullDomain}/`,
    `${fullDomain}/login`,
    `${fullDomain}/auth/callback`,
    `${fullDomain}/admin`,
  ];

  const azureConfig = {
    clientId: "d982ffb1-9734-4470-bf4d-1b23b434edd3",
    tenantId: "13ae5dfc-2750-47cb-8eca-689b5bc353b6",
    authenticationUrl: `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/d982ffb1-9734-4470-bf4d-1b23b434edd3`,
    permissionsUrl: `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/d982ffb1-9734-4470-bf4d-1b23b434edd3`,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Azure AD Domain Configuration Fix
        </h1>
        <p className="text-gray-600">
          Configure Azure AD for your specific Fly.dev domain
        </p>
      </div>

      {/* Critical Issue Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Critical: Domain Mismatch Detected</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-red-800 text-sm font-medium mb-2">
              ❌ <strong>Root Cause Found:</strong> Azure AD doesn't recognize
              your Fly.dev domain
            </p>
            <p className="text-red-700 text-sm">
              Even with admin consent granted, Azure AD rejects authentication
              requests from unauthorized domains for security reasons.
            </p>
          </div>

          <div className="p-3 bg-yellow-100 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Your Current Domain:</strong>{" "}
              <code className="bg-yellow-200 px-1 rounded">
                {currentDomain}
              </code>
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              This exact domain must be added to Azure AD redirect URIs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Domain Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Your Fly.dev Domain</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Current Application URL
                </p>
                <p className="font-mono text-blue-900 text-lg">{fullDomain}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(fullDomain, "domain")}
              >
                {copied === "domain" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Redirect URIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Required Azure AD Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-3">
              🔧 Step 1: Add These Exact Redirect URIs
            </h4>
            <p className="text-orange-700 text-sm mb-3">
              Copy each URL below and add them to Azure AD → Authentication →
              Redirect URIs:
            </p>

            <div className="space-y-2">
              {redirectURIs.map((uri, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 bg-white border rounded"
                >
                  <code className="flex-1 text-sm font-mono">{uri}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(uri, `uri-${index}`)}
                  >
                    {copied === `uri-${index}` ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-3">
              ✅ Step 2: Verify Token Settings
            </h4>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Access tokens (used for implicit flows):{" "}
                  <strong>Enabled</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>
                  ID tokens (used for implicit and hybrid flows):{" "}
                  <strong>Enabled</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Allow public client flows: <strong>Yes</strong>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Exact Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                🔧 Azure Portal Steps
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>Click "Open Azure AD Authentication" below</li>
                <li>Scroll to "Platform configurations" section</li>
                <li>
                  If you see existing "Web" platforms, click "Configure" on one
                  of them
                </li>
                <li>
                  If no Web platforms exist, click "Add a platform" → "Web"
                </li>
                <li>
                  Add ALL the redirect URIs listed above (copy/paste each one)
                </li>
                <li>Check ✅ "Access tokens" and ✅ "ID tokens"</li>
                <li>Click "Save" or "Configure"</li>
                <li>Wait 2-3 minutes for Azure AD to propagate changes</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                🧪 Test After Configuration
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700">
                <li>Clear browser cache completely</li>
                <li>
                  Go to <code>/login</code> page
                </li>
                <li>Click "Sign in with Microsoft"</li>
                <li>Should now work without "admin approval" error</li>
                <li>Should show "Mohan Raj Ravichandran" with admin role</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() =>
                window.open(azureConfig.authenticationUrl, "_blank")
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Azure AD Authentication
            </Button>

            <Button
              onClick={() => window.open(azureConfig.permissionsUrl, "_blank")}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Verify Permissions
            </Button>

            <Button
              onClick={() => {
                // Clear cache and redirect to login
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              variant="outline"
            >
              🧪 Test SSO Login
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle>App Registration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-medium">Client ID</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs">{azureConfig.clientId}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(azureConfig.clientId, "clientId")
                  }
                >
                  {copied === "clientId" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <p className="font-medium">Tenant ID</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs">{azureConfig.tenantId}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(azureConfig.tenantId, "tenantId")
                  }
                >
                  {copied === "tenantId" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
