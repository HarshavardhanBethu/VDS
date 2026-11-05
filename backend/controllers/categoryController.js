import { query } from '../config/db.js';

/**
 * Get all shop categories
 * GET /api/categories/shops
 */
export const getShopCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, created_at FROM shop_categories ORDER BY name ASC`
    );
    return res.status(200).json({
      success: true,
      message: 'Shop categories retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shop categories',
      error: err.message,
    });
  }
};

/**
 * Create a new shop category (Admin only)
 * POST /api/categories/shops
 */
export const createShopCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'Missing required field: name',
      });
    }

    const result = await query(
      `INSERT INTO shop_categories (name) VALUES ($1) RETURNING id, name, created_at`,
      [name.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Shop category created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A shop category with this name already exists',
        error: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating shop category',
      error: err.message,
    });
  }
};

/**
 * Delete a shop category (Admin only)
 * DELETE /api/categories/shops/:id
 */
export const deleteShopCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM shop_categories WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop category not found',
        error: 'No category found with specified ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shop category deleted successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting shop category',
      error: err.message,
    });
  }
};

/**
 * Get all product categories
 * GET /api/categories/products
 */
export const getProductCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, created_at FROM product_categories ORDER BY name ASC`
    );
    return res.status(200).json({
      success: true,
      message: 'Product categories retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching product categories',
      error: err.message,
    });
  }
};

/**
 * Create a new product category
 * POST /api/categories/products
 */
export const createProductCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: 'Missing required field: name',
      });
    }

    const result = await query(
      `INSERT INTO product_categories (name) VALUES ($1) RETURNING id, name, created_at`,
      [name.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Product category created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A product category with this name already exists',
        error: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating product category',
      error: err.message,
    });
  }
};

/**
 * Delete a product category (Admin only)
 * DELETE /api/categories/products/:id
 */
export const deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM product_categories WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product category not found',
        error: 'No category found with specified ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product category deleted successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting product category',
      error: err.message,
    });
  }
};

