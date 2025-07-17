// Emergency search endpoint - ultra simple implementation
export default async function emergencySearchRoutes(fastify, options) {
  
  fastify.get('/', async (request, reply) => {
    try {
      const { limit = 20, offset = 0, q = '' } = request.query;
      
      // Ultra simple query - just get basic fields
      let query = request.db('services')
        .select('id', 'name', 'description', 'status', 'categories', 'youth_specific')
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      if (q && q.trim()) {
        query = query.where('name', 'ilike', `%${q.trim()}%`);
      }

      const services = await query;
      const countResult = await request.db('services').where('status', 'active').count('id as count').first();
      const total = parseInt(countResult.count);

      // Ultra simple formatting
      const simpleServices = services.map(s => ({
        id: s.id,
        name: s.name || 'Unnamed Service',
        description: s.description ? s.description.substring(0, 200) + '...' : 'No description available',
        categories: s.categories || [],
        youth_specific: !!s.youth_specific
      }));

      return {
        services: simpleServices,
        total: total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: total
        }
      };

    } catch (error) {
      fastify.log.error('Emergency search failed:', error);
      return reply.status(500).send({
        error: 'Emergency search failed: ' + error.message
      });
    }
  });
}