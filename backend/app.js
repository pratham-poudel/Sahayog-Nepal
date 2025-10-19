const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('morgan');
const app = express();
const cookieParser = require('cookie-parser');
const connectDB = require('./db/db');
const path = require('path');
connectDB();
const cors = require('cors');
const redis = require('./utils/RedisClient');
const User = require('./models/User');
const Payment = require('./models/Payment');
const mongoose = require('mongoose');

// Configure CORS with more explicit options
app.set('trust proxy', 1); // Trust first proxy if behind a proxy (e.g., Heroku, Nginx)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://sahayognepal.org',
    'https://www.sahayognepal.org'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));


app.use(express.json());
app.use(logger('dev'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Serve static files from public directory (for templates, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ========== Bull Board Setup ==========
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const amlQueue = require('./queues/amlqueue');
const campaignCompletionQueue = require('./queues/campaignCompletionQueue');
const withdrawalReminderQueue = require('./queues/withdrawalReminderQueue');
const dailyReportQueue = require('./queues/dailyReportQueue');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(amlQueue),
    new BullMQAdapter(campaignCompletionQueue),
    new BullMQAdapter(withdrawalReminderQueue),
    new BullMQAdapter(dailyReportQueue)
  ],
  serverAdapter: serverAdapter,
});

// Basic auth middleware for Bull Board
function bullBoardAuth(req, res, next) {
  const auth = { 
    login: process.env.BULLBOARD_USER || 'admin', 
    password: process.env.BULLBOARD_PASS || 'strongpassword' 
  };
  
  const header = req.headers.authorization || '';
  const token = header.split(' ')[1] || '';
  
  if (!token) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Queue Monitoring"');
    return res.status(401).send('Authentication required');
  }
  
  const [user, pass] = Buffer.from(token, 'base64').toString().split(':');
  
  if (user === auth.login && pass === auth.password) {
    return next();
  }
  
  res.setHeader('WWW-Authenticate', 'Basic realm="Queue Monitoring"');
  res.status(401).send('Invalid credentials');
}

// Mount Bull Board with authentication
app.use('/admin/queues', bullBoardAuth, serverAdapter.getRouter());
// ========================================

// Apply global rate limiting to all API routes
const { globalApiLimiter } = require('./middlewares/advancedRateLimiter');
app.use('/api/', globalApiLimiter);

// Import routes
const userRoutes = require('./routes/userRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employeeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const blogRoutes = require('./routes/blogRoutes');
const donationRoutes = require('./routes/donationRoutes');
const topDonorsRoutes = require('./routes/topDonorsRoutes');
const bankRoutes = require('./routes/bankRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statsRoutes = require('./routes/statsRoutes');
const imageProxy = require('./routes/imageProxy');
const exploreRoutes = require('./routes/exploreRoutes');


app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donors', topDonorsRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/proxy', imageProxy);
app.use('/api/explore', exploreRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Sahayog Nepal API System' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app; 