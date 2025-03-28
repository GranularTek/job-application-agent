// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { body } = require('express-validator');
const { authenticateToken } = require('../app'); // at the top if not present

// GET all jobs with optional filters (search, location, source)
router.get('/', jobController.getJobs);

router.get('/my', authenticateToken, jobController.getMyJobs);

// GET a single job by ID
router.get('/:id', jobController.getJobById);

// POST a new job manually (optional) — with validation
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('company').notEmpty().withMessage('Company is required'),
    body('location').notEmpty().withMessage('Location is required')
  ],
  jobController.createJob
);

// PATCH to update job status (e.g., applied)
router.patch('/:id', jobController.updateJobStatus);

// DELETE a job by ID
router.delete('/:id', jobController.deleteJob);

module.exports = router;
