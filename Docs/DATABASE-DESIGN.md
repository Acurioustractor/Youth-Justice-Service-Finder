# 🗄️ Production Database Design & Architecture

## **Database Overview**

The Youth Justice Service Finder uses a **PostgreSQL database** with a comprehensive schema designed for:
- **High-volume service data** (1000+ services)
- **Multi-source integration** with data lineage tracking
- **Geographic search** with PostGIS extensions
- **Real-time updates** with conflict resolution
- **Analytics and reporting** capabilities

---

## **📋 Core Database Schema**

### **1. Services Table (Primary Entity)**
```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- Data Quality & Verification
    completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 1),
    verification_status VARCHAR(20) DEFAULT 'unverified',
    verification_score INTEGER CHECK (verification_score BETWEEN 0 AND 100),
    
    -- Youth-specific flags
    youth_specific BOOLEAN DEFAULT false,
    indigenous_specific BOOLEAN DEFAULT false,
    
    -- Data lineage
    data_source VARCHAR(100) NOT NULL,
    source_id VARCHAR(100), -- Original ID from source system
    source_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector tsvector,
    
    CONSTRAINT services_name_source_unique UNIQUE (name, data_source)
);

-- Full-text search index
CREATE INDEX idx_services_search ON services USING GIN(search_vector);
-- Performance indexes
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_youth ON services(youth_specific);
CREATE INDEX idx_services_source ON services(data_source);
CREATE INDEX idx_services_updated ON services(updated_at);
```

### **2. Organizations Table**
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(50),
    legal_status VARCHAR(100),
    
    -- Identifiers
    abn VARCHAR(11), -- Australian Business Number
    acn VARCHAR(9),  -- Australian Company Number
    tax_id VARCHAR(50),
    website_url TEXT,
    
    -- Data lineage
    data_source VARCHAR(100) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_abn ON organizations(abn);
CREATE INDEX idx_organizations_name ON organizations(name);
```

### **3. Service Categories (Many-to-Many)**
```sql
CREATE TABLE service_categories (
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    
    PRIMARY KEY (service_id, category)
);

CREATE INDEX idx_service_categories_category ON service_categories(category);
```

### **4. Locations Table (Geographic Data)**
```sql
-- Enable PostGIS extension for geographic features
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    name VARCHAR(255),
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'AU',
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom GEOMETRY(POINT, 4326), -- PostGIS geometry for spatial queries
    
    -- Regional classification
    region VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for geographic queries
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);
-- Performance indexes
CREATE INDEX idx_locations_service ON locations(service_id);
CREATE INDEX idx_locations_state ON locations(state_province);
CREATE INDEX idx_locations_city ON locations(city);

-- Trigger to automatically update geom from lat/lng
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_geom
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_location_geom();
```

### **5. Contacts Table**
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    name VARCHAR(255),
    email VARCHAR(255),
    phone JSONB, -- Array of phone numbers
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_service ON contacts(service_id);
CREATE INDEX idx_contacts_email ON contacts(email);
```

### **6. Service Relationships (Links between services)**
```sql
CREATE TABLE service_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    related_service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'duplicate', 'branch', 'parent', 'partner'
    confidence_score DECIMAL(3,2), -- For duplicate detection
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT service_relationships_no_self UNIQUE (service_id, related_service_id)
);
```

---

## **📊 Data Pipeline Tables**

### **7. Data Sources Registry**
```sql
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'api', 'csv', 'web_scraping'
    base_url TEXT,
    
    -- Configuration
    config JSONB, -- Adapter-specific configuration
    
    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    last_extraction TIMESTAMP WITH TIME ZONE,
    next_extraction TIMESTAMP WITH TIME ZONE,
    extraction_frequency INTERVAL, -- e.g., '1 day', '1 week'
    
    -- Performance metrics
    total_extractions INTEGER DEFAULT 0,
    successful_extractions INTEGER DEFAULT 0,
    average_processing_time INTEGER, -- milliseconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **8. Extraction Jobs**
```sql
CREATE TABLE extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) REFERENCES data_sources(name),
    
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Job configuration
    config JSONB,
    
    -- Results
    services_extracted INTEGER DEFAULT 0,
    services_processed INTEGER DEFAULT 0,
    services_stored INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time INTEGER, -- milliseconds
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_source ON extraction_jobs(source_name);
CREATE INDEX idx_extraction_jobs_created ON extraction_jobs(created_at);
```

### **9. Quality Issues Tracking**
```sql
CREATE TABLE quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    issue_type VARCHAR(50) NOT NULL, -- 'missing_contact', 'invalid_address', 'outdated_info'
    issue_description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quality_issues_service ON quality_issues(service_id);
CREATE INDEX idx_quality_issues_type ON quality_issues(issue_type);
CREATE INDEX idx_quality_issues_resolved ON quality_issues(is_resolved);
```

---

## **🔧 Database Functions & Triggers**

### **Auto-Update Timestamps**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Search Vector Updates**
```sql
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_search_vector_trigger
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_service_search_vector();
```

---

## **📈 Analytics & Reporting Views**

### **Service Statistics View**
```sql
CREATE VIEW service_statistics AS
SELECT 
    s.data_source,
    COUNT(*) as total_services,
    COUNT(*) FILTER (WHERE s.status = 'active') as active_services,
    AVG(s.completeness_score) as avg_quality_score,
    COUNT(*) FILTER (WHERE s.youth_specific = true) as youth_specific_count,
    COUNT(*) FILTER (WHERE s.verification_status = 'verified') as verified_count,
    COUNT(DISTINCT l.state_province) as states_covered,
    MAX(s.updated_at) as last_updated
FROM services s
LEFT JOIN locations l ON s.id = l.service_id
GROUP BY s.data_source;
```

### **Geographic Coverage View**
```sql
CREATE VIEW geographic_coverage AS
SELECT 
    l.state_province,
    l.city,
    COUNT(*) as service_count,
    COUNT(*) FILTER (WHERE s.youth_specific = true) as youth_services,
    AVG(s.completeness_score) as avg_quality
FROM services s
JOIN locations l ON s.id = l.service_id
WHERE s.status = 'active'
GROUP BY l.state_province, l.city
ORDER BY service_count DESC;
```

---

## **🚀 Database Deployment Configuration**

### **Environment Variables**
```bash
# Production Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/youth_justice_services
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Development Database
DEV_DATABASE_URL=postgresql://localhost:5432/youth_justice_dev

# Backup Configuration
BACKUP_BUCKET=youth-justice-backups
BACKUP_SCHEDULE="0 2 * * *" # Daily at 2 AM
```

### **Database Initialization Script**
```sql
-- Create database and user
CREATE DATABASE youth_justice_services;
CREATE USER yjs_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE youth_justice_services TO yjs_app;

-- Connect to the database
\c youth_justice_services;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- Grant permissions to application user
GRANT ALL ON ALL TABLES IN SCHEMA public TO yjs_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO yjs_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO yjs_app;
```

---

## **📊 Performance Optimization**

### **Key Indexes for Production**
```sql
-- Service search performance
CREATE INDEX idx_services_active_youth ON services(status, youth_specific);
CREATE INDEX idx_services_source_updated ON services(data_source, updated_at);

-- Geographic search optimization
CREATE INDEX idx_locations_state_city ON locations(state_province, city);

-- Full-text search optimization
CREATE INDEX idx_services_name_gin ON services USING GIN(to_tsvector('english', name));

-- Analytics optimization
CREATE INDEX idx_extraction_jobs_date_status ON extraction_jobs(DATE(created_at), status);
```

### **Query Optimization Examples**
```sql
-- Fast service search with location
EXPLAIN (ANALYZE, BUFFERS) 
SELECT s.*, l.city, l.state_province
FROM services s
JOIN locations l ON s.id = l.service_id
WHERE s.status = 'active' 
  AND s.youth_specific = true
  AND l.state_province = 'QLD'
ORDER BY s.completeness_score DESC
LIMIT 20;

-- Geospatial radius search
SELECT s.name, l.city, 
       ST_Distance(l.geom, ST_SetSRID(ST_MakePoint(153.0278, -27.4679), 4326)) as distance_meters
FROM services s
JOIN locations l ON s.id = l.service_id
WHERE ST_DWithin(l.geom, ST_SetSRID(ST_MakePoint(153.0278, -27.4679), 4326), 10000) -- 10km radius
ORDER BY distance_meters
LIMIT 10;
```

This database design provides a **robust, scalable foundation** for the Youth Justice Service Finder with built-in support for:
- **Multi-source data integration**
- **Geographic search capabilities** 
- **Quality tracking and analytics**
- **Performance optimization**
- **Data lineage and auditing**

Ready for the next step: **Production deployment setup**! 🚀