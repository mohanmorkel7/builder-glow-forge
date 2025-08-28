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

async function migrateProbabilityFields() {
  try {
    console.log("Starting probability field migration...");

    // Add probability_percent column to lead_steps table
    console.log("1. Adding probability_percent column to lead_steps...");
    await pool.query(`
      ALTER TABLE lead_steps 
      ADD COLUMN IF NOT EXISTS probability_percent INTEGER DEFAULT 0;
    `);

    // Update existing lead steps to have equal probability distribution
    console.log(
      "2. Updating existing lead steps with equal probability distribution...",
    );
    await pool.query(`
      UPDATE lead_steps 
      SET probability_percent = (
          SELECT CASE 
              WHEN COUNT(*) > 0 THEN FLOOR(100.0 / COUNT(*))
              ELSE 0 
          END
          FROM lead_steps ls2 
          WHERE ls2.lead_id = lead_steps.lead_id
      )
      WHERE probability_percent = 0 OR probability_percent IS NULL;
    `);

    // Ensure no lead has total probability > 100%
    console.log("3. Ensuring total probabilities don't exceed 100%...");
    await pool.query(`
      WITH lead_totals AS (
          SELECT 
              lead_id,
              SUM(probability_percent) as total_prob,
              COUNT(*) as step_count
          FROM lead_steps 
          GROUP BY lead_id
      ),
      updated_steps AS (
          SELECT 
              ls.id,
              ls.lead_id,
              CASE 
                  WHEN lt.total_prob > 100 THEN FLOOR(100.0 / lt.step_count)
                  ELSE ls.probability_percent
              END as new_prob
          FROM lead_steps ls
          JOIN lead_totals lt ON ls.lead_id = lt.lead_id
          WHERE lt.total_prob > 100
      )
      UPDATE lead_steps 
      SET probability_percent = updated_steps.new_prob
      FROM updated_steps
      WHERE lead_steps.id = updated_steps.id;
    `);

    // Add some sample template probabilities if templates exist
    console.log("4. Adding sample probabilities to template steps...");
    await pool.query(`
      UPDATE template_steps 
      SET probability_percent = 
          CASE step_order
              WHEN 1 THEN 20  -- Initial Contact
              WHEN 2 THEN 30  -- Document Collection  
              WHEN 3 THEN 25  -- Contract Signing
              WHEN 4 THEN 15  -- Account Setup
              WHEN 5 THEN 10  -- Training Session
              ELSE FLOOR(100.0 / (SELECT COUNT(*) FROM template_steps ts2 WHERE ts2.template_id = template_steps.template_id))
          END
      WHERE template_id IN (SELECT id FROM onboarding_templates LIMIT 5)
      AND (probability_percent = 0 OR probability_percent IS NULL);
    `);

    // Verify the migration
    console.log("5. Verifying migration...");
    const verifyResult = await pool.query(`
      SELECT 
          'lead_steps' as table_name,
          COUNT(*) as total_rows,
          COUNT(CASE WHEN probability_percent > 0 THEN 1 END) as rows_with_probability,
          AVG(probability_percent) as avg_probability
      FROM lead_steps
      UNION ALL
      SELECT 
          'template_steps' as table_name,
          COUNT(*) as total_rows,
          COUNT(CASE WHEN probability_percent > 0 THEN 1 END) as rows_with_probability,
          AVG(probability_percent) as avg_probability
      FROM template_steps;
    `);

    console.log("Migration verification results:");
    console.table(verifyResult.rows);

    // Check lead probability totals
    const leadTotals = await pool.query(`
      SELECT 
          lead_id,
          COUNT(*) as step_count,
          SUM(probability_percent) as total_probability
      FROM lead_steps 
      GROUP BY lead_id
      HAVING SUM(probability_percent) > 0
      ORDER BY lead_id;
    `);

    console.log("Lead probability totals:");
    console.table(leadTotals.rows);

    console.log("✅ Probability field migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateProbabilityFields()
    .then(() => {
      console.log("Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateProbabilityFields };
