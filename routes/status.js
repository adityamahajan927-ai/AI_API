const express = require('express');
const router = express.Router();
const { getJob } = require('../src/db');

// GET /v1/status/:job_id
// Returns the current status of a video generation job
router.get('/status/:job_id', (req, res) => {
  const { job_id } = req.params;
  const job = getJob(job_id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Make sure this job belongs to the requesting user
  if (job.userEmail !== req.user.email) {
    return res.status(403).json({ error: 'This job does not belong to your account.' });
  }

  if (job.status === 'processing') {
    return res.json({
      job_id: job.id,
      status: 'processing',
      message: 'Still generating... check back in a few seconds.',
      created_at: job.createdAt,
    });
  }

  if (job.status === 'failed') {
    return res.json({
      job_id: job.id,
      status: 'failed',
      error: job.error || 'Generation failed.',
    });
  }

  // Completed!
  res.json({
    job_id: job.id,
    status: 'completed',
    video_url: job.resultUrl,
    prompt: job.prompt,
    created_at: job.createdAt,
    completed_at: job.completedAt,
  });
});

module.exports = router;
