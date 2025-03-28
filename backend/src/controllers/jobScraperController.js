const { runScraper } = require('../services/scrapers/jobScraperService');

exports.scrapeJobs = async (req, res) => {
    try {
      const { title = 'Software Engineer', location = 'Remote' } = req.query;
      await runScraper(title, location, req.user); // 👈 pass logged-in user
      res.status(200).json({ message: "Job scraping completed successfully." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
