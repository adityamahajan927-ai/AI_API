// Simple in-memory store. For production, swap this with a real database (PostgreSQL, MongoDB, etc.)
// Data resets when server restarts — good for testing, use a DB for real money.

const crypto = require('crypto');

const db = {
  users: {},   // email -> user object
  keys: {},    // apiKey -> user email
  jobs: {},    // jobId -> job object
};

// ─── PLANS ───────────────────────────────────────────────────────────────────
const PLANS = {
  starter:  { price: 19,  images: 200,  videos: 10  },
  pro:      { price: 49,  images: 1000, videos: 60  },
  business: { price: 149, images: 5000, videos: 300 },
};

// ─── USER HELPERS ─────────────────────────────────────────────────────────────
function createUser(email, plan = 'starter') {
  const apiKey = 'sk-' + crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month

  const user = {
    email,
    plan,
    apiKey,
    createdAt: now.toISOString(),
    usage: { images: 0, videos: 0, resetAt: resetDate.toISOString() },
  };

  db.users[email] = user;
  db.keys[apiKey] = email;
  return user;
}

function getUserByKey(apiKey) {
  const email = db.keys[apiKey];
  if (!email) return null;
  return db.users[email];
}

function resetUsageIfNeeded(user) {
  if (new Date() >= new Date(user.usage.resetAt)) {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    user.usage = { images: 0, videos: 0, resetAt: next.toISOString() };
  }
}

function checkLimit(user, type) {
  resetUsageIfNeeded(user);
  const plan = PLANS[user.plan];
  const used = user.usage[type + 's'];
  const limit = plan[type + 's'];
  return { ok: used < limit, used, limit };
}

function incrementUsage(user, type) {
  user.usage[type + 's'] = (user.usage[type + 's'] || 0) + 1;
}

// ─── JOB HELPERS ──────────────────────────────────────────────────────────────
function createJob(type, prompt, userEmail) {
  const jobId = 'job_' + crypto.randomBytes(12).toString('hex');
  const job = {
    id: jobId,
    type,
    prompt,
    userEmail,
    status: 'processing',
    resultUrl: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  db.jobs[jobId] = job;
  return job;
}

function getJob(jobId) {
  return db.jobs[jobId] || null;
}

module.exports = { db, PLANS, createUser, getUserByKey, checkLimit, incrementUsage, createJob, getJob };
