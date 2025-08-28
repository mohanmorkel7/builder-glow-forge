import React, { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Upload,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Download,
  FileJson,
} from "lucide-react";

export default function AzureImportDemoPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Example JSON with and without department
  const exampleJson = {
    value: [
      {
        id: "a416d1c8-bc01-4acd-8cad-3210a78d01a9",
        mail: "mohan.m@mylapay.com",
        displayName: "Mohan Raj Ravichandran",
        givenName: "Mohan Raj",
        surname: "Ravichandran",
        jobTitle: "Director Technology",
        department: "admin",
        accountEnabled: true,
        businessPhones: [],
      },
      {
        id: "b527e2d9-cd12-5bde-9def-4321b545fee8",
        mail: "john.doe@mylapay.com",
        displayName: "John Doe",
        givenName: "John",
        surname: "Doe",
        jobTitle: "Software Engineer",
        accountEnabled: true,
        businessPhones: [],
      },
      {
        id: "c638f3ea-de23-6cef-0ef1-5432c656gff9",
        mail: "jane.smith@mylapay.com",
        displayName: "Jane Smith",
        givenName: "Jane",
        surname: "Smith",
        jobTitle: "Project Manager",
        accountEnabled: true,
        businessPhones: [],
      },
    ],
  };

  const handleImport = async () => {
    setLoading(true);
    setImportResult(null);

    try {
      addLog("📤 Starting Azure AD import simulation...");

      if (!jsonInput.trim()) {
        throw new Error("Please provide JSON data to import");
      }

      // Parse the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseError) {
        throw new Error("Invalid JSON format. Please check your input.");
      }

      // Simulate import processing
      addLog(`📋 Processing ${parsedData.value?.length || 0} users...`);

      // Analyze each user
      const analysis = {
        withDepartment: [],
        withoutDepartment: [],
        total: 0,
      };

      if (parsedData.value && Array.isArray(parsedData.value)) {
        for (const user of parsedData.value) {
          analysis.total++;

          if (user.department) {
            analysis.withDepartment.push({
              email: user.mail || user.userPrincipalName,
              name: user.displayName,
              department: user.department,
              assignedRole: getDepartmentRole(user.department),
            });
            addLog(
              `✅ ${user.displayName} → department: ${user.department} → role: ${getDepartmentRole(user.department)}`,
            );
          } else {
            analysis.withoutDepartment.push({
              email: user.mail || user.userPrincipalName,
              name: user.displayName,
              assignedRole: "unknown",
            });
            addLog(
              `⚠️ ${user.displayName} → no department → role: unknown (needs manual assignment)`,
            );
          }
        }
      }

      setImportResult(analysis);
      addLog(
        `📊 Import analysis complete: ${analysis.withDepartment.length} with departments, ${analysis.withoutDepartment.length} without departments`,
      );

      if (analysis.withoutDepartment.length > 0) {
        addLog(
          `🎯 Users without departments will appear in the "Assign Roles" page for manual assignment`,
        );
      }
    } catch (error) {
      addLog(`❌ Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentRole = (department: string): string => {
    const departmentRoleMap: { [key: string]: string } = {
      hr: "hr_management",
      finance: "finance",
      finops: "finops",
      database: "db",
      frontend: "development",
      backend: "development",
      infra: "infra",
      admin: "admin",
      administration: "admin",
    };
    return departmentRoleMap[department] || "development";
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(exampleJson, null, 2));
    addLog("📝 Loaded example JSON with mixed department data");
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Azure AD Import Demo
        </h1>
        <p className="text-gray-600">
          Demonstrate how users without department info become "unknown" users
          for role assignment
        </p>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileJson className="w-5 h-5" />
            <span>How Azure Import Handles Missing Departments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                ✅ With Department Field
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  • User has <code>"department": "admin"</code>
                </p>
                <p>
                  • Automatically assigned <code>role: "admin"</code>
                </p>
                <p>• Ready to use immediately</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                ⚠️ Without Department Field
              </h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>
                  • User missing <code>"department"</code> field
                </p>
                <p>
                  • Assigned <code>role: "unknown"</code>
                </p>
                <p>• Appears in "Assign Roles" for manual assignment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Input */}
      <Card>
        <CardHeader>
          <CardTitle>Import JSON Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3 mb-4">
            <Button onClick={loadExample} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Load Example JSON
            </Button>
          </div>

          <Textarea
            placeholder="Paste your Azure AD JSON data here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />

          <Button
            onClick={handleImport}
            disabled={loading || !jsonInput.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing Import...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Analyze Import Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Import Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.total}
                </div>
                <div className="text-sm text-blue-700">Total Users</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.withDepartment.length}
                </div>
                <div className="text-sm text-green-700">With Department</div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.withoutDepartment.length}
                </div>
                <div className="text-sm text-yellow-700">Unknown Users</div>
              </div>
            </div>

            {/* Users with departments */}
            {importResult.withDepartment.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">
                  ✅ Users with Departments (Auto-assigned roles)
                </h4>
                <div className="space-y-2">
                  {importResult.withDepartment.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({user.email})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{user.department}</Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="default">{user.assignedRole}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users without departments */}
            {importResult.withoutDepartment.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">
                  ⚠️ Unknown Users (Need manual role assignment)
                </h4>
                <div className="space-y-2">
                  {importResult.withoutDepartment.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({user.email})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-600"
                        >
                          No Department
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="destructive">{user.assignedRole}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded border">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Next Step:</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    These users will appear in the{" "}
                    <strong>"Assign Roles"</strong> page where you can bulk
                    assign departments and roles.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Azure AD Sync</h4>
                <p className="text-sm text-gray-600">
                  Import users from Azure AD (some with/without departments)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Auto-assignment</h4>
                <p className="text-sm text-gray-600">
                  Users with departments get roles automatically, others become
                  "unknown"
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Manual Assignment</h4>
                <p className="text-sm text-gray-600">
                  Use "Assign Roles" page to bulk assign departments/roles to
                  unknown users
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={() =>
                (window.location.href = "/admin/users/azure-role-assignment")
              }
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Go to Assign Roles Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Logs</span>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">
                No logs yet. Try analyzing some JSON data above.
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
