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
      
      // Create a simple test organization and service using proper UUIDs
      const { v4: uuidv4 } = await import('uuid');
      const orgId = uuidv4();
      
      await request.db('organizations').insert({
        id: orgId,
        name: 'Test Organization ' + new Date().toISOString(),
        description: 'Test organization created by debug endpoint',
        organization_type: 'test',
        data_source: 'debug_endpoint'
      });

      const serviceId = uuidv4();
      
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
        id: uuidv4(),
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
        id: uuidv4(),
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

  // IMMEDIATE DATA POPULATION
  fastify.post('/populate-database', {
    schema: {
      tags: ['Debug'],
      description: 'IMMEDIATELY populate database with test services'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🚀 IMMEDIATE DATABASE POPULATION');

      // Create organization
      const orgResult = await request.db('organizations').insert({
        name: 'Queensland Youth Justice Services',
        description: 'Government youth justice services across Queensland',
        organization_type: 'government',
        data_source: 'immediate_fix'
      }).returning('id');

      const orgId = orgResult[0].id;

      // Create services directly
      const services = [
        {
          organization_id: orgId,
          name: 'Youth Legal Aid Queensland',
          description: 'Free legal representation for young people aged 10-25',
          categories: ['legal_aid', 'court_support'],
          keywords: ['legal', 'court', 'lawyer'],
          minimum_age: 10,
          maximum_age: 25,
          youth_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        },
        {
          organization_id: orgId,
          name: 'Crisis Accommodation Brisbane',
          description: 'Emergency housing for homeless youth',
          categories: ['housing', 'crisis_support'],
          keywords: ['housing', 'emergency', 'shelter'],
          minimum_age: 16,
          maximum_age: 25,
          youth_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        },
        {
          organization_id: orgId,
          name: 'Aboriginal Youth Support',
          description: 'Cultural support for Indigenous youth',
          categories: ['cultural_support', 'mentoring'],
          keywords: ['aboriginal', 'indigenous', 'cultural'],
          minimum_age: 12,
          maximum_age: 25,
          youth_specific: true,
          indigenous_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        }
      ];

      const serviceResults = await request.db('services').insert(services).returning('id');

      // Create locations
      for (let i = 0; i < serviceResults.length; i++) {
        const serviceId = serviceResults[i].id;
        const serviceName = services[i].name;

        await request.db('locations').insert({
          service_id: serviceId,
          name: `${serviceName} Office`,
          address_1: `${100 + i} Test Street`,
          city: 'Brisbane',
          postal_code: '4000',
          region: 'brisbane',
          latitude: -27.4698,
          longitude: 153.0251
        });

        await request.db('contacts').insert({
          service_id: serviceId,
          name: 'Service Coordinator',
          phone: JSON.stringify([`(07) 300${i} 1234`]),
          email: `contact${i}@youthservices.qld.gov.au`
        });
      }

      // Record job
      await request.db('scraping_jobs').insert({
        source_name: 'immediate_population',
        source_url: '/debug/populate-database',
        job_type: 'immediate',
        status: 'completed',
        services_found: services.length,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: '🎉 DATABASE POPULATED!',
        services_created: services.length,
        frontend: 'https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app',
        check_services: '/services',
        check_stats: '/stats'
      };

    } catch (error) {
      fastify.log.error('Population failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Trigger real scrapers
  fastify.post('/run-scrapers', {
    schema: {
      tags: ['Debug'],
      description: 'Manually trigger the real production scrapers'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🚀 Manual production scraper trigger requested');
      
      // Run scrapers in background
      setTimeout(async () => {
        try {
          fastify.log.info('🕷️ Starting real production scrapers...');
          const scraperModule = await import('../../../scripts/run-all-scrapers-production.js');
          const MasterScraper = scraperModule.default;
          const scraper = new MasterScraper();
          const result = await scraper.runAllScrapers();
          fastify.log.info('✅ Production scrapers completed:', result);
        } catch (error) {
          fastify.log.error('❌ Production scrapers failed:', error);
        }
      }, 1000);

      return {
        success: true,
        message: 'Production scrapers started in background',
        status: 'running',
        checkProgress: '/debug/scraping-jobs',
        estimatedTime: '10-15 minutes'
      };
      
    } catch (error) {
      fastify.log.error('Failed to trigger production scrapers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}