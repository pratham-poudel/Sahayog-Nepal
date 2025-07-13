const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. Please login.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid admin credentials.' 
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token or session expired.' 
        });
    }
};

module.exports = adminAuth; 