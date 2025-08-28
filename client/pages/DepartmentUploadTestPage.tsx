import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Upload, Users, CheckCircle, XCircle } from "lucide-react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  sso_provider: string;
  created_at: string;
}

const testData = {
  departments: {
    admin: {
      name: "Administration",
      permissions: ["admin", "users", "reports", "settings"],
      users: [],
    },
    development: {
      name: "Development Team",
      permissions: ["product", "development"],
      users: [],
    },
  },
  users: [
    {
      email: "test1@mylapay.com",
      displayName: "Test User 1",
      givenName: "Test",
      surname: "User1",
      jobTitle: "Developer",
      department: "development",
      ssoId: "test-sso-1",
    },
    {
      email: "test2@mylapay.com",
      displayName: "Test User 2",
      givenName: "Test",
      surname: "User2",
      jobTitle: "Admin",
      department: "admin",
      ssoId: "test-sso-2",
    },
    {
      email: "Maanas.m@mylapay.com", // This email exists in database
      displayName: "Maanas M",
      givenName: "Maanas",
      surname: "M",
      jobTitle: "Senior Associate Technology",
      department: "development",
      ssoId: "a8400ea8-5e8a-41ef-aa9a-5621f3822876",
    },
    {
      email: "Prakash.R@mylapay.com", // This email exists in database
      displayName: "Prakash R",
      givenName: "Prakash",
      surname: "R",
      jobTitle: "Associate Technology",
      department: "development",
      ssoId: "304a7b09-f024-45c4-83f3-ca898a356bef",
    },
  ],
};

export default function DepartmentUploadTestPage() {
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExistingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/admin/check-existing-users");
      const result = await response.json();

      if (result.success) {
        setExistingUsers(result.users);
      } else {
        setError(result.message || "Failed to load existing users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResult(null);

      const response = await fetch("/api/auth/admin/upload-departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setTestResult(result);

      // Reload existing users to see changes
      await loadExistingUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExistingUsers();
  }, []);

  const getTestUserStatus = (email: string) => {
    const existsInDb = existingUsers.some(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    return existsInDb;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Department Upload Database Check Test
        </h1>
        <p className="text-gray-600 mt-1">
          Test that department upload correctly checks database and skips
          existing users
        </p>
      </div>

      {/* Current Database Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Current Database Users ({existingUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Users currently in the database - upload should skip these if email
            matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !testResult ? (
            <div className="text-center py-4">
              Loading users from database...
            </div>
          ) : existingUsers.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.department || "N/A"}</TableCell>
                      <TableCell>{user.sso_provider || "Local"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No users found in database
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Test Upload Data ({testData.users.length} users)</span>
          </CardTitle>
          <CardDescription>
            Data that will be uploaded - emails matching database should be
            skipped
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Expected Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testData.users.map((user, index) => {
                const existsInDb = getTestUserStatus(user.email);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      {existsInDb ? (
                        <Badge
                          variant="destructive"
                          className="flex items-center space-x-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Should Skip</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Should Add</span>
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Run Test</CardTitle>
          <CardDescription>
            Upload the test data and verify that existing users are skipped
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button
              onClick={runTest}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>
                {loading ? "Testing..." : "Run Department Upload Test"}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={loadExistingUsers}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Refresh Database Users</span>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <Alert
              className={
                testResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {testResult.success
                      ? "✅ Test Completed"
                      : "❌ Test Failed"}
                  </div>
                  <div className="text-sm whitespace-pre-line">
                    {testResult.message}
                  </div>
                  {testResult.data && (
                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Results:</strong>
                      </div>
                      <div>• Users in upload: {testData.users.length}</div>
                      <div>
                        • New users added: {testResult.data.newUserCount}
                      </div>
                      <div>
                        • Users skipped (in database):{" "}
                        {testResult.data.skippedInDatabase}
                      </div>
                      <div>
                        • Users skipped (in JSON):{" "}
                        {testResult.data.skippedInJson}
                      </div>
                      <div>
                        • Total users in system:{" "}
                        {testResult.data.totalUsersInJson}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
