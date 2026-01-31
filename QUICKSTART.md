# Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd opd-token-system
npm install
```

### Step 2: Start the Server

```bash
npm start
```

### Step 3: Run the Complete Simulation

Open a new terminal and run:

```bash
npm run simulate
```

### Step 4: Explore the API

#### Check Health

```bash
curl http://localhost:3000/health
```

#### View API Documentation

Open in browser: http://localhost:3000/

#### Create a Test Slot

```bash
curl -X POST http://localhost:3000/api/slots \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "doctorName": "Dr. Test",
    "startTime": "09:00",
    "endTime": "10:00",
    "maxCapacity": 5,
    "date": "2025-01-31"
  }'
```

#### Allocate a Token

```bash
curl -X POST http://localhost:3000/api/tokens/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "patientId": "P001",
    "patientName": "Test Patient",
    "tokenType": "WALK_IN",
    "phoneNumber": "9876543210",
    "date": "2025-01-31"
  }'
```

#### View Dashboard

```bash
curl http://localhost:3000/api/dashboard?date=2025-01-31
```

---

## Key Features Demonstrated

### 1. **Token Allocation**

- Multiple token types with priority
- Automatic slot selection
- Time estimation

### 2. **Dynamic Reallocation**

- Emergency patient handling
- Lower priority token reallocation
- Automatic time recalculation

### 3. **Edge Case Handling**

- Patient cancellations
- Doctor delays
- No-show management
- Capacity overflow

### 4. **Real-time Monitoring**

- Live dashboard
- Queue status
- Utilization metrics

---

## Sample API Responses

### Successful Token Allocation

```json
{
  "success": true,
  "data": {
    "token": {
      "id": "abc-123",
      "tokenNumber": 1,
      "patientName": "Test Patient",
      "tokenType": "WALK_IN",
      "state": "ALLOCATED",
      "estimatedTime": "09:00",
      "priority": 1
    },
    "slot": {
      "doctorName": "Dr. Test",
      "startTime": "09:00",
      "endTime": "10:00",
      "currentCapacity": 1,
      "maxCapacity": 5,
      "availableSlots": 4
    },
    "message": "Token allocated successfully"
  }
}
```

### Dashboard Response

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSlots": 10,
      "totalCapacity": 50,
      "allocatedTokens": 35,
      "utilizationPercentage": "70.00"
    },
    "tokens": {
      "byType": {
        "ONLINE_BOOKING": 15,
        "WALK_IN": 10,
        "PAID_PRIORITY": 3,
        "FOLLOW_UP": 5,
        "EMERGENCY": 2
      }
    }
  }
}
```

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Can create slots
- [ ] Can allocate tokens
- [ ] Priority system works
- [ ] Cancellation frees capacity
- [ ] Delay updates times
- [ ] Emergency reallocation works
- [ ] Dashboard shows statistics
- [ ] Simulation completes successfully

---

## Common Commands

### Development

```bash
npm run dev          # Start with auto-reload
npm start           # Start production mode
npm run simulate    # Run full simulation
```

### Testing

```bash
# Health check
curl http://localhost:3000/health

# Create slot
curl -X POST http://localhost:3000/api/slots -H "Content-Type: application/json" -d '...'

# Allocate token
curl -X POST http://localhost:3000/api/tokens/allocate -H "Content-Type: application/json" -d '...'

# Dashboard
curl http://localhost:3000/api/dashboard
```

---

## Next Steps

1. Run the simulation to see the complete system in action
2. Read README.md for detailed documentation
3. Explore ALGORITHM.md for algorithm details
4. Try API_EXAMPLES.md for testing scenarios

---

## Support

For detailed documentation:

- **README.md** - Complete system documentation
- **ALGORITHM.md** - Algorithm and complexity analysis
- **API_EXAMPLES.md** - API testing guide

---
