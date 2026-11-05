import express from 'express';
import {
  signup,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/authController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getProfile);
router.get('/users', verifyToken, authorizeRoles('admin'), getAllUsers);
router.put('/users/:id/role', verifyToken, authorizeRoles('admin'), updateUserRole);
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), deleteUser);

export default router;
