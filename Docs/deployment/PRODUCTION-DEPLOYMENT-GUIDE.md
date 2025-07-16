# 🚀 Production Deployment Guide

## **Overview**

This guide provides step-by-step instructions for deploying the Youth Justice Service Finder to production using Docker containers with automated data pipeline scheduling.

---

## **📋 Prerequisites**

### **System Requirements**
- Docker Engine 20.10+
- Docker Compose 2.0+
- Linux/MacOS/Windows with WSL2
- 4GB+ RAM
- 20GB+ disk space

### **Configuration Files**
- `.env.production` - Production environment variables
- `docker-compose.production.yml` - Production services configuration
- `database/init.sql` - Database initialization script

---

## **🔧 Environment Setup**

### **1. Create Production Environment File**

Copy the example and configure your settings:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your production values:

```bash
# Database Configuration
DATABASE_PASSWORD=your_secure_database_password
DATABASE_URL=postgresql://yjs_app:${DATABASE_PASSWORD}@postgres:5432/youth_justice_services

# Redis Configuration  
REDIS_URL=redis://redis:6379

# Pipeline Configuration
NODE_ENV=production
PIPELINE_SCHEDULE=0 2 * * *  # Daily at 2 AM
MAX_CONCURRENT_JOBS=3
BATCH_SIZE=100

# API Configuration
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Monitoring Configuration
GRAFANA_PASSWORD=your_secure_grafana_password

# Security
JWT_SECRET=your_jwt_secret_key
API_KEY=your_api_key
```

### **2. Directory Structure**

Ensure your project has this structure:

```
youth-justice-service-finder/
├── docker-compose.production.yml
├── .env.production
├── database/
│   └── init.sql
├── src/
│   ├── pipeline-service.js
│   ├── database/
│   │   └── database-manager.js
│   └── data-pipeline/
├── scripts/
│   ├── health-check.js
│   └── production/
│       ├── deploy.sh
│       ├── backup.sh
│       └── monitor.sh
└── Dockerfile.pipeline
```

---

## **🚀 Deployment Process**

### **Method 1: Automated Deployment (Recommended)**

```bash
# Make script executable
chmod +x scripts/production/deploy.sh

# Run full deployment
npm run production:deploy
# OR
bash scripts/production/deploy.sh
```

### **Method 2: Manual Deployment**

```bash
# 1. Build services
docker-compose -f docker-compose.production.yml build

# 2. Start services
docker-compose -f docker-compose.production.yml up -d

# 3. Check health
curl http://localhost:3000/health
curl http://localhost:3002/health
```

---

## **📊 Service Architecture**

### **Production Services**

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Main database with PostGIS |
| **Redis** | 6379 | Job queuing and caching |
| **API** | 3000 | REST API service |
| **Pipeline** | 3002 | Data extraction service |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3001 | Monitoring dashboard |

### **Data Sources**

1. **ACNC Charity Register** - 500+ youth-relevant services
2. **Queensland Youth Justice Centers** - 30+ government facilities  
3. **Victoria Community Organizations** - 100+ CSO providers

---

## **⏰ Automated Scheduling**

### **Default Schedule**
- **Full Pipeline**: Daily at 2:00 AM
- **High-Frequency Updates**: Every 6 hours
- **ACNC Updates**: Weekly
- **Government Data**: Monthly

### **Manual Triggers**

```bash
# Trigger full pipeline
curl -X POST http://localhost:3002/trigger

# Check pipeline status
curl http://localhost:3002/status

# View statistics
curl http://localhost:3002/statistics
```

---

## **📈 Monitoring & Health Checks**

### **Health Endpoints**
```bash
# API Service
curl http://localhost:3000/health

# Pipeline Service
curl http://localhost:3002/health

# Database Connection
curl http://localhost:3002/status
```

### **Monitoring Dashboard**
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `[GRAFANA_PASSWORD]`

### **Metrics**
- **Prometheus**: http://localhost:9090
- Service uptime, request rates, error rates
- Database performance, pipeline statistics

---

## **🔐 Security Configuration**

### **Database Security**
- Dedicated application user (`yjs_app`)
- Password-protected connections
- SSL encryption in production

### **API Security**
- Rate limiting (100 requests/minute)
- CORS protection
- Helmet security headers
- JWT authentication (if enabled)

### **Network Security**
- Internal Docker network
- Firewall rules for external access
- Reverse proxy recommendations

---

## **💾 Backup & Recovery**

### **Automated Backups**
```bash
# Create backup
npm run production:backup
# OR
bash scripts/production/backup.sh
```

### **Manual Database Backup**
```bash
# Backup database
docker exec yjs_postgres pg_dump -U yjs_app youth_justice_services > backup.sql

# Restore database
docker exec -i yjs_postgres psql -U yjs_app youth_justice_services < backup.sql
```

### **Volume Backups**
```bash
# Backup PostgreSQL data
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_$(date +%Y%m%d).tar.gz -C /data .

# Backup Redis data
docker run --rm -v redis_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis_$(date +%Y%m%d).tar.gz -C /data .
```

---

## **🔧 Maintenance Operations**

### **View Logs**
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f data-pipeline
docker-compose -f docker-compose.production.yml logs -f api
```

### **Scale Services**
```bash
# Scale API service
docker-compose -f docker-compose.production.yml up -d --scale api=3

# Scale pipeline workers
docker-compose -f docker-compose.production.yml up -d --scale data-pipeline=2
```

### **Update Services**
```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### **Database Maintenance**
```bash
# Connect to database
docker exec -it yjs_postgres psql -U yjs_app youth_justice_services

# Run cleanup
curl -X POST http://localhost:3002/cleanup

# View database statistics
curl http://localhost:3002/statistics
```

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **Services Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check service health
docker-compose -f docker-compose.production.yml ps

# Restart services
docker-compose -f docker-compose.production.yml restart
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
docker exec yjs_postgres pg_isready -U yjs_app

# View database logs
docker logs yjs_postgres

# Test connection
docker exec -it yjs_postgres psql -U yjs_app youth_justice_services
```

#### **Pipeline Not Running**
```bash
# Check pipeline service
curl http://localhost:3002/health

# View pipeline logs
docker logs yjs_pipeline

# Manually trigger pipeline
curl -X POST http://localhost:3002/trigger
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# Monitor database performance
docker exec yjs_postgres pg_stat_activity

# Check Redis memory
docker exec yjs_redis redis-cli info memory
```

### **Recovery Procedures**

#### **Complete System Recovery**
```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Remove volumes (if corrupted)
docker volume rm postgres_data redis_data

# Redeploy
npm run production:deploy
```

#### **Database Recovery**
```bash
# Stop database
docker-compose -f docker-compose.production.yml stop postgres

# Restore from backup
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres_latest.tar.gz -C /data

# Restart database
docker-compose -f docker-compose.production.yml start postgres
```

---

## **🌐 Production Best Practices**

### **SSL/TLS Configuration**
- Use reverse proxy (nginx/Apache) for SSL termination
- Configure HTTPS redirects
- Implement HSTS headers

### **Domain Configuration**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3000/;
    }
    
    location /pipeline/ {
        proxy_pass http://localhost:3002/;
    }
}
```

### **Firewall Rules**
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # Block direct API access
ufw deny 3002/tcp   # Block direct pipeline access
```

### **Resource Monitoring**
- Set up disk space alerts (< 10% free)
- Monitor memory usage (< 80%)
- Track database connections
- Monitor pipeline job success rates

---

## **📊 Performance Optimization**

### **Database Optimization**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM services WHERE youth_specific = true;

-- Update table statistics
ANALYZE services;

-- Monitor slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### **Pipeline Optimization**
- Adjust `BATCH_SIZE` for optimal throughput
- Tune `MAX_CONCURRENT_JOBS` based on resources
- Monitor extraction success rates
- Implement data source-specific rate limits

---

## **✅ Deployment Checklist**

### **Pre-Deployment**
- [ ] `.env.production` configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Backup storage configured
- [ ] Monitoring alerts configured

### **Post-Deployment**
- [ ] All services healthy
- [ ] Database initialized
- [ ] Initial data extraction completed
- [ ] Monitoring dashboard accessible
- [ ] Backup system tested
- [ ] Documentation updated

### **Ongoing Maintenance**
- [ ] Weekly backup verification
- [ ] Monthly security updates
- [ ] Quarterly performance review
- [ ] Annual disaster recovery test

---

## **🎯 Next Steps**

After successful deployment:

1. **Configure monitoring alerts**
2. **Set up SSL certificates**
3. **Implement log aggregation**
4. **Create operational runbooks**
5. **Plan disaster recovery procedures**

---

**🎉 Your Youth Justice Service Finder is now running in production!**

For support, monitoring, and updates, see the operational documentation in `/docs/operations/`.