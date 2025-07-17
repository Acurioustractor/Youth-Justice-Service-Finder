// Working search implementation that definitely works
export default async function workingSearchRoutes(fastify, options) {
  
  // Simple working search
  fastify.get('/', async (request, reply) => {
    try {
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

      // Format response to match frontend expectations
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        url: '',
        email: service.email || '',
        status: service.status,
        age_range: {
          minimum: service.minimum_age,
          maximum: service.maximum_age
        },
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific,
        categories: service.categories || [],
        keywords: service.keywords || [],
        data_source: 'working_search',
        organization: {
          name: service.organization_name || 'Unknown Organization',
          type: service.organization_type || 'unknown',
          url: ''
        },
        location: {
          address: service.address_1 || '',
          city: service.city || '',
          state: service.state_province || 'Unknown',
          postcode: service.postal_code || '',
          region: service.region || '',
          coordinates: {
            lat: service.latitude ? parseFloat(service.latitude) : null,
            lng: service.longitude ? parseFloat(service.longitude) : null
          }
        },
        contact: {
          phone: service.phone ? (typeof service.phone === 'string' ? JSON.parse(service.phone) : service.phone) : null,
          email: service.email || null
        },
        created_at: service.created_at,
        updated_at: service.updated_at
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
      fastify.log.error('Working search failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Search failed',
          details: error.message
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