const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // Check if token exists in cookies
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'You are not logged in. Please log in to get access.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from database
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token or token expired'
        });
    }
};

// Role based access control
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

// Admin middleware
exports.admin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
}; 