const { chromium } = require('playwright');

(async () => {
    console.log('Launching Playwright test...');
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Dice...');
        await page.goto('https://www.dice.com/jobs?q=Software+Engineer&location=Remote', { timeout: 60000 });

        console.log('Waiting for the page to load...');
        await page.waitForTimeout(5000);

        console.log('Page loaded successfully!');
    } catch (error) {
        console.error('Error loading page:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
