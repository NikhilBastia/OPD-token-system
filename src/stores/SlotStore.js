class SlotStore {
  constructor() {
    this.slots = new Map();
  }

  addSlot(slot) {
    this.slots.set(slot.id, slot);
    return slot;
  }

  getSlot(slotId) {
    return this.slots.get(slotId);
  }

  updateSlot(slot) {
    this.slots.set(slot.id, slot);
    return slot;
  }

  deleteSlot(slotId) {
    return this.slots.delete(slotId);
  }

  getAllSlots() {
    return Array.from(this.slots.values());
  }

  getSlotsByDoctor(doctorId, date = null) {
    let doctorSlots = this.getAllSlots().filter(slot => slot.doctorId === doctorId);
    
    if (date) {
      doctorSlots = doctorSlots.filter(slot => slot.date === date);
    }
    
    // Sort by start time
    doctorSlots.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
    
    return doctorSlots;
  }

  getSlotsByDate(date) {
    return this.getAllSlots().filter(slot => slot.date === date);
  }

  getActiveSlots() {
    return this.getAllSlots().filter(slot => slot.isActive);
  }

  clear() {
    this.slots.clear();
  }
}

module.exports = SlotStore;
