const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');
const { checkLimit, incrementUsage } = require('../src/db');

// POST /v1/generate/image
// Body: { "prompt": "a cat on the moon", "width": 1024, "height": 1024 }
router.post('/image', async (req, res) => {
  const user = req.user;
  const { prompt, width = 1024, height = 1024, style = 'photographic' } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Provide a prompt (at least 3 characters).' });
  }

  // Check monthly limit
  const limit = checkLimit(user, 'image');
  if (!limit.ok) {
    return res.status(429).json({
      error: `Monthly image limit reached (${limit.limit} images). Upgrade your plan.`,
      used: limit.used,
      limit: limit.limit,
    });
  }

  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'jpeg');
    formData.append('width', String(width));
    formData.append('height', String(height));
    formData.append('style_preset', style);

    const response = await fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'application/json',
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Stability AI error:', err);
      return res.status(502).json({ error: 'Image generation failed. Try again.' });
    }

    const data = await response.json();

    // Count usage only on success
    incrementUsage(user, 'image');

    res.json({
      success: true,
      image_url: `data:image/jpeg;base64,${data.image}`,
      prompt,
      usage: {
        images_used_this_month: user.usage.images,
        images_remaining: checkLimit(user, 'image').limit - user.usage.images,
      }
    });

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

module.exports = router;
