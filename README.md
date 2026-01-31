# MEDOC OPD Token Allocation Engine

## Assignment Submission - Backend Intern

A comprehensive token allocation system for hospital OPD (Outpatient Department) that supports elastic capacity management, dynamic reallocation, and handles real-world edge cases.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Algorithm](#core-algorithm)
4. [API Documentation](#api-documentation)
5. [Data Schema](#data-schema)
6. [Prioritization Logic](#prioritization-logic)
7. [Edge Cases & Handling](#edge-cases--handling)
8. [Installation & Setup](#installation--setup)
9. [Running the System](#running-the-system)
10. [Simulation](#simulation)

---

## Overview

The OPD Token Allocation Engine is designed to manage patient appointments in a hospital's outpatient department. It handles:

- **Multiple token sources**: Online booking, Walk-in, Paid Priority, Follow-up, Emergency
- **Fixed time slots**: Doctors operate in predefined time slots with maximum capacity
- **Dynamic allocation**: Real-time reallocation based on changing conditions
- **Edge case handling**: Cancellations, no-shows, delays, emergency insertions

### Key Features

1. **Elastic Capacity Management**: Dynamic allocation with emergency buffer
2. **Priority-based Allocation**: 5-tier priority system
3. **Real-time Reallocation**: Automatic reallocation for emergencies
4. **Slot Delay Handling**: Automatic time recalculation
5. **Comprehensive State Management**: Track token lifecycle
6. **RESTful API**: Well-designed endpoints for all operations

---

### Components

1. **Models**: `Token`, `Slot` - Data structures with business logic
2. **Stores**: `TokenStore`, `SlotStore` - In-memory data persistence
3. **Engine**: `AllocationEngine` - Core allocation algorithm
4. **Routes**: API endpoints for external interaction
5. **Constants**: System-wide configuration and enums

---

## Core Algorithm

### 1. Token Allocation Algorithm

```javascript
FUNCTION allocateToken(request):
  1. Validate token type and priority
  2. IF preferred slot specified:
       Use that slot
     ELSE:
       Find best available slot using distribution algorithm

  3. Check slot capacity:
     - Regular tokens: currentCapacity < maxCapacity
     - Emergency tokens: currentCapacity < (maxCapacity + emergencyBuffer)

  4. IF capacity full AND emergency token:
       Attempt reallocation of lower priority tokens

  5. Generate sequential token number
  6. Calculate estimated consultation time
  7. Create and store token
  8. Update slot capacity
  9. Return token and slot information
```

### 2. Dynamic Reallocation Algorithm

```javascript
FUNCTION attemptReallocation(slot, isEmergency):
  1. Get all active tokens in the slot
  2. Filter tokens that haven't checked in (state = ALLOCATED)
  3. Sort by priority (ascending - lowest first)
  4. Select lowest priority token for reallocation
  5. Find alternative slot with available capacity
  6. IF alternative slot found:
       - Update token's slot assignment
       - Recalculate token number and estimated time
       - Update both slot capacities
       - Log reallocation in token notes
     ELSE:
       Throw error - no reallocation possible
```

### 3. Best Slot Selection

```javascript
FUNCTION findBestAvailableSlot(doctorId, date, isEmergency):
  1. Get all slots for doctor on specified date
  2. Filter active slots with available capacity
  3. Sort by utilization percentage (ascending)
  4. Return slot with lowest utilization

  // This ensures even distribution across slots
```

### 4. Time Estimation Algorithm

```javascript
FUNCTION calculateEstimatedTime(slot, tokenNumber):
  1. Parse slot start time (HH:MM)
  2. Calculate base minutes from start of day
  3. Add consultation time: (tokenNumber - 1) × AVG_CONSULTATION_TIME
  4. Add accumulated delay: slot.delayMinutes
  5. Convert back to HH:MM format
  6. Return estimated time
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Token Endpoints

#### 1. Allocate Token

```http
POST /api/tokens/allocate

Request Body:
{
  "doctorId": "DOC001",
  "patientId": "P001",
  "patientName": "Raj Singh",
  "tokenType": "ONLINE_BOOKING",
  "phoneNumber": "9876543210",
  "date": "2025-01-30",
  "preferredSlotId": "optional-slot-id",
  "notes": "Optional notes"
}

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "slot": { ... },
    "message": "Token allocated successfully"
  }
}
```

#### 2. Get Token Details

```http
GET /api/tokens/:tokenId

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "slot": { ... }
  }
}
```

#### 3. Check In Patient

```http
PATCH /api/tokens/:tokenId/checkin

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "message": "Patient checked in successfully"
  }
}
```

#### 4. Complete Consultation

```http
PATCH /api/tokens/:tokenId/complete

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "message": "Consultation completed successfully"
  }
}
```

#### 5. Cancel Token

```http
PATCH /api/tokens/:tokenId/cancel

Request Body:
{
  "reason": "Patient requested cancellation"
}

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "message": "Token cancelled successfully"
  }
}
```

#### 6. Mark No-Show

```http
PATCH /api/tokens/:tokenId/no-show

Response:
{
  "success": true,
  "data": {
    "token": { ... },
    "message": "Token marked as no-show"
  }
}
```

### Slot Endpoints

#### 1. Create Slot

```http
POST /api/slots

Request Body:
{
  "doctorId": "DOC001",
  "doctorName": "Dr. Sharma",
  "startTime": "09:00",
  "endTime": "10:00",
  "maxCapacity": 5,
  "date": "2025-01-30"
}
```

#### 2. Get Slot Details

```http
GET /api/slots/:slotId
```

#### 3. Get Doctor's Slots

```http
GET /api/slots/doctor/:doctorId?date=2025-01-30
```

#### 4. Add Delay to Slot

```http
PATCH /api/slots/:slotId/delay

Request Body:
{
  "delayMinutes": 15
}
```

#### 5. Bulk Create Slots

```http
POST /api/slots/bulk

Request Body:
{
  "slots": [
    {
      "doctorId": "DOC001",
      "doctorName": "Dr. Sharma",
      "startTime": "09:00",
      "endTime": "10:00",
      "maxCapacity": 5,
      "date": "2025-01-30"
    },
    ...
  ]
}
```

### Dashboard Endpoints

#### 1. Overall Dashboard

```http
GET /api/dashboard?date=2025-01-30

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalSlots": 10,
      "activeSlots": 10,
      "totalCapacity": 50,
      "allocatedTokens": 35,
      "availableCapacity": 15
    },
    "utilization": {
      "overall": "70.00",
      "byDoctor": { ... }
    },
    "tokens": {
      "total": 35,
      "byType": { ... },
      "byState": { ... }
    },
    "doctors": [ ... ]
  }
}
```

#### 2. Doctor Dashboard

```http
GET /api/dashboard/doctor/:doctorId?date=2025-01-30
```

#### 3. Real-time Queue Status

```http
GET /api/dashboard/realtime

Response:
{
  "success": true,
  "data": {
    "timestamp": "2025-01-30T10:30:00.000Z",
    "activeSlots": [
      {
        "slot": { ... },
        "queue": {
          "waiting": 3,
          "consulted": 2,
          "cancelled": 1,
          "noShow": 0
        },
        "currentToken": { ... },
        "nextTokens": [ ... ]
      }
    ]
  }
}
```

---

## Data Schema

### Token Schema

```javascript
{
  id: UUID,
  doctorId: String,
  slotId: UUID,
  patientId: String,
  patientName: String,
  tokenType: Enum [ONLINE_BOOKING, WALK_IN, PAID_PRIORITY, FOLLOW_UP, EMERGENCY],
  priority: Number (1-5),
  tokenNumber: Number,
  state: Enum [ALLOCATED, CHECKED_IN, CONSULTED, CANCELLED, NO_SHOW],
  estimatedTime: String (HH:MM),
  phoneNumber: String,
  notes: String,
  createdAt: DateTime,
  updatedAt: DateTime,
  checkedInAt: DateTime | null,
  consultedAt: DateTime | null,
  cancelledAt: DateTime | null
}
```

### Slot Schema

```javascript
{
  id: UUID,
  doctorId: String,
  doctorName: String,
  startTime: String (HH:MM),
  endTime: String (HH:MM),
  date: String (YYYY-MM-DD),
  maxCapacity: Number,
  currentCapacity: Number,
  emergencyBuffer: Number (20% of maxCapacity),
  isActive: Boolean,
  delayMinutes: Number,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## Prioritization Logic

### Priority Levels

The system implements a 5-tier priority system:

| Priority | Token Type     | Level   | Description                              |
| -------- | -------------- | ------- | ---------------------------------------- |
| 5        | EMERGENCY      | Highest | Critical cases, can use emergency buffer |
| 4        | PAID_PRIORITY  | High    | Premium patients with priority access    |
| 3        | FOLLOW_UP      | Medium  | Returning patients for follow-up         |
| 2        | ONLINE_BOOKING | Low     | Pre-booked appointments                  |
| 1        | WALK_IN        | Lowest  | Walk-in patients                         |

### Priority Rules

1. **Within Same Slot**: Higher priority gets preference for token numbers
2. **Reallocation**: Only lower priority tokens can be reallocated for emergencies
3. **Emergency Buffer**: 20% additional capacity reserved for emergency cases
4. **Check-in Protection**: Tokens that have checked in cannot be reallocated

### Example Scenario

```
Slot: 09:00-10:00, Capacity: 4

Allocated:
1. Token #1 - ONLINE_BOOKING (Priority 2)
2. Token #2 - WALK_IN (Priority 1)
3. Token #3 - FOLLOW_UP (Priority 3)
4. Token #4 - ONLINE_BOOKING (Priority 2)

Emergency Arrives:
- System identifies Token #2 (WALK_IN, lowest priority, not checked in)
- Reallocates Token #2 to next available slot
- Allocates EMERGENCY to Token #2's position
- Recalculates all estimated times
```

---

## Edge Cases & Handling

### 1. Slot Capacity Full

**Scenario**: Patient tries to book when slot is at max capacity

**Handling**:

- Regular tokens: Reject with error message
- Emergency tokens: Attempt reallocation of lower priority tokens
- If reallocation fails: Use emergency buffer (if available)
- Final fallback: Suggest alternative slots

**Code**:

```javascript
if (!slot.hasAvailableCapacity(isEmergency)) {
  if (isEmergency) {
    this.attemptReallocation(slot, isEmergency);
  } else {
    throw new Error("Slot capacity full");
  }
}
```

### 2. Patient Cancellation

**Scenario**: Patient cancels appointment

**Handling**:

1. Update token state to CANCELLED
2. Free up slot capacity
3. Recalculate token numbers for remaining patients
4. Recalculate estimated times for all affected tokens
5. Maintain cancellation timestamp and reason

**Impact**:

- Allows new patients to book freed slot
- Improves estimated times for remaining patients
- Maintains audit trail

### 3. Patient No-Show

**Scenario**: Patient doesn't arrive for appointment

**Handling**:

1. Mark token as NO_SHOW
2. Free up slot capacity after grace period
3. Do NOT reallocate already-allocated tokens
4. Track no-show in patient history

**Difference from Cancellation**:

- No-show happens at appointment time
- Cancellation happens before appointment
- Both free up capacity but tracked separately

### 4. Doctor Running Late

**Scenario**: Doctor's schedule is delayed

**Handling**:

1. Add delay minutes to slot
2. Recalculate ALL token estimated times in affected slots
3. Optionally notify patients (not implemented in core engine)
4. Cascade delay to subsequent slots if needed

**Code**:

```javascript
handleSlotDelay(slotId, delayMinutes) {
  slot.addDelay(delayMinutes);
  this.recalculateSlotTimes(slot);
}
```

### 5. Emergency Patient Arrival

**Scenario**: Critical patient needs immediate attention

**Handling**:

1. Check if emergency buffer available
2. If slot full, attempt to reallocate lowest priority non-checked-in token
3. Find alternative slot for reallocated token
4. If no alternative, use emergency buffer (exceeds normal capacity)
5. Emergency always gets priority

**Reallocation Logic**:

```javascript
- Find tokens with state = ALLOCATED (not checked in)
- Sort by priority (ascending)
- Select lowest priority token
- Find alternative slot
- Move token to alternative slot
- Allocate emergency to freed position
```

### 6. All Slots Full

**Scenario**: No available slots for the day

**Handling**:

1. Check all doctor's slots for the date
2. For emergencies: Use emergency buffers across all slots
3. For regular: Return error with suggested alternative dates
4. System maintains wait list capability (future enhancement)

### 7. Multiple Simultaneous Bookings

**Scenario**: Race condition with concurrent requests

**Handling**:

- Atomic capacity checks
- Transaction-like slot updates
- First-come-first-served at microsecond level
- Failed requests get immediate error response

### 8. Invalid State Transitions

**Scenario**: Attempt invalid token state change

**Handling**:

```javascript
// Example: Can't check in a cancelled token
if (this.state !== TOKEN_STATES.ALLOCATED) {
  throw new Error(`Cannot check in token in state: ${this.state}`);
}
```

Valid state transitions:

```
ALLOCATED → CHECKED_IN → CONSULTED
ALLOCATED → CANCELLED
ALLOCATED → NO_SHOW
CHECKED_IN → CONSULTED
CHECKED_IN → NO_SHOW
```

### 9. Slot Deactivation

**Scenario**: Doctor unexpectedly unavailable

**Handling**:

1. Deactivate slot
2. Identify all allocated tokens
3. Reallocate to alternative slots
4. Notify affected patients
5. Maintain audit trail

### 10. System Recovery

**Scenario**: System crash/restart

**Handling**:

- In-memory stores lost (current implementation)
- Production: Use persistent database
- Implement checkpoint/recovery mechanism
- Rebuild state from database on startup

---

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Clone/Download the project**

```bash
cd opd-token-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment configuration (optional)**

Create `.env` file:

```env
PORT=3000
NODE_ENV=development
```

### Project Structure

```
opd-token-system/
├── src/
│   ├── constants/
│   │   └── index.js
│   ├── models/
│   │   ├── Token.js
│   │   └── Slot.js
│   ├── stores/
│   │   ├── TokenStore.js
│   │   └── SlotStore.js
│   ├── engine/
│   │   └── AllocationEngine.js
│   ├── routes/
│   │   ├── tokenRoutes.js
│   │   ├── slotRoutes.js
│   │   └── dashboardRoutes.js
│   ├── simulation/
│   │   └── opdSimulation.js
│   └── server.js
├── package.json
└── README.md
```

---

## Running the System

### Start the Server

```bash
npm start
```

Output:

```
============================================================
🏥 MEDOC OPD Token Allocation Engine
============================================================
Server running on port 3000
Health check: http://localhost:3000/health
API Documentation: http://localhost:3000/
============================================================
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Access the API

1. **Health Check**: http://localhost:3000/health
2. **API Documentation**: http://localhost:3000/
3. **Dashboard**: http://localhost:3000/api/dashboard

---

## Simulation

### Run the Complete Day Simulation

```bash
npm run simulate
```

This runs a comprehensive simulation with:

- 3 Doctors (Cardiologist, Orthopedic, General Physician)
- 10 Time slots across the day
- 15+ patient scenarios
- All edge cases demonstrated

### Simulation Scenarios

The simulation demonstrates:

1. **Online Bookings** (7 patients)
2. **Walk-in Patients** (5 patients)
3. **Follow-up Appointments** (2 patients)
4. **Priority Patients** (1 patient)
5. **Patient Cancellation** (1 cancellation)
6. **Emergency Arrival** (1 emergency with reallocation)
7. **Doctor Delay** (20-minute delay handling)
8. **Patient No-Show** (1 no-show)
9. **Check-ins** (5 check-ins)
10. **Final Report** (Complete statistics)

### Expected Output

The simulation provides detailed logs including:

- Slot creation confirmation
- Token allocation details
- Real-time capacity updates
- State transition logs
- Final statistics and utilization reports

---

## Testing

### Manual API Testing with cURL

#### Allocate Token

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P001",
    "patientName": "Test Patient",
    "tokenType": "WALK_IN",
    "phoneNumber": "9876543210",
    "date": "2025-01-30"
  }'
```

#### Get Dashboard

```bash
curl http://localhost:3000/api/dashboard?date=2025-01-30
```

#### Cancel Token

```bash
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Patient requested"}'
```

---

## Performance Considerations

### Scalability

Current implementation uses in-memory stores, suitable for:

- Single hospital deployment
- Up to 1000 tokens/day
- Up to 50 doctors

For production:

- Replace in-memory stores with database (MongoDB/PostgreSQL)
- Implement caching layer (Redis)
- Add message queue for async operations (RabbitMQ/Kafka)
- Horizontal scaling with load balancer

### Optimization Opportunities

1. **Database Indexing**
   - Index on: doctorId, slotId, date, state
   - Composite index on: (doctorId, date, state)

2. **Caching Strategy**
   - Cache slot availability
   - Cache doctor schedules
   - Invalidate on capacity change

3. **Async Operations**
   - Send notifications asynchronously
   - Generate reports in background
   - Batch update operations

---

## Security Considerations

Future enhancements should include:

1. **Authentication & Authorization**
   - JWT-based API authentication
   - Role-based access control (Admin, Doctor, Reception, Patient)
   - API rate limiting

2. **Data Validation**
   - Input sanitization
   - Schema validation
   - SQL injection prevention (if using SQL database)

3. **Audit Logging**
   - Track all token operations
   - Log admin actions
   - HIPAA compliance logging

---

## Design Decisions & Rationale

### 1. In-Memory Storage

**Decision**: Use Map-based in-memory stores  
**Rationale**: Simplicity for assignment, easy to understand, no external dependencies  
**Production**: Should use persistent database

### 2. Priority-Based System

**Decision**: 5-tier numeric priority  
**Rationale**: Clear hierarchy, easy to extend, supports business rules  
**Alternative**: Could use weighted scoring

### 3. Emergency Buffer

**Decision**: 20% additional capacity for emergencies  
**Rationale**: Balance between capacity and emergency access  
**Configurable**: Can be adjusted per hospital policy

### 4. Token Number Generation

**Decision**: Sequential per slot  
**Rationale**: Easy for patients to understand, simple queue management  
**Alternative**: Global numbering, alphanumeric tokens

### 5. Reallocation Strategy

**Decision**: Lowest priority, non-checked-in tokens first  
**Rationale**: Minimal patient impact, fair for emergencies  
**Protection**: Checked-in patients never reallocated

---
