import { query } from '../config/db.js';

/**
 * Get all shops with optional search and filters
 * GET /api/shops?search=&category_id=&village=
 */
export const getShops = async (req, res) => {
  try {
    const { search, category_id, village } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.owner_id,
        s.category_id,
        sc.name AS category_name,
        s.shop_name,
        s.description,
        s.phone,
        s.email,
        s.address_line,
        s.village,
        s.mandal,
        s.district,
        s.state,
        s.pincode,
        s.latitude,
        s.longitude,
        s.opening_time,
        s.closing_time,
        s.created_at,
        u.full_name AS owner_name,
        COUNT(p.id) AS total_products
      FROM shops s
      LEFT JOIN shop_categories sc ON s.category_id = sc.id
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN products p ON s.id = p.shop_id AND p.is_available = true
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (s.shop_name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.village ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND s.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (village) {
      sql += ` AND s.village ILIKE $${paramIndex}`;
      params.push(`%${village}%`);
      paramIndex++;
    }

    sql += ` GROUP BY s.id, sc.name, u.full_name ORDER BY s.created_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Shops retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching shops:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching shops',
      error: err.message,
    });
  }
};

/**
 * Get shop by ID with category and owner details
 * GET /api/shops/:id
 */
export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        s.id,
        s.owner_id,
        s.category_id,
        sc.name AS category_name,
        s.shop_name,
        s.description,
        s.phone,
        s.email,
        s.address_line,
        s.village,
        s.mandal,
        s.district,
        s.state,
        s.pincode,
        s.latitude,
        s.longitude,
        s.opening_time,
        s.closing_time,
        s.created_at,
        u.full_name AS owner_name,
        u.phone AS owner_phone
      FROM shops s
      LEFT JOIN shop_categories sc ON s.category_id = sc.id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
        error: 'No shop exists with the specified ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Shop details retrieved successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shop details',
      error: err.message,
    });
  }
};

/**
 * Get shops owned by the logged-in user (Shopkeeper)
 * GET /api/shops/owner/me
 */
export const getMyShops = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.id,
        s.owner_id,
        s.category_id,
        sc.name AS category_name,
        s.shop_name,
        s.description,
        s.phone,
        s.email,
        s.address_line,
        s.village,
        s.mandal,
        s.district,
        s.state,
        s.pincode,
        s.opening_time,
        s.closing_time,
        s.created_at,
        COUNT(p.id) AS total_products
      FROM shops s
      LEFT JOIN shop_categories sc ON s.category_id = sc.id
      LEFT JOIN products p ON s.id = p.shop_id
      WHERE s.owner_id = $1
      GROUP BY s.id, sc.name
      ORDER BY s.created_at DESC
    `;

    const result = await query(sql, [req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'User shops retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching user shops',
      error: err.message,
    });
  }
};

/**
 * Create a new shop
 * POST /api/shops
 */
export const createShop = async (req, res) => {
  try {
    const {
      category_id,
      shop_name,
      description,
      phone,
      email,
      address_line,
      village,
      mandal,
      district,
      state = 'Telangana',
      pincode,
      latitude,
      longitude,
      opening_time = '08:00:00',
      closing_time = '21:00:00',
    } = req.body;

    if (!shop_name || !village) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: shop_name and village are required',
        error: 'Missing required shop fields',
      });
    }

    const owner_id = req.user.role === 'admin' && req.body.owner_id ? req.body.owner_id : req.user.id;

    const sql = `
      INSERT INTO shops (
        owner_id, category_id, shop_name, description, phone, email,
        address_line, village, mandal, district, state, pincode,
        latitude, longitude, opening_time, closing_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16
      ) RETURNING *
    `;

    const params = [
      owner_id,
      category_id || null,
      shop_name.trim(),
      description || null,
      phone || null,
      email || null,
      address_line || null,
      village.trim(),
      mandal || null,
      district || null,
      state || null,
      pincode || null,
      latitude || null,
      longitude || null,
      opening_time || null,
      closing_time || null,
    ];

    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create shop error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating shop',
      error: err.message,
    });
  }
};

/**
 * Update shop details
 * PUT /api/shops/:id
 */
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership unless admin
    const shopCheck = await query(`SELECT owner_id FROM shops WHERE id = $1`, [id]);
    if (shopCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
        error: 'No shop found with specified ID',
      });
    }

    if (req.user.role !== 'admin' && shopCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this shop',
        error: 'Forbidden',
      });
    }

    const {
      category_id,
      shop_name,
      description,
      phone,
      email,
      address_line,
      village,
      mandal,
      district,
      state,
      pincode,
      latitude,
      longitude,
      opening_time,
      closing_time,
    } = req.body;

    const sql = `
      UPDATE shops SET
        category_id = COALESCE($1, category_id),
        shop_name = COALESCE($2, shop_name),
        description = COALESCE($3, description),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        address_line = COALESCE($6, address_line),
        village = COALESCE($7, village),
        mandal = COALESCE($8, mandal),
        district = COALESCE($9, district),
        state = COALESCE($10, state),
        pincode = COALESCE($11, pincode),
        latitude = COALESCE($12, latitude),
        longitude = COALESCE($13, longitude),
        opening_time = COALESCE($14, opening_time),
        closing_time = COALESCE($15, closing_time)
      WHERE id = $16
      RETURNING *
    `;

    const params = [
      category_id,
      shop_name,
      description,
      phone,
      email,
      address_line,
      village,
      mandal,
      district,
      state,
      pincode,
      latitude,
      longitude,
      opening_time,
      closing_time,
      id,
    ];

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error updating shop',
      error: err.message,
    });
  }
};

/**
 * Delete shop
 * DELETE /api/shops/:id
 */
export const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shopCheck = await query(`SELECT owner_id FROM shops WHERE id = $1`, [id]);
    if (shopCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
        error: 'No shop found with specified ID',
      });
    }

    if (req.user.role !== 'admin' && shopCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this shop',
        error: 'Forbidden',
      });
    }

    await query(`DELETE FROM shops WHERE id = $1`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Shop deleted successfully',
      data: { id },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting shop',
      error: err.message,
    });
  }
};

