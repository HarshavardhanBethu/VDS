-- Default Seed Data for Village Delivery System (VDS)

-- 1. Insert Default Shop Categories
INSERT INTO shop_categories (name)
VALUES 
    ('Grocery'),
    ('Fruits & Vegetables'),
    ('Pharmacy'),
    ('Bakery'),
    ('Dairy'),
    ('Meat & Chicken'),
    ('Electronics'),
    ('Stationery'),
    ('Clothing')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Default Product Categories
INSERT INTO product_categories (name)
VALUES 
    ('Staples & Grains'),
    ('Fresh Vegetables'),
    ('Fresh Fruits'),
    ('Milk & Curd'),
    ('Medicines & Health'),
    ('Breads & Snacks'),
    ('Beverages'),
    ('Personal Care'),
    ('Household Essentials')
ON CONFLICT (name) DO NOTHING;

