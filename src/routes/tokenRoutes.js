const express = require('express');
const router = express.Router();
const { TOKEN_STATES } = require('../constants');

let allocationEngine;

// Inject dependencies
const init = (engine) => {
  allocationEngine = engine;
};

/**
 * POST /api/tokens/allocate
 * Allocate a new token
 */
router.post('/allocate', (req, res) => {
  try {
    const result = allocationEngine.allocateToken(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tokens/:tokenId
 * Get token details
 */
router.get('/:tokenId', (req, res) => {
  try {
    const token = allocationEngine.tokenStore.getToken(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    const slot = allocationEngine.slotStore.getSlot(token.slotId);

    res.json({
      success: true,
      data: {
        token: token.toJSON(),
        slot: slot ? slot.toJSON() : null
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
 * PATCH /api/tokens/:tokenId/checkin
 * Check in a patient
 */
router.patch('/:tokenId/checkin', (req, res) => {
  try {
    const token = allocationEngine.tokenStore.getToken(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    token.checkIn();
    allocationEngine.tokenStore.updateToken(token);

    res.json({
      success: true,
      data: {
        token: token.toJSON(),
        message: 'Patient checked in successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/tokens/:tokenId/complete
 * Mark consultation as complete
 */
router.patch('/:tokenId/complete', (req, res) => {
  try {
    const token = allocationEngine.tokenStore.getToken(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    token.complete();
    allocationEngine.tokenStore.updateToken(token);

    res.json({
      success: true,
      data: {
        token: token.toJSON(),
        message: 'Consultation completed successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/tokens/:tokenId/cancel
 * Cancel a token
 */
router.patch('/:tokenId/cancel', (req, res) => {
  try {
    const { reason } = req.body;
    const result = allocationEngine.cancelToken(req.params.tokenId, reason);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/tokens/:tokenId/no-show
 * Mark token as no-show
 */
router.patch('/:tokenId/no-show', (req, res) => {
  try {
    const token = allocationEngine.tokenStore.getToken(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    token.markNoShow();
    allocationEngine.tokenStore.updateToken(token);

    // Free up capacity
    const slot = allocationEngine.slotStore.getSlot(token.slotId);
    if (slot) {
      slot.decrementCapacity();
      allocationEngine.slotStore.updateSlot(slot);
      allocationEngine.recalculateSlotTimes(slot);
    }

    res.json({
      success: true,
      data: {
        token: token.toJSON(),
        message: 'Token marked as no-show'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tokens/doctor/:doctorId
 * Get all tokens for a doctor
 */
router.get('/doctor/:doctorId', (req, res) => {
  try {
    const { date } = req.query;
    let tokens = allocationEngine.tokenStore.getTokensByDoctor(req.params.doctorId);

    if (date) {
      // Filter by date through slots
      const slots = allocationEngine.slotStore.getSlotsByDoctor(req.params.doctorId, date);
      const slotIds = slots.map(s => s.id);
      tokens = tokens.filter(t => slotIds.includes(t.slotId));
    }

    res.json({
      success: true,
      data: {
        tokens: tokens.map(t => t.toJSON()),
        count: tokens.length
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
