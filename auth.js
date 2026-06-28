const { getUserByKey } = require('../db');

// Checks the API key on every /v1/ request
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing API key. Add header: Authorization: Bearer YOUR_API_KEY'
    });
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();
  const user = getUserByKey(apiKey);

  if (!user) {
    return res.status(401).json({ error: 'Invalid API key.' });
  }

  req.user = user; // attach user to request
  next();
}

module.exports = authMiddleware;
