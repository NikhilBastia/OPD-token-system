# API Examples and Testing Guide

This document provides practical examples for testing the OPD Token Allocation Engine API.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Setting Up Test Data](#setting-up-test-data)
3. [Token Operations](#token-operations)
4. [Slot Operations](#slot-operations)
5. [Dashboard Operations](#dashboard-operations)
6. [Edge Case Testing](#edge-case-testing)
7. [Postman Collection](#postman-collection)

---

## Quick Start

### 1. Start the Server

```bash
npm install
npm start
```

Server will start on: `http://localhost:3000`

### 2. Verify Health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "message": "OPD Token Allocation Engine is running",
  "timestamp": "2025-01-30T10:00:00.000Z",
  "stats": {
    "totalSlots": 0,
    "totalTokens": 0,
    "activeSlots": 0
  }
}
```

---

## Setting Up Test Data

### Create Doctor Slots

```bash
# Create slots for Dr. Sharma (Cardiologist)
curl -X POST http://localhost:3000/api/slots/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "slots": [
      {
        "doctorId": "DOC001",
        "doctorName": "Dr. Sharma (Cardiologist)",
        "startTime": "09:00",
        "endTime": "10:00",
        "maxCapacity": 4,
        "date": "2025-01-30"
      },
      {
        "doctorId": "DOC001",
        "doctorName": "Dr. Sharma (Cardiologist)",
        "startTime": "10:00",
        "endTime": "11:00",
        "maxCapacity": 4,
        "date": "2025-01-30"
      },
      {
        "doctorId": "DOC002",
        "doctorName": "Dr. Patel (Orthopedic)",
        "startTime": "09:00",
        "endTime": "10:00",
        "maxCapacity": 5,
        "date": "2025-01-30"
      },
      {
        "doctorId": "DOC003",
        "doctorName": "Dr. Kumar (General Physician)",
        "startTime": "09:00",
        "endTime": "10:00",
        "maxCapacity": 6,
        "date": "2025-01-30"
      }
    ]
  }'
```

---

## Token Operations

### 1. Online Booking

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P001",
    "patientName": "Rahul Verma",
    "tokenType": "ONLINE_BOOKING",
    "phoneNumber": "9876543210",
    "date": "2025-01-30",
    "notes": "First consultation"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": {
      "id": "uuid-here",
      "tokenNumber": 1,
      "estimatedTime": "09:00",
      "state": "ALLOCATED",
      ...
    },
    "slot": {
      "id": "slot-uuid",
      "startTime": "09:00",
      "endTime": "10:00",
      "currentCapacity": 1,
      "availableSlots": 3,
      ...
    },
    "message": "Token allocated successfully"
  }
}
```

### 2. Walk-In Patient

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P002",
    "patientName": "Priya Singh",
    "tokenType": "WALK_IN",
    "phoneNumber": "9876543211",
    "date": "2025-01-30"
  }'
```

### 3. Priority Patient

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P003",
    "patientName": "VIP Patient",
    "tokenType": "PAID_PRIORITY",
    "phoneNumber": "9876543212",
    "date": "2025-01-30",
    "notes": "Premium consultation"
  }'
```

### 4. Follow-Up Appointment

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC002",
    "patientId": "P004",
    "patientName": "Amit Kumar",
    "tokenType": "FOLLOW_UP",
    "phoneNumber": "9876543213",
    "date": "2025-01-30",
    "notes": "Follow-up from previous visit"
  }'
```

### 5. Emergency Patient

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P005",
    "patientName": "Emergency Case",
    "tokenType": "EMERGENCY",
    "phoneNumber": "9876543214",
    "date": "2025-01-30",
    "notes": "URGENT: Chest pain"
  }'
```

### 6. Get Token Details

```bash
# Replace {tokenId} with actual token ID from allocation response
curl http://localhost:3000/api/tokens/{tokenId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": {
      "id": "token-uuid",
      "tokenNumber": 2,
      "patientName": "Priya Singh",
      "state": "ALLOCATED",
      "estimatedTime": "09:15",
      ...
    },
    "slot": {
      "startTime": "09:00",
      "endTime": "10:00",
      ...
    }
  }
}
```

### 7. Check In Patient

```bash
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/checkin
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": {
      "state": "CHECKED_IN",
      "checkedInAt": "2025-01-30T09:05:00.000Z",
      ...
    },
    "message": "Patient checked in successfully"
  }
}
```

### 8. Complete Consultation

```bash
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/complete
```

### 9. Cancel Token

```bash
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Patient called to cancel"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": {
      "state": "CANCELLED",
      "cancelledAt": "2025-01-30T08:30:00.000Z",
      ...
    },
    "message": "Token cancelled successfully"
  }
}
```

### 10. Mark No-Show

```bash
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/no-show
```

### 11. Get Doctor's Tokens

```bash
curl "http://localhost:3000/api/tokens/doctor/DOC001?date=2025-01-30"
```

---

## Slot Operations

### 1. Create Single Slot

```bash
curl -X POST http://localhost:3000/api/slots \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC004",
    "doctorName": "Dr. Mehta",
    "startTime": "14:00",
    "endTime": "15:00",
    "maxCapacity": 6,
    "date": "2025-01-30"
  }'
```

### 2. Get Slot Details

```bash
curl http://localhost:3000/api/slots/{slotId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "slot": {
      "id": "slot-uuid",
      "doctorName": "Dr. Sharma (Cardiologist)",
      "startTime": "09:00",
      "endTime": "10:00",
      "maxCapacity": 4,
      "currentCapacity": 2,
      "availableSlots": 2,
      "utilizationPercentage": 50,
      "delayMinutes": 0,
      "isActive": true
    },
    "tokens": [...],
    "tokenCount": 2
  }
}
```

### 3. Get Doctor's Slots

```bash
curl "http://localhost:3000/api/slots/doctor/DOC001?date=2025-01-30"
```

### 4. Get Slots by Date

```bash
curl http://localhost:3000/api/slots/date/2025-01-30
```

### 5. Add Delay to Slot

```bash
curl -X PATCH http://localhost:3000/api/slots/{slotId}/delay \
  -H "Content-Type: application/json" \
  -d '{
    "delayMinutes": 20
  }'
```

**Effect:** All token estimated times in this slot will be updated

### 6. Deactivate Slot

```bash
curl -X PATCH http://localhost:3000/api/slots/{slotId}/deactivate
```

### 7. Activate Slot

```bash
curl -X PATCH http://localhost:3000/api/slots/{slotId}/activate
```

---

## Dashboard Operations

### 1. Overall Dashboard

```bash
curl "http://localhost:3000/api/dashboard?date=2025-01-30"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2025-01-30",
    "overview": {
      "totalSlots": 10,
      "activeSlots": 10,
      "totalCapacity": 50,
      "allocatedTokens": 35,
      "availableCapacity": 15
    },
    "utilization": {
      "overall": "70.00",
      "byDoctor": {
        "DOC001": "75.00",
        "DOC002": "80.00",
        "DOC003": "65.00"
      }
    },
    "tokens": {
      "total": 35,
      "byType": {
        "ONLINE_BOOKING": 15,
        "WALK_IN": 10,
        "PAID_PRIORITY": 3,
        "FOLLOW_UP": 5,
        "EMERGENCY": 2
      },
      "byState": {
        "ALLOCATED": 20,
        "CHECKED_IN": 5,
        "CONSULTED": 8,
        "CANCELLED": 2,
        "NO_SHOW": 0
      }
    },
    "doctors": [...]
  }
}
```

### 2. Doctor-Specific Dashboard

```bash
curl "http://localhost:3000/api/dashboard/doctor/DOC001?date=2025-01-30"
```

### 3. Real-Time Queue Status

```bash
curl http://localhost:3000/api/dashboard/realtime
```

**Response:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-30T10:30:00.000Z",
    "activeSlots": [
      {
        "slot": {...},
        "queue": {
          "waiting": 3,
          "consulted": 2,
          "cancelled": 1,
          "noShow": 0
        },
        "currentToken": {
          "tokenNumber": 3,
          "patientName": "Current Patient",
          "state": "CHECKED_IN"
        },
        "nextTokens": [
          {
            "tokenNumber": 4,
            "patientName": "Next Patient",
            "estimatedTime": "09:45"
          },
          ...
        ]
      }
    ]
  }
}
```

---

## Edge Case Testing

### Test 1: Slot Capacity Full

```bash
# First, fill the slot to capacity
# Assuming slot has capacity 4, allocate 4 tokens

# Try to allocate 5th token (should fail)
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P999",
    "patientName": "Should Fail",
    "tokenType": "WALK_IN",
    "phoneNumber": "9999999999",
    "date": "2025-01-30"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "error": "Slot capacity full"
}
```

### Test 2: Emergency Reallocation

```bash
# After slot is full, try emergency allocation
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "PEMR001",
    "patientName": "Emergency Patient",
    "tokenType": "EMERGENCY",
    "phoneNumber": "9999999998",
    "date": "2025-01-30",
    "notes": "CRITICAL: Cardiac emergency"
  }'
```

**Expected:**

- Lowest priority unchecked token gets reallocated
- Emergency token gets allocated
- Both tokens updated with new times

### Test 3: Cancellation Impact

```bash
# 1. Get a token ID from previous allocations
# 2. Cancel it
curl -X PATCH http://localhost:3000/api/tokens/{tokenId}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Patient cancelled"}'

# 3. Check slot - capacity should decrease
curl http://localhost:3000/api/slots/{slotId}

# 4. Check other tokens - numbers should be renumbered
```

### Test 4: Delay Propagation

```bash
# 1. Add 20 minute delay
curl -X PATCH http://localhost:3000/api/slots/{slotId}/delay \
  -H "Content-Type: application/json" \
  -d '{"delayMinutes": 20}'

# 2. Get slot details to see updated times
curl http://localhost:3000/api/slots/{slotId}

# All tokens' estimated times should increase by 20 minutes
```

### Test 5: Invalid State Transition

```bash
# 1. Get a cancelled token ID
# 2. Try to check it in (should fail)
curl -X PATCH http://localhost:3000/api/tokens/{cancelledTokenId}/checkin
```

**Expected Response:**

```json
{
  "success": false,
  "error": "Cannot check in token in state: CANCELLED"
}
```

### Test 6: No Available Slots

```bash
# Try to book for a doctor with no slots
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC999",
    "patientId": "P888",
    "patientName": "No Slots Patient",
    "tokenType": "WALK_IN",
    "phoneNumber": "8888888888",
    "date": "2025-01-30"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "error": "No available slots found"
}
```

---

## Complete Test Flow

### Scenario: Full OPD Day

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Setting up slots ==="
curl -X POST $BASE_URL/slots/bulk -H "Content-Type: application/json" -d '{
  "slots": [
    {"doctorId": "DOC001", "doctorName": "Dr. Sharma", "startTime": "09:00", "endTime": "10:00", "maxCapacity": 4, "date": "2025-01-30"},
    {"doctorId": "DOC001", "doctorName": "Dr. Sharma", "startTime": "10:00", "endTime": "11:00", "maxCapacity": 4, "date": "2025-01-30"}
  ]
}'

echo -e "\n\n=== Allocating online booking ==="
curl -X POST $BASE_URL/tokens/allocate -H "Content-Type: application/json" -d '{
  "doctorId": "DOC001",
  "patientId": "P001",
  "patientName": "Patient 1",
  "tokenType": "ONLINE_BOOKING",
  "phoneNumber": "9876543210",
  "date": "2025-01-30"
}'

echo -e "\n\n=== Allocating walk-in ==="
curl -X POST $BASE_URL/tokens/allocate -H "Content-Type: application/json" -d '{
  "doctorId": "DOC001",
  "patientId": "P002",
  "patientName": "Patient 2",
  "tokenType": "WALK_IN",
  "phoneNumber": "9876543211",
  "date": "2025-01-30"
}'

echo -e "\n\n=== Checking dashboard ==="
curl "$BASE_URL/dashboard?date=2025-01-30"

echo -e "\n\n=== Real-time queue ==="
curl $BASE_URL/dashboard/realtime
```

---

## Common Issues and Solutions

### Issue: "Slot not found"

**Solution**: Create slots first using bulk creation endpoint

### Issue: "Slot capacity full"

**Solution**: Either cancel a token or use emergency token type

### Issue: "Cannot check in token in state: CANCELLED"

**Solution**: Token state transitions are one-way, get a new token

### Issue: "No available slots found"

**Solution**: Check if doctor has active slots for that date

---

For complete simulation: `npm run simulate`
