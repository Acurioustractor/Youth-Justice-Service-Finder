# Data Sources Integration Guide

This document outlines the additional data sources integrated into the Youth Justice Service Finder system, including implementation details, licensing requirements, and usage guidelines.

## Overview

We've implemented scrapers for multiple open data sources to maximize the comprehensiveness of our youth service database while respecting terms of use and attribution requirements.

## Implemented Data Sources

### 1. MyCommunityDirectory 🌐

**Status:** ✅ Implemented with API support
**Type:** Commercial API with subscription
**Coverage:** National community services directory

#### Implementation Details
- **File:** `src/scrapers/my-community-directory-scraper.js`
- **Rate Limiting:** 5 requests/second (configurable)
- **API Key Required:** Yes
- **Fallback:** Web scraping (respects terms)

#### Setup Requirements
```bash
# Set environment variable
export MY_COMMUNITY_DIRECTORY_API_KEY="your-api-key"
```

#### Usage Considerations
- **Budget:** API calls have costs - monitor usage
- **Rate Limits:** Respects per-second limits with automatic throttling
- **Terms Compliance:** Requires subscription for API access
- **Data Quality:** High-quality, structured service data

#### Example API Response Mapping
```javascript
{
  name: service.name,
  categories: mapCategories(service.categories),
  location: {
    address_1: service.locations[0].street_address,
    region: mapRegion(service.locations[0].suburb)
  }
}
```

---

### 2. ACNC (Australian Charities and Not-for-profits Commission) 🏛️

**Status:** ✅ Implemented with open data access
**Type:** Government open data
**Coverage:** All registered Australian charities
**License:** CC-BY 3.0 AU

#### Implementation Details
- **File:** `src/scrapers/acnc-scraper.js`
- **Data Source:** data.gov.au ACNC register
- **Rate Limiting:** 10 requests/second for government APIs
- **Attribution Required:** Yes

#### Attribution Requirements
```json
{
  "source": "Australian Charities and Not-for-profits Commission",
  "license": "CC-BY 3.0 AU",
  "url": "https://data.gov.au/dataset/acnc-register",
  "attribution": "Data sourced from ACNC under CC-BY 3.0 AU license"
}
```

#### Data Quality Considerations
- **Completeness:** Basic organization details only
- **Contact Info:** Limited (no direct phone/email in public data)
- **Relevance:** Requires filtering for youth-specific services
- **Updates:** Regular government data updates

#### Youth Relevance Filtering
```javascript
const youthActivities = [
  'Youth development',
  'Youth welfare', 
  'Children - 6 to under 15',
  'Young adults - 15 to under 25'
];
```

---

### 3. Queensland Government CKAN Portal 🏢

**Status:** ✅ Implemented with dataset discovery
**Type:** Government open data portal
**Coverage:** Queensland government datasets
**License:** CC-BY 4.0

#### Implementation Details
- **File:** `src/scrapers/qld-ckan-scraper.js`
- **Portal:** https://www.data.qld.gov.au
- **Rate Limiting:** 5 requests/second for CKAN APIs
- **Attribution Required:** Yes

#### Attribution Requirements
```json
{
  "source": "Queensland Government Open Data Portal",
  "license": "CC-BY 4.0",
  "url": "https://www.data.qld.gov.au",
  "attribution": "Data sourced from Queensland Government under CC-BY 4.0 license"
}
```

#### Dataset Types Supported
- **CSV:** Bulk data downloads with custom mapping
- **JSON:** Structured service data
- **API:** Real-time data endpoints

#### Search Terms Used
- "youth services"
- "youth justice" 
- "children services"
- "community services"
- "mental health services"
- "family support"

---

## Rate Limiting Implementation

All scrapers implement respectful rate limiting to avoid overwhelming data sources:

### Rate Limiter Configuration
```javascript
export const rateLimiters = {
  myCommunityDirectory: new RateLimiter({
    maxRequests: 5,
    windowMs: 1000,
    name: 'MyCommunityDirectory'
  }),
  
  governmentApi: new RateLimiter({
    maxRequests: 10,
    windowMs: 1000,
    name: 'GovernmentAPI'
  }),
  
  ckan: new RateLimiter({
    maxRequests: 5,
    windowMs: 1000,
    name: 'CKAN'
  })
};
```

### Usage Example
```javascript
await this.rateLimiter.throttle();
const response = await axios.get(url);
```

## Attribution System

### Database Schema
```sql
-- Added to services table
ALTER TABLE services ADD COLUMN attribution JSONB;

-- Added to organizations table  
ALTER TABLE organizations ADD COLUMN abn VARCHAR(50);
```

### Attribution Format
```javascript
const attribution = {
  source: "Data Source Name",
  license: "CC-BY 4.0",
  attribution: "Human readable attribution text",
  sourceUrl: "https://datasource.com",
  accessedDate: "2025-01-01T00:00:00.000Z"
};
```

## Data Source Status

| Source | Status | Services Added | API Required | License |
|--------|--------|----------------|--------------|---------|
| Queensland Youth Justice | ✅ Active | 14 | No | N/A |
| headspace | ✅ Active | 15 | No | N/A |
| Legal Aid Queensland | ✅ Active | 15 | No | N/A |
| PCYC Queensland | ✅ Active | 15 | No | N/A |
| Youth Advocacy Centre | ✅ Active | 4 | No | N/A |
| Aboriginal & Torres Strait Islander | ✅ Active | 7 | No | N/A |
| Crisis Support | ✅ Active | 6 | No | N/A |
| **MyCommunityDirectory** | 🔧 Ready | 0* | **Yes** | Commercial |
| **ACNC** | 🔧 Ready | 0* | No | CC-BY 3.0 AU |
| **Queensland CKAN** | 🔧 Ready | 0* | No | CC-BY 4.0 |

*Ready for production with API keys/data processing

## Implementation Checklist

### For Production Deployment

#### MyCommunityDirectory
- [ ] Obtain API subscription and key
- [ ] Set up billing alerts for API usage
- [ ] Configure rate limiting (5 req/sec)
- [ ] Test with live API endpoints
- [ ] Monitor API usage and costs

#### ACNC
- [ ] Test DataStore API access
- [ ] Implement CSV processing fallback
- [ ] Set up attribution display
- [ ] Schedule regular data updates
- [ ] Validate charity relevance filtering

#### Queensland CKAN
- [ ] Identify specific youth service datasets
- [ ] Implement custom data mapping
- [ ] Set up dataset monitoring
- [ ] Test JSON/CSV processing
- [ ] Configure attribution display

### Legal Compliance
- [ ] Display attribution on frontend
- [ ] Maintain copyright notices
- [ ] Link back to original sources
- [ ] Document data usage policies
- [ ] Set up data refresh schedules

## Error Handling

### Common Issues
1. **API Rate Limits:** Automatic retry with exponential backoff
2. **Data Format Changes:** Graceful degradation with logging
3. **Network Timeouts:** Configurable timeout limits
4. **Invalid Data:** Skip with error logging
5. **Attribution Missing:** Fail-safe with default attribution

### Monitoring
```javascript
// Example error monitoring
logger.error({ 
  source: 'ACNC',
  error: error.message,
  statusCode: error.response?.status 
}, 'Data source error');
```

## Testing

### Test All Data Sources
```bash
node scripts/test-data-sources.js
```

### Individual Source Testing
```bash
# Test MyCommunityDirectory
node -e "import('./src/scrapers/my-community-directory-scraper.js').then(m => m.createMyCommunityDirectoryScraper(db).scrape())"

# Test ACNC
node -e "import('./src/scrapers/acnc-scraper.js').then(m => m.createACNCScraper(db).scrape())"

# Test Queensland CKAN
node -e "import('./src/scrapers/qld-ckan-scraper.js').then(m => m.createQLDCKANScraper(db).scrape())"
```

## Performance Considerations

### Memory Usage
- Stream large CSV files rather than loading entirely
- Process data in batches
- Clean up resources after processing

### Database Performance
- Use transactions for batch inserts
- Implement duplicate detection
- Index frequently queried fields

### Network Usage
- Respect rate limits
- Implement caching where appropriate
- Use compression when available

## Security Considerations

### API Keys
- Store in environment variables only
- Never commit to version control
- Rotate keys regularly
- Monitor usage for anomalies

### Data Validation
- Sanitize all incoming data
- Validate data structure before processing
- Log suspicious or malformed data

## Future Enhancements

### Additional Data Sources
1. **Ask Izzy API** - National service directory
2. **Local Government Directories** - Council service listings
3. **NGO Specific APIs** - Specialized service providers
4. **Education Department APIs** - School-based services

### Data Quality Improvements
1. **Address Geocoding** - Standardize location data
2. **Service Categorization** - ML-based category mapping
3. **Duplicate Detection** - Cross-source duplicate identification
4. **Data Freshness** - Track data age and update frequency

### Automation
1. **Scheduled Updates** - Temporal workflow integration
2. **Data Quality Monitoring** - Automated health checks
3. **Attribution Compliance** - Automatic license checking
4. **Performance Monitoring** - Response time tracking

---

## Contact and Support

For issues with data source integration:
1. Check the logs for specific error messages
2. Verify API keys and rate limits
3. Test individual scrapers in isolation
4. Review attribution requirements
5. Monitor data source health endpoints

This comprehensive integration provides a solid foundation for expanding the youth service database while maintaining legal compliance and data quality standards.