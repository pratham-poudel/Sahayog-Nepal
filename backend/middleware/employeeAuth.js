const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const employeeAuth = async (req, res, next) => {
    try {
        // Check for token in both cookie and Authorization header
        let token = req.cookies.employeeToken;
        
        // If not in cookie, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. Please login as employee.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employee = await Employee.findById(decoded.id);

        if (!employee) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid employee credentials.' 
            });
        }

        if (!employee.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your employee account has been deactivated. Please contact admin.' 
            });
        }

        req.employee = employee;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token or session expired.' 
        });
    }
};

// Department-specific middleware
const restrictToDepartment = (...departments) => {
    return (req, res, next) => {
        if (!departments.includes(req.employee.department)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.'
            });
        }
        next();
    };
};

module.exports = { employeeAuth, restrictToDepartment };
