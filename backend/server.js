const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const DB_HOST = process.env.DB_HOST || "mysql";
const DB_PORT = process.env.DB_PORT || "3306";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "rootpass";
const DB_NAME = process.env.DB_NAME || "appdb";

let pool;

// Retry loop so backend can start before MySQL is fully ready
async function connectWithRetry() {
  const maxRetries = 30;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
      });

      // test connection
      await pool.query("SELECT 1");
      console.log("✅ Connected to MySQL");

      // create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          content VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("✅ Table ensured: messages");
      return;
    } catch (err) {
      console.log(`⏳ MySQL not ready (attempt ${i}/${maxRetries}): ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("❌ Could not connect to MySQL after retries");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/messages", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, content, created_at FROM messages ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).json({ error: "content required" });

    await pool.query("INSERT INTO messages (content) VALUES (?)", [content]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Backend listening on ${PORT}`));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
