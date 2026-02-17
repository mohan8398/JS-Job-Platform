const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();

const { searchJobs } = require("./services/jobService");

const app = express();
const PORT = process.env.PORT || 5000;
const APPLIED_JOBS_FILE = path.join(__dirname, 'applied_jobs.json');

if (!fs.existsSync(APPLIED_JOBS_FILE)) {
  fs.writeFileSync(APPLIED_JOBS_FILE, JSON.stringify([], null, 2));
}

app.use(cors());
app.use(express.json());

// API Route
app.get("/api/jobs", async (req, res) => {
  try {
    const query = req.query.query || "Node.js MERN Stack";
    const location = req.query.location || "Bengaluru";

    const jobs = await searchJobs(query, location);
    console.log(jobs);
    res.json({
      timestamp: new Date().toISOString(),
      total: jobs.length,
      source: jobs.length > 0 ? "Multiple Live APIs (Adzuna, Remotive, JSearch...)" : "None",
      jobs
    });

  } catch (err) {
    console.error("Search API Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Applied Jobs Storage
app.post('/api/apply', (req, res) => {
  try {
    const job = { ...req.body, appliedAt: new Date().toISOString() };
    let applied = JSON.parse(fs.readFileSync(APPLIED_JOBS_FILE, 'utf8') || '[]');
    applied.push(job);
    fs.writeFileSync(APPLIED_JOBS_FILE, JSON.stringify(applied, null, 2));
    res.status(201).json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/applied', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(APPLIED_JOBS_FILE, 'utf8') || '[]'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

////////////////////////////////////////////////////////////
// Background Cron Refresh (Every 15 minutes)
////////////////////////////////////////////////////////////

cron.schedule("*/15 * * * *", async () => {
  console.log("🔄 Background refresh running for MERN/Node Bengalury...");
  try {
    await searchJobs("Node.js MERN Stack", "Bengaluru, Remote");
    console.log("✅ Cache refreshed for MERN/Node Stack");
  } catch (err) {
    console.log("Cron failed:", err.message);
  }
});

app.listen(PORT, () =>
  console.log(`🚀 AI Job Engine running on http://localhost:${PORT}`)
);
