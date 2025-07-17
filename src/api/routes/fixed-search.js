// Fixed search implementation that works
export default async function fixedSearchRoutes(fastify, options) {
  
  fastify.get('/', async (request, reply) => {
    try {
      const { 
        q = '', 
        limit = 20, 
        offset = 0,
        category,
        youth_specific
      } = request.query;
      
      fastify.log.info('Fixed search request:', { query: request.query });
      
      // Build query
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
          'email',
          'created_at',
          'updated_at'
        )
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Add search filter
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.where(function() {
          this.where('name', 'ilike', `%${searchTerm}%`)
              .orWhere('description', 'ilike', `%${searchTerm}%`);
        });
      }

      // Add category filter
      if (category) {
        query = query.whereRaw("categories::text ILIKE ?", [`%"${category}"%`]);
      }

      // Add youth_specific filter
      if (youth_specific === 'true') {
        query = query.where('youth_specific', true);
      }

      const services = await query;
      
      // Count query with same filters
      let countQuery = request.db('services').where('status', 'active');
      
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

      const totalResult = await countQuery.count('id as count').first();
      const total = parseInt(totalResult.count);

      // Format services safely
      const formattedServices = services.map(service => {
        // Safely handle description
        let description = service.description;
        if (description && typeof description === 'string' && description.length > 300) {
          description = description.substring(0, 300) + '...';
        }

        // Safely handle categories
        let categories = service.categories;
        if (!Array.isArray(categories)) {
          categories = [];
        }

        return {
          id: service.id,
          name: service.name || '',
          description: description || '',
          status: service.status || 'active',
          categories: categories,
          youth_specific: Boolean(service.youth_specific),
          indigenous_specific: Boolean(service.indigenous_specific),
          age_range: {
            minimum: service.minimum_age,
            maximum: service.maximum_age
          },
          contact: {
            url: service.url,
            email: service.email
          },
          updated_at: service.updated_at
        };
      });

      const response = {
        services: formattedServices,
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

      fastify.log.info('Fixed search successful:', { 
        servicesCount: formattedServices.length, 
        total: total 
      });

      return response;

    } catch (error) {
      fastify.log.error('Fixed search failed:', {
        error: error.message,
        stack: error.stack,
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