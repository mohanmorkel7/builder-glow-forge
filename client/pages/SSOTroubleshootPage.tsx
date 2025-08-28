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
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Settings,
  LogOut,
  TestTube,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function SSOTroubleshootPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const { user, logout, loginWithSSO } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => setLogs([]);

  const clearBrowserData = () => {
    addLog("🧹 Clearing browser authentication data...");

    // Clear localStorage
    localStorage.removeItem("banani_user");
    localStorage.removeItem("msal_account");

    // Clear sessionStorage
    sessionStorage.clear();

    addLog("✅ Browser data cleared");
  };

  const testMicrosoftSSO = async () => {
    setTesting(true);
    try {
      addLog("🧪 Testing Microsoft SSO login...");
      addLog("📱 This will open Azure AD login popup");

      const success = await loginWithSSO("microsoft");

      if (success) {
        addLog("✅ Microsoft SSO login successful!");
      } else {
        addLog("❌ Microsoft SSO login failed");
      }
    } catch (error) {
      addLog(`❌ SSO test error: ${error.message}`);

      // Check for specific error types
      if (error.message.includes("admin consent")) {
        addLog("🔒 Admin consent issue detected");
        addLog("📋 This requires Azure AD administrator action");
      } else if (error.message.includes("popup")) {
        addLog("🚫 Popup blocker detected");
        addLog("💡 Try allowing popups for this site");
      }
    } finally {
      setTesting(false);
    }
  };

  const forceLogout = () => {
    addLog("🚪 Forcing logout...");
    clearBrowserData();
    logout();
    addLog("✅ Logout completed");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  const openAzurePortal = () => {
    const azureUrl =
      "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/d982ffb1-9734-4470-bf4d-1b23b434edd3";
    window.open(azureUrl, "_blank");
    addLog("🔗 Opened Azure AD app registration");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SSO Troubleshooting
        </h1>
        <p className="text-gray-600">
          Diagnose and fix Microsoft SSO authentication issues
        </p>
      </div>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Current Authentication State</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Authenticated
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  <Badge variant="outline">{user.role}</Badge>
                </p>
                <p>
                  <strong>Auth Method:</strong>{" "}
                  {user.azureObjectId ? "Microsoft SSO" : "Demo Login"}
                </p>
              </div>
              {user.azureObjectId ? (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  ✅ Microsoft SSO Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  ⚠️ Using Demo Login
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <Badge variant="destructive">Not Authenticated</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Azure AD Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5" />
            <span>Azure AD Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium mb-2">Current Azure App Registration:</p>
            <p>
              <strong>Client ID:</strong> d982ffb1-9734-4470-bf4d-1b23b434edd3
            </p>
            <p>
              <strong>Tenant ID:</strong> 13ae5dfc-2750-47cb-8eca-689b5bc353b6
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-medium text-yellow-800 mb-2">
              Required Permissions:
            </p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>User.Read.All (Admin consent required)</li>
              <li>Directory.Read.All (Admin consent required)</li>
              <li>openid, profile, email (User consent)</li>
            </ul>
          </div>

          <Button
            onClick={openAzurePortal}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Azure AD App Registration
          </Button>
        </CardContent>
      </Card>

      {/* Troubleshooting Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={clearBrowserData}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Browser Data</span>
            </Button>

            <Button
              onClick={testMicrosoftSSO}
              disabled={testing}
              className="flex items-center space-x-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>Test Microsoft SSO</span>
            </Button>

            <Button
              onClick={forceLogout}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Force Logout & Reset</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/login")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Go to Login Page</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Resolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                🔄 Method 1: Clear & Retry
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Click "Clear Browser Data" above</li>
                <li>Click "Force Logout & Reset"</li>
                <li>Go to login page and try Microsoft SSO again</li>
              </ol>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                🔧 Method 2: Re-verify Azure AD
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-green-700">
                <li>Click "Open Azure AD App Registration" above</li>
                <li>Go to "API permissions" section</li>
                <li>Verify "Grant admin consent" is green/approved</li>
                <li>If not green, click "Grant admin consent" again</li>
              </ol>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                🧪 Method 3: Direct Test
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-purple-700">
                <li>Click "Test Microsoft SSO" above</li>
                <li>Watch the logs for specific error details</li>
                <li>Follow any specific guidance from error messages</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Debug Logs</span>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">
                No logs yet. Try the troubleshooting actions above.
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
