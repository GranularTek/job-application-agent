const { chromium } = require('playwright');
const ErrorLog = require('../../models/ErrorLog');

async function scrapeDice(jobTitle) {
    console.log(`🔍 Starting Dice Scraper for ${jobTitle}...`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const url = `https://www.dice.com/jobs?q=${encodeURIComponent(jobTitle)}&location=Remote`;
        await page.goto(url, { timeout: 60000 });
        console.log(`✅ Dice page loaded for ${jobTitle}`);

        await page.waitForSelector('.search-card');
        await page.waitForTimeout(2000);

        const jobs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.search-card')).map(job => ({
                title: job.querySelector('.card-title a')?.innerText.trim() || 'N/A',
                company: job.querySelector('.search-result-company-name')?.innerText.trim() || 'N/A',
                location: job.querySelector('.search-result-location')?.innerText.trim() || 'N/A',
                link: job.querySelector('.card-title a')?.href || 'N/A',
                source: 'Dice'
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
                        await jobPage.waitForSelector('.job-description', { timeout: 10000 });
                        description = await jobPage.$eval('.job-description', el => el.innerText.trim());
                        await jobPage.close();
                        break;
                    } catch (err) {
                        console.warn(`⚠️ [Retry ${attempt}] Failed to fetch Dice description for: ${job.link}\n${err.message}`);
                        await jobPage.close();
                        if (attempt === 2) {
                            await ErrorLog.create({
                                source: 'Dice',
                                message: err.message,
                                details: err.stack,
                                context: 'Dice scraper loop'
                            });
                            console.error(`❌ Failed to scrape job after 2 attempts: ${job.title} | ${job.link}`);
                        }
                    }
                }

                return { ...job, description };
            }));

            result.push(...chunkResults);
        }

        console.log(`✅ Scraped ${result.length} Dice jobs with descriptions.`);
        await browser.close();
        return result;
    } catch (error) {
        console.error('❌ Error scraping Dice:', error);
        await ErrorLog.create({
            source: 'Dice',
            message: error.message,
            details: error.stack,
            context: 'Dice scraper loop'
          });
        await browser.close();
        return [];
    }
}

module.exports = scrapeDice;
