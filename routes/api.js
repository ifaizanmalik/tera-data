const express = require('express');
const { extractTeraboxInfo } = require('../utils/terabox-extractor');

const router = express.Router();

// Simple test endpoint for browser verification
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API routes are working correctly',
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /?url=<terabox_url> - Extract file info',
            'POST /batch - Batch processing',
            'GET /docs - API documentation',
            'GET /health - Health check',
            'GET /test - This test endpoint'
        ]
    });
});

/**
 * Main API endpoint to extract Terabox file information
 * GET /?url=https://1024terabox.com/s/1Pc4wBeMRpG-ePB1DI_kkPw
 */
router.get('/', async (req, res) => {
    try {
        const { url } = req.query;

        // Validate input
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter',
                message: 'Please provide a "url" query parameter with the Terabox link'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (urlError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format',
                message: 'The provided URL is not valid'
            });
        }

        console.log(`Processing request for URL: ${url}`);
        
        // Extract file information
        const result = await extractTeraboxInfo(url);
        
        // Return successful response
        res.json({
            success: true,
            url: url,
            extractedAt: new Date().toISOString(),
            ...result
        });

    } catch (error) {
        console.error('API Error:', error);
        
        // Determine appropriate status code based on error type
        let statusCode = 500;
        let errorType = 'Internal server error';

        if (error.message.includes('Invalid URL') || error.message.includes('must be a valid Terabox')) {
            statusCode = 400;
            errorType = 'Invalid request';
        } else if (error.message.includes('timeout') || error.message.includes('navigation')) {
            statusCode = 408;
            errorType = 'Request timeout';
        } else if (error.message.includes('Could not find') || error.message.includes('failed to load')) {
            statusCode = 404;
            errorType = 'Content not found';
        }

        res.status(statusCode).json({
            success: false,
            error: errorType,
            message: error.message,
            url: req.query.url || 'N/A'
        });
    }
});

/**
 * Batch processing endpoint (optional enhancement)
 * POST /batch with JSON body containing array of URLs
 */
router.post('/batch', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                message: 'Please provide an array of URLs in the request body'
            });
        }

        if (urls.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'Too many URLs',
                message: 'Maximum 5 URLs allowed per batch request'
            });
        }

        console.log(`Processing batch request for ${urls.length} URLs`);

        const results = [];
        
        // Process URLs sequentially to avoid overwhelming the system
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                // Validate URL
                new URL(url);
                
                const result = await extractTeraboxInfo(url);
                results.push({
                    url: url,
                    success: true,
                    ...result
                });
            } catch (error) {
                console.error(`Error processing URL ${url}:`, error);
                results.push({
                    url: url,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            processedAt: new Date().toISOString(),
            totalRequests: urls.length,
            results: results
        });

    } catch (error) {
        console.error('Batch API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * API documentation endpoint
 */
router.get('/docs', (req, res) => {
    res.json({
        title: 'Terabox File Info Extractor API',
        version: '1.0.0',
        description: 'Extract file size and duration from Terabox links using mobile browser simulation',
        endpoints: {
            'GET /': {
                description: 'Extract file information from a single Terabox URL',
                parameters: {
                    url: 'Required query parameter containing the Terabox link'
                },
                example: '/?url=https://1024terabox.com/s/1Pc4wBeMRpG-ePB1DI_kkPw'
            },
            'POST /batch': {
                description: 'Extract file information from multiple Terabox URLs (max 5)',
                body: {
                    urls: 'Array of Terabox URLs'
                },
                example: '{"urls": ["https://1024terabox.com/s/url1", "https://1024terabox.com/s/url2"]}'
            },
            'GET /health': {
                description: 'Health check endpoint'
            },
            'GET /docs': {
                description: 'API documentation'
            }
        },
        responseFormat: {
            success: 'Boolean indicating if the request was successful',
            data: {
                duration: 'Video duration in HH:MM:SS or MM:SS format',
                fileSize: 'File size with unit (MB, GB, etc.)',
                rawText: 'Original extracted text for reference'
            },
            error: 'Error message if request failed'
        }
    });
});

module.exports = router;
