const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/banani_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const client = await pool.connect();
    console.log("✅ Database connected successfully");

    // Test if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('leads', 'lead_steps', 'lead_chats', 'users')
      ORDER BY table_name
    `);

    console.log(
      "📋 Existing tables:",
      result.rows.map((row) => row.table_name),
    );

    // Test lead_chats table specifically
    const chatResult = await client.query("SELECT COUNT(*) FROM lead_chats");
    console.log("💬 Chat messages in database:", chatResult.rows[0].count);

    // Test lead_steps table
    const stepsResult = await client.query("SELECT COUNT(*) FROM lead_steps");
    console.log("📝 Steps in database:", stepsResult.rows[0].count);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Full error:", error);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log("\n🎉 Database is ready for use!");
  } else {
    console.log("\n⚠️  Database not available, will use mock data");
  }
  process.exit(0);
});
