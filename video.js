const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { checkLimit, incrementUsage, createJob, db } = require('../src/db');

// POST /v1/generate/video
// Body: { "prompt": "a rocket launching into space", "duration": 5 }
router.post('/video', async (req, res) => {
  const user = req.user;
  const { prompt, duration = 5 } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Provide a prompt (at least 3 characters).' });
  }

  // Check monthly limit
  const limit = checkLimit(user, 'video');
  if (!limit.ok) {
    return res.status(429).json({
      error: `Monthly video limit reached (${limit.limit} videos). Upgrade your plan.`,
      used: limit.used,
      limit: limit.limit,
    });
  }

  // Create a job record immediately
  const job = createJob('video', prompt, user.email);

  // Return the job ID right away — video takes 30-90 seconds
  res.status(202).json({
    success: true,
    message: 'Video generation started. Poll /v1/status/:job_id for the result.',
    job_id: job.id,
    estimated_wait: '30-90 seconds',
    check_status_url: `/v1/status/${job.id}`,
  });

  // Generate the video in the background
  generateVideoInBackground(job, prompt, duration, user);
});

async function generateVideoInBackground(job, prompt, duration, user) {
  try {
    // Step 1: Create the task on Runway
    const createRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptText: prompt,
        duration,
        ratio: '1280:768',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      console.error('Runway create error:', err);
      job.status = 'failed';
      job.error = 'Video generation failed to start.';
      return;
    }

    const task = await createRes.json();
    const taskId = task.id;

    // Step 2: Poll until done (Runway takes 30-90 seconds)
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await sleep(5000); // wait 5 seconds between polls
      attempts++;

      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();

      if (pollData.status === 'SUCCEEDED') {
        job.status = 'completed';
        job.resultUrl = pollData.output?.[0];
        job.completedAt = new Date().toISOString();
        incrementUsage(user, 'video');
        return;
      }

      if (pollData.status === 'FAILED') {
        job.status = 'failed';
        job.error = 'Runway failed to generate the video.';
        return;
      }
    }

    job.status = 'failed';
    job.error = 'Timed out waiting for video.';

  } catch (err) {
    console.error('Background video error:', err);
    job.status = 'failed';
    job.error = 'Unexpected error during generation.';
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;
