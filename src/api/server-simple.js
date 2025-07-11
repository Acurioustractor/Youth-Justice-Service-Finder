// Simplified server for free hosting
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import pino from 'pino';
import db from '../config/database.js';

// Import route handlers
import servicesRoutes from './routes/services.js';
import organizationsRoutes from './routes/organizations.js';
import searchRoutes from './routes/search.js';
import simpleSearchRoutes from './routes/simple-search.js';
import healthRoutes from './routes/health.js';
import statsRoutes from './routes/stats.js';
import monitoringRoutes from './routes/monitoring.js';
import debugRoutes from './routes/debug.js';
import createDataRoutes from './routes/create-data.js';
import quickFixRoutes from './routes/quick-fix.js';
import workingSearchRoutes from './routes/working-search.js';
import import603ServicesRoutes from './routes/import-603-services.js';
import bulletproofImportRoutes from './routes/bulletproof-import.js';
import { addSchemas } from './schemas.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

export async function createSimpleServer(options = {}) {
  const fastify = Fastify({
    logger,
    trustProxy: true,
    ...options
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // CORS - more permissive for free hosting
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true)
      : true,
    credentials: true
  });

  // Rate limiting - more lenient for free tier
  await fastify.register(rateLimit, {
    max: parseInt(process.env.API_RATE_LIMIT) || 50, // Lower for free tier
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

  // API Documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Youth Justice Service Finder API (Free Tier)',
        description: 'Simplified API for finding youth justice and support services across Queensland, Australia',
        version: '1.0.0',
        contact: {
          name: 'Youth Justice Service Finder',
          url: 'https://github.com/Acurioustractor/Youth-Justice-Service-Finder'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://youth-justice-api.railway.app',
          description: 'Production server (Railway)'
        },
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Services', description: 'Youth service operations' },
        { name: 'Organizations', description: 'Service provider operations' },
        { name: 'Search', description: 'Search operations (simplified)' },
        { name: 'Health', description: 'API health and monitoring' },
        { name: 'Stats', description: 'Database statistics' }
      ]
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Add JSON schemas
  addSchemas(fastify);

  // Database connection hook
  fastify.addHook('onRequest', async (request, reply) => {
    request.db = db;
  });

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    const { statusCode = 500 } = error;
    
    fastify.log.error({
      error: error.message,
      stack: error.stack,
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers
      }
    });

    const response = {
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        statusCode,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
    }

    return reply.status(statusCode).send(response);
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
        url: request.url,
        method: request.method
      }
    });
  });

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(statsRoutes, { prefix: '/stats' });
  await fastify.register(monitoringRoutes, { prefix: '/monitoring' });
  await fastify.register(debugRoutes, { prefix: '/debug' });
  await fastify.register(createDataRoutes, { prefix: '/create-data' });
  await fastify.register(quickFixRoutes, { prefix: '/quick-fix' });
  await fastify.register(import603ServicesRoutes, { prefix: '/import' });
  await fastify.register(bulletproofImportRoutes, { prefix: '/bulletproof' });
  
  // WORKING SEARCH - bypass broken search routes
  await fastify.register(workingSearchRoutes, { prefix: '/working-search' });
  
  // Register main search routes (handles '/' endpoint) - BROKEN
  // await fastify.register(searchRoutes, { prefix: '/search' });
  
  // Register additional simple search routes ('/simple', '/geo', etc) - BROKEN
  // await fastify.register(simpleSearchRoutes, { prefix: '/search' });
  
  // Keep original search routes but make them optional
  try {
    if (process.env.ELASTICSEARCH_URL) {
      const elasticsearchSearchRoutes = await import('./routes/elasticsearch-search.js').then(m => m.default);
      await fastify.register(elasticsearchSearchRoutes, { prefix: '/search/es' });
    }
  } catch (error) {
    fastify.log.warn('Elasticsearch routes not available, using simple search only');
  }
  
  await fastify.register(servicesRoutes, { prefix: '/services' });
  await fastify.register(organizationsRoutes, { prefix: '/organizations' });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return {
      name: 'Youth Justice Service Finder API (Free Tier)',
      version: '1.0.0',
      description: 'Simplified API for finding youth justice and support services',
      documentation: '/docs',
      health: '/health',
      endpoints: {
        services: '/services',
        organizations: '/organizations',
        search: '/working-search',
        simpleSearch: '/working-search/simple',
        workingSearch: '/working-search',
        stats: '/stats',
        monitoring: '/monitoring',
        debug: '/debug'
      },
      features: [
        'Basic text search',
        'Geographic search',
        'Simple autocomplete',
        'Service filtering',
        'PostgreSQL database'
      ],
      upgrade: {
        message: 'For advanced features like Elasticsearch, fuzzy search, and Temporal workflows, upgrade to paid hosting',
        elasticsearch: process.env.ELASTICSEARCH_URL ? 'Available at /search/es/*' : 'Not configured',
        workflows: 'Available in full deployment'
      }
    };
  });

  return fastify;
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const start = async () => {
    try {
      const server = await createSimpleServer();
      const port = process.env.PORT || 3001;
      const host = process.env.HOST || '0.0.0.0';
      
      await server.listen({ port, host });
      console.log(`🚀 Youth Justice Service Finder API (Free Tier) running on http://${host}:${port}`);
      console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
      console.log(`🔍 Simple search available at http://${host}:${port}/search/simple`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };
  
  start();
}