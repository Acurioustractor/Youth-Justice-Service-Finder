#!/usr/bin/env node
/**
 * Test the exact working-search route logic to identify the issue
 */

import knex from 'knex';

const RAILWAY_DB_URL = 'postgresql://postgres:ArQYLfNfYNFxzAPKmoORqfTxYhnZxXCh@trolley.proxy.rlwy.net:52530/railway';

const db = knex({
  client: 'postgresql',
  connection: RAILWAY_DB_URL,
  pool: {
    min: 1,
    max: 3
  }
});

async function testWorkingSearchLogic() {
  try {
    console.log('🔍 Testing exact working-search logic...');
    
    // Simulate the exact query parameters from the API
    const query = {
      q: '',
      limit: 20,
      offset: 0,
      category: undefined,
      region: undefined,
      youth_specific: undefined,
      indigenous_specific: undefined,
      minimum_age: undefined,
      maximum_age: undefined
    };
    
    console.log('📥 Query parameters:', query);
    
    // Test the exact same query structure as working-search.js
    let serviceQuery = db('services')
      .select('*')
      .where('status', 'active')
      .limit(parseInt(query.limit))
      .offset(parseInt(query.offset));

    // Add search if query provided (this should be empty)
    if (query.q && query.q.trim()) {
      const searchTerm = query.q.trim();
      serviceQuery = serviceQuery.where(function() {
        this.where('name', 'ilike', `%${searchTerm}%`)
            .orWhere('description', 'ilike', `%${searchTerm}%`);
      });
    }

    // Add category filter
    if (query.category) {
      serviceQuery = serviceQuery.whereRaw("categories::text ILIKE ?", [`%"${query.category}"%`]);
    }

    // Add youth_specific filter
    if (query.youth_specific === 'true') {
      serviceQuery = serviceQuery.where('youth_specific', true);
    }

    // Add indigenous_specific filter
    if (query.indigenous_specific === 'true') {
      serviceQuery = serviceQuery.where('indigenous_specific', true);
    }

    console.log('🗃️ Executing services query...');
    const services = await serviceQuery;
    console.log(`✅ Services query successful: ${services.length} services returned`);
    
    // Test count query
    let countQuery = db('services')
      .where('status', 'active');

    // Apply same filters for count
    if (query.q && query.q.trim()) {
      const searchTerm = query.q.trim();
      countQuery = countQuery.where(function() {
        this.where('name', 'ilike', `%${searchTerm}%`)
            .orWhere('description', 'ilike', `%${searchTerm}%`);
      });
    }

    if (query.category) {
      countQuery = countQuery.whereRaw("categories::text ILIKE ?", [`%"${query.category}"%`]);
    }

    if (query.youth_specific === 'true') {
      countQuery = countQuery.where('youth_specific', true);
    }

    if (query.indigenous_specific === 'true') {
      countQuery = countQuery.where('indigenous_specific', true);
    }

    console.log('🔢 Executing count query...');
    const total = await countQuery.count('id as count').first();
    console.log(`✅ Count query successful: ${total.count} total services`);

    // Test response format
    const response = {
      services: services,
      pagination: {
        limit: parseInt(query.limit),
        offset: parseInt(query.offset),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / parseInt(query.limit)),
        current_page: Math.floor(parseInt(query.offset) / parseInt(query.limit)) + 1,
        has_next: parseInt(query.offset) + parseInt(query.limit) < parseInt(total.count),
        has_prev: parseInt(query.offset) > 0
      },
      total: parseInt(total.count)
    };

    console.log('📊 Response structure:');
    console.log(`- Services: ${response.services.length}`);
    console.log(`- Total: ${response.total}`);
    console.log(`- Pagination: page ${response.pagination.current_page} of ${response.pagination.pages}`);
    
    if (response.services.length > 0) {
      console.log('📝 Sample service:');
      console.log({
        id: response.services[0].id,
        name: response.services[0].name,
        status: response.services[0].status,
        categories: response.services[0].categories
      });
    }

    console.log('\n✅ Working-search logic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Working-search logic test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

testWorkingSearchLogic().catch(console.error);