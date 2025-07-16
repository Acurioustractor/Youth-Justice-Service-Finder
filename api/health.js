/**
 * Vercel Serverless Function - Health Check Endpoint
 * 
 * Basic health check for the Youth Justice Service Finder
 */

export default async function handler(req, res) {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Youth Justice Service Finder',
            version: '2.0.0',
            environment: process.env.VERCEL_ENV || 'development',
            region: process.env.VERCEL_REGION || 'unknown',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            endpoints: {
                health: '/api/health',
                database: '/api/health/database',
                analytics: '/api/health/analytics',
                insights: '/api/services/insights',
                dashboard: '/dashboard'
            }
        };

        // Check if we're in production
        if (process.env.VERCEL_ENV === 'production') {
            healthData.deployment = {
                url: process.env.VERCEL_URL,
                git: {
                    sha: process.env.VERCEL_GIT_COMMIT_SHA,
                    ref: process.env.VERCEL_GIT_COMMIT_REF,
                    repo: process.env.VERCEL_GIT_REPO_SLUG
                }
            };
        }

        res.status(200).json(healthData);
        
    } catch (error) {
        console.error('Health check error:', error);
        
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            service: 'Youth Justice Service Finder'
        });
    }
}