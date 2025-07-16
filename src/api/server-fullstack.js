import { createSimpleServer } from './server-simple.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startFullStackServer() {
  try {
    const server = await createSimpleServer();
    
    // Serve static files from frontend build
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    
    // Register static file serving BEFORE other routes
    const fastifyStatic = await import('@fastify/static');
    await server.register(fastifyStatic.default, {
      root: frontendPath,
      prefix: '/',
      prefixAvoidTrailingSlash: true,
      decorateReply: false
    });
    
    // SPA routing - serve index.html for non-API routes
    server.setNotFoundHandler(async (request, reply) => {
      // Skip API routes - let them return 404
      if (request.url.startsWith('/api') || 
          request.url.startsWith('/health') || 
          request.url.startsWith('/services') ||
          request.url.startsWith('/working-search') ||
          request.url.startsWith('/search') ||
          request.url.startsWith('/stats') ||
          request.url.startsWith('/organizations') ||
          request.url.startsWith('/monitoring') ||
          request.url.startsWith('/budget-intelligence') ||
          request.url.startsWith('/docs')) {
        return reply.status(404).send({
          error: {
            message: "Route not found",
            statusCode: 404,
            url: request.url,
            method: request.method
          }
        });
      }
      
      // For frontend routes, serve index.html
      return reply.sendFile('index.html');
    });
    
    const port = process.env.PORT || 3010;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    console.log(`🚀 Youth Justice Service Finder (Full-Stack) running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`🌐 Frontend Application: http://${host}:${port}/`);
    console.log(`🔍 Search API: http://${host}:${port}/working-search`);
    console.log(`❤️ Health Check: http://${host}:${port}/health`);
    
  } catch (err) {
    console.error('Error starting full-stack server:', err);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startFullStackServer();
}

export { startFullStackServer };