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
  Users,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader,
} from "lucide-react";

export default function DepartmentTestPage() {
  const [departments, setDepartments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Load department mapping on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      addLog("📁 Loading department mapping...");

      const response = await fetch("/api/sso/admin/current-departments");
      const result = await response.json();

      if (result.success && result.data) {
        setDepartments(result.data);
        addLog(
          `✅ Department mapping loaded: ${Object.keys(result.data.departments).length} departments, ${result.data.users.length} users`,
        );

        // Check if Mohan is in the mapping
        const mohanUser = result.data.users.find(
          (u: any) => u.email === "mohan.m@mylapay.com",
        );
        if (mohanUser) {
          addLog(
            `✅ Mohan Raj found in mapping: department=${mohanUser.department}, jobTitle=${mohanUser.jobTitle}`,
          );
        } else {
          addLog("❌ Mohan Raj NOT found in mapping");
        }
      } else {
        addLog("❌ Failed to load department mapping");
      }
    } catch (error) {
      addLog(`❌ Error loading departments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSSOLogin = async () => {
    try {
      addLog("🧪 Testing SSO login for Mohan Raj...");

      // Mock SSO user data as provided by user
      const ssoUser = {
        businessPhones: [],
        displayName: "Mohan Raj Ravichandran",
        givenName: "Mohan Raj",
        jobTitle: "Director Technology",
        mail: "mohan.m@mylapay.com",
        mobilePhone: null,
        officeLocation: null,
        preferredLanguage: "en-US",
        surname: "Ravichandran",
        userPrincipalName: "mohan.m@mylapay.com",
        id: "a416d1c8-bc01-4acd-8cad-3210a78d01a9",
      };

      const response = await fetch("/api/sso/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ssoUser }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        addLog(`✅ SSO Login successful!`);
        addLog(`   User: ${result.user.name}`);
        addLog(`   Email: ${result.user.email}`);
        addLog(`   Department: ${result.user.department}`);
        addLog(`   Role: ${result.user.role}`);
        addLog(`   Job Title: ${result.user.jobTitle}`);
        addLog(
          `   Permissions: ${result.user.permissions?.join(", ") || "None"}`,
        );
      } else {
        addLog(`❌ SSO Login failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ SSO test failed: ${error.message}`);
    }
  };

  const reloadDepartments = async () => {
    try {
      addLog("🔄 Reloading department mapping from JSON...");

      const response = await fetch("/api/sso/admin/load-departments", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        addLog("✅ Department mapping reloaded successfully");
        await loadDepartments(); // Refresh the display
      } else {
        addLog(`❌ Failed to reload departments: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Reload failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Department Mapping Test
        </h1>
        <p className="text-gray-600">
          Test department mapping and SSO login for user authorization
        </p>
      </div>

      {/* Department Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Department Mapping Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Loading department mapping...</span>
            </div>
          ) : departments ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Mapping Loaded
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Departments:</strong>{" "}
                  {Object.keys(departments.departments).length}
                  <ul className="mt-1 text-gray-600">
                    {Object.keys(departments.departments).map((dept) => (
                      <li key={dept}>• {dept}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Users:</strong> {departments.users.length}
                  <ul className="mt-1 text-gray-600">
                    {departments.users.map((user: any) => (
                      <li key={user.email}>
                        • {user.displayName} ({user.department})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <Badge variant="destructive">No Mapping Loaded</Badge>
            </div>
          )}

          <div className="flex space-x-3">
            <Button onClick={loadDepartments} variant="outline" size="sm">
              <Database className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={reloadDepartments} variant="outline" size="sm">
              🔄 Reload from JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SSO Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>SSO Login Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Test SSO login for Mohan Raj Ravichandran (mohan.m@mylapay.com)
          </p>

          {testResult && (
            <div
              className={`p-3 rounded-lg ${testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <h4
                className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}
              >
                {testResult.success
                  ? "✅ Test Result: SUCCESS"
                  : "❌ Test Result: FAILED"}
              </h4>
              {testResult.success ? (
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    <strong>Department:</strong> {testResult.user.department}
                  </p>
                  <p>
                    <strong>Role:</strong> {testResult.user.role}
                  </p>
                  <p>
                    <strong>Job Title:</strong> {testResult.user.jobTitle}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
              )}
            </div>
          )}

          <Button onClick={testSSOLogin} className="w-full">
            🧪 Test SSO Login
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Logs</span>
            <Button onClick={clearLogs} variant="outline" size="sm">
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
