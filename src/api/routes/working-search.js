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
      
      let query = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 's.id', 'l.service_id')
        .leftJoin('contacts as c', 's.id', 'c.service_id')
        .select(
          's.id',
          's.name',
          's.description',
          's.categories',
          's.keywords',
          's.minimum_age',
          's.maximum_age',
          's.youth_specific',
          's.indigenous_specific',
          's.status',
          's.created_at',
          's.updated_at',
          'o.name as organization_name',
          'o.organization_type',
          'l.address_1',
          'l.city',
          'l.state_province',
          'l.postal_code',
          'l.region',
          'l.latitude',
          'l.longitude',
          'c.phone',
          'c.email'
        )
        .where('s.status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Add search if query provided
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.where(function() {
          this.where('s.name', 'ilike', `%${searchTerm}%`)
              .orWhere('s.description', 'ilike', `%${searchTerm}%`)
              .orWhere('o.name', 'ilike', `%${searchTerm}%`);
        });
      }

      // Add category filter - handle both array and JSON string formats
      if (category) {
        query = query.where(function() {
          // Try array format first
          this.whereRaw('? = ANY(s.categories)', [category])
              // Fallback to JSON contains for string format
              .orWhereRaw("s.categories::text ILIKE ?", [`%"${category}"%`]);
        });
      }

      // Add region filter  
      if (region) {
        query = query.where('l.region', region);
      }

      // Add youth_specific filter
      if (youth_specific === 'true') {
        query = query.where('s.youth_specific', true);
      }

      // Add indigenous_specific filter
      if (indigenous_specific === 'true') {
        query = query.where('s.indigenous_specific', true);
      }

      // Add age range filters
      if (minimum_age) {
        query = query.where(function() {
          this.whereNull('s.minimum_age')
              .orWhere('s.minimum_age', '<=', parseInt(minimum_age));
        });
      }

      if (maximum_age) {
        query = query.where(function() {
          this.whereNull('s.maximum_age')
              .orWhere('s.maximum_age', '>=', parseInt(maximum_age));
        });
      }

      const services = await query;
      
      // Get filtered total count (same filters without limit/offset)
      let countQuery = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 's.id', 'l.service_id')
        .where('s.status', 'active');

      // Apply same filters for count
      if (q && q.trim()) {
        const searchTerm = q.trim();
        countQuery = countQuery.where(function() {
          this.where('s.name', 'ilike', `%${searchTerm}%`)
              .orWhere('s.description', 'ilike', `%${searchTerm}%`)
              .orWhere('o.name', 'ilike', `%${searchTerm}%`);
        });
      }

      if (category) {
        countQuery = countQuery.where(function() {
          this.whereRaw('? = ANY(s.categories)', [category])
              .orWhereRaw("s.categories::text ILIKE ?", [`%"${category}"%`]);
        });
      }

      if (region) {
        countQuery = countQuery.where('l.region', region);
      }

      if (youth_specific === 'true') {
        countQuery = countQuery.where('s.youth_specific', true);
      }

      if (indigenous_specific === 'true') {
        countQuery = countQuery.where('s.indigenous_specific', true);
      }

      if (minimum_age) {
        countQuery = countQuery.where(function() {
          this.whereNull('s.minimum_age')
              .orWhere('s.minimum_age', '<=', parseInt(minimum_age));
        });
      }

      if (maximum_age) {
        countQuery = countQuery.where(function() {
          this.whereNull('s.maximum_age')
              .orWhere('s.maximum_age', '>=', parseInt(maximum_age));
        });
      }

      const total = await countQuery.count('s.id as count').first();

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