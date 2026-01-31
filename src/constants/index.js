// Token Types
const TOKEN_TYPES = {
  ONLINE_BOOKING: 'ONLINE_BOOKING',
  WALK_IN: 'WALK_IN',
  PAID_PRIORITY: 'PAID_PRIORITY',
  FOLLOW_UP: 'FOLLOW_UP',
  EMERGENCY: 'EMERGENCY'
};

// Token States
const TOKEN_STATES = {
  ALLOCATED: 'ALLOCATED',
  CHECKED_IN: 'CHECKED_IN',
  CONSULTED: 'CONSULTED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

// Priority Order (higher number = higher priority)
const PRIORITY_ORDER = {
  [TOKEN_TYPES.EMERGENCY]: 5,
  [TOKEN_TYPES.PAID_PRIORITY]: 4,
  [TOKEN_TYPES.FOLLOW_UP]: 3,
  [TOKEN_TYPES.ONLINE_BOOKING]: 2,
  [TOKEN_TYPES.WALK_IN]: 1
};

// Slot Duration (in minutes)
const SLOT_DURATION = 60;

// Default consultation time per patient (in minutes)
const AVG_CONSULTATION_TIME = 15;

// Buffer percentage for emergency allocations
const EMERGENCY_BUFFER_PERCENTAGE = 0.2; // 20% of slot capacity

module.exports = {
  TOKEN_TYPES,
  TOKEN_STATES,
  PRIORITY_ORDER,
  SLOT_DURATION,
  AVG_CONSULTATION_TIME,
  EMERGENCY_BUFFER_PERCENTAGE
};
