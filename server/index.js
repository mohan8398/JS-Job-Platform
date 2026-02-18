const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();

const { searchJobs } = require("./services/jobService");
const AppliedJob = require("./models/AppliedJob");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/findj";

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("📦 Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use("/api/", limiter);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// API Route
app.get("/api/jobs", async (req, res) => {
  try {
    const query = req.query.query || "Node.js MERN Stack";
    const location = req.query.location || "Bengaluru";

    const jobs = await searchJobs(query, location);
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

// Applied Jobs Storage (MongoDB)
app.post('/api/apply', async (req, res) => {
  try {
    const job = new AppliedJob({ ...req.body });
    await job.save();
    res.status(201).json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/applied', async (req, res) => {
  try {
    const applied = await AppliedJob.find().sort({ appliedAt: -1 });
    res.json(applied);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

cron.schedule("*/15 * * * *", async () => {
  console.log("🔄 Background refresh running for MERN/Node Bengaluru...");
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
