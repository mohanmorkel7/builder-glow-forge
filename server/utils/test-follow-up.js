// Test script for follow-up creation
const { pool } = require("../database/connection");

async function testFollowUpCreation() {
  try {
    console.log("Testing follow-up creation...");

    // Test data matching what the frontend sends
    const testFollowUp = {
      client_id: null,
      lead_id: 1,
      title: "Test Follow-up",
      description: "Test description",
      due_date: "2025-07-31",
      follow_up_type: "call", // This was causing the constraint violation
      assigned_to: 3,
      created_by: 38,
      message_id: 10,
    };

    // First check if database is available
    try {
      await pool.query("SELECT 1");
      console.log("Database is available");
    } catch (error) {
      console.log("Database not available:", error.message);
      return;
    }

    // Try to create the follow-up
    const query = `
      INSERT INTO follow_ups (
        client_id, lead_id, title, description, due_date,
        follow_up_type, assigned_to, created_by, message_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      testFollowUp.client_id,
      testFollowUp.lead_id,
      testFollowUp.title,
      testFollowUp.description,
      testFollowUp.due_date,
      testFollowUp.follow_up_type,
      testFollowUp.assigned_to,
      testFollowUp.created_by,
      testFollowUp.message_id,
    ];

    const result = await pool.query(query, values);
    console.log("Follow-up created successfully:", result.rows[0]);

    // Clean up - delete the test record
    await pool.query("DELETE FROM follow_ups WHERE id = $1", [
      result.rows[0].id,
    ]);
    console.log("Test record cleaned up");
  } catch (error) {
    console.error("Test failed:", error.message);

    // If it's a constraint violation, that's our target error
    if (error.message.includes("follow_ups_follow_up_type_check")) {
      console.log("❌ Still getting constraint violation for follow_up_type");
      console.log("Need to run migration to fix database schema");
    } else if (
      error.message.includes("column") &&
      error.message.includes("does not exist")
    ) {
      console.log("❌ Column missing in database");
      console.log("Need to run migration to add missing columns");
    } else {
      console.log("❌ Other error:", error.message);
    }
  } finally {
    await pool.end();
  }
}

// Run the test if called directly
if (require.main === module) {
  testFollowUpCreation();
}

module.exports = { testFollowUpCreation };
