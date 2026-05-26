const express = require("express");
const mongoose = require("mongoose");
const { verifyToken } = require("@clerk/backend");
const PLAN_LIMITS = require("../config/planLimits");

const router = express.Router();

async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, error: "Missing or invalid Authorization header" });
    }

    const jwtPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    req.auth = {
      userId: jwtPayload.sub,
      sessionId: jwtPayload.sid,
      claims: jwtPayload,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired session token: " + err.message });
  }
}

function buildUsageCounters(profile) {
  const defaults = {
    resumeAnalysis: { count: 0, lastReset: null },
    jobFitResume: { count: 0, lastReset: null },
    interviewPrep: { count: 0, lastReset: null },
    coverLetter: { count: 0, lastReset: null },
  };

  const counters = profile?.usageCounters || {};
  return Object.keys(defaults).reduce((acc, key) => {
    const current = counters[key] || {};
    acc[key] = {
      count: typeof current.count === "number" ? current.count : 0,
      lastReset: current.lastReset || null,
    };
    return acc;
  }, {});
}

// GET /api/plans/usage
router.get("/usage", clerkAuth, async (req, res) => {
  try {
    const Profile = mongoose.model("Profile");
    const profile = await Profile.findOne({ clerkId: req.auth.userId });
    const plan = profile?.plan || "free";

    res.json({
      success: true,
      plan,
      hasChosenPlan: !!profile?.hasChosenPlan,
      planSelectedAt: profile?.planSelectedAt || null,
      usageCounters: buildUsageCounters(profile),
      limits: PLAN_LIMITS[plan] || PLAN_LIMITS.free,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/plans/select-free
router.post("/select-free", clerkAuth, async (req, res) => {
  try {
    const Profile = mongoose.model("Profile");
    const now = new Date();

    const profile = await Profile.findOneAndUpdate(
      { clerkId: req.auth.userId },
      {
        $set: {
          plan: "free",
          hasChosenPlan: true,
          planSelectedAt: now,
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      plan: profile.plan || "free",
      hasChosenPlan: !!profile.hasChosenPlan,
      planSelectedAt: profile.planSelectedAt || now,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;