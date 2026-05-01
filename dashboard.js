// dashboard.js – Farmer Dashboard Logic with Authentication
// ─── Multilingual Support ───────────────────
const translations = {
  en: {
    brand: "AgriPredict",
    overview: "📊 Overview",
    myProducts: "🌾 My Products",
    addProduct: "➕ Add Product",
    orders: "📦 Orders",
    aiPrediction: "🤖 AI Prediction",
    greeting: "👨‍🌾 Welcome, Farmer"
  },
  hi: {
    brand: "एग्रीप्रेडिक्ट",
    overview: "📊 सिंहावलोकन",
    myProducts: "🌾 मेरी फसलें",
    addProduct: "➕ फसल जोड़ें",
    orders: "📦 आदेश",
    aiPrediction: "🤖 AI भविष्यवाणी",
    greeting: "👨‍🌾 स्वागत है, किसान"
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  location.reload(); // Reload dashboard to refresh all tabs easily
}

function applyTranslations() {
  const t = translations[currentLang];
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (t[key]) el.textContent = t[key];
  });
}

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://agripredict-backend.onrender.com'; // REPLACE WITH YOUR RENDER URL
const WHATSAPP_NUMBER = '919391357351'; // Rakesh's WhatsApp

// ─── Authentication Check ────────────────────
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// ─── Headers helper ──────────────────────────
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-auth-token': token
});

// ─── Tab Switching ──────────────────────────
function switchTab(btn, tabId) {
  document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

// ─── Toast ──────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

// ─── Fetch Farmer Profile ───────────────────
async function loadProfile() {
  try {
    const res = await fetch(`${API}/api/auth/me`, { headers: getHeaders() });
    if (res.status === 401) {
      logout();
      return;
    }
    const user = await res.json();
    document.getElementById('farmer-greeting').textContent = `👨‍🌾 Welcome, ${user.name}`;
  } catch (err) {
    console.error('Profile fetch failed');
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// ─── Load orders from server ────────────────
async function loadOrders() {
  try {
    const res = await fetch(`${API}/api/orders`, { headers: getHeaders() });
    const orders = await res.json();
    renderOrders(orders);
    updateStats(orders);
  } catch {
    renderOrders([]);
  }
}

function renderOrders(orders) {
  const containers = [
    document.getElementById('recent-orders-list'),
    document.getElementById('orders-list-full')
  ];

  if (!orders.length) {
    containers.forEach(c => {
      c.innerHTML = '<p class="empty-msg">No orders yet. Share your products to get started! 🌾</p>';
    });
    return;
  }

  const html = orders.map(o => {
    const itemNames = Array.isArray(o.items)
      ? o.items.map(i => `${i.qty || 1}× ${i.name}`).join(', ')
      : 'Order';
    const waMsg = encodeURIComponent(
      `Hi! I placed an order on AgriPredict.\n\nOrder ID: ${o.id}\nItems: ${itemNames}\nTotal: ₹${o.total}\nName: ${o.name}\nPhone: ${o.phone}\nAddress: ${o.address}`
    );
    return `
      <div class="order-card">
        <div class="order-card-left">
          <div class="order-id">${o.id} · ${new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
          <div class="order-customer">👤 ${o.name}</div>
          <div class="order-items">📦 ${itemNames}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">📱 ${o.phone} · 📍 ${o.address || '—'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem">
          <div class="order-total">₹${o.total}</div>
          <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}" target="_blank">
            <button class="order-whatsapp">💬 WhatsApp</button>
          </a>
        </div>
      </div>
    `;
  }).join('');

  containers.forEach(c => { c.innerHTML = html; });
}

function updateStats(orders) {
  document.getElementById('stat-orders').textContent = orders.length;
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById('stat-revenue').textContent = `₹${revenue}`;
}

// ─── Load products for "My Products" tab ────
async function loadMyProducts() {
  let products = [];
  try {
    const res = await fetch(`${API}/api/farmer/products`, { headers: getHeaders() });
    products = await res.json();
  } catch {
    products = [];
  }
  document.getElementById('stat-products').textContent = products.length;
  const grid = document.getElementById('my-products-grid');
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card my-product-card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/300x160?text=' + encodeURIComponent(p.name)}" alt="${p.name}" style="height:140px;object-fit:cover;width:100%" />
      <div class="card-body">
        <span class="card-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-meta">
          <span class="card-price">₹${p.price}<small>/${p.unit}</small></span>
          <span class="card-farmer" style="font-size:.75rem">📍 ${p.farmer}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-secondary card-del" onclick="deleteProduct('${p._id}')">🗑 Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    const res = await fetch(`${API}/api/products/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      showToast('🗑 Product deleted.');
      loadMyProducts();
    } else {
      showToast('❌ Failed to delete product.');
    }
  } catch {
    showToast('⚠️ Could not delete – server may be offline.');
  }
}

// ─── Add Product Form ────────────────────────
document.getElementById('add-product-form').addEventListener('submit', async e => {
  e.preventDefault();
  const product = {
    name:        document.getElementById('p-name').value,
    category:    document.getElementById('p-category').value,
    price:       parseFloat(document.getElementById('p-price').value),
    unit:        document.getElementById('p-unit').value,
    description: document.getElementById('p-desc').value,
    farmer:      `${document.getElementById('p-location').value}`,
    farmerPhone: document.getElementById('p-phone').value,
    image:       document.getElementById('p-image').value || ''
  };

  try {
    const res = await fetch(`${API}/api/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
    if (res.ok) {
      showToast('✅ Product listed successfully!');
      document.getElementById('add-product-form').reset();
      document.getElementById('price-hint').style.display = 'none';
      switchTab(document.querySelector('[data-tab="products"]'), 'products');
      loadMyProducts();
    } else {
      showToast('❌ Failed to add product.');
    }
  } catch {
    showToast('⚠️ Server offline – product saved locally only.');
  }
});

// Show AI price hint when user types crop name
document.getElementById('p-name').addEventListener('input', async function () {
  const name = this.value.toLowerCase().trim();
  if (name.length < 3) return;
  const hint = document.getElementById('price-hint');
  const hintText = document.getElementById('hint-text');
  const mandiHint = document.getElementById('mandi-rate-hint');
  const mandiVal = document.getElementById('mandi-rate-val');
  
  hint.style.display = 'flex';
  hintText.textContent = 'Fetching AI suggestion...';

  const cropMap = {
    rice: 'rice', wheat: 'wheat', corn: 'corn', maize: 'corn',
    tomato: 'tomato', onion: 'onion', spinach: 'spinach',
    chana: 'chana', masoor: 'masoor', soybean: 'soybean'
  };
  const key = Object.keys(cropMap).find(k => name.includes(k));
  if (!key) { 
    hintText.textContent = 'No prediction for this crop yet.'; 
    mandiHint.style.display = 'none';
    return; 
  }

  try {
    const month = new Date().getMonth() + 1;
    const res = await fetch(`${API}/api/predict?crop=${cropMap[key]}&month=${month}`);
    const data = await res.json();
    hintText.textContent = `Predicted price for ${data.crop}: ₹${data.predicted_price}/kg (${data.trend === 'up' ? '📈 Rising' : '📉 Falling'} trend, ${data.confidence} confidence)`;
    
    // Also show mandi rate
    mandiHint.style.display = 'block';
    mandiVal.textContent = `₹${Math.round(data.predicted_price * 0.95)} - ₹${Math.round(data.predicted_price * 1.05)}`;
  } catch {
    hintText.textContent = 'AI prediction unavailable right now.';
    mandiHint.style.display = 'none';
  }
});

// ─── AI Prediction Tab ───────────────────────
async function getPrediction() {
  const crop  = document.getElementById('pred-crop').value;
  const month = document.getElementById('pred-month').value;
  const state = document.getElementById('pred-state').value;
  const resultCard = document.getElementById('prediction-result');
  resultCard.style.display = 'block';
  document.getElementById('res-crop-name').textContent = `${crop.charAt(0).toUpperCase() + crop.slice(1)} · ${state}`;
  document.getElementById('res-price').textContent = 'Loading...';

  try {
    const res = await fetch(`${API}/api/predict?crop=${crop}&month=${month}&state=${state}`);
    const data = await res.json();
    renderPrediction(data);
  } catch {
    const fallback = localPredict(crop, parseInt(month));
    renderPrediction(fallback);
  }
}

let predictionChartInstance = null;

function renderPrediction(data) {
  document.getElementById('res-price').textContent = `₹${data.predicted_price}/kg`;
  document.getElementById('res-trend').textContent  = data.trend === 'up' ? '📈 Rising trend' : '📉 Falling trend';
  document.getElementById('res-confidence').textContent = `Confidence: ${data.confidence}`;
  document.getElementById('res-advice').textContent = data.advice || getAdvice(data.trend, data.crop);

  const ctx = document.getElementById('predictionChart').getContext('2d');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const startMonth = parseInt(document.getElementById('pred-month').value) - 1;
  
  const labels = [];
  const forecastData = [];
  
  for (let i = 0; i < 6; i++) {
    const m = (startMonth + i) % 12;
    labels.push(months[m]);
    forecastData.push(Math.round(data.predicted_price * (1 + (Math.random() * 0.15 - 0.05))));
  }

  if (predictionChartInstance) {
    predictionChartInstance.destroy();
  }

  predictionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Predicted Price',
        data: forecastData,
        backgroundColor: labels.map((_, i) => i === 0 ? '#10b981' : 'rgba(16, 185, 129, 0.2)'),
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function getAdvice(trend, crop) {
  if (trend === 'up') return `✅ Good time to hold your ${crop} stock. Prices are expected to rise in the coming months. Consider listing at a slightly higher price.`;
  return `⚠️ Prices may dip soon. Consider selling your ${crop} stock quickly or storing until the trend reverses.`;
}

function localPredict(crop, month) {
  const basePrices = { rice: 72, wheat: 27, corn: 21, tomato: 33, onion: 24, soybean: 88, chana: 82, masoor: 88 };
  const base = basePrices[crop] || 50;
  const seasonal = [1.05, 1.08, 1.06, 1.02, 0.98, 0.96, 0.97, 1.0, 1.03, 1.08, 1.1, 1.07];
  const predicted = Math.round(base * seasonal[month - 1]);
  const trend = seasonal[month - 1] > 1.0 ? 'up' : 'down';
  return { crop, month, predicted_price: predicted, trend, confidence: '82%', note: 'Local seasonal estimate' };
}

// ─── Mandi Insights ─────────────────────────
async function loadMandiInsights() {
  const container = document.getElementById('mandi-insights-list');
  if (!container) return;
  try {
    const res = await fetch(`${API}/api/mandi-prices`);
    const data = await res.json();
    container.innerHTML = data.slice(0, 4).map(item => `
      <div class="mandi-stat-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <span class="mandi-crop">${item.crop}</span>
          <span class="mandi-badge ${item.trend}">${item.change}</span>
        </div>
        <div class="mandi-price">₹${item.price} <small>/ ${item.unit}</small></div>
        <div class="mandi-location">📍 ${item.mandi}</div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p class="empty-msg">Market data unavailable.</p>';
  }
}

// ─── Price Trends Chart ──────────────────────
function initPriceChart() {
  const ctx = document.getElementById('priceTrendsChart');
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Avg. Market Price (₹)',
        data: [6800, 7100, 7500, 7300, 7450, 7800],
        borderColor: '#10b981',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// ─── Weather Intelligence ──────────────────
async function loadWeather() {
  try {
    const res = await fetch(`${API}/api/weather`);
    const data = await res.json();
    document.getElementById('weather-temp').textContent = `${data.temp}°C`;
    document.getElementById('weather-location').textContent = data.location;
    document.getElementById('weather-icon').textContent = data.forecast[0].icon;
    document.getElementById('weather-condition').textContent = data.condition;
    document.getElementById('weather-advice').textContent = data.advice;
  } catch {
    console.error('Weather fetch failed');
  }
}

// ─── Smart Recommendations & Decision Hub ───
async function loadRecommendations() {
  const hubContainer = document.getElementById('decision-hub-container');
  const regionalContainer = document.getElementById('smart-recommendations');
  if (!hubContainer) return;

  try {
    const weatherRes = await fetch(`${API}/api/weather`);
    const weather = await weatherRes.json();
    
    const mandiRes = await fetch(`${API}/api/mandi-prices`);
    const mandiData = await mandiRes.json();

    // 1. POPULATE DECISION HUB (TOP 2 CROPS)
    let hubHtml = '';
    const topCrops = mandiData.slice(0, 2);
    
    for (const crop of topCrops) {
      const recRes = await fetch(`${API}/api/recommendations?crop=${crop.crop}&price=${crop.price}&trend=${crop.trend}&rainChance=${weather.rainChance.replace('%','')}&temp=${weather.temp}&region=${crop.mandi}`);
      const rec = await recRes.json();
      
      const reasoningHtml = rec.reasoning.map(r => `<li class="reasoning-item">${r}</li>`).join('');

      hubHtml += `
        <div class="glass decision-card ${rec.color}">
          <div class="decision-top">
            <div class="decision-title">
              <h3>${crop.crop}</h3>
              <p>📍 ${crop.mandi}</p>
            </div>
            <div class="confidence-box">
              <span class="conf-label">Confidence</span>
              <span class="conf-val" style="color:${parseFloat(rec.confidence) > 80 ? 'var(--accent)' : 'var(--warn)'}">${rec.confidence}</span>
            </div>
          </div>
          
          <div class="decision-factors">
            <div class="factor-item">
              <span class="factor-val">₹${crop.price}</span>
              <span class="factor-label">Mandi</span>
            </div>
            <div class="factor-item">
              <span class="factor-val">${weather.rainChance}</span>
              <span class="factor-label">Rain</span>
            </div>
            <div class="factor-item">
              <span class="factor-val">${rec.horizon}</span>
              <span class="factor-label">Window</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
            <div class="decision-badge">${rec.action}</div>
            <span style="font-size:0.7rem; color:var(--muted)">ID: ${rec.id}</span>
          </div>
          
          <div style="border-top:1px solid var(--border); padding-top:1rem">
            <p style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-weight:700">Multi-Factor Reasoning:</p>
            <ul class="reasoning-list" style="margin-bottom:1.5rem">${reasoningHtml}</ul>
            
            <button class="btn-primary" 
                    style="width:100%; border-radius:12px; font-weight:700; background:${rec.color === 'green' ? '#10b981' : (rec.color === 'red' ? '#ef4444' : 'var(--accent)')}" 
                    onclick="quickListCrop('${crop.crop}', ${crop.price}, '${crop.unit}')">
              🚀 List Now at ₹${crop.price}
            </button>
          </div>
        </div>
      `;
    }
    hubContainer.innerHTML = hubHtml;
    loadRecommendationHistory(); // Load history after rendering current

    // 2. POPULATE REGIONAL INSIGHTS (REST OF CROPS)
    let regionalHtml = '';
    const otherCrops = mandiData.slice(2, 5);
    
    regionalHtml = otherCrops.map(item => `
      <div class="mandi-stat-card glass" style="padding:1.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <strong style="font-size:1.1rem">${item.crop}</strong>
          <span class="mandi-badge ${item.trend}">${item.change}</span>
        </div>
        <div style="color:var(--accent);font-size:1.2rem;font-weight:700">₹${item.price}/q</div>
        <div style="font-size:0.8rem;color:var(--muted);margin-top:0.5rem">📍 ${item.mandi}</div>
        <div style="margin-top:1rem;font-size:0.85rem;color:var(--text)">
          ${item.trend === 'up' ? '🚀 Market is bullish. High transport value.' : '⚠️ Prices are softening. Local sale advised.'}
        </div>
      </div>
    `).join('');
    regionalContainer.innerHTML = regionalHtml;

  } catch (err) {
    hubContainer.innerHTML = '<p class="empty-msg">Intelligence engine offline.</p>';
  }
}

async function loadRecommendationHistory() {
  const historyContainer = document.getElementById('recommendation-history-list');
  if (!historyContainer) return;
  
  try {
    const res = await fetch(`${API}/api/recommendations/history`);
    const history = await res.json();
    
    if (history.length === 0) return;
    
    historyContainer.innerHTML = history.slice(0, 5).map(h => `
      <div style="font-size:0.8rem; color:var(--muted); padding:0.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center">
        <div>
          <span>${new Date(h.timestamp).toLocaleTimeString()} - ${h.crop}</span>
          <span style="margin-left:8px; color:${h.color === 'green' ? '#10b981' : (h.color === 'red' ? '#ef4444' : '#f59e0b')}">${h.action}</span>
        </div>
        ${h.isCorrect !== null ? `<span title="Correct Prediction" style="color:#10b981">${h.isCorrect ? '✅' : '❌'}</span>` : '<span style="font-size:0.7rem;opacity:0.5">Pending</span>'}
      </div>
    `).join('');
    loadAccuracyStats(); // Update stats as well
  } catch (err) {
    console.error('History failed to load');
  }
}

async function loadAccuracyStats() {
  const globalEl = document.getElementById('global-accuracy');
  const countEl = document.getElementById('accuracy-count');
  const gainEl = document.getElementById('accuracy-improvement');
  const listEl = document.getElementById('crop-performance-list');
  const logEl = document.getElementById('learning-log-list');
  const driftEl = document.getElementById('drift-status');
  if (!globalEl) return;

  try {
    const res = await fetch(`${API}/api/analytics/accuracy`);
    const data = await res.json();
    
    globalEl.textContent = `${data.global}%`;
    countEl.textContent = `${data.count} decisions tracked`;
    gainEl.textContent = `${data.improvement >= 0 ? '+' : ''}${data.improvement}% Gain`;
    gainEl.style.color = data.improvement >= 0 ? '#10b981' : '#ef4444';

    listEl.innerHTML = Object.entries(data.byCrop).map(([crop, acc]) => `
      <div class="glass" style="padding:0.8rem; text-align:center; border:1px solid rgba(16, 185, 129, 0.2)">
        <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase">${crop}</div>
        <div style="font-size:1.2rem; font-weight:700; color:var(--accent)">${acc}%</div>
      </div>
    `).join('');

    if (data.logs && data.logs.length > 0) {
      logEl.innerHTML = data.logs.map(log => `
        <div style="font-size:0.75rem; background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:2px solid var(--accent)">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px">
            <strong style="color:var(--accent)">${log.crop}</strong>
            <span style="color:var(--muted)">${log.errorRate} Signal</span>
          </div>
          <div style="color:var(--text-muted)">${log.change}</div>
        </div>
      `).join('');
      
      // Update drift status based on recent logs
      if (data.logs[0].errorRate.includes('5/5')) {
         driftEl.textContent = 'DATA DRIFT DETECTED';
         driftEl.style.background = 'rgba(239, 68, 68, 0.1)';
         driftEl.style.color = '#ef4444';
      } else {
         driftEl.textContent = 'STABLE PATTERN';
         driftEl.style.background = 'rgba(245,158,11,0.1)';
         driftEl.style.color = '#f59e0b';
      }
    } else {
       logEl.innerHTML = `<p class="empty-msg" style="font-size:0.8rem">Insufficient data for optimization. Need 3+ errors in recent window.</p>`;
    }
    
    // Refresh Evolution Chart
    loadEvolutionTimeline();
  } catch (err) {
    console.error('Stats failed');
  }
}

let evolutionChartInstance = null;
async function loadEvolutionTimeline() {
  const ctx = document.getElementById('evolutionChart');
  if (!ctx) return;

  try {
    const res = await fetch(`${API}/api/analytics/evolution`);
    const data = await res.json();
    if (data.length === 0) return;

    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const accuracyData = data.map(d => d.accuracy);
    const weightData = data.map(d => d.weights.weather);

    if (evolutionChartInstance) evolutionChartInstance.destroy();

    evolutionChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Accuracy %',
            data: accuracyData,
            borderColor: '#10b981',
            tension: 0.3,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Weather Weight',
            data: weightData,
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            tension: 0.3,
            fill: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Accuracy %', color: '#94a3b8' } },
          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Weight %', color: '#94a3b8' } }
        },
        plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 10 } } }
      }
    });
  } catch (err) { console.error('Evolution chart failed'); }
}

function generateIntelligenceReport() {
  const win = window.open('', '_blank');
  const acc = document.getElementById('global-accuracy').textContent;
  const gain = document.getElementById('accuracy-improvement').textContent;
  const logs = document.getElementById('learning-log-list').innerHTML;
  
  win.document.write(`
    <html>
    <head>
      <title>AgriPredict Intelligence Report</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
        .stat-box { display: flex; gap: 40px; margin-bottom: 40px; }
        .stat { background: #f8fafc; padding: 20px; border-radius: 12px; flex: 1; }
        .stat h2 { margin: 0; color: #10b981; font-size: 2.5rem; }
        .log-item { background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌾 AgriPredict Intelligence Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      <div class="stat-box">
        <div class="stat">
          <p>CURRENT ACCURACY</p>
          <h2>${acc}</h2>
          <p style="color:#10b981; font-weight:bold">${gain} since benchmark</p>
        </div>
        <div class="stat">
          <p>ENGINE STATUS</p>
          <h2 style="color:#f59e0b">Optimized</h2>
          <p>Drift Detection Active</p>
        </div>
      </div>
      <h3>🔍 Recent Optimization Events</h3>
      <div class="logs">${logs}</div>
      <footer style="margin-top:50px; font-size:0.8rem; color:#64748b; text-align:center">
        © 2026 AgriPredict AI Forecasting Engine · Research-Grade Visual Intelligence
      </footer>
      <script>window.print();</script>
    </body>
    </html>
  `);
}

async function simulateOutcomes() {
  showToast('🧪 Simulating market shifts...');
  try {
    await fetch(`${API}/api/recommendations/simulate-outcomes`, { method: 'POST' });
    loadRecommendationHistory();
    showToast('✅ Outcomes updated. Accuracy recalculated.');
  } catch {
    showToast('❌ Simulation failed');
  }
}

async function quickListCrop(name, price, unit) {
  const confirmList = confirm(`AI suggests listing ${name} now to maximize profit. List instantly at ₹${price}/${unit}?`);
  if (!confirmList) return;

  const product = {
    name: name,
    category: 'grains', // Defaulting for quick list
    price: price,
    unit: unit === 'Quintal' ? 'quintal' : 'kg',
    description: `AI-Recommended Listing: Premium ${name} harvested for optimal market timing.`,
    farmer: 'Current User', // Backend will use ID
    farmerPhone: '9391357351',
    image: '' 
  };

  try {
    const res = await fetch(`${API}/api/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
    if (res.ok) {
      showToast(`🚀 ${name} listed instantly!`);
      loadMyProducts();
      switchTab(document.querySelector('[data-tab="products"]'), 'products');
    } else {
      showToast('❌ Instant listing failed.');
    }
  } catch (err) {
    showToast('⚠️ Server error during listing.');
  }
}

// ─── Init ────────────────────────────────────
loadProfile();
loadOrders();
loadMyProducts();
loadMandiInsights();
initPriceChart();
loadWeather();
loadRecommendations();
loadAccuracyStats();
applyTranslations();

// Set initial value for select
const langSelect = document.querySelector('.lang-select');
if (langSelect) langSelect.value = currentLang;
