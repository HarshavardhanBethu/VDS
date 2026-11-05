import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  getCustomerOrders,
  updateOrderStatus,
  getMyAddresses,
  addAddress,
} from '../controllers/orderController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Address routes
router.get('/addresses/my', verifyToken, getMyAddresses);
router.post('/addresses', verifyToken, addAddress);

// Order routes
router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getOrders);
router.get('/customer/:customerId', verifyToken, getCustomerOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, updateOrderStatus);

export default router;

