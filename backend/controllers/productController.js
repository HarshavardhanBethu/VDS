import { query } from '../config/db.js';

/**
 * Get all products with optional filters
 * GET /api/products?search=&category_id=&shop_id=&is_available=
 */
export const getProducts = async (req, res) => {
  try {
    const { search, category_id, shop_id, is_available } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.shop_id,
        p.category_id,
        p.product_name,
        p.description,
        p.brand,
        p.unit,
        p.price,
        p.mrp,
        p.stock_quantity,
        p.image_url,
        p.is_available,
        p.created_at,
        p.updated_at,
        pc.name AS category_name,
        s.shop_name,
        s.village AS shop_village
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN shops s ON p.shop_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (p.product_name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (shop_id) {
      sql += ` AND p.shop_id = $${paramIndex}`;
      params.push(shop_id);
      paramIndex++;
    }

    if (is_available !== undefined) {
      sql += ` AND p.is_available = $${paramIndex}`;
      params.push(is_available === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: err.message,
    });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p.id,
        p.shop_id,
        p.category_id,
        p.product_name,
        p.description,
        p.brand,
        p.unit,
        p.price,
        p.mrp,
        p.stock_quantity,
        p.image_url,
        p.is_available,
        p.created_at,
        p.updated_at,
        pc.name AS category_name,
        s.shop_name,
        s.village AS shop_village,
        s.phone AS shop_phone
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN shops s ON p.shop_id = s.id
      WHERE p.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'No product found with specified ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product details retrieved successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: err.message,
    });
  }
};

/**
 * Get all products for a specific shop
 * GET /api/products/shop/:shopId
 */
export const getProductsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const sql = `
      SELECT 
        p.id,
        p.shop_id,
        p.category_id,
        p.product_name,
        p.description,
        p.brand,
        p.unit,
        p.price,
        p.mrp,
        p.stock_quantity,
        p.image_url,
        p.is_available,
        p.created_at,
        p.updated_at,
        pc.name AS category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.shop_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await query(sql, [shopId]);

    return res.status(200).json({
      success: true,
      message: 'Shop products retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shop products',
      error: err.message,
    });
  }
};

/**
 * Create a new product
 * POST /api/products
 */
export const createProduct = async (req, res) => {
  try {
    const {
      shop_id,
      category_id,
      product_name,
      description,
      brand,
      unit,
      price,
      mrp,
      stock_quantity = 0,
      image_url,
      is_available = true,
    } = req.body;

    if (!shop_id || !product_name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: shop_id, product_name, and price are required',
        error: 'Missing required product fields',
      });
    }

    // Verify shop ownership unless admin
    const shopCheck = await query(`SELECT owner_id FROM shops WHERE id = $1`, [shop_id]);
    if (shopCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
        error: 'Specified shop does not exist',
      });
    }

    if (req.user.role !== 'admin' && shopCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this shop',
        error: 'Forbidden',
      });
    }

    const sql = `
      INSERT INTO products (
        shop_id, category_id, product_name, description, brand, unit,
        price, mrp, stock_quantity, image_url, is_available
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    const params = [
      shop_id,
      category_id || null,
      product_name.trim(),
      description || null,
      brand || null,
      unit || null,
      parseFloat(price),
      mrp ? parseFloat(mrp) : null,
      parseInt(stock_quantity, 10) || 0,
      image_url || null,
      Boolean(is_available),
    ];

    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: err.message,
    });
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check product and shop ownership
    const prodCheck = await query(
      `SELECT p.id, p.shop_id, s.owner_id 
       FROM products p 
       JOIN shops s ON p.shop_id = s.id 
       WHERE p.id = $1`,
      [id]
    );

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'No product found with specified ID',
      });
    }

    if (req.user.role !== 'admin' && prodCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own the shop containing this product',
        error: 'Forbidden',
      });
    }

    const {
      category_id,
      product_name,
      description,
      brand,
      unit,
      price,
      mrp,
      stock_quantity,
      image_url,
      is_available,
    } = req.body;

    const sql = `
      UPDATE products SET
        category_id = COALESCE($1, category_id),
        product_name = COALESCE($2, product_name),
        description = COALESCE($3, description),
        brand = COALESCE($4, brand),
        unit = COALESCE($5, unit),
        price = COALESCE($6, price),
        mrp = COALESCE($7, mrp),
        stock_quantity = COALESCE($8, stock_quantity),
        image_url = COALESCE($9, image_url),
        is_available = COALESCE($10, is_available),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const params = [
      category_id,
      product_name ? product_name.trim() : null,
      description,
      brand,
      unit,
      price !== undefined ? parseFloat(price) : null,
      mrp !== undefined ? parseFloat(mrp) : null,
      stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
      image_url,
      is_available !== undefined ? Boolean(is_available) : null,
      id,
    ];

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: err.message,
    });
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const prodCheck = await query(
      `SELECT p.id, p.shop_id, s.owner_id 
       FROM products p 
       JOIN shops s ON p.shop_id = s.id 
       WHERE p.id = $1`,
      [id]
    );

    if (prodCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'No product found with specified ID',
      });
    }

    if (req.user.role !== 'admin' && prodCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own the shop containing this product',
        error: 'Forbidden',
      });
    }

    await query(`DELETE FROM products WHERE id = $1`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: err.message,
    });
  }
};

