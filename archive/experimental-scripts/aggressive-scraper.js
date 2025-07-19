#!/usr/bin/env node

// AGGRESSIVE REAL-TIME WEB SCRAPING for maximum Queensland youth services
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from './src/config/database.js';
import { v4 as uuidv4 } from 'uuid';

class AggressiveScraper {
  constructor() {
    this.stats = { found: 0, processed: 0, errors: 0 };
    this.services = [];
  }

  async scrapeAskIzzy() {
    console.log('🕷️ SCRAPING Ask Izzy API - Real Live Data...');
    
    const locations = [
      { name: 'Brisbane', lat: -27.4678, lng: 153.0281 },
      { name: 'Gold Coast', lat: -28.0167, lng: 153.4000 },
      { name: 'Sunshine Coast', lat: -26.6500, lng: 153.0667 },
      { name: 'Townsville', lat: -19.2576, lng: 146.8178 },
      { name: 'Cairns', lat: -16.9186, lng: 145.7781 },
      { name: 'Toowoomba', lat: -27.5598, lng: 151.9507 }
    ];

    const categories = ['legal', 'mental-health', 'housing', 'support-and-counselling', 'education-and-training'];

    for (const location of locations) {
      for (const category of categories) {
        try {
          console.log(`  Searching ${category} in ${location.name}...`);
          
          const response = await axios.get('https://ask-izzy.org.au/api/v0/search', {
            params: {
              q: 'youth',
              category: category,
              location: `${location.lat},${location.lng}`,
              'minimum-should-match': 1,
              limit: 100
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
          });

          if (response.data && response.data.objects) {
            for (const service of response.data.objects) {
              this.services.push({
                id: uuidv4(),
                name: service.name,
                description: service.description || '',
                categories: [category],
                keywords: ['youth', category],
                organization: {
                  name: service.organisation?.name || 'Unknown',
                  type: 'community'
                },
                location: {
                  address: service.location?.street_address || '',
                  city: location.name,
                  state: 'QLD',
                  postcode: service.location?.postcode || '',
                  region: location.name.toLowerCase().replace(' ', '_'),
                  coordinates: {
                    lat: service.location?.point?.coordinates?.[1] || location.lat,
                    lng: service.location?.point?.coordinates?.[0] || location.lng
                  }
                },
                contact: {
                  phone: service.phones?.[0]?.number || null,
                  email: service.emails?.[0]?.email || null
                },
                data_source: 'ask_izzy_live',
                youth_specific: true,
                status: 'active'
              });
              this.stats.found++;
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.log(`    Error: ${error.message}`);
          this.stats.errors++;
        }
      }
    }
  }

  async scrapeServiceSeeker() {
    console.log('🕷️ SCRAPING Service Seeker - Real Live Data...');
    
    try {
      const response = await axios.get('https://api.serviceseeker.com.au/api/v2/search', {
        params: {
          'client-id': 'ask-izzy',
          'location': 'Queensland',
          'category': 'Youth Services',
          'limit': 500
        }
      });

      if (response.data && response.data.data) {
        response.data.data.forEach(service => {
          this.services.push({
            id: uuidv4(),
            name: service.name,
            description: service.description || '',
            categories: ['youth_services'],
            keywords: ['youth'],
            organization: {
              name: service.organisation_name || 'Unknown',
              type: 'community'
            },
            location: {
              address: service.address || '',
              city: service.suburb || '',
              state: 'QLD',
              postcode: service.postcode || '',
              region: service.suburb?.toLowerCase().replace(' ', '_') || '',
              coordinates: {
                lat: service.latitude,
                lng: service.longitude
              }
            },
            contact: {
              phone: service.phone,
              email: service.email
            },
            data_source: 'service_seeker_live',
            youth_specific: true,
            status: 'active'
          });
          this.stats.found++;
        });
      }
    } catch (error) {
      console.log(`Error scraping Service Seeker: ${error.message}`);
      this.stats.errors++;
    }
  }

  async scrapeGovernmentDirectories() {
    console.log('🕷️ SCRAPING Government Service Directories...');
    
    const urls = [
      'https://www.qld.gov.au/families/children/services',
      'https://www.health.qld.gov.au/services/mental-health/youth',
      'https://www.youthlaw.asn.au/find-help/',
      'https://www.legalaid.qld.gov.au/Find-legal-help'
    ];

    for (const url of urls) {
      try {
        console.log(`  Scraping ${url}...`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        
        // Look for service listings with addresses and phone numbers
        $('[class*="service"], [class*="location"], [class*="office"]').each((i, element) => {
          const $el = $(element);
          const name = $el.find('h2, h3, h4, .title').first().text().trim();
          const address = $el.find('[class*="address"], .address, .location').text().trim();
          const phone = $el.find('[class*="phone"], .phone').text().trim();
          const email = $el.find('[class*="email"], .email, a[href^="mailto:"]').attr('href')?.replace('mailto:', '');

          if (name && address) {
            this.services.push({
              id: uuidv4(),
              name: name,
              description: $el.find('p, .description').first().text().trim() || '',
              categories: ['government_service'],
              keywords: ['youth', 'government'],
              organization: {
                name: 'Queensland Government',
                type: 'government'
              },
              location: {
                address: address,
                city: 'Brisbane', // Default
                state: 'QLD',
                postcode: '',
                region: 'brisbane',
                coordinates: null
              },
              contact: {
                phone: phone || null,
                email: email || null
              },
              data_source: 'qld_gov_live',
              youth_specific: true,
              status: 'active'
            });
            this.stats.found++;
          }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`Error scraping ${url}: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  async scrapeOrganizationWebsites() {
    console.log('🕷️ SCRAPING Major Youth Organization Websites...');
    
    const organizations = [
      { name: 'Mission Australia', url: 'https://www.missionaustralia.com.au/what-we-do/services-directory' },
      { name: 'Salvation Army', url: 'https://www.salvationarmy.org.au/find-us/' },
      { name: 'Youth Off The Streets', url: 'https://youthoffthestreets.com.au/services/' },
      { name: 'Berry Street', url: 'https://www.berrystreet.org.au/what-we-do' },
      { name: 'UnitingCare', url: 'https://www.unitingcare.org.au/services' }
    ];

    for (const org of organizations) {
      try {
        console.log(`  Scraping ${org.name}...`);
        
        const response = await axios.get(org.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        
        // Look for Queensland services
        $('[class*="service"], [class*="program"], [class*="location"]').each((i, element) => {
          const $el = $(element);
          const text = $el.text();
          
          if (text.includes('QLD') || text.includes('Queensland') || text.includes('Brisbane') || text.includes('Gold Coast')) {
            const name = $el.find('h2, h3, h4, .title').first().text().trim();
            const description = $el.find('p, .description').first().text().trim();
            
            if (name) {
              this.services.push({
                id: uuidv4(),
                name: `${name} - ${org.name}`,
                description: description || '',
                categories: ['community_service'],
                keywords: ['youth', 'community'],
                organization: {
                  name: org.name,
                  type: 'non_profit'
                },
                location: {
                  address: '',
                  city: 'Queensland',
                  state: 'QLD',
                  postcode: '',
                  region: 'queensland',
                  coordinates: null
                },
                contact: {
                  phone: null,
                  email: null
                },
                data_source: 'org_website_live',
                youth_specific: true,
                status: 'active'
              });
              this.stats.found++;
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.log(`Error scraping ${org.name}: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  async run() {
    console.log('🚀 AGGRESSIVE SCRAPING - Getting MAXIMUM real data\n');
    
    await this.scrapeAskIzzy();
    await this.scrapeServiceSeeker();
    await this.scrapeGovernmentDirectories();
    await this.scrapeOrganizationWebsites();
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    
    for (const service of this.services) {
      const key = `${service.name}-${service.location.address}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(service);
        this.stats.processed++;
      }
    }
    
    console.log('\n📊 AGGRESSIVE SCRAPING RESULTS:');
    console.log(`  Total found: ${this.stats.found}`);
    console.log(`  Unique services: ${this.stats.processed}`);
    console.log(`  Errors: ${this.stats.errors}`);
    
    // Export to file
    const fs = await import('fs');
    fs.writeFileSync('aggressive-scraping-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.stats,
      services: unique
    }, null, 2));
    
    console.log('\n💾 Results saved to aggressive-scraping-results.json');
    console.log(`\n🎉 GOT ${this.stats.processed} REAL SERVICES from live scraping!`);
    
    return unique;
  }
}

const scraper = new AggressiveScraper();
scraper.run().catch(console.error);