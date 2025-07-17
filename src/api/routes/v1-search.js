// Production-grade search API v1
import { ServiceDTO, SearchResponseDTO } from '../dto/ServiceDTO.js';

export default async function v1SearchRoutes(fastify, options) {
  
  // Main search endpoint
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          category: { type: 'string' },
          youth_specific: { type: 'string', enum: ['true', 'false'] },
          indigenous_specific: { type: 'string', enum: ['true', 'false'] },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    const requestId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      fastify.log.info({
        requestId,
        query: request.query,
        userAgent: request.headers['user-agent']
      }, 'Search request received');

      const { 
        q = '', 
        category,
        youth_specific,
        indigenous_specific,
        limit = 20, 
        offset = 0 
      } = request.query;

      // Build database query
      let query = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .select(
          's.id', 's.name', 's.description', 's.status',
          's.categories', 's.youth_specific', 's.indigenous_specific',
          's.minimum_age', 's.maximum_age', 's.url', 's.email',
          's.data_source', 's.source_url', 's.created_at', 's.updated_at',
          'o.name as organization_name', 'o.organization_type', 'o.url as organization_url',
          'l.address_1', 'l.city', 'l.state_province', 'l.postal_code', 'l.region',
          'l.latitude', 'l.longitude',
          'c.phone'
        )
        .where('s.status', 'active')
        .limit(Math.min(parseInt(limit), 100))
        .offset(Math.max(parseInt(offset), 0));

      // Apply filters
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.where(function() {
          this.where('s.name', 'ilike', `%${searchTerm}%`)
              .orWhere('s.description', 'ilike', `%${searchTerm}%`)
              .orWhere('o.name', 'ilike', `%${searchTerm}%`);
        });
      }

      if (category) {
        query = query.whereRaw("s.categories::text ILIKE ?", [`%"${category}"%`]);
      }

      if (youth_specific === 'true') {
        query = query.where('s.youth_specific', true);
      }

      if (indigenous_specific === 'true') {
        query = query.where('s.indigenous_specific', true);
      }

      // Execute query
      const services = await query;

      // Get total count with same filters
      let countQuery = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .where('s.status', 'active');

      if (q && q.trim()) {
        const searchTerm = q.trim();
        countQuery = countQuery.where(function() {
          this.where('s.name', 'ilike', `%${searchTerm}%`)
              .orWhere('s.description', 'ilike', `%${searchTerm}%`)
              .orWhere('o.name', 'ilike', `%${searchTerm}%`);
        });
      }

      if (category) {
        countQuery = countQuery.whereRaw("s.categories::text ILIKE ?", [`%"${category}"%`]);
      }

      if (youth_specific === 'true') {
        countQuery = countQuery.where('s.youth_specific', true);
      }

      if (indigenous_specific === 'true') {
        countQuery = countQuery.where('s.indigenous_specific', true);
      }

      const totalResult = await countQuery.count('s.id as count').first();
      const total = parseInt(totalResult.count);

      // Build pagination
      const pagination = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
        current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        has_next: parseInt(offset) + parseInt(limit) < total,
        has_prev: parseInt(offset) > 0
      };

      // Create safe response using DTO
      const response = new SearchResponseDTO(services, pagination, request.query);

      fastify.log.info({
        requestId,
        resultCount: services.length,
        totalResults: total,
        duration: Date.now() - parseInt(requestId.split('-')[1])
      }, 'Search completed successfully');

      return response;

    } catch (error) {
      fastify.log.error({
        requestId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }, 'Search failed');

      return reply.status(500).send({
        error: {
          message: 'Search failed',
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Health check for search API
  fastify.get('/health', async (request, reply) => {
    try {
      // Test database connection
      await request.db.raw('SELECT 1');
      
      // Test simple query
      const count = await request.db('services').where('status', 'active').count('id as count').first();
      
      return {
        status: 'healthy',
        version: '1.0',
        database: 'connected',
        services_count: parseInt(count.count),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return reply.status(500).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}