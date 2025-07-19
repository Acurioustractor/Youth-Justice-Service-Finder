#!/usr/bin/env node

// Focused Data Collection - Working Public Sources Only
import { AustralianGovernmentPortalScraper } from './src/scrapers/australian-government-portals.js';
import { ServiceValidator } from './src/schemas/australian-service-schema.js';
import axios from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

console.log('🚀 FOCUSED DATA COLLECTION STARTING');
console.log('🎯 Targeting working public sources for maximum data extraction');

class FocusedDataCollector {
  constructor() {
    this.validator = new ServiceValidator();
    this.allServices = [];
    this.stats = {
      attempts: 0,
      successes: 0,
      services_collected: 0,
      sources_tried: 0,
      start_time: Date.now()
    };
  }

  async executeCollection() {
    console.log('\n📊 Phase 1: Enhanced Government Portals');
    await this.enhancedGovernmentPortals();
    
    console.log('\n🔍 Phase 2: Alternative Data Sources');
    await this.alternativeDataSources();
    
    console.log('\n🏛️ Phase 3: Local Council APIs');
    await this.localCouncilAPIs();
    
    console.log('\n💾 Phase 4: Export Results');
    await this.exportResults();
    
    return this.generateReport();
  }

  async enhancedGovernmentPortals() {
    const portals = [
      {
        name: 'Data.gov.au',
        url: 'https://data.gov.au/api/3/action/package_search',
        state: 'ALL'
      },
      {
        name: 'Data.NSW',
        url: 'https://data.nsw.gov.au/api/3/action/package_search',
        state: 'NSW'
      },
      {
        name: 'Data.VIC',
        url: 'https://www.data.vic.gov.au/api/3/action/package_search',
        state: 'VIC'
      },
      {
        name: 'Data.QLD',
        url: 'https://www.data.qld.gov.au/api/3/action/package_search',
        state: 'QLD'
      }
    ];

    const searchTerms = [
      'youth services', 'community services', 'social services', 
      'legal aid', 'mental health', 'family services'
    ];

    for (const portal of portals) {
      console.log(`   📍 Scraping ${portal.name}...`);
      
      for (const term of searchTerms) {
        try {
          this.stats.attempts++;
          this.stats.sources_tried++;
          
          const response = await axios.get(portal.url, {
            params: {
              q: term,
              rows: 50,
              facet: 'organization,tags',
              sort: 'score desc'
            },
            headers: {
              'User-Agent': 'YouthServiceFinder/1.0 (+https://github.com/Acurioustractor/Youth-Justice-Service-Finder)'
            },
            timeout: 15000
          });

          if (response.data?.success && response.data?.result?.results) {
            const datasets = response.data.result.results;
            console.log(`      ✓ Found ${datasets.length} datasets for "${term}"`);
            
            // Process first few datasets
            for (const dataset of datasets.slice(0, 5)) {
              const services = await this.processDataset(dataset, portal);
              this.addServices(services, `${portal.name}_${term.replace(/\s+/g, '_')}`);
            }
            
            this.stats.successes++;
          }

          await this.delay(2000); // Rate limiting

        } catch (error) {
          console.log(`      ❌ Failed ${term} on ${portal.name}: ${error.message}`);
        }
      }
      
      console.log(`   📊 ${portal.name}: ${this.allServices.length} total services`);
      await this.delay(3000);
    }
  }

  async processDataset(dataset, portal) {
    const services = [];
    
    if (!dataset.resources) return services;

    for (const resource of dataset.resources.slice(0, 2)) {
      if (!['CSV', 'JSON'].includes(resource.format?.toUpperCase())) continue;
      
      try {
        console.log(`        📁 Processing ${resource.format} resource...`);
        
        const response = await axios.get(resource.url, {
          timeout: 30000,
          maxContentLength: 5 * 1024 * 1024 // 5MB limit
        });

        let data;
        if (resource.format?.toUpperCase() === 'JSON') {
          data = response.data;
        } else {
          data = this.parseCSV(response.data);
        }

        if (Array.isArray(data)) {
          for (const row of data.slice(0, 20)) {
            const service = this.createServiceFromData(row, portal, dataset);
            if (service) services.push(service);
          }
        }

      } catch (error) {
        console.log(`        ❌ Resource failed: ${error.message}`);
      }
    }

    return services;
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < Math.min(lines.length, 50); i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length >= headers.length - 2) { // Allow some flexibility
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  }

  createServiceFromData(row, portal, dataset) {
    const nameFields = ['name', 'service_name', 'organisation_name', 'provider', 'title', 'business_name'];
    const name = this.findFieldValue(row, nameFields);
    
    if (!name || name.length < 3) return null;

    const addressFields = ['address', 'location', 'street_address', 'address_1'];
    const phoneFields = ['phone', 'telephone', 'contact_phone', 'phone_number'];
    const emailFields = ['email', 'contact_email', 'email_address'];
    const suburbFields = ['suburb', 'city', 'locality', 'town'];
    const postcodeFields = ['postcode', 'postal_code', 'zip'];

    return {
      id: uuidv4(),
      external_id: row.id || row.service_id || null,
      name: name,
      description: dataset.notes || `Service from ${portal.name}`,
      url: row.website || row.url || null,
      status: 'active',
      categories: ['community_service'],
      keywords: ['community', 'support'],
      service_types: [],
      target_demographics: ['general'],
      age_range: { minimum: null, maximum: null, description: 'All ages' },
      youth_specific: this.isYouthSpecific(name, dataset.title || ''),
      indigenous_specific: this.isIndigenousSpecific(name, dataset.title || ''),
      culturally_specific: [],
      disability_specific: false,
      lgbti_specific: false,
      organization: {
        id: uuidv4(),
        name: this.findFieldValue(row, ['organisation_name', 'provider', 'business_name']) || name,
        type: 'government',
        abn: row.abn || null,
        registration_type: null,
        parent_organization: portal.name,
        website: row.website || null
      },
      location: {
        name: name,
        address_line_1: this.findFieldValue(row, addressFields),
        address_line_2: null,
        suburb: this.findFieldValue(row, suburbFields),
        city: this.findFieldValue(row, suburbFields),
        state: portal.state,
        postcode: this.findFieldValue(row, postcodeFields),
        region: null,
        lga: null,
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
          primary: this.findFieldValue(row, phoneFields),
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: this.findFieldValue(row, emailFields),
          intake: null,
          admin: null
        },
        website: row.website || row.url || null,
        social_media: {},
        postal_address: null
      },
      service_details: {
        availability: {
          hours: row.hours || row.opening_hours || null,
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
          cost_description: row.cost || null
        },
        eligibility: {
          age_requirements: null,
          geographic_restrictions: [portal.state],
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
        funding_sources: ['Government'],
        contract_type: null,
        funding_period: null
      },
      data_source: {
        source_name: portal.name,
        source_type: 'government_portal',
        source_url: portal.url,
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null,
        verification_status: 'unverified'
      },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Extracted from ${dataset.title || 'dataset'}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null
      }
    };
  }

  async alternativeDataSources() {
    // Try alternative public APIs
    const sources = [
      {
        name: 'Find & Connect',
        url: 'https://www.findandconnect.gov.au/ref/wa/organisations.json',
        type: 'json_direct'
      },
      {
        name: 'Australian Charities Register',
        url: 'https://data.gov.au/api/3/action/datastore_search',
        params: { resource_id: 'b050b242-4487-4306-abf5-07ca073e5594', limit: 100 },
        type: 'ckan_api'
      }
    ];

    for (const source of sources) {
      console.log(`   🔍 Trying ${source.name}...`);
      
      try {
        this.stats.attempts++;
        this.stats.sources_tried++;

        let response;
        if (source.type === 'json_direct') {
          response = await axios.get(source.url, { timeout: 15000 });
        } else if (source.type === 'ckan_api') {
          response = await axios.get(source.url, { 
            params: source.params,
            timeout: 15000 
          });
        }

        if (response?.data) {
          const services = this.extractFromAlternativeSource(response.data, source);
          this.addServices(services, source.name);
          console.log(`      ✓ Extracted ${services.length} services`);
          this.stats.successes++;
        }

        await this.delay(3000);

      } catch (error) {
        console.log(`      ❌ ${source.name} failed: ${error.message}`);
      }
    }
  }

  extractFromAlternativeSource(data, source) {
    const services = [];
    let items = [];

    // Extract items from different response formats
    if (data.result?.records) items = data.result.records;
    else if (data.records) items = data.records;
    else if (Array.isArray(data)) items = data;
    else if (data.results) items = data.results;

    for (const item of items.slice(0, 50)) {
      const service = this.createGenericService(item, source);
      if (service) services.push(service);
    }

    return services;
  }

  createGenericService(item, source) {
    const name = item.name || item.organisation_name || item.charity_name || item.entity_name;
    if (!name || name.length < 3) return null;

    return {
      id: uuidv4(),
      external_id: item.id || item.abn || null,
      name: name,
      description: item.description || item.purpose || `Service from ${source.name}`,
      url: item.website || item.web_site || null,
      status: 'active',
      categories: ['community_service'],
      keywords: ['community'],
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
        name: name,
        type: 'non_profit',
        abn: item.abn || null,
        registration_type: item.charity_type || null,
        parent_organization: null,
        website: item.website || item.web_site || null
      },
      location: {
        name: name,
        address_line_1: item.address || item.street_address,
        address_line_2: null,
        suburb: item.suburb || item.locality,
        city: item.city || item.suburb,
        state: item.state || 'UNKNOWN',
        postcode: item.postcode || item.postal_code,
        region: null,
        lga: null,
        coordinates: {
          latitude: this.parseCoordinate(item.latitude),
          longitude: this.parseCoordinate(item.longitude),
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
          primary: item.phone || item.telephone,
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: item.email,
          intake: null,
          admin: null
        },
        website: item.website || item.web_site || null,
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
        source_name: source.name,
        source_type: 'api',
        source_url: source.url,
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null,
        verification_status: 'unverified'
      },
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Extracted from ${source.name}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null
      }
    };
  }

  async localCouncilAPIs() {
    const councils = [
      { name: 'Brisbane', url: 'https://www.data.brisbane.qld.gov.au/api/3/action/package_search', state: 'QLD' },
      { name: 'Melbourne', url: 'https://data.melbourne.vic.gov.au/api/3/action/package_search', state: 'VIC' },
      { name: 'Sydney', url: 'https://opendata.cityofsydney.nsw.gov.au/api/3/action/package_search', state: 'NSW' }
    ];

    for (const council of councils) {
      console.log(`   🏛️ Checking ${council.name} Council...`);
      
      try {
        this.stats.attempts++;
        this.stats.sources_tried++;

        const response = await axios.get(council.url, {
          params: {
            q: 'community services',
            rows: 20
          },
          timeout: 15000
        });

        if (response.data?.success && response.data?.result?.results) {
          const datasets = response.data.result.results;
          console.log(`      ✓ Found ${datasets.length} council datasets`);
          
          for (const dataset of datasets.slice(0, 3)) {
            const services = await this.processDataset(dataset, {
              name: `${council.name} Council`,
              state: council.state,
              url: council.url
            });
            this.addServices(services, `${council.name}_Council`);
          }
          
          this.stats.successes++;
        }

        await this.delay(3000);

      } catch (error) {
        console.log(`      ❌ ${council.name} failed: ${error.message}`);
      }
    }
  }

  addServices(services, source) {
    if (!Array.isArray(services)) return;
    
    let validCount = 0;
    for (const service of services) {
      const validation = this.validator.validate(service);
      if (validation.valid) {
        this.allServices.push(service);
        validCount++;
        this.stats.services_collected++;
      }
    }
    
    if (validCount > 0) {
      console.log(`      ✅ Added ${validCount} valid services from ${source}`);
    }
  }

  async exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Master JSON export
    const masterData = {
      metadata: {
        title: 'Focused Australian Youth Services Collection',
        total_services: this.allServices.length,
        generated_at: new Date().toISOString(),
        extraction_stats: this.stats,
        data_sources: this.getSourceBreakdown()
      },
      services: this.allServices
    };

    const jsonFilename = `FOCUSED-Australian-Services-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(masterData, null, 2));
    console.log(`   💾 Exported: ${jsonFilename}`);
    
    // CSV export
    const csvFilename = `FOCUSED-Australian-Services-${timestamp}.csv`;
    this.exportCSV(csvFilename);
    console.log(`   💾 Exported: ${csvFilename}`);
    
    // State breakdown
    this.exportByState(timestamp);
  }

  exportCSV(filename) {
    const headers = [
      'ID', 'Name', 'Description', 'Organization', 'Address', 'Suburb', 'State', 'Postcode',
      'Phone', 'Email', 'Website', 'Youth_Specific', 'Data_Source', 'Status'
    ];

    const rows = this.allServices.map(service => [
      service.id,
      `"${service.name.replace(/"/g, '""')}"`,
      `"${(service.description || '').replace(/"/g, '""').substring(0, 200)}"`,
      `"${service.organization.name.replace(/"/g, '""')}"`,
      `"${(service.location.address_line_1 || '').replace(/"/g, '""')}"`,
      service.location.suburb || '',
      service.location.state || '',
      service.location.postcode || '',
      service.contact.phone.primary || '',
      service.contact.email.primary || '',
      service.contact.website || '',
      service.youth_specific,
      service.data_source.source_name,
      service.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    fs.writeFileSync(filename, csvContent);
  }

  exportByState(timestamp) {
    const byState = {};
    
    for (const service of this.allServices) {
      const state = service.location.state || 'UNKNOWN';
      if (!byState[state]) byState[state] = [];
      byState[state].push(service);
    }

    for (const [state, services] of Object.entries(byState)) {
      const filename = `FOCUSED-Services-${state}-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify({
        state,
        total_services: services.length,
        generated_at: new Date().toISOString(),
        services
      }, null, 2));
      console.log(`   📍 ${state}: ${services.length} services exported`);
    }
  }

  getSourceBreakdown() {
    const sources = {};
    for (const service of this.allServices) {
      const source = service.data_source.source_name;
      sources[source] = (sources[source] || 0) + 1;
    }
    return sources;
  }

  generateReport() {
    const processingTime = Date.now() - this.stats.start_time;
    
    return {
      success: true,
      total_services_collected: this.allServices.length,
      processing_time_minutes: Math.round(processingTime / 60000),
      sources_attempted: this.stats.sources_tried,
      successful_sources: this.stats.successes,
      success_rate: this.stats.sources_tried > 0 ? 
        Math.round((this.stats.successes / this.stats.sources_tried) * 100) : 0,
      source_breakdown: this.getSourceBreakdown(),
      state_breakdown: this.getStateBreakdown()
    };
  }

  getStateBreakdown() {
    const breakdown = {};
    for (const service of this.allServices) {
      const state = service.location.state || 'UNKNOWN';
      breakdown[state] = (breakdown[state] || 0) + 1;
    }
    return breakdown;
  }

  // Helper methods
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

  isYouthSpecific(name, title) {
    const text = `${name} ${title}`.toLowerCase();
    return text.includes('youth') || text.includes('young people') || text.includes('adolescent');
  }

  isIndigenousSpecific(name, title) {
    const text = `${name} ${title}`.toLowerCase();
    return text.includes('indigenous') || text.includes('aboriginal') || text.includes('torres strait');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute collection
async function main() {
  try {
    const collector = new FocusedDataCollector();
    const results = await collector.executeCollection();
    
    console.log('\n🎉 FOCUSED COLLECTION COMPLETE!');
    console.log(`📊 Total Services: ${results.total_services_collected}`);
    console.log(`⏱️  Processing Time: ${results.processing_time_minutes} minutes`);
    console.log(`✅ Success Rate: ${results.success_rate}%`);
    
    console.log('\n📈 Source Breakdown:');
    for (const [source, count] of Object.entries(results.source_breakdown)) {
      console.log(`   ${source}: ${count} services`);
    }
    
    console.log('\n🗺️ State Coverage:');
    for (const [state, count] of Object.entries(results.state_breakdown)) {
      console.log(`   ${state}: ${count} services`);
    }

    return results;

  } catch (error) {
    console.error('❌ Collection failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(results => {
      console.log(`\n🚀 Ready for database import with ${results.total_services_collected} services!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    });
}

export default main;