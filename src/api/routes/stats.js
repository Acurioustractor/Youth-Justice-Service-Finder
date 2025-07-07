export default async function statsRoutes(fastify, options) {
  // Overall statistics
  fastify.get('/', {
    schema: {
      tags: ['Stats'],
      description: 'Get overall database statistics'
    }
  }, async (request, reply) => {
    try {
      // Basic counts with fallbacks
      const services = await request.db('services').count('* as count').first();
      const organizations = await request.db('organizations').count('* as count').first();
      
      // Try to get locations count, fallback if table doesn't exist
      let locations = { count: 0 };
      try {
        locations = await request.db('locations').count('* as count').first();
      } catch (e) {
        fastify.log.warn('Locations table not accessible, using default count');
      }

      // Simple data source breakdown
      const dataSources = await request.db('services')
        .select('data_source')
        .count('* as count')
        .whereNotNull('data_source')
        .groupBy('data_source')
        .orderBy('count', 'desc');

      return {
        totals: {
          services: parseInt(services?.count || 0),
          organizations: parseInt(organizations?.count || 0),
          locations: parseInt(locations?.count || 0)
        },
        data_sources: dataSources.map(ds => ({
          name: ds.data_source || 'Unknown',
          count: parseInt(ds.count)
        })),
        status: 'Basic stats only - some features require schema updates'
      };

    } catch (error) {
      fastify.log.error('Stats error:', error);
      return {
        totals: {
          services: 0,
          organizations: 0,
          locations: 0
        },
        data_sources: [],
        error: 'Unable to fetch statistics',
        message: 'Database may be initializing'
      };
    }
  });

  // Demographics statistics
  fastify.get('/demographics', {
    schema: {
      tags: ['Stats'],
      description: 'Get demographic-focused statistics'
    }
  }, async (request, reply) => {
    try {
      // Age group coverage
      const ageGroups = await request.db.raw(`
        SELECT 
          COUNT(CASE WHEN minimum_age <= 12 OR minimum_age IS NULL THEN 1 END) as children,
          COUNT(CASE WHEN (minimum_age <= 17 OR minimum_age IS NULL) AND (maximum_age >= 13 OR maximum_age IS NULL) THEN 1 END) as youth,
          COUNT(CASE WHEN (minimum_age <= 25 OR minimum_age IS NULL) AND (maximum_age >= 18 OR maximum_age IS NULL) THEN 1 END) as young_adults
        FROM services
        WHERE status = 'active'
      `);

      // Youth-specific services
      const [youthSpecific] = await request.db('services')
        .where('status', 'active')
        .where('youth_specific', true)
        .count();

      // Indigenous-specific services
      const [indigenousSpecific] = await request.db('services')
        .where('status', 'active')
        .where('indigenous_specific', true)
        .count();

      // Services by age range
      const ageRanges = await request.db('services')
        .where('status', 'active')
        .select(
          request.db.raw('COALESCE(minimum_age, 0) as min_age'),
          request.db.raw('COALESCE(maximum_age, 99) as max_age')
        )
        .count('* as count')
        .groupBy('min_age', 'max_age')
        .orderBy('count', 'desc')
        .limit(10);

      return {
        age_coverage: {
          children_0_12: parseInt(ageGroups.rows[0].children),
          youth_13_17: parseInt(ageGroups.rows[0].youth),
          young_adults_18_25: parseInt(ageGroups.rows[0].young_adults)
        },
        specialization: {
          youth_specific: parseInt(youthSpecific.count),
          indigenous_specific: parseInt(indigenousSpecific.count)
        },
        age_ranges: ageRanges.map(ar => ({
          min_age: ar.min_age,
          max_age: ar.max_age,
          count: parseInt(ar.count)
        }))
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch demographic statistics');
    }
  });

  // Geographic statistics
  fastify.get('/geographic', {
    schema: {
      tags: ['Stats'],
      description: 'Get geographic distribution statistics'
    }
  }, async (request, reply) => {
    try {
      // Services by region with coordinates
      const regionStats = await request.db('locations as l')
        .join('services as s', 'l.service_id', 's.id')
        .where('s.status', 'active')
        .select(
          'l.region',
          request.db.raw('COUNT(*) as service_count'),
          request.db.raw('COUNT(CASE WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL THEN 1 END) as with_coordinates'),
          request.db.raw('AVG(l.latitude) as avg_lat'),
          request.db.raw('AVG(l.longitude) as avg_lng')
        )
        .groupBy('l.region')
        .orderBy('service_count', 'desc');

      // Cities with most services
      const cities = await request.db('locations as l')
        .join('services as s', 'l.service_id', 's.id')
        .where('s.status', 'active')
        .select('l.city', 'l.region')
        .count('* as count')
        .groupBy('l.city', 'l.region')
        .orderBy('count', 'desc')
        .limit(15);

      // Coverage gaps (regions with few services)
      const allRegions = [
        'brisbane', 'gold_coast', 'sunshine_coast', 'townsville', 'cairns',
        'toowoomba', 'mackay', 'rockhampton', 'bundaberg', 'hervey_bay',
        'gladstone', 'mount_isa', 'remote_queensland'
      ];

      const covered = regionStats.map(r => r.region);
      const gaps = allRegions.filter(region => !covered.includes(region));

      return {
        regional_distribution: regionStats.map(r => ({
          region: r.region,
          service_count: parseInt(r.service_count),
          coordinate_coverage: `${Math.round((parseInt(r.with_coordinates) / parseInt(r.service_count)) * 100)}%`,
          center: r.avg_lat && r.avg_lng ? {
            lat: parseFloat(r.avg_lat),
            lng: parseFloat(r.avg_lng)
          } : null
        })),
        top_cities: cities.map(c => ({
          city: c.city,
          region: c.region,
          service_count: parseInt(c.count)
        })),
        coverage_gaps: gaps,
        total_regions_covered: covered.length,
        total_regions_available: allRegions.length
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch geographic statistics');
    }
  });

  // Data quality statistics
  fastify.get('/quality', {
    schema: {
      tags: ['Stats'],
      description: 'Get data quality metrics'
    }
  }, async (request, reply) => {
    try {
      const [totalServices] = await request.db('services').where('status', 'active').count();
      const total = parseInt(totalServices.count);

      // Contact information completeness
      const contactStats = await request.db.raw(`
        SELECT 
          COUNT(CASE WHEN c.phone IS NOT NULL THEN 1 END) as with_phone,
          COUNT(CASE WHEN c.email IS NOT NULL THEN 1 END) as with_email,
          COUNT(CASE WHEN c.phone IS NOT NULL OR c.email IS NOT NULL THEN 1 END) as with_contact
        FROM services s
        LEFT JOIN contacts c ON s.id = c.service_id
        WHERE s.status = 'active'
      `);

      // Location information completeness
      const locationStats = await request.db.raw(`
        SELECT 
          COUNT(CASE WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL THEN 1 END) as with_coordinates,
          COUNT(CASE WHEN l.address_1 IS NOT NULL THEN 1 END) as with_address,
          COUNT(CASE WHEN l.postal_code IS NOT NULL THEN 1 END) as with_postcode
        FROM services s
        LEFT JOIN locations l ON s.id = l.service_id
        WHERE s.status = 'active'
      `);

      // Content completeness
      const contentStats = await request.db.raw(`
        SELECT 
          COUNT(CASE WHEN s.description IS NOT NULL AND LENGTH(s.description) > 100 THEN 1 END) as with_description,
          COUNT(CASE WHEN s.url IS NOT NULL THEN 1 END) as with_website,
          COUNT(CASE WHEN array_length(s.categories, 1) > 0 THEN 1 END) as with_categories,
          COUNT(CASE WHEN array_length(s.keywords, 1) > 0 THEN 1 END) as with_keywords
        FROM services s
        WHERE s.status = 'active'
      `);

      // Recent updates
      const updateStats = await request.db.raw(`
        SELECT 
          COUNT(CASE WHEN s.updated_at > NOW() - INTERVAL '30 days' THEN 1 END) as updated_last_30_days,
          COUNT(CASE WHEN s.updated_at > NOW() - INTERVAL '90 days' THEN 1 END) as updated_last_90_days,
          AVG(EXTRACT(EPOCH FROM (NOW() - s.updated_at)) / 86400) as avg_days_since_update
        FROM services s
        WHERE s.status = 'active'
      `);

      const contact = contactStats.rows[0];
      const location = locationStats.rows[0];
      const content = contentStats.rows[0];
      const updates = updateStats.rows[0];

      return {
        total_services: total,
        contact_completeness: {
          with_phone: `${Math.round((parseInt(contact.with_phone) / total) * 100)}%`,
          with_email: `${Math.round((parseInt(contact.with_email) / total) * 100)}%`,
          with_any_contact: `${Math.round((parseInt(contact.with_contact) / total) * 100)}%`
        },
        location_completeness: {
          with_coordinates: `${Math.round((parseInt(location.with_coordinates) / total) * 100)}%`,
          with_address: `${Math.round((parseInt(location.with_address) / total) * 100)}%`,
          with_postcode: `${Math.round((parseInt(location.with_postcode) / total) * 100)}%`
        },
        content_completeness: {
          with_description: `${Math.round((parseInt(content.with_description) / total) * 100)}%`,
          with_website: `${Math.round((parseInt(content.with_website) / total) * 100)}%`,
          with_categories: `${Math.round((parseInt(content.with_categories) / total) * 100)}%`,
          with_keywords: `${Math.round((parseInt(content.with_keywords) / total) * 100)}%`
        },
        freshness: {
          updated_last_30_days: parseInt(updates.updated_last_30_days),
          updated_last_90_days: parseInt(updates.updated_last_90_days),
          avg_days_since_update: Math.round(parseFloat(updates.avg_days_since_update))
        }
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch quality statistics');
    }
  });
}