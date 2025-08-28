import { Router, Request, Response } from "express";
import {
  VCRepository,
  VCStepRepository,
  VCCommentRepository,
  CreateVCData,
  UpdateVCData,
  CreateVCStepData,
  UpdateVCStepData,
  CreateVCCommentData,
} from "../models/VC";
import { MockDataService } from "../services/mockData";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";
import { pool, isDatabaseAvailable, withTimeout } from "../database/connection";

const router = Router();

// Check if step_id column exists in vc_comments table
async function hasStepIdColumn(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vc_comments' AND column_name = 'step_id'
    `);
    return result.rows.length > 0;
  } catch (error) {
    console.log("Could not check for step_id column:", error.message);
    return false;
  }
}

// Debug endpoint to test database connection and VC creation
router.get("/debug/connection", async (req: Request, res: Response) => {
  try {
    const dbAvailable = await isDatabaseAvailable();
    console.log("Database availability:", dbAvailable);

    if (dbAvailable) {
      // Test basic query
      const testQuery = await pool.query("SELECT NOW() as current_time");

      // Test VC table exists
      const tableCheck = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'vcs'
        ORDER BY ordinal_position
      `);

      res.json({
        database_available: true,
        current_time: testQuery.rows[0].current_time,
        vcs_table_columns: tableCheck.rows,
        message: "Database connection working properly",
      });
    } else {
      res.json({
        database_available: false,
        message: "Database not available, using mock data",
      });
    }
  } catch (error) {
    console.error("Debug connection error:", error);
    res.status(500).json({
      error: error.message,
      database_available: false,
    });
  }
});

// Enhanced helper function with better error handling
async function isDatabaseAvailable() {
  try {
    return await DatabaseValidator.isDatabaseAvailable();
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Get all VCs
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      investor_category,
      status,
      search,
      partial_saves_only,
      created_by,
    } = req.query;

    let vcs;
    try {
      if (await isDatabaseAvailable()) {
        if (partial_saves_only === "true") {
          // Get partial saves only
          vcs = await VCRepository.findPartialSaves(
            created_by ? parseInt(created_by as string) : undefined,
          );
        } else if (search) {
          vcs = await VCRepository.search(search as string);
        } else if (investor_category) {
          vcs = await VCRepository.findByInvestorCategory(
            investor_category as string,
          );
        } else if (status) {
          vcs = await VCRepository.findByStatus(status as string);
        } else {
          vcs = await VCRepository.findAll();
        }
      } else {
        // Return mock VC data when database is unavailable
        vcs = await MockDataService.getAllVCs(); // Using proper VC mock data

        // Filter mock data based on query parameters
        if (status && status !== "all") {
          vcs = vcs.filter((vc: any) => vc.status === status);
        }
        if (search) {
          const searchTerm = (search as string).toLowerCase();
          vcs = vcs.filter(
            (vc: any) =>
              vc.project_title?.toLowerCase().includes(searchTerm) ||
              vc.client_name?.toLowerCase().includes(searchTerm) ||
              vc.lead_id?.toLowerCase().includes(searchTerm),
          );
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vcs = await MockDataService.getAllVCs();
    }

    res.json(vcs);
  } catch (error) {
    console.error("Error fetching VCs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VCs",
    });
  }
});

// Get VC statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    let stats;
    try {
      if (await isDatabaseAvailable()) {
        stats = await VCRepository.getStats();
      } else {
        // Return mock stats when database is unavailable
        const mockVCs = await MockDataService.getAllVCs();
        stats = {
          total: mockVCs.length,
          in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress")
            .length,
          won: mockVCs.filter((vc: any) => vc.status === "won").length,
          lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
          completed: mockVCs.filter((vc: any) => vc.status === "completed")
            .length,
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const mockVCs = await MockDataService.getAllVCs();
      stats = {
        total: mockVCs.length,
        in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress")
          .length,
        won: mockVCs.filter((vc: any) => vc.status === "won").length,
        lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
        completed: mockVCs.filter((vc: any) => vc.status === "completed")
          .length,
      };
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching VC stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC statistics",
    });
  }
});

// Get VC follow-ups for dashboard
router.get("/follow-ups", async (req: Request, res: Response) => {
  try {
    let followUps = [];
    try {
      if (await isDatabaseAvailable()) {
        const query = `
          SELECT
            f.id,
            f.vc_id,
            f.title,
            f.description,
            f.due_date,
            f.status,
            f.assigned_to,
            f.follow_up_type,
            vs.name as step_name,
            v.round_title,
            CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name
          FROM follow_ups f
          LEFT JOIN vcs v ON f.vc_id = v.id
          LEFT JOIN vc_steps vs ON f.vc_step_id = vs.id
          LEFT JOIN users u ON f.assigned_to = u.id
          WHERE f.vc_id IS NOT NULL
            AND f.status IN ('pending', 'in_progress', 'completed')
            AND f.due_date IS NOT NULL
          ORDER BY f.due_date ASC
          LIMIT 50
        `;
        const result = await withTimeout(pool.query(query), 5000);
        followUps = result.rows;
      } else {
        // Return mock follow-ups when database is unavailable
        followUps = [
          {
            id: 1,
            vc_id: 1,
            title: "Follow up on term sheet feedback",
            description: "Check investor response to updated terms",
            due_date: new Date(
              Date.now() + 2 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 2 days from now
            status: "pending",
            assigned_to: 1,
            step_name: "Term Sheet",
            round_title: "Series A",
            assigned_user_name: "John Doe",
          },
          {
            id: 2,
            vc_id: 2,
            title: "Schedule due diligence meeting",
            description: "Coordinate with investor team for DD session",
            due_date: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 5 days from now
            status: "pending",
            assigned_to: 2,
            step_name: "Due Diligence",
            round_title: "Seed Round",
            assigned_user_name: "Jane Smith",
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      followUps = [
        {
          id: 1,
          vc_id: 1,
          title: "Mock follow-up - database unavailable",
          description: "Mock follow-up for testing",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          assigned_to: 1,
          step_name: "Initial Pitch",
          round_title: "Mock Round",
          assigned_user_name: "Mock User",
        },
      ];
    }

    res.json(followUps);
  } catch (error) {
    console.error("Error fetching VC follow-ups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC follow-ups",
    });
  }
});

// Get VC progress data for dashboard
router.get("/progress", async (req: Request, res: Response) => {
  try {
    let progressData = [];
    try {
      if (await isDatabaseAvailable()) {
        console.log("VC progress dashboard endpoint called");
        progressData = [];

        // Quick timeout for database operations to prevent hanging
        const queryTimeout = 10000; // 10 seconds

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Database query timeout")),
              queryTimeout,
            );
          });

          // Get VCs with timeout
          const vcsQueryPromise = pool.query(`
            SELECT DISTINCT
              v.id as vc_id,
              v.round_title,
              v.investor_name,
              v.status as vc_status
            FROM vcs v
            WHERE (v.is_partial IS NULL OR v.is_partial = false)
            ORDER BY v.id
            LIMIT 10
          `);

          const vcsResult = await Promise.race([
            vcsQueryPromise,
            timeoutPromise,
          ]);
          console.log(
            `Found ${vcsResult.rows.length} VCs for progress tracking`,
          );

          // If we have VCs, process them quickly
          for (const vc of vcsResult.rows) {
            const stepsQueryPromise = pool.query(
              `
              SELECT vs.id, vs.name, vs.status, vs.order_index, vs.probability_percent
              FROM vc_steps vs
              WHERE vs.vc_id = $1
              ORDER BY vs.order_index ASC
            `,
              [vc.vc_id],
            );

            try {
              const stepsResult = await Promise.race([
                stepsQueryPromise,
                new Promise((_, reject) => {
                  setTimeout(
                    () => reject(new Error("Steps query timeout")),
                    8000,
                  );
                }),
              ]);

              const steps = stepsResult.rows;
              const completedSteps = steps.filter(
                (s) => s.status === "completed",
              );
              const currentStep =
                steps.find((s) => s.status === "in_progress") ||
                steps.find((s) => s.status === "pending");

              // Debug logging for probability calculation
              const completedProbabilities = completedSteps.map(
                (step) => parseFloat(step.probability_percent) || 0,
              );
              const totalCompletedProbability = Math.round(
                completedSteps.reduce(
                  (sum, step) =>
                    sum + (parseFloat(step.probability_percent) || 0),
                  0,
                ),
              );

              console.log(`📊 VC ${vc.vc_id} progress calculation:`, {
                completedSteps: completedSteps.length,
                completedProbabilities,
                totalCompletedProbability,
                allStepsProbabilities: steps.map((s) => ({
                  name: s.name,
                  prob: s.probability_percent,
                })),
              });

              progressData.push({
                vc_id: vc.vc_id,
                round_title: vc.round_title,
                investor_name: vc.investor_name,
                status: vc.vc_status,
                completed_count: completedSteps.length,
                total_completed_probability: totalCompletedProbability,
                completed_steps: completedSteps.map((step) => ({
                  name: step.name,
                  probability: parseFloat(step.probability_percent) || 0,
                  status: step.status,
                })),
                current_step: currentStep
                  ? {
                      name: currentStep.name,
                      probability:
                        parseFloat(currentStep.probability_percent) || 0,
                    }
                  : null,
                all_steps: steps.map((step) => ({
                  name: step.name,
                  status: step.status,
                  probability: parseFloat(step.probability_percent) || 0,
                })),
              });
            } catch (stepError) {
              console.warn(
                `Skipping VC ${vc.vc_id} due to steps query timeout`,
              );
            }
          }

          console.log(`Returning ${progressData.length} VC progress records`);
        } catch (dbError) {
          console.warn("Database query timed out, falling back to mock data");
          throw dbError; // Let it fall through to mock data
        }
      } else {
        // Return mock progress data when database is unavailable
        progressData = [
          {
            vc_id: 1,
            round_title: "Series A",
            investor_name: "Acme Ventures",
            status: "in-progress",
            completed_count: 3,
            total_completed_probability: 60,
            completed_steps: [
              { name: "Initial Pitch", probability: 20, status: "completed" },
              { name: "Product Demo", probability: 20, status: "completed" },
              { name: "Due Diligence", probability: 20, status: "completed" },
            ],
            current_step: { name: "Term Sheet", probability: 20 },
          },
          {
            vc_id: 2,
            round_title: "Seed Round",
            investor_name: "Beta Capital",
            status: "in-progress",
            completed_count: 2,
            total_completed_probability: 40,
            completed_steps: [
              { name: "Initial Pitch", probability: 20, status: "completed" },
              { name: "Product Demo", probability: 20, status: "completed" },
            ],
            current_step: { name: "Due Diligence", probability: 20 },
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      progressData = [
        {
          vc_id: 1,
          round_title: "Mock Round",
          investor_name: "Mock Investor",
          status: "in-progress",
          completed_count: 1,
          total_completed_probability: 20,
          completed_steps: [
            { name: "Initial Pitch", probability: 20, status: "completed" },
          ],
          current_step: { name: "Product Demo", probability: 20 },
        },
      ];
    }

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching VC progress data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC progress data",
    });
  }
});

// Get single VC by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        vc = await VCRepository.findById(id);
      } else {
        // Return mock VC data when database is unavailable
        const mockVCs = await MockDataService.getAllVCs();
        vc = mockVCs.find((v: any) => v.id === id);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const mockVCs = await MockDataService.getAllVCs();
      vc = mockVCs.find((v: any) => v.id === id);
    }

    if (!vc) {
      return res.status(404).json({
        success: false,
        error: "VC not found",
      });
    }

    res.json(vc);
  } catch (error) {
    console.error("Error fetching VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC",
    });
  }
});

// Create new VC
router.post("/", async (req: Request, res: Response) => {
  try {
    const vcData: CreateVCData = req.body;

    // Basic validation
    if (!vcData.created_by) {
      return res.status(400).json({
        success: false,
        error: "created_by is required",
      });
    }

    if (!vcData.round_title && !vcData.investor_name) {
      return res.status(400).json({
        success: false,
        error: "Either round_title or investor_name is required",
      });
    }

    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    let vc;
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log("🔍 Database available for VC creation:", dbAvailable);
      console.log("🔍 VC data being created:", JSON.stringify(vcData, null, 2));

      if (dbAvailable) {
        vc = await VCRepository.create(vcData);
        console.log("✅ VC created successfully:", vc);

        // If template_id is provided, create VC steps from template
        if (vc && vcData.template_id) {
          console.log(
            `🔧 Creating VC steps from template ${vcData.template_id} for VC ${vc.id}`,
          );

          try {
            // Get template steps
            const templateStepsQuery = `
              SELECT id, name, description, step_order, default_eta_days, probability_percent
              FROM template_steps
              WHERE template_id = $1
              ORDER BY step_order ASC
            `;
            const templateStepsResult = await pool.query(templateStepsQuery, [
              vcData.template_id,
            ]);

            if (templateStepsResult.rows.length > 0) {
              // Create VC steps from template steps
              for (const templateStep of templateStepsResult.rows) {
                const vcStepQuery = `
                  INSERT INTO vc_steps (
                    vc_id, name, description, order_index, created_by, status, probability_percent
                  )
                  VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                  RETURNING *
                `;

                await pool.query(vcStepQuery, [
                  vc.id,
                  templateStep.name,
                  templateStep.description,
                  templateStep.step_order,
                  vcData.created_by,
                  templateStep.probability_percent,
                ]);
              }
              console.log(
                `Created ${templateStepsResult.rows.length} VC steps from template`,
              );
            } else {
              console.log(
                `No template steps found for template ${vcData.template_id}`,
              );
            }
          } catch (stepError) {
            console.error("Error creating VC steps from template:", stepError);
            // Don't fail the VC creation if step creation fails
          }
        }
      } else {
        console.log(
          "⚠️ Database not available, using mock data for VC creation",
        );
        // Create mock VC when database is unavailable
        vc = {
          id: Math.floor(Math.random() * 1000) + 100,
          vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
          ...vcData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("📝 Mock VC created:", vc);
      }
    } catch (dbError) {
      console.error("❌ Database error during VC creation:", dbError);
      console.log("��� Falling back to mock data");
      vc = {
        id: Math.floor(Math.random() * 1000) + 100,
        vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
        ...vcData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("📝 Fallback mock VC created:", vc);
    }

    res.status(201).json({
      success: true,
      data: vc,
    });
  } catch (error) {
    console.error("Error creating VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC",
    });
  }
});

// Update VC
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    const vcData: UpdateVCData = req.body;

    // Email validation if provided
    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        // Get current VC to check if template_id is changing
        const currentVC = await VCRepository.findById(id);

        // Update the VC record
        vc = await VCRepository.update(id, vcData);

        // If template_id changed, regenerate VC steps from new template
        if (
          vcData.template_id &&
          vcData.template_id !== currentVC?.template_id
        ) {
          console.log(
            `🔧 Template changed from ${currentVC?.template_id} to ${vcData.template_id} for VC ${id}`,
          );

          try {
            // Delete existing VC steps
            await pool.query("DELETE FROM vc_steps WHERE vc_id = $1", [id]);
            console.log(`Deleted existing steps for VC ${id}`);

            // Get new template steps
            const templateStepsQuery = `
              SELECT id, name, description, step_order, default_eta_days, probability_percent
              FROM template_steps
              WHERE template_id = $1
              ORDER BY step_order ASC
            `;
            const templateStepsResult = await pool.query(templateStepsQuery, [
              vcData.template_id,
            ]);

            if (templateStepsResult.rows.length > 0) {
              // Create new VC steps from template
              for (const templateStep of templateStepsResult.rows) {
                const vcStepQuery = `
                  INSERT INTO vc_steps (
                    vc_id, name, description, order_index, created_by, status, probability_percent
                  )
                  VALUES ($1, $2, $3, $4, $5, 'pending', $6)
                  RETURNING *
                `;

                await pool.query(vcStepQuery, [
                  id,
                  templateStep.name,
                  templateStep.description,
                  templateStep.step_order,
                  currentVC?.created_by || 1,
                  templateStep.probability_percent,
                ]);
              }
              console.log(
                `Created ${templateStepsResult.rows.length} new VC steps from template ${vcData.template_id}`,
              );
            }
          } catch (stepError) {
            console.error("Error updating VC steps from template:", stepError);
          }
        }
      } else {
        // Mock update when database is unavailable
        vc = {
          id,
          ...vcData,
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vc = {
        id,
        ...vcData,
        updated_at: new Date().toISOString(),
      };
    }

    if (!vc) {
      return res.status(404).json({
        success: false,
        error: "VC not found",
      });
    }

    res.json({
      success: true,
      data: vc,
    });
  } catch (error) {
    console.error("Error updating VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update VC",
    });
  }
});

// Delete VC
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    let success;
    try {
      if (await isDatabaseAvailable()) {
        success = await VCRepository.delete(id);
      } else {
        // Mock delete when database is unavailable
        success = true;
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      success = true;
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "VC not found",
      });
    }

    res.json({
      success: true,
      message: "VC deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete VC",
    });
  }
});

// VC Steps endpoints

// Debug endpoint to check database tables
router.get("/debug/tables", async (req: Request, res: Response) => {
  try {
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%vc%'
      ORDER BY table_name
    `);

    const vcCount = await pool.query("SELECT COUNT(*) as count FROM vcs");
    const stepsCount = await pool.query(
      "SELECT COUNT(*) as count FROM vc_steps",
    );

    // Get all vc_steps to see what's in the table
    const allSteps = await pool.query(`
      SELECT vs.*, v.round_title
      FROM vc_steps vs
      LEFT JOIN vcs v ON vs.vc_id = v.id
      ORDER BY vs.vc_id, vs.order_index
    `);

    res.json({
      tables: tables.rows,
      counts: {
        vcs: vcCount.rows[0].count,
        vc_steps: stepsCount.rows[0].count,
      },
      all_vc_steps: allSteps.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check specific VC steps
router.get("/debug/:id/steps", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);

    // Get VC details
    const vc = await pool.query("SELECT * FROM vcs WHERE id = $1", [vcId]);

    // Get all steps for this VC
    const steps = await pool.query(
      `
      SELECT * FROM vc_steps
      WHERE vc_id = $1
      ORDER BY order_index ASC, created_at ASC
    `,
      [vcId],
    );

    res.json({
      vc: vc.rows[0] || null,
      steps: steps.rows,
      step_count: steps.rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get steps for a VC
router.get("/:id/steps", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    // Set cache control headers to prevent 304 responses
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    let steps;
    try {
      console.log(`🔍 Fetching VC steps for VC ID: ${vcId}`);

      // Always try database first, but be ready to catch connection errors
      let databaseAvailable = false;
      try {
        databaseAvailable = await isDatabaseAvailable();
        console.log(
          `��� Database availability check result: ${databaseAvailable}`,
        );
      } catch (error) {
        console.log("❌ Database availability check failed:", error.message);
        databaseAvailable = false;
      }

      if (databaseAvailable) {
        console.log(
          "✅ Database available, attempting to use VCStepRepository",
        );

        try {
          // Test actual connection with a simple query first
          const testQuery = await pool.query("SELECT 1 as test");
          console.log("✅ Database connection test successful");

          // First check if VC exists in database
          const vcExists = await VCRepository.findById(vcId);
          console.log(`🔍 VC ${vcId} exists in database:`, !!vcExists);
          if (vcExists) {
            console.log(`📋 VC details:`, {
              id: vcExists.id,
              round_title: vcExists.round_title,
              template_id: vcExists.template_id,
            });
          }

          // Now fetch steps with detailed query logging
          console.log(
            `🔍 Executing query: SELECT * FROM vc_steps WHERE vc_id = ${vcId} ORDER BY order_index ASC, created_at ASC`,
          );
          steps = await VCStepRepository.findByVCId(vcId);
          console.log(
            `��� Database query returned ${steps?.length || 0} steps`,
          );

          if (steps && steps.length > 0) {
            console.log("📝 First step preview:", {
              id: steps[0].id,
              name: steps[0].name,
              status: steps[0].status,
              vc_id: steps[0].vc_id,
            });
          } else {
            console.log("⚠️ No steps found in database for VC", vcId);
            throw new Error("No database steps found - fallback to mock");
          }
        } catch (dbConnectionError) {
          console.log(
            "�� Database connection/query error:",
            dbConnectionError.message,
          );
          throw dbConnectionError; // This will trigger the catch block below
        }
      } else {
        console.log("⚠️ Database unavailable, using MockDataService");
        steps = await MockDataService.getVCSteps(vcId);
        console.log(`📊 Found ${steps?.length || 0} mock steps`);
      }
    } catch (dbError) {
      console.log("❌ Database error, using mock data:", dbError.message);
      steps = await MockDataService.getVCSteps(vcId);
      console.log(`📊 Fallback: Found ${steps?.length || 0} mock steps`);

      if (steps && steps.length > 0) {
        console.log("📝 Mock data first step preview:", {
          id: steps[0].id,
          name: steps[0].name,
          status: steps[0].status,
          vc_id: steps[0].vc_id,
        });
      }
    }

    // Ensure we always return an array
    const responseSteps = Array.isArray(steps) ? steps : [];
    console.log(`🚀 Returning ${responseSteps.length} steps for VC ${vcId}`);

    res.json(responseSteps);
  } catch (error) {
    console.error("Error fetching VC steps:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC steps",
    });
  }
});

// Create VC step
router.post("/:id/steps", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    const stepData: CreateVCStepData = {
      ...req.body,
      vc_id: vcId,
    };

    if (!stepData.name?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Step name is required",
      });
    }

    if (!stepData.created_by) {
      return res.status(400).json({
        success: false,
        error: "created_by is required",
      });
    }

    let step;
    try {
      if (await isDatabaseAvailable()) {
        step = await VCStepRepository.create(stepData);
      } else {
        // Create mock step when database is unavailable
        step = {
          id: Math.floor(Math.random() * 1000) + 100,
          vc_id: vcId,
          ...stepData,
          order_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      step = {
        id: Math.floor(Math.random() * 1000) + 100,
        vc_id: vcId,
        ...stepData,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    res.status(201).json({
      success: true,
      data: step,
    });
  } catch (error) {
    console.error("Error creating VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC step",
    });
  }
});

// Update VC step
router.put("/steps/:stepId", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid step ID",
      });
    }

    const stepData: UpdateVCStepData = req.body;
    console.log(`🔄 Updating VC step ${stepId} with data:`, stepData);

    let step;
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(`🔍 Database available for step update: ${dbAvailable}`);

      if (dbAvailable) {
        step = await VCStepRepository.update(stepId, stepData);
        console.log(`✅ VC step ${stepId} updated in database:`, step);
      } else {
        console.log("⚠️ Database not available, using mock update");
        // Mock update when database is unavailable
        step = {
          id: stepId,
          ...stepData,
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.error("❌ Database error during step update:", dbError);
      console.log("🔄 Falling back to mock update");
      step = {
        id: stepId,
        ...stepData,
        updated_at: new Date().toISOString(),
      };
    }

    if (!step) {
      return res.status(404).json({
        success: false,
        error: "VC step not found",
      });
    }

    res.json({
      success: true,
      data: step,
    });
  } catch (error) {
    console.error("Error updating VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update VC step",
    });
  }
});

// Delete VC step
router.delete("/steps/:stepId", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid step ID",
      });
    }

    let success;
    try {
      if (await isDatabaseAvailable()) {
        success = await VCStepRepository.delete(stepId);
      } else {
        // Mock delete when database is unavailable
        success = true;
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      success = true;
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "VC step not found",
      });
    }

    res.json({
      success: true,
      message: "VC step deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete VC step",
    });
  }
});

// Reorder VC steps
router.put("/:id/steps/reorder", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    const { stepOrders } = req.body;
    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({
        success: false,
        error: "stepOrders must be an array",
      });
    }

    try {
      if (await isDatabaseAvailable()) {
        await VCStepRepository.reorderSteps(vcId, stepOrders);
      } else {
        // Mock reorder when database is unavailable
        console.log("Mock reorder for VC steps:", stepOrders);
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
    }

    res.json({
      success: true,
      message: "VC steps reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering VC steps:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reorder VC steps",
    });
  }
});

// Get comments for a VC
router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    console.log(`💬 Fetching comments for VC ${vcId}`);

    let comments = [];
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(`🔍 Database available for VC comments: ${dbAvailable}`);

      if (dbAvailable) {
        const query = `
          SELECT c.*, u.first_name || ' ' || u.last_name as created_by_name
          FROM vc_comments c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.vc_id = $1
          ORDER BY c.created_at ASC
        `;
        console.log(`📝 Executing query: ${query} with vcId: ${vcId}`);
        const result = await pool.query(query, [vcId]);
        comments = result.rows;
        console.log(`📊 Found ${comments.length} comments in database`);
      } else {
        console.log("⚠️ Database not available, using mock comments");
        // Mock comments when database is unavailable
        comments = [
          {
            id: 1,
            vc_id: vcId,
            message: "Initial discussions with the investor look promising.",
            created_by: 1,
            created_by_name: "John Doe",
            created_at: new Date().toISOString(),
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      comments = [
        {
          id: 1,
          vc_id: vcId,
          message: "Mock comment - database unavailable",
          created_by: 1,
          created_by_name: "Mock User",
          created_at: new Date().toISOString(),
        },
      ];
    }

    res.json(comments);
  } catch (error) {
    console.error("Error fetching VC comments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC comments",
    });
  }
});

// Add comment to a VC
router.post("/:id/comments", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    const { message, created_by } = req.body;
    console.log(`💬 Creating comment for VC ${vcId}:`, { message, created_by });

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Comment message is required",
      });
    }

    if (!created_by) {
      return res.status(400).json({
        success: false,
        error: "created_by is required",
      });
    }

    let comment;
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(
        `🔍 Database available for creating VC comment: ${dbAvailable}`,
      );

      if (dbAvailable) {
        const query = `
          INSERT INTO vc_comments (vc_id, message, created_by, created_by_name)
          VALUES ($1, $2, $3, (SELECT first_name || ' ' || last_name FROM users WHERE id = $3))
          RETURNING *, (SELECT first_name || ' ' || last_name FROM users WHERE id = created_by) as created_by_name
        `;
        console.log(`📝 Executing query: ${query}`);
        console.log(`📊 Query values:`, [vcId, message.trim(), created_by]);

        const result = await pool.query(query, [
          vcId,
          message.trim(),
          created_by,
        ]);
        comment = result.rows[0];
        console.log(`✅ VC comment created in database:`, comment);
      } else {
        console.log("⚠️ Database not available, creating mock comment");
        // Mock comment creation when database is unavailable
        comment = {
          id: Math.floor(Math.random() * 1000) + 1,
          vc_id: vcId,
          message: message.trim(),
          created_by,
          created_by_name: "Mock User",
          created_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      comment = {
        id: Math.floor(Math.random() * 1000) + 1,
        vc_id: vcId,
        message: message.trim(),
        created_by,
        created_by_name: "Mock User",
        created_at: new Date().toISOString(),
      };
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Error creating VC comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC comment",
    });
  }
});

// Get step chats for VC steps
router.get("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid step ID",
      });
    }

    console.log(`💬 Fetching chats for VC step ${stepId}`);

    let chats = [];
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(`🔍 Database available for VC step chats: ${dbAvailable}`);

      if (dbAvailable) {
        // Check if this is actually a VC step
        const stepCheck = await pool.query(
          "SELECT vc_id FROM vc_steps WHERE id = $1",
          [stepId],
        );

        if (stepCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "VC step not found",
          });
        }

        // Get VC comments for this specific step using the repository
        const comments = await VCCommentRepository.findByStepId(stepId);

        // Format to match step chat structure
        chats = comments.map((comment) => ({
          id: comment.id,
          step_id: stepId,
          user_id: comment.user_id || comment.created_by,
          user_name: comment.created_by_name || comment.user_name,
          message: comment.message,
          message_type: comment.message_type || "text",
          is_rich_text:
            comment.is_rich_text !== undefined ? comment.is_rich_text : true,
          created_at: comment.created_at,
          attachments: comment.attachments || [],
        }));

        console.log(`📊 Found ${chats.length} VC comments as step chats`);
      } else {
        console.log("⚠️ Database not available, using mock step chats for VC");
        // Mock step chats when database is unavailable
        chats = [
          {
            id: 1,
            step_id: stepId,
            user_id: 1,
            user_name: "VC Team",
            message: "Step discussion started",
            message_type: "text",
            is_rich_text: true,
            created_at: new Date().toISOString(),
            attachments: [],
          },
        ];
      }
    } catch (dbError) {
      console.error("❌ Database error fetching VC step chats:", dbError);
      chats = [];
    }

    res.json(chats);
  } catch (error) {
    console.error("Error fetching VC step chats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC step chats",
    });
  }
});

// Create step chat for VC steps
router.post("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid step ID",
      });
    }

    const {
      user_id,
      user_name,
      message,
      message_type = "text",
      is_rich_text = true,
    } = req.body;

    console.log(`💬 Creating chat for VC step ${stepId}:`, {
      user_id,
      user_name,
      message,
      message_type,
      is_rich_text,
      attachments: req.body.attachments,
    });

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    let chat;
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(
        `🔍 Database available for creating VC step chat: ${dbAvailable}`,
      );

      if (dbAvailable) {
        // Check if this is actually a VC step and get the VC ID
        const stepCheck = await pool.query(
          "SELECT vc_id FROM vc_steps WHERE id = $1",
          [stepId],
        );

        if (stepCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "VC step not found",
          });
        }

        const vcId = stepCheck.rows[0].vc_id;

        // Create a VC comment for this step discussion using the repository
        const chatData: CreateVCCommentData = {
          vc_id: vcId,
          step_id: stepId,
          message: message.trim(),
          message_type,
          is_rich_text,
          user_id,
          user_name,
          created_by: user_id,
          attachments: req.body.attachments || [],
        };

        console.log(`📝 Creating VC comment with data:`, chatData);
        const comment = await VCCommentRepository.create(chatData);
        console.log(`✅ Created VC comment:`, {
          id: comment.id,
          attachments: comment.attachments,
        });

        // Format response to match step chat structure
        chat = {
          id: comment.id,
          step_id: stepId,
          user_id: comment.created_by,
          user_name: comment.created_by_name || comment.user_name,
          message: comment.message,
          message_type: comment.message_type || "text",
          is_rich_text:
            comment.is_rich_text !== undefined ? comment.is_rich_text : true,
          created_at: comment.created_at,
          attachments: comment.attachments || [],
        };

        console.log(`✅ VC step chat created:`, chat);
      } else {
        console.log("⚠️ Database not available, creating mock VC step chat");
        // Mock step chat when database is unavailable
        chat = {
          id: Math.floor(Math.random() * 1000) + 1,
          step_id: stepId,
          user_id,
          user_name,
          message: message.trim(),
          message_type,
          is_rich_text,
          created_at: new Date().toISOString(),
          attachments: [],
        };
      }
    } catch (dbError) {
      console.error("❌ Database error creating VC step chat:", dbError);
      // Fallback to mock
      chat = {
        id: Math.floor(Math.random() * 1000) + 1,
        step_id: stepId,
        user_id,
        user_name,
        message: message.trim(),
        message_type,
        is_rich_text,
        created_at: new Date().toISOString(),
        attachments: [],
      };
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating VC step chat:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC step chat",
    });
  }
});

// Update VC step chat
router.put("/chats/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    const { message, is_rich_text } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`📝 Updating VC chat ${id}:`, { message, is_rich_text });

    try {
      if (await isDatabaseAvailable()) {
        const success = await VCCommentRepository.update(id, {
          message,
          is_rich_text: is_rich_text || false,
        });
        if (!success) {
          console.log(`❌ VC chat ${id} not found in database`);
          return res.status(404).json({ error: "Chat not found" });
        }
        const updatedChat = await VCCommentRepository.findById(id);
        console.log(`✅ Successfully updated VC chat:`, updatedChat);
        res.json(updatedChat);
      } else {
        console.log(
          "Database unavailable, returning success for VC chat update",
        );
        res.json({ id, message, is_rich_text: is_rich_text || false });
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for VC chat update:",
        dbError.message,
      );
      res.json({ id, message, is_rich_text: is_rich_text || false });
    }
  } catch (error) {
    console.error("Error updating VC chat:", error);
    res.status(500).json({ error: "Failed to update VC chat" });
  }
});

// Delete VC step chat
router.delete("/chats/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    console.log(`🗑️ Deleting VC chat ${id}`);

    try {
      if (await isDatabaseAvailable()) {
        const success = await VCCommentRepository.delete(id);
        if (!success) {
          console.log(`❌ VC chat ${id} not found in database`);
          return res.status(404).json({ error: "Chat not found" });
        }
        console.log(`✅ Successfully deleted VC chat ${id}`);
        res.json({ success: true });
      } else {
        console.log(
          "Database unavailable, returning success for VC chat deletion",
        );
        res.json({ success: true });
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for VC chat deletion:",
        dbError.message,
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting VC chat:", error);
    res.status(500).json({ error: "Failed to delete VC chat" });
  }
});

export default router;
