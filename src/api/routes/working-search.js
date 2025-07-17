// Working search implementation that definitely works
export default async function workingSearchRoutes(fastify, options) {
  
  // Simple working search
  fastify.get('/', async (request, reply) => {
    try {
      fastify.log.info('Working search request:', { 
        url: request.url, 
        query: request.query,
        method: request.method 
      });

      const { 
        q = '', 
        limit = 20, 
        offset = 0,
        category,
        region,
        youth_specific,
        indigenous_specific,
        minimum_age,
        maximum_age
      } = request.query;
      
      let query = request.db('services')
        .select('*')
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Add search if query provided
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.where(function() {
          this.where('name', 'ilike', `%${searchTerm}%`)
              .orWhere('description', 'ilike', `%${searchTerm}%`);
        });
      }

      // Add category filter - handle both array and JSON string formats
      if (category) {
        query = query.whereRaw("categories::text ILIKE ?", [`%"${category}"%`]);
      }

      // Add youth_specific filter
      if (youth_specific === 'true') {
        query = query.where('youth_specific', true);
      }

      // Add indigenous_specific filter
      if (indigenous_specific === 'true') {
        query = query.where('indigenous_specific', true);
      }

      const services = await query;
      
      // Get filtered total count (same filters without limit/offset)
      let countQuery = request.db('services')
        .where('status', 'active');

      // Apply same filters for count
      if (q && q.trim()) {
        const searchTerm = q.trim();
        countQuery = countQuery.where(function() {
          this.where('name', 'ilike', `%${searchTerm}%`)
              .orWhere('description', 'ilike', `%${searchTerm}%`);
        });
      }

      if (category) {
        countQuery = countQuery.whereRaw("categories::text ILIKE ?", [`%"${category}"%`]);
      }

      if (youth_specific === 'true') {
        countQuery = countQuery.where('youth_specific', true);
      }

      if (indigenous_specific === 'true') {
        countQuery = countQuery.where('indigenous_specific', true);
      }

      const total = await countQuery.count('id as count').first();

      // Use the same safe formatting as diagnostic search that works
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        status: service.status,
        categories: service.categories || [],
        description: service.description ? service.description.substring(0, 200) + '...' : 'No description',
        youth_specific: Boolean(service.youth_specific),
        indigenous_specific: Boolean(service.indigenous_specific),
        contact: {
          email: service.email,
          url: service.url
        },
        age_range: {
          minimum: service.minimum_age,
          maximum: service.maximum_age
        }
      }));

      return {
        services: formattedServices,
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

    } catch (error) {
      fastify.log.error('Working search failed:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        url: request.url
      });
      
      // Check if it's a database connection error
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return reply.status(503).send({
          error: {
            message: 'Database temporarily unavailable',
            details: 'Please try again in a moment',
            type: 'database_connection_error'
          }
        });
      }
      
      return reply.status(500).send({
        error: {
          message: 'Search failed',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          type: 'search_error'
        }
      });
    }
  });

  // Simple search alias
  fastify.get('/simple', async (request, reply) => {
    // Just redirect to main search
    return reply.redirect(301, '/working-search?' + new URLSearchParams(request.query).toString());
  });
}