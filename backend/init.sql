CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);


-- Sample bakery products
INSERT INTO products (name, description, price, image_url, available) VALUES
('Chocolate Cake', 'Chocolate cake with chocolate ganache', 24.99, '/images/cc.jpg', TRUE),
('Strawberry Cake', 'Cake with fresh strawberries', 22.99, '/images/sc.jpg', TRUE),
('Blueberry Cheesecake', 'Creamy cheesecake with blueberry', 26.99, '/images/bcc.jpg', TRUE),
('Biscoff Cheesecake', 'Classic cheesecake with Biscoff cookies and spread', 28.99, '/images/bicc.jpg', TRUE),
('Multigrain Bread', 'Healthy bread made with seven different grains', 6.99, '/images/mb.jpg', TRUE);
