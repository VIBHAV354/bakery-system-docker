const API_URL = 'http://localhost:5000/api';


const productsContainer = document.getElementById('products-container');
const orderItemsContainer = document.getElementById('order-items');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');
const statusForm = document.getElementById('status-form');
const statusResult = document.getElementById('status-result');


let products = [];
let cart = [];

// Fetch all products
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        products = await response.json();
        renderProducts();
        renderOrderItems();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = `
            <div class="error">
                Failed to load products. Please try again later.
            </div>
        `;
    }
}

// Listing products in the products section
function renderProducts() {
    if (products.length === 0) {
        productsContainer.innerHTML = '<p>No products available</p>';
        return;
    }
    
    productsContainer.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.name}
            </div>
            <div class="product-details">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <p class="product-description">${product.description}</p>
                <button class="btn" onclick="addToCart(${product.id})">Add to Order</button>
            </div>
        </div>
    `).join('');
}

// Listing order items in the order form
function renderOrderItems() {
    if (products.length === 0) {
        orderItemsContainer.innerHTML = '<p>No products available</p>';
        return;
    }
    
    orderItemsContainer.innerHTML = products.map(product => `
        <div class="order-item">
            <div class="order-item-details">
                <div class="order-item-title">${product.name}</div>
                <div class="order-item-price">$${product.price}</div>
            </div>
            <div class="order-item-quantity">
                <label for="qty-${product.id}">Qty:</label>
                <input 
                    type="number" 
                    id="qty-${product.id}" 
                    min="0" 
                    value="0" 
                    onchange="updateCart(${product.id}, this.value)"
                >
            </div>
        </div>
    `).join('');
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            product_id: productId,
            quantity: 1
        });
    }
    
    // Update quantity input
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (qtyInput) {
        qtyInput.value = cart.find(item => item.product_id === productId)?.quantity || 0;
    }
    
    alert(`Added ${product.name} to your order`);
}

// Update cart when quantity changes
function updateCart(productId, quantity) {
    quantity = parseInt(quantity);
    
    if (quantity > 0) {
        const existingItem = cart.find(item => item.product_id === productId);
        if (existingItem) {
            existingItem.quantity = quantity;
        } else {
            cart.push({
                product_id: productId,
                quantity: quantity
            });
        }
    } else {
        // Remove item if quantity is 0
        cart = cart.filter(item => item.product_id !== productId);
    }
}

// Submit order
async function submitOrder(event) {
    event.preventDefault();
    
    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    
    // Filter out items with quantity 0
    const items = cart.filter(item => item.quantity > 0);
    
    if (items.length === 0) {
        orderMessage.innerHTML = `
            <div class="status-error">
                Please add at least one item to your order.
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_name: customerName,
                customer_email: customerEmail,
                items: items
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to place order');
        }
        
        // Clear form and cart
        orderForm.reset();
        cart = [];
        
        // Reset quantity inputs
        items.forEach(item => {
            const qtyInput = document.getElementById(`qty-${item.product_id}`);
            if (qtyInput) {
                qtyInput.value = 0;
            }
        });
        
        orderMessage.innerHTML = `
            <div class="status-success">
                Order placed successfully! Your order ID is: <strong>${data.order_id}</strong>
            </div>
        `;
    } catch (error) {
        console.error('Error placing order:', error);
        orderMessage.innerHTML = `
            <div class="status-error">
                ${error.message || 'An error occurred while placing your order. Please try again.'}
            </div>
        `;
    }
}

// Check order status
async function checkOrderStatus(event) {
    event.preventDefault();
    
    const orderId = document.getElementById('order-id').value;
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get order status');
        }
        
        // Format date
        const orderDate = new Date(data.created_at);
        const formattedDate = orderDate.toLocaleString();
        
        // Set status badge class
        let statusClass = 'status-pending';
        if (data.status === 'processing') {
            statusClass = 'status-processing';
        } else if (data.status === 'completed') {
            statusClass = 'status-completed';
        }
        
        // Calculate total
        let total = 0;
        data.items.forEach(item => {
            total += item.quantity * item.unit_price;
        });
        
        statusResult.innerHTML = `
            <div class="order-details">
                <h3>Order #${data.id}</h3>
                
                <div class="order-details-row">
                    <span>Customer:</span>
                    <span>${data.customer_name}</span>
                </div>
                
                <div class="order-details-row">
                    <span>Order Date:</span>
                    <span>${formattedDate}</span>
                </div>
                
                <div class="order-details-row">
                    <span>Status:</span>
                    <span class="status-badge ${statusClass}">${data.status}</span>
                </div>
                
                <h4>Items:</h4>
                <div class="order-details-items">
                    ${data.items.map(item => `
                        <div class="order-item-detail">
                            <span>${item.product_name} x ${item.quantity}</span>
                            <span>$${(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-details-row" style="font-weight: bold; margin-top: 15px;">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error checking order status:', error);
        statusResult.innerHTML = `
            <div class="status-error">
                ${error.message || 'An error occurred while checking your order status. Please try again.'}
            </div>
        `;
    }
}

// Event Listeners
orderForm.addEventListener('submit', submitOrder);
statusForm.addEventListener('submit', checkOrderStatus);

// Initializing
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});