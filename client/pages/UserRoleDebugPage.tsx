import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw } from "lucide-react";

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

export default function UserRoleDebugPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/admin/check-existing-users");
      const result = await response.json();

      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.message || "Failed to load users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Group users by role for analysis
  const roleGroups = users.reduce(
    (acc, user) => {
      const role = user.role || "null/undefined";
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    },
    {} as Record<string, User[]>,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Role Debug</h1>
          <p className="text-gray-600 mt-1">
            Debug page to check actual user roles in database
          </p>
        </div>
        <Button onClick={loadUsers} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Role Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Role Summary ({users.length} total users)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(roleGroups).map(([role, userList]) => (
              <div key={role} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {userList.length}
                </div>
                <div className="text-sm text-gray-600">
                  <Badge
                    variant={
                      role === "null/undefined" ? "destructive" : "secondary"
                    }
                  >
                    {role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users with Roles</CardTitle>
          <CardDescription>
            Raw data from database to debug role grouping issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !user.role || user.role === "null"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {user.role || "NULL"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || "N/A"}</TableCell>
                    <TableCell>{user.sso_provider || "Local"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role-wise Grouping */}
      {Object.entries(roleGroups).map(([role, userList]) => (
        <Card key={role}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge
                variant={
                  role === "null/undefined" ? "destructive" : "secondary"
                }
              >
                {role}
              </Badge>
              <span>({userList.length} users)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {userList.map((user) => (
                <div key={user.id} className="text-sm p-2 border rounded">
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    Dept: {user.department || "None"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
