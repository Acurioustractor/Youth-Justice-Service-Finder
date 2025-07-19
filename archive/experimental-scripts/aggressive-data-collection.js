#!/usr/bin/env node

// Aggressive Australian Data Collection - Maximum Public Data Extraction
import { AustralianGovernmentPortalScraper } from './src/scrapers/australian-government-portals.js';
import { AskIzzyAPIScraper } from './src/scrapers/ask-izzy-api-scraper.js';
import { ServiceValidator, DataNormalizer } from './src/schemas/australian-service-schema.js';
import axios from 'axios';
import pino from 'pino';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const logger = pino({ 
  name: 'aggressive-collector',
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

class AggressiveDataCollector {
  constructor() {
    this.validator = new ServiceValidator();
    this.allServices = [];
    this.stats = {
      total_attempts: 0,
      successful_extractions: 0,
      services_collected: 0,
      data_sources_used: 0,
      errors: 0,
      start_time: Date.now()
    };
    
    // Alternative API endpoints and workarounds
    this.alternativeEndpoints = [
      // Service Seeker alternatives
      'https://api.serviceseeker.com.au/api/v2/search',
      'https://www.serviceseeker.com.au/api/search',
      
      // Australian Business Register APIs
      'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx',
      
      // Find & Connect API alternatives
      'https://www.findandconnect.gov.au/api/services',
      
      // 211 Australia alternatives  
      'https://au.211.org/api/search',
      
      // Local council APIs
      'https://data.brisbane.qld.gov.au/api/3/action/package_search',
      'https://data.melbourne.vic.gov.au/api/3/action/package_search',
      'https://data.sydney.nsw.gov.au/api/3/action/package_search',
      'https://data.perth.wa.gov.au/api/3/action/package_search',
      'https://data.adelaide.sa.gov.au/api/3/action/package_search'
    ];

    // Extended search terms for maximum coverage
    this.comprehensiveSearchTerms = [
      'youth services', 'young people', 'adolescent', 'teenager', 'teen',
      'community services', 'social services', 'support services',
      'legal aid', 'legal services', 'court support', 'justice',
      'mental health', 'counselling', 'psychology', 'therapy',
      'crisis support', 'emergency support', 'helpline',
      'housing', 'accommodation', 'homelessness', 'shelter',
      'education', 'training', 'employment', 'job', 'work',
      'family services', 'parenting', 'child services',
      'disability services', 'indigenous services', 'aboriginal',
      'health services', 'medical', 'dental', 'sexual health',
      'drug and alcohol', 'addiction', 'substance abuse',
      'financial assistance', 'emergency relief', 'welfare',
      'domestic violence', 'family violence', 'women services',
      'multicultural', 'refugee', 'migrant', 'ethnic'
    ];
  }

  async executeAggressiveCollection() {
    logger.info('🚀 Starting AGGRESSIVE Australian data collection');
    logger.info('🎯 Goal: Maximum data extraction from all public sources');
    
    try {
      // Phase 1: Enhanced Government Portal Scraping
      await this.enhancedGovernmentPortalScraping();
      
      // Phase 2: Alternative Ask Izzy Endpoints
      await this.alternativeAskIzzyCollection();
      
      // Phase 3: Alternative API Endpoints
      await this.alternativeAPICollection();
      
      // Phase 4: Local Council Data Scraping
      await this.localCouncilDataScraping();
      
      // Phase 5: Business Registry Mining
      await this.businessRegistryMining();
      
      // Phase 6: Web Directory Scraping
      await this.webDirectoryScraping();
      
      // Phase 7: Export Comprehensive Results
      await this.exportComprehensiveResults();
      
      return this.generateFinalReport();
      
    } catch (error) {
      logger.error({ error: error.message }, 'Aggressive collection failed');
      throw error;
    }
  }

  async enhancedGovernmentPortalScraping() {
    logger.info('📊 Phase 1: Enhanced Government Portal Scraping');
    
    const portalScraper = new AustralianGovernmentPortalScraper(null, {
      maxRequestsPerMinute: 60, // Aggressive rate
      respectRobots: true
    });

    // Enhanced portal configuration with more search terms
    portalScraper.portals.forEach(portal => {
      portal.searchTerms = this.comprehensiveSearchTerms.slice(0, 10); // Use first 10 terms
    });

    const results = await portalScraper.scrapeAllPortals();
    
    // Collect all services from portal results
    for (const portalResult of results.results) {
      if (portalResult.services) {
        this.addServices(portalResult.services, `government_portal_${portalResult.portal}`);
      }
    }
    
    this.stats.data_sources_used += results.results.length;
    logger.info({ 
      portals_scraped: results.results.length,
      services_found: this.allServices.length 
    }, 'Enhanced government portal scraping completed');
  }

  async alternativeAskIzzyCollection() {
    logger.info('🔍 Phase 2: Alternative Ask Izzy Collection Methods');
    
    // Try multiple Ask Izzy endpoints and methods
    const askIzzyEndpoints = [
      'https://askizzy.org.au/api/v0/search',
      'https://api.askizzy.org.au/v0/search',
      'https://askizzy.org.au/search', // Direct web endpoint
      'https://www.askizzy.org.au/api/search'
    ];

    const locations = [
      { name: 'Sydney', state: 'NSW', lat: -33.8688, lng: 151.2093 },
      { name: 'Melbourne', state: 'VIC', lat: -37.8136, lng: 144.9631 },
      { name: 'Brisbane', state: 'QLD', lat: -27.4698, lng: 153.0251 },
      { name: 'Perth', state: 'WA', lat: -31.9505, lng: 115.8605 },
      { name: 'Adelaide', state: 'SA', lat: -34.9285, lng: 138.6007 }
    ];

    const categories = ['legal', 'mental-health', 'housing', 'support-and-counselling'];

    for (const endpoint of askIzzyEndpoints) {
      for (const location of locations) {
        for (const category of categories) {
          try {
            this.stats.total_attempts++;
            
            const services = await this.tryAskIzzyEndpoint(endpoint, location, category);
            if (services.length > 0) {
              this.addServices(services, `askizzy_${endpoint.split('/').pop()}`);
              this.stats.successful_extractions++;
            }
            
            await this.delay(1000); // Rate limiting
            
          } catch (error) {
            this.stats.errors++;
            logger.debug({ endpoint, location: location.name, category, error: error.message }, 'Ask Izzy attempt failed');
          }
        }
      }
    }

    logger.info({ 
      endpoints_tried: askIzzyEndpoints.length,
      services_collected: this.allServices.length 
    }, 'Alternative Ask Izzy collection completed');
  }

  async tryAskIzzyEndpoint(endpoint, location, category) {
    const searchParams = {
      category: category,
      location: `${location.lat},${location.lng}`,
      q: 'youth',
      'minimum-should-match': 1,
      limit: 100,
      'search-radius': 50000
    };

    try {
      const response = await axios.get(endpoint, {
        params: searchParams,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; YouthServiceFinder/1.0)',
          'Accept': 'application/json',
          'Referer': 'https://askizzy.org.au'
        },
        timeout: 15000
      });

      if (response.data && (response.data.objects || response.data.results || response.data.data)) {
        const services = response.data.objects || response.data.results || response.data.data;
        return this.processAskIzzyServices(services, location, category);
      }
      
      return [];
      
    } catch (error) {
      // Try with different parameters
      if (error.response?.status === 404) {
        return await this.tryAlternativeAskIzzyFormat(endpoint, location, category);
      }
      throw error;
    }
  }

  async tryAlternativeAskIzzyFormat(endpoint, location, category) {
    try {
      // Try different parameter format
      const response = await axios.get(endpoint, {
        params: {
          'location': `${location.name}, ${location.state}`,
          'category': category.replace(/-/g, ' '),
          'query': 'youth',
          'limit': 50
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; YouthServiceFinder/1.0)'
        },
        timeout: 15000
      });

      if (response.data && response.data.data) {
        return this.processAskIzzyServices(response.data.data, location, category);
      }
      
      return [];
      
    } catch (error) {
      return [];
    }
  }

  processAskIzzyServices(rawServices, location, category) {
    const services = [];
    
    for (const rawService of rawServices.slice(0, 20)) { // Limit to prevent overwhelming
      try {
        const service = this.createServiceFromAskIzzy(rawService, location, category);
        if (service) {
          services.push(service);
        }
      } catch (error) {
        logger.debug({ error: error.message }, 'Failed to process Ask Izzy service');
      }
    }
    
    return services;
  }

  async alternativeAPICollection() {
    logger.info('🌐 Phase 3: Alternative API Endpoint Collection');
    
    for (const endpoint of this.alternativeEndpoints) {
      try {
        this.stats.total_attempts++;
        
        const services = await this.tryAlternativeEndpoint(endpoint);
        if (services.length > 0) {
          this.addServices(services, `alternative_api_${endpoint.split('/')[2]}`);
          this.stats.successful_extractions++;
        }
        
        await this.delay(2000);
        
      } catch (error) {
        this.stats.errors++;
        logger.debug({ endpoint, error: error.message }, 'Alternative API attempt failed');
      }
    }

    logger.info({ 
      endpoints_tried: this.alternativeEndpoints.length,
      total_services: this.allServices.length 
    }, 'Alternative API collection completed');
  }

  async tryAlternativeEndpoint(endpoint) {
    const searchTerms = ['youth services', 'community services', 'legal aid'];
    const services = [];

    for (const term of searchTerms) {
      try {
        const response = await axios.get(endpoint, {
          params: {
            q: term,
            query: term,
            search: term,
            category: 'community',
            location: 'Australia',
            limit: 50,
            rows: 50
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YouthServiceFinder/1.0)',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        if (response.data) {
          const extractedServices = this.extractFromGenericAPI(response.data, endpoint);
          services.push(...extractedServices);
        }
        
      } catch (error) {
        // Try POST method
        try {
          const postResponse = await axios.post(endpoint, {
            query: term,
            filters: { category: 'community' }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; YouthServiceFinder/1.0)'
            },
            timeout: 10000
          });
          
          if (postResponse.data) {
            const extractedServices = this.extractFromGenericAPI(postResponse.data, endpoint);
            services.push(...extractedServices);
          }
          
        } catch (postError) {
          // Continue to next term
        }
      }
    }

    return services;
  }

  async localCouncilDataScraping() {
    logger.info('🏛️ Phase 4: Local Council Data Scraping');
    
    const councilAPIs = [
      { name: 'Brisbane City Council', url: 'https://www.data.brisbane.qld.gov.au/api/3/action/package_search', state: 'QLD' },
      { name: 'City of Melbourne', url: 'https://data.melbourne.vic.gov.au/api/3/action/package_search', state: 'VIC' },
      { name: 'City of Sydney', url: 'https://opendata.cityofsydney.nsw.gov.au/api/3/action/package_search', state: 'NSW' },
      { name: 'City of Perth', url: 'https://data.gov.au/api/3/action/package_search', state: 'WA' },
      { name: 'City of Adelaide', url: 'https://data.sa.gov.au/api/3/action/package_search', state: 'SA' }
    ];

    for (const council of councilAPIs) {
      try {
        this.stats.total_attempts++;
        
        const services = await this.scrapeCouncilData(council);
        if (services.length > 0) {
          this.addServices(services, `council_${council.name.toLowerCase().replace(/\s+/g, '_')}`);
          this.stats.successful_extractions++;
        }
        
        await this.delay(3000);
        
      } catch (error) {
        this.stats.errors++;
        logger.debug({ council: council.name, error: error.message }, 'Council scraping failed');
      }
    }

    logger.info({ 
      councils_attempted: councilAPIs.length,
      total_services: this.allServices.length 
    }, 'Local council data scraping completed');
  }

  async scrapeCouncilData(council) {
    const services = [];
    
    for (const searchTerm of ['community services', 'youth', 'social services'].slice(0, 3)) {
      try {
        const response = await axios.get(council.url, {
          params: {
            q: searchTerm,
            rows: 50,
            fq: 'organization:' + council.name
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YouthServiceFinder/1.0)'
          },
          timeout: 15000
        });

        if (response.data?.success && response.data?.result?.results) {
          for (const dataset of response.data.result.results) {
            const extractedServices = await this.processCouncilDataset(dataset, council);
            services.push(...extractedServices);
          }
        }
        
      } catch (error) {
        logger.debug({ council: council.name, searchTerm, error: error.message }, 'Council search failed');
      }
    }

    return services;
  }

  async businessRegistryMining() {
    logger.info('📋 Phase 5: Business Registry Mining');
    
    // Extract services from Australian Business Registry
    const businessTypes = [
      'Youth Service',
      'Community Service',
      'Legal Aid',
      'Counselling Service',
      'Mental Health Service',
      'Family Service'
    ];

    for (const businessType of businessTypes) {
      try {
        this.stats.total_attempts++;
        
        // This would interface with ABR API if available
        const services = await this.searchBusinessRegistry(businessType);
        if (services.length > 0) {
          this.addServices(services, `business_registry_${businessType.toLowerCase().replace(/\s+/g, '_')}`);
          this.stats.successful_extractions++;
        }
        
        await this.delay(2000);
        
      } catch (error) {
        this.stats.errors++;
        logger.debug({ businessType, error: error.message }, 'Business registry search failed');
      }
    }

    logger.info({ total_services: this.allServices.length }, 'Business registry mining completed');
  }

  async searchBusinessRegistry(businessType) {
    // Placeholder for business registry search
    // In production, this would connect to ABR API or equivalent
    return [];
  }

  async webDirectoryScraping() {
    logger.info('🕸️ Phase 6: Web Directory Scraping');
    
    // Additional web directories and public listings
    const directories = [
      'https://www.yellowpages.com.au/search/listings',
      'https://www.whitepages.com.au/business-listing',
      'https://www.truelocal.com.au/find',
      'https://www.localsearch.com.au/search'
    ];

    for (const directory of directories) {
      try {
        this.stats.total_attempts++;
        
        const services = await this.scrapeWebDirectory(directory);
        if (services.length > 0) {
          this.addServices(services, `web_directory_${directory.split('/')[2]}`);
          this.stats.successful_extractions++;
        }
        
        await this.delay(5000); // Longer delay for web scraping
        
      } catch (error) {
        this.stats.errors++;
        logger.debug({ directory, error: error.message }, 'Web directory scraping failed');
      }
    }

    logger.info({ total_services: this.allServices.length }, 'Web directory scraping completed');
  }

  async scrapeWebDirectory(directory) {
    // Placeholder for web directory scraping
    // Would implement respectful web scraping with proper delays
    return [];
  }

  // Helper methods
  addServices(services, source) {
    if (!Array.isArray(services)) return;
    
    for (const service of services) {
      if (!service.data_source) {
        service.data_source = { source_name: source };
      }
      if (!service.metadata) {
        service.metadata = { created_at: new Date() };
      }
      
      // Validate service
      const validation = this.validator.validate(service);
      if (validation.valid) {
        this.allServices.push(service);
        this.stats.services_collected++;
      }
    }
    
    logger.info({ source, count: services.length, total: this.allServices.length }, 'Services added');
  }

  createServiceFromAskIzzy(rawService, location, category) {
    const name = rawService.name || rawService.organisation?.name;
    if (!name || name.length < 3) return null;

    return {
      id: uuidv4(),
      external_id: rawService.id || rawService.slug,
      name: name,
      description: rawService.short_description || rawService.description || `${name} - Community service`,
      url: rawService.web || rawService.website || null,
      status: 'active',
      categories: [category.replace(/-/g, '_')],
      keywords: ['community', 'support', category],
      service_types: [],
      target_demographics: ['youth'],
      age_range: { minimum: null, maximum: null, description: 'Youth services' },
      youth_specific: true,
      indigenous_specific: false,
      culturally_specific: [],
      disability_specific: false,
      lgbti_specific: false,
      organization: {
        id: uuidv4(),
        name: rawService.organisation?.name || name,
        type: 'community',
        abn: null,
        registration_type: null,
        parent_organization: null,
        website: rawService.web || null
      },
      location: {
        name: name,
        address_line_1: rawService.location?.street_address,
        address_line_2: null,
        suburb: rawService.location?.suburb,
        city: rawService.location?.suburb || location.name,
        state: DataNormalizer.normalizeState(location.state),
        postcode: DataNormalizer.normalizePostcode(rawService.location?.postcode),
        region: rawService.location?.suburb?.toLowerCase()?.replace(/\s+/g, '_'),
        lga: null,
        coordinates: {
          latitude: rawService.location?.point?.coordinates?.[1] || location.lat,
          longitude: rawService.location?.point?.coordinates?.[0] || location.lng,
          accuracy: 'suburb'
        },
        accessibility: {
          wheelchair_accessible: null,
          public_transport: null,
          parking_available: null
        }
      },
      contact: {
        phone: {
          primary: DataNormalizer.normalizePhoneNumber(rawService.phones?.[0]?.number),
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: rawService.emails?.[0]?.email,
          intake: null,
          admin: null
        },
        website: rawService.web || null,
        social_media: {},
        postal_address: null
      },
      service_details: {
        availability: {
          hours: null,
          after_hours: null,
          weekends: null,
          public_holidays: null,
          twenty_four_seven: null
        },
        cost: {
          free: null,
          fee_for_service: null,
          bulk_billing: null,
          sliding_scale: null,
          cost_description: null
        },
        eligibility: {
          age_requirements: null,
          geographic_restrictions: [location.state],
          referral_required: null,
          appointment_required: null,
          criteria: null
        },
        languages: [],
        capacity: {
          individual: null,
          group: null,
          family: null,
          maximum_clients: null
        }
      },
      funding: {
        government_funded: null,
        funding_sources: ['Unknown'],
        contract_type: null,
        funding_period: null
      },
      data_source: {
        source_name: 'Ask Izzy Alternative',
        source_type: 'api',
        source_url: 'https://askizzy.org.au',
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null,
        verification_status: 'unverified'
      },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Category: ${category}, Location: ${location.name}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null
      }
    };
  }

  extractFromGenericAPI(data, endpoint) {
    const services = [];
    
    // Try to extract from common API response formats
    const possibleArrays = [
      data.results, data.data, data.services, data.items, 
      data.objects, data.records, data.entries
    ];
    
    for (const array of possibleArrays) {
      if (Array.isArray(array)) {
        for (const item of array.slice(0, 10)) { // Limit extraction
          const service = this.createGenericService(item, endpoint);
          if (service) {
            services.push(service);
          }
        }
        break;
      }
    }
    
    return services;
  }

  createGenericService(item, endpoint) {
    const name = item.name || item.title || item.service_name || item.organisation_name;
    if (!name || name.length < 3) return null;

    return {
      id: uuidv4(),
      external_id: item.id || null,
      name: name,
      description: item.description || item.summary || `Service from ${endpoint}`,
      url: item.url || item.website || null,
      status: 'active',
      categories: ['community_service'],
      keywords: ['community', 'support'],
      service_types: [],
      target_demographics: ['general'],
      age_range: { minimum: null, maximum: null, description: 'All ages' },
      youth_specific: false,
      indigenous_specific: false,
      culturally_specific: [],
      disability_specific: false,
      lgbti_specific: false,
      organization: {
        id: uuidv4(),
        name: item.organization || name,
        type: 'unknown',
        abn: null,
        registration_type: null,
        parent_organization: null,
        website: item.website || null
      },
      location: {
        name: name,
        address_line_1: item.address || item.location,
        address_line_2: null,
        suburb: item.suburb || item.city,
        city: item.city || item.suburb,
        state: DataNormalizer.normalizeState(item.state),
        postcode: DataNormalizer.normalizePostcode(item.postcode),
        region: null,
        lga: null,
        coordinates: {
          latitude: item.latitude || item.lat,
          longitude: item.longitude || item.lng,
          accuracy: 'unknown'
        },
        accessibility: {
          wheelchair_accessible: null,
          public_transport: null,
          parking_available: null
        }
      },
      contact: {
        phone: {
          primary: DataNormalizer.normalizePhoneNumber(item.phone),
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: item.email,
          intake: null,
          admin: null
        },
        website: item.website || null,
        social_media: {},
        postal_address: null
      },
      service_details: {
        availability: {
          hours: null,
          after_hours: null,
          weekends: null,
          public_holidays: null,
          twenty_four_seven: null
        },
        cost: {
          free: null,
          fee_for_service: null,
          bulk_billing: null,
          sliding_scale: null,
          cost_description: null
        },
        eligibility: {
          age_requirements: null,
          geographic_restrictions: [],
          referral_required: null,
          appointment_required: null,
          criteria: null
        },
        languages: [],
        capacity: {
          individual: null,
          group: null,
          family: null,
          maximum_clients: null
        }
      },
      funding: {
        government_funded: null,
        funding_sources: ['Unknown'],
        contract_type: null,
        funding_period: null
      },
      data_source: {
        source_name: `Alternative API ${endpoint.split('/')[2]}`,
        source_type: 'api',
        source_url: endpoint,
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null,
        verification_status: 'unverified'
      },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Extracted from ${endpoint}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null
      }
    };
  }

  async processCouncilDataset(dataset, council) {
    const services = [];
    
    if (!dataset.resources || dataset.resources.length === 0) {
      return services;
    }

    for (const resource of dataset.resources.slice(0, 3)) { // Limit resources
      if (['CSV', 'JSON'].includes(resource.format?.toUpperCase())) {
        try {
          const response = await axios.get(resource.url, {
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024 // 10MB limit
          });

          let data;
          if (resource.format?.toUpperCase() === 'JSON') {
            data = response.data;
          } else if (resource.format?.toUpperCase() === 'CSV') {
            data = this.parseCSVData(response.data);
          }

          if (Array.isArray(data)) {
            for (const row of data.slice(0, 20)) {
              const service = this.createServiceFromCouncilData(row, council, dataset);
              if (service) {
                services.push(service);
              }
            }
          }
          
        } catch (error) {
          logger.debug({ resource: resource.url, error: error.message }, 'Failed to process council resource');
        }
      }
    }

    return services;
  }

  parseCSVData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < Math.min(lines.length, 50); i++) { // Limit rows
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  }

  createServiceFromCouncilData(row, council, dataset) {
    const nameFields = ['name', 'service_name', 'organisation_name', 'provider', 'title'];
    const name = this.findFieldValue(row, nameFields);
    
    if (!name || name.length < 3) return null;

    return {
      id: uuidv4(),
      external_id: row.id || null,
      name: name,
      description: dataset.notes || `Service from ${council.name}`,
      url: row.website || row.url || null,
      status: 'active',
      categories: ['community_service'],
      keywords: ['community', 'council', 'local'],
      service_types: [],
      target_demographics: ['general'],
      age_range: { minimum: null, maximum: null, description: 'All ages' },
      youth_specific: false,
      indigenous_specific: false,
      culturally_specific: [],
      disability_specific: false,
      lgbti_specific: false,
      organization: {
        id: uuidv4(),
        name: council.name,
        type: 'government',
        abn: null,
        registration_type: 'local_government',
        parent_organization: council.name,
        website: council.url
      },
      location: {
        name: name,
        address_line_1: this.findFieldValue(row, ['address', 'location', 'street_address']),
        address_line_2: null,
        suburb: this.findFieldValue(row, ['suburb', 'city', 'locality']),
        city: this.findFieldValue(row, ['suburb', 'city', 'locality']),
        state: DataNormalizer.normalizeState(council.state),
        postcode: DataNormalizer.normalizePostcode(this.findFieldValue(row, ['postcode', 'postal_code'])),
        region: null,
        lga: council.name,
        coordinates: {
          latitude: this.parseCoordinate(row.latitude || row.lat),
          longitude: this.parseCoordinate(row.longitude || row.lng),
          accuracy: 'suburb'
        },
        accessibility: {
          wheelchair_accessible: null,
          public_transport: null,
          parking_available: null
        }
      },
      contact: {
        phone: {
          primary: DataNormalizer.normalizePhoneNumber(this.findFieldValue(row, ['phone', 'telephone'])),
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: this.findFieldValue(row, ['email', 'contact_email']),
          intake: null,
          admin: null
        },
        website: row.website || row.url || null,
        social_media: {},
        postal_address: null
      },
      service_details: {
        availability: {
          hours: null,
          after_hours: null,
          weekends: null,
          public_holidays: null,
          twenty_four_seven: null
        },
        cost: {
          free: null,
          fee_for_service: null,
          bulk_billing: null,
          sliding_scale: null,
          cost_description: null
        },
        eligibility: {
          age_requirements: null,
          geographic_restrictions: [council.state],
          referral_required: null,
          appointment_required: null,
          criteria: null
        },
        languages: [],
        capacity: {
          individual: null,
          group: null,
          family: null,
          maximum_clients: null
        }
      },
      funding: {
        government_funded: true,
        funding_sources: ['Local Government'],
        contract_type: null,
        funding_period: null
      },
      data_source: {
        source_name: council.name,
        source_type: 'government_portal',
        source_url: council.url,
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null,
        verification_status: 'unverified'
      },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Council data from ${council.name}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null
      }
    };
  }

  findFieldValue(row, fieldNames) {
    for (const fieldName of fieldNames) {
      const value = row[fieldName] || row[fieldName.toLowerCase()] || row[fieldName.toUpperCase()];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  parseCoordinate(coord) {
    if (!coord) return null;
    const num = parseFloat(coord);
    return isNaN(num) ? null : num;
  }

  async exportComprehensiveResults() {
    logger.info('💾 Phase 7: Exporting Comprehensive Results');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export master JSON
    const masterData = {
      metadata: {
        title: 'Aggressive Australian Youth Services Collection',
        description: 'Maximum data extraction from all available public sources',
        total_services: this.allServices.length,
        generated_at: new Date().toISOString(),
        extraction_stats: this.stats,
        data_sources: this.getDataSourceBreakdown()
      },
      services: this.allServices
    };

    const jsonFilename = `AGGRESSIVE-Australian-Services-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(masterData, null, 2));
    
    // Export CSV
    this.exportCSV(`AGGRESSIVE-Australian-Services-${timestamp}.csv`);
    
    // Export by state
    this.exportByState(timestamp);
    
    logger.info({ 
      json_file: jsonFilename,
      total_services: this.allServices.length 
    }, 'Comprehensive results exported');
  }

  exportCSV(filename) {
    const headers = [
      'ID', 'Name', 'Description', 'Organization', 'Organization_Type',
      'Address', 'Suburb', 'City', 'State', 'Postcode',
      'Phone', 'Email', 'Website', 'Categories', 'Keywords',
      'Data_Source', 'Source_Type', 'Status'
    ];

    const rows = this.allServices.map(service => [
      service.id || '',
      `"${(service.name || '').replace(/"/g, '""')}"`,
      `"${(service.description || '').replace(/"/g, '""').substring(0, 200)}"`,
      `"${(service.organization?.name || '').replace(/"/g, '""')}"`,
      service.organization?.type || '',
      `"${(service.location?.address_line_1 || '').replace(/"/g, '""')}"`,
      service.location?.suburb || '',
      service.location?.city || '',
      service.location?.state || '',
      service.location?.postcode || '',
      service.contact?.phone?.primary || '',
      service.contact?.email?.primary || '',
      service.contact?.website || '',
      service.categories ? `"${service.categories.join(', ')}"` : '',
      service.keywords ? `"${service.keywords.join(', ')}"` : '',
      service.data_source?.source_name || '',
      service.data_source?.source_type || '',
      service.status || 'active'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    fs.writeFileSync(filename, csvContent);
  }

  exportByState(timestamp) {
    const byState = {};
    
    for (const service of this.allServices) {
      const state = service.location?.state || 'UNKNOWN';
      if (!byState[state]) byState[state] = [];
      byState[state].push(service);
    }

    for (const [state, services] of Object.entries(byState)) {
      const filename = `AGGRESSIVE-Services-${state}-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify({
        state: state,
        total_services: services.length,
        generated_at: new Date().toISOString(),
        services: services
      }, null, 2));
    }
  }

  getDataSourceBreakdown() {
    const sources = {};
    
    for (const service of this.allServices) {
      const sourceName = service.data_source?.source_name || 'unknown';
      sources[sourceName] = (sources[sourceName] || 0) + 1;
    }

    return sources;
  }

  generateFinalReport() {
    const endTime = Date.now();
    const processingTime = endTime - this.stats.start_time;
    
    return {
      success: true,
      execution_summary: {
        total_services_collected: this.allServices.length,
        total_attempts: this.stats.total_attempts,
        successful_extractions: this.stats.successful_extractions,
        success_rate: this.stats.total_attempts > 0 ? 
          Math.round((this.stats.successful_extractions / this.stats.total_attempts) * 100) : 0,
        data_sources_used: this.stats.data_sources_used,
        errors_encountered: this.stats.errors,
        processing_time_minutes: Math.round(processingTime / 60000)
      },
      data_breakdown: {
        by_source: this.getDataSourceBreakdown(),
        by_state: this.getStateBreakdown(),
        quality_stats: this.getQualityStats()
      },
      recommendations: this.generateRecommendations()
    };
  }

  getStateBreakdown() {
    const breakdown = {};
    
    for (const service of this.allServices) {
      const state = service.location?.state || 'UNKNOWN';
      breakdown[state] = (breakdown[state] || 0) + 1;
    }

    return breakdown;
  }

  getQualityStats() {
    let hasContact = 0;
    let hasLocation = 0;
    let hasWebsite = 0;
    
    for (const service of this.allServices) {
      if (service.contact?.phone?.primary || service.contact?.email?.primary) hasContact++;
      if (service.location?.address_line_1 || service.location?.suburb) hasLocation++;
      if (service.contact?.website) hasWebsite++;
    }
    
    const total = this.allServices.length;
    return {
      services_with_contact: hasContact,
      services_with_location: hasLocation,
      services_with_website: hasWebsite,
      contact_percentage: total > 0 ? Math.round((hasContact / total) * 100) : 0,
      location_percentage: total > 0 ? Math.round((hasLocation / total) * 100) : 0,
      website_percentage: total > 0 ? Math.round((hasWebsite / total) * 100) : 0
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.allServices.length < 500) {
      recommendations.push({
        priority: 'high',
        message: 'Consider implementing FOI requests and direct partnerships for additional data sources'
      });
    }
    
    if (this.stats.errors > this.stats.successful_extractions * 0.5) {
      recommendations.push({
        priority: 'medium',
        message: 'High error rate detected. Review API endpoints and implement better error handling'
      });
    }
    
    const qualityStats = this.getQualityStats();
    if (qualityStats.contact_percentage < 50) {
      recommendations.push({
        priority: 'medium',
        message: 'Low contact information completeness. Consider manual data enrichment'
      });
    }

    return recommendations;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute aggressive collection
async function main() {
  logger.info('🚀 AGGRESSIVE DATA COLLECTION STARTING');
  logger.info('🎯 Maximum extraction from all public sources without FOI/partnerships');
  
  try {
    const collector = new AggressiveDataCollector();
    const results = await collector.executeAggressiveCollection();
    
    logger.info('✅ AGGRESSIVE COLLECTION COMPLETE!');
    logger.info({
      total_services: results.execution_summary.total_services_collected,
      processing_time: results.execution_summary.processing_time_minutes,
      success_rate: results.execution_summary.success_rate,
      data_sources: Object.keys(results.data_breakdown.by_source).length
    }, 'FINAL RESULTS');

    logger.info('📊 Data Breakdown:');
    for (const [source, count] of Object.entries(results.data_breakdown.by_source)) {
      logger.info(`   ${source}: ${count} services`);
    }

    logger.info('🗺️ State Coverage:');
    for (const [state, count] of Object.entries(results.data_breakdown.by_state)) {
      logger.info(`   ${state}: ${count} services`);
    }

    if (results.recommendations.length > 0) {
      logger.info('💡 Recommendations:');
      results.recommendations.forEach(rec => {
        logger.info(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
      });
    }

    return results;

  } catch (error) {
    logger.error({ error: error.message }, 'Aggressive collection failed');
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(results => {
      console.log('\n🎉 Maximum data extraction completed!');
      console.log(`📊 Collected ${results.execution_summary.total_services_collected} services from ${Object.keys(results.data_breakdown.by_source).length} sources`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Collection failed:', error.message);
      process.exit(1);
    });
}

export default main;