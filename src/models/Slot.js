const { v4: uuidv4 } = require('uuid');
const { EMERGENCY_BUFFER_PERCENTAGE } = require('../constants');

class Slot {
  constructor({
    doctorId,
    doctorName,
    startTime,
    endTime,
    maxCapacity,
    date
  }) {
    this.id = uuidv4();
    this.doctorId = doctorId;
    this.doctorName = doctorName;
    this.startTime = startTime; // HH:MM format
    this.endTime = endTime; // HH:MM format
    this.date = date; // YYYY-MM-DD format
    this.maxCapacity = maxCapacity;
    this.currentCapacity = 0;
    this.emergencyBuffer = Math.ceil(maxCapacity * EMERGENCY_BUFFER_PERCENTAGE);
    this.isActive = true;
    this.delayMinutes = 0; // Track accumulated delay
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  hasAvailableCapacity(isEmergency = false) {
    if (isEmergency) {
      return this.currentCapacity < (this.maxCapacity + this.emergencyBuffer);
    }
    return this.currentCapacity < this.maxCapacity;
  }

  getAvailableSlots(isEmergency = false) {
    if (isEmergency) {
      return (this.maxCapacity + this.emergencyBuffer) - this.currentCapacity;
    }
    return this.maxCapacity - this.currentCapacity;
  }

  incrementCapacity() {
    this.currentCapacity++;
    this.updatedAt = new Date();
  }

  decrementCapacity() {
    if (this.currentCapacity > 0) {
      this.currentCapacity--;
      this.updatedAt = new Date();
    }
  }

  addDelay(minutes) {
    this.delayMinutes += minutes;
    this.updatedAt = new Date();
  }

  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  getUtilizationPercentage() {
    return (this.currentCapacity / this.maxCapacity) * 100;
  }

  toJSON() {
    return {
      id: this.id,
      doctorId: this.doctorId,
      doctorName: this.doctorName,
      startTime: this.startTime,
      endTime: this.endTime,
      date: this.date,
      maxCapacity: this.maxCapacity,
      currentCapacity: this.currentCapacity,
      emergencyBuffer: this.emergencyBuffer,
      availableSlots: this.getAvailableSlots(),
      utilizationPercentage: this.getUtilizationPercentage(),
      isActive: this.isActive,
      delayMinutes: this.delayMinutes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Slot;
