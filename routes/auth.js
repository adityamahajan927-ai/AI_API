const express = require('express');
const router = express.Router();
const { createUser, getUserByKey, PLANS, db } = require('../src/db');
const authMiddleware = require('../src/middleware/auth');

// POST /auth/register
// Creates an account and returns an API key
// Body: { "email": "you@example.com", "plan": "starter" }
router.post('/register', (req, res) => {
  const { email, plan = 'starter' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Provide a valid email.' });
  }

  if (!PLANS[plan]) {
    return res.status(400).json({
      error: `Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}`
    });
  }

  if (db.users[email]) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const user = createUser(email, plan);

  res.status(201).json({
    message: '✅ Account created! Save your API key — it won\'t be shown again.',
    api_key: user.apiKey,
    plan: user.plan,
    limits: PLANS[user.plan],
    how_to_use: 'Add this header to every request: Authorization: Bearer ' + user.apiKey
  });
});

// GET /auth/usage  (requires API key)
// Returns how much of the monthly quota you've used
router.get('/usage', authMiddleware, (req, res) => {
  const user = req.user;
  const plan = PLANS[user.plan];

  res.json({
    plan: user.plan,
    billing_period_resets: user.usage.resetAt,
    usage: {
      images: { used: user.usage.images, limit: plan.images, remaining: plan.images - user.usage.images },
      videos: { used: user.usage.videos, limit: plan.videos, remaining: plan.videos - user.usage.videos },
    }
  });
});

module.exports = router;
