// Budget Intelligence API Routes
// Simplified version for Railway deployment with demo data

export default async function budgetIntelligenceRoutes(fastify, options) {
  
  // Mock budget data for demonstration
  const getMockBudgetData = () => ({
    summary: {
      totalBudget: 770900000,
      totalSpent: 156780000,
      utilizationRate: '20.3',
      remainingBudget: 614120000,
      contractCount: 247,
      activeOpportunities: 12,
      highPriorityAlerts: 3
    },
    recentContracts: [
      {
        description: 'Staying On Track Rehabilitation Program',
        supplier: 'Mission Australia',
        value: 15000000,
        category: 'Community Programs',
        awardDate: new Date('2024-11-15')
      },
      {
        description: 'Youth Justice Schools Infrastructure',
        supplier: 'Department of Education',
        value: 12000000,
        category: 'Infrastructure',
        awardDate: new Date('2024-10-20')
      },
      {
        description: 'Educational Engagement Initiative',
        supplier: 'Queensland Education Department',
        value: 8500000,
        category: 'Education Services',
        awardDate: new Date('2024-09-15')
      },
      {
        description: 'Indigenous Youth Support Services',
        supplier: 'Aboriginal Health Council',
        value: 6200000,
        category: 'Cultural Services',
        awardDate: new Date('2024-08-30')
      },
      {
        description: 'Mental Health Crisis Support',
        supplier: 'Headspace Queensland',
        value: 5800000,
        category: 'Health Services',
        awardDate: new Date('2024-07-22')
      }
    ],
    spendingByCategory: {
      'Community Programs': 45000000,
      'Education Services': 38000000,
      'Infrastructure': 25000000,
      'Health Services': 18000000,
      'Cultural Services': 15000000,
      'Administration': 10000000,
      'Other': 5780000
    },
    spendingByRegion: {
      'Brisbane': 58000000,
      'Gold Coast': 25000000,
      'Townsville': 20000000,
      'Cairns': 18000000,
      'Toowoomba': 12000000,
      'Mackay': 8000000,
      'Rockhampton': 6000000,
      'Other': 9780000
    },
    monthlyTrends: {
      '2024-08': 12000000,
      '2024-09': 18000000,
      '2024-10': 25000000,
      '2024-11': 22000000,
      '2024-12': 28000000,
      '2025-01': 31000000,
      '2025-02': 20780000
    },
    upcomingOpportunities: [
      {
        title: 'Youth After Hours Services Expansion',
        amount: 8000000,
        closingDate: new Date('2025-03-15'),
        status: 'Open',
        description: 'Funding for expanded after-hours youth support services across Queensland',
        eligibility: 'Registered youth service providers'
      },
      {
        title: 'Indigenous Youth Programs Grant',
        amount: 5000000,
        closingDate: new Date('2025-04-30'),
        status: 'Open',
        description: 'Culturally appropriate programs for Indigenous youth',
        eligibility: 'Aboriginal and Torres Strait Islander organizations'
      },
      {
        title: 'Digital Youth Engagement Platform',
        amount: 3500000,
        closingDate: new Date('2025-05-20'),
        status: 'Open',
        description: 'Technology solutions for youth engagement and service delivery',
        eligibility: 'Technology providers and youth organizations'
      }
    ],
    criticalAlerts: [
      {
        type: 'warning',
        title: 'Budget Utilization Above Target',
        message: 'Q2 spending 15% above projected quarterly allocation',
        priority: 'high'
      },
      {
        type: 'opportunity',
        title: 'Major Grant Closing Soon',
        message: 'Youth After Hours Services grant closes in 28 days',
        priority: 'high'
      },
      {
        type: 'info',
        title: 'New Funding Stream Available',
        message: 'Digital Youth Engagement Platform applications now open',
        priority: 'medium'
      }
    ]
  });

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
      const mockData = getMockBudgetData();
      
      const report = {
        generatedAt: new Date(),
        summary: mockData.summary,
        allocations: {
          '2025-26': {
            total: 770900000,
            programs: {
              'Early Intervention Programs': 215000000,
              'Staying On Track Rehabilitation': 225000000,
              'Youth Justice Schools': 40000000,
              'Youth Detention Support': 50800000,
              'Educational Engagement': 288200000
            }
          }
        },
        contracts: {
          total: mockData.summary.contractCount,
          totalValue: mockData.summary.totalSpent,
          byCategory: mockData.spendingByCategory,
          byRegion: mockData.spendingByRegion,
          largest: mockData.recentContracts
        },
        trends: {
          spending: mockData.monthlyTrends,
          predictions: {
            quarterlySpending: 192725000,
            budgetUtilizationRate: 20.3,
            projectedYearEnd: 627120000
          }
        },
        opportunities: mockData.upcomingOpportunities,
        alerts: mockData.criticalAlerts
      };

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

      const mockData = getMockBudgetData();
      let contracts = mockData.recentContracts;

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
      const allocations = {
        '2025-26': {
          total: 770900000,
          programs: {
            'Early Intervention Programs': 215000000,
            'Staying On Track Rehabilitation': 225000000,
            'Youth Justice Schools': 40000000,
            'Youth Detention Support': 50800000,
            'Educational Engagement': 288200000
          }
        }
      };

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
      
      const mockData = getMockBudgetData();
      let contracts = mockData.recentContracts;
      
      // Apply filters
      if (category) {
        contracts = contracts.filter(c => c.category === category);
      }

      const analysis = {
        totalSpending: mockData.summary.totalSpent,
        averageContractValue: mockData.summary.totalSpent / contracts.length,
        spendingByCategory: mockData.spendingByCategory,
        spendingByRegion: mockData.spendingByRegion,
        spendingByMonth: mockData.monthlyTrends,
        trends: { monthlyGrowth: 15.2 },
        largestContracts: contracts
      };

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
      
      const mockData = getMockBudgetData();
      let opportunities = mockData.upcomingOpportunities;

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
      
      const mockData = getMockBudgetData();
      let alerts = mockData.criticalAlerts;

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
      const mockData = getMockBudgetData();

      return {
        summary: mockData.summary,
        recentContracts: mockData.recentContracts.slice(0, 5),
        spendingByCategory: mockData.spendingByCategory,
        spendingByRegion: mockData.spendingByRegion,
        monthlyTrends: mockData.monthlyTrends,
        upcomingOpportunities: mockData.upcomingOpportunities.slice(0, 3),
        criticalAlerts: mockData.criticalAlerts.filter(alert => alert.priority === 'high')
      };
    } catch (error) {
      fastify.log.error('Budget dashboard error:', error);
      return reply.status(500).send({
        error: 'Failed to fetch dashboard data'
      });
    }
  });
}