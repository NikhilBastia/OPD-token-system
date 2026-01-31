const express = require('express');
const router = express.Router();

let allocationEngine;

// Inject dependencies
const init = (engine) => {
  allocationEngine = engine;
};

/**
 * GET /api/dashboard
 * Get overall OPD dashboard statistics
 */
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    
    let slots = allocationEngine.slotStore.getAllSlots();
    if (date) {
      slots = allocationEngine.slotStore.getSlotsByDate(date);
    }

    let tokens = allocationEngine.tokenStore.getAllTokens();
    if (date) {
      const slotIds = slots.map(s => s.id);
      tokens = tokens.filter(t => slotIds.includes(t.slotId));
    }

    const dashboard = {
      date: date || 'All',
      overview: {
        totalSlots: slots.length,
        activeSlots: slots.filter(s => s.isActive).length,
        totalCapacity: slots.reduce((sum, slot) => sum + slot.maxCapacity, 0),
        allocatedTokens: slots.reduce((sum, slot) => sum + slot.currentCapacity, 0),
        availableCapacity: slots.reduce((sum, slot) => sum + slot.getAvailableSlots(), 0)
      },
      utilization: {
        overall: 0,
        byDoctor: {}
      },
      tokens: {
        total: tokens.length,
        byType: {},
        byState: {}
      },
      doctors: []
    };

    // Calculate overall utilization
    if (dashboard.overview.totalCapacity > 0) {
      dashboard.utilization.overall = 
        (dashboard.overview.allocatedTokens / dashboard.overview.totalCapacity * 100).toFixed(2);
    }

    // Group by doctor
    const doctorMap = new Map();
    
    slots.forEach(slot => {
      if (!doctorMap.has(slot.doctorId)) {
        doctorMap.set(slot.doctorId, {
          doctorId: slot.doctorId,
          doctorName: slot.doctorName,
          slots: [],
          totalCapacity: 0,
          allocatedTokens: 0,
          availableCapacity: 0,
          utilization: 0
        });
      }

      const doctorData = doctorMap.get(slot.doctorId);
      doctorData.slots.push(slot.toJSON());
      doctorData.totalCapacity += slot.maxCapacity;
      doctorData.allocatedTokens += slot.currentCapacity;
      doctorData.availableCapacity += slot.getAvailableSlots();
    });

    // Calculate per-doctor utilization
    doctorMap.forEach((doctorData, doctorId) => {
      if (doctorData.totalCapacity > 0) {
        doctorData.utilization = 
          (doctorData.allocatedTokens / doctorData.totalCapacity * 100).toFixed(2);
      }
      dashboard.utilization.byDoctor[doctorId] = doctorData.utilization;
      dashboard.doctors.push(doctorData);
    });

    // Count tokens by type and state
    const { TOKEN_TYPES, TOKEN_STATES } = require('../constants');
    
    Object.values(TOKEN_TYPES).forEach(type => {
      dashboard.tokens.byType[type] = tokens.filter(t => t.tokenType === type).length;
    });

    Object.values(TOKEN_STATES).forEach(state => {
      dashboard.tokens.byState[state] = tokens.filter(t => t.state === state).length;
    });

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/doctor/:doctorId
 * Get dashboard for a specific doctor
 */
router.get('/doctor/:doctorId', (req, res) => {
  try {
    const { date } = req.query;
    const stats = allocationEngine.getAllocationStats(req.params.doctorId, date);
    
    const slots = allocationEngine.slotStore.getSlotsByDoctor(req.params.doctorId, date);
    const tokens = allocationEngine.tokenStore.getTokensByDoctor(req.params.doctorId);

    res.json({
      success: true,
      data: {
        doctorId: req.params.doctorId,
        date: date || 'All',
        stats,
        slots: slots.map(s => s.toJSON()),
        recentTokens: tokens.slice(-10).map(t => t.toJSON())
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/realtime
 * Get real-time queue status
 */
router.get('/realtime', (req, res) => {
  try {
    const { TOKEN_STATES } = require('../constants');
    
    const activeSlots = allocationEngine.slotStore.getActiveSlots();
    const realtimeData = [];

    activeSlots.forEach(slot => {
      const tokens = allocationEngine.tokenStore.getTokensBySlot(slot.id);
      const waitingTokens = tokens.filter(t => 
        t.state === TOKEN_STATES.ALLOCATED || t.state === TOKEN_STATES.CHECKED_IN
      );

      realtimeData.push({
        slot: slot.toJSON(),
        queue: {
          waiting: waitingTokens.length,
          consulted: tokens.filter(t => t.state === TOKEN_STATES.CONSULTED).length,
          cancelled: tokens.filter(t => t.state === TOKEN_STATES.CANCELLED).length,
          noShow: tokens.filter(t => t.state === TOKEN_STATES.NO_SHOW).length
        },
        currentToken: tokens.find(t => t.state === TOKEN_STATES.CHECKED_IN)?.toJSON() || null,
        nextTokens: waitingTokens
          .filter(t => t.state === TOKEN_STATES.ALLOCATED)
          .sort((a, b) => a.tokenNumber - b.tokenNumber)
          .slice(0, 5)
          .map(t => t.toJSON())
      });
    });

    res.json({
      success: true,
      data: {
        timestamp: new Date(),
        activeSlots: realtimeData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = {
  router,
  init
};
