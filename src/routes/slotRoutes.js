const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

let allocationEngine;

// Inject dependencies
const init = (engine) => {
  allocationEngine = engine;
};

/**
 * POST /api/slots
 * Create a new slot
 */
router.post('/', (req, res) => {
  try {
    const { doctorId, doctorName, startTime, endTime, maxCapacity, date } = req.body;

    if (!doctorId || !doctorName || !startTime || !endTime || !maxCapacity || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const slot = new Slot({
      doctorId,
      doctorName,
      startTime,
      endTime,
      maxCapacity,
      date
    });

    allocationEngine.slotStore.addSlot(slot);

    res.status(201).json({
      success: true,
      data: {
        slot: slot.toJSON(),
        message: 'Slot created successfully'
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
 * GET /api/slots/:slotId
 * Get slot details
 */
router.get('/:slotId', (req, res) => {
  try {
    const slot = allocationEngine.slotStore.getSlot(req.params.slotId);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    const tokens = allocationEngine.tokenStore.getTokensBySlot(slot.id);

    res.json({
      success: true,
      data: {
        slot: slot.toJSON(),
        tokens: tokens.map(t => t.toJSON()),
        tokenCount: tokens.length
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
 * GET /api/slots/doctor/:doctorId
 * Get all slots for a doctor
 */
router.get('/doctor/:doctorId', (req, res) => {
  try {
    const { date } = req.query;
    const slots = allocationEngine.slotStore.getSlotsByDoctor(req.params.doctorId, date);

    res.json({
      success: true,
      data: {
        slots: slots.map(s => s.toJSON()),
        count: slots.length
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
 * GET /api/slots/date/:date
 * Get all slots for a specific date
 */
router.get('/date/:date', (req, res) => {
  try {
    const slots = allocationEngine.slotStore.getSlotsByDate(req.params.date);

    res.json({
      success: true,
      data: {
        slots: slots.map(s => s.toJSON()),
        count: slots.length
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
 * PATCH /api/slots/:slotId/delay
 * Add delay to a slot
 */
router.patch('/:slotId/delay', (req, res) => {
  try {
    const { delayMinutes } = req.body;

    if (!delayMinutes || delayMinutes < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delay minutes'
      });
    }

    const result = allocationEngine.handleSlotDelay(req.params.slotId, delayMinutes);

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
 * PATCH /api/slots/:slotId/activate
 * Activate a slot
 */
router.patch('/:slotId/activate', (req, res) => {
  try {
    const slot = allocationEngine.slotStore.getSlot(req.params.slotId);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    slot.activate();
    allocationEngine.slotStore.updateSlot(slot);

    res.json({
      success: true,
      data: {
        slot: slot.toJSON(),
        message: 'Slot activated successfully'
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
 * PATCH /api/slots/:slotId/deactivate
 * Deactivate a slot
 */
router.patch('/:slotId/deactivate', (req, res) => {
  try {
    const slot = allocationEngine.slotStore.getSlot(req.params.slotId);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    slot.deactivate();
    allocationEngine.slotStore.updateSlot(slot);

    res.json({
      success: true,
      data: {
        slot: slot.toJSON(),
        message: 'Slot deactivated successfully'
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
 * POST /api/slots/bulk
 * Create multiple slots at once
 */
router.post('/bulk', (req, res) => {
  try {
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slots array'
      });
    }

    const createdSlots = [];

    slots.forEach(slotData => {
      const slot = new Slot(slotData);
      allocationEngine.slotStore.addSlot(slot);
      createdSlots.push(slot);
    });

    res.status(201).json({
      success: true,
      data: {
        slots: createdSlots.map(s => s.toJSON()),
        count: createdSlots.length,
        message: 'Slots created successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = {
  router,
  init
};
