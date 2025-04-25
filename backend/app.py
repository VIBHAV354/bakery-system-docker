from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import pika
import json
import os
import time
import uuid

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        os.environ.get('DATABASE_URL', 'postgresql://vibhav:12345@db:5432/bakery')
    )

# RabbitMQ connection
def get_rabbitmq_connection():
    retries = 5
    while retries > 0:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=os.environ.get('RABBITMQ_HOST', 'rabbitmq'),
                    port=5672
                )
            )
            return connection
        except pika.exceptions.AMQPConnectionError:
            retries -= 1
            print(f"Failed to connect to RabbitMQ. Retries left: {retries}")
            time.sleep(5)
    raise Exception("Could not connect to RabbitMQ after several attempts")

# Ensuring that the queue exists
def setup_rabbitmq():
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.queue_declare(queue='orders')
        connection.close()
        print("RabbitMQ setup complete")
    except Exception as e:
        print(f"RabbitMQ setup failed: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First trying with available flag (if column exists)
        try:
            cur.execute("SELECT * FROM products WHERE available = TRUE ORDER BY id")
        except psycopg2.Error:
            # If available column doesn't exist, trying without it
            conn.rollback()
            cur.execute("SELECT * FROM products ORDER BY id")
            
        products = cur.fetchall()
        cur.close()
        conn.close()
        
        if not products:
            return jsonify({"warning": "No products found", "products": []}), 200
            
        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def place_order():
    try:
        data = request.json
        
        if not data or 'customer_name' not in data or 'customer_email' not in data or 'items' not in data:
            return jsonify({"error": "Missing required order information"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Insert order
        cur.execute(
            "INSERT INTO orders (customer_name, customer_email) VALUES (%s, %s) RETURNING id",
            (data['customer_name'], data['customer_email'])
        )
        order_id = cur.fetchone()['id']
        
        # Insert order items
        for item in data['items']:
            # Get current price of product
            cur.execute("SELECT price FROM products WHERE id = %s", (item['product_id'],))
            product = cur.fetchone()
            if not product:
                conn.rollback()
                return jsonify({"error": f"Product with ID {item['product_id']} not found"}), 404
            
            # Insert order item
            cur.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                (order_id, item['product_id'], item['quantity'], product['price'])
            )
        
        conn.commit()
        
        # Sending to RabbitMQ
        try:
            connection = get_rabbitmq_connection()
            channel = connection.channel()
            
            message = {
                "order_id": order_id,
                "customer_name": data['customer_name'],
                "time": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            channel.basic_publish(
                exchange='',
                routing_key='orders',
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2, 
                )
            )
            
            connection.close()
        except Exception as e:
            print(f"RabbitMQ error: {str(e)}")
            # We continue even if RabbitMQ fails, as the order is already in DB
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order_status(order_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get order details
        cur.execute("""
            SELECT o.id, o.customer_name, o.status, o.created_at,
                   json_agg(json_build_object(
                       'product_id', oi.product_id,
                       'product_name', p.name,
                       'quantity', oi.quantity,
                       'unit_price', oi.unit_price
                   )) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = %s
            GROUP BY o.id
        """, (order_id,))
        
        order = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
            
        return jsonify(order), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Wait for RabbitMQ to be ready
    time.sleep(15)
    setup_rabbitmq()
    
    # Starting the Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)