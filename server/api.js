// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const { trace } = require('@opentelemetry/api');


app.use(cors());
app.use(express.json());

// In-memory data store (use a database in production)
let products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    stock: 10
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    stock: 5
  },
  {
    id: 3,
    name: 'Laptop Sleeve',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
    stock: 15
  },
  {
    id: 4,
    name: 'USB-C Cable',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=200&h=200&fit=crop',
    stock: 20
  }
];

// Session-based carts (use Redis or DB in production)
let carts = {};

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get a single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Get cart for a user (using sessionId)
app.get('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const cart = carts[sessionId] || [];
  res.json(cart);
});

// Add item to cart
app.post('/api/cart/:sessionId/add', (req, res) => {

  const tracer = trace.getTracer('cart-service');
  const span = tracer.startSpan('add-item-to-cart');

  const { sessionId } = req.params;
  const { productId, quantity = 1 } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!carts[sessionId]) {
    carts[sessionId] = [];
  }

  const existingItem = carts[sessionId].find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[sessionId].push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity
    });
  }
  span.setAttribute('cart_count', carts[sessionId].length);
  span.end();
  res.json(carts[sessionId]);
});

// Update cart item quantity
app.put('/api/cart/:sessionId/update', (req, res) => {
  const { sessionId } = req.params;
  const { productId, quantity } = req.body;

  if (!carts[sessionId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const item = carts[sessionId].find(item => item.id === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not in cart' });
  }

  if (quantity <= 0) {
    carts[sessionId] = carts[sessionId].filter(item => item.id !== productId);
  } else {
    item.quantity = quantity;
  }

  res.json(carts[sessionId]);
});

// Remove item from cart
app.delete('/api/cart/:sessionId/remove/:productId', (req, res) => {
  const { sessionId, productId } = req.params;

  if (!carts[sessionId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  carts[sessionId] = carts[sessionId].filter(
    item => item.id !== parseInt(productId)
  );

  res.json(carts[sessionId]);
});

// Clear cart
app.delete('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  carts[sessionId] = [];
  res.json({ message: 'Cart cleared' });
});

// Calculate cart totals
app.get('/api/cart/:sessionId/summary', (req, res) => {
  const { sessionId } = req.params;
  const cart = carts[sessionId] || [];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  res.json({
    items: cart.length,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  });
});

// Checkout endpoint
app.post('/api/cart/:sessionId/checkout', async (req, res) => {
  const tracer = trace.getTracer('cart-service');
  const span = tracer.startSpan('checkout');

  const { sessionId } = req.params;
  const cart = carts[sessionId];
  span.setAttribute('cart_count', cart.length);
  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Here you would process payment, create order, etc.
  const orderId = Math.random().toString(36).substring(7).toUpperCase();
  const result = await cartDB(orderId);
  // Clear cart after checkout
  carts[sessionId] = [];
  span.end()
  res.json({
    success: result.success,
    orderId,
    message: 'Order placed successfully'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const cartDB = async (orderId) => {
  const tracer = trace.getTracer('cart-service'); 
  const span = tracer.startSpan('cart-db');
  await new Promise(resolve => setTimeout(resolve, 1000));
  span.setAttribute('status', 'success');
  span.end();
  const result = await paymentProcess(orderId);
  return {
      success: result.success,
      orderId: orderId
    }
}

const paymentProcess = async (orderId) => {
  const tracer = trace.getTracer('cart-service');
  const span = tracer.startSpan('payment-process');
  await new Promise(resolve => setTimeout(resolve, 1000));
    span.setAttribute('status', 'success');
    span.end();
    return {
      success: true,
      orderId: orderId
    }
}
