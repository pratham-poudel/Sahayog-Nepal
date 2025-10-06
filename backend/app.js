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
app.use(cors({
  origin: ['http://localhost:5173','sahayognepal.org','https://sahayognepal.org','https://www.sahayognepal.org'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));

app.use(express.json());
app.use(logger('dev'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Apply global rate limiting to all API routes
const { globalApiLimiter } = require('./middlewares/advancedRateLimiter');
app.use('/api/', globalApiLimiter);

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
const uploadRoutes = require('./routes/uploadRoutes');
const statsRoutes = require('./routes/statsRoutes');
const imageProxy = require('./routes/imageProxy');
const exploreRoutes = require('./routes/exploreRoutes');


app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);
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