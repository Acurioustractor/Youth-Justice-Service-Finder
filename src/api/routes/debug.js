export default async function debugRoutes(fastify, options) {
  
  // Debug database tables
  fastify.get('/tables', {
    schema: {
      tags: ['Debug'],
      description: 'Check what tables exist in database'
    }
  }, async (request, reply) => {
    try {
      const tables = await request.db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const counts = {};
      for (const table of tables.rows) {
        try {
          const [count] = await request.db(table.table_name).count('* as count');
          counts[table.table_name] = parseInt(count.count);
        } catch (error) {
          counts[table.table_name] = `Error: ${error.message}`;
        }
      }
      
      return {
        tables: tables.rows.map(t => t.table_name),
        counts
      };
    } catch (error) {
      fastify.log.error(error);
      return { error: error.message };
    }
  });

  // Debug scraping jobs
  fastify.get('/scraping-jobs', {
    schema: {
      tags: ['Debug'],
      description: 'Check recent scraping job attempts'
    }
  }, async (request, reply) => {
    try {
      const jobs = await request.db('scraping_jobs')
        .orderBy('created_at', 'desc')
        .limit(20)
        .select('*');
      
      return {
        totalJobs: jobs.length,
        jobs: jobs,
        summary: {
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length,
          totalServicesFound: jobs.reduce((sum, j) => sum + (j.services_found || 0), 0)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return { error: error.message, tables_exist: false };
    }
  });

  // Debug database connection
  fastify.get('/connection', {
    schema: {
      tags: ['Debug'],
      description: 'Test database connection'
    }
  }, async (request, reply) => {
    try {
      const result = await request.db.raw('SELECT NOW() as current_time, version() as version');
      return {
        connected: true,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        database_url: process.env.DATABASE_URL ? 'Set' : 'Missing'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  });

  // Trigger scraper manually for testing
  fastify.post('/trigger-scraper', {
    schema: {
      tags: ['Debug'],
      description: 'Manually trigger a test scraper run'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🧪 Manual scraper trigger requested');
      
      // Create a simple test organization and service
      const orgId = 'test-' + Date.now();
      
      await request.db('organizations').insert({
        id: orgId,
        name: 'Test Organization ' + new Date().toISOString(),
        description: 'Test organization created by debug endpoint',
        organization_type: 'test',
        data_source: 'debug_endpoint'
      });

      const serviceId = 'test-service-' + Date.now();
      
      await request.db('services').insert({
        id: serviceId,
        organization_id: orgId,
        name: 'Test Youth Service ' + new Date().toISOString(),
        description: 'Test youth service created by debug endpoint for testing',
        categories: ['test', 'debug'],
        keywords: ['test', 'debug', 'youth'],
        data_source: 'debug_endpoint',
        status: 'active'
      });

      await request.db('locations').insert({
        id: 'test-location-' + Date.now(),
        service_id: serviceId,
        name: 'Test Location',
        address_1: '123 Test Street',
        city: 'Brisbane',
        postal_code: '4000',
        region: 'brisbane',
        latitude: -27.4698,
        longitude: 153.0251
      });

      // Record the debug job
      await request.db('scraping_jobs').insert({
        id: 'debug-' + Date.now(),
        source_name: 'debug_endpoint',
        source_url: '/debug/trigger-scraper',
        job_type: 'test',
        status: 'completed',
        pages_scraped: 1,
        services_found: 1,
        errors_count: 0,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: 'Test service created successfully',
        organizationId: orgId,
        serviceId: serviceId,
        note: 'Check /services endpoint to see the test service'
      };
      
    } catch (error) {
      fastify.log.error('Debug scraper trigger failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Check logs
  fastify.get('/logs', {
    schema: {
      tags: ['Debug'],
      description: 'Get recent application logs'
    }
  }, async (request, reply) => {
    return {
      message: 'Logs are in Railway dashboard',
      railwayLogs: 'https://railway.app/project/your-project/deployments',
      localLogs: 'Check server console output',
      tip: 'Use Railway CLI: railway logs'
    };
  });
}