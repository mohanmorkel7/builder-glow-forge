import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  Settings,
  Globe,
  Key,
} from "lucide-react";

export default function AzureConfigPage() {
  const [currentDomain, setCurrentDomain] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setCurrentDomain(window.location.origin);
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  const azureConfig = {
    clientId: "d982ffb1-9734-4470-bf4d-1b23b434edd3",
    tenantId: "13ae5dfc-2750-47cb-8eca-689b5bc353b6",
    currentRedirectUri: currentDomain,
    requiredRedirectUris: [
      currentDomain,
      `${currentDomain}/`,
      `${currentDomain}/login`,
      `${currentDomain}/admin`,
    ],
  };

  const openAzurePortal = (section: string) => {
    const baseUrl = `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/appId/${azureConfig.clientId}`;
    const sectionUrls = {
      overview: `${baseUrl}/~/Overview`,
      authentication: `${baseUrl}/~/Authentication`,
      permissions: `${baseUrl}/~/CallAnAPI`,
      manifest: `${baseUrl}/~/Manifest`,
    };

    window.open(sectionUrls[section] || baseUrl, "_blank");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Azure AD Configuration Checker
        </h1>
        <p className="text-gray-600">
          Verify and fix Azure AD app registration for Fly.dev deployment
        </p>
      </div>

      {/* Current Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Current Environment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <strong>Current Domain:</strong>
            </p>
            <p className="font-mono text-blue-800">{currentDomain}</p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm">
              <strong>Deployment Platform:</strong>
            </p>
            <p className="text-green-800">✅ Fly.dev (Production)</p>
          </div>
        </CardContent>
      </Card>

      {/* Azure App Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Azure App Registration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Client ID</p>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-sm">{azureConfig.clientId}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(azureConfig.clientId, "clientId")
                  }
                >
                  {copied === "clientId" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Tenant ID</p>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-sm">{azureConfig.tenantId}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(azureConfig.tenantId, "tenantId")
                  }
                >
                  {copied === "tenantId" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => openAzurePortal("overview")}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Overview
            </Button>
            <Button
              onClick={() => openAzurePortal("authentication")}
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Authentication
            </Button>
            <Button
              onClick={() => openAzurePortal("permissions")}
              variant="outline"
            >
              <Key className="w-4 h-4 mr-2" />
              Open Permissions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Required Azure AD Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Redirect URIs */}
          <div>
            <h4 className="font-medium text-lg mb-3">
              1. Redirect URIs (Authentication)
            </h4>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-yellow-800 text-sm mb-2">
                <strong>⚠️ Critical:</strong> Your Fly.dev domain must be added
                to Azure AD redirect URIs
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Add these redirect URIs in Azure Portal → Authentication →
                Platform configurations:
              </p>
              {azureConfig.requiredRedirectUris.map((uri, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                >
                  <code className="flex-1 text-sm">{uri}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(uri, `uri-${index}`)}
                  >
                    {copied === `uri-${index}` ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* API Permissions */}
          <div>
            <h4 className="font-medium text-lg mb-3">2. API Permissions</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  User.Read.All (Admin consent required)
                </span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  Granted
                </Badge>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  Directory.Read.All (Admin consent required)
                </span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  Granted
                </Badge>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">openid, profile, email</span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  Standard
                </Badge>
              </div>
            </div>
          </div>

          {/* Token Configuration */}
          <div>
            <h4 className="font-medium text-lg mb-3">3. Token Configuration</h4>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Ensure these token settings are configured:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>Access tokens (used for implicit flows): ✅ Enabled</li>
                <li>
                  ID tokens (used for implicit and hybrid flows): ✅ Enabled
                </li>
                <li>Allow public client flows: ��� Yes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                🔧 Step 1: Update Redirect URIs
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Click "Open Authentication" button above</li>
                <li>Go to "Platform configurations" section</li>
                <li>Click "Add a platform" → "Web"</li>
                <li>Add all the redirect URIs listed above</li>
                <li>Check both "Access tokens" and "ID tokens"</li>
                <li>Click "Configure"</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                ✅ Step 2: Verify Permissions
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Click "Open Permissions" button above</li>
                <li>Confirm all permissions show "Granted for [Your Org]"</li>
                <li>
                  If any show "Not granted", click "Grant admin consent" again
                </li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                🧪 Step 3: Test SSO
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700">
                <li>Clear browser cache and localStorage</li>
                <li>
                  Go to <code>/login</code> page
                </li>
                <li>Click "Sign in with Microsoft"</li>
                <li>You should now see admin role instead of development</li>
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
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => openAzurePortal("authentication")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Fix Redirect URIs
            </Button>

            <Button
              onClick={() => openAzurePortal("permissions")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Verify Permissions
            </Button>

            <Button
              onClick={() => (window.location.href = "/login")}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test SSO Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
