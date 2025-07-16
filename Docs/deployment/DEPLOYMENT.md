# Youth Justice Service Finder - Production Deployment Guide

This guide covers deploying the Youth Justice Service Finder to a production environment using Docker Compose.

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │────│    App      │────│ PostgreSQL  │
│  (Port 80)  │    │ (Port 3001) │    │ (Port 5432) │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                   ┌─────────────┐    ┌─────────────┐
                   │    Worker   │    │Elasticsearch│
                   │ (Temporal)  │    │ (Port 9200) │
                   └─────────────┘    └─────────────┘
                           │
                   ┌─────────────┐    ┌─────────────┐
                   │  Temporal   │    │    Redis    │
                   │(Port 7233)  │    │ (Port 6379) │
                   └─────────────┘    └─────────────┘
```

## 📋 Prerequisites

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Storage**: 50GB+ SSD recommended
- **OS**: Linux (Ubuntu 20.04+ recommended)

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL certificates (for HTTPS)

## 🚀 Quick Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Reboot to apply group changes
sudo reboot
```

### 2. Application Setup

```bash
# Clone repository
git clone <repository-url>
cd youth-justice-service-finder

# Create production environment file
cp .env.production .env.prod

# Edit environment variables
nano .env.prod
```

### 3. Configure Environment Variables

Edit `.env.prod` with your production values:

```bash
# Required: Database password
POSTGRES_PASSWORD=your_very_secure_password_here

# Required: JWT secret (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long

# Required: API keys
FIRECRAWL_API_KEY=your_firecrawl_api_key
MY_COMMUNITY_DIRECTORY_API_KEY=your_api_key

# Optional: Domain configuration
FRONTEND_URL=https://youth-justice.your-domain.com
API_BASE_URL=https://api.youth-justice.your-domain.com

# Optional: Backup configuration
S3_BACKUP_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 4. Deploy

```bash
# Run deployment script
./scripts/production/deploy.sh

# Check status
./scripts/production/deploy.sh status
```

## 🔧 Advanced Configuration

### SSL/HTTPS Setup

1. **Obtain SSL certificates** (Let's Encrypt recommended):
   ```bash
   # Install certbot
   sudo apt install certbot

   # Get certificates
   sudo certbot certonly --standalone -d your-domain.com
   ```

2. **Configure SSL in nginx**:
   ```bash
   # Copy certificates
   sudo mkdir -p nginx/ssl
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Enable HTTPS in nginx.conf**:
   Uncomment and configure the HTTPS server block in `nginx/nginx.conf`

### Custom Domain Configuration

1. **DNS Setup**:
   ```
   A    youth-justice.your-domain.com     → your.server.ip
   A    api.youth-justice.your-domain.com → your.server.ip
   ```

2. **Update environment**:
   ```bash
   FRONTEND_URL=https://youth-justice.your-domain.com
   API_BASE_URL=https://api.youth-justice.your-domain.com
   ```

### Scaling Configuration

Scale specific services based on load:

```bash
# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=2
```

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Check all services
./scripts/production/deploy.sh health

# Check specific endpoints
curl http://localhost/health
curl http://localhost:9200/_cluster/health
```

### Log Management

```bash
# View application logs
./scripts/production/deploy.sh logs app

# View all service logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Database Management

```bash
# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d youth_justice_prod

# Run migrations
docker-compose -f docker-compose.prod.yml exec app npm run migrate up

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d youth_justice_prod -c "SELECT pg_size_pretty(pg_database_size('youth_justice_prod'));"
```

## 💾 Backup & Recovery

### Automated Backups

Backups run automatically via cron. To set up:

```bash
# Add to crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/youth-justice-service-finder/scripts/production/backup.sh backup
```

### Manual Backup

```bash
# Create backup
./scripts/production/backup.sh backup

# List backups
./scripts/production/backup.sh list

# Restore from backup
./scripts/production/backup.sh restore /path/to/backup.tar.gz
```

### Cloud Backup Setup

Configure AWS S3 backup in `.env.prod`:

```bash
S3_BACKUP_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### Security Headers

The nginx configuration includes security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

### Database Security

- Database is only accessible from within Docker network
- Strong password required
- Regular security updates applied

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   sudo netstat -tlnp | grep :80
   
   # Stop conflicting services
   sudo systemctl stop apache2  # if Apache is running
   ```

2. **Permission issues**:
   ```bash
   # Fix Docker permissions
   sudo chown -R $USER:docker /var/run/docker.sock
   ```

3. **Memory issues**:
   ```bash
   # Check memory usage
   docker stats
   
   # Increase swap if needed
   sudo fallocate -l 2G /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **Database connection issues**:
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec app npm run setup:db
   ```

### Performance Tuning

1. **Database optimization**:
   ```sql
   -- Connect to database
   -- Run VACUUM and ANALYZE
   VACUUM ANALYZE;
   
   -- Check slow queries
   SELECT query, calls, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **Elasticsearch optimization**:
   ```bash
   # Check cluster health
   curl localhost:9200/_cluster/health?pretty
   
   # Optimize indices
   curl -X POST localhost:9200/_forcemerge?max_num_segments=1
   ```

### Recovery Procedures

1. **Complete system failure**:
   ```bash
   # Stop all services
   docker-compose -f docker-compose.prod.yml down
   
   # Restore from backup
   ./scripts/production/backup.sh restore latest_backup.tar.gz
   
   # Restart services
   ./scripts/production/deploy.sh
   ```

2. **Data corruption**:
   ```bash
   # Restore database only
   docker-compose -f docker-compose.prod.yml exec postgres pg_restore -U postgres -d youth_justice_prod /backup/database.sql
   
   # Rebuild Elasticsearch index
   docker-compose -f docker-compose.prod.yml exec app npm run setup-elasticsearch
   ```

## 📊 Monitoring & Alerts

### Service Monitoring URLs

- **API Health**: http://localhost/health
- **Database**: Accessible via logs and health checks
- **Elasticsearch**: http://localhost:9200/_cluster/health
- **Temporal UI**: http://localhost:8080

### Performance Metrics

Monitor these key metrics:
- Response time < 200ms (API)
- CPU usage < 80%
- Memory usage < 80%
- Disk usage < 90%
- Database connections < 80% of max

### Log Analysis

Important log locations:
- Application: `docker-compose logs app`
- Database: `docker-compose logs postgres`
- Nginx: `docker-compose logs nginx`
- Worker: `docker-compose logs worker`

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./scripts/production/deploy.sh

# Run any new migrations
docker-compose -f docker-compose.prod.yml exec app npm run migrate up
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Database Maintenance

```bash
# Regular maintenance (run weekly)
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d youth_justice_prod -c "VACUUM ANALYZE;"

# Check database size and cleanup if needed
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d youth_justice_prod -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 📞 Support

For production issues:

1. **Check logs first**: `./scripts/production/deploy.sh logs`
2. **Run health checks**: `./scripts/production/deploy.sh health`
3. **Check system resources**: `docker stats`
4. **Review this documentation**
5. **Create GitHub issue** with logs and error details

## 🔗 Useful Links

- **API Documentation**: http://localhost/docs
- **Temporal Web UI**: http://localhost:8080
- **Elasticsearch**: http://localhost:9200
- **Health Checks**: http://localhost/health