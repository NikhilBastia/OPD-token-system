const Token = require('../models/Token');
const { TOKEN_TYPES, TOKEN_STATES, PRIORITY_ORDER, AVG_CONSULTATION_TIME } = require('../constants');

class AllocationEngine {
  constructor(tokenStore, slotStore) {
    this.tokenStore = tokenStore;
    this.slotStore = slotStore;
  }

  /**
   * Allocate a new token
   * @param {Object} request - Token allocation request
   * @returns {Object} Allocated token and slot information
   */
  allocateToken(request) {
    const {
      doctorId,
      patientId,
      patientName,
      tokenType,
      phoneNumber,
      preferredSlotId = null,
      notes = '',
      date
    } = request;

    // Validate token type
    if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
      throw new Error(`Invalid token type: ${tokenType}`);
    }

    const isEmergency = tokenType === TOKEN_TYPES.EMERGENCY;
    const priority = PRIORITY_ORDER[tokenType];

    // Find suitable slot
    let slot;
    if (preferredSlotId) {
      slot = this.slotStore.getSlot(preferredSlotId);
      if (!slot) {
        throw new Error('Preferred slot not found');
      }
      if (!slot.isActive) {
        throw new Error('Preferred slot is not active');
      }
    } else {
      slot = this.findBestAvailableSlot(doctorId, date, isEmergency);
    }

    if (!slot) {
      throw new Error('No available slots found');
    }

    // Check capacity
    if (!slot.hasAvailableCapacity(isEmergency)) {
      if (isEmergency) {
        // Try to reallocate lower priority tokens
        this.attemptReallocation(slot, isEmergency);
      } else {
        throw new Error('Slot capacity full');
      }
    }

    // Calculate token number and estimated time
    const tokenNumber = this.generateTokenNumber(slot);
    const estimatedTime = this.calculateEstimatedTime(slot, tokenNumber);

    // Create token
    const token = new Token({
      doctorId: slot.doctorId,
      slotId: slot.id,
      patientId,
      patientName,
      tokenType,
      priority,
      tokenNumber,
      estimatedTime,
      phoneNumber,
      notes
    });

    // Store token and update slot
    this.tokenStore.addToken(token);
    slot.incrementCapacity();
    this.slotStore.updateSlot(slot);

    return {
      token: token.toJSON(),
      slot: slot.toJSON(),
      message: 'Token allocated successfully'
    };
  }

  /**
   * Find the best available slot for allocation
   */
  findBestAvailableSlot(doctorId, date, isEmergency) {
    const slots = this.slotStore.getSlotsByDoctor(doctorId, date);
    
    if (!slots || slots.length === 0) {
      return null;
    }

    // Filter active slots with available capacity
    const availableSlots = slots.filter(slot => 
      slot.isActive && slot.hasAvailableCapacity(isEmergency)
    );

    if (availableSlots.length === 0) {
      return null;
    }

    // Sort by utilization (prefer slots with lower utilization for better distribution)
    availableSlots.sort((a, b) => {
      const utilizationA = a.getUtilizationPercentage();
      const utilizationB = b.getUtilizationPercentage();
      return utilizationA - utilizationB;
    });

    return availableSlots[0];
  }

  /**
   * Generate sequential token number for a slot
   */
  generateTokenNumber(slot) {
    const slotTokens = this.tokenStore.getTokensBySlot(slot.id);
    const activeTokens = slotTokens.filter(t => 
      t.state !== TOKEN_STATES.CANCELLED && t.state !== TOKEN_STATES.NO_SHOW
    );
    return activeTokens.length + 1;
  }

  /**
   * Calculate estimated consultation time
   */
  calculateEstimatedTime(slot, tokenNumber) {
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotStartMinutes = hours * 60 + minutes;
    const estimatedMinutes = slotStartMinutes + ((tokenNumber - 1) * AVG_CONSULTATION_TIME) + slot.delayMinutes;
    
    const estimatedHours = Math.floor(estimatedMinutes / 60);
    const estimatedMins = estimatedMinutes % 60;
    
    return `${String(estimatedHours).padStart(2, '0')}:${String(estimatedMins).padStart(2, '0')}`;
  }

  /**
   * Attempt to reallocate lower priority tokens to make room for higher priority
   */
  attemptReallocation(slot, isEmergency) {
    if (!isEmergency) {
      throw new Error('Reallocation only supported for emergency tokens');
    }

    const slotTokens = this.tokenStore.getTokensBySlot(slot.id);
    const activeTokens = slotTokens.filter(t => 
      t.state === TOKEN_STATES.ALLOCATED || t.state === TOKEN_STATES.CHECKED_IN
    );

    // Find lowest priority token that hasn't checked in
    const reallocatableTokens = activeTokens
      .filter(t => t.state === TOKEN_STATES.ALLOCATED)
      .sort((a, b) => a.priority - b.priority);

    if (reallocatableTokens.length === 0) {
      throw new Error('Cannot reallocate - all tokens are checked in or higher priority');
    }

    const tokenToReallocate = reallocatableTokens[0];
    
    // Find alternative slot
    const alternativeSlot = this.findBestAvailableSlot(
      slot.doctorId, 
      slot.date, 
      false
    );

    if (!alternativeSlot || alternativeSlot.id === slot.id) {
      throw new Error('No alternative slot available for reallocation');
    }

    // Perform reallocation
    this.reallocateToken(tokenToReallocate, alternativeSlot);
  }

  /**
   * Reallocate a token to a different slot
   */
  reallocateToken(token, newSlot) {
    const oldSlot = this.slotStore.getSlot(token.slotId);
    
    if (!oldSlot) {
      throw new Error('Original slot not found');
    }

    // Update token
    token.slotId = newSlot.id;
    token.tokenNumber = this.generateTokenNumber(newSlot);
    token.estimatedTime = this.calculateEstimatedTime(newSlot, token.tokenNumber);
    token.notes += `\n[Reallocated from ${oldSlot.startTime}-${oldSlot.endTime} to ${newSlot.startTime}-${newSlot.endTime}]`;
    token.updatedAt = new Date();

    // Update capacities
    oldSlot.decrementCapacity();
    newSlot.incrementCapacity();

    // Save changes
    this.tokenStore.updateToken(token);
    this.slotStore.updateSlot(oldSlot);
    this.slotStore.updateSlot(newSlot);

    return token;
  }

  /**
   * Cancel a token and free up slot capacity
   */
  cancelToken(tokenId, reason = '') {
    const token = this.tokenStore.getToken(tokenId);
    
    if (!token) {
      throw new Error('Token not found');
    }

    if (token.state === TOKEN_STATES.CANCELLED) {
      throw new Error('Token already cancelled');
    }

    if (token.state === TOKEN_STATES.CONSULTED) {
      throw new Error('Cannot cancel completed consultation');
    }

    // Cancel token
    token.cancel();
    if (reason) {
      token.notes += `\n[Cancelled: ${reason}]`;
    }

    // Free up slot capacity
    const slot = this.slotStore.getSlot(token.slotId);
    if (slot) {
      slot.decrementCapacity();
      this.slotStore.updateSlot(slot);
      
      // Recalculate estimated times for remaining tokens
      this.recalculateSlotTimes(slot);
    }

    this.tokenStore.updateToken(token);

    return {
      token: token.toJSON(),
      message: 'Token cancelled successfully'
    };
  }

  /**
   * Recalculate estimated times for all tokens in a slot
   */
  recalculateSlotTimes(slot) {
    const slotTokens = this.tokenStore.getTokensBySlot(slot.id);
    const activeTokens = slotTokens
      .filter(t => t.state === TOKEN_STATES.ALLOCATED || t.state === TOKEN_STATES.CHECKED_IN)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    activeTokens.forEach((token, index) => {
      token.tokenNumber = index + 1;
      token.estimatedTime = this.calculateEstimatedTime(slot, token.tokenNumber);
      this.tokenStore.updateToken(token);
    });
  }

  /**
   * Handle slot delay and update all token times
   */
  handleSlotDelay(slotId, delayMinutes) {
    const slot = this.slotStore.getSlot(slotId);
    
    if (!slot) {
      throw new Error('Slot not found');
    }

    slot.addDelay(delayMinutes);
    this.slotStore.updateSlot(slot);

    // Recalculate times for all tokens
    this.recalculateSlotTimes(slot);

    return {
      slot: slot.toJSON(),
      message: `Delay of ${delayMinutes} minutes added to slot`
    };
  }

  /**
   * Get allocation statistics
   */
  getAllocationStats(doctorId, date) {
    const slots = this.slotStore.getSlotsByDoctor(doctorId, date);
    const allTokens = [];

    slots.forEach(slot => {
      const tokens = this.tokenStore.getTokensBySlot(slot.id);
      allTokens.push(...tokens);
    });

    const stats = {
      totalSlots: slots.length,
      totalCapacity: slots.reduce((sum, slot) => sum + slot.maxCapacity, 0),
      totalAllocated: slots.reduce((sum, slot) => sum + slot.currentCapacity, 0),
      utilizationPercentage: 0,
      tokensByType: {},
      tokensByState: {}
    };

    if (stats.totalCapacity > 0) {
      stats.utilizationPercentage = (stats.totalAllocated / stats.totalCapacity) * 100;
    }

    // Count by type
    Object.values(TOKEN_TYPES).forEach(type => {
      stats.tokensByType[type] = allTokens.filter(t => t.tokenType === type).length;
    });

    // Count by state
    Object.values(TOKEN_STATES).forEach(state => {
      stats.tokensByState[state] = allTokens.filter(t => t.state === state).length;
    });

    return stats;
  }
}

module.exports = AllocationEngine;
