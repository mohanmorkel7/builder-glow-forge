import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { User, RefreshCw, Trash2, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function AuthDebugPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [msalData, setMsalData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { user, logout } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = () => {
    try {
      // Get localStorage auth data
      const storedUser = localStorage.getItem("banani_user");
      const msalAccount = localStorage.getItem("msal_account");

      if (storedUser) {
        setAuthData(JSON.parse(storedUser));
        addLog(
          `📱 Found localStorage auth data for: ${JSON.parse(storedUser).email}`,
        );
      } else {
        addLog("📱 No localStorage auth data found");
      }

      if (msalAccount) {
        setMsalData(JSON.parse(msalAccount));
        addLog(`🔑 Found MSAL account data`);
      } else {
        addLog("🔑 No MSAL account data found");
      }
    } catch (error) {
      addLog(`❌ Error loading auth data: ${error.message}`);
    }
  };

  const clearAuthData = () => {
    try {
      localStorage.removeItem("banani_user");
      localStorage.removeItem("msal_account");
      setAuthData(null);
      setMsalData(null);
      addLog("🗑️ Cleared all auth data from localStorage");
    } catch (error) {
      addLog(`❌ Error clearing auth data: ${error.message}`);
    }
  };

  const testSSOEndpoint = async () => {
    try {
      addLog("🧪 Testing SSO endpoint with Mohan's data...");

      const ssoUser = {
        id: "a416d1c8-bc01-4acd-8cad-3210a78d01a9",
        mail: "mohan.m@mylapay.com",
        displayName: "Mohan Raj Ravichandran",
        givenName: "Mohan Raj",
        surname: "Ravichandran",
        jobTitle: "Director Technology",
        userPrincipalName: "mohan.m@mylapay.com",
      };

      const response = await fetch("/api/sso/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ssoUser }),
      });

      const result = await response.json();

      if (result.success) {
        addLog(`✅ SSO endpoint test successful!`);
        addLog(`   User: ${result.user.name}`);
        addLog(`   Email: ${result.user.email}`);
        addLog(`   Department: ${result.user.department}`);
        addLog(`   Role: ${result.user.role}`);
      } else {
        addLog(`❌ SSO endpoint test failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ SSO endpoint test error: ${error.message}`);
    }
  };

  const forceLogout = () => {
    logout();
    clearAuthData();
    addLog("🚪 Forced logout and cleared all data");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Authentication Debug
        </h1>
        <p className="text-gray-600">
          Debug and manage authentication state and cached data
        </p>
      </div>

      {/* Current Auth Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Current Auth Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Authenticated
              </Badge>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
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
                  <strong>Department:</strong> {user.department || "N/A"}
                </p>
                <p>
                  <strong>Job Title:</strong> {user.jobTitle || "N/A"}
                </p>
                <p>
                  <strong>Azure Object ID:</strong>{" "}
                  {user.azureObjectId || "N/A"}
                </p>
                <p>
                  <strong>SSO ID:</strong> {user.ssoId || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">Not Authenticated</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* localStorage Data */}
      <Card>
        <CardHeader>
          <CardTitle>localStorage Auth Data</CardTitle>
        </CardHeader>
        <CardContent>
          {authData ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(authData, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500">No localStorage auth data found</p>
          )}
        </CardContent>
      </Card>

      {/* MSAL Data */}
      <Card>
        <CardHeader>
          <CardTitle>MSAL Account Data</CardTitle>
        </CardHeader>
        <CardContent>
          {msalData ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(msalData, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500">No MSAL account data found</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex space-x-3">
            <Button onClick={loadAuthData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>

            <Button onClick={clearAuthData} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear localStorage
            </Button>

            <Button onClick={testSSOEndpoint} variant="outline" size="sm">
              🧪 Test SSO Endpoint
            </Button>

            <Button onClick={forceLogout} variant="destructive" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Force Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Debug Logs</span>
            <Button onClick={() => setLogs([])} variant="outline" size="sm">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
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
