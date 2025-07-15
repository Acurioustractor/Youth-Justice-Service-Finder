// Budget Intelligence API Routes
import QueenslandBudgetTracker from '../../utils/budget-scraper.js';

export default async function budgetIntelligenceRoutes(fastify, options) {
  const budgetTracker = new QueenslandBudgetTracker();

  // Get comprehensive budget intelligence report
  fastify.get('/report', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get comprehensive budget intelligence report',
      response: {
        200: {
          type: 'object',
          properties: {
            generatedAt: { type: 'string' },
            summary: {
              type: 'object',
              properties: {
                totalBudget2025: { type: 'number' },
                totalBudget2024: { type: 'number' },
                budgetIncrease: { type: 'number' },
                contractsAnalyzed: { type: 'number' },
                totalContractValue: { type: 'number' }
              }
            },
            allocations: { type: 'object' },
            contracts: { type: 'object' },
            trends: { type: 'object' },
            opportunities: { type: 'array' },
            alerts: { type: 'array' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const report = await budgetTracker.generateIntelligenceReport();
      
      if (!report) {
        return reply.status(500).send({
          error: 'Failed to generate budget intelligence report'
        });
      }

      return report;
    } catch (error) {
      fastify.log.error('Budget intelligence report error:', error);
      return reply.status(500).send({
        error: 'Internal server error generating budget report'
      });
    }
  });

  // Get latest contract data
  fastify.get('/contracts', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get latest contract disclosure data',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          region: { type: 'string' },
          minValue: { type: 'number' },
          maxValue: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          limit: { type: 'number', default: 100 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const {
        category,
        region,
        minValue,
        maxValue,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = request.query;

      let contracts = await budgetTracker.fetchContractData();

      // Apply filters
      if (category) {
        contracts = contracts.filter(c => c.category === category);
      }
      
      if (region) {
        contracts = contracts.filter(c => c.region === region);
      }
      
      if (minValue) {
        contracts = contracts.filter(c => c.value >= minValue);
      }
      
      if (maxValue) {
        contracts = contracts.filter(c => c.value <= maxValue);
      }
      
      if (startDate) {
        const start = new Date(startDate);
        contracts = contracts.filter(c => c.awardDate >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        contracts = contracts.filter(c => c.awardDate <= end);
      }

      // Pagination
      const total = contracts.length;
      const paginatedContracts = contracts.slice(offset, offset + limit);

      return {
        contracts: paginatedContracts,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Contract data error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch contract data'
      });
    }
  });

  // Get budget allocations by year and program
  fastify.get('/allocations', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get budget allocations by year and program',
      querystring: {
        type: 'object',
        properties: {
          year: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { year } = request.query;
      const allocations = await budgetTracker.fetchBudgetAllocations();

      if (year && allocations[year]) {
        return allocations[year];
      }

      return allocations;
    } catch (error) {
      fastify.log.error('Budget allocations error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch budget allocations'
      });
    }
  });

  // Get spending trends and analysis
  fastify.get('/trends', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get spending trends and analysis',
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
          category: { type: 'string' },
          region: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { period = 'monthly', category, region } = request.query;
      
      let contracts = await budgetTracker.fetchContractData();
      
      // Apply filters
      if (category) {
        contracts = contracts.filter(c => c.category === category);
      }
      
      if (region) {
        contracts = contracts.filter(c => c.region === region);
      }

      const analysis = await budgetTracker.analyzeSpendingTrends(contracts);

      return {
        period,
        filters: { category, region },
        analysis: {
          totalSpending: analysis.totalSpending,
          averageContractValue: analysis.averageContractValue,
          spendingByCategory: analysis.spendingByCategory,
          spendingByRegion: analysis.spendingByRegion,
          spendingByMonth: analysis.spendingByMonth,
          trends: analysis.trends,
          largestContracts: analysis.largestContracts.slice(0, 5)
        }
      };
    } catch (error) {
      fastify.log.error('Spending trends error:', error);
      return reply.status(500).send({
        error: 'Failed to analyze spending trends'
      });
    }
  });

  // Get funding opportunities
  fastify.get('/opportunities', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get current funding opportunities and grants',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'closing_soon', 'closed'] },
          minAmount: { type: 'number' },
          maxAmount: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { status, minAmount, maxAmount } = request.query;
      
      let opportunities = await budgetTracker.monitorFundingOpportunities();

      // Apply filters
      if (status === 'closing_soon') {
        const now = new Date();
        opportunities = opportunities.filter(opp => {
          const daysUntilClose = Math.ceil((opp.closingDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilClose <= 30 && daysUntilClose > 0;
        });
      } else if (status === 'open') {
        opportunities = opportunities.filter(opp => opp.status === 'Open');
      } else if (status === 'closed') {
        opportunities = opportunities.filter(opp => opp.status === 'Closed');
      }

      if (minAmount) {
        opportunities = opportunities.filter(opp => opp.amount >= minAmount);
      }

      if (maxAmount) {
        opportunities = opportunities.filter(opp => opp.amount <= maxAmount);
      }

      return {
        opportunities,
        count: opportunities.length,
        filters: { status, minAmount, maxAmount }
      };
    } catch (error) {
      fastify.log.error('Funding opportunities error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch funding opportunities'
      });
    }
  });

  // Get alerts and notifications
  fastify.get('/alerts', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get budget alerts and notifications',
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['warning', 'opportunity', 'info'] },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type, priority } = request.query;
      
      const contracts = await budgetTracker.fetchContractData();
      const opportunities = await budgetTracker.monitorFundingOpportunities();
      const analysis = await budgetTracker.analyzeSpendingTrends(contracts);
      
      let alerts = budgetTracker.generateAlerts(analysis, opportunities);

      // Apply filters
      if (type) {
        alerts = alerts.filter(alert => alert.type === type);
      }

      if (priority) {
        alerts = alerts.filter(alert => alert.priority === priority);
      }

      return {
        alerts,
        count: alerts.length,
        filters: { type, priority }
      };
    } catch (error) {
      fastify.log.error('Budget alerts error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch budget alerts'
      });
    }
  });

  // Get summary dashboard data
  fastify.get('/dashboard', {
    schema: {
      tags: ['Budget Intelligence'],
      description: 'Get summary data for budget dashboard'
    }
  }, async (request, reply) => {
    try {
      const [contracts, allocations, opportunities] = await Promise.all([
        budgetTracker.fetchContractData(),
        budgetTracker.fetchBudgetAllocations(),
        budgetTracker.monitorFundingOpportunities()
      ]);

      const analysis = await budgetTracker.analyzeSpendingTrends(contracts);
      const alerts = budgetTracker.generateAlerts(analysis, opportunities);

      // Calculate key metrics
      const totalBudget2025 = allocations['2025-26']?.total || 770900000;
      const totalSpent = analysis.totalSpending;
      const utilizationRate = (totalSpent / totalBudget2025) * 100;
      
      const activeOpportunities = opportunities.filter(opp => opp.status === 'Open').length;
      const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high').length;

      return {
        summary: {
          totalBudget: totalBudget2025,
          totalSpent: totalSpent,
          utilizationRate: utilizationRate.toFixed(1),
          remainingBudget: totalBudget2025 - totalSpent,
          contractCount: contracts.length,
          activeOpportunities,
          highPriorityAlerts
        },
        recentContracts: analysis.largestContracts.slice(0, 5),
        spendingByCategory: analysis.spendingByCategory,
        spendingByRegion: analysis.spendingByRegion,
        monthlyTrends: analysis.spendingByMonth,
        upcomingOpportunities: opportunities.slice(0, 3),
        criticalAlerts: alerts.filter(alert => alert.priority === 'high')
      };
    } catch (error) {
      fastify.log.error('Budget dashboard error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch dashboard data'
      });
    }
  });
}