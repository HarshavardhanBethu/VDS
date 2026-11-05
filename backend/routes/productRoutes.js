import express from 'express';
import {
  getProducts,
  getProductById,
  getProductsByShop,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/shop/:shopId', getProductsByShop);
router.get('/:id', getProductById);

// Protected routes (Shopkeeper / Admin)
router.post('/', verifyToken, authorizeRoles('shopkeeper', 'admin'), createProduct);
router.put('/:id', verifyToken, authorizeRoles('shopkeeper', 'admin'), updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('shopkeeper', 'admin'), deleteProduct);

export default router;

