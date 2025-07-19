#!/usr/bin/env node

// Smart Merge: QLD Services CSV + Comprehensive Dataset
// Prevents duplicates and maintains data quality
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ServiceValidator, DataNormalizer } from './src/schemas/australian-service-schema.js';

console.log('🔄 SMART MERGE: QLD Services + Comprehensive Dataset');
console.log('🎯 Goal: Combine existing QLD scraped data with generated dataset');

class QLDServiceMerger {
  constructor() {
    this.validator = new ServiceValidator();
    this.existingServices = [];
    this.qldServices = [];
    this.mergedServices = [];
    this.duplicatesFound = [];
    this.stats = {
      qld_services_loaded: 0,
      existing_services_loaded: 0,
      duplicates_detected: 0,
      new_services_added: 0,
      total_merged: 0
    };
  }

  async executeMerge() {
    console.log('\n📊 Step 1: Loading existing comprehensive dataset...');
    await this.loadExistingDataset();
    
    console.log('\n📋 Step 2: Loading QLD services from CSV...');
    await this.loadQLDServices();
    
    console.log('\n🔍 Step 3: Detecting and handling duplicates...');
    await this.detectAndHandleDuplicates();
    
    console.log('\n🔗 Step 4: Merging datasets...');
    await this.mergeDatasets();
    
    console.log('\n💾 Step 5: Exporting merged dataset...');
    await this.exportMergedDataset();
    
    return this.generateMergeReport();
  }

  async loadExistingDataset() {
    // Find the latest comprehensive dataset
    const files = fs.readdirSync('.').filter(f => 
      f.includes('COMPREHENSIVE-Australian-Services') && f.endsWith('.json')
    );
    
    if (files.length === 0) {
      console.log('   ⚠️  No existing comprehensive dataset found');
      return;
    }
    
    // Use the most recent file
    const latestFile = files.sort().pop();
    console.log(`   📁 Loading: ${latestFile}`);
    
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    this.existingServices = data.services || [];
    this.stats.existing_services_loaded = this.existingServices.length;
    
    console.log(`   ✅ Loaded ${this.existingServices.length} existing services`);
  }

  async loadQLDServices() {
    const csvPath = 'Services Qld-Grid view.csv';
    
    if (!fs.existsSync(csvPath)) {
      throw new Error('QLD services CSV file not found');
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Remove BOM and get headers
    const headers = lines[0].replace(/^\uFEFF/, '').split(',');
    console.log(`   📋 Headers: ${headers.join(', ')}`);
    
    // Process each service
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length - 1) { // Allow some flexibility
        const service = this.convertQLDServiceToStandard(headers, values, i);
        if (service) {
          this.qldServices.push(service);
        }
      }
    }
    
    this.stats.qld_services_loaded = this.qldServices.length;
    console.log(`   ✅ Loaded ${this.qldServices.length} QLD services from CSV`);
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  convertQLDServiceToStandard(headers, values, rowIndex) {
    try {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header.trim()] = values[index] ? values[index].trim() : '';
      });

      const orgName = rowData['Organisation Name'] || rowData['﻿Organisation Name'] || '';
      const orgType = rowData['Organisation Type'] || '';
      const primaryFocus = rowData['Primary Focus'] || '';
      const serviceArea = rowData['Service Area'] || '';
      const targetAge = rowData['Target Age Group'] || '';
      const keyServices = rowData['Key Services'] || '';

      if (!orgName || orgName.length < 3) {
        return null;
      }

      // Extract location information from Service Area
      const location = this.parseServiceArea(serviceArea);
      
      // Determine if youth-specific
      const youthSpecific = this.isYouthSpecific(orgName, primaryFocus, targetAge, keyServices);
      
      // Determine if indigenous-specific
      const indigenousSpecific = this.isIndigenousSpecific(orgName, primaryFocus, keyServices);
      
      // Map organization type
      const normalizedOrgType = this.normalizeOrganizationType(orgType);
      
      // Generate categories from primary focus and key services
      const categories = this.generateCategories(primaryFocus, keyServices);
      
      // Generate age range from target age group
      const ageRange = this.parseAgeRange(targetAge, youthSpecific);

      return {
        id: uuidv4(),
        external_id: `QLD-ROW-${rowIndex}`,
        name: orgName,
        description: this.generateDescription(orgName, primaryFocus, keyServices, serviceArea),
        url: null,
        status: 'active',
        
        categories: categories,
        keywords: this.generateKeywords(orgName, primaryFocus, keyServices),
        service_types: this.generateServiceTypes(primaryFocus, keyServices),
        target_demographics: youthSpecific ? ['youth'] : ['general'],
        
        age_range: ageRange,
        
        youth_specific: youthSpecific,
        indigenous_specific: indigenousSpecific,
        culturally_specific: indigenousSpecific ? ['indigenous'] : [],
        disability_specific: this.isDisabilitySpecific(orgName, primaryFocus, keyServices),
        lgbti_specific: this.isLGBTISpecific(orgName, primaryFocus, keyServices),
        
        organization: {
          id: uuidv4(),
          name: orgName,
          type: normalizedOrgType,
          abn: null,
          registration_type: this.inferRegistrationType(normalizedOrgType),
          parent_organization: null,
          website: null
        },
        
        location: {
          name: orgName,
          address_line_1: null,
          address_line_2: null,
          suburb: location.suburb,
          city: location.city,
          state: 'QLD',
          postcode: location.postcode,
          region: this.normalizeRegion(location.area),
          lga: null,
          coordinates: {
            latitude: location.coordinates?.lat || null,
            longitude: location.coordinates?.lng || null,
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
            primary: null,
            mobile: null,
            toll_free: null,
            crisis_line: null
          },
          email: {
            primary: null,
            intake: null,
            admin: null
          },
          website: null,
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
            free: normalizedOrgType === 'government' || normalizedOrgType === 'non_profit',
            fee_for_service: null,
            bulk_billing: null,
            sliding_scale: null,
            cost_description: null
          },
          eligibility: {
            age_requirements: targetAge,
            geographic_restrictions: ['QLD'],
            referral_required: null,
            appointment_required: null,
            criteria: this.extractEligibilityCriteria(targetAge, primaryFocus)
          },
          languages: ['English'],
          capacity: {
            individual: true,
            group: null,
            family: null,
            maximum_clients: null
          }
        },
        
        funding: {
          government_funded: ['government', 'non_profit'].includes(normalizedOrgType),
          funding_sources: this.inferFundingSources(normalizedOrgType),
          contract_type: null,
          funding_period: null
        },
        
        data_source: {
          source_name: 'QLD Scraped Services',
          source_type: 'csv_import',
          source_url: 'Services Qld-Grid view.csv',
          extraction_method: 'manual_scraping',
          last_verified: new Date(),
          data_quality_score: this.calculateQLDDataQuality(rowData),
          verification_status: 'verified'
        },
        
        metadata: {
          created_at: new Date(),
          updated_at: new Date(),
          last_scraped: new Date(),
          scraping_notes: `Imported from QLD scraped services CSV, row ${rowIndex}`,
          duplicate_check: {
            potential_duplicates: [],
            similarity_score: 0
          },
          data_completeness: this.calculateQLDCompleteness(rowData)
        }
      };

    } catch (error) {
      console.log(`   ❌ Error processing row ${rowIndex}: ${error.message}`);
      return null;
    }
  }

  parseServiceArea(serviceArea) {
    const location = {
      suburb: null,
      city: null,
      postcode: null,
      area: serviceArea,
      coordinates: null
    };

    if (!serviceArea) return location;

    // Queensland location mapping
    const qldLocations = {
      'Queensland': { city: 'Brisbane', suburb: 'Brisbane City', lat: -27.4698, lng: 153.0251 },
      'Statewide': { city: 'Brisbane', suburb: 'Brisbane City', lat: -27.4698, lng: 153.0251 },
      'Brisbane': { city: 'Brisbane', suburb: 'Brisbane City', lat: -27.4698, lng: 153.0251 },
      'Gold Coast': { city: 'Gold Coast', suburb: 'Surfers Paradise', lat: -28.0167, lng: 153.4000 },
      'Cairns': { city: 'Cairns', suburb: 'Cairns City', lat: -16.9186, lng: 145.7781 },
      'Townsville': { city: 'Townsville', suburb: 'Townsville City', lat: -19.2590, lng: 146.8169 },
      'Toowoomba': { city: 'Toowoomba', suburb: 'Toowoomba City', lat: -27.5598, lng: 151.9507 },
      'Rockhampton': { city: 'Rockhampton', suburb: 'Rockhampton City', lat: -23.3818, lng: 150.5100 },
      'Bundaberg': { city: 'Bundaberg', suburb: 'Bundaberg Central', lat: -24.8661, lng: 152.3489 },
      'Mount Isa': { city: 'Mount Isa', suburb: 'Mount Isa City', lat: -20.7256, lng: 139.4927 },
      'Mackay': { city: 'Mackay', suburb: 'Mackay City', lat: -21.1411, lng: 149.1860 },
      'Central Queensland': { city: 'Rockhampton', suburb: 'Rockhampton City', lat: -23.3818, lng: 150.5100 },
      'South-East Queensland': { city: 'Brisbane', suburb: 'Brisbane City', lat: -27.4698, lng: 153.0251 },
      'Far North Queensland': { city: 'Cairns', suburb: 'Cairns City', lat: -16.9186, lng: 145.7781 },
      'Multiple locations': { city: 'Brisbane', suburb: 'Brisbane City', lat: -27.4698, lng: 153.0251 }
    };

    // Try exact match first
    const exactMatch = qldLocations[serviceArea];
    if (exactMatch) {
      location.city = exactMatch.city;
      location.suburb = exactMatch.suburb;
      location.coordinates = { lat: exactMatch.lat, lng: exactMatch.lng };
      return location;
    }

    // Try partial matches
    for (const [key, value] of Object.entries(qldLocations)) {
      if (serviceArea.toLowerCase().includes(key.toLowerCase())) {
        location.city = value.city;
        location.suburb = value.suburb;
        location.coordinates = { lat: value.lat, lng: value.lng };
        return location;
      }
    }

    // Default to Brisbane for unknown QLD locations
    location.city = 'Brisbane';
    location.suburb = serviceArea;
    location.coordinates = { lat: -27.4698, lng: 153.0251 };
    
    return location;
  }

  isYouthSpecific(orgName, primaryFocus, targetAge, keyServices) {
    const text = `${orgName} ${primaryFocus} ${targetAge} ${keyServices}`.toLowerCase();
    
    const youthIndicators = [
      'youth', 'young people', 'adolescent', 'teenager', 'teen',
      'under 25', 'under 30', 'juvenile', 'school', 'student'
    ];
    
    return youthIndicators.some(indicator => text.includes(indicator));
  }

  isIndigenousSpecific(orgName, primaryFocus, keyServices) {
    const text = `${orgName} ${primaryFocus} ${keyServices}`.toLowerCase();
    
    const indigenousIndicators = [
      'aboriginal', 'torres strait', 'indigenous', 'first nations',
      'atsi', 'cultural healing', 'cultural mentoring'
    ];
    
    return indigenousIndicators.some(indicator => text.includes(indicator));
  }

  normalizeOrganizationType(orgType) {
    const type = orgType.toLowerCase();
    
    if (type.includes('government') || type.includes('dept')) return 'government';
    if (type.includes('non-government') || type.includes('ngo')) return 'non_profit';
    if (type.includes('community')) return 'community';
    if (type.includes('cultural') || type.includes('indigenous')) return 'indigenous';
    if (type.includes('health')) return 'hospital';
    if (type.includes('workplace') || type.includes('training')) return 'commercial';
    if (type.includes('peak body')) return 'non_profit';
    if (type.includes('behavioral') || type.includes('support')) return 'non_profit';
    
    return 'community';
  }

  generateCategories(primaryFocus, keyServices) {
    const categories = [];
    const text = `${primaryFocus} ${keyServices}`.toLowerCase();
    
    const categoryMap = {
      'legal': ['legal_aid', 'court_support'],
      'health': ['health_services', 'medical'],
      'mental health': ['mental_health', 'counselling'],
      'education': ['education_support', 'training'],
      'employment': ['employment', 'job_placement'],
      'housing': ['housing', 'accommodation'],
      'family': ['family_support', 'parenting'],
      'youth development': ['youth_development', 'mentoring'],
      'indigenous': ['indigenous_services', 'cultural_support'],
      'crisis': ['crisis_support', 'emergency_relief'],
      'reoffending': ['court_support', 'legal_aid'],
      'protection': ['family_support', 'crisis_support'],
      'mentoring': ['mentoring', 'youth_development'],
      'cultural': ['cultural_support', 'indigenous_services']
    };
    
    for (const [keyword, cats] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) {
        categories.push(...cats);
      }
    }
    
    return categories.length > 0 ? [...new Set(categories)] : ['community_service'];
  }

  generateServiceTypes(primaryFocus, keyServices) {
    const types = [];
    const text = `${primaryFocus} ${keyServices}`.toLowerCase();
    
    if (text.includes('mentoring')) types.push('mentoring');
    if (text.includes('counselling') || text.includes('therapy')) types.push('counselling');
    if (text.includes('training')) types.push('training_programs');
    if (text.includes('support')) types.push('support_services');
    if (text.includes('court')) types.push('court_support');
    if (text.includes('program')) types.push('group_programs');
    
    return types;
  }

  generateKeywords(orgName, primaryFocus, keyServices) {
    const keywords = ['qld', 'queensland', 'community'];
    const text = `${orgName} ${primaryFocus} ${keyServices}`.toLowerCase();
    
    const keywordPatterns = [
      'youth', 'indigenous', 'health', 'education', 'employment',
      'family', 'support', 'mentoring', 'training', 'cultural'
    ];
    
    for (const pattern of keywordPatterns) {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    }
    
    return [...new Set(keywords)];
  }

  parseAgeRange(targetAge, youthSpecific) {
    if (!targetAge) {
      return youthSpecific ? 
        { minimum: 12, maximum: 25, description: 'Youth services' } :
        { minimum: null, maximum: null, description: 'All ages' };
    }
    
    // Look for age patterns
    const ageMatch = targetAge.match(/(\d+)[^\d]*(\d+)/);
    if (ageMatch) {
      return {
        minimum: parseInt(ageMatch[1]),
        maximum: parseInt(ageMatch[2]),
        description: targetAge
      };
    }
    
    // Single age patterns
    const singleAgeMatch = targetAge.match(/(\d+)/);
    if (singleAgeMatch) {
      const age = parseInt(singleAgeMatch[1]);
      return {
        minimum: 0,
        maximum: age,
        description: targetAge
      };
    }
    
    // Special cases
    if (targetAge.toLowerCase().includes('youth')) {
      return { minimum: 12, maximum: 25, description: 'Youth services' };
    }
    
    return { minimum: null, maximum: null, description: targetAge };
  }

  generateDescription(orgName, primaryFocus, keyServices, serviceArea) {
    return `${orgName} provides ${primaryFocus.toLowerCase()} services in ${serviceArea}. Key services include: ${keyServices}.`;
  }

  isDisabilitySpecific(orgName, primaryFocus, keyServices) {
    const text = `${orgName} ${primaryFocus} ${keyServices}`.toLowerCase();
    return text.includes('disability') || text.includes('special needs');
  }

  isLGBTISpecific(orgName, primaryFocus, keyServices) {
    const text = `${orgName} ${primaryFocus} ${keyServices}`.toLowerCase();
    return text.includes('lgbti') || text.includes('rainbow') || text.includes('sexuality');
  }

  inferRegistrationType(orgType) {
    const typeMap = {
      'government': 'government_entity',
      'non_profit': 'incorporated_association',
      'community': 'community_group',
      'indigenous': 'aboriginal_corporation',
      'hospital': 'health_service',
      'commercial': 'proprietary_limited'
    };
    return typeMap[orgType] || 'other';
  }

  normalizeRegion(area) {
    if (!area) return null;
    return area.toLowerCase().replace(/\s+/g, '_');
  }

  inferFundingSources(orgType) {
    if (orgType === 'government') return ['Government'];
    if (orgType === 'non_profit') return ['Government', 'Private'];
    return ['Unknown'];
  }

  extractEligibilityCriteria(targetAge, primaryFocus) {
    if (targetAge && primaryFocus) {
      return `${targetAge} - ${primaryFocus}`;
    }
    return targetAge || primaryFocus || null;
  }

  calculateQLDDataQuality(rowData) {
    let score = 0.5; // Base score
    
    if (rowData['Organisation Name']) score += 0.2;
    if (rowData['Organisation Type']) score += 0.1;
    if (rowData['Primary Focus']) score += 0.1;
    if (rowData['Service Area']) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  calculateQLDCompleteness(rowData) {
    return {
      contact_info: 0.1, // No contact info in CSV
      location_info: rowData['Service Area'] ? 0.6 : 0.3,
      service_details: rowData['Key Services'] ? 0.7 : 0.4,
      overall: 0.5
    };
  }

  async detectAndHandleDuplicates() {
    console.log('   🔍 Checking for duplicates between QLD and existing services...');
    
    for (const qldService of this.qldServices) {
      const duplicates = this.findPotentialDuplicates(qldService, this.existingServices);
      
      if (duplicates.length > 0) {
        this.duplicatesFound.push({
          qld_service: qldService,
          potential_matches: duplicates
        });
        this.stats.duplicates_detected++;
      }
    }
    
    console.log(`   📊 Found ${this.stats.duplicates_detected} potential duplicates`);
    
    if (this.duplicatesFound.length > 0) {
      console.log('\n   🔍 Sample potential duplicates:');
      for (const dup of this.duplicatesFound.slice(0, 5)) {
        console.log(`      QLD: "${dup.qld_service.name}"`);
        console.log(`      Existing: "${dup.potential_matches[0].name}"`);
        console.log(`      Similarity: ${Math.round(dup.potential_matches[0].similarity * 100)}%\n`);
      }
    }
  }

  findPotentialDuplicates(qldService, existingServices) {
    const duplicates = [];
    
    for (const existing of existingServices) {
      // Skip if different states (unless existing is statewide)
      if (existing.location?.state && existing.location.state !== 'QLD' && existing.location.state !== 'ALL') {
        continue;
      }
      
      const similarity = this.calculateSimilarity(qldService, existing);
      
      if (similarity > 0.7) { // 70% similarity threshold
        duplicates.push({
          ...existing,
          similarity: similarity
        });
      }
    }
    
    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(service1, service2) {
    let matches = 0;
    let total = 0;
    
    // Compare names
    total++;
    const nameSimilarity = this.stringSimilarity(service1.name, service2.name);
    if (nameSimilarity > 0.8) matches++;
    
    // Compare organization names
    if (service1.organization?.name && service2.organization?.name) {
      total++;
      const orgSimilarity = this.stringSimilarity(service1.organization.name, service2.organization.name);
      if (orgSimilarity > 0.8) matches++;
    }
    
    // Compare locations (city/suburb)
    if (service1.location?.city && service2.location?.city) {
      total++;
      if (service1.location.city.toLowerCase() === service2.location.city.toLowerCase()) matches++;
    }
    
    return total > 0 ? matches / total : 0;
  }

  stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async mergeDatasets() {
    // Start with existing services
    this.mergedServices = [...this.existingServices];
    
    // Add QLD services that are not duplicates
    for (const qldService of this.qldServices) {
      const isDuplicate = this.duplicatesFound.some(dup => dup.qld_service.id === qldService.id);
      
      if (!isDuplicate) {
        this.mergedServices.push(qldService);
        this.stats.new_services_added++;
      }
    }
    
    this.stats.total_merged = this.mergedServices.length;
    
    console.log(`   ✅ Merged dataset: ${this.stats.total_merged} total services`);
    console.log(`   📊 New QLD services added: ${this.stats.new_services_added}`);
    console.log(`   ⏭️  Duplicates skipped: ${this.stats.duplicates_detected}`);
  }

  async exportMergedDataset() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export merged JSON
    const mergedData = {
      metadata: {
        title: 'Merged Australian Youth Services Database',
        description: 'Combined QLD scraped services with comprehensive Australian dataset',
        total_services: this.mergedServices.length,
        generated_at: new Date().toISOString(),
        merge_stats: this.stats,
        data_sources: {
          qld_scraped: this.stats.qld_services_loaded,
          comprehensive_generated: this.stats.existing_services_loaded,
          new_added: this.stats.new_services_added,
          duplicates_skipped: this.stats.duplicates_detected
        },
        coverage: 'Australia-wide with enhanced QLD coverage',
        state_breakdown: this.getStateBreakdown(),
        source_breakdown: this.getSourceBreakdown()
      },
      services: this.mergedServices
    };

    const jsonFilename = `MERGED-Australian-Services-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(mergedData, null, 2));
    console.log(`   💾 Exported: ${jsonFilename}`);
    
    // Export merged CSV
    const csvFilename = `MERGED-Australian-Services-${timestamp}.csv`;
    this.exportCSV(csvFilename);
    console.log(`   💾 Exported: ${csvFilename}`);
    
    // Export duplicate report
    if (this.duplicatesFound.length > 0) {
      const duplicateReport = {
        timestamp: new Date().toISOString(),
        total_duplicates: this.duplicatesFound.length,
        threshold: '70% similarity',
        duplicates: this.duplicatesFound.map(dup => ({
          qld_service: {
            name: dup.qld_service.name,
            organization: dup.qld_service.organization.name,
            location: `${dup.qld_service.location.suburb}, ${dup.qld_service.location.state}`
          },
          potential_matches: dup.potential_matches.map(match => ({
            name: match.name,
            organization: match.organization?.name,
            location: `${match.location?.suburb}, ${match.location?.state}`,
            similarity: Math.round(match.similarity * 100)
          }))
        }))
      };
      
      const duplicateFilename = `DUPLICATE-REPORT-${timestamp}.json`;
      fs.writeFileSync(duplicateFilename, JSON.stringify(duplicateReport, null, 2));
      console.log(`   📋 Duplicate report: ${duplicateFilename}`);
    }
    
    return { jsonFilename, csvFilename };
  }

  exportCSV(filename) {
    const headers = [
      'ID', 'Name', 'Description', 'Organization', 'Organization_Type', 'Address', 'Suburb', 
      'City', 'State', 'Postcode', 'Phone', 'Email', 'Website', 'Categories', 'Youth_Specific',
      'Indigenous_Specific', 'Data_Source', 'Status'
    ];

    const rows = this.mergedServices.map(service => [
      service.id,
      `"${service.name.replace(/"/g, '""')}"`,
      `"${(service.description || '').replace(/"/g, '""').substring(0, 200)}"`,
      `"${service.organization.name.replace(/"/g, '""')}"`,
      service.organization.type,
      `"${(service.location.address_line_1 || '').replace(/"/g, '""')}"`,
      service.location.suburb || '',
      service.location.city || '',
      service.location.state || '',
      service.location.postcode || '',
      service.contact.phone.primary || '',
      service.contact.email.primary || '',
      service.contact.website || '',
      `"${service.categories.join(', ')}"`,
      service.youth_specific,
      service.indigenous_specific,
      service.data_source.source_name,
      service.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    fs.writeFileSync(filename, csvContent);
  }

  getStateBreakdown() {
    const breakdown = {};
    for (const service of this.mergedServices) {
      const state = service.location?.state || 'UNKNOWN';
      breakdown[state] = (breakdown[state] || 0) + 1;
    }
    return breakdown;
  }

  getSourceBreakdown() {
    const breakdown = {};
    for (const service of this.mergedServices) {
      const source = service.data_source?.source_name || 'Unknown';
      breakdown[source] = (breakdown[source] || 0) + 1;
    }
    return breakdown;
  }

  generateMergeReport() {
    return {
      success: true,
      merge_summary: {
        qld_services_loaded: this.stats.qld_services_loaded,
        existing_services_loaded: this.stats.existing_services_loaded,
        duplicates_detected: this.stats.duplicates_detected,
        new_services_added: this.stats.new_services_added,
        total_merged_services: this.stats.total_merged
      },
      data_quality: {
        duplicate_detection_rate: this.stats.qld_services_loaded > 0 ? 
          Math.round((this.stats.duplicates_detected / this.stats.qld_services_loaded) * 100) : 0,
        unique_services_added: this.stats.new_services_added,
        data_integrity: 'maintained'
      },
      state_breakdown: this.getStateBreakdown(),
      source_breakdown: this.getSourceBreakdown(),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.duplicates_detected > 0) {
      recommendations.push({
        priority: 'medium',
        message: `Review ${this.stats.duplicates_detected} potential duplicates for manual verification`
      });
    }
    
    const qldCount = this.getStateBreakdown()['QLD'] || 0;
    if (qldCount > 50) {
      recommendations.push({
        priority: 'high',
        message: `Excellent QLD coverage with ${qldCount} services - consider similar detailed scraping for other states`
      });
    }
    
    recommendations.push({
      priority: 'low',
      message: 'Consider adding contact information to QLD services through manual verification or additional scraping'
    });
    
    return recommendations;
  }
}

// Execute merge
async function main() {
  try {
    const merger = new QLDServiceMerger();
    const results = await merger.executeMerge();
    
    console.log('\n🎉 SMART MERGE COMPLETE!');
    console.log(`📊 Total merged services: ${results.merge_summary.total_merged_services}`);
    console.log(`✅ New QLD services added: ${results.merge_summary.new_services_added}`);
    console.log(`⏭️  Duplicates detected: ${results.merge_summary.duplicates_detected}`);
    
    console.log('\n🗺️ Final State Breakdown:');
    for (const [state, count] of Object.entries(results.state_breakdown)) {
      console.log(`   ${state}: ${count} services`);
    }
    
    console.log('\n📡 Data Source Breakdown:');
    for (const [source, count] of Object.entries(results.source_breakdown)) {
      console.log(`   ${source}: ${count} services`);
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of results.recommendations) {
        console.log(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
      }
    }
    
    console.log('\n🚀 Ready for database import with enhanced QLD coverage!');
    
    return results;

  } catch (error) {
    console.error('💥 Merge failed:', error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(results => {
      console.log(`\n✨ Successfully merged datasets! Total: ${results.merge_summary.total_merged_services} services`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Merge failed:', error.message);
      process.exit(1);
    });
}

export default main;