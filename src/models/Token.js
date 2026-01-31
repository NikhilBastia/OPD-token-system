const { v4: uuidv4 } = require('uuid');
const { TOKEN_STATES } = require('../constants');

class Token {
  constructor({
    doctorId,
    slotId,
    patientId,
    patientName,
    tokenType,
    priority,
    tokenNumber,
    estimatedTime,
    phoneNumber,
    notes = ''
  }) {
    this.id = uuidv4();
    this.doctorId = doctorId;
    this.slotId = slotId;
    this.patientId = patientId;
    this.patientName = patientName;
    this.tokenType = tokenType;
    this.priority = priority;
    this.tokenNumber = tokenNumber;
    this.state = TOKEN_STATES.ALLOCATED;
    this.estimatedTime = estimatedTime;
    this.phoneNumber = phoneNumber;
    this.notes = notes;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.checkedInAt = null;
    this.consultedAt = null;
    this.cancelledAt = null;
  }

  checkIn() {
    if (this.state !== TOKEN_STATES.ALLOCATED) {
      throw new Error(`Cannot check in token in state: ${this.state}`);
    }
    this.state = TOKEN_STATES.CHECKED_IN;
    this.checkedInAt = new Date();
    this.updatedAt = new Date();
  }

  complete() {
    if (this.state !== TOKEN_STATES.CHECKED_IN) {
      throw new Error(`Cannot complete token in state: ${this.state}`);
    }
    this.state = TOKEN_STATES.CONSULTED;
    this.consultedAt = new Date();
    this.updatedAt = new Date();
  }

  cancel() {
    if (this.state === TOKEN_STATES.CONSULTED) {
      throw new Error('Cannot cancel completed consultation');
    }
    this.state = TOKEN_STATES.CANCELLED;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();
  }

  markNoShow() {
    if (this.state !== TOKEN_STATES.ALLOCATED && this.state !== TOKEN_STATES.CHECKED_IN) {
      throw new Error(`Cannot mark no-show for token in state: ${this.state}`);
    }
    this.state = TOKEN_STATES.NO_SHOW;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      doctorId: this.doctorId,
      slotId: this.slotId,
      patientId: this.patientId,
      patientName: this.patientName,
      tokenType: this.tokenType,
      priority: this.priority,
      tokenNumber: this.tokenNumber,
      state: this.state,
      estimatedTime: this.estimatedTime,
      phoneNumber: this.phoneNumber,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      checkedInAt: this.checkedInAt,
      consultedAt: this.consultedAt,
      cancelledAt: this.cancelledAt
    };
  }
}

module.exports = Token;
