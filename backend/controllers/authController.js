import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'vds_village_delivery_secret_key_jwt_2026_super_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const VALID_ROLES = ['customer', 'shopkeeper', 'delivery_partner', 'admin'];

/**
 * Register a new user (Customer, Shopkeeper, Delivery Partner, Admin)
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { full_name, email, phone, password, role = 'customer' } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: full_name, email, phone, and password are required',
        error: 'Missing required signup fields',
      });
    }

    // Validate role
    const normalizedRole = role.toLowerCase().trim();
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`,
        error: 'Invalid role parameter',
      });
    }

    // Check if email or phone already exists
    const existingUser = await query(
      `SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2`,
      [email.toLowerCase().trim(), phone.trim()]
    );

    if (existingUser.rows.length > 0) {
      const match = existingUser.rows[0];
      const conflictField = match.email === email.toLowerCase().trim() ? 'Email' : 'Phone number';
      return res.status(409).json({
        success: false,
        message: `${conflictField} is already registered. Please login with your password.`,
        error: 'Duplicate user conflict',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into PostgreSQL
    const insertRes = await query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name.trim(), email.toLowerCase().trim(), phone.trim(), hashedPassword, normalizedRole]
    );

    const newUser = insertRes.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: `Account created successfully as ${newUser.role}`,
      token,
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: err.message,
    });
  }
};

/**
 * User login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    const identifier = phone || email;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number (or email) and password',
        error: 'Missing login credentials',
      });
    }

    // Find user by phone or email
    const userRes = await query(
      `SELECT id, full_name, email, phone, password, role, created_at
       FROM users
       WHERE phone = $1 OR email = $1`,
      [identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this phone/email.',
        error: 'Authentication failed',
      });
    }

    const user = userRes.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
        error: 'Authentication failed',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: err.message,
    });
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const userRes = await query(
      `SELECT id, full_name, email, phone, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: 'User not found in database',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: userRes.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: err.message,
    });
  }
};

/**
 * Admin: Get all users
 * GET /api/auth/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let sql = `SELECT id, full_name, email, phone, role, created_at FROM users`;
    const params = [];

    if (role) {
      sql += ` WHERE role = $1`;
      params.push(role);
    }

    sql += ` ORDER BY created_at DESC`;

    const usersRes = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: usersRes.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users',
      error: err.message,
    });
  }
};

/**
 * Admin: Update user role
 * PUT /api/auth/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`,
        error: 'Invalid role',
      });
    }

    const result = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, phone, role`,
      [role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'No user with this ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to "${role}" successfully`,
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating user role',
      error: err.message,
    });
  }
};

/**
 * Admin: Delete user
 * DELETE /api/auth/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account',
        error: 'Self-deletion forbidden',
      });
    }

    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id, full_name`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'No user with this ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: err.message,
    });
  }
};
