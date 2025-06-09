const { createBrowser, createMobilePage } = require('./puppeteer-config');

/**
 * Extract file size and duration from Terabox URL
 */
async function extractTeraboxInfo(url) {
    let browser = null;
    let page = null;

    try {
        // Validate URL
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL provided');
        }

        // Check if it's a Terabox URL
        if (!url.includes('terabox.com') && !url.includes('1024terabox.com')) {
            throw new Error('URL must be a valid Terabox link');
        }

        console.log(`Extracting info from: ${url}`);
        
        browser = await createBrowser();
        page = await createMobilePage(browser);

        // Set shorter timeout for faster response
        page.setDefaultTimeout(15000);
        page.setDefaultNavigationTimeout(15000);

        // Navigate to the URL with minimal wait
        console.log('Navigating to URL...');
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
        });

        // Wait for the page to load and JavaScript to execute
        console.log('Waiting for dynamic content to load...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for the specific div with size information to appear
        // The target selector: div[data-v-5380f836].size or similar variations
        console.log('Page loaded, searching for file information...');
        
        let sizeInfo = null;
        const maxRetries = 5;
        let retryCount = 0;

        while (!sizeInfo && retryCount < maxRetries) {
            try {
                // Try multiple possible selectors for the size div
                const selectors = [
                    'div[data-v-5380f836].size',
                    'div.size',
                    '.size',
                    '[class*="size"]',
                    'div[data-v-5380f836]',
                    '.file-size',
                    '.video-info',
                    '.media-info'
                ];

                console.log(`Attempt ${retryCount + 1}/${maxRetries}: Searching with ${selectors.length} selectors...`);

                for (const selector of selectors) {
                    const elements = await page.$$(selector);
                    console.log(`Selector "${selector}" found ${elements.length} elements`);
                    
                    for (const element of elements) {
                        const text = await page.evaluate(el => el.textContent?.trim(), element);
                        console.log(`Element text: "${text}"`);
                        
                        if (text && (text.includes('MB') || text.includes('GB') || text.includes('KB')) && text.includes(':')) {
                            sizeInfo = text;
                            console.log(`Found size info with selector "${selector}": ${sizeInfo}`);
                            break;
                        }
                    }
                    if (sizeInfo) break;
                }

                if (!sizeInfo) {
                    console.log(`Attempt ${retryCount + 1}/${maxRetries}: Size info not found, waiting 1s...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retryCount++;
                }
            } catch (error) {
                console.log(`Attempt ${retryCount + 1}/${maxRetries}: Error finding size info:`, error.message);
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        if (!sizeInfo) {
            // Try to get any text that might contain file information
            console.log('Attempting alternative extraction methods...');
            
            // Get page content for debugging
            const pageContent = await page.content();
            const hasTeraboxContent = pageContent.includes('terabox') || pageContent.includes('Terabox');
            
            if (!hasTeraboxContent) {
                throw new Error('Page does not appear to be a valid Terabox page or failed to load properly');
            }

            // Look for any text patterns that match duration and size
            const bodyText = await page.evaluate(() => document.body.innerText);
            const durationSizePattern = /(\d{2}:\d{2}:\d{2}|\d{1,2}:\d{2})\s*\|\s*(\d+(?:\.\d+)?\s*(?:KB|MB|GB))/gi;
            const match = bodyText.match(durationSizePattern);
            
            if (match && match[0]) {
                sizeInfo = match[0];
                console.log(`Found size info using regex pattern: ${sizeInfo}`);
            } else {
                throw new Error('Could not find file size and duration information. The content may not have loaded properly or the page structure has changed.');
            }
        }

        // Parse the extracted information
        const parsedInfo = parseFileInfo(sizeInfo);
        
        console.log('Successfully extracted file information:', parsedInfo);
        return parsedInfo;

    } catch (error) {
        console.error('Error extracting Terabox info:', error);
        throw error;
    } finally {
        // Clean up resources
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error('Error closing page:', e);
            }
        }
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error('Error closing browser:', e);
            }
        }
    }
}

/**
 * Parse file information from extracted text
 * Expected format: "00:08:50 | 55.3MB" or similar
 */
function parseFileInfo(sizeInfo) {
    try {
        // Split by pipe (|) or other delimiters
        const parts = sizeInfo.split(/\s*[\|·•]\s*/);
        
        let duration = null;
        let fileSize = null;

        for (const part of parts) {
            const trimmedPart = part.trim();
            
            // Check if this part looks like duration (HH:MM:SS or MM:SS)
            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmedPart)) {
                duration = trimmedPart;
            }
            // Check if this part looks like file size (with KB, MB, GB)
            else if (/\d+(?:\.\d+)?\s*(?:KB|MB|GB)/i.test(trimmedPart)) {
                fileSize = trimmedPart;
            }
        }

        // If we couldn't parse with pipe, try other patterns
        if (!duration || !fileSize) {
            // Look for duration pattern
            const durationMatch = sizeInfo.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
            if (durationMatch) {
                duration = durationMatch[1];
            }

            // Look for file size pattern
            const sizeMatch = sizeInfo.match(/(\d+(?:\.\d+)?\s*(?:KB|MB|GB))/i);
            if (sizeMatch) {
                fileSize = sizeMatch[1];
            }
        }

        return {
            success: true,
            data: {
                duration: duration || 'N/A',
                fileSize: fileSize || 'N/A',
                rawText: sizeInfo
            }
        };
    } catch (error) {
        console.error('Error parsing file info:', error);
        return {
            success: false,
            error: 'Failed to parse file information',
            data: {
                duration: 'N/A',
                fileSize: 'N/A',
                rawText: sizeInfo
            }
        };
    }
}

module.exports = {
    extractTeraboxInfo
};
