import { Router, Request, Response } from "express";
import { pool } from "../database/connection";
import fs from "fs/promises";
import path from "path";

const router = Router();

interface AzureUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  accountEnabled: boolean;
}

interface AzureResponse {
  "@odata.context": string;
  "@odata.nextLink"?: string;
  value: AzureUser[];
}

// Sync users from Azure AD
router.post("/sync", async (req: Request, res: Response) => {
  try {
    console.log("Starting Azure AD sync...");

    // Check if we have an access token
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({
        error: "Access token required",
        message: "Please provide a valid Azure AD access token",
      });
    }

    // Call Microsoft Graph API
    const graphUrl = "https://graph.microsoft.com/v1.0/users?$top=500";
    const graphResponse = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error("Microsoft Graph API error:", errorText);
      return res.status(graphResponse.status).json({
        error: "Microsoft Graph API error",
        message: errorText,
        status: graphResponse.status,
      });
    }

    const azureData: AzureResponse = await graphResponse.json();
    const azureUsers = azureData.value;

    console.log(`Fetched ${azureUsers.length} users from Azure AD`);

    // Save raw JSON response
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonFileName = `azure-users-${timestamp}.json`;
    const jsonFilePath = path.join(
      process.cwd(),
      "server",
      "data",
      jsonFileName,
    );

    // Ensure data directory exists
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
    await fs.writeFile(jsonFilePath, JSON.stringify(azureData, null, 2));

    console.log(`Saved Azure data to: ${jsonFilePath}`);

    // Process and insert users into database
    const insertedUsers = [];
    const skippedUsers = [];
    const updatedUsers = [];

    for (const azureUser of azureUsers) {
      try {
        // Check if user already exists by email
        const existingUserQuery = `
          SELECT id, email, azure_object_id FROM users 
          WHERE email = $1 OR azure_object_id = $2
        `;
        const existingResult = await pool.query(existingUserQuery, [
          azureUser.mail || azureUser.userPrincipalName,
          azureUser.id,
        ]);

        const firstName =
          azureUser.givenName ||
          azureUser.displayName?.split(" ")[0] ||
          "Unknown";
        const lastName =
          azureUser.surname ||
          azureUser.displayName?.split(" ").slice(1).join(" ") ||
          "User";
        const email = azureUser.mail || azureUser.userPrincipalName;

        if (existingResult.rows.length > 0) {
          // Update existing user with Azure data
          const updateQuery = `
            UPDATE users 
            SET 
              azure_object_id = $1,
              first_name = $2,
              last_name = $3,
              email = $4,
              phone = $5,
              department = $6,
              sso_provider = 'microsoft',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING id, first_name, last_name, email, role
          `;

          const updateResult = await pool.query(updateQuery, [
            azureUser.id,
            firstName,
            lastName,
            email,
            azureUser.mobilePhone || azureUser.businessPhones?.[0] || null,
            azureUser.department || null,
            existingResult.rows[0].id,
          ]);

          updatedUsers.push(updateResult.rows[0]);
          console.log(`Updated existing user: ${email}`);
        } else {
          // Insert new user with "unknown" role
          const insertQuery = `
            INSERT INTO users (
              first_name, last_name, email, phone, password_hash, role, 
              department, status, azure_object_id, sso_provider, 
              two_factor_enabled, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, first_name, last_name, email, role, azure_object_id
          `;

          const insertResult = await pool.query(insertQuery, [
            firstName,
            lastName,
            email,
            azureUser.mobilePhone || azureUser.businessPhones?.[0] || null,
            "SSO_AUTH_NO_PASSWORD", // Placeholder for SSO users
            "unknown", // Default role for manual assignment
            azureUser.department || null,
            azureUser.accountEnabled ? "active" : "inactive",
            azureUser.id,
            "microsoft",
            false,
            `Imported from Azure AD on ${new Date().toISOString()}`,
          ]);

          insertedUsers.push(insertResult.rows[0]);
          console.log(`Inserted new user: ${email}`);
        }
      } catch (userError) {
        console.error(
          `Error processing user ${azureUser.mail || azureUser.userPrincipalName}:`,
          userError,
        );
        skippedUsers.push({
          email: azureUser.mail || azureUser.userPrincipalName,
          error: userError.message,
        });
      }
    }

    console.log(
      `Sync complete: ${insertedUsers.length} inserted, ${updatedUsers.length} updated, ${skippedUsers.length} skipped`,
    );

    res.json({
      success: true,
      message: "Azure AD sync completed successfully",
      stats: {
        total: azureUsers.length,
        inserted: insertedUsers.length,
        updated: updatedUsers.length,
        skipped: skippedUsers.length,
      },
      data: {
        insertedUsers,
        updatedUsers,
        skippedUsers,
      },
      jsonFile: jsonFileName,
    });
  } catch (error) {
    console.error("Azure AD sync error:", error);
    res.status(500).json({
      error: "Azure AD sync failed",
      message: error.message,
    });
  }
});

// Get sync history
router.get("/history", async (req: Request, res: Response) => {
  try {
    const dataDir = path.join(process.cwd(), "server", "data");
    const files = await fs.readdir(dataDir);
    const azureFiles = files
      .filter(
        (file) => file.startsWith("azure-users-") && file.endsWith(".json"),
      )
      .map((file) => {
        const timestamp = file.replace("azure-users-", "").replace(".json", "");
        return {
          filename: file,
          timestamp: timestamp,
          path: `/api/azure-sync/download/${file}`,
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json({
      success: true,
      files: azureFiles,
    });
  } catch (error) {
    console.error("Error getting sync history:", error);
    res.status(500).json({
      error: "Failed to get sync history",
      message: error.message,
    });
  }
});

// Download sync file
router.get("/download/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent path traversal
    if (!filename.match(/^azure-users-[\d\-T]+\.json$/)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(process.cwd(), "server", "data", filename);
    const fileContent = await fs.readFile(filePath, "utf-8");

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(fileContent);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(404).json({
      error: "File not found",
      message: error.message,
    });
  }
});

// Get users with unknown role or missing department
router.get("/unknown-users", async (req: Request, res: Response) => {
  try {
    // Check if database is available
    try {
      await pool.query("SELECT 1");
    } catch (dbError) {
      console.warn(
        "Database not available for unknown users query:",
        dbError.message,
      );

      // Ensure response headers are set correctly
      res.setHeader("Content-Type", "application/json");

      return res.status(503).json({
        success: false,
        error: "Database not available",
        message:
          "Cannot fetch unknown users - database connection failed. Please ensure PostgreSQL is running.",
      });
    }

    const query = `
      SELECT id, first_name, last_name, email, department, azure_object_id, created_at, role, job_title, status, last_login
      FROM users
      WHERE sso_provider = 'microsoft' AND (role = 'unknown' OR department IS NULL)
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("Error getting unknown users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get unknown users",
      message: error.message,
    });
  }
});

// Assign role to users
router.post("/assign-roles", async (req: Request, res: Response) => {
  try {
    // Check if database is available
    try {
      await pool.query("SELECT 1");
    } catch (dbError) {
      console.warn(
        "Database not available for role assignment:",
        dbError.message,
      );
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Cannot assign roles - database connection failed",
      });
    }

    const { userRoles } = req.body; // Array of { userId, role }

    if (!Array.isArray(userRoles)) {
      return res.status(400).json({
        success: false,
        error: "userRoles must be an array",
      });
    }

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
    ];

    const updatedUsers = [];

    for (const { userId, role } of userRoles) {
      if (!validRoles.includes(role)) {
        continue; // Skip invalid roles
      }

      const updateQuery = `
        UPDATE users
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND role = 'unknown'
        RETURNING id, first_name, last_name, email, role
      `;

      const result = await pool.query(updateQuery, [role, userId]);
      if (result.rows.length > 0) {
        updatedUsers.push(result.rows[0]);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedUsers.length} users`,
      updatedUsers,
    });
  } catch (error) {
    console.error("Error assigning roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign roles",
      message: error.message,
    });
  }
});

// Assign departments to users
router.post("/assign-departments", async (req: Request, res: Response) => {
  try {
    // Check if database is available
    try {
      await pool.query("SELECT 1");
    } catch (dbError) {
      console.warn(
        "Database not available for department assignment:",
        dbError.message,
      );
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Cannot assign departments - database connection failed",
      });
    }

    const { userDepartments } = req.body; // Array of { userId, department }

    if (!Array.isArray(userDepartments)) {
      return res.status(400).json({
        success: false,
        error: "userDepartments must be an array",
      });
    }

    const validDepartments = [
      "admin",
      "administration",
      "sales",
      "product",
      "development",
      "database",
      "finops",
      "finance",
      "hr",
      "infrastructure",
      "support",
      "marketing",
      "switch_team",
    ];

    const updatedUsers = [];

    for (const { userId, department } of userDepartments) {
      if (!validDepartments.includes(department)) {
        continue; // Skip invalid departments
      }

      const updateQuery = `
        UPDATE users
        SET department = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND sso_provider = 'microsoft'
        RETURNING id, first_name, last_name, email, department, role
      `;

      const result = await pool.query(updateQuery, [department, userId]);
      if (result.rows.length > 0) {
        updatedUsers.push(result.rows[0]);
      }
    }

    res.json({
      success: true,
      message: `Updated departments for ${updatedUsers.length} users`,
      updatedUsers,
    });
  } catch (error) {
    console.error("Error assigning departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign departments",
      message: error.message,
    });
  }
});

export default router;
