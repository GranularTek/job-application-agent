// services/scrapers/jobScraperService.js
const mongoose = require('mongoose');
const scrapeLinkedIn = require('./scrapeLinkedIn');
const scrapeDice = require('./scrapeDice');
const scrapeIndeed = require('./scrapeIndeed');
const Job = require('../../models/Job');
const ErrorLog = require('../../models/ErrorLog');
const { execSync } = require('child_process');
const { isSessionValid } = require('../auth/sessionManager');
const { MONGO_URI } = require('../../config/envConfig');
const { chromium } = require('playwright');

// 🔹 Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

async function saveJobs(jobs, user) {
  console.log(`💾 Saving ${jobs.length} jobs to MongoDB...`);

  let savedCount = 0;
  for (const job of jobs) {
    if (job.title === 'N/A' || job.company === 'N/A' || job.link === 'N/A') {
      console.warn(`⚠️ Skipping job due to missing fields:`, job);
      await ErrorLog.create({
        source: 'JobScraperService',
        message: 'Missing required job fields',
        details: job,
        context: 'saveJobs'
      });
      continue;
    }

    const jobData = {
      ...job,
      createdBy: user?.id || null,
      scrapedAt: new Date()
    };

    if (user?.role === 'org' && user.organizationId) {
      jobData.organization = user.organizationId;
    }

    await Job.updateOne(
      { title: job.title, company: job.company, location: job.location },
      { $set: jobData },
      { upsert: true }
    );

    savedCount++;
  }

  console.log(`✅ Saved ${savedCount} valid jobs.`);
}

async function runScraper(jobTitle = 'Software Engineer', location = 'Remote', user = null) {
  console.log(`🚀 Running Job Scraper for ${jobTitle} in ${location}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const sessionValid = await isSessionValid(page);
  if (!sessionValid) {
    console.log("⚠️ LinkedIn session expired! Logging in...");
    execSync('node src/services/loginLinkedIn.js', { stdio: 'inherit' });
  }

  const [diceJobs, indeedJobs, linkedInJobs] = await Promise.all([
    scrapeDice(jobTitle),
    scrapeIndeed(jobTitle, location),
    scrapeLinkedIn(jobTitle)
  ]);

  const allJobs = [
    ...diceJobs,
    ...(Array.isArray(indeedJobs) ? indeedJobs : []),
    ...(Array.isArray(linkedInJobs) ? linkedInJobs : [])
  ];

  console.log(`✅ Total jobs scraped: ${allJobs.length}`);

  if (allJobs.length > 0) {
    await saveJobs(allJobs, user);
  } else {
    console.log('⚠️ No jobs found, skipping database save.');
  }

  console.log('🎉 Scraper Completed');
  mongoose.connection.close();
}

module.exports = { runScraper };
