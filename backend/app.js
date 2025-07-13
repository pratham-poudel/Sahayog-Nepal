const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('morgan');
const app = express();
const cookieParser = require('cookie-parser');
const { connectToAstraDb } = require('./db/db');
const path = require('path');
connectToAstraDb();
const cors = require('cors');
const redis = require('./utils/RedisClient');
const User = require('./models/User');
const Payment = require('./models/Payment');
const mongoose = require('mongoose');

// Configure CORS with more explicit options
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:9000', 'http://192.168.1.77:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));

app.use(express.json());
app.use(logger('dev'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Import routes
const userRoutes = require('./routes/userRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/paymentRoutes');
const blogRoutes = require('./routes/blogRoutes');
const donationRoutes = require('./routes/donationRoutes');
const topDonorsRoutes = require('./routes/topDonorsRoutes');
const bankRoutes = require('./routes/bankRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');

// Use routes
app.get('/checkdb/:userId', async (req, res) => {
  const { userId } = req.params;
  const payments =  await Payment.find();
  res.json({ message: 'Database is connected', payments });
});
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donors', topDonorsRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.get("/health", async (req, res) => {
    const dbState = mongoose.connection.readyState;
  
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
  
    res.status(dbState === 1 ? 200 : 500).json({
      status: states[dbState],
      timestamp: new Date().toISOString(),
    });
  });

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to NepalCrowdRise API' });
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