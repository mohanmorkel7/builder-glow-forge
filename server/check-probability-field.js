const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/banani_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function checkProbabilityField() {
  try {
    console.log("Checking database structure for probability_percent field...");

    // Check if probability_percent column exists in lead_steps table
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lead_steps' 
      AND column_name = 'probability_percent'
    `);

    if (columnCheck.rows.length > 0) {
      console.log("✅ probability_percent column exists in lead_steps table:");
      console.table(columnCheck.rows);
    } else {
      console.log(
        "❌ probability_percent column NOT found in lead_steps table",
      );
      console.log("Need to run migration to add the column");
    }

    // Check current lead_steps data
    const dataCheck = await pool.query(`
      SELECT id, name, probability_percent, status
      FROM lead_steps 
      WHERE lead_id = 1 
      ORDER BY step_order
    `);

    console.log("\n📋 Current lead_steps data for lead_id = 1:");
    if (dataCheck.rows.length > 0) {
      console.table(dataCheck.rows);
    } else {
      console.log("No lead steps found for lead_id = 1");
    }

    // Check template_steps for comparison
    const templateCheck = await pool.query(`
      SELECT ts.name, ts.probability_percent, ts.step_order
      FROM template_steps ts
      JOIN onboarding_templates ot ON ts.template_id = ot.id
      WHERE ot.id = 1
      ORDER BY ts.step_order
    `);

    console.log("\n📋 Template steps data for template_id = 1:");
    if (templateCheck.rows.length > 0) {
      console.table(templateCheck.rows);
    } else {
      console.log("No template steps found for template_id = 1");
    }
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
    console.log("📝 This might mean:");
    console.log("1. Database is not running");
    console.log("2. Connection string is incorrect");
    console.log("3. Tables don't exist yet");
    console.log("4. Using mock data instead");
  } finally {
    await pool.end();
  }
}

// Run the check
checkProbabilityField();
