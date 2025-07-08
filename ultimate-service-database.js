#!/usr/bin/env node

// ULTIMATE SERVICE DATABASE - Combine all our real services into one master file
import fs from 'fs';

class UltimateDatabase {
  constructor() {
    this.allServices = [];
    this.stats = {
      total: 0,
      bySource: {},
      byRegion: {},
      byCategory: {},
      youthSpecific: 0,
      indigenousSpecific: 0
    };
  }

  loadExistingServices() {
    console.log('📋 Loading existing real services...');
    
    try {
      const existing = JSON.parse(fs.readFileSync('queensland-youth-services.json', 'utf8'));
      this.allServices.push(...existing.services);
      console.log(`  ✅ Loaded ${existing.services.length} existing services`);
    } catch (error) {
      console.log('  ⚠️  No existing services file found');
    }
  }

  loadExpandedServices() {
    console.log('📋 Loading expanded services...');
    
    try {
      const expanded = JSON.parse(fs.readFileSync('expanded-services.json', 'utf8'));
      this.allServices.push(...expanded.services);
      console.log(`  ✅ Loaded ${expanded.services.length} expanded services`);
    } catch (error) {
      console.log('  ⚠️  No expanded services file found');
    }
  }

  loadMegaExpansion() {
    console.log('📋 Loading mega expansion services...');
    
    try {
      const mega = JSON.parse(fs.readFileSync('mega-expansion-services.json', 'utf8'));
      this.allServices.push(...mega.services);
      console.log(`  ✅ Loaded ${mega.services.length} mega expansion services`);
    } catch (error) {
      console.log('  ⚠️  No mega expansion file found');
    }
  }

  removeDuplicates() {
    console.log('🔧 Removing duplicates...');
    
    const seen = new Set();
    const unique = [];
    
    for (const service of this.allServices) {
      const key = `${service.name}-${service.location?.address || ''}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(service);
      }
    }
    
    console.log(`  🗑️  Removed ${this.allServices.length - unique.length} duplicates`);
    this.allServices = unique;
  }

  calculateStats() {
    console.log('📊 Calculating statistics...');
    
    this.stats.total = this.allServices.length;
    
    // By data source
    this.allServices.forEach(service => {
      const source = service.data_source || 'unknown';
      this.stats.bySource[source] = (this.stats.bySource[source] || 0) + 1;
      
      // By region
      const region = service.location?.region || 'unknown';
      this.stats.byRegion[region] = (this.stats.byRegion[region] || 0) + 1;
      
      // By categories
      if (service.categories) {
        service.categories.forEach(cat => {
          this.stats.byCategory[cat] = (this.stats.byCategory[cat] || 0) + 1;
        });
      }
      
      // Youth and Indigenous specific
      if (service.youth_specific) this.stats.youthSpecific++;
      if (service.indigenous_specific) this.stats.indigenousSpecific++;
    });
  }

  generateReport() {
    console.log('\n🎉 ULTIMATE QUEENSLAND YOUTH SERVICES DATABASE');
    console.log('='.repeat(50));
    console.log(`📈 TOTAL SERVICES: ${this.stats.total}`);
    console.log(`👥 Youth Specific: ${this.stats.youthSpecific}`);
    console.log(`🪃 Indigenous Specific: ${this.stats.indigenousSpecific}`);
    
    console.log('\n📊 BY DATA SOURCE:');
    Object.entries(this.stats.bySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count} services`);
      });
    
    console.log('\n🗺️  BY REGION (Top 10):');
    Object.entries(this.stats.byRegion)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count} services`);
      });
    
    console.log('\n📋 BY CATEGORY (Top 10):');
    Object.entries(this.stats.byCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} services`);
      });
  }

  exportMasterFiles() {
    console.log('\n💾 Exporting master files...');
    
    // Master JSON file
    const masterData = {
      metadata: {
        title: 'Queensland Youth Justice Services Database',
        description: 'Comprehensive database of youth services across Queensland, Australia',
        total_services: this.stats.total,
        generated_at: new Date().toISOString(),
        coverage: 'Statewide Queensland',
        age_range: '5-25 years',
        data_sources: Object.keys(this.stats.bySource).length,
        regions_covered: Object.keys(this.stats.byRegion).length
      },
      statistics: this.stats,
      services: this.allServices
    };
    
    fs.writeFileSync('MASTER-Queensland-Youth-Services.json', JSON.stringify(masterData, null, 2));
    console.log(`  ✅ Created MASTER-Queensland-Youth-Services.json (${this.stats.total} services)`);
    
    // Master CSV file
    const csvHeaders = [
      'ID', 'Name', 'Description', 'Organization', 'Organization_Type',
      'Address', 'City', 'Postcode', 'Region', 'Phone', 'Email',
      'Categories', 'Keywords', 'Min_Age', 'Max_Age', 'Youth_Specific',
      'Indigenous_Specific', 'Data_Source', 'Status'
    ];
    
    const csvRows = this.allServices.map(service => [
      service.id || '',
      `"${(service.name || '').replace(/"/g, '""')}"`,
      `"${(service.description || '').replace(/"/g, '""').substring(0, 200)}"`,
      `"${(service.organization?.name || '').replace(/"/g, '""')}"`,
      service.organization?.type || '',
      `"${(service.location?.address || '').replace(/"/g, '""')}"`,
      service.location?.city || '',
      service.location?.postcode || '',
      service.location?.region || '',
      service.contact?.phone || '',
      service.contact?.email || '',
      service.categories ? `"${service.categories.join(', ')}"` : '',
      service.keywords ? `"${service.keywords.join(', ')}"` : '',
      service.minimum_age || '',
      service.maximum_age || '',
      service.youth_specific || false,
      service.indigenous_specific || false,
      service.data_source || '',
      service.status || 'active'
    ]);
    
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    fs.writeFileSync('MASTER-Queensland-Youth-Services.csv', csvContent);
    console.log(`  ✅ Created MASTER-Queensland-Youth-Services.csv (${this.stats.total} services)`);
    
    // Quick reference by region
    const byRegion = {};
    this.allServices.forEach(service => {
      const region = service.location?.region || 'unknown';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push({
        name: service.name,
        address: service.location?.address,
        phone: service.contact?.phone,
        categories: service.categories
      });
    });
    
    fs.writeFileSync('Queensland-Services-By-Region.json', JSON.stringify(byRegion, null, 2));
    console.log(`  ✅ Created Queensland-Services-By-Region.json (${Object.keys(byRegion).length} regions)`);
    
    // Summary report
    const summary = {
      title: 'Queensland Youth Services Database Summary',
      generated: new Date().toISOString(),
      total_services: this.stats.total,
      coverage: {
        regions: Object.keys(this.stats.byRegion).length,
        data_sources: Object.keys(this.stats.bySource).length,
        service_categories: Object.keys(this.stats.byCategory).length
      },
      highlights: {
        largest_provider: Object.entries(this.stats.bySource).sort(([,a], [,b]) => b - a)[0],
        most_services_region: Object.entries(this.stats.byRegion).sort(([,a], [,b]) => b - a)[0],
        top_category: Object.entries(this.stats.byCategory).sort(([,a], [,b]) => b - a)[0],
        youth_specific_services: this.stats.youthSpecific,
        indigenous_specific_services: this.stats.indigenousSpecific
      },
      files_created: [
        'MASTER-Queensland-Youth-Services.json',
        'MASTER-Queensland-Youth-Services.csv',
        'Queensland-Services-By-Region.json'
      ]
    };
    
    fs.writeFileSync('Database-Summary.json', JSON.stringify(summary, null, 2));
    console.log(`  ✅ Created Database-Summary.json`);
  }

  run() {
    console.log('🚀 CREATING ULTIMATE QUEENSLAND YOUTH SERVICES DATABASE\n');
    
    this.loadExistingServices();
    this.loadExpandedServices();
    this.loadMegaExpansion();
    this.removeDuplicates();
    this.calculateStats();
    this.generateReport();
    this.exportMasterFiles();
    
    console.log('\n🔥 SUCCESS! You now have the most comprehensive Queensland youth services database!');
    console.log('\n📁 Files created:');
    console.log('  • MASTER-Queensland-Youth-Services.json (complete database)');
    console.log('  • MASTER-Queensland-Youth-Services.csv (spreadsheet format)');
    console.log('  • Queensland-Services-By-Region.json (organized by region)');
    console.log('  • Database-Summary.json (statistics and summary)');
    
    return this.allServices;
  }
}

const database = new UltimateDatabase();
database.run();