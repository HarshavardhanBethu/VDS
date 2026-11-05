import express from 'express';
import {
  getShops,
  getShopById,
  getMyShops,
  createShop,
  updateShop,
  deleteShop,
} from '../controllers/shopController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getShops);
router.get('/:id', getShopById);

// Protected routes (Shopkeeper / Admin)
router.get('/owner/me', verifyToken, authorizeRoles('shopkeeper', 'admin'), getMyShops);
router.post('/', verifyToken, authorizeRoles('shopkeeper', 'admin'), createShop);
router.put('/:id', verifyToken, authorizeRoles('shopkeeper', 'admin'), updateShop);
router.delete('/:id', verifyToken, authorizeRoles('shopkeeper', 'admin'), deleteShop);

export default router;

