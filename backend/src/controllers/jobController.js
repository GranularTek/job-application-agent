const Job = require('../models/Job');
const { validationResult } = require('express-validator');

// GET /api/jobs?search=&location=&source=
exports.getJobs = async (req, res) => {
  try {
    const { search, location, source, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.title = new RegExp(search, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (source) query.source = source;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('❌ Error fetching jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/jobs
exports.createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newJob = new Job({ ...req.body, createdBy: req.user.id });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(400).json({ message: 'Invalid job data' });
  }
};

// PATCH /api/jobs/:id
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job status' });
  }
};

// DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job' });
  }
};

// GET /api/jobs/my - Get jobs submitted by the logged-in user
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('❌ Error fetching user jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
