// Debug database endpoint for production troubleshooting
export default async function debugDbRoutes(fastify, options) {
  
  // Simple database test
  fastify.get('/test', async (request, reply) => {
    try {
      // Test basic connection
      const result = await request.db.raw('SELECT 1 as test');
      
      // Test services table existence
      const tables = await request.db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'services'
      `);
      
      let serviceCount = 0;
      let sampleService = null;
      
      if (tables.rows.length > 0) {
        // Test services count
        const count = await request.db('services').count('* as total');
        serviceCount = count[0].total;
        
        // Get sample service
        const sample = await request.db('services').select('id', 'name', 'status').limit(1);
        sampleService = sample[0] || null;
      }
      
      return {
        database_connection: 'working',
        services_table_exists: tables.rows.length > 0,
        service_count: serviceCount,
        sample_service: sampleService,
        environment: process.env.NODE_ENV,
        database_url_configured: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      fastify.log.error('Database debug test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Database test failed',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  });
  
  // Test simplified working-search logic
  fastify.get('/test-search', async (request, reply) => {
    try {
      const { limit = 20, offset = 0 } = request.query;
      
      fastify.log.info('Testing simplified search logic...', { query: request.query });
      
      // Test the exact services query
      const services = await request.db('services')
        .select('*')
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));
      
      // Test count query
      const total = await request.db('services')
        .where('status', 'active')
        .count('id as count')
        .first();
      
      // Build response exactly like working-search does
      const response = {
        services: services,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / parseInt(limit)),
          current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          has_next: parseInt(offset) + parseInt(limit) < parseInt(total.count),
          has_prev: parseInt(offset) > 0
        },
        total: parseInt(total.count)
      };
      
      fastify.log.info('Search test successful', { 
        servicesCount: services.length, 
        total: total.count 
      });
      
      return response;
      
    } catch (error) {
      fastify.log.error('Search test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Search test failed',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  });

  // Test services query specifically
  fastify.get('/services-query', async (request, reply) => {
    try {
      fastify.log.info('Testing services query...');
      
      // Test the exact query that working-search uses
      const services = await request.db('services')
        .select('*')
        .where('status', 'active')
        .limit(2);
      
      const count = await request.db('services')
        .where('status', 'active')
        .count('id as count')
        .first();
      
      return {
        query_successful: true,
        services_returned: services.length,
        total_active: parseInt(count.count),
        sample_keys: services.length > 0 ? Object.keys(services[0]) : [],
        environment: process.env.NODE_ENV
      };
      
    } catch (error) {
      fastify.log.error('Services query test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Services query test failed',
          details: error.message,
          query_attempted: 'SELECT * FROM services WHERE status = \'active\' LIMIT 2'
        }
      });
    }
  });
}