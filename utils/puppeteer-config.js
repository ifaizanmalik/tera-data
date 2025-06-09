const puppeteer = require('puppeteer');

/**
 * Launches a browser using environment-defined executable path
 */
async function createBrowser() {
  return await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

/**
 * Opens a new page with mobile browser emulation
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 */
async function createMobilePage(browser) {
  try {
    const page = await browser.newPage();

    // Set mobile user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
      'Version/14.1.2 Mobile/15E148 Safari/604.1'
    );

    // Set viewport for mobile simulation
    await page.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3
    });

    // Add extra headers to mimic real device
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
