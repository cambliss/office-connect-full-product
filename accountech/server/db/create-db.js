require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://admin:IntegratedAI@localhost:5432/accountech';
  const mainDbUrl = dbUrl.replace(/\/accountech(\?.*)?$/, '/postgres$1');
  
  const client = new Client({ connectionString: mainDbUrl });
  await client.connect();

  const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'accountech'");
  if (res.rows.length === 0) {
    console.log("Database 'accountech' does not exist. Creating...");
    await client.query("CREATE DATABASE accountech");
    console.log("✅ Database 'accountech' created!");
  } else {
    console.log("✅ Database 'accountech' already exists.");
  }

  await client.end();
}

createDatabase().catch(err => {
  console.error("❌ Database creation error:", err);
  process.exit(1);
});
