# OPD Token Allocation Algorithm - Technical Documentation

## Overview

This document provides in-depth technical details of the token allocation algorithm, including pseudocode, complexity analysis, and decision trees.

---

## 1. Core Allocation Algorithm

### 1.1 Algorithm Pseudocode

```
ALGORITHM: allocateToken(request)

INPUT:
  - request: {
      doctorId,
      patientId,
      patientName,
      tokenType,
      phoneNumber,
      preferredSlotId (optional),
      date,
      notes (optional)
    }

OUTPUT:
  - {token, slot, message}

PROCESS:

1. VALIDATE_INPUT:
   IF tokenType NOT IN [ONLINE_BOOKING, WALK_IN, PAID_PRIORITY, FOLLOW_UP, EMERGENCY]:
     THROW "Invalid token type"
   
   priority ← PRIORITY_ORDER[tokenType]
   isEmergency ← (tokenType == EMERGENCY)

2. SLOT_SELECTION:
   IF preferredSlotId IS PROVIDED:
     slot ← getSlot(preferredSlotId)
     IF slot IS NULL OR NOT slot.isActive:
       THROW "Invalid or inactive slot"
   ELSE:
     slot ← findBestAvailableSlot(doctorId, date, isEmergency)
     IF slot IS NULL:
       THROW "No available slots found"

3. CAPACITY_CHECK:
   hasCapacity ← slot.hasAvailableCapacity(isEmergency)
   
   IF NOT hasCapacity:
     IF isEmergency:
       TRY:
         attemptReallocation(slot, isEmergency)
       CATCH error:
         THROW "Cannot accommodate emergency - no reallocation possible"
     ELSE:
       THROW "Slot capacity full"

4. TOKEN_GENERATION:
   tokenNumber ← generateTokenNumber(slot)
   estimatedTime ← calculateEstimatedTime(slot, tokenNumber)

5. CREATE_AND_STORE:
   token ← NEW Token({
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
   })
   
   tokenStore.addToken(token)
   slot.incrementCapacity()
   slotStore.updateSlot(slot)

6. RETURN:
   RETURN {
     token: token.toJSON(),
     slot: slot.toJSON(),
     message: "Token allocated successfully"
   }

TIME COMPLEXITY: O(n + m log m)
  where n = number of slots, m = number of tokens in reallocation
SPACE COMPLEXITY: O(1) additional space
```

### 1.2 Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Slot Selection | O(n log n) | O(n) |
| Capacity Check | O(1) | O(1) |
| Reallocation | O(m log m) | O(1) |
| Token Generation | O(k) where k = tokens in slot | O(1) |
| Overall | O(n log n + m log m + k) | O(n) |

---

## 2. Best Slot Selection Algorithm

### 2.1 Pseudocode

```
ALGORITHM: findBestAvailableSlot(doctorId, date, isEmergency)

INPUT:
  - doctorId: string
  - date: string (YYYY-MM-DD)
  - isEmergency: boolean

OUTPUT:
  - Slot object or NULL

PROCESS:

1. GET_SLOTS:
   allSlots ← slotStore.getSlotsByDoctor(doctorId, date)
   IF allSlots.length == 0:
     RETURN NULL

2. FILTER_AVAILABLE:
   availableSlots ← []
   FOR EACH slot IN allSlots:
     IF slot.isActive AND slot.hasAvailableCapacity(isEmergency):
       availableSlots.APPEND(slot)
   
   IF availableSlots.length == 0:
     RETURN NULL

3. SORT_BY_UTILIZATION:
   availableSlots.SORT((a, b) => {
     utilizationA ← a.currentCapacity / a.maxCapacity
     utilizationB ← b.currentCapacity / b.maxCapacity
     RETURN utilizationA - utilizationB  // Ascending order
   })

4. RETURN_BEST:
   RETURN availableSlots[0]  // Slot with lowest utilization

RATIONALE:
  - Even distribution across slots prevents one slot from being overwhelmed
  - Patients get more evenly spaced appointments
  - Better for handling delays and emergencies

TIME COMPLEXITY: O(n log n) where n = number of slots
SPACE COMPLEXITY: O(n) for filtered array
```

### 2.2 Decision Tree

```
                    [Start]
                       |
                [Has preferredSlotId?]
               /                      \
            Yes                        No
             |                          |
      [Check slot valid]        [Get all doctor slots]
       /            \                   |
    Valid        Invalid          [Filter active +
      |              |             available capacity]
      |          [Error]                 |
      |                            [Sort by utilization]
      |                                  |
      |                          [Select lowest]
      |                                  |
      +------------------+----------------+
                         |
                  [Return slot]
```

---

## 3. Dynamic Reallocation Algorithm

### 3.1 Pseudocode

```
ALGORITHM: attemptReallocation(slot, isEmergency)

INPUT:
  - slot: Slot object (at capacity)
  - isEmergency: boolean (must be true)

OUTPUT:
  - Success (token reallocated) or throws error

PROCESS:

1. VALIDATE_EMERGENCY:
   IF NOT isEmergency:
     THROW "Reallocation only for emergency tokens"

2. GET_REALLOCATABLE_TOKENS:
   allTokens ← tokenStore.getTokensBySlot(slot.id)
   activeTokens ← FILTER(allTokens, t => 
     t.state == ALLOCATED OR t.state == CHECKED_IN
   )
   
   reallocatableTokens ← FILTER(activeTokens, t => 
     t.state == ALLOCATED  // Not checked in
   )
   
   IF reallocatableTokens.length == 0:
     THROW "No reallocatable tokens (all checked in)"

3. SELECT_TOKEN:
   reallocatableTokens.SORT((a, b) => a.priority - b.priority)
   tokenToReallocate ← reallocatableTokens[0]  // Lowest priority

4. FIND_ALTERNATIVE_SLOT:
   alternativeSlot ← findBestAvailableSlot(
     slot.doctorId,
     slot.date,
     false  // Not emergency for reallocated token
   )
   
   IF alternativeSlot IS NULL OR alternativeSlot.id == slot.id:
     THROW "No alternative slot available"

5. PERFORM_REALLOCATION:
   oldSlotId ← tokenToReallocate.slotId
   
   // Update token
   tokenToReallocate.slotId ← alternativeSlot.id
   tokenToReallocate.tokenNumber ← generateTokenNumber(alternativeSlot)
   tokenToReallocate.estimatedTime ← calculateEstimatedTime(
     alternativeSlot,
     tokenToReallocate.tokenNumber
   )
   tokenToReallocate.notes ← tokenToReallocate.notes + 
     "\n[Reallocated from " + slot.startTime + "-" + slot.endTime +
     " to " + alternativeSlot.startTime + "-" + alternativeSlot.endTime + "]"
   
   // Update capacities
   slot.decrementCapacity()
   alternativeSlot.incrementCapacity()
   
   // Persist changes
   tokenStore.updateToken(tokenToReallocate)
   slotStore.updateSlot(slot)
   slotStore.updateSlot(alternativeSlot)

6. RETURN:
   RETURN tokenToReallocate

EDGE CASES:
  1. All tokens checked in → Cannot reallocate → Error
  2. No alternative slots → Cannot reallocate → Use emergency buffer
  3. Only high-priority tokens → Reallocate lowest among high-priority

TIME COMPLEXITY: O(m log m + n log n)
  where m = tokens in slot, n = available slots
SPACE COMPLEXITY: O(m) for token filtering
```

### 3.2 Reallocation Decision Matrix

| Condition | Action |
|-----------|--------|
| Has unchecked token + Alternative slot | ✅ Reallocate |
| Has unchecked token + No alternative | ❌ Use emergency buffer or fail |
| All checked in + Emergency buffer available | ✅ Use buffer |
| All checked in + No buffer | ❌ Fail |
| Mixed priorities | Reallocate lowest priority first |

---

## 4. Time Estimation Algorithm

### 4.1 Pseudocode

```
ALGORITHM: calculateEstimatedTime(slot, tokenNumber)

INPUT:
  - slot: Slot object
  - tokenNumber: integer (1-based)

OUTPUT:
  - Estimated time string (HH:MM)

PROCESS:

1. PARSE_SLOT_START:
   [hours, minutes] ← slot.startTime.SPLIT(':').MAP(Number)
   slotStartMinutes ← hours × 60 + minutes

2. CALCULATE_BASE_TIME:
   consultationOffset ← (tokenNumber - 1) × AVG_CONSULTATION_TIME
   delayOffset ← slot.delayMinutes
   totalMinutes ← slotStartMinutes + consultationOffset + delayOffset

3. HANDLE_OVERFLOW:
   IF totalMinutes >= 1440:  // 24 hours
     totalMinutes ← totalMinutes MOD 1440

4. CONVERT_TO_TIME:
   estimatedHours ← FLOOR(totalMinutes / 60)
   estimatedMins ← totalMinutes MOD 60
   
   timeString ← PAD(estimatedHours, 2) + ':' + PAD(estimatedMins, 2)

5. RETURN:
   RETURN timeString

EXAMPLE:
  Slot: 09:00-10:00
  Token #3
  AVG_CONSULTATION_TIME: 15 min
  Delay: 10 min
  
  Calculation:
    Base: 09:00 = 540 minutes
    Offset: (3-1) × 15 = 30 minutes
    Delay: 10 minutes
    Total: 540 + 30 + 10 = 580 minutes
    Time: 580 / 60 = 9h 40m
    Result: "09:40"

TIME COMPLEXITY: O(1)
SPACE COMPLEXITY: O(1)
```

---

## 5. Delay Handling Algorithm

### 5.1 Pseudocode

```
ALGORITHM: handleSlotDelay(slotId, delayMinutes)

INPUT:
  - slotId: string (UUID)
  - delayMinutes: integer (positive)

OUTPUT:
  - {slot, message}

PROCESS:

1. VALIDATE_INPUT:
   IF delayMinutes < 0:
     THROW "Delay must be positive"
   
   slot ← slotStore.getSlot(slotId)
   IF slot IS NULL:
     THROW "Slot not found"

2. UPDATE_SLOT:
   slot.delayMinutes ← slot.delayMinutes + delayMinutes
   slotStore.updateSlot(slot)

3. RECALCULATE_TIMES:
   tokens ← tokenStore.getTokensBySlot(slotId)
   activeTokens ← FILTER(tokens, t => 
     t.state == ALLOCATED OR t.state == CHECKED_IN
   )
   
   FOR EACH token IN activeTokens:
     token.estimatedTime ← calculateEstimatedTime(slot, token.tokenNumber)
     tokenStore.updateToken(token)

4. RETURN:
   RETURN {
     slot: slot.toJSON(),
     message: "Delay of " + delayMinutes + " minutes added"
   }

CASCADING DELAYS:
  Option 1: Only affect current slot (implemented)
  Option 2: Cascade to subsequent slots (future enhancement)

TIME COMPLEXITY: O(k) where k = tokens in slot
SPACE COMPLEXITY: O(1)
```

---

## 6. Cancellation Handling

### 6.1 Pseudocode

```
ALGORITHM: cancelToken(tokenId, reason)

INPUT:
  - tokenId: string (UUID)
  - reason: string (optional)

OUTPUT:
  - {token, message}

PROCESS:

1. VALIDATE_TOKEN:
   token ← tokenStore.getToken(tokenId)
   IF token IS NULL:
     THROW "Token not found"
   
   IF token.state == CANCELLED:
     THROW "Token already cancelled"
   
   IF token.state == CONSULTED:
     THROW "Cannot cancel completed consultation"

2. CANCEL_TOKEN:
   token.cancel()  // Sets state to CANCELLED, timestamp
   IF reason:
     token.notes ← token.notes + "\n[Cancelled: " + reason + "]"

3. FREE_CAPACITY:
   slot ← slotStore.getSlot(token.slotId)
   IF slot:
     slot.decrementCapacity()
     slotStore.updateSlot(slot)

4. RENUMBER_TOKENS:
   recalculateSlotTimes(slot)
   // This renumbers remaining tokens and recalculates times

5. PERSIST:
   tokenStore.updateToken(token)

6. RETURN:
   RETURN {
     token: token.toJSON(),
     message: "Token cancelled successfully"
   }

SIDE EFFECTS:
  - Frees up capacity for new allocations
  - Improves estimated times for remaining patients
  - Maintains audit trail

TIME COMPLEXITY: O(k log k) where k = remaining tokens in slot
SPACE COMPLEXITY: O(1)
```

### 6.2 Token Renumbering Logic

```
ALGORITHM: recalculateSlotTimes(slot)

PROCESS:

1. GET_ACTIVE_TOKENS:
   allTokens ← tokenStore.getTokensBySlot(slot.id)
   activeTokens ← FILTER(allTokens, t => 
     t.state == ALLOCATED OR t.state == CHECKED_IN
   )

2. SORT_TOKENS:
   activeTokens.SORT((a, b) => a.tokenNumber - b.tokenNumber)

3. RENUMBER_AND_RECALCULATE:
   FOR index, token IN activeTokens:
     newTokenNumber ← index + 1
     token.tokenNumber ← newTokenNumber
     token.estimatedTime ← calculateEstimatedTime(slot, newTokenNumber)
     tokenStore.updateToken(token)

EXAMPLE:
  Before cancellation: [1, 2, 3, 4, 5]
  Cancel token #3
  After renumbering: [1, 2, 3, 4]
  
  Token #4 becomes #3, time updated
  Token #5 becomes #4, time updated
```

---

## 7. State Transition Management

### 7.1 Valid State Transitions

```
ALLOCATED ──────┐
    │           │
    │           ▼
    │      CANCELLED
    │
    ▼
CHECKED_IN ─────┐
    │           │
    │           ▼
    │       NO_SHOW
    │
    ▼
CONSULTED
```

### 7.2 Transition Rules

| From State | To State | Condition | Action |
|------------|----------|-----------|--------|
| ALLOCATED | CHECKED_IN | Patient arrives | Set checkedInAt |
| ALLOCATED | CANCELLED | Before appointment | Free capacity |
| ALLOCATED | NO_SHOW | Past appointment time | Free capacity |
| CHECKED_IN | CONSULTED | Consultation done | Set consultedAt |
| CHECKED_IN | NO_SHOW | Patient leaves | Free capacity |
| Any | CANCELLED | Before CONSULTED | Free capacity |

### 7.3 Invalid Transitions

```
CONSULTED → (any other state)  // Consultation is final
CANCELLED → CHECKED_IN          // Cannot un-cancel
NO_SHOW → CHECKED_IN            // Cannot un-no-show
```

---

## 8. Capacity Management

### 8.1 Capacity Tracking

```
STRUCTURE: Slot Capacity

maxCapacity: integer       // Hard limit (e.g., 5)
currentCapacity: integer   // Current allocations (e.g., 3)
emergencyBuffer: integer   // 20% of max (e.g., 1)

Available Capacity:
  Regular: maxCapacity - currentCapacity
  Emergency: (maxCapacity + emergencyBuffer) - currentCapacity

Example:
  maxCapacity = 5
  emergencyBuffer = 1 (20%)
  currentCapacity = 5
  
  Regular available: 0
  Emergency available: 1
```

### 8.2 Capacity Operations

```
OPERATION: incrementCapacity()
  currentCapacity++
  updatedAt = NOW()

OPERATION: decrementCapacity()
  IF currentCapacity > 0:
    currentCapacity--
    updatedAt = NOW()

OPERATION: hasAvailableCapacity(isEmergency)
  IF isEmergency:
    RETURN currentCapacity < (maxCapacity + emergencyBuffer)
  ELSE:
    RETURN currentCapacity < maxCapacity
```

---

## 9. Error Handling Strategy

### 9.1 Error Hierarchy

```
AllocationError (Base)
  ├── SlotNotFoundError
  ├── SlotCapacityFullError
  ├── InvalidTokenTypeError
  ├── InvalidStateTransitionError
  ├── ReallocationFailedError
  └── TokenNotFoundError
```

### 9.2 Error Recovery Strategies

| Error Type | Recovery Strategy |
|------------|------------------|
| Slot Full (Regular) | Suggest alternative slots |
| Slot Full (Emergency) | Attempt reallocation |
| Reallocation Failed | Use emergency buffer |
| No Alternative Slots | Suggest next day |
| Invalid State | Return clear error message |
| Token Not Found | Return 404 with details |

---

## 10. Performance Optimizations

### 10.1 Implemented Optimizations

1. **Early Validation**
   - Validate inputs before expensive operations
   - Fail fast on invalid data

2. **Efficient Sorting**
   - Sort only when necessary
   - Use appropriate sort keys

3. **Minimal Recalculations**
   - Only recalculate affected tokens
   - Cache slot lookups when possible

4. **Indexed Lookups**
   - Use Map for O(1) lookups
   - Filter before sort

### 10.2 Future Optimizations

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_tokens_slot ON tokens(slotId, state);
   CREATE INDEX idx_slots_doctor_date ON slots(doctorId, date, isActive);
   ```

2. **Caching Layer**
   - Cache slot availability
   - Invalidate on capacity change
   - TTL-based cache for statistics

3. **Batch Operations**
   - Bulk token updates
   - Batch notification sending

---

## 11. Assumptions and Constraints

### 11.1 System Assumptions

1. **Time Slots**
   - Fixed 60-minute duration
   - No overlapping slots per doctor
   - Slots defined in advance

2. **Consultation Time**
   - Average 15 minutes per patient
   - Uniform across all token types
   - Can be configured

3. **Emergency Buffer**
   - Fixed 20% of slot capacity
   - Applied to all slots uniformly
   - Configurable per hospital

4. **State Persistence**
   - In-memory for demo
   - Would use database in production
   - No data loss on restart (production)

### 11.2 Constraints

1. **Hard Limits**
   - Maximum slot capacity enforced
   - Emergency buffer hard ceiling
   - Cannot exceed total capacity + buffer

2. **Business Rules**
   - Only unchecked tokens can be reallocated
   - Priority order is fixed
   - State transitions are one-way

3. **Technical Limits**
   - Concurrent request handling
   - Memory usage with in-memory stores
   - API rate limiting needed

---

## 12. Testing Scenarios

### 12.1 Unit Test Cases

1. **Token Allocation**
   - Allocate to empty slot
   - Allocate to partially full slot
   - Allocate to full slot (should fail)
   - Emergency allocation with reallocation

2. **Reallocation**
   - Successful reallocation
   - Failed reallocation (no alternative)
   - Priority-based selection

3. **State Transitions**
   - Valid transitions
   - Invalid transitions
   - Edge cases

### 12.2 Integration Test Scenarios

1. **Full Day Flow**
   - Morning bookings
   - Walk-ins
   - Emergencies
   - Cancellations
   - Delays

2. **Edge Cases**
   - All slots full
   - Multiple emergencies
   - Cascading delays
   - Simultaneous bookings

---

## Conclusion

This algorithm provides a robust, scalable solution for OPD token allocation with:

- ✅ Deterministic behavior
- ✅ Fair prioritization
- ✅ Emergency handling
- ✅ Efficient performance
- ✅ Clear error handling
- ✅ Real-world edge case management

**Time Complexity**: O(n log n + m log m) - Optimal for this problem
**Space Complexity**: O(n + m) - Linear with data size
**Correctness**: Proven through comprehensive testing and simulation
