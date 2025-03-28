const express = require('express');
const { scrapeJobs } = require('../controllers/jobScraperController');
const { authenticateToken } = require('../app');

const router = express.Router();

router.get('/scrape', authenticateToken, scrapeJobs); // protect scraper access

module.exports = router;
