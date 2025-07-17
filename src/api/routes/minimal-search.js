// Minimal search implementation to replace broken working-search
export default async function minimalSearchRoutes(fastify, options) {
  
  // Minimal search endpoint
  fastify.get('/', async (request, reply) => {
    const { 
      q = '', 
      limit = 20, 
      offset = 0 
    } = request.query;
    
    try {
      // Simple query without complex filtering
      let query = request.db('services')
        .select(
          'id',
          'name', 
          'description',
          'status',
          'categories',
          'youth_specific',
          'indigenous_specific',
          'minimum_age',
          'maximum_age',
          'url',
          'email'
        )
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Add basic search if provided
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.where(function() {
          this.where('name', 'ilike', `%${searchTerm}%`)
              .orWhere('description', 'ilike', `%${searchTerm}%`);
        });
      }

      const services = await query;
      
      // Get count with same filters
      let countQuery = request.db('services')
        .where('status', 'active');

      if (q && q.trim()) {
        const searchTerm = q.trim();
        countQuery = countQuery.where(function() {
          this.where('name', 'ilike', `%${searchTerm}%`)
              .orWhere('description', 'ilike', `%${searchTerm}%`);
        });
      }

      const totalResult = await countQuery.count('id as count').first();
      const total = parseInt(totalResult.count);

      // Clean up services data
      const cleanServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description?.length > 300 ? 
          service.description.substring(0, 300) + '...' : 
          service.description,
        status: service.status,
        categories: Array.isArray(service.categories) ? service.categories : [],
        youth_specific: Boolean(service.youth_specific),
        indigenous_specific: Boolean(service.indigenous_specific),
        age_range: {
          minimum: service.minimum_age,
          maximum: service.maximum_age
        },
        contact: {
          url: service.url,
          email: service.email
        }
      }));

      return {
        services: cleanServices,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
          current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          has_next: parseInt(offset) + parseInt(limit) < total,
          has_prev: parseInt(offset) > 0
        },
        total: total
      };

    } catch (error) {
      fastify.log.error('Minimal search failed:', {
        error: error.message,
        query: request.query
      });
      
      return reply.status(500).send({
        error: {
          message: 'Search failed',
          details: error.message
        }
      });
    }
  });
}