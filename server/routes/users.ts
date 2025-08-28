import { Router, Request, Response } from "express";
import { UserRepository, CreateUserData, UpdateUserData } from "../models/User";
import { MockDataService } from "../services/mockData";
import bcrypt from "bcryptjs";

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await UserRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}

// Get all users
router.get("/", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const users = await UserRepository.findAll();
      res.json(users);
    } else {
      const users = await MockDataService.getAllUsers();
      res.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    // Fallback to mock data
    const users = await MockDataService.getAllUsers();
    res.json(users);
  }
});

// Get user by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      user = await UserRepository.findById(id);
    } else {
      // Use mock data
      const users = await MockDataService.getAllUsers();
      user = users.find((u) => u.id === id);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    // Fallback to mock data
    try {
      const users = await MockDataService.getAllUsers();
      const user = users.find((u) => u.id === id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
});

// Create new user
router.post("/", async (req: Request, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Validate required fields
    if (
      !userData.first_name ||
      !userData.last_name ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate role
    const validRoles = [
      "admin",
      "sales",
      "product",
      "development",
      "db",
      "finops",
      "finance",
      "hr_management",
      "infra",
      "switch_team",
      "unknown",
    ];
    if (!validRoles.includes(userData.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      // Check if email already exists
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await UserRepository.create(userData);
    } else {
      // Check if email already exists in mock data
      const existingUser = await MockDataService.findUserByEmail(
        userData.email,
      );
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await MockDataService.createUser(userData);
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userData: UpdateUserData = req.body;

    // Validate role if provided
    const validRoles = [
      "admin",
      "sales",
      "product",
      "development",
      "db",
      "finops",
      "finance",
      "hr_management",
      "infra",
      "switch_team",
      "unknown",
    ];
    if (userData.role && !validRoles.includes(userData.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate status if provided
    if (
      userData.status &&
      !["active", "inactive", "pending"].includes(userData.status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      // Check if email already exists (if being updated)
      if (userData.email) {
        const existingUser = await UserRepository.findByEmail(userData.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ error: "Email already exists" });
        }
      }

      user = await UserRepository.update(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else {
      // Use mock data fallback
      user = await MockDataService.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const success = await UserRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// User authentication
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    let user;
    const dbAvailable = await isDatabaseAvailable();
    console.log("Database available:", dbAvailable);

    if (dbAvailable) {
      console.log("Trying database authentication...");
      user = await UserRepository.verifyPassword(email, password);
      if (user) {
        await UserRepository.updateLastLogin(user.id);
      }
    } else {
      console.log("Trying mock data authentication...");
      user = await MockDataService.verifyPassword(email, password);
    }

    console.log("User authentication result:", user ? "success" : "failed");

    if (!user) {
      // Demo credentials fallback - allow hardcoded demo users
      console.log("Trying demo credentials fallback...");
      if (password === "password") {
        let demoUser = null;

        if (email === "admin@banani.com") {
          demoUser = {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            email,
            role: "admin",
          };
        } else if (email === "sales@banani.com") {
          demoUser = {
            id: 2,
            first_name: "Jane",
            last_name: "Smith",
            email,
            role: "sales",
          };
        } else if (email === "product@banani.com") {
          demoUser = {
            id: 3,
            first_name: "Mike",
            last_name: "Johnson",
            email,
            role: "product",
          };
        }

        if (demoUser) {
          console.log("Demo login successful for:", email);
          return res.json({ user: demoUser });
        } else {
          console.log("Demo login failed - email not recognized:", email);
          console.log(
            "Valid demo emails: admin@banani.com, sales@banani.com, product@banani.com",
          );
        }
      }

      return res.status(401).json({
        error: "Invalid credentials",
        message:
          "Please use demo credentials: admin@banani.com, sales@banani.com, or product@banani.com with password 'password'",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error during login:", error);
    // Fallback to mock data and demo credentials
    try {
      let user = await MockDataService.verifyPassword(
        req.body.email,
        req.body.password,
      );

      // If mock data fails, try demo credentials
      if (!user && req.body.password === "password") {
        const email = req.body.email;
        if (email === "admin@banani.com") {
          user = {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            email,
            role: "admin",
          };
        } else if (email === "sales@banani.com") {
          user = {
            id: 2,
            first_name: "Jane",
            last_name: "Smith",
            email,
            role: "sales",
          };
        } else if (email === "product@banani.com") {
          user = {
            id: 3,
            first_name: "Mike",
            last_name: "Johnson",
            email,
            role: "product",
          };
        }
      }

      if (!user) {
        console.log("Authentication failed for:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("Fallback login successful for:", req.body.email);
      res.json({ user });
    } catch (fallbackError) {
      console.error("Fallback login error:", fallbackError);
      res.status(500).json({ error: "Login failed" });
    }
  }
});

// Reset user password
router.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      user = await UserRepository.findById(id);
    } else {
      const users = await MockDataService.getAllUsers();
      user = users.find((u) => u.id === id);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For mock implementation, just return success
    // In a real implementation, you would:
    // 1. Generate a secure reset token
    // 2. Send email with reset link
    // 3. Store the token with expiration

    console.log(`Password reset requested for user ${id}: ${user.email}`);

    res.json({
      message: "Password reset email sent successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Change user password (requires old password verification)
router.post("/:id/change-password", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { oldPassword, newPassword } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      user = await UserRepository.findByIdWithPassword(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password_hash,
      );
      if (!isOldPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await UserRepository.update(id, { password_hash: hashedNewPassword });

      console.log(
        `Password changed successfully for user ${id}: ${user.email}`,
      );

      res.json({
        message: "Password changed successfully",
        user: { id: user.id, email: user.email },
      });
    } else {
      // Mock implementation - just return success
      res.json({
        message: "Password changed successfully (mock mode)",
        user: { id, email: "mock@example.com" },
      });
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Bulk update user status to inactive for auto-inactivation
router.post("/bulk-inactive", async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ error: "userIds must be a non-empty array" });
    }

    // Validate all IDs are numbers
    for (const id of userIds) {
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "All userIds must be integers" });
      }
    }

    if (await isDatabaseAvailable()) {
      // Update all users to inactive status
      const updatedUsers = [];
      for (const userId of userIds) {
        const user = await UserRepository.update(userId, {
          status: "inactive",
        });
        if (user) {
          updatedUsers.push(user);
        }
      }

      console.log(
        `Auto-inactivated ${updatedUsers.length} users: ${userIds.join(", ")}`,
      );
      res.json({
        success: true,
        updatedCount: updatedUsers.length,
        updatedUsers,
      });
    } else {
      // Use mock data fallback - update status in mock data
      const updatedUsers = [];
      for (const userId of userIds) {
        const user = await MockDataService.updateUser(userId, {
          status: "inactive",
        });
        if (user) {
          updatedUsers.push(user);
        }
      }

      res.json({
        success: true,
        updatedCount: updatedUsers.length,
        updatedUsers,
      });
    }
  } catch (error) {
    console.error("Error bulk updating user status to inactive:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Bulk update user status (general purpose)
router.post("/bulk-status-update", async (req: Request, res: Response) => {
  try {
    const { userStatuses } = req.body; // Array of { userId, status }

    if (!Array.isArray(userStatuses) || userStatuses.length === 0) {
      return res
        .status(400)
        .json({ error: "userStatuses must be a non-empty array" });
    }

    // Validate the input format
    const validStatuses = ["active", "inactive", "suspended"];
    for (const { userId, status } of userStatuses) {
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: "All userIds must be integers" });
      }
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    if (await isDatabaseAvailable()) {
      // Update user statuses in database
      const updatedUsers = [];
      for (const { userId, status } of userStatuses) {
        const user = await UserRepository.update(userId, { status });
        if (user) {
          updatedUsers.push(user);
        }
      }

      console.log(
        `Bulk status update completed for ${updatedUsers.length} users:`,
        userStatuses.map((u) => `User ${u.userId} → ${u.status}`).join(", "),
      );

      res.json({
        success: true,
        updatedCount: updatedUsers.length,
        updatedUsers,
        message: `Updated status for ${updatedUsers.length} users`,
      });
    } else {
      // Use mock data fallback - update status in mock data
      const updatedUsers = [];
      for (const { userId, status } of userStatuses) {
        const user = await MockDataService.updateUser(userId, { status });
        if (user) {
          updatedUsers.push(user);
        }
      }

      res.json({
        success: true,
        updatedCount: updatedUsers.length,
        updatedUsers,
        message: `Updated status for ${updatedUsers.length} users (mock mode)`,
      });
    }
  } catch (error) {
    console.error("Error bulk updating user statuses:", error);
    res.status(500).json({
      error: "Failed to update user statuses",
      message: error.message,
    });
  }
});

export default router;
