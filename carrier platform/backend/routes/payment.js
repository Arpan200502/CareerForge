const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { verifyToken } = require("@clerk/backend");
const PLAN_PRICING = require("../config/paymentPlans");

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

function normalizePlan(plan) {
  return String(plan || "").trim().toLowerCase();
}

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials");
  }

  return { keyId, keySecret };
}

function normalizePaymentId(body) {
  return body.razorpay_payment_id || body.payment_id || "";
}

function normalizeOrderId(body) {
  return body.razorpay_order_id || body.order_id || "";
}

function normalizeSignature(body) {
  return body.razorpay_signature || body.signature || "";
}

function getPaymentPlan(planKey) {
  const normalized = normalizePlan(planKey);
  return PLAN_PRICING[normalized] || null;
}

function formatPaymentPlan(planKey) {
  const plan = getPaymentPlan(planKey);
  if (!plan) return null;

  return {
    key: planKey,
    label: plan.label,
    amount: plan.amount,
    currency: plan.currency,
    description: plan.description,
    displayPrice: `INR ${(plan.amount / 100).toFixed(2)}`,
  };
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

async function fetchRazorpayOrder(orderId) {
  const { keyId, keySecret } = getRazorpayConfig();
  const response = await axios.get(`https://api.razorpay.com/v1/orders/${orderId}`, {
    auth: { username: keyId, password: keySecret },
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
}

async function setProfilePlan(clerkId, planKey) {
  const Profile = mongoose.model("Profile");
  const now = new Date();

  const profile = await Profile.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        plan: planKey,
        hasChosenPlan: true,
        planSelectedAt: now,
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return { profile, now };
}

// GET /api/payment/catalog
router.get("/catalog", (req, res) => {
  try {
    const { keyId } = getRazorpayConfig();

    res.json({
      success: true,
      keyId,
      plans: {
        pro: formatPaymentPlan("pro"),
        max: formatPaymentPlan("max"),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payment/create-order
router.post("/create-order", clerkAuth, async (req, res) => {
  try {
    const planKey = normalizePlan(req.body?.plan);
    const plan = getPaymentPlan(planKey);

    if (!plan) {
      return res.status(400).json({ success: false, error: "Unsupported payment plan" });
    }

    const { keyId, keySecret } = getRazorpayConfig();
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: plan.amount,
        currency: plan.currency,
        receipt: `plan_${planKey}_${Date.now()}`,
        notes: {
          plan: planKey,
          clerkId: req.auth.userId,
          description: plan.description,
        },
      },
      {
        auth: { username: keyId, password: keySecret },
        headers: { "Content-Type": "application/json" },
      }
    );

    res.json({
      success: true,
      keyId,
      order: response.data,
      plan: formatPaymentPlan(planKey),
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.description || err.message;
    res.status(status).json({ success: false, error: message });
  }
});

// POST /api/payment/verify
router.post("/verify", async (req, res) => {
  try {
    const { keySecret } = getRazorpayConfig();
    const orderId = normalizeOrderId(req.body || {});
    const paymentId = normalizePaymentId(req.body || {});
    const signature = normalizeSignature(req.body || {});

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );

    if (!isValid) {
      return res.status(400).json({ success: false, verified: false, error: "Invalid payment signature" });
    }

    res.json({ success: true, verified: true });
  } catch (err) {
    const isLengthError = /Input buffers must have the same byte length/.test(err.message);
    res.status(isLengthError ? 400 : 500).json({
      success: false,
      verified: false,
      error: isLengthError ? "Invalid payment signature" : err.message,
    });
  }
});

// POST /api/payment/verify-and-apply
router.post("/verify-and-apply", clerkAuth, async (req, res) => {
  try {
    const planKey = normalizePlan(req.body?.plan);
    const plan = getPaymentPlan(planKey);
    if (!plan) {
      return res.status(400).json({ success: false, error: "Unsupported payment plan" });
    }

    const { keySecret } = getRazorpayConfig();
    const orderId = normalizeOrderId(req.body || {});
    const paymentId = normalizePaymentId(req.body || {});
    const signature = normalizeSignature(req.body || {});

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );

    if (!isValid) {
      return res.status(400).json({ success: false, verified: false, error: "Invalid payment signature" });
    }

    const order = await fetchRazorpayOrder(orderId);
    const orderPlan = normalizePlan(order?.notes?.plan);
    const orderAmount = Number(order?.amount || 0);

    if (orderPlan !== planKey || orderAmount !== plan.amount) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment details do not match the selected plan",
      });
    }

    const { profile, now } = await setProfilePlan(req.auth.userId, planKey);

    res.json({
      success: true,
      verified: true,
      plan: planKey,
      planSelectedAt: now,
      usageCounters: buildUsageCounters(profile),
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.description || err.message;
    res.status(status).json({ success: false, verified: false, error: message });
  }
});

module.exports = router;
