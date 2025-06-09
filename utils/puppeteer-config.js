const puppeteer = require('puppeteer');

/**
 * Create Puppeteer browser instance with Render-compatible configuration
 */
async function createBrowser() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const browserOptions = {
        headless: 'new',
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
            '--single-process',
            '--no-zygote',
            '--disable-extensions'
        ]
    };

    try {
        const browser = await puppeteer.launch(browserOptions);
        console.log('Browser launched successfully');
        return browser;
    } catch (error) {
        console.error('Failed to launch browser:', error);
        throw new Error(`Browser launch failed: ${error.message}`);
    }
}

/**
 * Create a new page with mobile user agent
 */
async function createMobilePage(browser) {
    try {
        const page = await browser.newPage();
        
        // Set mobile user agent to simulate mobile browser
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
        
        // Set mobile viewport
        await page.setViewport({
            width: 375,
            height: 812,
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 3
        });

        // Set additional mobile headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        });

        return page;
    } catch (error) {
        console.error('Failed to create mobile page:', error);
        throw new Error(`Page creation failed: ${error.message}`);
    }
}

module.exports = {
    createBrowser,
    createMobilePage
};
