const axios = require('axios');
const { chromium } = require('playwright');
const { RAPIDAPI_KEY } = require('../../config/envConfig');

async function scrapeIndeed(jobTitle, location = 'Remote') {
    console.log(`🔍 Fetching Indeed job listings for: ${jobTitle} in ${location}...`);

    const options = {
        method: 'GET',
        url: 'https://indeed12.p.rapidapi.com/jobs/search',
        params: {
            query: jobTitle,
            location: location,
            page_id: '1',
            locality: 'us',
            fromage: '7',
            radius: '50',
            sort: 'date',
            job_type: 'permanent'
        },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const jobs = response.data.jobs || [];

        console.log(`✅ Fetched ${jobs.length} jobs from Indeed API.`);
        if (!jobs.length) return [];

        const browser = await chromium.launch({ headless: false, slowMo: 100 });
        const context = await browser.newContext();

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
                        await jobPage.goto(job.url, { timeout: 60000 });
                        await jobPage.waitForTimeout(2000);
                        await jobPage.waitForSelector('#jobDescriptionText', { timeout: 10000 });
                        description = await jobPage.$eval('#jobDescriptionText', el => el.innerText.trim());
                        await jobPage.close();
                        break;
                    } catch (err) {
                        console.warn(`⚠️ [Retry ${attempt}] Failed to fetch description for: ${job.url}\n${err.message}`);
                        await jobPage.close();
                        if (attempt === 2) {
                            console.error(`❌ Failed after 2 attempts: ${job.title} | ${job.url}`);
                        }
                    }
                }

                return {
                    title: job.title || 'N/A',
                    company: job.company || 'N/A',
                    location: job.location || 'N/A',
                    link: job.url || 'N/A',
                    description,
                    source: 'Indeed'
                };
            }));

            result.push(...chunkResults);
        }

        await browser.close();
        console.log(`✅ Completed scraping descriptions for Indeed jobs: ${result.length} total.`);
        return result;
    } catch (error) {
        console.error('❌ Error fetching Indeed jobs:', error.response ? error.response.data : error.message);
        return [];
    }
}

module.exports = scrapeIndeed;
