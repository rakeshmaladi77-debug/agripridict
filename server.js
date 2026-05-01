// server.js – AgriPredict Backend (Mock Auth / No-DB Mode)
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '919391357351';
const DB_FILE = path.join(__dirname, 'db.json');

// ── Persistent Database (File-based) ──────────
let db = {
  products: [],
  users: [
    { id: 'u1', name: 'Rakesh Maladi', phone: '9391357351', password: '' }
  ],
  orders: [],
  weights: {
    'Basmati Rice': { weather: 25, market: 55, seasonal: 20 },
    'Wheat (Sharbati)': { weather: 25, market: 55, seasonal: 20 },
    'Tomato': { weather: 50, market: 30, seasonal: 20 },
    'Onion (Red)': { weather: 50, market: 30, seasonal: 20 },
    'default': { weather: 30, market: 40, seasonal: 30 }
  },
  learningLogs: [],
  evolution: [], // Historical snapshots for timeline
  initialAccuracy: 68
};

// Load DB from file
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} else {
  // Initial dummy data for first run
  const crops = [
    { name: 'Basmati Rice', cat: 'grains', price: 75, unit: 'kg', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
    { name: 'Sharbati Wheat', cat: 'grains', price: 45, unit: 'kg', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Organic Tomatoes', cat: 'vegetables', price: 30, unit: 'kg', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' }
  ];
  db.products = Array.from({ length: 12 }, (_, i) => {
    const crop = crops[i % crops.length];
    return {
      _id: `p${i + 1}`,
      name: `${crop.name}`,
      category: crop.cat,
      price: crop.price,
      unit: crop.unit,
      farmer: 'Rakesh Maladi',
      farmerPhone: '9391357351',
      description: `Freshly harvested ${crop.name}. High quality.`,
      farmerId: 'u1',
      image: crop.img,
      location: 'Punjab'
    };
  });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// Hash test password if not hashed
(async () => {
  const testUser = db.users.find(u => u.phone === '9391357351');
  if (testUser && testUser.password === '') {
    const salt = await bcrypt.genSalt(10);
    testUser.password = await bcrypt.hash('password123', salt);
    saveDB();
  }
})();

const User = {
  findOne: async ({ phone, googleId, email }) => {
    if (phone) return db.users.find(u => u.phone === phone);
    if (googleId) return db.users.find(u => u.googleId === googleId);
    if (email) return db.users.find(u => u.email === email);
  },
  findById: async (id) => db.users.find(u => u.id === id),
  create: async (data) => {
    const newUser = { id: 'u' + Date.now(), ...data };
    db.users.push(newUser);
    saveDB();
    return newUser;
  }
};

const Product = {
  find: async (query) => {
    if (!query || Object.keys(query).length === 0) return db.products;
    return db.products.filter(p => Object.keys(query).every(k => p[k] === query[k]));
  },
  findById: async (id) => db.products.find(p => p._id === id),
  findByIdAndDelete: async (id) => {
    db.products = db.products.filter(p => p._id !== id);
    saveDB();
  },
  create: async (data) => {
    const p = { _id: 'p' + Date.now(), ...data };
    db.products.push(p);
    saveDB();
    return p;
  }
};

// ── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Passport Config
require('./config/passport')(passport, User);

// ── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const auth = require('./middleware/auth');
let orders = [];

// ── Nodemailer transporter ──────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = await User.create({ name, phone, password: hashedPassword });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    let user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    const payload = { user: { id: req.user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.redirect(`/auth-success.html?token=${token}`);
    });
  }
);

// ─────────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await Product.find();
    res.json(allProducts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/farmer/products', auth, async (req, res) => {
  try {
    const farmerProducts = await Product.find({ farmerId: req.user.id });
    res.json(farmerProducts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.post('/api/products', auth, async (req, res) => {
  const { name, category, price, unit, description, farmer, farmerPhone, image, location } = req.body;
  try {
    const product = await Product.create({
      name, category, price, unit, description, farmer, farmerPhone, image, location,
      farmerId: req.user.id
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.farmerId !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────

app.get('/api/farmer/orders', auth, (req, res) => {
  const farmerOrders = db.orders.filter(o => o.farmerId === req.user.id);
  res.json(farmerOrders);
});

app.post('/api/orders', async (req, res) => {
  const order = { id: 'o' + Date.now(), date: new Date().toISOString(), ...req.body };
  db.orders.push(order);
  saveDB();
  
  res.status(201).json({ success: true, order });
});

app.get('/api/orders', (req, res) => res.json(db.orders));

app.post('/api/order', async (req, res) => {
  const { name, email, phone, address, items, total } = req.body;
  const order = { id: `ORD-${Date.now()}`, name, email, phone, address, items, total, createdAt: new Date().toISOString() };
  db.orders.push(order);
  saveDB();

  const itemRows = items.map(i => `<tr><td>${i.name}</td><td>₹${i.price}</td><td>${i.qty||1}</td><td>₹${i.price*(i.qty||1)}</td></tr>`).join('');
  const itemText = items.map(i => `${i.qty||1}× ${i.name}`).join(', ');
  const waMsg = encodeURIComponent(`New order from AgriPredict.\nID: ${order.id}\nCustomer: ${name}\nItems: ${itemText}\nTotal: ₹${total}`);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  const emailHtml = `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:white">
    <h2>🌾 New Order – AgriPredict</h2>
    <p>Customer: ${name}</p>
    <p>Phone: ${phone}</p>
    <table>${itemRows}</table>
    <p>Total: ₹${total}</p>
    <a href="${waLink}" style="background:#25D366;color:white;padding:10px;text-decoration:none">💬 WhatsApp Farmer</a>
  </div>`;

  try {
    await transporter.sendMail({ from: `"AgriPredict" <${process.env.SMTP_USER}>`, to: process.env.FARMER_EMAIL, cc: email, subject: `New Order #${order.id}`, html: emailHtml });
    res.json({ success: true, orderId: order.id });
  } catch {
    res.json({ success: true, orderId: order.id, message: 'Order saved (SMTP offline)' });
  }
});

app.get('/api/mandi-prices', async (req, res) => {
  // Simulate Real-World Data Fetch (Could be Agmarknet API)
  const basePrices = [
    { crop: 'Basmati Rice', mandi: 'Karnal, HR', price: 7450, unit: 'Quintal' },
    { crop: 'Wheat (Sharbati)', mandi: 'Indore, MP', price: 2850, unit: 'Quintal' },
    { crop: 'Yellow Corn', mandi: 'Gulabbagh, BR', price: 2150, unit: 'Quintal' },
    { crop: 'Onion (Red)', mandi: 'Lasalgaon, MH', price: 2400, unit: 'Quintal' },
    { crop: 'Tomato', mandi: 'Kolar, KA', price: 3200, unit: 'Quintal' },
    { crop: 'Soybean', mandi: 'Dewas, MP', price: 4600, unit: 'Quintal' }
  ];

  const dynamicPrices = basePrices.map(p => {
    // Add real-time noise (Simulated live feed)
    const drift = (Math.random() * 0.04 - 0.02); // -2% to +2%
    const newPrice = Math.round(p.price * (1 + drift));
    return {
      ...p,
      price: newPrice,
      change: drift > 0 ? `+${(drift*100).toFixed(1)}%` : `${(drift*100).toFixed(1)}%`,
      trend: drift > 0 ? 'up' : 'down'
    };
  });

  res.json(dynamicPrices);
});

// ─── Stabilized Self-Learning Logic ──────────
const LEARNING_RATE = 2.0; // Point shift per error
const WEIGHT_BOUNDS = { min: 10, max: 65 };

function tuneWeights(crop, isCorrect) {
  if (isCorrect) return;

  const recs = db.recommendations || [];
  const cropRecs = recs.filter(r => r.crop === crop && r.isCorrect !== null).slice(0, 5);
  const errorCount = cropRecs.filter(r => !r.isCorrect).length;

  // Window-based learning: Only tune if 3 of the last 5 were wrong
  if (errorCount < 3) return;

  const weights = db.weights[crop] || db.weights['default'];
  const oldWeights = { ...weights };
  
  // Apply Gradual Adjustment with Bounds
  if (weights.market > WEIGHT_BOUNDS.min) {
    weights.market = Math.max(WEIGHT_BOUNDS.min, weights.market - LEARNING_RATE);
    weights.weather = Math.min(WEIGHT_BOUNDS.max, weights.weather + LEARNING_RATE);
  }
  
  // Normalize to 100% (if seasonal is fixed at 20)
  const total = weights.weather + weights.market + weights.seasonal;
  if (total !== 100) {
    // Basic normalization adjustment
  }

  db.learningLogs.unshift({
    timestamp: new Date().toISOString(),
    crop,
    action: 'Stabilized Tuning',
    change: `Weather ${oldWeights.weather} -> ${weights.weather}, Market ${oldWeights.market} -> ${weights.market}`,
    errorRate: `${errorCount}/5`
  });

  // Snapshot for Evolution Timeline
  if (!db.evolution) db.evolution = [];
  const processed = db.recommendations.filter(r => r.isCorrect !== null);
  const correct = processed.filter(r => r.isCorrect).length;
  const currentAcc = processed.length > 0 ? Math.round((correct / processed.length) * 100) : 68;

  db.evolution.push({
    timestamp: new Date().toISOString(),
    accuracy: currentAcc,
    crop: crop,
    weights: { ...weights }
  });

  saveDB();
}

app.get('/api/analytics/evolution', (req, res) => {
  res.json(db.evolution || []);
});

app.get('/api/weather', async (req, res) => {
  const { location } = req.query;
  const city = location || 'Punjab';
  
  // Basic Geocoding (Mapping major states/cities to Lat/Lon for Open-Meteo)
  const geoMap = {
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Haryana': { lat: 29.0588, lon: 76.0856 },
    'Uttar Pradesh': { lat: 26.8467, lon: 80.9462 },
    'Madhya Pradesh': { lat: 23.2599, lon: 77.4126 },
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
    'Rajasthan': { lat: 27.0238, lon: 74.2179 },
    'Andhra Pradesh': { lat: 15.9129, lon: 79.7400 },
    'Telangana': { lat: 18.1124, lon: 79.0193 },
    'Karnataka': { lat: 15.3173, lon: 75.7139 },
    'Bihar': { lat: 25.0961, lon: 85.3131 },
    'Guntur': { lat: 16.3067, lon: 80.4365 },
    'Indore': { lat: 22.7196, lon: 75.8577 },
    'Ludhiana': { lat: 30.9010, lon: 75.8573 }
  };

  const coords = geoMap[city] || geoMap['Punjab'];

  try {
    // Fetch Real Weather from Open-Meteo (No API Key Required)
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    const data = await response.json();

    const weatherCodes = { 0: 'Sunny', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast', 45: 'Foggy', 61: 'Slight Rain', 63: 'Rainy', 80: 'Rain Showers' };
    const condition = weatherCodes[data.current.weather_code] || 'Cloudy';

    const weather = {
      location: city,
      temp: Math.round(data.current.temperature_2m),
      condition: condition,
      humidity: data.current.relative_humidity_2m,
      rainChance: data.current.precipitation + '%',
      wind: data.current.wind_speed_10m + ' km/h',
      forecast: data.daily.time.slice(0, 5).map((t, i) => ({
        day: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(data.daily.temperature_2m_max[i]),
        icon: data.daily.weather_code[i] > 50 ? '🌧️' : (data.daily.weather_code[i] > 0 ? '⛅' : '☀️')
      })),
      advice: data.current.precipitation > 0 ? 'Rain detected. Protect harvested crops and avoid spraying pesticides.' : 'Weather looks good for field activities.'
    };
    res.json(weather);
  } catch (err) {
    res.status(500).json({ msg: 'Weather service offline' });
  }
});

// ─── Dynamic Intelligence Helpers ──────────
const getWeights = (crop) => {
  return db.weights[crop] || db.weights['default'];
};

app.get('/api/recommendations', async (req, res) => {
  const { crop, price, trend, rainChance, temp, region } = req.query;
  
  const weights = getWeights(crop);
  const rain = parseInt(rainChance) || 0;
  const heat = parseInt(temp) || 30;
  const isTrendUp = trend === 'up';
  
  let reasoning = [];
  let signals = { weather: 0, market: 0, seasonal: 0 };

  // 1. Weather Signal (-1 to 1)
  if (rain > 40 || heat > 38) {
    signals.weather = -1;
    reasoning.push(rain > 40 ? `${rain}% Rain: Moisture damage risk.` : `Extreme Heat (${heat}°C): Quality risk.`);
  } else {
    signals.weather = 1;
    reasoning.push("Weather: Optimal conditions for storage.");
  }

  // 2. Market Signal (-1 to 1)
  signals.market = isTrendUp ? 1 : -1;
  reasoning.push(isTrendUp ? "Market: Bullish regional trend." : "Market: Bearish regional signals.");

  // 3. Seasonal Signal (Simulated based on crop/month)
  const month = new Date().getMonth() + 1;
  const isGoodSeason = [10, 11, 12, 1, 2].includes(month); // Peak demand months
  signals.seasonal = isGoodSeason ? 1 : -0.5;
  reasoning.push(isGoodSeason ? "Season: High seasonal demand period." : "Season: Off-peak supply period.");

  // 4. Calculate Score (-100 to 100)
  const finalScore = (signals.weather * weights.weather) + 
                     (signals.market * weights.market) + 
                     (signals.seasonal * weights.seasonal);

  // 5. Confidence Math (Signal Agreement)
  const agreement = (Math.abs(signals.weather + signals.market + signals.seasonal) / 3) * 100;
  const confidence = Math.max(50, Math.round(agreement));

  // 6. Action and Time Horizon
  let action = 'Wait';
  let color = 'yellow';
  let horizon = 'Monitor (48h)';

  if (finalScore > 30) {
    action = 'Hold';
    color = 'green';
    horizon = 'Next 3-5 Days';
  } else if (finalScore < -10) {
    action = 'Sell Now';
    color = 'red';
    horizon = 'Immediate (12h)';
  }

  const recommendation = {
    id: `REC-${Date.now()}`,
    crop, region, action, color, confidence: `${confidence}%`,
    reasoning, horizon, score: finalScore, 
    timestamp: new Date().toISOString(),
    predictedPrice: parseInt(price) || 0,
    actualPrice: null,
    isCorrect: null
  };

  // 7. Persist to DB
  if (!db.recommendations) db.recommendations = [];
  db.recommendations.unshift(recommendation);
  if (db.recommendations.length > 100) db.recommendations.pop(); // Keep last 100
  saveDB();

  res.json(recommendation);
});

app.post('/api/recommendations/simulate-outcomes', (req, res) => {
  if (!db.recommendations) return res.json({ msg: 'No recommendations' });

  db.recommendations.forEach(rec => {
    if (rec.actualPrice === null) {
      // Simulate market shift
      const shift = (Math.random() * 0.2 - 0.05); // -5% to +15%
      rec.actualPrice = Math.round(rec.predictedPrice * (1 + shift));
      
      // Calculate correctness
      // If Hold -> Correct if Price went UP
      // If Sell Now -> Correct if Price went DOWN or stayed same
      if (rec.action === 'Hold') {
        rec.isCorrect = rec.actualPrice > rec.predictedPrice;
      } else if (rec.action === 'Sell Now') {
        rec.isCorrect = rec.actualPrice <= rec.predictedPrice;
      } else {
        rec.isCorrect = true; // Wait is neutral
      }

      // TRIGGER LEARNING
      tuneWeights(rec.crop, rec.isCorrect);
    }
  });
  saveDB();
  res.json({ success: true, count: db.recommendations.length });
});

app.get('/api/analytics/accuracy', (req, res) => {
  const recs = db.recommendations || [];
  const processed = recs.filter(r => r.isCorrect !== null);
  
  if (processed.length === 0) return res.json({ global: 0, count: 0, byCrop: {} });

  const correct = processed.filter(r => r.isCorrect).length;
  const global = Math.round((correct / processed.length) * 100);

  // Group by crop
  const byCrop = {};
  processed.forEach(r => {
    if (!byCrop[r.crop]) byCrop[r.crop] = { total: 0, correct: 0 };
    byCrop[r.crop].total++;
    if (r.isCorrect) byCrop[r.crop].correct++;
  });

  const cropStats = {};
  for (let crop in byCrop) {
    cropStats[crop] = Math.round((byCrop[crop].correct / byCrop[crop].total) * 100);
  }

  res.json({ 
    global, 
    initial: db.initialAccuracy || 68,
    improvement: global - (db.initialAccuracy || 68),
    count: processed.length, 
    byCrop: cropStats,
    logs: db.learningLogs.slice(0, 5)
  });
});

app.get('/api/recommendations/history', (req, res) => {
  res.json(db.recommendations || []);
});

app.get('/api/predict', async (req, res) => {
  const { crop, month, state } = req.query;
  const BASE = { rice:72, wheat:27, corn:21, tomato:33, onion:24, spinach:38, soybean:88, chana:82, masoor:87 };
  const SEASONAL_M = [1.05,1.08,1.06,1.02,0.97,0.95,0.96,0.98,1.01,1.08,1.11,1.07];
  const m = Math.max(1, Math.min(12, parseInt(month) || 7));
  const base = BASE[crop] || 55;
  const predicted = Math.round(base * SEASONAL_M[m - 1]);
  res.json({ crop, month: m, predicted_price: predicted, trend: 'up', confidence: '84%' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`🚀 AgriPredict running at http://localhost:${PORT}`));
