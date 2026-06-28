const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const imageRoutes = require('../routes/image');
const videoRoutes = require('../routes/video');
const statusRoutes = require('../routes/status');
const authRoutes = require('../routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Rate limiter: max 60 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please slow down.' }
}));

// Public routes (no API key needed)
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'AI Generation API',
    version: '1.0.0',
    endpoints: {
      'POST /v1/generate/image': 'Generate image from text',
      'POST /v1/generate/video': 'Generate video from text',
      'GET  /v1/status/:job_id': 'Check video job status',
      'POST /auth/register':     'Create account & get API key',
      'GET  /auth/usage':        'Check your usage',
    }
  });
});

// Protected routes (API key required)
app.use('/v1', authMiddleware);
app.use('/v1/generate', imageRoutes);
app.use('/v1/generate', videoRoutes);
app.use('/v1', statusRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI API server running on port ${PORT}`);
});
