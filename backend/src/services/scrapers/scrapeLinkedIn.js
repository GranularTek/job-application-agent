const { chromium } = require('playwright');
const { loadSessionCookies, saveSessionCookies } = require('../auth/sessionManager');
const { execSync } = require('child_process');

async function scrapeLinkedIn(jobTitle) {
    console.log(`🔍 Starting LinkedIn Scraper for ${jobTitle} in the US...`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Load saved session cookies
        let cookies = loadSessionCookies();
        if (cookies) {
            console.log("🔄 Using saved LinkedIn session...");
            await context.addCookies(cookies);
        } else {
            console.log("❌ No saved session found. Running login script...");
            execSync('node src/services/loginLinkedIn.js', { stdio: 'inherit' });
            return scrapeLinkedIn(jobTitle);
        }

        await page.goto(`https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=United%20States`, { timeout: 90000 });

        console.log(`✅ LinkedIn page loaded for ${jobTitle}`);

        const updatedCookies = await context.cookies();
        saveSessionCookies(updatedCookies);

        await page.waitForTimeout(3000);
        await page.waitForSelector('.job-card-container', { timeout: 60000 });

        const jobs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.job-card-container')).map(job => ({
                title: job.querySelector('.job-card-list__title')?.innerText.trim() || 'N/A',
                company: job.querySelector('.job-card-container__company-name')?.innerText.trim() || 'N/A',
                location: job.querySelector('.job-card-container__metadata-item')?.innerText.trim() || 'N/A',
                link: job.querySelector('.job-card-list__title')?.href || 'N/A',
                source: 'LinkedIn'
            }));
        });

        console.log(`🔗 Found ${jobs.length} jobs. Fetching descriptions in chunks...`);

        const concurrencyLimit = 5;
        const queue = [...jobs];
        const result = [];
        let chunkCounter = 0;

        while (queue.length > 0) {
            chunkCounter++;
            const chunk = queue.splice(0, concurrencyLimit);
            console.log(`⚙️ Processing chunk #${chunkCounter} (${chunk.length} jobs)...`);

            const chunkResults = await Promise.all(chunk.map(async (job, index) => {
                let description = 'N/A';

                for (let attempt = 1; attempt <= 2; attempt++) {
                    const jobPage = await context.newPage();
                    try {
                        console.log(`🔍 [Chunk #${chunkCounter} - Job ${index + 1}] Attempt ${attempt}: ${job.title}`);
                        await jobPage.goto(job.link, { timeout: 60000 });
                        await jobPage.waitForTimeout(2000);
                        await jobPage.waitForSelector('.description__text', { timeout: 10000 });
                        description = await jobPage.$eval('.description__text', el => el.innerText.trim());
                        await jobPage.close();
                        break; // exit retry loop if successful
                    } catch (err) {
                        console.warn(`⚠️ [Retry ${attempt}] Failed to fetch description for: ${job.link}\n${err.message}`);
                        await jobPage.close();
                        if (attempt === 2) {
                            console.error(`❌ Failed to scrape job after 2 attempts: ${job.title} | ${job.link}`);
                        }
                    }
                }

                return { ...job, description };
            }));

            result.push(...chunkResults);
        }

        console.log(`✅ Completed scraping. Total jobs with descriptions: ${result.length}`);
        await browser.close();
        return result;
    } catch (error) {
        console.error('❌ LinkedIn Scraper Error:', error);
        await browser.close();
        return [];
    }
}

module.exports = scrapeLinkedIn;
