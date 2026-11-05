import { pool, query } from '../config/db.js';

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

/**
 * Helper to generate unique order number
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VDS-${dateStr}-${randomSuffix}`;
};

/**
 * Create a new order with PostgreSQL transaction
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const customer_id = req.user.id;
    const {
      shop_id,
      address_id,
      new_address, // Optional inline address creation
      items,
      payment_method = 'Cash on Delivery',
      customer_note = '',
    } = req.body;

    if (!shop_id || (!address_id && !new_address) || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: shop_id, address, and items are required',
        error: 'Missing required order fields',
      });
    }

    await client.query('BEGIN');

    // 1. Resolve Address
    let finalAddressId = address_id;
    if (!finalAddressId && new_address) {
      const { full_name, phone, address_line, village, mandal, district, state = 'Telangana', pincode } = new_address;
      if (!full_name || !phone || !address_line || !village) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Complete address details (full_name, phone, address_line, village) are required',
          error: 'Incomplete address',
        });
      }

      const addrRes = await client.query(
        `INSERT INTO customer_addresses (
          customer_id, full_name, phone, address_line, village, mandal, district, state, pincode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [customer_id, full_name, phone, address_line, village, mandal || null, district || null, state || null, pincode || null]
      );
      finalAddressId = addrRes.rows[0].id;
    } else {
      // Verify address exists and belongs to customer
      const addrCheck = await client.query(
        `SELECT id FROM customer_addresses WHERE id = $1 AND customer_id = $2`,
        [finalAddressId, customer_id]
      );
      if (addrCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Address not found or does not belong to you',
          error: 'Invalid address_id',
        });
      }
    }

    // 2. Validate Shop
    const shopCheck = await client.query(`SELECT id, shop_name FROM shops WHERE id = $1`, [shop_id]);
    if (shopCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
        error: 'Invalid shop_id',
      });
    }

    // 3. Validate and Calculate Items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      const qty = parseInt(quantity, 10);

      if (!product_id || isNaN(qty) || qty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Invalid product quantity for product ${product_id}`,
          error: 'Invalid product quantity',
        });
      }

      // Query product with row lock for update
      const prodRes = await client.query(
        `SELECT id, shop_id, product_name, price, stock_quantity, is_available 
         FROM products 
         WHERE id = $1 FOR UPDATE`,
        [product_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Product ${product_id} not found`,
          error: 'Product not found',
        });
      }

      const product = prodRes.rows[0];

      if (product.shop_id !== shop_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Product "${product.product_name}" does not belong to the selected shop`,
          error: 'Cross-shop item mismatch',
        });
      }

      if (!product.is_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Product "${product.product_name}" is currently unavailable`,
          error: 'Product unavailable',
        });
      }

      if (product.stock_quantity < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.product_name}". Only ${product.stock_quantity} available.`,
          error: 'Out of stock',
        });
      }

      const unitPrice = parseFloat(product.price);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.product_name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
      });
    }

    // 4. Calculate delivery fee & discount
    // Flat ₹20 delivery fee for village hyperlocal, free for orders above ₹500
    const delivery_fee = subtotal >= 500 ? 0.00 : 20.00;
    const discount = 0.00;
    const total_amount = subtotal + delivery_fee - discount;
    const order_number = generateOrderNumber();
    const payment_status = payment_method === 'Online Payment' ? 'paid' : 'pending';

    // 5. Insert into orders table using customer_id (NEVER user_id)
    const orderSql = `
      INSERT INTO orders (
        customer_id, shop_id, address_id, order_number, status,
        subtotal, delivery_fee, discount, total_amount,
        payment_method, payment_status, customer_note
      ) VALUES (
        $1, $2, $3, $4, 'pending',
        $5, $6, $7, $8,
        $9, $10, $11
      ) RETURNING *
    `;

    const orderParams = [
      customer_id,
      shop_id,
      finalAddressId,
      order_number,
      subtotal,
      delivery_fee,
      discount,
      total_amount,
      payment_method,
      payment_status,
      customer_note,
    ];

    const orderRes = await client.query(orderSql, orderParams);
    const createdOrder = orderRes.rows[0];

    // 6. Insert order_items and update product stock
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          createdOrder.id,
          vItem.product_id,
          vItem.product_name,
          vItem.quantity,
          vItem.unit_price,
          vItem.total_price,
        ]
      );

      // Decrement stock
      await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - $1 
         WHERE id = $2`,
        [vItem.quantity, vItem.product_id]
      );
    }

    await client.query('COMMIT');

    createdOrder.items = validatedItems;

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: createdOrder,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error placing order',
      error: err.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Get orders list (Role-filtered)
 * GET /api/orders
 */
export const getOrders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const { status, shop_id } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.customer_id,
        o.shop_id,
        o.address_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.customer_note,
        o.placed_at,
        o.updated_at,
        s.shop_name,
        s.village AS shop_village,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        ca.address_line,
        ca.village AS delivery_village,
        ca.phone AS delivery_phone,
        COUNT(oi.id) AS total_items
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      JOIN users u ON o.customer_id = u.id
      JOIN customer_addresses ca ON o.address_id = ca.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by user role
    if (userRole === 'customer') {
      sql += ` AND o.customer_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'shopkeeper') {
      sql += ` AND s.owner_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'delivery_partner') {
      // Delivery partners see orders ready for delivery, in transit, or recently delivered
      if (!status) {
        sql += ` AND o.status IN ('ready_for_pickup', 'out_for_delivery', 'delivered')`;
      }
    }
    // Admin sees all

    if (status) {
      sql += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (shop_id) {
      sql += ` AND o.shop_id = $${paramIndex}`;
      params.push(shop_id);
      paramIndex++;
    }

    sql += ` GROUP BY o.id, s.shop_name, s.village, u.full_name, u.phone, ca.address_line, ca.village, ca.phone ORDER BY o.placed_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    console.error('Get orders error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: err.message,
    });
  }
};

/**
 * Get order details by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderSql = `
      SELECT 
        o.id,
        o.customer_id,
        o.shop_id,
        o.address_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.customer_note,
        o.placed_at,
        o.updated_at,
        s.shop_name,
        s.phone AS shop_phone,
        s.address_line AS shop_address,
        s.village AS shop_village,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email,
        ca.full_name AS recipient_name,
        ca.phone AS recipient_phone,
        ca.address_line AS delivery_address,
        ca.village AS delivery_village,
        ca.mandal AS delivery_mandal,
        ca.district AS delivery_district,
        ca.pincode AS delivery_pincode
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      JOIN users u ON o.customer_id = u.id
      JOIN customer_addresses ca ON o.address_id = ca.id
      WHERE o.id = $1
    `;

    const orderRes = await query(orderSql, [id]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'No order found with specified ID',
      });
    }

    const order = orderRes.rows[0];

    // Authorization check
    if (
      req.user.role === 'customer' &&
      order.customer_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order',
        error: 'Forbidden',
      });
    }

    // Get order items
    const itemsRes = await query(
      `SELECT 
        oi.id,
        oi.product_id,
        oi.product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.image_url,
        p.unit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC`,
      [id]
    );

    order.items = itemsRes.rows;

    return res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: err.message,
    });
  }
};

/**
 * Get orders for a specific customer
 * GET /api/orders/customer/:customerId
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Must be own customer ID or admin
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view these orders',
        error: 'Forbidden',
      });
    }

    const sql = `
      SELECT 
        o.id,
        o.customer_id,
        o.shop_id,
        o.address_id,
        o.order_number,
        o.status,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.placed_at,
        s.shop_name,
        s.village AS shop_village,
        COUNT(oi.id) AS total_items
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id, s.shop_name, s.village
      ORDER BY o.placed_at DESC
    `;

    const result = await query(sql, [customerId]);

    return res.status(200).json({
      success: true,
      message: 'Customer orders retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: err.message,
    });
  }
};

/**
 * Update order status
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        error: 'Invalid order status',
      });
    }

    // Role specific permission check
    const orderCheck = await query(
      `SELECT o.id, o.customer_id, o.shop_id, o.payment_method, s.owner_id 
       FROM orders o 
       JOIN shops s ON o.shop_id = s.id 
       WHERE o.id = $1`,
      [id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'No order found with specified ID',
      });
    }

    const order = orderCheck.rows[0];

    // Check role permission
    if (req.user.role === 'shopkeeper' && order.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own the shop for this order',
        error: 'Forbidden',
      });
    }

    if (req.user.role === 'customer' && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Customers can only cancel pending orders',
        error: 'Forbidden',
      });
    }

    // Auto-update payment status to 'paid' when delivered if COD
    let newPaymentStatus = payment_status;
    if (!newPaymentStatus && status === 'delivered' && order.payment_method === 'Cash on Delivery') {
      newPaymentStatus = 'paid';
    }

    const updateSql = `
      UPDATE orders SET
        status = $1,
        payment_status = COALESCE($2, payment_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(updateSql, [status, newPaymentStatus || null, id]);

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: err.message,
    });
  }
};

/**
 * Customer Address Management
 * GET /api/orders/addresses/my
 */
export const getMyAddresses = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching addresses',
      error: err.message,
    });
  }
};

/**
 * Add new address for customer
 * POST /api/orders/addresses
 */
export const addAddress = async (req, res) => {
  try {
    const { full_name, phone, address_line, village, mandal, district, state = 'Telangana', pincode } = req.body;

    if (!full_name || !phone || !address_line || !village) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: full_name, phone, address_line, and village are required',
        error: 'Missing required address fields',
      });
    }

    const result = await query(
      `INSERT INTO customer_addresses (
        customer_id, full_name, phone, address_line, village, mandal, district, state, pincode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, full_name, phone, address_line, village, mandal || null, district || null, state || null, pincode || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: err.message,
    });
  }
};

