const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import config
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

// Import routes
const organizerRoutes = require('./routes/organizer');
const eventRoutes = require('./routes/event');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const bannerRoutes = require('./routes/banner');
const adminRoutes = require('./routes/admin');
const organizerMessagesRoutes = require('./routes/organizerMessages');
const notificationsRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:19006',
    'https://eventoback-1.onrender.com',
    'https://eventoback-1.onrender.com/api'

    // Add your production frontend URL here, e.g. 'https://your-frontend-domain.com'
    // Remove all unnecessary origins for production
    // 'exp://localhost:19000',
    // 'exp://127.0.0.1:19000'
    // '*' // Wildcard removed for production security
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Initialize Firebase Admin SDK
initializeFirebase();

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/organizer', organizerMessagesRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Eventopia API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Eventopia API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      organizers: '/api/organizers',
      events: '/api/events'
    }
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Eventopia API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Local: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: http://192.168.1.2:${PORT}/api/health`);
  console.log(`📱 Mobile can connect to: http://192.168.1.2:${PORT}/api`);
});
