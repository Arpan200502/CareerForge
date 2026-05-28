require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/career-platform";

const profileSchema = new mongoose.Schema(
  {
    plan: { type: String, enum: ["free", "pro", "max"], default: "free" },
    hasChosenPlan: { type: Boolean, default: false },
    planSelectedAt: { type: Date, default: null },
    usageCounters: {
      resumeAnalysis: {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now },
      },
      jobFitResume: {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now },
      },
      interviewPrep: {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now },
      },
      coverLetter: {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now },
      },
    },
  },
  { strict: false, collection: "profiles" }
);

const Profile = mongoose.model("Profile", profileSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");

    const now = new Date();
    console.log("Updating profiles missing plan fields...");
    const result = await Profile.updateMany(
      {
        $or: [
          { plan: { $exists: false } },
          { plan: null },
        ],
      },
      {
        $set: {
          plan: "free",
          hasChosenPlan: false,
          planSelectedAt: null,
          usageCounters: {
            resumeAnalysis: { count: 0, lastReset: now },
            jobFitResume: { count: 0, lastReset: now },
            interviewPrep: { count: 0, lastReset: now },
            coverLetter: { count: 0, lastReset: now },
          },
        },
      }
    );

    console.log(`Migration complete. Matched: ${result.matchedCount || result.n || 0}, Updated: ${result.modifiedCount || result.nModified || 0}`);
  } catch (err) {
    console.error("Migration failed:");
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    } catch (disconnectErr) {
      console.error("MongoDB disconnect failed:", disconnectErr && disconnectErr.stack ? disconnectErr.stack : disconnectErr);
      process.exitCode = 1;
    }
  }
}

run();
