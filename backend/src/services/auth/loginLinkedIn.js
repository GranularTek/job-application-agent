const { chromium } = require('playwright');
const { loadSessionCookies, saveSessionCookies } = require('../auth/sessionManager');

async function scrapeLinkedIn(jobTitle) {
    console.log(`🔍 Starting LinkedIn Scraper for ${jobTitle} in the US...`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        let cookies = loadSessionCookies();
        if (cookies) {
            console.log("🔄 Using saved LinkedIn session...");
            await context.addCookies(cookies);
        }

        await page.goto(`https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=United%20States`, { timeout: 90000 });

        console.log(`✅ LinkedIn page loaded for ${jobTitle}`);

        // ✅ Save updated session cookies
        const updatedCookies = await context.cookies();
        saveSessionCookies(updatedCookies);

        await page.waitForTimeout(3000);
        await page.waitForSelector('.job-card-container', { timeout: 60000 });

        console.log('✅ Extracting job listings...');
        const jobs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.job-card-container')).map(job => ({
                title: job.querySelector('.job-card-list__title')?.innerText.trim() || 'N/A',
                company: job.querySelector('.job-card-container__company-name')?.innerText.trim() || 'N/A',
                location: job.querySelector('.job-card-container__metadata-item')?.innerText.trim() || 'N/A',
                link: job.querySelector('.job-card-list__title a')?.href || 'N/A',
                source: 'LinkedIn'
            }));
        });

        console.log(`✅ Scraped ${jobs.length} jobs from LinkedIn:`, jobs);
        await browser.close();
        return jobs;
    } catch (error) {
        console.error('❌ Error scraping LinkedIn:', error);
        await browser.close();
        return [];
    }
}

module.exports = scrapeLinkedIn;
