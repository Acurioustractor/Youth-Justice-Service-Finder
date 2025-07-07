#!/bin/bash

# Youth Justice Service Finder - Production Deployment Script
set -e

echo "🚀 Youth Justice Service Finder - Production Deployment"
echo "======================================================="

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please copy .env.production to $ENV_FILE and configure it"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "postgres"; then
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres youth_justice_prod > "$BACKUP_DIR/database.sql"
        
        # Backup volumes
        docker run --rm -v youth-justice-service-finder_postgres_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        docker run --rm -v youth-justice-service-finder_es_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/es_data.tar.gz -C /data .
        
        log_success "Backup created in $BACKUP_DIR"
    else
        log_warning "No existing database found, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."
    
    # Pull latest images
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE pull
    
    # Build application
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache app worker
    
    # Start infrastructure services first
    log_info "Starting infrastructure services..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d postgres elasticsearch redis temporal
    
    # Wait for services to be ready
    log_info "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Check service health
    log_info "Checking service health..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec postgres pg_isready -U postgres -d youth_justice_prod
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm app npm run migrate up
    
    # Set up Elasticsearch
    log_info "Setting up Elasticsearch..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm app npm run setup-elasticsearch
    
    # Start application services
    log_info "Starting application services..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d app worker nginx
    
    # Set up Temporal schedules
    log_info "Setting up Temporal schedules..."
    sleep 10
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec app npm run temporal:scheduler
    
    log_success "Deployment completed successfully!"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 15
    
    # Check API health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Check Elasticsearch
    if curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        log_success "Elasticsearch health check passed"
    else
        log_error "Elasticsearch health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec postgres pg_isready -U postgres -d youth_justice_prod > /dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    log_success "All health checks passed!"
}

# Show status
show_status() {
    echo ""
    log_info "Deployment Status:"
    echo "=================="
    
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
    
    echo ""
    log_info "Service URLs:"
    echo "============="
    echo "🌐 Frontend: http://localhost"
    echo "🔌 API: http://localhost/api"
    echo "📚 API Docs: http://localhost/docs"
    echo "❤️ Health Check: http://localhost/health"
    echo "🔍 Elasticsearch: http://localhost:9200"
    echo "⏰ Temporal UI: http://localhost:8080"
    echo ""
    
    log_info "Useful Commands:"
    echo "================"
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "Scale service: docker-compose -f $COMPOSE_FILE up -d --scale app=3"
    echo "Stop all: docker-compose -f $COMPOSE_FILE down"
    echo "Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_backup
            deploy
            health_check
            show_status
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        "status")
            show_status
            ;;
        "stop")
            log_info "Stopping all services..."
            docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
            log_success "Services stopped"
            ;;
        "logs")
            docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f "${2:-app}"
            ;;
        *)
            echo "Usage: $0 {deploy|backup|health|status|stop|logs [service]}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Full deployment (default)"
            echo "  backup  - Create backup only"
            echo "  health  - Run health checks only"
            echo "  status  - Show service status"
            echo "  stop    - Stop all services"
            echo "  logs    - View service logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"