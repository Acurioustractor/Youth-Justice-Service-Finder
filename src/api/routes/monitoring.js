import ScraperMonitor from '../../monitoring/scraper-monitor.js';

export default async function monitoringRoutes(fastify, options) {
  const monitor = new ScraperMonitor();

  // Real-time scraper dashboard
  fastify.get('/dashboard', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get real-time scraper monitoring dashboard'
    }
  }, async (request, reply) => {
    try {
      const report = await monitor.generateMonitoringReport();
      
      return {
        status: 'active',
        ...report,
        dashboardUrl: '/monitoring/dashboard',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to generate monitoring dashboard');
    }
  });

  // Data quality analysis
  fastify.get('/quality', {
    schema: {
      tags: ['Monitoring'],
      description: 'Analyze data quality metrics'
    }
  }, async (request, reply) => {
    try {
      const quality = await monitor.analyzeDataQuality();
      return quality;
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to analyze data quality');
    }
  });

  // Scraper performance metrics
  fastify.get('/performance', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get scraper performance statistics'
    }
  }, async (request, reply) => {
    try {
      const performance = await monitor.getScraperPerformanceStats();
      return {
        scrapers: performance,
        summary: {
          totalScrapers: Object.keys(performance).length,
          avgSuccessRate: Object.values(performance).reduce((sum, s) => sum + s.avgSuccessRate, 0) / Object.keys(performance).length,
          totalRuns: Object.values(performance).reduce((sum, s) => sum + s.totalRuns, 0)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get performance metrics');
    }
  });

  // Optimization suggestions
  fastify.get('/optimize', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get optimization suggestions for scrapers'
    }
  }, async (request, reply) => {
    try {
      const suggestions = await monitor.generateOptimizationSuggestions();
      
      return {
        suggestions,
        totalSuggestions: suggestions.length,
        priorityBreakdown: {
          critical: suggestions.filter(s => s.priority === 'critical').length,
          high: suggestions.filter(s => s.priority === 'high').length,
          medium: suggestions.filter(s => s.priority === 'medium').length,
          low: suggestions.filter(s => s.priority === 'low').length
        }
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to generate optimization suggestions');
    }
  });

  // Historical trends
  fastify.get('/trends', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get historical data collection trends',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 7, minimum: 1, maximum: 90 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { days = 7 } = request.query;
      
      // Daily service collection trends
      const trends = await request.db.raw(`
        SELECT 
          DATE(created_at) as date,
          source_name,
          SUM(services_found) as services_found,
          SUM(errors_count) as errors,
          COUNT(*) as runs,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
        FROM scraping_jobs 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        AND status = 'completed'
        GROUP BY DATE(created_at), source_name
        ORDER BY date DESC, source_name
      `);

      // Summary by scraper
      const scraperSummary = await request.db.raw(`
        SELECT 
          source_name,
          SUM(services_found) as total_services,
          SUM(errors_count) as total_errors,
          COUNT(*) as total_runs,
          AVG(services_found) as avg_services_per_run,
          MAX(created_at) as last_run
        FROM scraping_jobs 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY source_name
        ORDER BY total_services DESC
      `);

      return {
        period: `${days} days`,
        dailyTrends: trends.rows,
        scraperSummary: scraperSummary.rows,
        totalServicesCollected: scraperSummary.rows.reduce((sum, row) => sum + parseInt(row.total_services), 0)
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get historical trends');
    }
  });

  // Manual scraper trigger with monitoring
  fastify.post('/trigger/:scraper', {
    schema: {
      tags: ['Monitoring'],
      description: 'Manually trigger a specific scraper with monitoring',
      params: {
        type: 'object',
        properties: {
          scraper: { type: 'string' }
        },
        required: ['scraper']
      }
    }
  }, async (request, reply) => {
    try {
      const { scraper } = request.params;
      
      fastify.log.info(`🚀 Manual trigger: ${scraper}`);
      
      // This would integrate with your scraper execution system
      // For now, return a tracking ID
      const trackingId = `manual-${Date.now()}`;
      
      return {
        message: `Scraper ${scraper} triggered successfully`,
        trackingId,
        status: 'queued',
        estimatedDuration: '2-5 minutes',
        monitorUrl: `/monitoring/job/${trackingId}`
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to trigger scraper');
    }
  });

  // Live scraper logs
  fastify.get('/logs/:scraper', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get recent logs for a specific scraper',
      params: {
        type: 'object',
        properties: {
          scraper: { type: 'string' }
        },
        required: ['scraper']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50, maximum: 500 },
          level: { type: 'string', enum: ['error', 'warn', 'info', 'debug'], default: 'info' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { scraper } = request.params;
      const { limit = 50 } = request.query;
      
      const logs = await request.db('scraping_jobs')
        .where('source_name', scraper)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select('*');

      return {
        scraper,
        logs,
        totalLogs: logs.length,
        latestRun: logs[0]?.created_at || null
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get scraper logs');
    }
  });

  // Health check for monitoring system
  fastify.get('/health', {
    schema: {
      tags: ['Monitoring'],
      description: 'Health check for monitoring system'
    }
  }, async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      monitoring: {
        activeScrapers: 0,
        dataQualityScore: 0,
        lastSuccessfulScrape: null
      }
    };

    try {
      // Check recent scraper activity
      const [recentActivity] = await request.db('scraping_jobs')
        .where('created_at', '>', request.db.raw("NOW() - INTERVAL '1 hour'"))
        .count('* as count');

      const [lastSuccess] = await request.db('scraping_jobs')
        .where('status', 'completed')
        .where('services_found', '>', 0)
        .orderBy('completed_at', 'desc')
        .limit(1)
        .select('completed_at', 'source_name');

      health.monitoring = {
        recentActivity: parseInt(recentActivity.count),
        lastSuccessfulScrape: lastSuccess ? {
          time: lastSuccess.completed_at,
          scraper: lastSuccess.source_name
        } : null
      };

      // Quick quality check
      const quality = await monitor.analyzeDataQuality();
      health.monitoring.dataQualityScore = quality.overallScore;

      if (health.monitoring.recentActivity === 0) {
        health.status = 'warning';
        health.message = 'No recent scraper activity detected';
      }

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  });
}