import express from 'express';
import {
  getShopCategories,
  createShopCategory,
  deleteShopCategory,
  getProductCategories,
  createProductCategory,
  deleteProductCategory,
} from '../controllers/categoryController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Shop Categories
router.get('/shops', getShopCategories);
router.post('/shops', verifyToken, authorizeRoles('admin'), createShopCategory);
router.delete('/shops/:id', verifyToken, authorizeRoles('admin'), deleteShopCategory);

// Product Categories
router.get('/products', getProductCategories);
router.post('/products', verifyToken, authorizeRoles('admin', 'shopkeeper'), createProductCategory);
router.delete('/products/:id', verifyToken, authorizeRoles('admin'), deleteProductCategory);

export default router;

