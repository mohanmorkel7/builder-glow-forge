import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { azureSilentAuth } from "../lib/azure-silent-auth";
import { Cloud, CheckCircle, AlertTriangle, Users, Loader } from "lucide-react";

export default function AzureTestPage() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected" | "authenticating"
  >("checking");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        addLog("🔄 Checking authentication status...");

        // Handle return from Azure AD if applicable
        const token = await azureSilentAuth.handleAuthReturn();
        if (token) {
          addLog("✅ Successfully returned from Azure AD authentication");
          setStatus("connected");
          return;
        }

        // Check if already authenticated
        const isAuth = await azureSilentAuth.isAuthenticated();
        if (isAuth) {
          const user = await azureSilentAuth.getCurrentUser();
          setCurrentUser(user);
          setStatus("connected");
          addLog("✅ Already authenticated with Azure AD");
        } else {
          setStatus("disconnected");
          addLog("❌ Not authenticated with Azure AD");
        }
      } catch (error) {
        setStatus("disconnected");
        addLog(`❌ Authentication check failed: ${error.message}`);
      }
    };

    checkAuth();
  }, []);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      addLog("🔍 Testing Azure AD connection...");
      setStatus("authenticating");

      const result = await azureSilentAuth.testGraphConnection();

      if (result) {
        setStatus("connected");
        const user = await azureSilentAuth.getCurrentUser();
        setCurrentUser(user);
        addLog("✅ Azure AD connection test successful!");
        addLog(
          `📊 Retrieved ${result.value?.length || 0} test users from Graph API`,
        );
      }
    } catch (error) {
      if (error.message.includes("Redirecting to Azure AD")) {
        addLog("🔄 Redirecting to Azure AD for authentication...");
        setStatus("authenticating");
        // The redirect will happen automatically
        return;
      }

      setStatus("disconnected");
      addLog(`❌ Connection test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    setIsLoading(true);
    try {
      addLog("🚀 Starting Azure AD user sync...");

      const result = await azureSilentAuth.syncUsersFromAzure();

      if (result.success) {
        addLog("✅ Azure AD sync completed successfully!");
        addLog(
          `📊 Stats: Total: ${result.stats.total}, New: ${result.stats.inserted}, Updated: ${result.stats.updated}`,
        );
        addLog(`💾 JSON saved as: ${result.jsonFile}`);
      } else {
        addLog(`❌ Sync failed: ${result.message}`);
      }
    } catch (error) {
      if (error.message.includes("Redirecting to Azure AD")) {
        addLog("🔄 Redirecting to Azure AD for authentication...");
        setStatus("authenticating");
        return;
      }

      addLog(`❌ Sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      addLog("🔓 Signing out...");
      await azureSilentAuth.signOut();
      setStatus("disconnected");
      setCurrentUser(null);
      addLog("✅ Signed out successfully");
    } catch (error) {
      addLog(`❌ Sign out failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Azure AD Silent Authentication Test
        </h1>
        <p className="text-gray-600">
          Testing Azure authentication without popups or alerts - similar to
          Python device flow
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Authentication Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {status === "connected" && (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Connected
                </Badge>
              </>
            )}
            {status === "disconnected" && (
              <>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <Badge variant="destructive">Disconnected</Badge>
              </>
            )}
            {(status === "checking" || status === "authenticating") && (
              <>
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                <Badge variant="outline" className="text-blue-600">
                  {status === "checking" ? "Checking..." : "Authenticating..."}
                </Badge>
              </>
            )}
          </div>

          {currentUser && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Current User</h4>
              <p className="text-sm text-gray-600">Name: {currentUser.name}</p>
              <p className="text-sm text-gray-600">
                Email: {currentUser.username}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Test Connection</span>
            </Button>

            <Button
              onClick={handleSyncUsers}
              disabled={isLoading || status !== "connected"}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              <span>Sync Users</span>
            </Button>

            {status === "connected" && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Logs</span>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity logs yet...</p>
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

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>🔄 Silent Authentication:</strong> First tries to get tokens
            from cache (similar to Python's <code>acquire_token_silent</code>)
          </p>
          <p>
            <strong>🔀 Automatic Redirect:</strong> If no cached tokens,
            automatically redirects to Azure AD (similar to Python's device flow
            but using browser redirect)
          </p>
          <p>
            <strong>🚫 No Popups/Alerts:</strong> All messages are logged to
            console and activity log - no browser popups or alert dialogs
          </p>
          <p>
            <strong>🔙 Seamless Return:</strong> After Azure AD authentication,
            automatically returns to this page with tokens
          </p>
          <p>
            <strong>💾 Token Caching:</strong> Tokens are cached in localStorage
            with expiration handling
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
