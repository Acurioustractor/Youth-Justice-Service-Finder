# Youth Justice Service Finder

A world-class service discovery system that continuously finds and aggregates youth justice services from online directories across Queensland, Australia.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Firecrawl API key (optional but recommended)

### 1. Clone and Install

```bash
git clone <repository-url>
cd youth-justice-service-finder
npm install
```

### 2. Set up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

To get a Firecrawl API key:
1. Sign up at [https://firecrawl.dev](https://firecrawl.dev)
2. Copy your API key
3. Add it to `.env`

### 3. Start Infrastructure

```bash
# Start PostgreSQL, Elasticsearch, Redis, and Temporal
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

### 4. Set up Database

```bash
npm run setup:db
```

### 5. Set up Elasticsearch

```bash
npm run setup-elasticsearch
```

### 6. Start API and Frontend

```bash
# Terminal 1: Start API
npm run api

# Terminal 2: Start frontend
cd frontend && npm run dev
```

### 7. Load Initial Data

```bash
npm run scrape:all
```

This will:
- Scrape all 12 data sources systematically
- Populate 79+ youth justice services
- Run duplicate detection
- Show comprehensive results

## 🏗️ Architecture

### Technology Stack
- **Database**: PostgreSQL with PostGIS for geographic queries
- **Search**: Elasticsearch for full-text search
- **Scraping**: Firecrawl for AI-powered web scraping
- **Queue**: Redis with BullMQ
- **Workflows**: Temporal for orchestration
- **API**: Fastify (Node.js)
- **Frontend**: Next.js (React)

### Key Features
- **AI-Powered Scraping**: Uses Firecrawl to understand websites semantically
- **Duplicate Detection**: Multi-strategy deduplication with fuzzy matching
- **Geographic Search**: Find services within X km of any location
- **Data Quality**: Automated scoring and continuous improvement
- **Scalable**: Designed to handle millions of services

## 📁 Project Structure

```
youth-justice-service-finder/
├── src/
│   ├── scrapers/         # Web scrapers (Ask Izzy, QLD Open Data)
│   ├── services/         # Core services (Firecrawl, duplicate detection)
│   ├── workers/          # Temporal workflows and activities
│   ├── models/           # Data models and schemas
│   ├── utils/            # Validators and normalizers
│   └── api/              # API endpoints
├── database/
│   ├── schema.sql        # Database schema
│   └── migrations/       # Database migrations
├── scripts/              # Utility scripts
└── tests/                # Test files
```

## 🔧 Available Scripts

```bash
# Development
npm run api              # Start API server
npm run api:dev          # Start API with nodemon
cd frontend && npm run dev # Start React frontend

# Database
npm run setup:db         # Initialize database
npm run migrate          # Run migrations
npm run setup-elasticsearch # Set up Elasticsearch

# Scraping
npm run scrape:all       # Run all 12 scrapers
npm run scrape:demo      # Run demo scraper
npm run scrape:test      # Test individual scrapers

# Temporal Workflows
npm run temporal:setup   # Install and start Temporal server
npm run temporal:worker  # Start workflow worker
npm run temporal:scheduler # Set up scheduled workflows
npm run temporal:list    # List active schedules
npm run temporal:trigger # Manually trigger workflows

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Production
npm start                # Start production server
npm run build            # Build TypeScript
```

## 🔍 API Endpoints

Once the API server is running on port 3001:

**🌐 Frontend**: http://127.0.0.1:3003  
**📚 API Docs**: http://127.0.0.1:3001/docs  
**❤️ Health Check**: http://127.0.0.1:3001/health

```bash
# Advanced search with Elasticsearch
GET /search/es/enhanced?q=legal&categories=legal_aid&youth_specific=true&limit=20

# Geographic search
GET /search/es/geo?lat=-27.4698&lng=153.0251&radius=10km&limit=20

# Autocomplete suggestions
GET /search/es/autocomplete/enhanced?q=legal&limit=10

# Get service details
GET /services/:id

# List all services with filters
GET /services?categories=mental_health&youth_specific=true&limit=20

# Get organizations
GET /organizations?limit=20

# Database statistics
GET /stats
GET /stats/demographics
GET /stats/geographic
```

## 🌐 Data Sources

The system scrapes from:
1. **Ask Izzy** - Comprehensive social services directory
2. **Queensland Open Data Portal** - Government datasets
3. **Youth Justice Service Centres** - 54 locations across QLD
4. **Legal Aid Queensland** - Legal services
5. **Community Organizations** - Various youth support services

## 🔒 Data Privacy & Ethics

- No personal data is collected
- Only public service information is scraped
- Respects robots.txt and rate limits
- Transparent about data sources
- Community verification for accuracy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

### Firecrawl API Error
- Ensure your API key is correctly set in `.env`
- Check your API usage limits at firecrawl.dev

### Elasticsearch Connection Error
```bash
# Check if Elasticsearch is running
curl http://localhost:9200/_cluster/health
```

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing issues for solutions
- Review the documentation in `/docs`# Force redeploy Tue Jul  8 15:12:59 AEST 2025
