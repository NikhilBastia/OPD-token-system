const express = require('express');
const cors = require('cors');
require('dotenv').config();

const AllocationEngine = require('./engine/AllocationEngine');
const TokenStore = require('./stores/TokenStore');
const SlotStore = require('./stores/SlotStore');

const tokenRoutes = require('./routes/tokenRoutes');
const slotRoutes = require('./routes/slotRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize stores and engine
const tokenStore = new TokenStore();
const slotStore = new SlotStore();
const allocationEngine = new AllocationEngine(tokenStore, slotStore);

// Initialize routes with dependencies
tokenRoutes.init(allocationEngine);
slotRoutes.init(allocationEngine);
dashboardRoutes.init(allocationEngine);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/tokens', tokenRoutes.router);
app.use('/api/slots', slotRoutes.router);
app.use('/api/dashboard', dashboardRoutes.router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OPD Token Allocation Engine is running',
    timestamp: new Date(),
    stats: {
      totalSlots: slotStore.getAllSlots().length,
      totalTokens: tokenStore.getAllTokens().length,
      activeSlots: slotStore.getActiveSlots().length
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MEDOC OPD Token Allocation Engine API',
    version: '1.0.0',
    endpoints: {
      tokens: {
        allocate: 'POST /api/tokens/allocate',
        get: 'GET /api/tokens/:tokenId',
        checkin: 'PATCH /api/tokens/:tokenId/checkin',
        complete: 'PATCH /api/tokens/:tokenId/complete',
        cancel: 'PATCH /api/tokens/:tokenId/cancel',
        noShow: 'PATCH /api/tokens/:tokenId/no-show',
        byDoctor: 'GET /api/tokens/doctor/:doctorId'
      },
      slots: {
        create: 'POST /api/slots',
        get: 'GET /api/slots/:slotId',
        byDoctor: 'GET /api/slots/doctor/:doctorId',
        byDate: 'GET /api/slots/date/:date',
        delay: 'PATCH /api/slots/:slotId/delay',
        activate: 'PATCH /api/slots/:slotId/activate',
        deactivate: 'PATCH /api/slots/:slotId/deactivate',
        bulk: 'POST /api/slots/bulk'
      },
      dashboard: {
        overview: 'GET /api/dashboard',
        byDoctor: 'GET /api/dashboard/doctor/:doctorId',
        realtime: 'GET /api/dashboard/realtime'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🏥 MEDOC OPD Token Allocation Engine');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
  console.log('='.repeat(60));
});

// Export for testing
module.exports = { app, allocationEngine, tokenStore, slotStore };
