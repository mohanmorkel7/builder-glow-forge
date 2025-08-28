import { Router, Request, Response } from "express";
import { DepartmentService } from "../services/departmentService";
import { pool } from "../database/connection";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// SSO login endpoint
router.post("/sso/login", async (req: Request, res: Response) => {
  try {
    const { ssoUser } = req.body;

    if (!ssoUser || !ssoUser.mail) {
      return res.status(400).json({
        success: false,
        error: "Invalid SSO user data",
      });
    }

    console.log(`SSO login attempt for: ${ssoUser.mail}`);

    // Create or update user based on SSO data
    const userDepartmentInfo =
      await DepartmentService.createOrUpdateSSOUser(ssoUser);

    if (!userDepartmentInfo) {
      return res.status(403).json({
        success: false,
        error:
          "User not authorized. Contact administrator to add you to the department mapping.",
      });
    }

    console.log(
      `SSO login successful for: ${ssoUser.mail}, Department: ${userDepartmentInfo.department}`,
    );

    res.json({
      success: true,
      user: {
        id: userDepartmentInfo.userId,
        name: ssoUser.displayName,
        email: userDepartmentInfo.email,
        role: "admin", // Will be overridden by department permissions
        department: userDepartmentInfo.department,
        permissions: userDepartmentInfo.permissions,
        jobTitle: userDepartmentInfo.jobTitle,
        ssoId: userDepartmentInfo.ssoId,
        azureObjectId: ssoUser.id,
      },
    });
  } catch (error) {
    console.error("SSO login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during SSO login",
    });
  }
});

// Get user department info
router.get("/user/:userId/department", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    // This would require getting email first, then department info
    // Implementation depends on your user lookup needs

    res.json({
      success: true,
      message: "Endpoint for getting user department info",
    });
  } catch (error) {
    console.error("Error getting user department:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user department info",
    });
  }
});

// Load initial department data
router.post("/admin/load-departments", async (req: Request, res: Response) => {
  try {
    // This should be restricted to admin users only
    await DepartmentService.loadUserDepartmentsFromJSON();

    res.json({
      success: true,
      message: "User departments loaded successfully from JSON",
    });
  } catch (error) {
    console.error("Error loading departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load user departments",
    });
  }
});

// Check user permission
router.get(
  "/user/:userId/permission/:permission",
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const permission = req.params.permission;

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid user ID",
        });
      }

      const hasPermission = await DepartmentService.userHasPermission(
        userId,
        permission,
      );

      res.json({
        success: true,
        hasPermission,
      });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check user permission",
      });
    }
  },
);

// Upload new department data via JSON
router.post(
  "/admin/upload-departments",
  async (req: Request, res: Response) => {
    try {
      console.log(`📤 Received JSON upload request`);
      console.log(`📄 Request body keys:`, Object.keys(req.body));
      console.log(`📋 Full request body:`, JSON.stringify(req.body, null, 2));

      const { departments, users } = req.body;

      if (!departments || !users) {
        console.log(`❌ Missing departments or users in request body`);
        console.log(`Has departments:`, !!departments);
        console.log(`Has users:`, !!users);
        return res.status(400).json({
          success: false,
          error:
            "Invalid JSON structure. Must contain 'departments' and 'users' properties.",
        });
      }

      console.log(
        `✅ Found ${departments.length} departments and ${users.length} users`,
      );

      // First, immediately filter out any entries without email addresses to prevent validation errors
      console.log(
        `🔄 Pre-filtering users to remove entries without email addresses...`,
      );
      const originalUserCount = users.length;
      const usersWithEmail = users.filter((user: any, index: number) => {
        if (!user.email || user.email === null || user.email === undefined) {
          console.log(
            `⏭️ Pre-filtering: Removing entry ${index + 1} (no email): ${user.displayName || "unknown"}`,
          );
          return false;
        }
        return true;
      });
      console.log(
        `✅ Pre-filtering complete: ${originalUserCount} �� ${usersWithEmail.length} users (removed ${originalUserCount - usersWithEmail.length} entries without email)`,
      );

      // Replace the users array with the filtered version
      req.body.users = usersWithEmail;
      const filteredUsers = usersWithEmail;

      // Check if database is available to validate existing users
      let dbAvailable = false;
      let existingEmails = new Set<string>();

      try {
        await pool.query("SELECT 1");
        dbAvailable = true;

        // Get all existing emails from database
        const existingUsersResult = await pool.query("SELECT email FROM users");
        existingEmails = new Set(
          existingUsersResult.rows
            .map((row) =>
              row.email && row.email !== null ? row.email.toLowerCase() : "",
            )
            .filter((email) => email !== ""),
        );
        console.log(`Found ${existingEmails.size} existing users in database`);
        console.log(
          "Existing emails:",
          Array.from(existingEmails).slice(0, 10),
        ); // Show first 10 for debugging
      } catch (dbError) {
        console.warn(
          "Database not available, skipping duplicate check:",
          dbError.message,
        );
      }

      // Filter users - skip those that already exist in database
      const newUsers = [];
      const skippedUsers = [];

      // Filter and validate users - skip those without email (likely resources/rooms)
      const validUsers = [];
      const skippedEntries = [];

      for (let i = 0; i < filteredUsers.length; i++) {
        const user = filteredUsers[i];
        console.log(`🔍 Processing user ${i + 1}/${filteredUsers.length}:`, {
          email: user.email,
          displayName: user.displayName,
          ssoId: user.ssoId,
          hasEmail: !!user.email,
          hasDisplayName: !!user.displayName,
          hasSsoId: !!user.ssoId,
          allKeys: Object.keys(user),
        });

        // Skip entries without email (likely meeting rooms, resources, etc.)
        if (!user.email) {
          console.log(
            `⏭️ Skipping entry ${i + 1} (no email): ${user.displayName || "unknown"}`,
          );
          skippedEntries.push({
            position: i + 1,
            displayName: user.displayName || "unknown",
            reason: "missing email",
          });
          continue;
        }

        // Validate required fields for actual users
        if (!user.displayName || !user.ssoId) {
          console.log(`❌ Validation failed for user ${i + 1}:`, user);
          console.log(
            `Missing fields: displayName=${!user.displayName}, ssoId=${!user.ssoId}`,
          );
          return res.status(400).json({
            success: false,
            error: `Invalid user data at position ${i + 1}. User ${user.email} is missing: ${!user.displayName ? "displayName " : ""}${!user.ssoId ? "ssoId" : ""}`,
          });
        }

        validUsers.push(user);
      }

      console.log(
        `✅ Processed ${filteredUsers.length} entries: ${validUsers.length} valid users, ${skippedEntries.length} skipped entries`,
      );
      console.log(`📋 Skipped entries:`, skippedEntries);

      // Use validUsers for further processing instead of reassigning const users
      const processedUsers = validUsers;

      // Now validate remaining users for name fields
      for (const user of processedUsers) {
        // Validate name fields to prevent database constraint violations
        if (!user.givenName && !user.displayName) {
          return res.status(400).json({
            success: false,
            error: `Invalid user data. User ${user.email} must have either givenName or displayName for first name.`,
          });
        }

        if (!user.surname && !user.displayName) {
          return res.status(400).json({
            success: false,
            error: `Invalid user data. User ${user.email} must have either surname or displayName for last name extraction.`,
          });
        }

        // Check if user already exists in database
        if (
          dbAvailable &&
          user.email &&
          existingEmails.has(user.email.toLowerCase())
        ) {
          // If user has department info, allow updating, otherwise skip
          if (user.department && user.department !== "") {
            newUsers.push(user);
            console.log(
              `🔄 Processing existing user for update: ${user.email} (has department: ${user.department})`,
            );
          } else {
            skippedUsers.push(user);
            console.log(
              `⏭️  Skipping existing user: ${user.email} (no department info - no update needed)`,
            );
            continue;
          }
        } else {
          // User doesn't exist in database - add as new
          newUsers.push(user);
          console.log(`✅ Adding new user: ${user.email} (not in database)`);
        }
      }

      // Load existing JSON data and merge
      const filePath = path.join(__dirname, "../data/user-departments.json");
      let existingData = { departments: {}, users: [] };

      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, "utf8");
          existingData = JSON.parse(fileContent);
        } catch (parseError) {
          console.warn(
            "Could not parse existing JSON file, starting fresh:",
            parseError.message,
          );
        }
      }

      // Merge departments (new ones override existing)
      const mergedDepartments = { ...existingData.departments, ...departments };

      // For users - only add new users, skip existing ones by email
      const existingUserEmails = new Set(
        existingData.users
          .map((u) =>
            u.email && u.email !== null ? u.email.toLowerCase() : "",
          )
          .filter((email) => email !== ""),
      );
      const usersToAdd = newUsers.filter(
        (user) =>
          user.email && !existingUserEmails.has(user.email.toLowerCase()),
      );
      const alreadyInJsonUsers = newUsers.filter(
        (user) =>
          user.email && existingUserEmails.has(user.email.toLowerCase()),
      );

      const finalUsers = [...existingData.users, ...usersToAdd];

      // Update the JSON file
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          { departments: mergedDepartments, users: finalUsers },
          null,
          2,
        ),
      );

      // Reload the data with option to skip existing users
      console.log("🔄 Starting database sync process...");
      console.log(`Database available: ${dbAvailable}`);
      console.log(`Users passed database check: ${newUsers.length}`);
      if (newUsers.length > 0) {
        console.log(
          "Users to process details:",
          newUsers.map((u) => ({
            email: u.email,
            department: u.department || "no-dept",
            hasDisplayName: !!u.displayName,
            hasSsoId: !!u.ssoId,
          })),
        );
      }

      let databaseSyncStatus = "pending";
      let databaseSyncMessage = "";

      try {
        await DepartmentService.loadUserDepartmentsFromJSON({
          skipExistingUsers: true,
        });
        console.log("✅ Database sync completed successfully");
        databaseSyncStatus = "completed";
        databaseSyncMessage = "Users successfully synced to database";
      } catch (syncError) {
        console.error("❌ Database sync failed:", syncError.message);
        console.error("Sync error details:", syncError);
        databaseSyncStatus = "failed";
        databaseSyncMessage = dbAvailable
          ? `Database sync failed: ${syncError.message}`
          : "Database unavailable - users saved to JSON only. Start PostgreSQL and re-upload to sync to database.";
        // Continue without failing the whole upload
      }

      const totalSkipped = skippedUsers.length + alreadyInJsonUsers.length;

      console.log(`📁 Department upload summary:`);
      console.log(`   • Users in upload: ${users.length}`);
      console.log(`   �� Users passed database check: ${newUsers.length}`);
      console.log(`   • New users added to JSON: ${usersToAdd.length}`);
      console.log(`   • Skipped (found in database): ${skippedUsers.length}`);
      console.log(
        `   • Skipped (already in JSON): ${alreadyInJsonUsers.length}`,
      );
      console.log(`   • Total skipped: ${totalSkipped}`);
      console.log(`   • Final user count in JSON: ${finalUsers.length}`);
      console.log(`   • Database sync will also skip existing users: YES`);

      res.json({
        success: true,
        message: `Processed ${processedUsers.length} valid users (${skippedEntries.length} entries skipped - likely meeting rooms/resources). Added ${usersToAdd.length} new users to JSON. Completely skipped ${skippedUsers.length} users that exist in database.`,
        data: {
          newUserCount: usersToAdd.length,
          skippedUserCount: totalSkipped,
          skippedInDatabase: skippedUsers.length,
          skippedInJson: alreadyInJsonUsers.length,
          skippedEntriesNoEmail: skippedEntries.length,
          skippedEntriesDetails: skippedEntries,
          departmentCount: Object.keys(mergedDepartments).length,
          totalUsersInJson: finalUsers.length,
          usersPassedDatabaseCheck: newUsers.length,
          completelySkippedFromDatabase: skippedUsers.length,
          databaseSync: {
            status: databaseSyncStatus,
            message: databaseSyncMessage,
            databaseAvailable: dbAvailable,
          },
        },
      });
    } catch (error) {
      console.error("Error uploading departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload department data",
      });
    }
  },
);

// Get current department data from JSON file
router.get(
  "/admin/current-departments",
  async (req: Request, res: Response) => {
    try {
      const filePath = path.join(__dirname, "../data/user-departments.json");

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(fileContent);

        res.json({
          success: true,
          data,
        });
      } else {
        res.json({
          success: true,
          data: null,
        });
      }
    } catch (error) {
      console.error("Error getting current departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get current department data",
      });
    }
  },
);

// Get all users from database for department manager
router.get("/admin/database-users", async (req: Request, res: Response) => {
  try {
    // Check if database is available first
    let dbAvailable = false;
    try {
      await pool.query("SELECT 1");
      dbAvailable = true;
    } catch (dbError) {
      console.warn("Database not available:", dbError.message);
    }

    if (!dbAvailable) {
      // Return empty state when database is not available
      let departments = {};
      try {
        const filePath = path.join(__dirname, "../data/user-departments.json");
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(fileContent);
          departments = data.departments || {};
        }
      } catch (error) {
        console.warn("Could not load departments from JSON:", error.message);
      }

      return res.json({
        success: true,
        data: {
          users: [],
          departments,
          totalUsers: 0,
          usersByRole: {},
          databaseStatus: "unavailable",
          message:
            "Database is currently unavailable. Start PostgreSQL to view users.",
        },
      });
    }

    // Get all users from database
    const usersResult = await pool.query(`
        SELECT
          first_name,
          last_name,
          email,
          role,
          department,
          job_title,
          azure_object_id,
          sso_provider,
          password_hash,
          status,
          created_at
        FROM users
        WHERE sso_provider = 'microsoft' OR password_hash = 'SSO_AUTH_NO_PASSWORD'
        ORDER BY created_at DESC
      `);

    const users = usersResult.rows.map((row) => ({
      displayName: `${row.first_name} ${row.last_name}`.trim(),
      givenName: row.first_name,
      surname: row.last_name,
      email: row.email,
      role: row.role,
      department: row.department || "unknown",
      jobTitle: row.job_title,
      ssoId: row.azure_object_id,
      authType:
        row.password_hash === "SSO_AUTH_NO_PASSWORD" ? "SSO" : "PASSWORD",
      provider: row.sso_provider || "local",
      status: row.status,
      createdAt: row.created_at,
    }));

    // Get department structure from JSON file
    let departments = {};
    try {
      const filePath = path.join(__dirname, "../data/user-departments.json");
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(fileContent);
        departments = data.departments || {};
      }
    } catch (error) {
      console.warn("Could not load departments from JSON:", error.message);
    }

    res.json({
      success: true,
      data: {
        users,
        departments,
        totalUsers: users.length,
        usersByRole: users.reduce(
          (acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        databaseStatus: "available",
      },
    });
  } catch (error) {
    console.error("Error getting database users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get users from database",
    });
  }
});

// Fix existing user roles based on departments (one-time migration)
router.post("/admin/fix-user-roles", async (req: Request, res: Response) => {
  try {
    const { pool } = require("../database/connection");

    console.log("🔄 Updating user roles based on departments...");

    const updateResult = await pool.query(`
      UPDATE users
      SET
          role = CASE
              WHEN department = 'hr' THEN 'hr_management'
              WHEN department = 'finance' THEN 'finance'
              WHEN department = 'finops' THEN 'finops'
              WHEN department = 'database' THEN 'db'
              WHEN department = 'frontend' THEN 'development'
              WHEN department = 'backend' THEN 'development'
              WHEN department = 'infra' THEN 'infra'
              ELSE 'development' -- Default fallback
          END,
          updated_at = NOW()
      WHERE
          sso_provider = 'microsoft'
          AND department IS NOT NULL
    `);

    console.log(
      `✅ Updated ${updateResult.rowCount} users with department-based roles`,
    );

    // Verify the results
    const verifyResult = await pool.query(`
      SELECT
          id,
          first_name,
          last_name,
          email,
          department,
          role,
          job_title,
          sso_provider
      FROM users
      WHERE sso_provider = 'microsoft'
      ORDER BY department, first_name
    `);

    res.json({
      success: true,
      message: `Successfully updated ${updateResult.rowCount} user roles based on departments`,
      updatedUsers: verifyResult.rows,
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user roles",
    });
  }
});

// Fix incorrect user roles endpoint
router.post("/admin/fix-user-roles", async (req: Request, res: Response) => {
  try {
    const roleUpdates = [
      { email: "Gopikrishnan.P@mylapay.com", newRole: "unknown" },
      { email: "sarumathi.m@mylapay.com", newRole: "finops" },
      { email: "Maanas.m@mylapay.com", newRole: "switch_team" },
      { email: "Abirami@mylapay.com", newRole: "backend" },
      { email: "abinaya.s@mylapay.com", newRole: "backend" },
      { email: "Abinaya.M@mylapay.com", newRole: "backend" },
      { email: "Abinandan@mylapay.com", newRole: "backend" },
    ];

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const update of roleUpdates) {
      try {
        const result = await pool.query(
          `UPDATE users
           SET role = $1, updated_at = NOW()
           WHERE email = $2
           RETURNING id, first_name, last_name, email, role`,
          [update.newRole, update.email],
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          results.push({
            success: true,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            newRole: user.role,
          });
          successCount++;
        } else {
          results.push({
            success: false,
            email: update.email,
            error: "User not found",
          });
          failCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          email: update.email,
          error: error.message,
        });
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Updated ${successCount} user roles successfully. ${failCount} failed.`,
      results,
      summary: {
        successCount,
        failCount,
        totalUpdates: roleUpdates.length,
      },
    });
  } catch (error) {
    console.error("Error fixing user roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix user roles",
      message: error.message,
    });
  }
});

// Debug endpoint to check existing users in database (for testing department upload)
router.get(
  "/admin/check-existing-users",
  async (req: Request, res: Response) => {
    try {
      // Check if database is available
      try {
        await pool.query("SELECT 1");
      } catch (dbError) {
        return res.status(503).json({
          success: false,
          error: "Database not available",
          message: "Cannot check users - database connection failed",
        });
      }

      // Get all users from database
      const result = await pool.query(
        "SELECT id, first_name, last_name, email, role, department, sso_provider, created_at FROM users ORDER BY created_at DESC",
      );

      res.json({
        success: true,
        users: result.rows,
        count: result.rows.length,
        message: `Found ${result.rows.length} users in database`,
      });
    } catch (error) {
      console.error("Error checking existing users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check existing users",
        message: error.message,
      });
    }
  },
);

// Debug endpoint to test upload with specific users
router.post("/admin/debug-upload", async (req: Request, res: Response) => {
  try {
    console.log("🧪 Debug upload endpoint called");

    const testData = {
      departments: {
        backend: {
          name: "Backend Development",
          permissions: ["admin", "product", "database", "leads", "vc"],
          users: [],
        },
      },
      users: [
        {
          email: "Abinandan@mylapay.com",
          displayName: "Abinandan N",
          givenName: "Abinandan",
          surname: "Natraj",
          jobTitle: "Tech Lead",
          department: "backend",
          ssoId: "98d7b0c3-241c-4184-951e-77d971a0df61",
        },
        {
          email: "Abinaya.M@mylapay.com",
          displayName: "Abinaya M",
          givenName: "Abinaya",
          surname: "M",
          jobTitle: "Associate Director Technology",
          department: "backend",
          ssoId: "00403bc6-6a6d-46c3-a203-d12ff8c9d1ac",
        },
      ],
    };

    console.log("Test data:", JSON.stringify(testData, null, 2));

    // Check database availability
    let dbAvailable = false;
    try {
      await pool.query("SELECT 1");
      dbAvailable = true;
      console.log("✅ Database is available");
    } catch (dbError) {
      console.warn("⚠️  Database not available:", dbError.message);
    }

    // Check if users already exist
    let existingEmails = new Set<string>();
    if (dbAvailable) {
      const existingUsersResult = await pool.query("SELECT email FROM users");
      existingEmails = new Set(
        existingUsersResult.rows.map((row) => row.email.toLowerCase()),
      );
      console.log(`Found ${existingEmails.size} existing users in database`);

      for (const user of testData.users) {
        const exists = existingEmails.has(user.email.toLowerCase());
        console.log(`${user.email} exists in DB: ${exists}`);
      }
    }

    res.json({
      success: true,
      debug: {
        databaseAvailable: dbAvailable,
        existingUsersCount: existingEmails.size,
        testUsersChecked: testData.users.map((u) => ({
          email: u.email,
          existsInDB: existingEmails.has(u.email.toLowerCase()),
        })),
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
