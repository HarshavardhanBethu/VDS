import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'vds_db',
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Helper method for single queries
export const query = (text, params) => pool.query(text, params);

// Initialize Database (Schema & Seeds)
export const initDatabase = async () => {
  let adminClient;
  try {
    // 1. First ensure database exists by connecting to 'postgres' default database
    adminClient = new Pool({
      user: dbConfig.user,
      password: dbConfig.password,
      host: dbConfig.host,
      port: dbConfig.port,
      database: 'postgres',
    });

    const checkDbRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`Database '${dbConfig.database}' does not exist. Creating...`);
      await adminClient.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database '${dbConfig.database}' created successfully.`);
    }
  } catch (err) {
    console.warn(`Note: Could not check/create database automatically (${err.message}). Proceeding with direct connection...`);
  } finally {
    if (adminClient) {
      await adminClient.end().catch(() => {});
    }
  }

  // 2. Run schema and seed scripts on the target database
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('✅ PostgreSQL Schema initialized successfully.');
    }

    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
      console.log('✅ Base Categories seeded successfully.');
    }

    // 3. Check and seed demo users & sample shops/products if empty
    await seedDemoData();

  } catch (err) {
    console.error('❌ Error initializing database schema/seeds:', err.message);
  }
};

const seedDemoData = async () => {
  try {
    const userCountRes = await pool.query('SELECT count(*) FROM users');
    if (parseInt(userCountRes.rows[0].count, 10) > 0) {
      return; // Already seeded
    }

    console.log('🌱 Seeding demo users, shops, products, and addresses...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert Demo Users
    // 1. Admin
    const adminRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Village Admin', 'admin@vds.village', '9000000001', hashedPassword, 'admin']
    );
    const adminId = adminRes.rows[0].id;

    // 2. Shopkeeper 1 (Grocery)
    const shopkeeper1Res = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Ramesh Kumar', 'ramesh@kirana.village', '9876543210', hashedPassword, 'shopkeeper']
    );
    const shopkeeper1Id = shopkeeper1Res.rows[0].id;

    // 3. Shopkeeper 2 (Vegetables & Dairy)
    const shopkeeper2Res = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Lakshmi Devi', 'lakshmi@freshmart.village', '9876543211', hashedPassword, 'shopkeeper']
    );
    const shopkeeper2Id = shopkeeper2Res.rows[0].id;

    // 4. Customer
    const customerRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Suresh Patel', 'suresh@customer.village', '9876543212', hashedPassword, 'customer']
    );
    const customerId = customerRes.rows[0].id;

    // 5. Delivery Partner
    const deliveryRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Raju Delivery', 'raju@delivery.village', '9876543213', hashedPassword, 'delivery_partner']
    );

    // Fetch category IDs
    const groceryCat = await pool.query(`SELECT id FROM shop_categories WHERE name = 'Grocery' LIMIT 1`);
    const fruitsCat = await pool.query(`SELECT id FROM shop_categories WHERE name = 'Fruits & Vegetables' LIMIT 1`);
    const dairyCat = await pool.query(`SELECT id FROM shop_categories WHERE name = 'Dairy' LIMIT 1`);
    const pharmacyCat = await pool.query(`SELECT id FROM shop_categories WHERE name = 'Pharmacy' LIMIT 1`);

    const staplesProdCat = await pool.query(`SELECT id FROM product_categories WHERE name = 'Staples & Grains' LIMIT 1`);
    const vegProdCat = await pool.query(`SELECT id FROM product_categories WHERE name = 'Fresh Vegetables' LIMIT 1`);
    const fruitProdCat = await pool.query(`SELECT id FROM product_categories WHERE name = 'Fresh Fruits' LIMIT 1`);
    const dairyProdCat = await pool.query(`SELECT id FROM product_categories WHERE name = 'Milk & Curd' LIMIT 1`);
    const snacksProdCat = await pool.query(`SELECT id FROM product_categories WHERE name = 'Breads & Snacks' LIMIT 1`);

    // Insert Sample Shops
    const shop1Res = await pool.query(
      `INSERT INTO shops (
        owner_id, category_id, shop_name, description, phone, email,
        address_line, village, mandal, district, state, pincode,
        opening_time, closing_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14
      ) RETURNING id`,
      [
        shopkeeper1Id,
        groceryCat.rows[0]?.id,
        'Ramesh Kirana & General Store',
        'Daily essentials, pulses, rice, oils, and packaged foods at best village prices.',
        '9876543210',
        'ramesh@kirana.village',
        'Main Bazaar Road, Near Panchayat Office',
        'Ananthagiri',
        'Vikarabad',
        'Vikarabad',
        'Telangana',
        '501101',
        '07:00:00',
        '21:00:00',
      ]
    );
    const shop1Id = shop1Res.rows[0].id;

    const shop2Res = await pool.query(
      `INSERT INTO shops (
        owner_id, category_id, shop_name, description, phone, email,
        address_line, village, mandal, district, state, pincode,
        opening_time, closing_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14
      ) RETURNING id`,
      [
        shopkeeper2Id,
        fruitsCat.rows[0]?.id,
        'Lakshmi Farm Fresh & Dairy',
        'Farm-fresh vegetables, organic local fruits, fresh cow milk, and dairy products.',
        '9876543211',
        'lakshmi@freshmart.village',
        'Temple Street, Cross Roads',
        'Ananthagiri',
        'Vikarabad',
        'Vikarabad',
        'Telangana',
        '501101',
        '06:00:00',
        '20:00:00',
      ]
    );
    const shop2Id = shop2Res.rows[0].id;

    // Insert Products for Shop 1 (Grocery)
    await pool.query(
      `INSERT INTO products (
        shop_id, category_id, product_name, description, brand, unit,
        price, mrp, stock_quantity, image_url, is_available
      ) VALUES
      ($1, $2, 'Sona Masoori Rice', 'Finest aged village Sona Masoori rice 5kg pack', 'Farmer Direct', '5 kg', 280.00, 320.00, 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60', true),
      ($1, $2, 'Toor Dal (Pigeon Peas)', 'High protein unpolished toor dal', 'Village Brand', '1 kg', 145.00, 165.00, 60, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=60', true),
      ($1, $2, 'Pure Sunflower Oil', 'Refined healthy cooking oil', 'Fortune', '1 Litre', 135.00, 150.00, 30, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60', true),
      ($1, $3, 'Traditional Tea Biscuits', 'Crisp morning tea biscuits', 'Parle-G', '250 g', 30.00, 35.00, 100, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60', true),
      ($1, $2, 'Tata Salt Vacuum Evaporated', 'Iodized cooking salt', 'Tata', '1 kg', 26.00, 28.00, 80, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60', true)
      `,
      [shop1Id, staplesProdCat.rows[0]?.id, snacksProdCat.rows[0]?.id]
    );

    // Insert Products for Shop 2 (Vegetables & Dairy)
    await pool.query(
      `INSERT INTO products (
        shop_id, category_id, product_name, description, brand, unit,
        price, mrp, stock_quantity, image_url, is_available
      ) VALUES
      ($1, $2, 'Farm Fresh Tomatoes', 'Ripe local village red tomatoes', 'Local Farm', '1 kg', 35.00, 40.00, 50, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60', true),
      ($1, $2, 'Organic Red Onions', 'Freshly harvested pungent red onions', 'Local Farm', '1 kg', 40.00, 45.00, 70, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=60', true),
      ($1, $2, 'Green Chili & Coriander Combo', 'Spicy green chilies with fragrant fresh coriander bunch', 'Local Farm', '250 g', 25.00, 30.00, 40, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=60', true),
      ($1, $3, 'Fresh Cow Milk', 'Pure unadulterated village dairy cow milk', 'Ananthagiri Dairy', '1 Litre', 55.00, 60.00, 35, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60', true),
      ($1, $4, 'Fresh Village Bananas', 'Sweet Yelakki bananas freshly cut', 'Farm Direct', '1 Dozen', 50.00, 60.00, 25, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60', true)
      `,
      [shop2Id, vegProdCat.rows[0]?.id, dairyProdCat.rows[0]?.id, fruitProdCat.rows[0]?.id]
    );

    // Insert Sample Address for Customer
    await pool.query(
      `INSERT INTO customer_addresses (
        customer_id, full_name, phone, address_line, village, mandal, district, state, pincode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        customerId,
        'Suresh Patel',
        '9876543212',
        'House No. 3-45, Near Primary School',
        'Ananthagiri',
        'Vikarabad',
        'Vikarabad',
        'Telangana',
        '501101',
      ]
    );

    console.log('✅ Demo users, shops, products, and address successfully seeded!');
  } catch (err) {
    console.error('❌ Error during demo data seeding:', err.message);
  }
};

