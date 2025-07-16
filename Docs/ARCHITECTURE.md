# Youth Justice Service Finder - Optimal Architecture

## Technology Stack Evaluation

After careful consideration of the requirements, here's the optimal technology stack:

### Database: PostgreSQL + Elasticsearch
**Why this combination:**
- **PostgreSQL**: 
  - JSONB support for flexible schema while maintaining ACID compliance
  - PostGIS extension for geographic queries (crucial for service coverage)
  - Full-text search capabilities as backup
  - Excellent performance with proper indexing
  - Battle-tested reliability for critical data

- **Elasticsearch**: 
  - Superior full-text search with fuzzy matching
  - Handles typos and variations in service names
  - Fast aggregations for filtering
  - Geo-distance queries for "services near me"
  - Scales horizontally for millions of services

### Backend Framework: Node.js with Fastify
**Why Fastify over Express:**
- 2x faster than Express for high-throughput APIs
- Built-in schema validation
- Excellent plugin ecosystem
- Native async/await support
- Lower overhead for real-time updates

### Scraping Infrastructure: Firecrawl + Temporal
**Why this combination:**
- **Firecrawl**: AI-powered content extraction (as requested)
- **Temporal**: 
  - Workflow orchestration for complex scraping pipelines
  - Built-in retry logic and error handling
  - Visual workflow monitoring
  - Handles long-running scraping jobs
  - Better than simple cron jobs for reliability

### Queue System: BullMQ (Redis-based)
**Why BullMQ:**
- Distributed job processing
- Rate limiting built-in
- Job prioritization
- Dead letter queues for failed scrapes
- Real-time monitoring dashboard

### Caching: Redis
**Why Redis:**
- Sub-millisecond response times
- Cache API responses
- Store scraping checkpoints
- Session management
- Pub/sub for real-time updates

### Deployment: Kubernetes on Google Cloud Platform
**Why GCP + K8s:**
- Auto-scaling for traffic spikes
- Google's network infrastructure in Australia
- Cloud SQL for managed PostgreSQL
- Cloud Storage for backups
- Better pricing than AWS in APAC region

### Frontend: Next.js 14 with Tailwind CSS
**Why Next.js:**
- Server-side rendering for SEO
- App Router for better performance
- Built-in API routes
- Excellent mobile performance
- React Server Components for efficiency

### Monitoring: Grafana + Prometheus + Sentry
**Why this stack:**
- Real-time metrics dashboards
- Alert on scraping failures
- Track data quality metrics
- Error tracking and debugging
- Cost monitoring

## Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
└──────────────────────┬─────────────────────────┬────────────┘
                       │                         │
              ┌────────▼────────┐       ┌────────▼────────┐
              │   Next.js App   │       │  Fastify API    │
              │  (SSR + React)  │       │  (REST + WS)    │
              └────────┬────────┘       └────────┬────────┘
                       │                         │
                       └────────┬────────────────┘
                                │
                      ┌─────────▼─────────┐
                      │      Redis        │
                      │  (Cache + Queue)  │
                      └─────────┬─────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐   ┌─────────▼────────┐   ┌────────▼────────┐
│   PostgreSQL    │   │  Elasticsearch   │   │    Temporal     │
│  (Primary DB)   │   │  (Search Index)  │   │  (Workflows)    │
└─────────────────┘   └──────────────────┘   └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   Firecrawl     │
                                              │  (Scraping AI)  │
                                              └─────────────────┘
```

## Key Design Decisions

### 1. Data Flow
- Scrapers → Temporal Workflows → PostgreSQL → Elasticsearch
- Real-time updates via WebSockets
- CDC (Change Data Capture) for PostgreSQL → Elasticsearch sync

### 2. Scraping Strategy
```javascript
// Temporal Workflow Example
export async function serviceDiscoveryWorkflow() {
  // Discover new sources
  const sources = await discoverServiceDirectories();
  
  // Parallel scraping with rate limiting
  await Promise.all(
    sources.map(source => 
      scraperActivity(source, { 
        rateLimit: source.rateLimit,
        retries: 3 
      })
    )
  );
  
  // Quality check and deduplication
  await dataQualityActivity();
  
  // Index in Elasticsearch
  await indexingActivity();
}
```

### 3. API Design
- RESTful endpoints with OpenAPI spec
- GraphQL for complex queries (optional)
- WebSocket for real-time updates
- Pagination with cursor-based approach

### 4. Security
- OAuth 2.0 / JWT authentication
- Rate limiting per API key
- Input validation with JSON Schema
- SQL injection prevention
- XSS protection

## Implementation Priorities

### Phase 1: Core Infrastructure (Weeks 1-4)
1. PostgreSQL + PostGIS setup
2. Elasticsearch cluster configuration
3. Fastify API scaffolding
4. Firecrawl integration
5. Basic Temporal workflows

### Phase 2: Scraping Engine (Weeks 5-8)
1. Infoxchange Ask Izzy integration
2. Queensland Open Data scrapers
3. Government directory scrapers
4. Duplicate detection algorithm
5. Data quality scoring

### Phase 3: API & Search (Weeks 9-12)
1. Full-text search implementation
2. Geographic search queries
3. Advanced filtering system
4. API documentation
5. Rate limiting & caching

### Phase 4: Frontend & UX (Weeks 13-16)
1. Next.js application setup
2. Search interface design
3. Service detail pages
4. Mobile optimization
5. Accessibility compliance

## Cost Optimization

### Estimated Monthly Costs (AUD)
- GKE Cluster (3 nodes): $300
- Cloud SQL (PostgreSQL): $200
- Elasticsearch (managed): $400
- Redis (Cloud Memorystore): $100
- Firecrawl API: $500-2000 (based on usage)
- CDN & Storage: $50
- **Total: ~$1,550-3,050/month**

### Cost Reduction Strategies
1. Use spot instances for non-critical workloads
2. Implement aggressive caching
3. Optimize Elasticsearch queries
4. Use Firecrawl's batch endpoints
5. CDN for static assets

## Performance Targets

- API Response Time: <100ms (p95)
- Search Latency: <50ms
- Scraping Throughput: 1000 pages/hour
- Uptime: 99.9%
- Data Freshness: <24 hours

## Scaling Strategy

1. **Horizontal Scaling**: Add more API/worker nodes
2. **Database Sharding**: Partition by region
3. **Elasticsearch Sharding**: Optimize shard size
4. **CDN Integration**: CloudFlare for global distribution
5. **Queue Partitioning**: Separate queues by priority

This architecture provides the best balance of performance, reliability, and cost-effectiveness for a world-class service discovery system.