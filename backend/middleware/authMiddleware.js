import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'vds_village_delivery_secret_key_jwt_2026_super_secure';

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      error: 'Authentication token is missing in Authorization header',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, full_name, email, phone, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: err.message,
    });
  }
};

/**
 * Middleware to restrict access based on user role(s)
 * @param  {...string} roles - e.g. 'admin', 'shopkeeper', 'customer', 'delivery_partner'
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to perform this action.',
        error: `Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user ? req.user.role : 'unauthenticated'}`,
      });
    }
    next();
  };
};

