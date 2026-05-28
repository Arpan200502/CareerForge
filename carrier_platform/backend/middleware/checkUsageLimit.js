const mongoose = require("mongoose");
const PLAN_LIMITS = require("../config/planLimits");

function normalizeLimit(limit) {
  return limit === Infinity ? Infinity : Number(limit) || 0;
}

function checkUsageLimit(featureKey) {
  return async function usageLimitMiddleware(req, res, next) {
    try {
      if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const Profile = mongoose.model("Profile");
      const profile = await Profile.findOne({ clerkId: req.auth.userId });
      if (!profile) {
        return res.status(404).json({ success: false, error: "Profile not found" });
      }

      const plan = profile.plan || "free";
      const limit = normalizeLimit(PLAN_LIMITS[plan]?.[featureKey]);
      const currentCount = profile.usageCounters?.[featureKey]?.count || 0;

      if (limit !== Infinity && currentCount >= limit) {
        return res.status(403).json({
          success: false,
          error: "Usage limit reached",
          plan,
          feature: featureKey,
          limit,
          count: currentCount,
        });
      }

      await Profile.updateOne(
        { clerkId: req.auth.userId },
        { $inc: { [`usageCounters.${featureKey}.count`]: 1 } }
      );

      req.planUsage = { plan, featureKey, limit, count: currentCount + 1 };
      next();
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

module.exports = checkUsageLimit;